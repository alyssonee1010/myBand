import crypto from 'crypto';

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
  const googleClientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const googleClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  const googleRefreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim();
  const gmailApiUser = process.env.GMAIL_API_USER?.trim();
  const configuredFrom = process.env.MAIL_FROM?.trim();
  const from = configuredFrom
    ? configuredFrom.includes('<')
      ? configuredFrom
      : `MyBand <${configuredFrom}>`
    : gmailApiUser
      ? `MyBand <${gmailApiUser}>`
      : undefined;

  return {
    googleClientId,
    googleClientSecret,
    googleRefreshToken,
    gmailApiUser,
    configuredFrom,
    from,
  };
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
  const greetingName = name?.trim() || 'there';

  return {
    subject: 'Verify your email for MyBand',
    text: [
      `Hi ${greetingName},`,
      '',
      'Welcome to MyBand.',
      'Verify your email address by opening this link:',
      verificationUrl,
      '',
      `This link expires in ${getVerificationTtlHours()} hours.`,
      '',
      'If you did not create this account, you can safely ignore this email.',
    ].join('\n'),
    html: `
      <div style="margin:0;padding:24px 0;background:#fff6ef;font-family:'Segoe UI',Arial,sans-serif;color:#101010;">
        <div style="max-width:560px;margin:0 auto;padding:0 16px;">
          <div style="border:1px solid rgba(16,16,16,0.08);border-radius:28px;overflow:hidden;background:#ffffff;box-shadow:0 18px 42px rgba(16,16,16,0.08);">
            <div style="padding:24px 28px;background:linear-gradient(135deg,#050505 0%,#1f1207 100%);color:#ffffff;">
              <div style="font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(255,255,255,0.68);">MyBand</div>
              <h1 style="margin:14px 0 0;font-size:30px;line-height:1.1;font-weight:700;">Verify your email</h1>
            </div>
            <div style="padding:28px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Hi ${greetingName},</p>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#2c2c2c;">
                Welcome to MyBand. Confirm your email address to activate your account and sign in.
              </p>
              <div style="margin:28px 0;">
                <a href="${verificationUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:linear-gradient(135deg,#ff6a00 0%,#ff3d00 100%);color:#ffffff;text-decoration:none;font-weight:700;">
                  Verify Email
                </a>
              </div>
              <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#5b5b5b;">
                This link expires in ${getVerificationTtlHours()} hours.
              </p>
              <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#5b5b5b;">
                If the button does not work, copy and paste this URL into your browser:
              </p>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.7;word-break:break-all;">
                <a href="${verificationUrl}" style="color:#ff6a00;text-decoration:none;">${verificationUrl}</a>
              </p>
              <p style="margin:0;font-size:13px;line-height:1.7;color:#7a7a7a;">
                If you did not create this account, you can safely ignore this email.
              </p>
            </div>
          </div>
        </div>
      </div>
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
    googleClientId,
    googleClientSecret,
    googleRefreshToken,
    from,
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

    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Email delivery is not configured. Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN, GMAIL_API_USER, and MAIL_FROM.'
      );
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

// ============================================================================
// Password Reset
// ============================================================================

export function getPasswordResetTtlMinutes(): number {
  const parsed = Number.parseInt(process.env.PASSWORD_RESET_TTL_MINUTES || '30', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
}

export function getPasswordResetCooldownSeconds(): number {
  const parsed = Number.parseInt(process.env.PASSWORD_RESET_COOLDOWN_SECONDS || '60', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60;
}

export function createPasswordResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function getPasswordResetExpiry(): Date {
  return new Date(Date.now() + getPasswordResetTtlMinutes() * 60 * 1000);
}

export function buildPasswordResetUrl(token: string): string {
  return `${getAppBaseUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`;
}

function buildPasswordResetEmail({
  name,
  resetUrl,
}: {
  name?: string | null;
  resetUrl: string;
}) {
  const greetingName = name?.trim() || 'there';
  const ttl = getPasswordResetTtlMinutes();

  return {
    subject: 'Reset your password for MyBand',
    text: [
      `Hi ${greetingName},`,
      '',
      'We received a request to reset your MyBand password.',
      'Open this link to choose a new password:',
      resetUrl,
      '',
      `This link expires in ${ttl} minutes.`,
      '',
      'If you did not request a password reset, you can safely ignore this email.',
    ].join('\n'),
    html: `
      <div style="margin:0;padding:24px 0;background:#fff6ef;font-family:'Segoe UI',Arial,sans-serif;color:#101010;">
        <div style="max-width:560px;margin:0 auto;padding:0 16px;">
          <div style="border:1px solid rgba(16,16,16,0.08);border-radius:28px;overflow:hidden;background:#ffffff;box-shadow:0 18px 42px rgba(16,16,16,0.08);">
            <div style="padding:24px 28px;background:linear-gradient(135deg,#050505 0%,#1f1207 100%);color:#ffffff;">
              <div style="font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(255,255,255,0.68);">MyBand</div>
              <h1 style="margin:14px 0 0;font-size:30px;line-height:1.1;font-weight:700;">Reset your password</h1>
            </div>
            <div style="padding:28px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Hi ${greetingName},</p>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#2c2c2c;">
                We received a request to reset your MyBand password. Click the button below to choose a new one.
              </p>
              <div style="margin:28px 0;">
                <a href="${resetUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:linear-gradient(135deg,#ff6a00 0%,#ff3d00 100%);color:#ffffff;text-decoration:none;font-weight:700;">
                  Reset Password
                </a>
              </div>
              <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#5b5b5b;">
                This link expires in ${ttl} minutes.
              </p>
              <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#5b5b5b;">
                If the button does not work, copy and paste this URL into your browser:
              </p>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.7;word-break:break-all;">
                <a href="${resetUrl}" style="color:#ff6a00;text-decoration:none;">${resetUrl}</a>
              </p>
              <p style="margin:0;font-size:13px;line-height:1.7;color:#7a7a7a;">
                If you did not request this, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </div>
          </div>
        </div>
      </div>
    `,
  };
}

export async function sendPasswordResetEmail({
  email,
  name,
  token,
}: {
  email: string;
  name?: string | null;
  token: string;
}): Promise<{ previewUrl?: string; delivered: boolean }> {
  const resetUrl = buildPasswordResetUrl(token);
  const {
    googleClientId,
    googleClientSecret,
    googleRefreshToken,
    from,
  } = getMailConfig();
  const message = buildPasswordResetEmail({ name, resetUrl });

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

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email delivery is not configured.');
    }

    console.warn(`[EMAIL] Password reset email was not sent to ${email}. Use this URL in development: ${resetUrl}`);
    return { delivered: false, previewUrl: resetUrl };
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }

    console.warn(`[EMAIL] Password reset email was not sent to ${email}. Use this URL in development: ${resetUrl}`);
    return { delivered: false, previewUrl: resetUrl };
  }
}
