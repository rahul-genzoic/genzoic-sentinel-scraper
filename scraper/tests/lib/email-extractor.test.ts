import { describe, it, expect } from 'vitest'
import { extractEmailsFromHtml, filterBusinessEmails } from '../../src/lib/email-extractor'

describe('extractEmailsFromHtml', () => {
  it('extracts mailto href emails', () => {
    const html = '<a href="mailto:info@muscleblaze.com">Contact</a>'
    expect(extractEmailsFromHtml(html)).toContain('info@muscleblaze.com')
  })

  it('extracts emails from plain text', () => {
    const html = '<p>Reach us at support@bigmuscles.com for queries</p>'
    expect(extractEmailsFromHtml(html)).toContain('support@bigmuscles.com')
  })

  it('deduplicates emails', () => {
    const html = '<a href="mailto:info@brand.com">x</a> info@brand.com again'
    const result = extractEmailsFromHtml(html)
    expect(result.filter(e => e === 'info@brand.com').length).toBe(1)
  })

  it('returns lowercase emails', () => {
    const html = '<a href="mailto:Info@Brand.COM">x</a>'
    expect(extractEmailsFromHtml(html)).toContain('info@brand.com')
  })

  it('returns empty array when no emails found', () => {
    expect(extractEmailsFromHtml('<p>No contact info here</p>')).toEqual([])
  })
})

describe('filterBusinessEmails', () => {
  it('removes noreply addresses', () => {
    const emails = ['info@brand.com', 'noreply@brand.com']
    expect(filterBusinessEmails(emails)).toEqual(['info@brand.com'])
  })

  it('removes no-reply addresses', () => {
    expect(filterBusinessEmails(['no-reply@brand.com', 'hello@brand.com']))
      .toEqual(['hello@brand.com'])
  })

  it('removes donotreply addresses', () => {
    expect(filterBusinessEmails(['donotreply@brand.com', 'sales@brand.com']))
      .toEqual(['sales@brand.com'])
  })

  it('removes common automated domains', () => {
    expect(filterBusinessEmails(['bot@mailer.sendgrid.net', 'info@brand.com']))
      .toEqual(['info@brand.com'])
  })
})
