import { PrismaService } from '../prisma/prisma.service';
export declare class InvestmentService {
    private prisma;
    constructor(prisma: PrismaService);
    getPlansAdmin(partnerId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        image: string | null;
        minAmount: number;
        maxAmount: number;
        weeklyProfit: number;
        lockPeriod: number;
        referralBonus: number;
        status: boolean;
        investorsCount: number;
        totalInvested: number;
        weeklyLiability: number;
        createdAt: Date;
    }[]>;
    getPlanInvestors(planId: string): Promise<{
        id: string;
        amount: number;
        profitRate: number;
        startDate: Date;
        nextProfitDate: Date;
        status: import("@prisma/client").$Enums.InvestmentStatus;
        userName: string;
        userEmail: string;
        createdAt: Date;
    }[]>;
    createPlan(partnerId: string, data: {
        name: string;
        description?: string;
        image?: string;
        minAmount: number;
        maxAmount: number;
        weeklyProfit: number;
        lockPeriod: number;
        referralBonus: number;
        status?: boolean;
    }): Promise<{
        id: string;
        name: string;
        status: boolean;
        createdAt: Date;
        updatedAt: Date;
        partnerId: string;
        weeklyProfit: import("@prisma/client/runtime/library").Decimal;
        description: string | null;
        image: string | null;
        minAmount: import("@prisma/client/runtime/library").Decimal;
        maxAmount: import("@prisma/client/runtime/library").Decimal;
        lockPeriod: number;
        referralBonus: import("@prisma/client/runtime/library").Decimal;
    }>;
    updatePlan(planId: string, data: {
        name?: string;
        description?: string;
        image?: string;
        minAmount?: number;
        maxAmount?: number;
        weeklyProfit?: number;
        lockPeriod?: number;
        referralBonus?: number;
        status?: boolean;
    }): Promise<{
        id: string;
        name: string;
        status: boolean;
        createdAt: Date;
        updatedAt: Date;
        partnerId: string;
        weeklyProfit: import("@prisma/client/runtime/library").Decimal;
        description: string | null;
        image: string | null;
        minAmount: import("@prisma/client/runtime/library").Decimal;
        maxAmount: import("@prisma/client/runtime/library").Decimal;
        lockPeriod: number;
        referralBonus: import("@prisma/client/runtime/library").Decimal;
    }>;
    deletePlan(planId: string): Promise<{
        success: boolean;
    }>;
    getActivePlansUser(partnerId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        image: string | null;
        minAmount: number;
        maxAmount: number;
        weeklyProfit: number;
        lockPeriod: number;
        referralBonus: number;
        status: boolean;
    }[]>;
    getUserInvestments(userId: string): Promise<{
        id: string;
        planName: string;
        amount: number;
        profitRate: number;
        startDate: Date;
        nextProfitDate: Date;
        status: import("@prisma/client").$Enums.InvestmentStatus;
        createdAt: Date;
    }[]>;
    createInvestment(userId: string, partnerId: string, planId: string, amount: number): Promise<{
        success: boolean;
        investment: {
            id: any;
            amount: number;
            profitRate: number;
            startDate: any;
            nextProfitDate: any;
            status: any;
        };
    }>;
}
