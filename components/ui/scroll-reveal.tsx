"use client"

import { motion, useReducedMotion } from "framer-motion"
import { type ReactNode } from "react"

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const

interface ScrollRevealProps {
    children: ReactNode
    className?: string
    delay?: number
    direction?: "up" | "down" | "left" | "right" | "none"
    duration?: number
    once?: boolean
    amount?: number
}

export function ScrollReveal({
    children,
    className,
    delay = 0,
    direction = "up",
    duration = 0.7,
    once = true,
    amount = 0.2,
}: ScrollRevealProps) {
    const shouldReduceMotion = useReducedMotion()

    if (shouldReduceMotion) {
        return <div className={className}>{children}</div>
    }

    const directionOffset = {
        up: { y: 48 },
        down: { y: -48 },
        left: { x: 48 },
        right: { x: -48 },
        none: {},
    }

    return (
        <motion.div
            initial={{
                opacity: 0,
                filter: "blur(6px)",
                ...directionOffset[direction],
            }}
            whileInView={{
                opacity: 1,
                filter: "blur(0px)",
                y: 0,
                x: 0,
            }}
            viewport={{ once, amount }}
            transition={{
                duration,
                delay,
                ease: EASE_OUT_EXPO as unknown as number[],
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

interface StaggerContainerProps {
    children: ReactNode
    className?: string
    staggerDelay?: number
    once?: boolean
    amount?: number
}

export function StaggerContainer({
    children,
    className,
    staggerDelay = 0.06,
    once = true,
    amount = 0.15,
}: StaggerContainerProps) {
    const shouldReduceMotion = useReducedMotion()

    if (shouldReduceMotion) {
        return <div className={className}>{children}</div>
    }

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once, amount }}
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        staggerChildren: staggerDelay,
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

export function StaggerItem({
    children,
    className,
}: {
    children: ReactNode
    className?: string
}) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 32, filter: "blur(6px)" },
                visible: {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                    transition: {
                        duration: 0.6,
                        ease: EASE_OUT_EXPO as unknown as number[],
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}
