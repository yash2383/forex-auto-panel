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
        status: string;
        createdAt: Date;
        name: string;
        subject: string;
        updatedAt: Date;
        email: string;
        message: string;
    }>;
}
