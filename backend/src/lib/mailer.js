import nodemailer from 'nodemailer'
import { config } from '../config.js'

/*
  Sends the one time codes. With SMTP_HOST empty, codes are printed to the console instead
  (and shown in the frontend dev inbox). Gmail: smtp.gmail.com, port 465, your address and a
  16 character app password; MAIL_FROM must use that same address or Gmail rewrites it.
*/

let transport

export function getTransport() {
  if (!config.smtp.host) return null
  transport ??= nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465, // 465 is TLS from the start; 587 upgrades with STARTTLS
    requireTLS: config.smtp.port === 587,
    auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    connectionTimeout: 10_000,
  })
  return transport
}

const subjects = {
  verify: 'Your Timar verification code',
  login: 'Your Timar sign in code',
  reset: 'Reset your Timar password',
}

const intros = {
  verify: 'Use this code to finish creating your Timar account.',
  login: 'Use this code to sign in to Timar.',
  reset: 'Use this code to set a new password for your Timar account.',
}

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

// Plain, table based HTML so it renders the same in Gmail, Outlook and phone mail apps.
function codeHtml({ name, code, purpose, minutes }) {
  const digits = code
    .split('')
    .map((d) => `<td style="width:44px;height:56px;background:#e6e9dc;border-radius:10px;text-align:center;font:600 28px ui-monospace,Menlo,Consolas,monospace;color:#13291d">${d}</td>`)
    .join('<td style="width:8px"></td>')
  return `<!doctype html><html><body style="margin:0;background:#f2f2ea;padding:32px 12px">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:18px;padding:32px" cellspacing="0" cellpadding="0">
      <tr><td style="font:400 26px Georgia,serif;color:#13291d">Timar</td></tr>
      <tr><td style="padding-top:20px;font:16px/1.6 system-ui,-apple-system,Segoe UI,sans-serif;color:#234232">Hello ${escapeHtml(name)},<br>${intros[purpose]}</td></tr>
      <tr><td style="padding:24px 0"><table role="presentation" cellspacing="0" cellpadding="0"><tr>${digits}</tr></table></td></tr>
      <tr><td style="font:14px/1.6 system-ui,-apple-system,Segoe UI,sans-serif;color:#5a6a5f">It works for ${minutes} minutes. If you did not ask for it, you can ignore this email; nobody can sign in without the code.</td></tr>
      <tr><td style="padding-top:24px;border-top:1px solid #cbd2bd;font:13px system-ui,-apple-system,Segoe UI,sans-serif;color:#5a6a5f">Timar, with Saltwater Marina, Rehri Goth, Karachi</td></tr>
    </table>
  </td></tr></table></body></html>`
}

export async function sendCodeEmail({ to, name, code, purpose, minutes }) {
  const subject = `${subjects[purpose]}: ${code}`
  const text = `Hello ${name},\n\n${intros[purpose]}\n\n${code}\n\nIt works for ${minutes} minutes. If you did not ask for it, you can ignore this email.\n\nTimar, with Saltwater Marina`

  const t = getTransport()
  // Demo accounts use a real looking domain we do not own, so their mail is never actually sent.
  if (!t || config.demoEmails.includes(String(to).toLowerCase())) {
    // No mail server (or a demo account): print it so the code can still be used.
    if (!config.isTest) console.log(`[mail] to=${to} subject="${subject}" code=${code}`)
    return
  }
  await t.sendMail({ from: config.mailFrom, to, subject, text, html: codeHtml({ name, code, purpose, minutes }) })
}
