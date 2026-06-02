import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ─── Summary Card Data ────────────────────────────────────────────────────
  async getReportSummary(userId: string) {
    const [tradeRecords, distributions, wallet, payments, withdrawals] =
      await Promise.all([
        this.prisma.tradeRecord.findMany({ where: { status: 'published' } }),
        this.prisma.profitDistribution.findMany({ where: { userId } }),
        this.prisma.wallet.findUnique({ where: { userId } }),
        this.prisma.payment.findMany({ where: { userId, status: 'APPROVED' } }),
        this.prisma.withdrawal.findMany({ where: { userId, status: 'APPROVED' } }),
      ]);

    const totalTrades = tradeRecords.length;
    const wins = tradeRecords.filter((t) => t.result === 'WIN').length;
    const winRate = totalTrades > 0 ? Number(((wins / totalTrades) * 100).toFixed(1)) : 0;

    const totalProfit = distributions
      .filter((d) => d.status === 'PAID')
      .reduce((s, d) => s + d.amount, 0);

    const totalDistributions = distributions.filter((d) => d.status === 'PAID').length;
    const totalDeposits = payments.reduce((s, p) => s + Number(p.amount), 0);
    const totalWithdrawals = withdrawals.reduce((s, w) => s + Number(w.amount), 0);
    const walletBalance = wallet ? Number(wallet.realizedBalance) : 0;

    return { totalTrades, winRate, totalProfit, totalDistributions, totalDeposits, totalWithdrawals, walletBalance };
  }

  // ─── Trading Performance Report ───────────────────────────────────────────
  async getTradingReport() {
    const records = await this.prisma.tradeRecord.findMany({
      where: { status: 'published' },
      orderBy: { tradeDate: 'desc' },
    });

    const wins = records.filter((t) => t.result === 'WIN');
    const losses = records.filter((t) => t.result === 'LOSS');
    const totalPnL = records.reduce((s, t) => s + t.profitLoss, 0);
    const winRate = records.length > 0 ? Number(((wins.length / records.length) * 100).toFixed(1)) : 0;

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
      bestTrade: best ? { pair: best.pair, side: best.side, profitLoss: best.profitLoss, date: best.tradeDate } : null,
      worstTrade: worst ? { pair: worst.pair, side: worst.side, profitLoss: worst.profitLoss, date: worst.tradeDate } : null,
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

  // ─── Profit Distribution Report ───────────────────────────────────────────
  async getProfitReport(userId: string) {
    const distributions = await this.prisma.profitDistribution.findMany({
      where: { userId },
      orderBy: { distributionDate: 'desc' },
    });

    const paid = distributions.filter((d) => d.status === 'PAID');
    const pending = distributions.filter((d) => d.status === 'PENDING');
    const totalDistributed = paid.reduce((s, d) => s + d.amount, 0);
    const pendingAmount = pending.reduce((s, d) => s + d.amount, 0);
    const lastDistribution = distributions.length ? distributions[0].distributionDate : null;

    return {
      totalDistributed: Number(totalDistributed.toFixed(2)),
      pendingAmount: Number(pendingAmount.toFixed(2)),
      lastDistribution,
      paidCount: paid.length,
      pendingCount: pending.length,
      records: distributions.map((d) => ({
        reference: d.reference,
        amount: d.amount,
        type: d.type,
        status: d.status,
        distributionDate: d.distributionDate.toISOString().split('T')[0],
        note: d.note ?? '',
      })),
    };
  }

  // ─── Wallet Statement ─────────────────────────────────────────────────────
  async getWalletStatement(userId: string) {
    const [wallet, payments, withdrawals, distributions] = await Promise.all([
      this.prisma.wallet.findUnique({ where: { userId } }),
      this.prisma.payment.findMany({ where: { userId, status: 'APPROVED' }, orderBy: { createdAt: 'asc' } }),
      this.prisma.withdrawal.findMany({ where: { userId, status: 'APPROVED' }, orderBy: { createdAt: 'asc' } }),
      this.prisma.profitDistribution.findMany({ where: { userId, status: 'PAID' }, orderBy: { distributionDate: 'asc' } }),
    ]);

    const totalDeposits = payments.reduce((s, p) => s + Number(p.amount), 0);
    const totalWithdrawals = withdrawals.reduce((s, w) => s + Number(w.amount), 0);
    const profitCredits = distributions.reduce((s, d) => s + d.amount, 0);
    const closingBalance = wallet ? Number(wallet.realizedBalance) : 0;
    const openingBalance = closingBalance - totalDeposits + totalWithdrawals - profitCredits;

    return {
      openingBalance: Number(openingBalance.toFixed(2)),
      totalDeposits: Number(totalDeposits.toFixed(2)),
      totalWithdrawals: Number(totalWithdrawals.toFixed(2)),
      profitCredits: Number(profitCredits.toFixed(2)),
      closingBalance: Number(closingBalance.toFixed(2)),
      deposits: payments.map((p) => ({ date: p.createdAt.toISOString().split('T')[0], plan: p.planName, amount: Number(p.amount), type: p.paymentType })),
      withdrawals: withdrawals.map((w) => ({ date: w.createdAt.toISOString().split('T')[0], amount: Number(w.amount), status: w.status })),
      profitEntries: distributions.map((d) => ({ date: d.distributionDate.toISOString().split('T')[0], reference: d.reference, amount: d.amount, type: d.type })),
    };
  }

  // ─── Tax Summary ──────────────────────────────────────────────────────────
  async getTaxSummary(userId: string) {
    const [tradeRecords, distributions] = await Promise.all([
      this.prisma.tradeRecord.findMany({ where: { status: 'published' } }),
      this.prisma.profitDistribution.findMany({ where: { userId, status: 'PAID' } }),
    ]);

    const tradingPnL = tradeRecords.reduce((s, t) => s + t.profitLoss, 0);
    const distributionIncome = distributions.reduce((s, d) => s + d.amount, 0);
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

  // ─── Report History ───────────────────────────────────────────────────────
  async getReportHistory(userId: string) {
    const reports = await this.prisma.generatedReport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return reports.map((r) => ({ id: r.id, fileName: r.fileName, reportType: r.reportType, fileUrl: r.fileUrl, createdAt: r.createdAt }));
  }

  // ─── Save Report Record ───────────────────────────────────────────────────
  async saveReportRecord(userId: string, fileName: string, reportType: string, fileUrl: string) {
    return this.prisma.generatedReport.create({ data: { userId, fileName, reportType, fileUrl } });
  }

  // ─── CSV Export ───────────────────────────────────────────────────────────
  async generateCsvBuffer(userId: string, type: string): Promise<{ buffer: Buffer; fileName: string }> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    if (type === 'trading') {
      const data = await this.getTradingReport();
      const header = 'Pair,Side,Entry Price,Exit Price,Result,P&L,Date\n';
      const rows = data.records.map((r) => `${r.pair},${r.side},${r.entryPrice},${r.exitPrice},${r.result},${r.profitLoss},${r.tradeDate}`).join('\n');
      return { buffer: Buffer.from(header + rows, 'utf-8'), fileName: `Tradebot_Trading_Report_${dateStr}.csv` };
    }

    if (type === 'profit') {
      const data = await this.getProfitReport(userId);
      const header = 'Reference,Amount,Type,Status,Date,Note\n';
      const rows = data.records.map((r) => `${r.reference},${r.amount},${r.type},${r.status},${r.distributionDate},"${r.note}"`).join('\n');
      return { buffer: Buffer.from(header + rows, 'utf-8'), fileName: `Tradebot_Profit_Report_${dateStr}.csv` };
    }

    if (type === 'wallet') {
      const data = await this.getWalletStatement(userId);
      const header = 'Date,Description,Credit,Debit\n';
      const depositRows = data.deposits.map((d) => `${d.date},Deposit (${d.plan}),${d.amount},`);
      const withdrawRows = data.withdrawals.map((w) => `${w.date},Withdrawal,,${w.amount}`);
      const profitRows = data.profitEntries.map((p) => `${p.date},Profit Credit - ${p.reference},${p.amount},`);
      return { buffer: Buffer.from(header + [...depositRows, ...withdrawRows, ...profitRows].join('\n'), 'utf-8'), fileName: `Tradebot_Wallet_Statement_${dateStr}.csv` };
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
      return { buffer: Buffer.from(content, 'utf-8'), fileName: `Tradebot_Tax_Summary_${dateStr}.csv` };
    }

    throw new Error(`Unknown report type: ${type}`);
  }

  // ─── PDF Export ───────────────────────────────────────────────────────────
  /**
   * Fixes vs original broken version:
   * 1. All Prisma data fetched BEFORE entering the PDFDocument Promise — no async inside stream.
   * 2. No ₹ character — Helvetica is Latin-1 encoded and throws on multi-byte Unicode.
   *    Using "INR" instead.
   * 3. No { continued: true } + { align: 'right' } — known pdfkit crash combo.
   *    Using absolute x-coordinate positioning (label@x=50, value@x=340) instead.
   * 4. try/catch wrapping the sync PDF build to properly reject the Promise on errors.
   */
  async generatePdfBuffer(userId: string, type: string, userName: string): Promise<{ buffer: Buffer; fileName: string }> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    // Pre-fetch ALL data before opening the stream
    let tradingData: Awaited<ReturnType<typeof this.getTradingReport>> | null = null;
    let profitData: Awaited<ReturnType<typeof this.getProfitReport>> | null = null;
    let walletData: Awaited<ReturnType<typeof this.getWalletStatement>> | null = null;
    let taxData: Awaited<ReturnType<typeof this.getTaxSummary>> | null = null;

    if (type === 'trading') tradingData = await this.getTradingReport();
    else if (type === 'profit') profitData = await this.getProfitReport(userId);
    else if (type === 'wallet') walletData = await this.getWalletStatement(userId);
    else if (type === 'tax') taxData = await this.getTaxSummary(userId);
    else throw new Error(`Unknown report type: ${type}`);

    // Helper: two-column row via absolute x coords — avoids continued:true crash
    const drawRow = (doc: any, label: string, value: string) => {
      const y = doc.y;
      doc.fontSize(10).font('Helvetica').fillColor('#444444').text(label, 50, y, { width: 280, lineBreak: false });
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#111111').text(value, 340, y, { width: 200, lineBreak: false });
      doc.moveDown(0.8);
    };

    const drawSection = (doc: any, title: string) => {
      doc.moveDown(0.6);
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#14532d').text(title);
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#bbf7d0');
      doc.moveDown(0.5);
    };

    const buffer = await new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4', compress: true });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err: Error) => reject(err));

        // Header band (dark green)
        doc.rect(0, 0, 595, 75).fill('#052e16');
        doc.fontSize(20).font('Helvetica-Bold').fillColor('#4ade80').text('TRADEBOT', 50, 18, { lineBreak: false });
        doc.fontSize(8).font('Helvetica').fillColor('#86efac').text('Financial Reports Platform', 50, 46, { lineBreak: false });
        doc.fontSize(8).font('Helvetica').fillColor('#86efac')
           .text(`User: ${userName}  ID: ${userId.slice(0, 8)}  Date: ${new Date().toLocaleDateString('en-IN')}`,
             200, 54, { width: 345, align: 'right', lineBreak: false });
        doc.y = 95;

        // TRADING
        if (type === 'trading' && tradingData) {
          doc.fontSize(15).font('Helvetica-Bold').fillColor('#052e16').text('Trading Performance Report');
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
              doc.fontSize(7.5).font('Helvetica').fillColor('#374151')
                 .text(`${r.tradeDate}   ${r.pair}   ${r.side}   Entry:${r.entryPrice}   Exit:${r.exitPrice}   ${r.result}   P&L:INR${r.profitLoss}`, { lineBreak: true });
            });
          }

        // PROFIT
        } else if (type === 'profit' && profitData) {
          doc.fontSize(15).font('Helvetica-Bold').fillColor('#052e16').text('Profit Distribution Report');
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
              doc.fontSize(7.5).font('Helvetica').fillColor('#374151')
                 .text(`${r.distributionDate}   ${r.reference}   ${r.type}   INR${r.amount}   ${r.status}`);
            });
          }

        // WALLET
        } else if (type === 'wallet' && walletData) {
          doc.fontSize(15).font('Helvetica-Bold').fillColor('#052e16').text('Wallet Statement');
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
              doc.fontSize(7.5).font('Helvetica').fillColor('#374151').text(`${d.date}   ${d.plan}   ${d.type}   INR${d.amount}`);
            });
          }
          if (walletData.withdrawals.length > 0) {
            drawSection(doc, 'Withdrawals');
            walletData.withdrawals.forEach((w) => {
              doc.fontSize(7.5).font('Helvetica').fillColor('#374151').text(`${w.date}   INR${w.amount}   ${w.status}`);
            });
          }
          if (walletData.profitEntries.length > 0) {
            drawSection(doc, 'Profit Credits');
            walletData.profitEntries.forEach((p) => {
              doc.fontSize(7.5).font('Helvetica').fillColor('#374151').text(`${p.date}   ${p.reference}   ${p.type}   INR${p.amount}`);
            });
          }

        // TAX
        } else if (type === 'tax' && taxData) {
          doc.fontSize(15).font('Helvetica-Bold').fillColor('#052e16').text('Tax Summary Report');
          doc.fontSize(8).font('Helvetica').fillColor('#6b7280').text('Assessment Year 2026-27 (FY 2025-26)');
          doc.moveDown(0.5);
          drawSection(doc, 'Tax Computation');
          drawRow(doc, 'Trading P&L', `INR ${taxData.tradingPnL.toLocaleString('en-IN')}`);
          drawRow(doc, 'Distribution Income', `INR ${taxData.distributionIncome.toLocaleString('en-IN')}`);
          drawRow(doc, 'Total Realized Gains (STCG)', `INR ${taxData.totalRealizedGains.toLocaleString('en-IN')}`);
          drawRow(doc, 'Applicable Tax Rate', `${taxData.taxRate}%`);
          drawRow(doc, 'Estimated Tax Due', `INR ${taxData.estimatedTax.toLocaleString('en-IN')}`);
          drawRow(doc, 'Net Return After Tax', `INR ${taxData.netReturn.toLocaleString('en-IN')}`);
          doc.moveDown(1);
          doc.fontSize(8).font('Helvetica').fillColor('#9ca3af')
             .text('DISCLAIMER: Estimated at 15% STCG. Consult a certified chartered accountant for official filings.');
        }

        // Footer
        doc.fontSize(7).font('Helvetica').fillColor('#aaaaaa')
           .text('Generated by Tradebot Financial Reports Platform. System-generated document.',
             50, doc.page.height - 45, { align: 'center', width: 495 });

        doc.end();
      } catch (syncErr) {
        reject(syncErr);
      }
    });

    const fileNames: Record<string, string> = {
      trading: `Tradebot_Trading_Report_${dateStr}.pdf`,
      profit:  `Tradebot_Profit_Report_${dateStr}.pdf`,
      wallet:  `Tradebot_Wallet_Statement_${dateStr}.pdf`,
      tax:     `Tradebot_Tax_Summary_${dateStr}.pdf`,
    };

    return { buffer, fileName: fileNames[type] ?? `Tradebot_Report_${dateStr}.pdf` };
  }
}
