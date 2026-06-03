import { Controller, Get, Post, Body, Req, Res, HttpStatus, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER', 'SUPER_ADMIN', 'MANAGER', 'VIEWER', 'PARTNER')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('data')
  async getData(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.dashboardService.getData(user.id);

      if ('error' in result) {
        return res.status(result.status || 400).json({ message: result.error });
      }

      return res.json(result);
    } catch (error: any) {
      console.error('Dashboard data load error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Post('initiate-payment')
  async initiatePayment(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.dashboardService.initiatePayment(user.id, user.partnerId, body);
      return res.json(result);
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Post('deposit')
  async deposit(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.dashboardService.deposit(user.id, user.partnerId, body);

      if ('error' in result) {
        return res.status(result.status || 400).json({ message: result.error });
      }

      return res.json(result);
    } catch (error: any) {
      console.error('Deposit submission error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Post('withdraw')
  async withdraw(@Req() req: Request, @Body() body: { amount: number }, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.dashboardService.withdraw(user.id, user.partnerId, body.amount);

      if ('error' in result) {
        return res.status(result.status || 400).json({ message: result.error });
      }

      return res.json(result);
    } catch (error: any) {
      console.error('Withdrawal submission error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Post('settings')
  async settings(@Req() req: Request, @Body() body: { autoTrading?: boolean; riskSetting?: string }, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.dashboardService.updateSettings(user.id, body);

      if ('error' in result) {
        return res.status(result.status || 400).json({ message: result.error });
      }

      return res.json(result);
    } catch (error: any) {
      console.error('Settings update error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Get('my-payment-status')
  @Roles('USER')
  async getMyPaymentStatus(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.dashboardService.getMyPaymentStatus(user.id);
      return res.json(result);
    } catch (error: any) {
      console.error('Payment status check error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }
}
