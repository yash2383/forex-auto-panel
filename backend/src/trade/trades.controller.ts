import { Controller, Get, Req, Res, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { verifyJwt } from '../common/crypto.util';

@Controller('trades')
export class TradesController {
  constructor(private prisma: PrismaService) {}

  @Get('public')
  async getPublicTrades(@Req() req: Request, @Res() res: Response) {
    try {
      const authHeader = req.headers['authorization'];
      let isSubscribed = false;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const payload = verifyJwt(token);
        if (payload) {
          const user = await this.prisma.user.findUnique({
            where: { id: payload.id },
          });
          if (user && (user.status === 'ACTIVE' || user.status === 'VIP')) {
            isSubscribed = true;
          }
        }
      }

      const totalCount = await this.prisma.tradeRecord.count({
        where: { status: 'published' },
      });

      const visibleCount = isSubscribed ? 1000 : 10;

      const trades = await this.prisma.tradeRecord.findMany({
        where: { status: 'published' },
        orderBy: { tradeDate: 'desc' },
        take: visibleCount,
      });

      return res.json({
        trades,
        totalCount,
        visibleCount: Math.min(totalCount, visibleCount),
        isSubscribed,
      });
    } catch (error: any) {
      console.error('Fetch public trades error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Internal server error',
      });
    }
  }
}
