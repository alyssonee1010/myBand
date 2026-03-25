import crypto from 'crypto';
import nodemailer from 'nodemailer';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getAppBaseUrl(): string {
  return (process.env.APP_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function getVerificationTtlHours(): number {
  const parsed = Number.parseInt(process.env.EMAIL_VERIFICATION_TTL_HOURS || '24', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 24;
}

function getMailConfig() {
  const user = process.env.GMAIL_APP_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();
  const from = process.env.MAIL_FROM?.trim() || user;

  return {
    user,
    pass,
    from,
  };
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  const { user, pass } = getMailConfig();

  if (!user || !pass) {
    throw new Error('Gmail app email credentials are not configured.');
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  return transporter;
}

export function createEmailVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function getEmailVerificationExpiry(): Date {
  return new Date(Date.now() + getVerificationTtlHours() * 60 * 60 * 1000);
}

export function buildEmailVerificationUrl(token: string): string {
  return `${getAppBaseUrl()}/auth/verify-email?token=${encodeURIComponent(token)}`;
}

export async function sendVerificationEmail({
  email,
  name,
  token,
}: {
  email: string;
  name?: string | null;
  token: string;
}): Promise<{ previewUrl?: string; delivered: boolean }> {
  const verificationUrl = buildEmailVerificationUrl(token);
  const { from } = getMailConfig();
  const greetingName = name?.trim() || email.split('@')[0];

  try {
    const mailer = getTransporter();

    await mailer.sendMail({
      from,
      to: email,
      subject: 'Verify your email for MyBand',
      text: [
        `Hi ${greetingName},`,
        '',
        'Thanks for signing up for MyBand.',
        'Verify your email address by opening this link:',
        verificationUrl,
        '',
        `This link expires in ${getVerificationTtlHours()} hours.`,
      ].join('\n'),
      html: `
        <p>Hi ${greetingName},</p>
        <p>Thanks for signing up for MyBand.</p>
        <p>
          Verify your email address by clicking the link below:
        </p>
        <p>
          <a href="${verificationUrl}">${verificationUrl}</a>
        </p>
        <p>This link expires in ${getVerificationTtlHours()} hours.</p>
      `,
    });

    return { delivered: true };
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }

    console.warn(`[EMAIL] Verification email was not sent to ${email}. Use this URL in development: ${verificationUrl}`);
    return {
      delivered: false,
      previewUrl: verificationUrl,
    };
  }
}
