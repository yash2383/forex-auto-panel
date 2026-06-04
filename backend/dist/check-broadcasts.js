"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const broadcasts = await prisma.notificationBroadcast.findMany({
        include: {
            channels: true,
            execution: true,
        },
    });
    console.log(JSON.stringify(broadcasts, null, 2));
}
main()
    .catch(e => {
    console.error(e);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=check-broadcasts.js.map