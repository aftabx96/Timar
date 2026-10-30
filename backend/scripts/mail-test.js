// npm run mail:test -- you@example.com
// Logs in to the mail server from .env and sends one sample code email to the address given.
import { config } from '../src/config.js'
import { getTransport, sendCodeEmail } from '../src/lib/mailer.js'

const to = process.argv[2]
if (!to || !to.includes('@')) {
  console.error('Usage: npm run mail:test -- you@example.com')
  process.exit(1)
}

const t = getTransport()
if (!t) {
  console.error('SMTP_HOST is empty in .env, so codes are only printed to the console.')
  process.exit(1)
}

try {
  await t.verify()
  console.log(`Signed in to ${config.smtp.host}:${config.smtp.port} as ${config.smtp.user}`)
  await sendCodeEmail({ to, name: 'there', code: '482913', purpose: 'verify', minutes: 5 })
  console.log(`Sent a sample code email to ${to}. Check the inbox (and spam the first time).`)
} catch (e) {
  console.error(`Could not send: ${e.message}`)
  if (/Invalid login|Username and Password not accepted|535/i.test(e.message)) {
    console.error('  Gmail refused the login. Use a 16 character app password, not your normal password, and make sure 2-Step Verification is on.')
  }
  process.exitCode = 1
}
