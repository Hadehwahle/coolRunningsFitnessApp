import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

// Sends an email. When SMTP isn't configured (local development), the email is
// printed to the server console instead so flows like password reset still work.
export async function sendEmail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`\n📧 [email not sent: SMTP not configured]\nTo: ${to}\nSubject: ${subject}\n${text}\n`);
    }
    return { skipped: true };
  }
  return t.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@coolrunningsfitness.com',
    to,
    subject,
    text,
    html,
  });
}
