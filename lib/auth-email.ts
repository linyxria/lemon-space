type SendEmailOptions = {
  to: string
  subject: string
  html: string
  text: string
}

function shouldThrowOnMailFailure() {
  return process.env.NODE_ENV === "production"
}

async function sendWithResend({ to, subject, html, text }: SendEmailOptions) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.AUTH_EMAIL_FROM
  const replyTo = process.env.AUTH_EMAIL_REPLY_TO

  if (!apiKey || !from) {
    const warning = "[auth-email] RESEND_API_KEY or AUTH_EMAIL_FROM is missing."
    if (shouldThrowOnMailFailure()) {
      throw new Error(warning)
    }
    console.warn(warning)
    return false
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "lemon-space",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text,
      reply_to: replyTo || undefined,
    }),
  })

  if (response.ok) return true

  const body = await response.text()
  const message = `[auth-email] Resend request failed (${response.status}): ${body}`

  if (shouldThrowOnMailFailure()) {
    throw new Error(message)
  }

  console.error(message)
  return false
}

function escapeHtml(raw: string) {
  return raw
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

export async function sendVerificationEmail({
  email,
  name,
  verifyUrl,
}: {
  email: string
  name?: string | null
  verifyUrl: string
}) {
  const safeName = name ? escapeHtml(name) : "there"
  const safeUrl = escapeHtml(verifyUrl)

  const subject = "Verify your email - Lemon Space"
  const text = `Hi ${name || "there"},\n\nPlease verify your email by opening the link below:\n${verifyUrl}\n\nIf you did not create this account, you can ignore this email.`
  const html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #18181b;">
    <h2 style="margin: 0 0 12px;">Verify your email</h2>
    <p style="margin: 0 0 12px;">Hi ${safeName},</p>
    <p style="margin: 0 0 16px;">Thanks for signing up for Lemon Space. Confirm your email to finish setting up your account.</p>
    <p style="margin: 0 0 20px;">
      <a href="${safeUrl}" style="display: inline-block; background: #18181b; color: white; text-decoration: none; padding: 10px 14px; border-radius: 8px;">
        Verify email
      </a>
    </p>
    <p style="margin: 0 0 8px; font-size: 13px; color: #52525b;">Or copy this link:</p>
    <p style="margin: 0; font-size: 13px; color: #3f3f46; word-break: break-all;">${safeUrl}</p>
  </div>
  `

  try {
    const sent = await sendWithResend({ to: email, subject, html, text })
    if (!sent) {
      console.info(`[auth-email] verification URL for ${email}: ${verifyUrl}`)
    }
  } catch (error) {
    console.error("[auth-email] verification send failed:", error)

    if (shouldThrowOnMailFailure()) {
      throw error
    }

    // Dev fallback for local testing without mail provider.
    console.info(`[auth-email] verification URL for ${email}: ${verifyUrl}`)
  }
}

export async function sendPasswordResetEmail({
  email,
  name,
  resetUrl,
}: {
  email: string
  name?: string | null
  resetUrl: string
}) {
  const safeName = name ? escapeHtml(name) : "there"
  const safeUrl = escapeHtml(resetUrl)

  const subject = "Reset your password - Lemon Space"
  const text = `Hi ${name || "there"},\n\nOpen the link below to reset your Lemon Space password:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`
  const html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #18181b;">
    <h2 style="margin: 0 0 12px;">Reset your password</h2>
    <p style="margin: 0 0 12px;">Hi ${safeName},</p>
    <p style="margin: 0 0 16px;">Use this secure link to set a new Lemon Space password.</p>
    <p style="margin: 0 0 20px;">
      <a href="${safeUrl}" style="display: inline-block; background: #18181b; color: white; text-decoration: none; padding: 10px 14px; border-radius: 8px;">
        Reset password
      </a>
    </p>
    <p style="margin: 0 0 8px; font-size: 13px; color: #52525b;">Or copy this link:</p>
    <p style="margin: 0; font-size: 13px; color: #3f3f46; word-break: break-all;">${safeUrl}</p>
    <p style="margin: 16px 0 0; font-size: 13px; color: #71717a;">If you did not request this, you can ignore this email.</p>
  </div>
  `

  try {
    const sent = await sendWithResend({ to: email, subject, html, text })
    if (!sent) {
      console.info(`[auth-email] password reset URL for ${email}: ${resetUrl}`)
    }
  } catch (error) {
    console.error("[auth-email] password reset send failed:", error)

    if (shouldThrowOnMailFailure()) {
      throw error
    }

    // Dev fallback for local testing without mail provider.
    console.info(`[auth-email] password reset URL for ${email}: ${resetUrl}`)
  }
}
