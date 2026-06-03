import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from './otp.service';
export declare class AuthService {
    private prisma;
    private otpService;
    constructor(prisma: PrismaService, otpService: OtpService);
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
            status: "ACTIVE" | "NEW" | "VIP" | "EXPIRED";
        };
        error?: undefined;
        status?: undefined;
    }>;
    sendSignupOtp(email: string, partnerSlug?: string): Promise<{
        success: boolean;
        message: string;
        otp: string | undefined;
        error?: undefined;
        status?: undefined;
    } | {
        error: any;
        status: number;
        success?: undefined;
        message?: undefined;
        otp?: undefined;
    }>;
    signup(email: string, password: string, otp: string, firstName?: string, lastName?: string, partnerSlug?: string, referralCode?: string): Promise<{
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
