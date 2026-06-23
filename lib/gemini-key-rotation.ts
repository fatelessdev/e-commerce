export function parseGeminiApiKeys(value: string | undefined) {
  return (value || "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
}

function getErrorStatus(error: unknown) {
  if (!error || typeof error !== "object") return undefined;
  const candidate = error as {
    status?: unknown;
    statusCode?: unknown;
    code?: unknown;
  };
  const status = candidate.status ?? candidate.statusCode ?? candidate.code;
  return typeof status === "number" ? status : undefined;
}

export function shouldRetryGeminiEmbeddingError(error: unknown) {
  const status = getErrorStatus(error);
  if (status !== undefined) {
    return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
  }

  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes("rate limit") ||
    message.includes("quota") ||
    message.includes("timeout") ||
    message.includes("temporarily unavailable")
  );
}

export function createGeminiKeyRotator({
  keys,
  maxAttempts = keys.length,
}: {
  keys: string[];
  maxAttempts?: number;
}) {
  const cleanKeys = keys.map((key) => key.trim()).filter(Boolean);
  if (cleanKeys.length === 0) {
    throw new Error("GEMINI_API_KEYS must include at least one server-side Gemini API key");
  }

  let cursor = 0;

  function nextKey() {
    const key = cleanKeys[cursor % cleanKeys.length];
    cursor += 1;
    return key;
  }

  return {
    async run<T>(operation: (apiKey: string) => Promise<T>) {
      let lastError: unknown;
      const attempts = Math.max(1, Math.min(maxAttempts, cleanKeys.length));

      for (let attempt = 0; attempt < attempts; attempt += 1) {
        try {
          return await operation(nextKey());
        } catch (error) {
          lastError = error;
          if (!shouldRetryGeminiEmbeddingError(error) || attempt === attempts - 1) {
            throw error;
          }
        }
      }

      throw lastError;
    },
  };
}
