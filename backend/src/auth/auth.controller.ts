import { Controller, Post, Get, Body, Req, Res, HttpStatus, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }, @Req() req: Request, @Res() res: Response) {
    try {
      const { email, password } = body;
      if (!email || !password) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Email and password are required' });
      }

      const clientIp = (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
      const result = await this.authService.login(email, password, clientIp);

      if ('error' in result) {
        return res.status(result.status || 400).json({ message: result.error });
      }

      if (result.otpRequired) {
        return res.json({ otpRequired: true, otpToken: result.otpToken, email: result.email });
      }

      return res.json({ token: result.token, user: result.user });
    } catch (error: any) {
      console.error('Login error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Post('verify-login-otp')
  async verifyLoginOtp(
    @Body() body: { otpToken: string; otp: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const { otpToken, otp } = body;
      if (!otpToken || !otp) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'OTP token and verification code are required' });
      }

      const clientIp = (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
      const result = await this.authService.verifyLoginOtp(otpToken, otp, clientIp);

      if ('error' in result) {
        return res.status(result.status || 400).json({ message: result.error });
      }

      return res.json({ token: result.token, user: result.user });
    } catch (error: any) {
      console.error('Verify login OTP error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Post('send-otp')
  async sendOtp(
    @Body() body: { email: string; partnerSlug?: string },
    @Res() res: Response,
  ) {
    try {
      const { email, partnerSlug } = body;
      if (!email) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Email is required' });
      }

      const result = await this.authService.sendSignupOtp(email, partnerSlug);

      if ('error' in result) {
        return res.status(result.status || 400).json({ message: result.error });
      }

      return res.json(result);
    } catch (error: any) {
      console.error('Send OTP error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Post('signup')
  async signup(
    @Body() body: { email: string; password: string; otp: string; firstName?: string; lastName?: string; partnerSlug?: string; referralCode?: string },
    @Res() res: Response,
  ) {
    try {
      const { email, password, otp, firstName, lastName, partnerSlug, referralCode } = body;
      if (!email || !password || !otp) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Email, password, and verification code are required' });
      }

      const result = await this.authService.signup(email, password, otp, firstName, lastName, partnerSlug, referralCode);

      if ('error' in result) {
        return res.status(result.status || 400).json({ message: result.error });
      }

      return res.json({ token: result.token, user: result.user });
    } catch (error: any) {
      console.error('Signup error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          partnerId: user.partnerId || null,
          partnerSlug: user.partnerSlug || null,
        },
      });
    } catch (error: any) {
      console.error('Auth context error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    // With Bearer token auth, logout is handled client-side by removing the token
    return res.json({ success: true, message: 'Logged out successfully' });
  }
}
