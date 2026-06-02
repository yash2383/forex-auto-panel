import { Controller, Get, Patch, Body, Req, Res, HttpStatus, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';

@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER')
export class UserController {
  constructor(private userService: UserService) {}

  /**
   * GET /api/user/profile
   * Returns full profile with wallet balance and active plan in single payload
   */
  @Get('profile')
  async getProfile(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.userService.getProfile(user.id);

      if ('error' in result) {
        return res.status((result as any).status || 400).json({ message: (result as any).error });
      }

      return res.json(result);
    } catch (error: any) {
      console.error('Profile fetch error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  /**
   * PATCH /api/user/profile
   * Update profile fields (name)
   */
  @Patch('profile')
  async updateProfile(@Req() req: Request, @Body() body: { name?: string }, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.userService.updateProfile(user.id, body);

      if ('error' in result) {
        return res.status((result as any).status || 400).json({ message: (result as any).error });
      }

      return res.json(result);
    } catch (error: any) {
      console.error('Profile update error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  /**
   * GET /api/user/payments
   * Returns all payment records — same source of truth as admin dashboard
   */
  @Get('payments')
  async getPayments(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.userService.getPayments(user.id);
      return res.json(result);
    } catch (error: any) {
      console.error('Payments fetch error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  /**
   * GET /api/user/subscription
   * Returns computed subscription status with dynamic expiry
   */
  @Get('subscription')
  async getSubscription(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.userService.getSubscription(user.id);
      return res.json(result);
    } catch (error: any) {
      console.error('Subscription fetch error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  /**
   * PATCH /api/user/password
   * Change password with current password verification
   */
  @Patch('password')
  async changePassword(
    @Req() req: Request,
    @Body() body: { currentPassword: string; newPassword: string; confirmPassword: string },
    @Res() res: Response,
  ) {
    try {
      const user = (req as any).user;
      const result = await this.userService.changePassword(
        user.id,
        body.currentPassword,
        body.newPassword,
        body.confirmPassword,
      );

      if ('error' in result) {
        return res.status((result as any).status || 400).json({ message: (result as any).error });
      }

      return res.json(result);
    } catch (error: any) {
      console.error('Password change error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  // --- Referrals ---

  @Get('referrals/stats')
  async getReferralStats(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.userService.getReferralStats(user.id);
      if ('error' in result) return res.status(result.status || 400).json({ message: result.error });
      return res.json(result);
    } catch (error: any) {
      console.error('Fetch referral stats error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Get('referrals')
  async getReferrals(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.userService.getReferrals(user.id);
      return res.json(result);
    } catch (error: any) {
      console.error('Fetch referrals error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Get('referrals/earnings')
  async getReferralEarnings(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.userService.getReferralEarnings(user.id);
      return res.json(result);
    } catch (error: any) {
      console.error('Fetch referral earnings error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }
}
