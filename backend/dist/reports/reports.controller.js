"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("./reports.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
let ReportsController = class ReportsController {
    reportsService;
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async getSummary(req, res) {
        try {
            const user = req.user;
            const data = await this.reportsService.getReportSummary(user.id);
            return res.json(data);
        }
        catch (e) {
            console.error('Reports summary error:', e);
            return res
                .status(common_1.HttpStatus.INTERNAL_SERVER_ERROR)
                .json({ message: 'Internal server error' });
        }
    }
    async getTradingReport(res) {
        try {
            const data = await this.reportsService.getTradingReport();
            return res.json(data);
        }
        catch (e) {
            console.error('Trading report error:', e);
            return res
                .status(common_1.HttpStatus.INTERNAL_SERVER_ERROR)
                .json({ message: 'Internal server error' });
        }
    }
    async getProfitReport(req, res) {
        try {
            const user = req.user;
            const data = await this.reportsService.getProfitReport(user.id);
            return res.json(data);
        }
        catch (e) {
            console.error('Profit report error:', e);
            return res
                .status(common_1.HttpStatus.INTERNAL_SERVER_ERROR)
                .json({ message: 'Internal server error' });
        }
    }
    async getPnlDistribution(res) {
        try {
            const data = await this.reportsService.getPnlDistribution();
            return res.json(data);
        }
        catch (e) {
            console.error('PnL Distribution error:', e);
            return res
                .status(common_1.HttpStatus.INTERNAL_SERVER_ERROR)
                .json({ message: 'Internal server error' });
        }
    }
    async getMonthlyPnl(res) {
        try {
            const data = await this.reportsService.getMonthlyPnl();
            return res.json(data);
        }
        catch (e) {
            console.error('Monthly PnL error:', e);
            return res
                .status(common_1.HttpStatus.INTERNAL_SERVER_ERROR)
                .json({ message: 'Internal server error' });
        }
    }
    async getWalletStatement(req, res) {
        try {
            const user = req.user;
            const data = await this.reportsService.getWalletStatement(user.id);
            return res.json(data);
        }
        catch (e) {
            console.error('Wallet statement error:', e);
            return res
                .status(common_1.HttpStatus.INTERNAL_SERVER_ERROR)
                .json({ message: 'Internal server error' });
        }
    }
    async getTaxSummary(req, res) {
        try {
            const user = req.user;
            const data = await this.reportsService.getTaxSummary(user.id);
            return res.json(data);
        }
        catch (e) {
            console.error('Tax summary error:', e);
            return res
                .status(common_1.HttpStatus.INTERNAL_SERVER_ERROR)
                .json({ message: 'Internal server error' });
        }
    }
    async getHistory(req, res) {
        try {
            const user = req.user;
            const data = await this.reportsService.getReportHistory(user.id);
            return res.json(data);
        }
        catch (e) {
            console.error('Report history error:', e);
            return res
                .status(common_1.HttpStatus.INTERNAL_SERVER_ERROR)
                .json({ message: 'Internal server error' });
        }
    }
    async downloadReport(req, res, id) {
        try {
            const user = req.user;
            const isAdmin = ['SUPER_ADMIN', 'MANAGER', 'VIEWER'].includes(user.role);
            const report = await this.reportsService.prisma.generatedReport.findUnique({
                where: { id },
                include: { user: true },
            });
            if (!report) {
                return res.status(common_1.HttpStatus.NOT_FOUND).json({ message: 'Report not found' });
            }
            if (!isAdmin && report.userId !== user.id) {
                return res.status(common_1.HttpStatus.FORBIDDEN).json({ message: 'Access denied' });
            }
            const reportType = report.reportType.toLowerCase();
            const isPdf = report.fileName.toLowerCase().endsWith('.pdf');
            if (isPdf) {
                const { buffer, fileName } = await this.reportsService.generatePdfBuffer(report.userId, reportType, report.user?.name || 'User');
                res.set({
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${fileName}"`,
                    'Content-Length': buffer.length,
                });
                return res.end(buffer);
            }
            else {
                const { buffer, fileName } = await this.reportsService.generateCsvBuffer(report.userId, reportType);
                res.set({
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="${fileName}"`,
                    'Content-Length': buffer.length,
                });
                return res.end(buffer);
            }
        }
        catch (e) {
            console.error('Download report error:', e);
            return res
                .status(common_1.HttpStatus.INTERNAL_SERVER_ERROR)
                .json({ message: e.message || 'Download failed' });
        }
    }
    async exportReport(req, res, type, format, userId) {
        try {
            const user = req.user;
            let targetUserId = user.id;
            let targetUserName = user.name || 'User';
            const isAdmin = ['SUPER_ADMIN', 'MANAGER', 'VIEWER'].includes(user.role);
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
                const { buffer, fileName } = await this.reportsService.generatePdfBuffer(targetUserId, reportType, targetUserName);
                await this.reportsService.saveReportRecord(targetUserId, fileName, reportType.toUpperCase(), `/reports/${fileName}`);
                res.set({
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${fileName}"`,
                    'Content-Length': buffer.length,
                });
                return res.end(buffer);
            }
            const { buffer, fileName } = await this.reportsService.generateCsvBuffer(targetUserId, reportType);
            await this.reportsService.saveReportRecord(targetUserId, fileName, reportType.toUpperCase(), `/reports/${fileName}`);
            res.set({
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Length': buffer.length,
            });
            return res.end(buffer);
        }
        catch (e) {
            console.error('Export report error:', e);
            return res
                .status(common_1.HttpStatus.INTERNAL_SERVER_ERROR)
                .json({ message: e.message || 'Export failed' });
        }
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('trading'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getTradingReport", null);
__decorate([
    (0, common_1.Get)('profit'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getProfitReport", null);
__decorate([
    (0, common_1.Get)('pnl/distribution'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getPnlDistribution", null);
__decorate([
    (0, common_1.Get)('pnl/monthly'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getMonthlyPnl", null);
__decorate([
    (0, common_1.Get)('wallet'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getWalletStatement", null);
__decorate([
    (0, common_1.Get)('tax'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getTaxSummary", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)('download/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "downloadReport", null);
__decorate([
    (0, common_1.Get)('export'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)('type')),
    __param(3, (0, common_1.Query)('format')),
    __param(4, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportReport", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('USER', 'SUPER_ADMIN', 'MANAGER', 'VIEWER', 'PARTNER'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map