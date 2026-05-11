import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a cryptographically secure random code
 * @param prefix The prefix for the code (e.g., 'BRG-', 'CREDIT-')
 * @param length The length of the random part of the code
 * @returns The prefixed random code string
 */
export function generateSecureCode(prefix: string, length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const randomValues = new Uint32Array(length);
  globalThis.crypto.getRandomValues(randomValues);

  let code = prefix;
  for (let i = 0; i < length; i++) {
    code += chars[randomValues[i] % chars.length];
  }
  return code;
}
