import { Controller, Get, Post, Body, Req, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import type { Request } from 'express';

@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get()
  async getWallet(@Req() req: Request) {
    try {
      const user = (req as any).user;
      return await this.walletService.getWalletData(user.id);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('withdrawals')
  async getWithdrawals(@Req() req: Request) {
    try {
      const user = (req as any).user;
      const withdrawals = await this.walletService.getWithdrawals(user.id);
      return withdrawals.map((w) => {
        let parsedDetails = w.accountDetails;
        try {
          if (w.accountDetails) {
            parsedDetails = JSON.parse(w.accountDetails);
          }
        } catch {
          // ignore parsing error if it's plain string
        }
        return {
          id: w.id,
          withdrawalId: w.withdrawalId,
          amount: Number(w.amount),
          status: w.status,
          method: w.method,
          accountDetails: parsedDetails,
          notes: w.notes,
          createdAt: w.createdAt,
          processedAt: w.processedAt,
        };
      });
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('withdrawals')
  async createWithdrawal(
    @Req() req: Request,
    @Body() body: { amount: number; method: string; accountDetails: any; notes?: string },
  ) {
    try {
      const user = (req as any).user;
      const withdrawal = await this.walletService.createWithdrawal(
        user.id,
        user.partnerId,
        body.amount,
        body.method,
        body.accountDetails,
        body.notes,
      );
      return { success: true, withdrawal };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
