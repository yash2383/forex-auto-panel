import Link from "next/link";

export function WhiteLabelShell({ title, description, action, children }) {
  return (
    <section className="min-h-[calc(100vh-132px)] rounded-xl border border-white/[0.08] bg-[#081118]/95 p-5 text-white shadow-[0_18px_65px_-55px_rgba(0,208,156,0.65)] sm:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-green-300">White Label</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-400">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatsCard({ label, value, sub }) {
  return (
    <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 shadow-[0_18px_65px_-55px_rgba(0,208,156,0.65)]">
      <p className="text-sm font-medium text-neutral-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</p>
      {sub && <p className="mt-2 text-sm text-neutral-500">{sub}</p>}
    </article>
  );
}

export function FormInput({ label, type = "text", placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-white">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="h-12 w-full rounded-lg border border-white/[0.08] bg-black/10 px-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-green-500/50 focus:ring-2 focus:ring-green-500/10"
      />
    </label>
  );
}

export function DataTable({ headers, rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#081118]/95 shadow-[0_18px_65px_-55px_rgba(0,208,156,0.65)]">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-white/[0.025] text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-4 font-semibold">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">{rows}</tbody>
      </table>
    </div>
  );
}

const permissionTone = {
  Yes: "border-green-500/30 bg-green-500/10 text-green-300",
  No: "border-red-500/30 bg-red-500/10 text-red-300",
  Auto: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  Optional: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  "Via create": "border-blue-500/30 bg-blue-500/10 text-blue-300",
  "Replace only": "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
};

function PermissionPill({ value }) {
  return (
    <span className={`inline-flex min-w-20 justify-center rounded-full border px-3 py-1 text-xs font-bold ${permissionTone[value] || "border-white/[0.08] bg-white/[0.025] text-neutral-300"}`}>
      {value}
    </span>
  );
}

export function CrudPermissionPanel({ permission }) {
  if (!permission) return null;

  const entries = [
    ["View", permission.permissions.view],
    ["Add", permission.permissions.add],
    ["Edit", permission.permissions.edit],
    ["Delete", permission.permissions.delete],
  ];

  return (
    <section className="mb-6 rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 shadow-[0_18px_65px_-55px_rgba(0,208,156,0.65)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-green-300">CRUD Permission Matrix</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{permission.module}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-neutral-400">{permission.scope}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {entries.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-white/[0.08] bg-[#081118]/95 p-3 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
              <PermissionPill value={value} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <p className="text-sm font-semibold text-white">Allowed Actions</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {permission.actions.map((action) => (
              <span key={action} className="rounded-full border border-white/[0.08] bg-[#081118]/95 px-3 py-2 text-xs font-bold text-neutral-300">
                {action}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
          <p className="text-sm font-semibold text-yellow-300">Safety Rule</p>
          <p className="mt-1 text-sm text-neutral-300">{permission.safety}</p>
        </div>
      </div>
    </section>
  );
}

export function PrimaryLink({ href, children }) {
  return (
    <Link href={href} className="inline-flex h-11 items-center justify-center rounded-lg bg-green-500 px-4 text-sm font-bold text-black transition hover:bg-green-400">
      {children}
    </Link>
  );
}

export function StatusBadge({ status }) {
  const active = status === "Active";
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${active ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}>
      {status}
    </span>
  );
}
