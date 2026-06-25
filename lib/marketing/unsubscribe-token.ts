import { createHmac, timingSafeEqual } from "crypto";

type UnsubscribePayload = {
  email: string;
  issuedAt: number;
};

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getSecret(explicitSecret?: string) {
  const secret = explicitSecret || process.env.BETTER_AUTH_SECRET || process.env.RESEND_API_KEY;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET or RESEND_API_KEY is required for unsubscribe links");
  }
  return secret;
}

function signPayload(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function createUnsubscribeToken(email: string, secret?: string) {
  const payload: UnsubscribePayload = {
    email: email.trim().toLowerCase(),
    issuedAt: Date.now(),
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload, getSecret(secret));
  return `${encodedPayload}.${signature}`;
}

export function verifyUnsubscribeToken(token: string, secret?: string) {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expected = signPayload(encodedPayload, getSecret(secret));
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(providedBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<UnsubscribePayload>;
    if (typeof payload.email !== "string" || !payload.email.includes("@")) return null;
    return {
      email: payload.email.trim().toLowerCase(),
      issuedAt: typeof payload.issuedAt === "number" ? payload.issuedAt : 0,
    };
  } catch {
    return null;
  }
}
