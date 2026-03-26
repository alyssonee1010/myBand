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
  const googleClientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const googleClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  const googleRefreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim();
  const gmailApiUser = process.env.GMAIL_API_USER?.trim() || process.env.GMAIL_APP_USER?.trim();
  const user = process.env.GMAIL_APP_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();
  const configuredFrom = process.env.MAIL_FROM?.trim();
  const from = configuredFrom || (gmailApiUser ? `MyBand <${gmailApiUser}>` : resendApiKey ? 'MyBand <onboarding@resend.dev>' : user);

  return {
    resendApiKey,
    googleClientId,
    googleClientSecret,
    googleRefreshToken,
    gmailApiUser,
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

function encodeBase64Url(value: string): string {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function buildMimeMessage({
  from,
  to,
  subject,
  text,
  html,
}: {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const boundary = `myband-${crypto.randomBytes(12).toString('hex')}`;

  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    text,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    html,
    '',
    `--${boundary}--`,
    '',
  ].join('\r\n');
}

async function fetchGoogleAccessToken({
  clientId,
  clientSecret,
  refreshToken,
}: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'myband-api/0.1.0',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { access_token?: string; error?: string; error_description?: string }
    | null;

  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error_description || payload?.error || 'Failed to obtain Gmail API access token.');
  }

  return payload.access_token;
}

async function sendWithGmailApi({
  accessToken,
  from,
  to,
  subject,
  text,
  html,
}: {
  accessToken: string;
  from?: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  if (!from) {
    throw new Error('MAIL_FROM or GMAIL_API_USER is required when using the Gmail API.');
  }

  const raw = encodeBase64Url(
    buildMimeMessage({
      from,
      to,
      subject,
      text,
      html,
    })
  );

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'myband-api/0.1.0',
    },
    body: JSON.stringify({ raw }),
  });

  if (response.ok) {
    return;
  }

  const payload = (await response.json().catch(() => null)) as
    | { error?: { message?: string; status?: string } }
    | null;

  throw new Error(payload?.error?.message || payload?.error?.status || `Gmail API request failed with status ${response.status}`);
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
  const {
    resendApiKey,
    googleClientId,
    googleClientSecret,
    googleRefreshToken,
    configuredFrom,
    from,
    user,
    pass,
  } = getMailConfig();
  const message = buildVerificationEmail({
    email,
    name,
    verificationUrl,
  });

  try {
    if (googleClientId && googleClientSecret && googleRefreshToken) {
      const accessToken = await fetchGoogleAccessToken({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        refreshToken: googleRefreshToken,
      });

      await sendWithGmailApi({
        accessToken,
        from,
        to: email,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });

      return { delivered: true };
    }

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
