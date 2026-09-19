import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Provider-agnostic email delivery for the OTP verification flow (Part B).
//
// - SMTP is used when SMTP_HOST / SMTP_USER / SMTP_PASS are configured.
// - If SMTP is NOT configured the service falls back to deterministic DEV mode:
//   the OTP is printed to the server console (clearly marked) and the flow
//   completes so local testing does not require real credentials.
//   The system must never crash because email is unavailable.

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || SMTP_PORT === 465;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || 'TaskHub <no-reply@taskhub.io>';

export function isSmtpConfigured(): boolean {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

export type SendEmailResult = {
  delivered: boolean;
  mode: 'smtp' | 'dev';
};

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!isSmtpConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<SendEmailResult> {
  const smtp = getTransporter();
  if (!smtp) {
    console.warn(
      `===== [DEV MODE] Email transport is DISABLED (no SMTP configured). =====`
    );
    console.warn(`[DEV MODE] To: ${opts.to}`);
    if (opts.text) console.warn(`[DEV MODE] Body:\n${opts.text}`);
    console.warn(`=============================================================`);
    return { delivered: false, mode: 'dev' };
  }

  try {
    await smtp.sendMail({
      from: SMTP_FROM,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    return { delivered: true, mode: 'smtp' };
  } catch (err: any) {
    console.error('SMTP send failed:', err?.message || err);
    console.warn(
      `[DEV MODE] Email could not be delivered via SMTP. OTP body below (dev only):\n${opts.text || ''}`
    );
    return { delivered: false, mode: 'dev' };
  }
}

export function buildOtpEmail(to: string, code: string): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = 'TaskHub — Your Email Verification Code';
  const text = `Your TaskHub email verification code is: ${code}\n\nThis code expires in 10 minutes. If you did not create a TaskHub account, you can safely ignore this email.`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="margin:0 0 12px;color:#4f46e5;">TaskHub Email Verification</h2>
      <p style="color:#374151;font-size:14px;">Use the verification code below to confirm your email address:</p>
      <div style="margin:20px 0;padding:16px;background:#eef2ff;border-radius:8px;text-align:center;">
        <span style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#4338ca;">${code}</span>
      </div>
      <p style="color:#6b7280;font-size:12px;">This code expires in <b>10 minutes</b>. If you didn't create an account on TaskHub, you can safely ignore this email.</p>
    </div>`;
  return { subject, html, text };
}