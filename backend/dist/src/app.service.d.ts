import { PrismaService } from './prisma/prisma.service';
export declare class AppService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getHello(): string;
    createInquiry(data: {
        name: string;
        email: string;
        subject: string;
        message: string;
    }): Promise<{
        id: string;
        name: string;
        email: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string;
        message: string;
    }>;
}
