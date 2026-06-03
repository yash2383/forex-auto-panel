"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = __importStar(require("nodemailer"));
let EmailService = EmailService_1 = class EmailService {
    logger = new common_1.Logger(EmailService_1.name);
    transporter = null;
    constructor() {
        const host = process.env.SMTP_HOST;
        const port = parseInt(process.env.SMTP_PORT || '587', 10);
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        const isValidConfig = host &&
            user &&
            pass &&
            user !== 'your@email.com' &&
            pass !== 'app_password';
        if (isValidConfig) {
            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth: {
                    user,
                    pass,
                },
            });
            this.logger.log('Nodemailer SMTP Transporter initialized successfully.');
        }
        else {
            this.logger.warn('SMTP environment variables are not configured or contain default placeholder values. Falling back to console logging for OTPs.');
        }
    }
    async sendOtpEmail(email, code, partnerName) {
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
        }
        catch (error) {
            this.logger.error(`Failed to send SMTP email to ${email}: ${error.message}`);
            throw error;
        }
    }
    async sendWelcomeEmail(email, name) {
        const from = process.env.SMTP_FROM || `"Tradebot Support" <noreply@yourdomain.com>`;
        const subject = `Welcome to Tradebot, ${name}!`;
        const text = `Hello ${name},\n\nWelcome to Tradebot! Your account has been verified and activated successfully.\n\nYou can now access all investment and trading features on your dashboard.\n\nBest regards,\nTradebot Team`;
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #22c55e; text-align: center;">Welcome to Tradebot</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your account has been verified and activated successfully!</p>
        <p>You can now log in and explore all automated trading algorithms, risk parameters, and investment features on your dashboard.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="http://localhost:3000/login" style="background-color: #22c55e; color: black; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 16px;">Go to Dashboard</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #71717a; text-align: center;">This is an automated welcoming email from Tradebot. Please do not reply.</p>
      </div>
    `;
        if (!this.transporter) {
            this.logger.log(`[DEVELOPMENT WELCOME EMAIL] Sent to [${email}]`);
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
            this.logger.log(`Welcome email sent successfully to ${email}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send welcome SMTP email to ${email}: ${error.message}`);
            return false;
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EmailService);
//# sourceMappingURL=email.service.js.map