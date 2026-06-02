"use client";

import { useState } from "react";
import { SectionCard, Disclaimer, PageIntro } from "../_components/DashboardPieces";
import { Download, FileText, CheckCircle2, ShieldCheck, Loader2, Calendar } from "lucide-react";

export default function ReportsPage() {
  const [downloadingType, setDownloadingType] = useState(null);
  const [generatingTax, setGeneratingTax] = useState(false);
  const [taxReportGenerated, setTaxReportGenerated] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const triggerDownload = (fileName, type) => {
    setDownloadingType(fileName);
    setTimeout(() => {
      // Simulate file download by creating a fake text file download
      const element = document.createElement("a");
      const file = new Blob(["Mock Tradebot Audit Report: " + fileName], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = fileName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      setDownloadingType(null);
      setSuccessMessage(`${fileName} downloaded successfully!`);
      setTimeout(() => setSuccessMessage(""), 4000);
    }, 1500);
  };

  const handleGenerateTax = () => {
    setGeneratingTax(true);
    setTaxReportGenerated(false);
    setTimeout(() => {
      setGeneratingTax(false);
      setTaxReportGenerated(true);
    }, 2000);
  };

  return (
    <>
      <PageIntro
        title="Downloadable Reports"
        description="Export audited transaction statements, realized PnL spreadsheets, and tax computation archives.">
        <p className="text-sm font-semibold text-green-300">All financial reports are signed and compiled based on exchange records.</p>
      </PageIntro>

      {successMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-green-500/20 bg-[#07100d]/90 p-4 text-green-300 shadow-2xl animate-bounce backdrop-blur">
          <CheckCircle2 className="h-5 w-5 text-green-400" />
          <span className="text-sm font-bold">{successMessage}</span>
        </div>
      )}

      <section className="grid gap-8 xl:grid-cols-2">
        {/* Realized Profit Statements */}
        <SectionCard 
          title="Profit & Loss Statements" 
          description="Download formal statement logs of all realized profits for accounting and compliance.">
          
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4">
                <label className="block text-xs font-semibold text-neutral-500 uppercase">File Format</label>
                <select className="mt-2 w-full bg-transparent text-sm text-white font-bold outline-none cursor-pointer">
                  <option className="bg-[#0b1110]">Portable Document Format (PDF)</option>
                  <option className="bg-[#0b1110]">Comma Separated Values (CSV)</option>
                </select>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4">
                <label className="block text-xs font-semibold text-neutral-500 uppercase">Statement Period</label>
                <select className="mt-2 w-full bg-transparent text-sm text-white font-bold outline-none cursor-pointer">
                  <option className="bg-[#0b1110]">Current Month (May 2026)</option>
                  <option className="bg-[#0b1110]">Last 3 Months</option>
                  <option className="bg-[#0b1110]">Financial Year (2025-26)</option>
                </select>
              </div>
            </div>

            <button 
              onClick={() => triggerDownload("Tradebot_Realized_PnL_May2026.pdf", "pnl")}
              disabled={downloadingType !== null}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-500 font-bold text-black transition hover:bg-green-400 disabled:opacity-50 cursor-pointer">
              {downloadingType === "Tradebot_Realized_PnL_May2026.pdf" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Compiling & Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export Realized PnL Statement
                </>
              )}
            </button>
          </div>
        </SectionCard>

        {/* Tax Statement Summary Generator */}
        <SectionCard 
          title="Tax Statement Summary" 
          description="Generate financial year tax summary summaries detailing short-term gains, liabilities, and offsets.">
          
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4">
                <label className="block text-xs font-semibold text-neutral-500 uppercase">Assessment Year</label>
                <select className="mt-2 w-full bg-transparent text-sm text-white font-bold outline-none cursor-pointer">
                  <option className="bg-[#0b1110]">AY 2026-27 (FY 2025-26)</option>
                  <option className="bg-[#0b1110]">AY 2025-26 (FY 2024-25)</option>
                </select>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4">
                <label className="block text-xs font-semibold text-neutral-500 uppercase">Trading Mode</label>
                <select className="mt-2 w-full bg-transparent text-sm text-white font-bold outline-none cursor-pointer">
                  <option className="bg-[#0b1110]">Individual F&O Account</option>
                  <option className="bg-[#0b1110]">Corporate Entity Portfolio</option>
                </select>
              </div>
            </div>

            <button 
              onClick={handleGenerateTax}
              disabled={generatingTax}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] font-bold text-white transition hover:bg-white/[0.08] disabled:opacity-50 cursor-pointer">
              {generatingTax ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculating Tax Liability...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  Generate Tax Summary
                </>
              )}
            </button>
          </div>
        </SectionCard>
      </section>

      {/* Tax Report Summary Cards */}
      {taxReportGenerated && (
        <section className="rounded-2xl border border-green-500/20 bg-gradient-to-br from-[#06120e] to-[#020907] p-6 shadow-xl animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-300">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-bold text-white">Tax Summary Report Generated</h3>
                <p className="text-xs text-neutral-500">Calculated for FY 2025-26 (AY 2026-27)</p>
              </div>
            </div>
            <button 
              onClick={() => triggerDownload("Tradebot_Tax_Summary_FY25-26.pdf", "tax")}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-green-500 px-4 text-xs font-bold text-black transition hover:bg-green-400 cursor-pointer">
              <Download className="h-3.5 w-3.5" />
              Download Report PDF
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white/[0.02] p-4 border border-white/[0.04]">
              <p className="text-xs text-neutral-500 font-semibold uppercase">Realized Gains (STCG)</p>
              <p className="mt-2 text-xl font-bold text-green-300">₹11,200.00</p>
            </div>
            <div className="rounded-xl bg-white/[0.02] p-4 border border-white/[0.04]">
              <p className="text-xs text-neutral-500 font-semibold uppercase">Estimated Tax Due (15%)</p>
              <p className="mt-2 text-xl font-bold text-yellow-300">₹1,680.00</p>
            </div>
            <div className="rounded-xl bg-white/[0.02] p-4 border border-white/[0.04]">
              <p className="text-xs text-neutral-500 font-semibold uppercase">Net Settled Return</p>
              <p className="mt-2 text-xl font-bold text-white">₹9,520.00</p>
            </div>
          </div>
        </section>
      )}

      {/* History log list */}
      <SectionCard 
        title="Report Statement Logs" 
        description="Quick-access archive of previously generated reports. Click any file to download instantly.">
        
        <div className="mt-5 divide-y divide-white/5">
          {[
            { name: "Trade_Audit_May_2026.pdf", size: "124 KB", date: "May 28, 2026", type: "PDF" },
            { name: "PnL_Tax_Ledger_FY25.csv", size: "42 KB", date: "May 15, 2026", type: "CSV" },
            { name: "Realized_Settle_Ledger_Q1.pdf", size: "210 KB", date: "April 01, 2026", type: "PDF" }
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between py-4 hover:bg-white/[0.01] px-2 rounded-xl transition">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.03] text-neutral-400">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-white hover:text-green-300 cursor-pointer" onClick={() => triggerDownload(item.name, "log")}>{item.name}</p>
                  <p className="text-xs text-neutral-500">{item.date} • {item.size}</p>
                </div>
              </div>
              
              <button 
                onClick={() => triggerDownload(item.name, "log")}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-neutral-400 transition hover:bg-white/[0.05] hover:text-white cursor-pointer">
                <Download className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </SectionCard>
      <Disclaimer />
    </>
  );
}
