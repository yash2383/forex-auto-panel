import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
export declare class OtpService {
    private prisma;
    private emailService;
    constructor(prisma: PrismaService, emailService: EmailService);
    private hashOtp;
    generateOtp(partnerId: string, email: string, partnerName: string): Promise<{
        success: boolean;
        otp: string;
    }>;
    verifyOtp(partnerId: string, email: string, code: string): Promise<boolean>;
    cleanupExpiredOtps(): Promise<void>;
}
