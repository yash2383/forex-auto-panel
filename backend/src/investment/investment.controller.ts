import { Controller, Get, Post, Patch, Delete, Body, Param, Req, Res, HttpStatus, UseGuards, Query } from '@nestjs/common';
import type { Request, Response } from 'express';
import { InvestmentService } from './investment.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';

@Controller()
export class InvestmentController {
  constructor(private investmentService: InvestmentService) {}

  // ==========================================
  // ADMIN PLAN ENDPOINTS
  // ==========================================

  @Get('admin/investment-plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'MANAGER', 'VIEWER')
  async getPlansAdmin(@Query('partnerId') partnerId: string, @Res() res: Response) {
    try {
      if (!partnerId) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'partnerId is required.' });
      }
      const result = await this.investmentService.getPlansAdmin(partnerId);
      return res.json(result);
    } catch (error: any) {
      console.error('Fetch admin investment plans error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Get('admin/investment-plans/:id/investors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'MANAGER', 'VIEWER')
  async getPlanInvestors(@Param('id') planId: string, @Res() res: Response) {
    try {
      const result = await this.investmentService.getPlanInvestors(planId);
      return res.json(result);
    } catch (error: any) {
      console.error('Fetch plan investors error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Post('admin/investment-plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'MANAGER')
  async createPlan(@Body() body: any, @Res() res: Response) {
    try {
      const { partnerId, name, description, image, minAmount, maxAmount, weeklyProfit, lockPeriod, referralBonus, status } = body;
      if (!partnerId || !name || minAmount === undefined || maxAmount === undefined || weeklyProfit === undefined || lockPeriod === undefined || referralBonus === undefined) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Missing required fields.' });
      }

      const result = await this.investmentService.createPlan(partnerId, {
        name,
        description,
        image,
        minAmount: Number(minAmount),
        maxAmount: Number(maxAmount),
        weeklyProfit: Number(weeklyProfit),
        lockPeriod: Number(lockPeriod),
        referralBonus: Number(referralBonus),
        status,
      });

      return res.json({ success: true, plan: result });
    } catch (error: any) {
      console.error('Create investment plan error:', error);
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json({ message: error.message || 'Internal server error' });
    }
  }

  @Patch('admin/investment-plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'MANAGER')
  async updatePlan(@Param('id') planId: string, @Body() body: any, @Res() res: Response) {
    try {
      const result = await this.investmentService.updatePlan(planId, body);
      return res.json({ success: true, plan: result });
    } catch (error: any) {
      console.error('Update investment plan error:', error);
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json({ message: error.message || 'Internal server error' });
    }
  }

  @Delete('admin/investment-plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'MANAGER')
  async deletePlan(@Param('id') planId: string, @Res() res: Response) {
    try {
      const result = await this.investmentService.deletePlan(planId);
      return res.json(result);
    } catch (error: any) {
      console.error('Delete investment plan error:', error);
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json({ message: error.message || 'Internal server error' });
    }
  }

  // ==========================================
  // USER INVESTMENT ENDPOINTS
  // ==========================================

  @Get('investments/plans')
  @UseGuards(JwtAuthGuard)
  async getActivePlansUser(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.investmentService.getActivePlansUser(user.partnerId);
      return res.json(result);
    } catch (error: any) {
      console.error('Fetch active plans error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Get('investments/active')
  @UseGuards(JwtAuthGuard)
  async getUserInvestments(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.investmentService.getUserInvestments(user.id);
      return res.json(result);
    } catch (error: any) {
      console.error('Fetch user investments error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Post('investments')
  @UseGuards(JwtAuthGuard)
  async createInvestment(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const { planId, amount } = body;

      if (!planId || amount === undefined) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'planId and amount are required.' });
      }

      const result = await this.investmentService.createInvestment(
        user.id,
        user.partnerId,
        planId,
        Number(amount),
      );

      return res.json(result);
    } catch (error: any) {
      console.error('Create user investment error:', error);
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json({ message: error.message || 'Internal server error' });
    }
  }
}
