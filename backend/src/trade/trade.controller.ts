import { Controller, Get, Post, Body, Req, Res, HttpStatus, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { TradeService } from './trade.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';

@Controller('trade')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER')
export class TradeController {
  constructor(private tradeService: TradeService) {}

  @Get()
  async listTrades(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.tradeService.listTrades(user.id);
      return res.json(result);
    } catch (error: any) {
      console.error('Fetch trades API error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Post('create')
  async createTrade(@Req() req: Request, @Body() body: { pair?: string; type?: string }, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.tradeService.createTrade(user.id, body);

      if ('error' in result) {
        return res.status(result.status || 400).json({ message: result.error });
      }

      return res.json(result);
    } catch (error: any) {
      console.error('Manual trade create API error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Post('close')
  async closeTrade(@Req() req: Request, @Body() body: { tradeId: string }, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.tradeService.closeTrade(user.id, body.tradeId);

      if ('error' in result) {
        return res.status(result.status || 400).json({ message: result.error });
      }

      return res.json(result);
    } catch (error: any) {
      console.error('Manual trade close API error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }
}
