const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
const MAILTO_REGEX = /href="mailto:([^"]+)"/gi

const BLOCKED_PREFIXES = ['noreply', 'no-reply', 'donotreply', 'do-not-reply']
const BLOCKED_DOMAINS = ['sendgrid.net', 'mailchimp.com', 'amazonses.com', 'bounce.']

export function extractEmailsFromHtml(html: string): string[] {
  const found = new Set<string>()

  let match: RegExpExecArray | null
  const mailtoRe = new RegExp(MAILTO_REGEX.source, 'gi')
  while ((match = mailtoRe.exec(html)) !== null) {
    found.add(match[1].toLowerCase().trim())
  }

  const textRe = new RegExp(EMAIL_REGEX.source, 'g')
  while ((match = textRe.exec(html)) !== null) {
    found.add(match[0].toLowerCase().trim())
  }

  return Array.from(found)
}

export function filterBusinessEmails(emails: string[]): string[] {
  return emails.filter((email) => {
    const lower = email.toLowerCase()
    if (BLOCKED_PREFIXES.some((p) => lower.startsWith(p + '@'))) return false
    if (BLOCKED_DOMAINS.some((d) => lower.includes(d))) return false
    return true
  })
}
