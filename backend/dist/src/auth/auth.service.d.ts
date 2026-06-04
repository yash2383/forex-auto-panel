import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from './otp.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class AuthService {
    private prisma;
    private otpService;
    private readonly notificationsService;
    constructor(prisma: PrismaService, otpService: OtpService, notificationsService: NotificationsService);
    login(email: string, password: string, clientIp: string): Promise<{
        token: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: import("@prisma/client").$Enums.AdminRole;
            status: "ACTIVE";
            partnerId?: undefined;
        };
        error?: undefined;
        status?: undefined;
        otpRequired?: undefined;
        otpToken?: undefined;
        email?: undefined;
        otp?: undefined;
    } | {
        error: any;
        status: number;
        token?: undefined;
        user?: undefined;
        otpRequired?: undefined;
        otpToken?: undefined;
        email?: undefined;
        otp?: undefined;
    } | {
        otpRequired: boolean;
        otpToken: string;
        email: string;
        otp: string | undefined;
        token?: undefined;
        user?: undefined;
        error?: undefined;
        status?: undefined;
    } | {
        token: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
            partnerId: string;
            status: "ACTIVE";
        };
        error?: undefined;
        status?: undefined;
        otpRequired?: undefined;
        otpToken?: undefined;
        email?: undefined;
        otp?: undefined;
    }>;
    verifyLoginOtp(otpToken: string, otp: string, clientIp: string): Promise<{
        error: any;
        status: number;
        token?: undefined;
        user?: undefined;
    } | {
        token: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
            partnerId: string;
            partnerSlug: string;
            status: "NEW" | "ACTIVE" | "VIP" | "EXPIRED";
        };
        error?: undefined;
        status?: undefined;
    }>;
    getOtpSettings(): Promise<{
        success: boolean;
        settings: {
            id: string;
            emailOtpEnabled: boolean;
            otpLength: number;
            otpExpiryMinutes: number;
            supportContact: string;
            updatedAt: Date;
        };
    }>;
    updateOtpSettings(body: any): Promise<{
        success: boolean;
        settings: {
            id: string;
            emailOtpEnabled: boolean;
            otpLength: number;
            otpExpiryMinutes: number;
            supportContact: string;
            updatedAt: Date;
        };
    }>;
    requestManualVerification(email: string): Promise<any>;
    activateUser(userId: string): Promise<any>;
    private handleOtpDispatch;
    sendSignupOtp(email: string, partnerSlug?: string, password?: string, firstName?: string, lastName?: string, referralCode?: string): Promise<{
        success: boolean;
        otpSent: boolean;
        error: string;
        status: number;
        message?: undefined;
        userId?: undefined;
        otp?: undefined;
    } | {
        success: boolean;
        otpSent: boolean;
        message: string;
        userId: any;
        otp: string | undefined;
        error?: undefined;
        status?: undefined;
    } | {
        error: any;
        status: number;
        success?: undefined;
        otpSent?: undefined;
        message?: undefined;
        userId?: undefined;
        otp?: undefined;
    }>;
    signup(email: string, password?: string, otp?: string, firstName?: string, lastName?: string, partnerSlug?: string, referralCode?: string): Promise<{
        error: any;
        status: number;
        token?: undefined;
        user?: undefined;
    } | {
        token: string;
        user: {
            id: any;
            name: any;
            email: any;
            role: string;
            partnerId: string;
            partnerSlug: string;
            status: any;
        };
        error?: undefined;
        status?: undefined;
    }>;
}
