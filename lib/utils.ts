import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a cryptographically secure random string of the specified length.
 * Uses the Web Crypto API, which is available in Next.js edge and Node environments.
 */
export function generateSecureCode(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const randomArray = new Uint32Array(length);
  crypto.getRandomValues(randomArray);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[randomArray[i] % chars.length];
  }
  return code;
}
