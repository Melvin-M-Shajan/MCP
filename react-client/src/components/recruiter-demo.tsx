import { useMemo, useState } from "react";
import {
  Activity,
  Bot,
  CheckCircle2,
  Database,
  GitBranch,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Timer,
  type LucideIcon,
} from "lucide-react";

const scenarios = [
  {
    question: "Which customers generated the most revenue this quarter?",
    sql: `SELECT c.name, ROUND(SUM(o.total_amount), 2) AS revenue\nFROM customers c\nJOIN orders o ON o.customer_id = c.id\nWHERE o.created_at >= DATE_TRUNC('quarter', CURRENT_DATE)\nGROUP BY c.id, c.name\nORDER BY revenue DESC\nLIMIT 5;`,
    rows: [
      ["Acme Systems", "$128,420"],
      ["Northstar Labs", "$96,180"],
      ["Vertex Retail", "$74,910"],
    ],
    summary: "Acme Systems leads quarterly revenue, contributing 31% of the top-five total.",
  },
  {
    question: "Show accounts at risk because usage fell more than 20%.",
    sql: `WITH usage_change AS (\n  SELECT account_id,\n    SUM(events) FILTER (WHERE period = 'current') AS current_usage,\n    SUM(events) FILTER (WHERE period = 'previous') AS previous_usage\n  FROM account_usage\n  GROUP BY account_id\n)\nSELECT a.name, ROUND(100 * (u.current_usage - u.previous_usage) / NULLIF(u.previous_usage, 0), 1) AS change_pct\nFROM usage_change u JOIN accounts a ON a.id = u.account_id\nWHERE u.current_usage < u.previous_usage * 0.8\nORDER BY change_pct;`,
    rows: [
      ["Orbit Health", "-34.2%"],
      ["Beacon Works", "-27.8%"],
      ["Kite Logistics", "-22.5%"],
    ],
    summary: "Three accounts crossed the 20% decline threshold and should be reviewed by customer success.",
  },
];

const trace = [
  ["Supervisor", "Classified request as analytical SQL", "42 ms"],
  ["Schema agent", "Selected customers and orders", "86 ms"],
  ["SQL agent", "Generated read-only PostgreSQL", "318 ms"],
  ["Validator", "Passed SELECT-only policy", "11 ms"],
  ["Formatter", "Produced ranked insight", "94 ms"],
];

export function RecruiterDemo() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [hasRun, setHasRun] = useState(true);
  const scenario = scenarios[scenarioIndex];
  const tokens = useMemo(() => 684 + scenarioIndex * 137, [scenarioIndex]);

  const runNext = () => {
    setScenarioIndex((current) => (current + 1) % scenarios.length);
    setHasRun(true);
  };

  const reset = () => {
    setScenarioIndex(0);
    setHasRun(false);
  };

  return (
    <main className="min-h-screen bg-[#070914] text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/80 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
          <div className="rounded-xl bg-indigo-500/15 p-2 text-indigo-300"><Bot className="h-5 w-5" /></div>
          <div>
            <p className="font-semibold tracking-tight">Multi-Agent Control Platform</p>
            <p className="text-xs text-slate-400">melcp · local-first PostgreSQL intelligence</p>
          </div>
          <span className="ml-auto rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
            Simulated recruiter demo · no external writes
          </span>
          <button onClick={reset} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-indigo-950/20">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-indigo-200">
              <Sparkles className="h-4 w-4" /> Natural-language request
            </div>
            <p className="min-h-20 rounded-xl border border-white/10 bg-black/25 p-4 text-sm leading-6 text-slate-200">{scenario.question}</p>
            <button onClick={runNext} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold hover:bg-indigo-400">
              <Play className="h-4 w-4" /> Run next safe scenario
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {([
              [Timer, "551 ms", "Latency"],
              [Activity, String(tokens), "Tokens"],
              [ShieldCheck, "SELECT", "Policy"],
            ] satisfies [LucideIcon, string, string][]).map(([Icon, value, label]) => (
              <div key={String(label)} className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                <Icon className="mb-2 h-4 w-4 text-emerald-300" />
                <p className="font-semibold">{value}</p>
                <p className="text-[11px] text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium"><GitBranch className="h-4 w-4 text-violet-300" /> Agent trace</div>
            <ol className="space-y-3">
              {trace.map(([agent, detail, duration], index) => (
                <li key={agent} className="grid grid-cols-[24px_1fr_auto] items-start gap-3 text-xs">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/15 text-violet-300">{index + 1}</span>
                  <span><strong className="block text-slate-200">{agent}</strong><span className="text-slate-500">{detail}</span></span>
                  <span className="text-slate-500">{duration}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-5">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1020]">
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3 text-sm font-medium"><Database className="h-4 w-4 text-emerald-300" /> Validated PostgreSQL</div>
            <pre className="overflow-x-auto p-5 text-xs leading-6 text-emerald-200"><code>{hasRun ? scenario.sql : "Run a scenario to inspect generated SQL."}</code></pre>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
            <div className="border-b border-white/10 px-5 py-3 text-sm font-medium">Seeded result preview</div>
            {hasRun ? (
              <div className="p-5">
                <div className="overflow-hidden rounded-xl border border-white/10">
                  {scenario.rows.map(([name, value]) => (
                    <div key={name} className="grid grid-cols-2 border-b border-white/5 px-4 py-3 text-sm last:border-0">
                      <span className="text-slate-300">{name}</span><span className="text-right font-mono text-indigo-200">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4 text-sm leading-6 text-emerald-100">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {scenario.summary}
                </div>
              </div>
            ) : <p className="p-8 text-center text-sm text-slate-500">Reset complete. Run a scenario to repopulate the demo.</p>}
          </div>

          <p className="text-center text-xs leading-5 text-slate-500">
            Demo data is browser-only and deterministic. The production project supports authenticated local PostgreSQL introspection, read-only query validation, and observable multi-agent execution.
          </p>
        </div>
      </section>
    </main>
  );
}
