import { Controller, Get, Post, Put, Delete, Body, Param, Res, HttpStatus, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { PlansService } from './plans.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';

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

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'MANAGER')
  async getAllPlans(@Res() res: Response) {
    try {
      const result = await this.plansService.getAllPlans();
      return res.json(result);
    } catch (error: any) {
      console.error('Fetch all plans error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Get('payment-methods')
  async getPaymentMethods(@Res() res: Response) {
    try {
      const result = await this.plansService.getPaymentMethods();
      return res.json(result);
    } catch (error: any) {
      console.error('Fetch payment methods error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Get('slug/:slug')
  async getPlanBySlug(@Param('slug') slug: string, @Res() res: Response) {
    try {
      const result = await this.plansService.getPlanBySlug(slug);
      if (!result) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: 'Plan not found' });
      }
      return res.json(result);
    } catch (error: any) {
      console.error('Fetch plan by slug error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Get(':id')
  async getPlanById(@Param('id') id: string, @Res() res: Response) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (!isUuid) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Invalid plan ID format (UUID expected)' });
      }
      const result = await this.plansService.getPlanById(id);
      if (!result) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: 'Plan not found' });
      }
      return res.json(result);
    } catch (error: any) {
      console.error('Fetch plan by id error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'MANAGER')
  async createPlan(@Body() body: any, @Res() res: Response) {
    try {
      const result = await this.plansService.createPlan(body);
      return res.json(result);
    } catch (error: any) {
      console.error('Create plan error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'MANAGER')
  async updatePlan(@Param('id') id: string, @Body() body: any, @Res() res: Response) {
    try {
      const result = await this.plansService.updatePlan(id, body);
      return res.json(result);
    } catch (error: any) {
      console.error('Update plan error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'MANAGER')
  async deletePlan(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.plansService.deletePlan(id);
      return res.json(result);
    } catch (error: any) {
      console.error('Delete plan error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }
}
