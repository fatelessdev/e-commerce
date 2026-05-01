import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a cryptographically secure random code.
 * @param prefix An optional string prefix for the code.
 * @param length The length of the random part of the code.
 * @returns The generated code.
 */
export function generateSecureCode(prefix: string, length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = prefix || "";

  // Use crypto API for secure random values
  const array = new Uint32Array(length);
  globalThis.crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    code += chars.charAt(array[i] % chars.length);
  }

  return code;
}
