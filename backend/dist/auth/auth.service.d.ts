import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    constructor(prisma: PrismaService);
    login(email: string, password: string, clientIp: string): Promise<{
        error: string;
        status: number;
        token?: undefined;
        user?: undefined;
    } | {
        token: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: import("@prisma/client").$Enums.AdminRole;
            status: "ACTIVE";
            partnerId?: undefined;
            partnerSlug?: undefined;
        };
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
            partnerSlug: string;
            status: "ACTIVE" | "NEW" | "VIP" | "EXPIRED";
        };
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
            partnerSlug?: undefined;
        };
        error?: undefined;
        status?: undefined;
    }>;
    signup(email: string, password: string, firstName?: string, lastName?: string, partnerSlug?: string, referralCode?: string): Promise<{
        error: string;
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
