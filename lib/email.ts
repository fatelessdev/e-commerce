import { Resend, type CreateBatchOptions } from "resend";

let _resend: Resend | null = null;
const DEV_RESEND_FROM = "XILAR <onboarding@resend.dev>";

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

function getFromEmail() {
  const from = process.env.RESEND_FROM_EMAIL;
  if (from) return from;

  if (process.env.NODE_ENV === "production") {
    throw new Error("RESEND_FROM_EMAIL environment variable is required in production");
  }

  return DEV_RESEND_FROM;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendResetPasswordEmail(user: { email: string; name: string }, url: string) {
  const safeName = escapeHtml(user.name || "there");
  await getResend().emails.send({
    from: getFromEmail(),
    to: user.email,
    subject: "Reset your password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>Hi ${safeName},</p>
        <p>We received a request to reset your XILAR account password. Click the button below to set a new password:</p>
        <a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 24px;background:#C62828;color:#fff;text-decoration:none;font-weight:600;">Reset Password</a>
        <p style="margin-top:20px;font-size:13px;color:#666;">If you didn't request this, you can safely ignore this email. The link expires in 1 hour.</p>
      </div>
    `,
  });
}

export type MarketingBatchEmail = {
  to: string;
  subject: string;
  html: string;
  previewText?: string;
};

export async function sendMarketingEmailBatch(messages: MarketingBatchEmail[]) {
  if (messages.length === 0) {
    return { data: [], errors: [] };
  }

  if (messages.length > 100) {
    throw new Error("Resend batch sends support at most 100 emails per request");
  }

  const payload: CreateBatchOptions = messages.map((message) => ({
    from: getFromEmail(),
    to: [message.to],
    subject: message.subject,
    html: message.html,
    text: message.previewText,
  }));

  const { data, error } = await getResend().batch.send(payload, {
    batchValidation: "permissive",
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    data: data?.data ?? [],
    errors: data?.errors ?? [],
  };
}
