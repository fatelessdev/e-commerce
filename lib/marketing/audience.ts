import type { CampaignRecipient } from "@/lib/marketing/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type MarketingCandidate = {
  id: string;
  email: string | null;
  name: string | null;
  role?: string | null;
  banned?: boolean | null;
};

export function normalizeMarketingEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isMarketingEmailCandidate(candidate: MarketingCandidate, suppressedEmails: Set<string>) {
  const email = candidate.email ? normalizeMarketingEmail(candidate.email) : "";
  return Boolean(
    email &&
      EMAIL_RE.test(email) &&
      candidate.role !== "admin" &&
      !candidate.banned &&
      !suppressedEmails.has(email)
  );
}

export function filterMarketingRecipients(
  candidates: MarketingCandidate[],
  suppressedEmails: Set<string>
): CampaignRecipient[] {
  const seen = new Set<string>();
  const recipients: CampaignRecipient[] = [];

  for (const candidate of candidates) {
    if (!isMarketingEmailCandidate(candidate, suppressedEmails)) continue;

    const email = normalizeMarketingEmail(candidate.email!);
    if (seen.has(email)) continue;
    seen.add(email);

    recipients.push({
      userId: candidate.id,
      email,
      name: candidate.name?.trim() || "there",
    });
  }

  return recipients;
}
