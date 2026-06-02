import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { PlansService } from './plans.service';

@Controller('plans')
export class PlansController {
  constructor(private plansService: PlansService) {}

  @Get()
  async getPlans(@Res() res: Response) {
    try {
      const result = await this.plansService.getActivePlans();
      return res.json(result);
    } catch (error: any) {
      console.error('Fetch active plans error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }
}
