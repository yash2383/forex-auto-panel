import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
  HttpStatus,
  Param,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER', 'SUPER_ADMIN', 'MANAGER', 'VIEWER', 'PARTNER')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('summary')
  async getSummary(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const data = await this.reportsService.getReportSummary(user.id);
      return res.json(data);
    } catch (e: any) {
      console.error('Reports summary error:', e);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Get('trading')
  async getTradingReport(@Res() res: Response) {
    try {
      const data = await this.reportsService.getTradingReport();
      return res.json(data);
    } catch (e: any) {
      console.error('Trading report error:', e);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Get('profit')
  async getProfitReport(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const data = await this.reportsService.getProfitReport(user.id);
      return res.json(data);
    } catch (e: any) {
      console.error('Profit report error:', e);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Get('pnl/distribution')
  async getPnlDistribution(@Res() res: Response) {
    try {
      const data = await this.reportsService.getPnlDistribution();
      return res.json(data);
    } catch (e: any) {
      console.error('PnL Distribution error:', e);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Get('pnl/monthly')
  async getMonthlyPnl(@Res() res: Response) {
    try {
      const data = await this.reportsService.getMonthlyPnl();
      return res.json(data);
    } catch (e: any) {
      console.error('Monthly PnL error:', e);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Get('wallet')
  async getWalletStatement(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const data = await this.reportsService.getWalletStatement(user.id);
      return res.json(data);
    } catch (e: any) {
      console.error('Wallet statement error:', e);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Get('tax')
  async getTaxSummary(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const data = await this.reportsService.getTaxSummary(user.id);
      return res.json(data);
    } catch (e: any) {
      console.error('Tax summary error:', e);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Get('history')
  async getHistory(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const data = await this.reportsService.getReportHistory(user.id);
      return res.json(data);
    } catch (e: any) {
      console.error('Report history error:', e);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Get('download/:id')
  async downloadReport(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    try {
      const user = (req as any).user;
      const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'MANAGER', 'VIEWER']);
      const isAdmin = ADMIN_ROLES.has(user.role);

      const report =
        await this.reportsService.prisma.generatedReport.findUnique({
          where: { id },
          include: { user: true },
        });

      if (!report) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: 'Report not found' });
      }

      if (!isAdmin && report.userId !== user.id) {
        return res
          .status(HttpStatus.FORBIDDEN)
          .json({ message: 'Access denied' });
      }

      const reportType = report.reportType.toLowerCase();
      const isPdf = report.fileName.toLowerCase().endsWith('.pdf');

      if (isPdf) {
        const { buffer, fileName } =
          await this.reportsService.generatePdfBuffer(
            report.userId,
            reportType,
            report.user?.name || 'User',
          );

        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': buffer.length,
        });
        return res.end(buffer);
      } else {
        const { buffer, fileName } =
          await this.reportsService.generateCsvBuffer(
            report.userId,
            reportType,
          );

        res.set({
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': buffer.length,
        });
        return res.end(buffer);
      }
    } catch (e: any) {
      console.error('Download report error:', e);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: e.message || 'Download failed' });
    }
  }

  /**
   * GET /api/reports/export?type=trading&format=csv
   * GET /api/reports/export?type=trading&format=pdf
   */
  @Get('export')
  async exportReport(
    @Req() req: Request,
    @Res() res: Response,
    @Query('type') type: string,
    @Query('format') format: string,
    @Query('userId') userId?: string,
  ) {
    try {
      const user = (req as any).user;
      let targetUserId = user.id;
      let targetUserName = user.name || 'User';

      const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'MANAGER', 'VIEWER']);
      const isAdmin = ADMIN_ROLES.has(user.role);
      if (isAdmin && userId) {
        targetUserId = userId;
        const targetUser = await this.reportsService.prisma.user.findUnique({
          where: { id: targetUserId },
        });
        if (targetUser) {
          targetUserName = targetUser.name || 'User';
        }
      }

      const reportType = (type || 'trading').toLowerCase();
      const reportFormat = (format || 'csv').toLowerCase();

      if (reportFormat === 'pdf') {
        const { buffer, fileName } =
          await this.reportsService.generatePdfBuffer(
            targetUserId,
            reportType,
            targetUserName,
          );

        // Persist record
        await this.reportsService.saveReportRecord(
          targetUserId,
          fileName,
          reportType.toUpperCase(),
          `/reports/${fileName}`,
        );

        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': buffer.length,
        });
        return res.end(buffer);
      }

      // Default: CSV
      const { buffer, fileName } = await this.reportsService.generateCsvBuffer(
        targetUserId,
        reportType,
      );

      // Persist record
      await this.reportsService.saveReportRecord(
        targetUserId,
        fileName,
        reportType.toUpperCase(),
        `/reports/${fileName}`,
      );

      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length,
      });
      return res.end(buffer);
    } catch (e: any) {
      console.error('Export report error:', e);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: e.message || 'Export failed' });
    }
  }
}
