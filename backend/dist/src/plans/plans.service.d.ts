import { PrismaService } from '../prisma/prisma.service';
export declare class PlansService {
    private prisma;
    constructor(prisma: PrismaService);
    private slugify;
    private serializePlan;
    getActivePlans(): Promise<{
        plans: any[];
    }>;
    getPlanById(id: string): Promise<{
        plan: any;
    } | null>;
    getPlanBySlug(slug: string): Promise<{
        plan: any;
    } | null>;
    getPaymentMethods(): Promise<{
        success: boolean;
        methods: ({
            key: string;
            enabled: boolean;
            walletAddress: string;
            network: string;
            usdtQrCode: string;
            upiId?: undefined;
            upiName?: undefined;
            upiQrCode?: undefined;
        } | {
            key: string;
            enabled: boolean;
            upiId: string;
            upiName: string;
            upiQrCode: string;
            walletAddress?: undefined;
            network?: undefined;
            usdtQrCode?: undefined;
        })[];
    }>;
    getAllPlans(): Promise<{
        plans: {
            id: string;
            status: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            desc: string;
            weeklyProfit: import("@prisma/client/runtime/library").Decimal;
            amount: import("@prisma/client/runtime/library").Decimal | null;
            isActive: boolean;
            slug: string;
            subtitle: string;
            capitalLabel: string;
            features: string[];
            btnText: string;
            isPopular: boolean;
            pricingType: string;
            durationDays: number;
            sortOrder: number;
        }[];
    }>;
    createPlan(data: any): Promise<{
        plan: {
            id: string;
            status: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            desc: string;
            weeklyProfit: import("@prisma/client/runtime/library").Decimal;
            amount: import("@prisma/client/runtime/library").Decimal | null;
            isActive: boolean;
            slug: string;
            subtitle: string;
            capitalLabel: string;
            features: string[];
            btnText: string;
            isPopular: boolean;
            pricingType: string;
            durationDays: number;
            sortOrder: number;
        };
    }>;
    updatePlan(id: string, data: any): Promise<{
        plan: {
            id: string;
            status: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            desc: string;
            weeklyProfit: import("@prisma/client/runtime/library").Decimal;
            amount: import("@prisma/client/runtime/library").Decimal | null;
            isActive: boolean;
            slug: string;
            subtitle: string;
            capitalLabel: string;
            features: string[];
            btnText: string;
            isPopular: boolean;
            pricingType: string;
            durationDays: number;
            sortOrder: number;
        };
    }>;
    deletePlan(id: string): Promise<{
        plan: {
            id: string;
            status: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            desc: string;
            weeklyProfit: import("@prisma/client/runtime/library").Decimal;
            amount: import("@prisma/client/runtime/library").Decimal | null;
            isActive: boolean;
            slug: string;
            subtitle: string;
            capitalLabel: string;
            features: string[];
            btnText: string;
            isPopular: boolean;
            pricingType: string;
            durationDays: number;
            sortOrder: number;
        };
    }>;
}
