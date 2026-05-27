"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef } from "react"
import type { ComponentProps } from "react"

type ViewportPrefetchLinkProps = Omit<ComponentProps<typeof Link>, "prefetch"> & {
  rootMargin?: string
}

const prefetchedHrefs = new Set<string>()

export function ViewportPrefetchLink({
  href,
  rootMargin = "350px 0px",
  onMouseEnter,
  onTouchStart,
  ...props
}: ViewportPrefetchLinkProps) {
  const router = useRouter()
  const anchorRef = useRef<HTMLAnchorElement | null>(null)
  const hrefString = typeof href === "string" ? href : null

  const prefetch = useCallback(() => {
    if (!hrefString || prefetchedHrefs.has(hrefString)) return

    prefetchedHrefs.add(hrefString)

    const idle = window.requestIdleCallback
    if (idle) {
      idle(() => router.prefetch(hrefString), { timeout: 1500 })
      return
    }

    window.setTimeout(() => router.prefetch(hrefString), 120)
  }, [hrefString, router])

  useEffect(() => {
    if (!hrefString || prefetchedHrefs.has(hrefString)) return

    const anchor = anchorRef.current
    if (!anchor) return

    if (!("IntersectionObserver" in window)) {
      prefetch()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        prefetch()
      },
      { rootMargin }
    )

    observer.observe(anchor)
    return () => observer.disconnect()
  }, [hrefString, prefetch, rootMargin])

  return (
    <Link
      {...props}
      ref={anchorRef}
      href={href}
      prefetch={false}
      onMouseEnter={(event) => {
        prefetch()
        onMouseEnter?.(event)
      }}
      onTouchStart={(event) => {
        prefetch()
        onTouchStart?.(event)
      }}
    />
  )
}
