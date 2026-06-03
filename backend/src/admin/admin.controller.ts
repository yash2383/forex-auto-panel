import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Req, Res, HttpStatus, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private authService: AuthService,
  ) {}


  private getClientIp(req: Request): string {
    return (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
  }

  @Get('data')
  @Roles('SUPER_ADMIN', 'MANAGER', 'VIEWER')
  async getData(@Res() res: Response) {
    try {
      const result = await this.adminService.getData();
      return res.json(result);
    } catch (error: any) {
      console.error('Admin data load error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Get('pnl-reports')
  @Roles('SUPER_ADMIN', 'MANAGER', 'VIEWER')
  async getPnlReports(@Res() res: Response) {
    try {
      const result = await this.adminService.getPnlReports();
      return res.json(result);
    } catch (error: any) {
      console.error('Admin pnl reports error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  // --- Users ---

  @Post('users')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async createUser(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.adminService.createUser(user.id, body, this.getClientIp(req));
      if ('error' in result) return res.status(result.status || 400).json({ message: result.error });
      return res.json(result);
    } catch (error: any) {
      console.error('Create user error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Put('users/:id')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async updateUser(@Param('id') id: string, @Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.adminService.updateUser(user.id, id, body, this.getClientIp(req));
      if ('error' in result) return res.status(result.status || 400).json({ message: result.error });
      return res.json(result);
    } catch (error: any) {
      console.error('Update user error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Delete('users/:id')
  @Roles('SUPER_ADMIN')
  async deleteUser(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.adminService.deleteUser(user.id, id, this.getClientIp(req));
      if ('error' in result) return res.status(result.status || 400).json({ message: result.error });
      return res.json(result);
    } catch (error: any) {
      console.error('Delete user error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Get('users/:id')
  @Roles('SUPER_ADMIN', 'MANAGER', 'VIEWER')
  async getUserDetail(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.adminService.getUserDetail(user.id, id);
      if ('error' in result) return res.status(result.status || 400).json({ message: result.error });
      return res.json(result);
    } catch (error: any) {
      console.error('Get user detail error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  // --- Partners ---

  @Post('partners')
  @Roles('SUPER_ADMIN')
  async createPartner(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.adminService.createPartner(user.id, body, this.getClientIp(req));
      if ('error' in result) return res.status(result.status || 400).json({ message: result.error });
      return res.json(result);
    } catch (error: any) {
      console.error('Create partner error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  // --- Plans ---

  @Post('plans')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async createPlan(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.adminService.createPlan(user.id, body, this.getClientIp(req));
      if ('error' in result) return res.status(result.status || 400).json({ message: result.error });
      return res.json(result);
    } catch (error: any) {
      console.error('Create plan error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Put('plans/:id')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async updatePlan(@Param('id') id: string, @Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.adminService.updatePlan(user.id, id, body, this.getClientIp(req));
      if ('error' in result) return res.status(result.status || 400).json({ message: result.error });
      return res.json(result);
    } catch (error: any) {
      console.error('Update plan error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Delete('plans/:id')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async deletePlan(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.adminService.deletePlan(user.id, id, this.getClientIp(req));
      if ('error' in result) return res.status(result.status || 400).json({ message: result.error });
      return res.json(result);
    } catch (error: any) {
      console.error('Delete plan error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  // --- Settings ---

  @Get('settings')
  @Roles('SUPER_ADMIN', 'MANAGER', 'VIEWER')
  async getSettings(@Res() res: Response) {
    try {
      const result = await this.adminService.getSettings();
      return res.json(result);
    } catch (error: any) {
      console.error('Fetch settings error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Post('settings')
  @Roles('SUPER_ADMIN')
  async updateSettings(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.adminService.updateSettings(user.id, body, this.getClientIp(req));
      return res.json(result);
    } catch (error: any) {
      console.error('Save settings error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Get('referral-settings')
  @Roles('SUPER_ADMIN', 'MANAGER', 'VIEWER')
  async getReferralSettings(@Res() res: Response) {
    try {
      const result = await this.adminService.getReferralSettings();
      return res.json(result);
    } catch (error: any) {
      console.error('Fetch referral settings error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Post('referral-settings')
  @Roles('SUPER_ADMIN')
  async updateReferralSettings(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.adminService.updateReferralSettings(user.id, body, this.getClientIp(req));
      return res.json(result);
    } catch (error: any) {
      console.error('Save referral settings error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  // --- Referrals ---

  @Get('referrals')
  @Roles('SUPER_ADMIN', 'MANAGER', 'VIEWER')
  async getReferrals(@Res() res: Response) {
    try {
      const result = await this.adminService.getReferrals();
      return res.json(result);
    } catch (error: any) {
      console.error('Get referrals error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Post('referrals/:id/status')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async updateReferralStatus(@Param('id') id: string, @Body('status') status: string, @Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.adminService.updateReferralStatus(user.id, id, status, this.getClientIp(req));
      if ('error' in result) return res.status(result.status || 400).json({ message: result.error });
      return res.json(result);
    } catch (error: any) {
      console.error('Update referral status error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  // --- Trades ---

  @Get('trades')
  @Roles('SUPER_ADMIN', 'MANAGER', 'VIEWER')
  async getTrades(@Res() res: Response) {
    try {
      const result = await this.adminService.listTradeRecords();
      return res.json(result);
    } catch (error: any) {
      console.error('Get trades error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Post('trades')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async createTradeRecord(@Body() body: any, @Res() res: Response) {
    try {
      const result = await this.adminService.createTradeRecord(body);
      if ('error' in result) return res.status(result.status || 400).json({ message: result.error });
      return res.json(result);
    } catch (error: any) {
      console.error('Create trade record error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Put('trades/:id')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async updateTradeRecord(@Param('id') id: string, @Body() body: any, @Res() res: Response) {
    try {
      const result = await this.adminService.updateTradeRecord(id, body);
      if ('error' in result) return res.status(result.status || 400).json({ message: result.error });
      return res.json(result);
    } catch (error: any) {
      console.error('Update trade record error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Delete('trades/:id')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async deleteTradeRecord(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.adminService.deleteTradeRecord(id);
      if ('error' in result) return res.status(result.status || 400).json({ message: result.error });
      return res.json(result);
    } catch (error: any) {
      console.error('Delete trade record error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Patch('trades/:id/publish')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async publishTradeRecord(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.adminService.setTradeRecordStatus(id, 'published');
      if ('error' in result) return res.status(result.status || 400).json({ message: result.error });
      return res.json(result);
    } catch (error: any) {
      console.error('Publish trade record error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Patch('trades/:id/unpublish')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async unpublishTradeRecord(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.adminService.setTradeRecordStatus(id, 'draft');
      if ('error' in result) return res.status(result.status || 400).json({ message: result.error });
      return res.json(result);
    } catch (error: any) {
      console.error('Unpublish trade record error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  // --- Payments ---

  @Post('payments/:id/approve')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async approvePayment(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.adminService.approvePayment(user.id, id, this.getClientIp(req));
      return res.json(result);
    } catch (error: any) {
      console.error('Approve payment error:', error.message);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Internal server error' });
    }
  }

  @Post('payments/:id/reject')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async rejectPayment(@Param('id') id: string, @Req() req: Request, @Body() body: { remark?: string }, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.adminService.rejectPayment(user.id, id, body.remark || '', this.getClientIp(req));
      if ('error' in result) return res.status(result.status || 400).json({ message: result.error });
      return res.json(result);
    } catch (error: any) {
      console.error('Reject payment error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Post('payments/:id/verify')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async verifyPayment(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.adminService.verifyPayment(user.id, id, this.getClientIp(req));
      if ('error' in result) return res.status(result.status || 400).json({ message: result.error });
      return res.json(result);
    } catch (error: any) {
      console.error('Verify payment error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  // --- Withdrawals ---

  @Get('withdrawals')
  @Roles('SUPER_ADMIN', 'MANAGER', 'VIEWER')
  async listWithdrawals(@Res() res: Response) {
    try {
      const result = await this.adminService.listWithdrawals();
      return res.json(result);
    } catch (error: any) {
      console.error('List withdrawals error:', error.message);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Internal server error' });
    }
  }

  @Get('withdrawals/:id')
  @Roles('SUPER_ADMIN', 'MANAGER', 'VIEWER')
  async getWithdrawalDetail(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.adminService.getWithdrawalDetail(id);
      return res.json(result);
    } catch (error: any) {
      console.error('Get withdrawal details error:', error.message);
      return res.status(HttpStatus.NOT_FOUND).json({ message: error.message || 'Withdrawal not found' });
    }
  }

  @Post('withdrawals/:id/approve')
  @Patch('withdrawals/:id/approve')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async approveWithdrawal(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.adminService.approveWithdrawal(user.id, id, this.getClientIp(req));
      if ('error' in result) return res.status(result.status || 400).json({ message: result.error });
      return res.json(result);
    } catch (error: any) {
      console.error('Approve withdrawal error:', error.message);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Internal server error' });
    }
  }

  @Post('withdrawals/:id/reject')
  @Patch('withdrawals/:id/reject')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async rejectWithdrawal(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.adminService.rejectWithdrawal(user.id, id, this.getClientIp(req));
      if ('error' in result) return res.status(result.status || 400).json({ message: result.error });
      return res.json(result);
    } catch (error: any) {
      console.error('Reject withdrawal error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  // --- Transactions ---

  @Post('transactions/:id/reverse')
  @Roles('SUPER_ADMIN')
  async reverseTransaction(@Param('id') id: string, @Req() req: Request, @Body() body: { reason: string }, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.adminService.reverseTransaction(user.id, id, body.reason, this.getClientIp(req));
      return res.json(result);
    } catch (error: any) {
      console.error('Reverse transaction error:', error.message);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Internal server error' });
    }
  }

  // --- Profit Distributions ---

  @Post('profit-distributions/bulk')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async bulkDistributeProfit(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.adminService.bulkDistributeProfit(user.id, this.getClientIp(req), body);
      if (!result.success) {
        return res.status(result.status || 400).json({ message: result.error });
      }
      return res.json(result);
    } catch (error: any) {
      console.error('Bulk profit distribution error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Post('profit-distributions')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async createProfitDistribution(@Body() body: any, @Res() res: Response) {
    try {
      const result = await this.adminService.createProfitDistribution(body);
      if ('error' in result) return res.status((result as any).status || 400).json({ message: (result as any).error });
      return res.json(result);
    } catch (error: any) {
      console.error('Create profit distribution error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Put('profit-distributions/:id')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async updateProfitDistribution(@Param('id') id: string, @Body() body: any, @Res() res: Response) {
    try {
      const result = await this.adminService.updateProfitDistribution(id, body);
      if ('error' in result) return res.status((result as any).status || 400).json({ message: (result as any).error });
      return res.json(result);
    } catch (error: any) {
      console.error('Update profit distribution error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Delete('profit-distributions/:id')
  @Roles('SUPER_ADMIN')
  async deleteProfitDistribution(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.adminService.deleteProfitDistribution(id);
      return res.json(result);
    } catch (error: any) {
      console.error('Delete profit distribution error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Get('inquiries')
  @Roles('SUPER_ADMIN', 'MANAGER', 'VIEWER')
  async getInquiries(@Res() res: Response) {
    try {
      const result = await this.adminService.getInquiries();
      return res.json(result);
    } catch (error: any) {
      console.error('Get inquiries error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Patch('inquiries/:id/status')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async updateInquiryStatus(@Param('id') id: string, @Body() body: { status: string }, @Res() res: Response) {
    try {
      const result = await this.adminService.updateInquiryStatus(id, body.status);
      if ('error' in result) return res.status((result as any).status || 400).json({ message: (result as any).error });
      return res.json(result);
    } catch (error: any) {
      console.error('Update inquiry status error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  // --- Initiated Payments ---

  @Get('initiated-payments')
  @Roles('SUPER_ADMIN', 'MANAGER', 'VIEWER')
  async getInitiatedPayments(@Res() res: Response) {
    try {
      const result = await this.adminService.getInitiatedPayments();
      return res.json(result);
    } catch (error: any) {
      console.error('Get initiated payments error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Put('initiated-payments/:id')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async updateInitiatedPayment(@Param('id') id: string, @Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.adminService.updateInitiatedPayment(id, body, user.id, this.getClientIp(req));
      if ('error' in result) return res.status(result.status || 400).json({ message: result.error });
      return res.json(result);
    } catch (error: any) {
      console.error('Update initiated payment error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

}

