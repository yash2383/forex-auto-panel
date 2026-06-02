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
            subtitle: string;
            capitalLabel: string;
            features: string[];
            btnText: string;
            isPopular: boolean;
        }[];
    }>;
}
