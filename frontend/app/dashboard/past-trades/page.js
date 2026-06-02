import { PastTradesTable, SectionCard, TableActions, Disclaimer, PageIntro } from "../_components/DashboardPieces";

export default function DashboardPastTradesPage() {
  return (
    <>
      <PageIntro
        title="Past Trades"
        description="Access your complete trade history with detailed execution data and results.">
        <p className="text-sm font-semibold text-green-300">Full transparency of all executed trades.</p>
      </PageIntro>

      <SectionCard
        title="Past Trades"
        description="Entry and exit points, trade outcomes, PnL, and performance metrics."
        action={<TableActions />}>
        <PastTradesTable />
        <div className="mt-5 grid gap-3 text-sm md:grid-cols-4">
          <span className="rounded-lg bg-white/[0.03] p-3 text-neutral-300">Entry / Exit: trade execution points</span>
          <span className="rounded-lg bg-white/[0.03] p-3 text-neutral-300">Result: WIN / LOSS / BE</span>
          <span className="rounded-lg bg-white/[0.03] p-3 text-neutral-300">Points: market movement captured</span>
          <span className="rounded-lg bg-white/[0.03] p-3 text-neutral-300">PnL: final trade outcome</span>
        </div>
        <p className="mt-4 text-sm text-neutral-500">Showing all completed trades with full transparency.</p>
      </SectionCard>
      <Disclaimer />
    </>
  );
}
