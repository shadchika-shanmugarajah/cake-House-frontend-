/**
 * Sends email and/or SMS when bulk order is confirmed or cancelled.
 * Configure via .env - if not set, notifications are skipped (no errors).
 */

let transporter = null;

async function getEmailTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  try {
    const nodemailer = await import('nodemailer');
    transporter = nodemailer.default.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });
    return transporter;
  } catch (err) {
    console.warn('[notification] Nodemailer not installed. Run: npm install nodemailer');
    return null;
  }
}

export async function sendBulkOrderEmail({ to, orderId, status, message }) {
  const trans = await getEmailTransporter();
  if (!trans) return;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const subject = status === 'confirmed'
    ? `Your bulk order ${orderId} is confirmed!`
    : `Bulk order ${orderId} update`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px;">
      <p>${message}</p>
      <p style="color: #666; font-size: 14px;">Order ID: <strong>${orderId}</strong></p>
    </div>
  `;
  try {
    await trans.sendMail({ from, to, subject, html, text: message });
    console.log(`[notification] Email sent to ${to} for order ${orderId}`);
  } catch (err) {
    console.error('[notification] Email failed:', err.message);
  }
}

export async function sendBulkOrderSMS({ to, orderId, message }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !from || !to) return;
  try {
    const twilio = (await import('twilio')).default;
    const client = twilio(accountSid, authToken);
    await client.messages.create({ body: message, from, to });
    console.log(`[notification] SMS sent to ${to} for order ${orderId}`);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.warn('[notification] Twilio not installed. Run: npm install twilio');
    } else {
      console.error('[notification] SMS failed:', err.message);
    }
  }
}

export async function notifyBulkOrderUpdate({ customer, orderId, status, message }) {
  const email = customer?.email;
  const phone = customer?.phone;
  const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  const hasTwilio = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);

  console.log(`[notification] Bulk order ${orderId} ${status} - customer: ${email || '(no email)'}, ${phone || '(no phone)'}`);
  if (!email && !phone) {
    console.warn('[notification] No customer email or phone - cannot send email/SMS');
    return;
  }
  if (!hasSmtp && !hasTwilio) {
    console.warn('[notification] Email/SMS not configured. Add SMTP_* (and/or TWILIO_*) to .env - see .env.example');
    return;
  }

  const tasks = [];
  if (email && hasSmtp) tasks.push(sendBulkOrderEmail({ to: email, orderId, status, message }));
  else if (email) console.log('[notification] Skipping email - SMTP not configured');
  if (phone && hasTwilio) tasks.push(sendBulkOrderSMS({ to: normalizePhone(phone), orderId, message }));
  else if (phone) console.log('[notification] Skipping SMS - Twilio not configured');
  await Promise.allSettled(tasks);
}

function normalizePhone(phone) {
  if (!phone) return '';
  const s = String(phone).trim();
  if (s.startsWith('+')) return s;
  const digits = s.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;  // US
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}
