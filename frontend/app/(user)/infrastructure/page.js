import {
  Activity,
  BarChart3,
  Bot,
  Clock3,
  Database,
  Layers3,
  Link2,
  LockKeyhole,
  RadioTower,
  ShieldCheck,
  Zap,
} from "lucide-react";

export const metadata = {
  title: "Infrastructure - Forex Auto Panel",
  description: "Trading infrastructure for fast execution, secure API connections, platform integrations, and real-time market connectivity.",
};

const heroFeatures = [
  {
    icon: BarChart3,
    title: "Real-Time Market Data",
    text: "Live global market data feeds with ultra-low latency.",
    side: "left",
  },
  {
    icon: Zap,
    title: "Smart Execution Engine",
    text: "Advanced algorithms ensure optimal execution every time.",
    side: "left",
  },
  {
    icon: ShieldCheck,
    title: "Risk Management",
    text: "Built-in risk protocols protect capital.",
    side: "left",
  },
  {
    icon: LockKeyhole,
    title: "Secure Connections",
    text: "Encrypted API connections and industry-grade security.",
    side: "right",
  },
  {
    icon: Database,
    title: "High Availability",
    text: "Stable architecture with continuous monitoring.",
    side: "right",
  },
  {
    icon: Layers3,
    title: "Scalable Architecture",
    text: "Designed to scale with active trading needs.",
    side: "right",
  },
];

const integrations = [
  { name: "Binance", role: "Execution", mark: "B", tone: "text-yellow-300" },
  { name: "TradingView", role: "Market Signals", mark: "TV", tone: "text-white" },
  { name: "MetaTrader", role: "Execution Engine", mark: "MT", tone: "text-green-300" },
  { name: "KuCoin", role: "Liquidity Access", mark: "K", tone: "text-emerald-300" },
];

const featureGrid = [
  {
    icon: RadioTower,
    title: "Low Latency",
    text: "Ultra-fast connections to exchanges and data providers minimize execution delays.",
  },
  {
    icon: Clock3,
    title: "Real-Time Monitoring",
    text: "24/7 system monitoring ensures maximum uptime and instant issue detection.",
  },
  {
    icon: ShieldCheck,
    title: "Advanced Security",
    text: "Bank-level encryption, secure API management, and layered protection.",
  },
  {
    icon: Bot,
    title: "Automated Systems",
    text: "Fully automated infrastructure supports trading without manual intervention.",
  },
  {
    icon: Database,
    title: "Data Redundancy",
    text: "Multiple data sources and backups ensure accuracy and zero data loss.",
  },
  {
    icon: Activity,
    title: "Scalable & Reliable",
    text: "Built on cloud infrastructure that scales with volume and market volatility.",
  },
];

