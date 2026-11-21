import nodemailer from 'nodemailer';
import { join } from 'node:path';

type OwnerApplicationEmailDecision =
  | { status: 'approved'; pin: string }
  | { status: 'rejected'; rejectionReason: string };

type OwnerApplicationEmailContent = OwnerApplicationEmailDecision & {
  applicantName: string;
  beachName: string;
  recipientEmail: string;
};

type OwnerApplicationEmailTemplateInput = OwnerApplicationEmailDecision & {
  applicantName: string;
  beachName: string;
  siteUrl: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return entities[character];
  });
}

export function buildOwnerApplicationEmailHtml({
  applicantName,
  beachName,
  siteUrl,
  ...decision
}: OwnerApplicationEmailTemplateInput): string {
  // Inline styles and Arial keep the email client-safe; status colors follow the supplied samples.
  const baseUrl = siteUrl.replace(/\/+$/, '');
  const loginUrl = `${baseUrl}/owner/login`;
  const isApproved = decision.status === 'approved';
  const heading = isApproved ? 'Application Approved' : 'Application Not Approved';
  const headingColor = isApproved ? '#007a4d' : '#b42318';

  const message = isApproved
    ? `Great news! Your beach owner application for <strong>${escapeHtml(beachName)}</strong> has been reviewed and approved. You can now manage your beach information in the Owner Portal.`
    : `Thank you for applying to become a beach owner on Dagat Ta Bai. After carefully reviewing your application for <strong>${escapeHtml(beachName)}</strong>, we are unable to approve it at this time.`;

  const decisionDetails = isApproved
    ? `
      <p style="margin: 22px 0 8px; color: #173f65; font-size: 13px; line-height: 1.6;">Here is the PIN you will use to log in:</p>
      <div style="margin: 12px auto 20px; padding: 14px 8px; color: #173f65; font-family: Georgia, 'Times New Roman', serif; font-size: 30px; font-weight: 700; letter-spacing: 8px; text-align: center;">${escapeHtml(decision.pin)}</div>
      <div style="margin: 22px 0 14px; text-align: center;">
        <a href="${escapeHtml(loginUrl)}" style="display: inline-block; padding: 14px 26px; background-color: #173f65; color: #ffffff; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-decoration: none;">LOG IN TO OWNER PORTAL</a>
      </div>
      <p style="margin: 0; color: #405b73; font-size: 11px; line-height: 1.6; text-align: center;">Button not working? <a href="${escapeHtml(loginUrl)}" style="color: #17618d;">${escapeHtml(loginUrl)}</a></p>
    `
    : `
      <div style="margin: 18px 0; text-align: center;">
        <p style="margin: 0 0 6px; color: #b42318; font-size: 10px; font-weight: 700; letter-spacing: 1px;">REASON</p>
        <p style="margin: 0; color: #8f211a; font-size: 13px; line-height: 1.6;">${escapeHtml(decision.rejectionReason)}</p>
      </div>
      <p style="margin: 20px 0; color: #173f65; font-size: 13px; line-height: 1.6;">You are welcome to correct the details above and submit a new application. We would be glad to review it again.</p>
    `;

  const closing = isApproved
    ? 'Salamat sa pag-apil sa Dagat Ta Bai. Gihatagan namo ug dugang nga panglantaw ang imong beach!'
    : 'Salamat sa imong panahon ug interes sa Dagat Ta Bai.';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${heading}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
      <tr>
        <td align="center" style="padding: 0 12px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px; border-collapse: collapse;">
            <tr>
              <td>
                <img src="cid:dagat-ta-bai-banner" width="600" height="161" alt="Dagat Ta Bai logo above beach waves" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0;">
              </td>
            </tr>
            <tr>
              <td role="main" style="padding: 22px 28px 30px; color: #173f65;">
                <h1 style="margin: 0 0 24px; color: ${headingColor}; font-size: 15px; font-weight: 600; letter-spacing: 2.5px; line-height: 1.4; text-align: center; text-transform: uppercase;">${heading}</h1>
                <p style="margin: 0 0 14px; color: #173f65; font-size: 13px; line-height: 1.6;">Hi ${escapeHtml(applicantName)},</p>
                <p style="margin: 0 0 16px; color: #173f65; font-size: 13px; line-height: 1.6;">${message}</p>
                ${decisionDetails}
                <p style="margin: 40px 0 18px; color: #173f65; font-size: 13px; line-height: 1.6;">${closing}</p>
                <p style="margin: 0; color: #173f65; font-size: 14px; font-style: italic; line-height: 1.6; text-align: center;">The Dagat Ta Bai Team</p>
                <p style="margin: 6px 0 0; color: #405b73; font-size: 11px; line-height: 1.6; text-align: center;">Questions? <a href="mailto:contact.dagattabai@gmail.com" style="color: #17618d;">contact.dagattabai@gmail.com</a></p>
              </td>
            </tr>
            <tr>
              <td role="contentinfo" style="padding: 14px 24px; background-color: #173f65; color: #ffffff; font-size: 11px; line-height: 1.6; text-align: center;">
                Automatic message. Please do not reply. 
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendOwnerApplicationStatusEmail(
  content: OwnerApplicationEmailContent
): Promise<void> {
  const mailUser = process.env.MAIL_USERNAME;
  const mailPass = process.env.MAIL_PASSWORD;

  if (!mailUser || !mailPass) {
    throw new Error('Email delivery is not configured. Set MAIL_USERNAME and MAIL_PASSWORD before reviewing an owner application.');
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const isApproved = content.status === 'approved';
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT) || 587,
    secure: false,
    auth: {
      user: mailUser,
      pass: mailPass,
    },
  });

  await transporter.sendMail({
    from: `"${process.env.MAIL_FROM_NAME || 'Dagat Ta Bai'}" <${process.env.MAIL_FROM_ADDRESS || mailUser}>`,
    to: content.recipientEmail,
    subject: isApproved ? 'Application Approved' : 'Application Rejected',
    html: buildOwnerApplicationEmailHtml({ ...content, siteUrl }),
    attachments: [
      {
        filename: 'banner.png',
        path: join(process.cwd(), 'public', 'banner.png'),
        cid: 'dagat-ta-bai-banner',
      },
    ],
  });
}