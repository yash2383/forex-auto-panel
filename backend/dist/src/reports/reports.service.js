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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const PDFDocument = require('pdfkit');
let ReportsService = class ReportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getReportSummary(userId) {
        const [tradeRecords, distributions, wallet, payments, withdrawals] = await Promise.all([
            this.prisma.tradeRecord.findMany({ where: { status: 'published' } }),
            this.prisma.profitDistribution.findMany({ where: { userId } }),
            this.prisma.wallet.findUnique({ where: { userId } }),
            this.prisma.payment.findMany({ where: { userId, status: 'APPROVED' } }),
            this.prisma.withdrawal.findMany({
                where: { userId, status: 'APPROVED' },
            }),
        ]);
        const totalTrades = tradeRecords.length;
        const wins = tradeRecords.filter((t) => t.result === 'WIN').length;
        const winRate = totalTrades > 0 ? Number(((wins / totalTrades) * 100).toFixed(1)) : 0;
        const totalProfit = distributions
            .filter((d) => d.status === 'COMPLETED')
            .reduce((s, d) => s + Number(d.netProfit ?? 0), 0);
        const totalDistributions = distributions.filter((d) => d.status === 'COMPLETED').length;
        const totalDeposits = payments.reduce((s, p) => s + Number(p.amount), 0);
        const totalWithdrawals = withdrawals.reduce((s, w) => s + Number(w.amount), 0);
        const walletBalance = wallet ? Number(wallet.realizedBalance) : 0;
        return {
            totalTrades,
            winRate,
            totalProfit,
            totalDistributions,
            totalDeposits,
            totalWithdrawals,
            walletBalance,
        };
    }
    async getTradingReport() {
        const records = await this.prisma.tradeRecord.findMany({
            where: { status: 'published' },
            orderBy: { tradeDate: 'desc' },
        });
        const wins = records.filter((t) => t.result === 'WIN');
        const losses = records.filter((t) => t.result === 'LOSS');
        const totalPnL = records.reduce((s, t) => s + t.profitLoss, 0);
        const winRate = records.length > 0
            ? Number(((wins.length / records.length) * 100).toFixed(1))
            : 0;
        const sorted = [...records].sort((a, b) => b.profitLoss - a.profitLoss);
        const best = sorted[0] ?? null;
        const worst = sorted[sorted.length - 1] ?? null;
        return {
            totalTrades: records.length,
            winningTrades: wins.length,
            losingTrades: losses.length,
            breakEven: records.length - wins.length - losses.length,
            winRate,
            totalPnL: Number(totalPnL.toFixed(2)),
            bestTrade: best
                ? {
                    pair: best.pair,
                    side: best.side,
                    profitLoss: best.profitLoss,
                    date: best.tradeDate,
                }
                : null,
            worstTrade: worst
                ? {
                    pair: worst.pair,
                    side: worst.side,
                    profitLoss: worst.profitLoss,
                    date: worst.tradeDate,
                }
                : null,
            records: records.map((r) => ({
                pair: r.pair,
                side: r.side,
                entryPrice: r.entryPrice,
                exitPrice: r.exitPrice,
                result: r.result,
                profitLoss: r.profitLoss,
                tradeDate: r.tradeDate.toISOString().split('T')[0],
                notes: r.notes ?? '',
            })),
        };
    }
    async getPnlDistribution() {
        const records = await this.prisma.tradeRecord.findMany({
            where: { status: 'published' },
        });
        let winningTrades = 0;
        let losingTrades = 0;
        let breakevenTrades = 0;
        let grossProfit = 0;
        let grossLoss = 0;
        records.forEach((t) => {
            if (t.profitLoss > 0) {
                winningTrades++;
                grossProfit += t.profitLoss;
            }
            else if (t.profitLoss < 0) {
                losingTrades++;
                grossLoss += Math.abs(t.profitLoss);
            }
            else {
                breakevenTrades++;
            }
        });
        const totalTrades = records.length;
        const netProfit = grossProfit - grossLoss;
        const winRate = totalTrades > 0
            ? Number(((winningTrades / totalTrades) * 100).toFixed(1))
            : 0;
        const lossRate = totalTrades > 0
            ? Number(((losingTrades / totalTrades) * 100).toFixed(1))
            : 0;
        const breakevenRate = totalTrades > 0
            ? Number(((breakevenTrades / totalTrades) * 100).toFixed(1))
            : 0;
        const averageWin = winningTrades > 0 ? Number((grossProfit / winningTrades).toFixed(2)) : 0;
        const averageLoss = losingTrades > 0 ? Number((grossLoss / losingTrades).toFixed(2)) : 0;
        const profitFactor = grossLoss > 0
            ? Number((grossProfit / grossLoss).toFixed(2))
            : grossProfit > 0
                ? 999
                : 0;
        const riskRewardRatio = averageLoss > 0
            ? Number((averageWin / averageLoss).toFixed(2))
            : averageWin > 0
                ? 999
                : 0;
        return {
            totalTrades,
            winningTrades,
            losingTrades,
            breakevenTrades,
            winRate,
            lossRate,
            breakevenRate,
            grossProfit: Number(grossProfit.toFixed(2)),
            grossLoss: Number(grossLoss.toFixed(2)),
            netProfit: Number(netProfit.toFixed(2)),
            averageWin,
            averageLoss,
            profitFactor,
            riskRewardRatio,
        };
    }
    async getMonthlyPnl() {
        const records = await this.prisma.tradeRecord.findMany({
            where: { status: 'published' },
            orderBy: { tradeDate: 'asc' },
        });
        const monthlyMap = {};
        records.forEach((t) => {
            const dateKey = t.tradeDate.toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
            });
            monthlyMap[dateKey] = (monthlyMap[dateKey] || 0) + t.profitLoss;
        });
        return Object.entries(monthlyMap).map(([month, pnl]) => ({
            month,
            pnl: Number(pnl.toFixed(2)),
        }));
    }
    async getProfitReport(userId) {
        const distributions = await this.prisma.profitDistribution.findMany({
            where: { userId },
            orderBy: { distributionDate: 'desc' },
        });
        const paid = distributions.filter((d) => d.status === 'COMPLETED');
        const pending = distributions.filter((d) => d.status === 'PENDING');
        const totalDistributed = paid.reduce((s, d) => s + Number(d.netProfit ?? 0), 0);
        const pendingAmount = pending.reduce((s, d) => s + Number(d.netProfit ?? 0), 0);
        const lastDistribution = distributions.length
            ? distributions[0].distributionDate
            : null;
        return {
            totalDistributed: Number(totalDistributed.toFixed(2)),
            pendingAmount: Number(pendingAmount.toFixed(2)),
            lastDistribution,
            paidCount: paid.length,
            pendingCount: pending.length,
            records: distributions.map((d) => ({
                reference: d.reference,
                amount: Number(d.netProfit ?? 0),
                type: d.type,
                status: d.status,
                distributionDate: d.distributionDate.toISOString().split('T')[0],
                note: d.note ?? '',
            })),
        };
    }
    async getWalletStatement(userId) {
        const [wallet, payments, withdrawals, distributions] = await Promise.all([
            this.prisma.wallet.findUnique({ where: { userId } }),
            this.prisma.payment.findMany({
                where: { userId, status: 'APPROVED' },
                orderBy: { createdAt: 'asc' },
            }),
            this.prisma.withdrawal.findMany({
                where: { userId, status: 'APPROVED' },
                orderBy: { createdAt: 'asc' },
            }),
            this.prisma.profitDistribution.findMany({
                where: { userId, status: 'COMPLETED' },
                orderBy: { distributionDate: 'asc' },
            }),
        ]);
        const totalDeposits = payments.reduce((s, p) => s + Number(p.amount), 0);
        const totalWithdrawals = withdrawals.reduce((s, w) => s + Number(w.amount), 0);
        const profitCredits = distributions.reduce((s, d) => s + Number(d.netProfit ?? 0), 0);
        const closingBalance = wallet ? Number(wallet.realizedBalance) : 0;
        const openingBalance = closingBalance - totalDeposits + totalWithdrawals - profitCredits;
        return {
            openingBalance: Number(openingBalance.toFixed(2)),
            totalDeposits: Number(totalDeposits.toFixed(2)),
            totalWithdrawals: Number(totalWithdrawals.toFixed(2)),
            profitCredits: Number(profitCredits.toFixed(2)),
            closingBalance: Number(closingBalance.toFixed(2)),
            deposits: payments.map((p) => ({
                date: p.createdAt.toISOString().split('T')[0],
                plan: p.planName,
                amount: Number(p.amount),
                type: p.paymentType,
            })),
            withdrawals: withdrawals.map((w) => ({
                date: w.createdAt.toISOString().split('T')[0],
                amount: Number(w.amount),
                status: w.status,
            })),
            profitEntries: distributions.map((d) => ({
                date: d.distributionDate.toISOString().split('T')[0],
                reference: d.reference,
                amount: Number(d.netProfit ?? 0),
                type: d.type,
            })),
        };
    }
    async getTaxSummary(userId) {
        const [tradeRecords, distributions] = await Promise.all([
            this.prisma.tradeRecord.findMany({ where: { status: 'published' } }),
            this.prisma.profitDistribution.findMany({
                where: { userId, status: 'COMPLETED' },
            }),
        ]);
        const tradingPnL = tradeRecords.reduce((s, t) => s + t.profitLoss, 0);
        const distributionIncome = distributions.reduce((s, d) => s + Number(d.netProfit ?? 0), 0);
        const totalRealizedGains = Number((tradingPnL + distributionIncome).toFixed(2));
        const taxRate = 0.15;
        const estimatedTax = Number((totalRealizedGains * taxRate).toFixed(2));
        const netReturn = Number((totalRealizedGains - estimatedTax).toFixed(2));
        return {
            tradingPnL: Number(tradingPnL.toFixed(2)),
            distributionIncome: Number(distributionIncome.toFixed(2)),
            totalRealizedGains,
            taxRate: taxRate * 100,
            estimatedTax,
            netReturn,
        };
    }
    async getReportHistory(userId) {
        const reports = await this.prisma.generatedReport.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 30,
        });
        return reports.map((r) => ({
            id: r.id,
            fileName: r.fileName,
            reportType: r.reportType,
            fileUrl: r.fileUrl,
            createdAt: r.createdAt,
        }));
    }
    async saveReportRecord(userId, fileName, reportType, fileUrl) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            console.warn(`User ${userId} not found, skipping report record generation.`);
            return null;
        }
        return this.prisma.generatedReport.create({
            data: { userId, fileName, reportType, fileUrl },
        });
    }
    async generateCsvBuffer(userId, type) {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        if (type === 'trading') {
            const data = await this.getTradingReport();
            const header = 'Pair,Side,Entry Price,Exit Price,Result,P&L,Date\n';
            const rows = data.records
                .map((r) => `${r.pair},${r.side},${r.entryPrice},${r.exitPrice},${r.result},${r.profitLoss},${r.tradeDate}`)
                .join('\n');
            return {
                buffer: Buffer.from(header + rows, 'utf-8'),
                fileName: `Tradebot_Trading_Report_${dateStr}.csv`,
            };
        }
        if (type === 'profit') {
            const data = await this.getProfitReport(userId);
            const header = 'Reference,Amount,Type,Status,Date,Note\n';
            const rows = data.records
                .map((r) => `${r.reference},${r.amount},${r.type},${r.status},${r.distributionDate},"${r.note}"`)
                .join('\n');
            return {
                buffer: Buffer.from(header + rows, 'utf-8'),
                fileName: `Tradebot_Profit_Report_${dateStr}.csv`,
            };
        }
        if (type === 'wallet') {
            const data = await this.getWalletStatement(userId);
            const header = 'Date,Description,Credit,Debit\n';
            const depositRows = data.deposits.map((d) => `${d.date},Deposit (${d.plan}),${d.amount},`);
            const withdrawRows = data.withdrawals.map((w) => `${w.date},Withdrawal,,${w.amount}`);
            const profitRows = data.profitEntries.map((p) => `${p.date},Profit Credit - ${p.reference},${p.amount},`);
            return {
                buffer: Buffer.from(header + [...depositRows, ...withdrawRows, ...profitRows].join('\n'), 'utf-8'),
                fileName: `Tradebot_Wallet_Statement_${dateStr}.csv`,
            };
        }
        if (type === 'tax') {
            const data = await this.getTaxSummary(userId);
            const content = [
                'Tax Summary Report',
                `Generated: ${new Date().toLocaleDateString()}`,
                '',
                `Trading P&L,${data.tradingPnL}`,
                `Distribution Income,${data.distributionIncome}`,
                `Total Realized Gains,${data.totalRealizedGains}`,
                `Tax Rate,${data.taxRate}%`,
                `Estimated Tax Due,${data.estimatedTax}`,
                `Net Return After Tax,${data.netReturn}`,
            ].join('\n');
            return {
                buffer: Buffer.from(content, 'utf-8'),
                fileName: `Tradebot_Tax_Summary_${dateStr}.csv`,
            };
        }
        throw new Error(`Unknown report type: ${type}`);
    }
    async generatePdfBuffer(userId, type, userName) {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        let tradingData = null;
        let profitData = null;
        let walletData = null;
        let taxData = null;
        if (type === 'trading')
            tradingData = await this.getTradingReport();
        else if (type === 'profit')
            profitData = await this.getProfitReport(userId);
        else if (type === 'wallet')
            walletData = await this.getWalletStatement(userId);
        else if (type === 'tax')
            taxData = await this.getTaxSummary(userId);
        else
            throw new Error(`Unknown report type: ${type}`);
        const drawRow = (doc, label, value) => {
            const y = doc.y;
            doc
                .fontSize(10)
                .font('Helvetica')
                .fillColor('#444444')
                .text(label, 50, y, { width: 280, lineBreak: false });
            doc
                .fontSize(10)
                .font('Helvetica-Bold')
                .fillColor('#111111')
                .text(value, 340, y, { width: 200, lineBreak: false });
            doc.moveDown(0.8);
        };
        const drawSection = (doc, title) => {
            doc.moveDown(0.6);
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#14532d').text(title);
            doc.moveDown(0.3);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#bbf7d0');
            doc.moveDown(0.5);
        };
        const buffer = await new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50, size: 'A4', compress: true });
                const chunks = [];
                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', (err) => reject(err));
                doc.rect(0, 0, 595, 75).fill('#052e16');
                doc
                    .fontSize(20)
                    .font('Helvetica-Bold')
                    .fillColor('#4ade80')
                    .text('TRADEBOT', 50, 18, { lineBreak: false });
                doc
                    .fontSize(8)
                    .font('Helvetica')
                    .fillColor('#86efac')
                    .text('Financial Reports Platform', 50, 46, { lineBreak: false });
                doc
                    .fontSize(8)
                    .font('Helvetica')
                    .fillColor('#86efac')
                    .text(`User: ${userName}  ID: ${userId.slice(0, 8)}  Date: ${new Date().toLocaleDateString('en-IN')}`, 200, 54, { width: 345, align: 'right', lineBreak: false });
                doc.y = 95;
                if (type === 'trading' && tradingData) {
                    doc
                        .fontSize(15)
                        .font('Helvetica-Bold')
                        .fillColor('#052e16')
                        .text('Trading Performance Report');
                    doc.moveDown(0.5);
                    drawSection(doc, 'Summary');
                    drawRow(doc, 'Total Trades', String(tradingData.totalTrades));
                    drawRow(doc, 'Winning Trades', String(tradingData.winningTrades));
                    drawRow(doc, 'Losing Trades', String(tradingData.losingTrades));
                    drawRow(doc, 'Break Even', String(tradingData.breakEven));
                    drawRow(doc, 'Win Rate', `${tradingData.winRate}%`);
                    drawRow(doc, 'Total P&L', `INR ${tradingData.totalPnL.toLocaleString('en-IN')}`);
                    if (tradingData.bestTrade)
                        drawRow(doc, 'Best Trade', `${tradingData.bestTrade.pair}  INR+${tradingData.bestTrade.profitLoss}`);
                    if (tradingData.worstTrade)
                        drawRow(doc, 'Worst Trade', `${tradingData.worstTrade.pair}  INR${tradingData.worstTrade.profitLoss}`);
                    if (tradingData.records.length > 0) {
                        drawSection(doc, `Trade Records (${Math.min(40, tradingData.records.length)} shown)`);
                        tradingData.records.slice(0, 40).forEach((r) => {
                            doc
                                .fontSize(7.5)
                                .font('Helvetica')
                                .fillColor('#374151')
                                .text(`${r.tradeDate}   ${r.pair}   ${r.side}   Entry:${r.entryPrice}   Exit:${r.exitPrice}   ${r.result}   P&L:INR${r.profitLoss}`, { lineBreak: true });
                        });
                    }
                }
                else if (type === 'profit' && profitData) {
                    doc
                        .fontSize(15)
                        .font('Helvetica-Bold')
                        .fillColor('#052e16')
                        .text('Profit Distribution Report');
                    doc.moveDown(0.5);
                    drawSection(doc, 'Summary');
                    drawRow(doc, 'Total Distributed', `INR ${profitData.totalDistributed.toLocaleString('en-IN')}`);
                    drawRow(doc, 'Pending Amount', `INR ${profitData.pendingAmount.toLocaleString('en-IN')}`);
                    drawRow(doc, 'Paid Entries', String(profitData.paidCount));
                    drawRow(doc, 'Pending Entries', String(profitData.pendingCount));
                    if (profitData.lastDistribution)
                        drawRow(doc, 'Last Distribution', new Date(profitData.lastDistribution).toLocaleDateString('en-IN'));
                    if (profitData.records.length > 0) {
                        drawSection(doc, 'Distribution Log');
                        profitData.records.slice(0, 40).forEach((r) => {
                            doc
                                .fontSize(7.5)
                                .font('Helvetica')
                                .fillColor('#374151')
                                .text(`${r.distributionDate}   ${r.reference}   ${r.type}   INR${r.amount}   ${r.status}`);
                        });
                    }
                }
                else if (type === 'wallet' && walletData) {
                    doc
                        .fontSize(15)
                        .font('Helvetica-Bold')
                        .fillColor('#052e16')
                        .text('Wallet Statement');
                    doc.moveDown(0.5);
                    drawSection(doc, 'Account Summary');
                    drawRow(doc, 'Opening Balance', `INR ${walletData.openingBalance.toLocaleString('en-IN')}`);
                    drawRow(doc, 'Total Deposits', `INR ${walletData.totalDeposits.toLocaleString('en-IN')}`);
                    drawRow(doc, 'Profit Credits', `INR ${walletData.profitCredits.toLocaleString('en-IN')}`);
                    drawRow(doc, 'Total Withdrawals', `INR ${walletData.totalWithdrawals.toLocaleString('en-IN')}`);
                    drawRow(doc, 'Closing Balance', `INR ${walletData.closingBalance.toLocaleString('en-IN')}`);
                    if (walletData.deposits.length > 0) {
                        drawSection(doc, 'Deposits');
                        walletData.deposits.forEach((d) => {
                            doc
                                .fontSize(7.5)
                                .font('Helvetica')
                                .fillColor('#374151')
                                .text(`${d.date}   ${d.plan}   ${d.type}   INR${d.amount}`);
                        });
                    }
                    if (walletData.withdrawals.length > 0) {
                        drawSection(doc, 'Withdrawals');
                        walletData.withdrawals.forEach((w) => {
                            doc
                                .fontSize(7.5)
                                .font('Helvetica')
                                .fillColor('#374151')
                                .text(`${w.date}   INR${w.amount}   ${w.status}`);
                        });
                    }
                    if (walletData.profitEntries.length > 0) {
                        drawSection(doc, 'Profit Credits');
                        walletData.profitEntries.forEach((p) => {
                            doc
                                .fontSize(7.5)
                                .font('Helvetica')
                                .fillColor('#374151')
                                .text(`${p.date}   ${p.reference}   ${p.type}   INR${p.amount}`);
                        });
                    }
                }
                else if (type === 'tax' && taxData) {
                    doc
                        .fontSize(15)
                        .font('Helvetica-Bold')
                        .fillColor('#052e16')
                        .text('Tax Summary Report');
                    doc
                        .fontSize(8)
                        .font('Helvetica')
                        .fillColor('#6b7280')
                        .text('Assessment Year 2026-27 (FY 2025-26)');
                    doc.moveDown(0.5);
                    drawSection(doc, 'Tax Computation');
                    drawRow(doc, 'Trading P&L', `INR ${taxData.tradingPnL.toLocaleString('en-IN')}`);
                    drawRow(doc, 'Distribution Income', `INR ${taxData.distributionIncome.toLocaleString('en-IN')}`);
                    drawRow(doc, 'Total Realized Gains (STCG)', `INR ${taxData.totalRealizedGains.toLocaleString('en-IN')}`);
                    drawRow(doc, 'Applicable Tax Rate', `${taxData.taxRate}%`);
                    drawRow(doc, 'Estimated Tax Due', `INR ${taxData.estimatedTax.toLocaleString('en-IN')}`);
                    drawRow(doc, 'Net Return After Tax', `INR ${taxData.netReturn.toLocaleString('en-IN')}`);
                    doc.moveDown(1);
                    doc
                        .fontSize(8)
                        .font('Helvetica')
                        .fillColor('#9ca3af')
                        .text('DISCLAIMER: Estimated at 15% STCG. Consult a certified chartered accountant for official filings.');
                }
                doc
                    .fontSize(7)
                    .font('Helvetica')
                    .fillColor('#aaaaaa')
                    .text('Generated by Tradebot Financial Reports Platform. System-generated document.', 50, doc.page.height - 45, { align: 'center', width: 495 });
                doc.end();
            }
            catch (syncErr) {
                reject(syncErr);
            }
        });
        const fileNames = {
            trading: `Tradebot_Trading_Report_${dateStr}.pdf`,
            profit: `Tradebot_Profit_Report_${dateStr}.pdf`,
            wallet: `Tradebot_Wallet_Statement_${dateStr}.pdf`,
            tax: `Tradebot_Tax_Summary_${dateStr}.pdf`,
        };
        return {
            buffer,
            fileName: fileNames[type] ?? `Tradebot_Report_${dateStr}.pdf`,
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map