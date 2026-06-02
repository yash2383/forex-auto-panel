import { Controller, Get, Post, Put, Delete, Body, Param, Req, Res, HttpStatus, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

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

  // --- Trades ---

  @Post('trades')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async createTrade(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.adminService.createTrade(user.id, body, this.getClientIp(req));
      if ('error' in result) return res.status(result.status || 400).json({ message: result.error });
      return res.json(result);
    } catch (error: any) {
      console.error('Create trade error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Post('trades/:id/close')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async closeTrade(@Param('id') id: string, @Req() req: Request, @Body() body: { exitPrice?: number }, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.adminService.closeTrade(user.id, id, body.exitPrice, this.getClientIp(req));
      if ('error' in result) return res.status(result.status || 400).json({ message: result.error });
      return res.json(result);
    } catch (error: any) {
      console.error('Close trade error:', error);
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

  @Post('withdrawals/:id/approve')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async approveWithdrawal(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.adminService.approveWithdrawal(user.id, id, this.getClientIp(req));
      return res.json(result);
    } catch (error: any) {
      console.error('Approve withdrawal error:', error.message);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Internal server error' });
    }
  }

  @Post('withdrawals/:id/reject')
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
}
