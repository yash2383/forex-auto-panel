import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      console.log("OnModuleInit: Migrating database plans copy and sort orders to new specifications...");
      
      // Update Club Plan
      const clubPlan = await this.prisma.plan.findFirst({
        where: { slug: 'club' },
      });
      if (clubPlan) {
        await this.prisma.plan.update({
          where: { id: clubPlan.id },
          data: {
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
            pricingType: "FLEXIBLE",
            amount: null,
            sortOrder: 1,
          },
        });
      }

      // Update Individual Plan
      const individualPlan = await this.prisma.plan.findFirst({
        where: { slug: 'individual' },
      });
      if (individualPlan) {
        await this.prisma.plan.update({
          where: { id: individualPlan.id },
          data: {
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
            pricingType: "FLEXIBLE",
            amount: null,
            sortOrder: 2,
          },
        });
      }

      // Update Custom Plan
      const customPlan = await this.prisma.plan.findFirst({
        where: { slug: 'custom' },
      });
      if (customPlan) {
        await this.prisma.plan.update({
          where: { id: customPlan.id },
          data: {
            sortOrder: 3,
          },
        });
      }
    } catch (err) {
      console.error("Failed to migrate database plans on startup:", err);
    }
  }

  getHello(): string {
    return 'Hello World!';
  }

  async createInquiry(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) {
    return this.prisma.inquiry.create({
      data: {
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
      },
    });
  }
}
