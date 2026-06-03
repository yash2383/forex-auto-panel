import { PrismaService } from '../prisma/prisma.service';
export declare class PlansService {
    private prisma;
    constructor(prisma: PrismaService);
    getActivePlans(): Promise<{
        plans: {
            id: string;
            name: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            desc: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            subtitle: string;
            capitalLabel: string;
            features: string[];
            btnText: string;
            isPopular: boolean;
            weeklyProfit: import("@prisma/client/runtime/library").Decimal;
            durationDays: number;
            sortOrder: number;
            isActive: boolean;
        }[];
    }>;
    getAllPlans(): Promise<{
        plans: {
            id: string;
            name: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            desc: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            subtitle: string;
            capitalLabel: string;
            features: string[];
            btnText: string;
            isPopular: boolean;
            weeklyProfit: import("@prisma/client/runtime/library").Decimal;
            durationDays: number;
            sortOrder: number;
            isActive: boolean;
        }[];
    }>;
    createPlan(data: any): Promise<{
        plan: {
            id: string;
            name: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            desc: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            subtitle: string;
            capitalLabel: string;
            features: string[];
            btnText: string;
            isPopular: boolean;
            weeklyProfit: import("@prisma/client/runtime/library").Decimal;
            durationDays: number;
            sortOrder: number;
            isActive: boolean;
        };
    }>;
    updatePlan(id: string, data: any): Promise<{
        plan: {
            id: string;
            name: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            desc: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            subtitle: string;
            capitalLabel: string;
            features: string[];
            btnText: string;
            isPopular: boolean;
            weeklyProfit: import("@prisma/client/runtime/library").Decimal;
            durationDays: number;
            sortOrder: number;
            isActive: boolean;
        };
    }>;
    deletePlan(id: string): Promise<{
        plan: {
            id: string;
            name: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            desc: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            subtitle: string;
            capitalLabel: string;
            features: string[];
            btnText: string;
            isPopular: boolean;
            weeklyProfit: import("@prisma/client/runtime/library").Decimal;
            durationDays: number;
            sortOrder: number;
            isActive: boolean;
        };
    }>;
}
