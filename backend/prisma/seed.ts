import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/common/crypto.util";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing existing data...");
  await prisma.ledgerEntry.deleteMany();
  await prisma.transactionGroup.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.withdrawal.deleteMany();
  await prisma.trade.deleteMany();
  await prisma.securityEvent.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.user.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.partner.deleteMany();
  await prisma.systemSettings.deleteMany();
  await prisma.plan.deleteMany();

  console.log("Seeding partners...");
  const alphaPartner = await prisma.partner.create({
    data: {
      slug: "alpha-traders",
      name: "AlphaTrade",
      companyName: "Alpha Traders Inc",
      email: "ops@alphatraders.com",
      passwordHash: hashPassword("password123"),
      profitSharePct: 30.00,
      maxAllowedPct: 40.00,
      domain: "alpha.com",
      logo: "AT",
      status: "ACTIVE",
    },
  });

  const betaPartner = await prisma.partner.create({
    data: {
      slug: "beta-markets",
      name: "BetaMarkets",
      companyName: "Beta Markets Ltd",
      email: "admin@betamarkets.com",
      passwordHash: hashPassword("password123"),
      profitSharePct: 25.00,
      maxAllowedPct: 35.00,
      domain: "beta.com",
      logo: "BM",
      status: "ACTIVE",
    },
  });

  const gammaPartner = await prisma.partner.create({
    data: {
      slug: "gamma-fx",
      name: "GammaFX",
      companyName: "Gamma Forex Group",
      email: "hello@gammafx.com",
      passwordHash: hashPassword("password123"),
      profitSharePct: 20.00,
      maxAllowedPct: 30.00,
      domain: "gamma.com",
      logo: "GF",
      status: "ACTIVE",
    },
  });

  const zetaPartner = await prisma.partner.create({
    data: {
      slug: "zeta-invest",
      name: "ZetaInvest",
      companyName: "Zeta Investments",
      email: "hello@zetainvest.com",
      passwordHash: hashPassword("password123"),
      profitSharePct: 18.00,
      maxAllowedPct: 25.00,
      domain: "zeta.com",
      logo: "ZI",
      status: "SUSPENDED",
    },
  });

  console.log("Seeding admins...");
  const harshAdmin = await prisma.admin.create({
    data: {
      name: "Harsh Mehta",
      email: "harsh@nexus.com",
      passwordHash: hashPassword("password123"),
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      permissions: {
        partners: ["view", "create", "edit", "delete"],
        admins: ["view", "create", "edit", "delete"],
        reports: ["view", "create", "edit", "delete"],
      },
    },
  });

  const johnAdmin = await prisma.admin.create({
    data: {
      name: "John Doe",
      email: "john@nexus.com",
      passwordHash: hashPassword("password123"),
      role: "MANAGER",
      status: "ACTIVE",
      permissions: {
        partners: ["view", "create", "edit"],
        admins: ["view"],
        reports: ["view"],
      },
    },
  });

  const sarahAdmin = await prisma.admin.create({
    data: {
      name: "Sarah Jenkins",
      email: "sarah@nexus.com",
      passwordHash: hashPassword("password123"),
      role: "VIEWER",
      status: "ACTIVE",
      permissions: {
        partners: ["view"],
        admins: [],
        reports: ["view"],
      },
    },
  });

  console.log("Seeding users & wallets with initial ledger deposits...");
  const usersToSeed = [
    { name: "Harsh", email: "harsh@mail.com", status: "NEW", balance: 0 },
    { name: "Rahul", email: "rahul@mail.com", status: "ACTIVE", balance: 4067 }, // $49 USD equiv
    { name: "Amit", email: "amit@mail.com", status: "VIP", balance: 83000 },    // $1000 USD equiv
    { name: "Neha", email: "neha@mail.com", status: "ACTIVE", balance: 2407 },   // $29 USD equiv
    { name: "Priya", email: "priya@mail.com", status: "ACTIVE", balance: 41500 }, // $500 USD equiv
    { name: "Sam", email: "sam@mail.com", status: "EXPIRED", balance: 2407 },    // $29 USD equiv
  ];

  const seededUsers = [];
  for (const u of usersToSeed) {
    const user = await prisma.user.create({
      data: {
        partnerId: alphaPartner.id,
        name: u.name,
        email: u.email,
        passwordHash: hashPassword("password123"),
        status: u.status as any,
        referralCode: "SEED" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      },
    });

    await prisma.wallet.create({
      data: {
        userId: user.id,
        realizedBalance: u.balance,
        unrealizedBalance: 0,
        currency: "USD",
      },
    });

    // Create a balanced seed deposit ledger group for audit integrity
    if (u.balance > 0) {
      const group = await prisma.transactionGroup.create({
        data: {
          type: "DEPOSIT",
          description: `SEED | Initial balance deposit for user ${user.email}`,
          idempotencyKey: `SEED_DEPOSIT_${user.id}`,
        },
      });

      await prisma.ledgerEntry.createMany({
        data: [
          {
            transactionGroupId: group.id,
            accountType: "SYSTEM",
            entryType: "DEBIT",
            amount: u.balance,
            currency: "USD",
          },
          {
            transactionGroupId: group.id,
            userId: user.id,
            partnerId: alphaPartner.id,
            accountType: "USER",
            entryType: "CREDIT",
            amount: u.balance,
            currency: "USD",
          },
        ],
      });
    }

    seededUsers.push(user);
  }

  console.log("Seeding payments...");
  const paymentsData = [
    { userIndex: 0, plan: "Premium Monthly", amount: 4067, hash: "USDT-TXN-123456", status: "PENDING" },
    { userIndex: 1, plan: "Basic Monthly", amount: 2407, hash: "USDT-TXN-987654", status: "PENDING" },
    { userIndex: 2, plan: "Premium Yearly", amount: 41417, hash: "TXN1234567890Crypto", status: "PENDING" },
    { userIndex: 3, plan: "Basic Monthly", amount: 2407, hash: "USDT-TXN-112233", status: "PENDING" },
    { userIndex: 4, plan: "Premium Monthly", amount: 4067, hash: "USDT-TXN-778899", status: "PENDING" },
  ];

  for (const p of paymentsData) {
    const targetUser = seededUsers[p.userIndex];
    await prisma.payment.create({
      data: {
        userId: targetUser.id,
        partnerId: alphaPartner.id,
        planName: p.plan,
        amount: p.amount,
        currency: "USD",
        paymentType: "USDT",
        network: "TRC20",
        txnHash: p.hash,
        status: p.status as any,
      },
    });
  }

  console.log("Seeding trades...");
  const tradesData = [
    { userIndex: 1, pair: "BTC/USDT", type: "BUY", entry: 67850, exit: 68900, sl: 67000, tp: 70000, pnl: 1050, status: "CLOSED" },
    { userIndex: 2, pair: "EUR/USD", type: "SELL", entry: 1.0850, exit: 1.0820, sl: 1.0890, tp: 1.0800, pnl: 0.003, status: "CLOSED" },
    { userIndex: 3, pair: "XAU/USD", type: "BUY", entry: 2370, exit: 0, sl: 2350, tp: 2400, pnl: 0, status: "ACTIVE" },
  ];

  for (const t of tradesData) {
    const targetUser = seededUsers[t.userIndex];
    await prisma.trade.create({
      data: {
        userId: targetUser.id,
        partnerId: alphaPartner.id,
        pair: t.pair,
        type: t.type as any,
        entryPrice: t.entry,
        exitPrice: t.exit,
        stopLoss: t.sl,
        target: t.tp,
        profit: t.pnl,
        pnl: t.pnl,
        status: t.status as any,
        quantity: t.entry ? (500 / t.entry) : 0, // Mock quantity for seeded trades
        currentPrice: t.status === "ACTIVE" ? t.entry : t.exit
      },
    });
  }

  console.log("Seeding campaigns...");
  await prisma.campaign.create({
    data: {
      partnerId: alphaPartner.id,
      name: "SUMMER2025",
      slug: "SUMMER2025",
      isActive: true,
    },
  });

  await prisma.campaign.create({
    data: {
      partnerId: alphaPartner.id,
      name: "GOOGLE_ADS",
      slug: "GOOGLE_ADS",
      isActive: true,
    },
  });

  console.log("Seeding settings...");
  await prisma.systemSettings.create({
    data: {
      partnerId: null, // Global setting
      upiId: "tradebot@upi",
      usdtAddress: "TXYZ123ABC456DEF789GHI",
      usdtNetwork: "TRC20",
      referralFeePct: 10.00,
      platformFeePct: 30.00,
      maintenance: false,
    },
  });

  console.log("Seeding plans...");
  await prisma.plan.create({
    data: {
      slug: "club",
      name: "Club Plan",
      subtitle: "Micro Capital",
      capitalLabel: "$10 – $100+ Capital",
      desc: "Perfect for beginners who want to start trading with a small investment and grow over time.",
      features: [
        "Start with as little as $10",
        "Easy for beginners",
        "24/7 automated trading",
        "No trading experience required",
        "Track your portfolio anytime",
        "Increase your investment whenever you want",
        "5% platform fee on deposits from $10–$100",
        "Only 4% platform fee on deposits above $100"
      ],
      btnText: "Get Started",
      status: "Active",
      isPopular: false,
      amount: null,
      pricingType: "FLEXIBLE",
      weeklyProfit: 5,
      durationDays: 30,
      sortOrder: 1,
    },
  });

  await prisma.plan.create({
    data: {
      slug: "individual",
      name: "Individual Plan",
      subtitle: "Advanced",
      capitalLabel: "$1,000+ Capital",
      desc: "Built for traders and investors who want to invest larger amounts and enjoy lower fees.",
      features: [
        "Start with $1,000 or more",
        "Suitable for larger investments",
        "Priority trade execution",
        "Advanced trading features",
        "Detailed performance tracking",
        "Better fee rates for higher deposits",
        "5% platform fee on deposits from $1,000–$9,999.99",
        "Only 4% platform fee on deposits of $10,000 or more",
        "Designed for long-term growth"
      ],
      btnText: "Start Trading",
      status: "Active",
      isPopular: true,
      amount: null,
      pricingType: "FLEXIBLE",
      weeklyProfit: 4,
      durationDays: 365,
      sortOrder: 2,
    },
  });

  await prisma.plan.create({
    data: {
      slug: "custom",
      name: "Custom Plan",
      subtitle: "Flexible / Tailored",
      capitalLabel: "Custom Pricing",
      desc: "Need a personalized setup? Get a custom trading plan based on your capital, execution preference, and performance goals.",
      features: ["Customized profit fee structure", "Dedicated execution optimization", "Priority execution & support", "Scalable capital management"],
      btnText: "Contact Us",
      status: "Active",
      isPopular: false,
      amount: null,
      pricingType: "FLEXIBLE",
      weeklyProfit: 5,
      durationDays: 30,
      sortOrder: 3,
    },
  });

  console.log("Seeding security log...");
  await prisma.securityEvent.create({
    data: {
      adminId: harshAdmin.id,
      action: "SEED_COMPLETE",
      reason: "Successfully seeded default database dataset with complete balanced ledger logs",
      ipAddress: "127.0.0.1",
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
