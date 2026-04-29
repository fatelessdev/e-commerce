import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSecureCode(prefix: string, length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const maxValid = 256 - (256 % chars.length)
  let result = prefix

  while (result.length < prefix.length + length) {
    const array = new Uint8Array(1)
    crypto.getRandomValues(array)
    if (array[0] < maxValid) {
      result += chars[array[0] % chars.length]
    }
  }

  return result
}
