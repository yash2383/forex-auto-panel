import { PrismaService } from '../prisma/prisma.service';
export declare class PlansService {
    private prisma;
    constructor(prisma: PrismaService);
    getActivePlans(): Promise<{
        plans: {
            id: string;
            status: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            desc: string;
            weeklyProfit: import("@prisma/client/runtime/library").Decimal;
            isActive: boolean;
            amount: import("@prisma/client/runtime/library").Decimal;
            subtitle: string;
            capitalLabel: string;
            features: string[];
            btnText: string;
            isPopular: boolean;
            durationDays: number;
            sortOrder: number;
        }[];
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
            isActive: boolean;
            amount: import("@prisma/client/runtime/library").Decimal;
            subtitle: string;
            capitalLabel: string;
            features: string[];
            btnText: string;
            isPopular: boolean;
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
            isActive: boolean;
            amount: import("@prisma/client/runtime/library").Decimal;
            subtitle: string;
            capitalLabel: string;
            features: string[];
            btnText: string;
            isPopular: boolean;
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
            isActive: boolean;
            amount: import("@prisma/client/runtime/library").Decimal;
            subtitle: string;
            capitalLabel: string;
            features: string[];
            btnText: string;
            isPopular: boolean;
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
            isActive: boolean;
            amount: import("@prisma/client/runtime/library").Decimal;
            subtitle: string;
            capitalLabel: string;
            features: string[];
            btnText: string;
            isPopular: boolean;
            durationDays: number;
            sortOrder: number;
        };
    }>;
}