const HeroFeature = ({ item }) => {
  const Icon = item.icon;

  return (
    <div className="relative rounded-lg border border-white/10 bg-[#0B1110]/95 p-4 shadow-[0_0_30px_-20px_rgba(34,197,94,0.5)]">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-300">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-xs font-bold text-white">{item.title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">{item.text}</p>
        </div>
      </div>
      <span
        className={`absolute top-1/2 hidden h-2 w-2 -translate-y-1/2 rounded-full bg-green-400 shadow-[0_0_16px_rgba(74,222,128,0.95)] lg:block ${
          item.side === "left" ? "-right-7" : "-left-7"
        }`}></span>
    </div>
  );
};

const ServerStack = () => (
  <div className="relative mx-auto flex min-h-[360px] w-full max-w-md items-center justify-center">
    <div className="absolute inset-x-8 bottom-10 h-24 rounded-[50%] border border-green-500/20"></div>
    <div className="absolute inset-x-14 bottom-16 h-16 rounded-[50%] border border-green-500/20"></div>
    <div className="absolute bottom-20 left-1/2 h-56 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-green-400/40 to-transparent"></div>
    <div className="relative flex w-56 flex-col items-center">
      <div className="absolute -inset-8 rounded-full bg-green-500/10 blur-3xl"></div>
      {[0, 1, 2, 3].map((layer) => (
        <div
          key={layer}
          className="relative -mb-2 h-16 w-56 overflow-hidden rounded-xl border border-green-400/25 bg-gradient-to-br from-[#15211f] via-[#101818] to-[#050707] shadow-[0_18px_35px_-24px_rgba(34,197,94,0.9)]"
          style={{ transform: `translateY(${layer * 2}px) perspective(280px) rotateX(58deg)` }}>
          <div className="absolute inset-x-6 top-3 h-px bg-green-300/70 shadow-[0_0_16px_rgba(134,239,172,0.9)]"></div>
          <div className="absolute inset-x-0 bottom-0 h-2 bg-green-500/55 shadow-[0_0_24px_rgba(34,197,94,0.9)]"></div>
          <div className="absolute left-6 top-7 h-1.5 w-1.5 rounded-full bg-green-300"></div>
          <div className="absolute right-6 top-7 h-1.5 w-8 rounded-full bg-white/10"></div>
        </div>
      ))}
      <div className="relative -mt-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-green-300/30 bg-green-500/10 text-2xl font-black text-green-300 shadow-[0_0_30px_rgba(34,197,94,0.45)]">
        <Link2 className="h-7 w-7" />
      </div>
    </div>
  </div>
);

const FeatureCard = ({ item }) => {
  const Icon = item.icon;

  return (
    <div className="rounded-lg border border-white/10 bg-[#0B1110]/95 p-5 transition hover:border-green-500/30 hover:bg-[#0D1614]">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-300">
        <Icon className="h-4 w-4" />
      </span>
      <h3 className="mt-4 text-sm font-bold text-white">{item.title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-neutral-500">{item.text}</p>
    </div>
  );
};

export default function InfrastructurePage() {
  const leftFeatures = heroFeatures.filter((item) => item.side === "left");
  const rightFeatures = heroFeatures.filter((item) => item.side === "right");

  return (
    <main className="min-h-screen bg-[#020505] px-4 pb-20 pt-28 text-white sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="text-center">
          <span className="inline-flex items-center rounded-full border border-green-500/25 bg-green-500/10 px-3 py-1 text-[11px] font-bold text-green-300">
            Infrastructure
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Built on powerful <span className="text-green-400">trading infrastructure</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-neutral-400">
            Forex Auto Panel connects with leading platforms and APIs to ensure fast, secure, and reliable execution in real time.
          </p>
        </div>

        <div className="relative mt-12 grid items-center gap-6 lg:grid-cols-[250px_minmax(0,1fr)_250px]">
          <div className="grid gap-5">
            {leftFeatures.map((item) => (
              <HeroFeature key={item.title} item={item} />
            ))}
          </div>

          <div className="relative">
            <div className="absolute left-0 right-0 top-1/2 hidden h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-green-500/25 to-transparent lg:block"></div>
            <ServerStack />
          </div>

          <div className="grid gap-5">
            {rightFeatures.map((item) => (
              <HeroFeature key={item.title} item={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-7xl border-t border-white/5 pt-10">
        <div className="text-center">
          <span className="text-[11px] font-bold uppercase text-green-400">Integrations</span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Connected with leading platforms</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-neutral-500">
            Forex Auto Panel integrates with trusted platforms and APIs to give users a seamless trading experience.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {integrations.map((item) => (
            <div key={item.name} className="rounded-lg border border-white/10 bg-[#0B1110]/95 p-6 text-center">
              <div className={`mx-auto flex h-16 items-center justify-center text-4xl font-black ${item.tone}`}>
                {item.mark}
              </div>
              <h3 className="mt-4 text-sm font-bold text-white">{item.name}</h3>
              <span className="mt-2 inline-flex rounded-full bg-green-500/10 px-2.5 py-1 text-[11px] font-bold text-green-300">
                {item.role}
              </span>
              <p className="mt-4 text-xs leading-relaxed text-neutral-500">
                Secure, reliable connectivity for smooth trading operations.
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-7xl border-t border-white/5 pt-10">
        <div className="text-center">
          <span className="text-[11px] font-bold uppercase text-green-400">Infrastructure Features</span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Engineered for performance and reliability</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-neutral-500">
            Every component of Forex Auto Panel&apos;s infrastructure is designed to deliver speed, stability, and security.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featureGrid.map((item) => (
            <FeatureCard key={item.title} item={item} />
          ))}
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-7xl rounded-xl border border-white/10 bg-[linear-gradient(135deg,rgba(34,197,94,0.14),rgba(11,17,16,0.98)_45%,rgba(11,17,16,0.98))] p-6 sm:p-8">
        <div className="grid items-center gap-6 lg:grid-cols-[180px_1fr_auto]">
          <div className="hidden lg:block">
            <div className="relative h-32 w-32">
              <div className="absolute left-2 top-6 h-20 w-20 rounded-xl border border-green-400/25 bg-[#0E1816] shadow-[0_0_28px_rgba(34,197,94,0.18)]"></div>
              <div className="absolute bottom-2 right-2 flex h-20 w-20 items-center justify-center rounded-full border border-green-400/25 bg-green-500/10 text-green-300">
                <ShieldCheck className="h-9 w-9" />
              </div>
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase text-green-400">Built for Traders</span>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Reliable infrastructure. Better trading results.</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-400">
              Our infrastructure ensures your trades are executed fast, securely, and without interruption.
            </p>
            <p className="mt-4 text-xs leading-relaxed text-neutral-500">
              Infrastructure supports execution and analysis. Trading results depend on market conditions and trading performance.
            </p>
          </div>
          <div className="lg:text-right">
            <a
              href="/signup"
              className="inline-flex h-12 items-center rounded-full bg-green-500 px-6 text-sm font-bold text-black transition hover:bg-green-300 active:scale-[0.98]">
              Start Trading Now
            </a>
            <p className="mt-3 text-xs text-neutral-500">Join active traders using Forex Auto Panel.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
