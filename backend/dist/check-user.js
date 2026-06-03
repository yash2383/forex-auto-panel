"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const user = await prisma.user.findFirst({
        where: { email: 'harsh@nexus.com' },
        include: {
            referredUsers: true,
            investments: true,
        }
    });
    console.log('User harsh@nexus.com:', JSON.stringify(user, null, 2));
    const settings = await prisma.referralSettings.findFirst();
    console.log('Referral Settings:', settings);
    const referrals = await prisma.referral.findMany({
        where: { referredId: user?.id }
    });
    console.log('Referrals for user:', referrals);
}
main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=check-user.js.map