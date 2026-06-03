"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const userId = "a9629179-fc76-4c53-af22-a659eb8ac041";
    console.log('Starting transaction simulation for user ID:', userId);
    await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
            where: { id: userId },
        });
        if (!user)
            throw new Error('User not found');
        console.log('User found in tx:', user.email);
        const updated = await tx.user.update({
            where: { id: userId },
            data: {
                isVerified: true,
                status: 'ACTIVE',
            },
        });
        console.log('User updated to ACTIVE in tx');
        console.log('ReferredBy:', user.referredBy);
        if (user.referredBy) {
            console.log('Processing referral...');
        }
        console.log('Done transaction simulation successfully!');
        return updated;
    });
}
main()
    .catch((e) => {
    console.error('TRANSACTION ERROR STACK TRACE:');
    console.error(e);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=test-activate.js.map