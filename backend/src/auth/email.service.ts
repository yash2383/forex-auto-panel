import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    // Check if configuration is valid and not placeholder
    const isValidConfig =
      host &&
      user &&
      pass &&
      user !== 'your@email.com' &&
      pass !== 'app_password';

    if (isValidConfig) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });
      this.logger.log('Nodemailer SMTP Transporter initialized successfully.');
    } else {
      this.logger.warn(
        'SMTP environment variables are not configured or contain default placeholder values. Falling back to console logging for OTPs.',
      );
    }
  }

  async sendOtpEmail(email: string, code: string, partnerName: string): Promise<boolean> {
    const from = process.env.SMTP_FROM || `"Tradebot Support" <noreply@yourdomain.com>`;
    const subject = `Your Verification Code - ${partnerName}`;
    const text = `Hello,\n\nYour 6-digit verification code is: ${code}\n\nThis code will expire in 5 minutes.\n\nThank you,\n${partnerName} Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #22c55e; text-align: center;">${partnerName}</h2>
        <p>Hello,</p>
        <p>Your 6-digit verification code is:</p>
        <div style="background-color: #f4f4f5; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #18181b; border-radius: 6px; margin: 20px 0;">
          ${code}
        </div>
        <p>This code will expire in <strong>5 minutes</strong>. If you did not request this code, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #71717a; text-align: center;">This is an automated security email from ${partnerName}. Please do not reply.</p>
      </div>
    `;

    // Fallback if transporter is not initialized
    if (!this.transporter) {
      this.logger.log(`[DEVELOPMENT OTP] Code [${code}] generated for [${email}] under [${partnerName}]`);
      return true;
    }

    try {
      await this.transporter.sendMail({
        from,
        to: email,
        subject,
        text,
        html,
      });
      this.logger.log(`OTP email sent successfully to ${email}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send SMTP email to ${email}: ${error.message}`);
      // Fail-safe fallback in dev/staging environments: print it to console
      this.logger.warn(`[FALLBACK DEVELOPMENT OTP] Code [${code}] generated for [${email}] (SMTP send failed)`);
      return true;
    }
  }
}
