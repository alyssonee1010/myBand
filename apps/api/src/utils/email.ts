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

export function getEmailVerificationCooldownSeconds(): number {
  const parsed = Number.parseInt(process.env.EMAIL_VERIFICATION_COOLDOWN_SECONDS || '30', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
}

export function getEmailVerificationRetryAfterSeconds(lastSentAt?: Date | null): number {
  if (!lastSentAt) {
    return 0;
  }

  const cooldownMs = getEmailVerificationCooldownSeconds() * 1000;
  const remainingMs = cooldownMs - (Date.now() - lastSentAt.getTime());

  if (remainingMs <= 0) {
    return 0;
  }

  return Math.ceil(remainingMs / 1000);
}

function getMailConfig() {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const user = process.env.GMAIL_APP_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();
  const configuredFrom = process.env.MAIL_FROM?.trim();
  const from = configuredFrom || (resendApiKey ? 'MyBand <onboarding@resend.dev>' : user);

  return {
    resendApiKey,
    configuredFrom,
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

function buildVerificationEmail({
  email,
  name,
  verificationUrl,
}: {
  email: string;
  name?: string | null;
  verificationUrl: string;
}) {
  const greetingName = name?.trim() || email.split('@')[0];

  return {
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
  };
}

async function sendWithResend({
  apiKey,
  from,
  to,
  subject,
  text,
  html,
}: {
  apiKey: string;
  from?: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  if (!from) {
    throw new Error('MAIL_FROM is required when using Resend in production.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'myband-api/0.1.0',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      html,
    }),
  });

  if (response.ok) {
    return;
  }

  let errorMessage = `Resend request failed with status ${response.status}`;

  try {
    const body = (await response.json()) as { message?: string; name?: string };
    if (body?.message) {
      errorMessage = body.message;
    } else if (body?.name) {
      errorMessage = body.name;
    }
  } catch {
    // Ignore response parsing errors and surface the HTTP status fallback.
  }

  throw new Error(errorMessage);
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
  const { resendApiKey, configuredFrom, from, user, pass } = getMailConfig();
  const message = buildVerificationEmail({
    email,
    name,
    verificationUrl,
  });

  try {
    if (resendApiKey) {
      if (process.env.NODE_ENV === 'production' && !configuredFrom) {
        throw new Error('MAIL_FROM is required when using Resend in production.');
      }

      await sendWithResend({
        apiKey: resendApiKey,
        from,
        to: email,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
      return { delivered: true };
    }

    if (user && pass) {
      const mailer = getTransporter();

      await mailer.sendMail({
        from,
        to: email,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });

      return { delivered: true };
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email delivery is not configured. Set RESEND_API_KEY and MAIL_FROM for production.');
    }

    console.warn(`[EMAIL] Verification email was not sent to ${email}. Use this URL in development: ${verificationUrl}`);
    return {
      delivered: false,
      previewUrl: verificationUrl,
    };
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
