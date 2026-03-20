import { Resend } from "resend";

let _resend: Resend | null = null;

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
    from: "XILAR <onboarding@resend.dev>",
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
