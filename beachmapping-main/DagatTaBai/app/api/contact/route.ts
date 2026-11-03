import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

const noStoreHeaders = { 'Cache-Control': 'no-store, max-age=0' };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_CONTACT_EMAIL = 'contact.dagattabai@gmail.com';

type ContactBody = {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
};

export async function POST(request: Request) {
  let body: ContactBody;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json(
        { error: 'Invalid contact form data.' },
        { status: 400, headers: noStoreHeaders }
      );
    }
    body = parsed as ContactBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid contact form data.' },
      { status: 400, headers: noStoreHeaders }
    );
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (
    name.length < 2 ||
    name.length > 120 ||
    email.length > 254 ||
    !EMAIL_PATTERN.test(email) ||
    subject.length > 200 ||
    message.length < 5 ||
    message.length > 5000
  ) {
    return NextResponse.json(
      { error: 'Please provide a valid name, email, and message.' },
      { status: 400, headers: noStoreHeaders }
    );
  }

  const smtpUser = process.env.MAIL_USERNAME;
  const smtpPassword = process.env.MAIL_PASSWORD;
  if (!smtpUser || !smtpPassword) {
    console.error('Contact email delivery is not configured: MAIL_USERNAME or MAIL_PASSWORD is missing.');
    return NextResponse.json(
      { error: 'Email delivery is not configured. Please contact the site administrator.' },
      { status: 503, headers: noStoreHeaders }
    );
  }

  const port = Number(process.env.MAIL_PORT) || 587;
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465 || process.env.MAIL_ENCRYPTION === 'ssl',
    auth: { user: smtpUser, pass: smtpPassword },
  });
  const recipient = process.env.CONTACT_EMAIL || DEFAULT_CONTACT_EMAIL;
  const safeName = name.replace(/[\r\n]+/g, ' ');
  const safeSubject = subject.replace(/[\r\n]+/g, ' ') ||
    'New message from Dagat Ta Bai contact form';

  try {
    const result = await transporter.sendMail({
      from: `"${safeName} via Dagat Ta Bai" <${smtpUser}>`,
      to: recipient,
      replyTo: { name: safeName, address: email },
      subject: safeSubject,
      text: [
        `Name: ${safeName}`,
        `Email: ${email}`,
        '',
        message,
      ].join('\n'),
    });

    const recipientAccepted = result.accepted.some(
      (address) => String(address).toLowerCase() === recipient.toLowerCase()
    );
    if (!recipientAccepted) {
      console.error('Contact email recipient was rejected by the SMTP server:', result.rejected);
      return NextResponse.json(
        { error: 'The email provider did not accept the message. Please try again later.' },
        { status: 502, headers: noStoreHeaders }
      );
    }

    return NextResponse.json({ success: true }, { headers: noStoreHeaders });
  } catch (error: unknown) {
    console.error('Contact message delivery failed:', error);
    return NextResponse.json(
      { error: 'Could not send your message right now. Please try again later.' },
      { status: 502, headers: noStoreHeaders }
    );
  }
}
