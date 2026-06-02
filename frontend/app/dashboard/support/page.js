import { SectionCard, Disclaimer, PageIntro } from "../_components/DashboardPieces";

export default function SupportPage() {
  return (
    <>
      <PageIntro
        title="Support"
        description="Need help? Contact our support team for assistance with your account or trades.">
        <p className="text-sm font-semibold text-green-300">We are here to help you anytime.</p>
      </PageIntro>

      <SectionCard title="Support" description="Submit support request, contact details, and help resources.">
        <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm leading-relaxed text-neutral-400">Our support team can help with account access, subscriptions, wallet questions, and trading dashboard guidance.</p>
          <a href="mailto:hello@tradebot.com" className="mt-5 inline-flex h-11 items-center rounded-lg bg-green-500 px-5 text-sm font-bold text-black">Contact Support</a>
        </div>
      </SectionCard>
      <Disclaimer />
    </>
  );
}
