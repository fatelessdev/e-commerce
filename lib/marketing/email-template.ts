import { MARKETING_PRODUCT_SELECTION_LIMIT, type CampaignDraftInput, type CampaignProduct, type CampaignRecipient } from "./types.ts";
import { createUnsubscribeToken } from "./unsubscribe-token.ts";

type CampaignEmailInput = {
  draft: CampaignDraftInput;
  recipient: CampaignRecipient;
  products: CampaignProduct[];
  appUrl: string;
};

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function resolveUrl(value: string, appUrl: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return new URL(value, appUrl).toString();
}

function normalizeEmailProductImage(image: string) {
  if (!image.includes("res.cloudinary.com") || !image.includes("/upload/")) {
    return image;
  }

  const [prefix, suffix] = image.split("/upload/");
  if (!prefix || !suffix) return image;

  return `${prefix}/upload/f_auto,q_auto,c_fill,g_auto,w_480,h_600/${suffix}`;
}

function paragraphize(body: string) {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p style="margin:0 0 18px;color:#d8d0ca;font-size:15px;line-height:1.7;mso-line-height-rule:exactly;">${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function renderProduct(product: CampaignProduct, appUrl: string) {
  const productUrl = `${appUrl.replace(/\/$/, "")}/product/${product.id}`;
  const image = product.image
    ? `<img src="${escapeHtml(normalizeEmailProductImage(product.image))}" width="240" height="300" alt="${escapeHtml(product.name)}" style="width:240px;height:300px;max-width:100%;object-fit:cover;display:block;border:1px solid #2b2725;background:#171311;" />`
    : `<div style="width:100%;max-width:240px;height:300px;border:1px solid #2b2725;background:#171311;"></div>`;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td>
          <a href="${escapeHtml(productUrl)}" style="color:#f2ede8;text-decoration:none;display:block;">
            ${image}
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding-top:10px;">
          <a href="${escapeHtml(productUrl)}" style="color:#f2ede8;text-decoration:none;font-size:12px;line-height:1.4;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">${escapeHtml(product.name)}</a>
        </td>
      </tr>
      <tr>
        <td style="padding-top:4px;color:#b8aea6;font-size:13px;">Rs. ${escapeHtml(product.sellingPrice)}</td>
      </tr>
    </table>
  `;
}

function renderProductRows(products: CampaignProduct[], appUrl: string) {
  const visibleProducts = products.slice(0, MARKETING_PRODUCT_SELECTION_LIMIT);
  const rows: string[] = [];

  for (let index = 0; index < visibleProducts.length; index += 2) {
    const left = visibleProducts[index];
    const right = visibleProducts[index + 1];
    rows.push(`
      <tr>
        <td width="50%" valign="top" style="padding:0 9px 24px 0;">
          ${left ? renderProduct(left, appUrl) : ""}
        </td>
        <td width="50%" valign="top" style="padding:0 0 24px 9px;">
          ${right ? renderProduct(right, appUrl) : ""}
        </td>
      </tr>
    `);
  }

  return rows.join("");
}

export function buildCampaignEmailHtml({ draft, recipient, products, appUrl }: CampaignEmailInput) {
  const ctaUrl = resolveUrl(draft.ctaUrl, appUrl);
  const logoUrl = new URL("/about/logo.jpeg", appUrl).toString();
  const unsubscribeToken = createUnsubscribeToken(recipient.email);
  const unsubscribeUrl = new URL("/unsubscribe/marketing", appUrl);
  unsubscribeUrl.searchParams.set("token", unsubscribeToken);
  const safeName = escapeHtml(recipient.name || "there");

  return `
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#f4f0ec;color:#f2ede8;font-family:Arial,sans-serif;">
        <div style="display:none;max-height:0;overflow:hidden;color:transparent;">${escapeHtml(draft.previewText)}</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#f4f0ec;">
          <tr>
            <td align="center" style="padding:28px 14px;">
              <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;background:#100d0c;border:1px solid #211d1a;">
                <tr>
                  <td style="padding:34px 34px 18px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="middle">
                          <img src="${escapeHtml(logoUrl)}" width="38" alt="XILAR" style="width:38px;height:auto;display:block;border:0;" />
                        </td>
                        <td align="right" valign="middle" style="color:#8e837c;font-size:11px;text-transform:uppercase;letter-spacing:0.28em;">
                          XILAR // DROP DESK
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 34px 38px;">
                    <h1 style="margin:0 0 22px;color:#fff;font-size:40px;line-height:0.98;text-transform:uppercase;letter-spacing:0;font-weight:900;">${escapeHtml(draft.headline)}</h1>
                    <p style="margin:0 0 22px;color:#b8aea6;font-size:14px;line-height:1.6;">Hi ${safeName},</p>
                    ${paragraphize(draft.body)}
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">
                      <tr>
                        <td bgcolor="#c62828" style="padding:14px 22px;">
                          <a href="${escapeHtml(ctaUrl)}" style="color:#fff;text-decoration:none;font-size:12px;text-transform:uppercase;letter-spacing:0.18em;font-weight:700;">${escapeHtml(draft.ctaLabel)}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${
                  products.length > 0
                    ? `<tr>
                        <td style="padding:30px 34px 10px;border-top:1px solid #2b2725;">
                          <h2 style="margin:0 0 18px;color:#f2ede8;font-size:13px;text-transform:uppercase;letter-spacing:0.22em;">Featured pieces</h2>
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            ${renderProductRows(products, appUrl)}
                          </table>
                        </td>
                      </tr>`
                    : ""
                }
                <tr>
                  <td style="padding:24px 34px 34px;border-top:1px solid #2b2725;color:#837a73;font-size:12px;line-height:1.6;">
                    <p style="margin:0 0 8px;">You are receiving this because you have a XILAR account or order history.</p>
                    <a href="${escapeHtml(unsubscribeUrl.toString())}" style="color:#b8aea6;">Unsubscribe from XILAR marketing emails</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
