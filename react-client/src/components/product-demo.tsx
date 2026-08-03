import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bot,
  Braces,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Code2,
  Copy,
  Database,
  Download,
  FileCode2,
  FileSpreadsheet,
  Github,
  GitBranch,
  Layers3,
  LockKeyhole,
  Network,
  Play,
  RotateCcw,
  Route,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Table2,
  TerminalSquare,
  WandSparkles,
  Workflow,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import "./product-demo.css";

type DemoView = "results" | "sql" | "trace" | "architecture";

type Scenario = {
  id: string;
  label: string;
  question: string;
  intent: string;
  sql: string;
  tables: string[];
  columns: string[];
  rows: string[][];
  insight: string;
  route: string[];
  latency: number;
  tokens: number;
  confidence: number;
};

const scenarios: Scenario[] = [
  {
    id: "revenue",
    label: "Revenue leaders",
    question: "Which customers generated the most revenue this quarter?",
    intent: "Rank customer revenue for the current fiscal quarter",
    sql: `SELECT
  c.name AS customer,
  COUNT(DISTINCT o.id) AS orders,
  ROUND(SUM(o.total_amount), 2) AS revenue,
  ROUND(100.0 * SUM(o.total_amount)
    / SUM(SUM(o.total_amount)) OVER (), 1) AS share_pct
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.created_at >= DATE_TRUNC('quarter', CURRENT_DATE)
GROUP BY c.id, c.name
ORDER BY revenue DESC
LIMIT 5;`,
    tables: ["customers", "orders", "order_items"],
    columns: ["customer", "orders", "revenue", "share"],
    rows: [
      ["Acme Systems", "184", "$128,420", "31.0%"],
      ["Northstar Labs", "142", "$96,180", "23.2%"],
      ["Vertex Retail", "119", "$74,910", "18.1%"],
      ["Lumina Cloud", "103", "$63,540", "15.4%"],
      ["Kite Logistics", "88", "$51,220", "12.3%"],
    ],
    insight: "Acme Systems leads the cohort and contributes 31% of top-five revenue. The top two accounts combine for more than half of the segment.",
    route: ["Supervisor", "Schema", "SQL", "Validator", "Execute", "Formatter"],
    latency: 642,
    tokens: 821,
    confidence: 98,
  },
  {
    id: "risk",
    label: "Account risk",
    question: "Show accounts at risk because usage fell more than 20% month over month.",
    intent: "Detect customer accounts with a material usage decline",
    sql: `WITH usage_delta AS (
  SELECT account_id,
    SUM(events) FILTER (WHERE period = 'current') AS current_usage,
    SUM(events) FILTER (WHERE period = 'previous') AS previous_usage
  FROM account_usage
  GROUP BY account_id
)
SELECT a.name AS account,
  u.previous_usage,
  u.current_usage,
  ROUND(100.0 * (u.current_usage - u.previous_usage)
    / NULLIF(u.previous_usage, 0), 1) AS change_pct
FROM usage_delta u
JOIN accounts a ON a.id = u.account_id
WHERE u.current_usage < u.previous_usage * 0.8
ORDER BY change_pct ASC;`,
    tables: ["accounts", "account_usage", "subscriptions"],
    columns: ["account", "previous", "current", "change"],
    rows: [
      ["Orbit Health", "48,320", "31,794", "-34.2%"],
      ["Beacon Works", "36,490", "26,347", "-27.8%"],
      ["Kite Logistics", "24,180", "18,740", "-22.5%"],
    ],
    insight: "Three accounts crossed the 20% decline threshold. Orbit Health has the steepest drop and should be reviewed first.",
    route: ["Supervisor", "Schema", "SQL", "Validator", "Execute", "Formatter"],
    latency: 718,
    tokens: 964,
    confidence: 96,
  },
  {
    id: "schema",
    label: "Schema map",
    question: "Map the order lifecycle and show how payments connect to customers.",
    intent: "Inspect repository and database relationships, then render a diagram",
    sql: `SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('customers', 'orders', 'payments');`,
    tables: ["customers", "orders", "payments", "refunds"],
    columns: ["source", "key", "target", "relationship"],
    rows: [
      ["orders", "customer_id", "customers.id", "many-to-one"],
      ["payments", "order_id", "orders.id", "many-to-one"],
      ["refunds", "payment_id", "payments.id", "many-to-one"],
    ],
    insight: "The order lifecycle resolves through three explicit foreign-key hops. Diagram and repository agents can package this context for engineering handoff.",
    route: ["Supervisor", "Repo", "Schema", "SQL", "Diagram", "Formatter"],
    latency: 884,
    tokens: 1108,
    confidence: 94,
  },
];

const traceDetails = [
  ["Supervisor", "Intent classified and execution plan created", "38 ms"],
  ["Schema agent", "Relevant tables and relationships selected", "91 ms"],
  ["SQL agent", "Parameterized PostgreSQL generated", "284 ms"],
  ["Policy guard", "AST passed read-only and row-limit policy", "12 ms"],
  ["Execution agent", "Seeded result set materialized", "126 ms"],
  ["Formatter", "Result summarized with cited fields", "91 ms"],
];

const tools: { icon: LucideIcon; name: string; detail: string; color: string }[] = [
  { icon: Database, name: "SQL", detail: "Query + validate", color: "violet" },
  { icon: GitBranch, name: "Repo", detail: "Inspect context", color: "cyan" },
  { icon: Workflow, name: "Diagram", detail: "Render Mermaid", color: "orange" },
  { icon: FileSpreadsheet, name: "CSV", detail: "Export results", color: "emerald" },
];

export function ProductDemo() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [query, setQuery] = useState(scenarios[0].question);
  const [view, setView] = useState<DemoView>("results");
  const [runState, setRunState] = useState<"idle" | "running" | "complete">("complete");
  const [activeStep, setActiveStep] = useState(5);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const scenario = scenarios[scenarioIndex];

  const visibleTrace = useMemo(
    () => traceDetails.map((step, index) => ({ step, done: activeStep >= index, active: runState === "running" && activeStep === index })),
    [activeStep, runState],
  );

  const clearTimers = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  };

  useEffect(() => () => {
    timers.current.forEach(window.clearTimeout);
  }, []);

  const runScenario = () => {
    clearTimers();
    setRunState("running");
    setActiveStep(0);
    setView("trace");
    traceDetails.forEach((_, index) => {
      timers.current.push(window.setTimeout(() => setActiveStep(index), 210 * index));
    });
    timers.current.push(window.setTimeout(() => {
      setActiveStep(traceDetails.length - 1);
      setRunState("complete");
      setView("results");
    }, 210 * traceDetails.length + 180));
  };

  const chooseScenario = (index: number) => {
    clearTimers();
    setScenarioIndex(index);
    setQuery(scenarios[index].question);
    setRunState("idle");
    setActiveStep(-1);
    setView("results");
  };

  const reset = () => {
    clearTimers();
    setScenarioIndex(0);
    setQuery(scenarios[0].question);
    setRunState("idle");
    setActiveStep(-1);
    setView("results");
    setCopied(false);
    setNotice("Demo reset — browser state cleared");
    window.setTimeout(() => setNotice(null), 2200);
  };

  const copySql = async () => {
    await navigator.clipboard?.writeText(scenario.sql);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const showDemoNotice = (label: string) => {
    setNotice(`${label} previewed locally — no external write performed`);
    window.setTimeout(() => setNotice(null), 2400);
  };

  return (
    <main className="demo-shell">
      <video className="demo-backdrop" autoPlay loop muted playsInline aria-hidden="true">
        <source src="/3.mp4" type="video/mp4" />
      </video>
      <div className="demo-backdrop-overlay" aria-hidden="true" />
      <div className="demo-aurora demo-aurora-one" aria-hidden="true" />
      <div className="demo-aurora demo-aurora-two" aria-hidden="true" />

      <header className="demo-topbar">
        <a className="demo-brand" href="#workspace" aria-label="Multi-Agent Control Platform demo home">
          <span className="demo-brand-mark"><Braces size={18} /></span>
          <span>
            <strong>Multi-Agent Control Platform</strong>
            <small>melcp · local-first AI orchestration</small>
          </span>
        </a>
        <nav className="demo-nav" aria-label="Demo navigation">
          <a href="#workspace">Workspace</a>
          <a href="#capabilities">Capabilities</a>
          <a href="#architecture">Architecture</a>
        </nav>
        <div className="demo-top-actions">
          <span className="demo-live-pill"><span /> Browser-only demo</span>
          <a className="demo-icon-button" href="https://github.com/Melvin-M-Shajan/multi-agent-control-platform" target="_blank" rel="noreferrer" aria-label="Open source repository">
            <Github size={17} />
          </a>
          <button className="demo-reset" type="button" onClick={reset}><RotateCcw size={15} /> Reset</button>
        </div>
      </header>

      <section className="demo-hero">
        <div>
          <span className="demo-eyebrow"><Sparkles size={13} /> One request. The right agents. Auditable output.</span>
          <h1>Turn natural language into<br /><em>safe, observable execution.</em></h1>
          <p>A local-first control plane that routes intent across specialized agents, grounds every action in your schema, and makes the full reasoning path inspectable.</p>
        </div>
        <div className="demo-hero-metrics" aria-label="Product highlights">
          <div><strong>6</strong><span>specialized agents</span></div>
          <div><strong>&lt; 1s</strong><span>seeded workflow</span></div>
          <div><strong>100%</strong><span>read-only demo</span></div>
        </div>
      </section>

      <section id="workspace" className="demo-workspace" aria-label="Interactive product demo">
        <aside className="demo-sidebar liquid-card">
          <div className="demo-section-heading">
            <span><Bot size={15} /> Control room</span>
            <span className="demo-status-dot">Online</span>
          </div>
          <div className="demo-session-list">
            <p className="demo-label">Demo scenarios</p>
            {scenarios.map((item, index) => (
              <button key={item.id} type="button" className={scenarioIndex === index ? "active" : ""} onClick={() => chooseScenario(index)}>
                <span className="demo-session-icon"><WandSparkles size={15} /></span>
                <span><strong>{item.label}</strong><small>{item.intent}</small></span>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
          <div className="demo-divider" />
          <div className="demo-schema-tree">
            <p className="demo-label"><Database size={12} /> Connected context</p>
            <div className="demo-connection"><span className="demo-db-icon"><Database size={15} /></span><span><strong>commerce_db</strong><small>PostgreSQL · seeded</small></span><CheckCircle2 size={15} /></div>
            <div className="demo-table-list">
              {scenario.tables.map((table, index) => <span key={table}><Table2 size={13} /> {table}<small>{index === 0 ? "24 fields" : `${9 + index * 3} fields`}</small></span>)}
            </div>
          </div>
          <div className="demo-safety-card">
            <ShieldCheck size={17} />
            <div><strong>Safety policy active</strong><span>SELECT-only · bounded rows · no writes</span></div>
          </div>
        </aside>

        <div className="demo-center">
          <section className="demo-command liquid-card">
            <div className="demo-section-heading">
              <span><Sparkles size={15} /> Ask your data</span>
              <span className="demo-model-pill"><CircleDot size={11} /> Supervisor routed</span>
            </div>
            <label className="demo-query-box">
              <span className="sr-only">Natural-language request</span>
              <textarea value={query} onChange={(event) => setQuery(event.target.value)} rows={3} />
              <button type="button" onClick={runScenario} disabled={!query.trim() || runState === "running"} aria-label="Run simulated workflow">
                {runState === "running" ? <Activity className="demo-spin" size={18} /> : <Send size={18} />}
              </button>
            </label>
            <div className="demo-query-footer">
              <span><LockKeyhole size={13} /> Deterministic seeded data</span>
              <span>⌘ ↵ to run</span>
            </div>
          </section>

          <section className="demo-orchestration liquid-card">
            <div className="demo-section-heading">
              <span><Route size={15} /> Live orchestration</span>
              <span className={runState === "running" ? "demo-run-badge running" : "demo-run-badge"}>{runState === "running" ? "Executing" : runState === "complete" ? "Complete" : "Ready"}</span>
            </div>
            <div className="demo-agent-rail">
              {scenario.route.map((agent, index) => {
                const isDone = activeStep >= index;
                const isActive = runState === "running" && activeStep === index;
                return (
                  <div className="demo-agent-wrap" key={agent}>
                    <div className={`demo-agent-node ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}>
                      <span>{isDone && !isActive ? <Check size={15} /> : index === 0 ? <Bot size={16} /> : index === 3 ? <ShieldCheck size={16} /> : <Zap size={16} />}</span>
                      <strong>{agent}</strong>
                      <small>{index === 0 ? "Route" : index === 3 ? "Guard" : `${48 + index * 37}ms`}</small>
                    </div>
                    {index < scenario.route.length - 1 && <div className={`demo-agent-link ${activeStep > index ? "done" : ""}`}><ChevronRight size={13} /></div>}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="demo-output liquid-card">
            <div className="demo-output-header">
              <div className="demo-tabs" role="tablist" aria-label="Workflow output">
                {([
                  ["results", BarChart3, "Results"],
                  ["sql", Code2, "Validated SQL"],
                  ["trace", Activity, "Execution trace"],
                  ["architecture", Network, "Architecture"],
                ] as [DemoView, LucideIcon, string][]).map(([id, Icon, label]) => (
                  <button key={id} role="tab" aria-selected={view === id} className={view === id ? "active" : ""} type="button" onClick={() => setView(id)}><Icon size={14} /> {label}</button>
                ))}
              </div>
              <div className="demo-output-actions">
                <button type="button" onClick={() => showDemoNotice("CSV export")}><Download size={14} /> Export</button>
                <button type="button" onClick={() => showDemoNotice("Share link")} aria-label="Preview share link"><ArrowUpRight size={15} /></button>
              </div>
            </div>

            <div className="demo-output-body" role="tabpanel">
              {runState === "idle" ? (
                <div className="demo-empty-state">
                  <span><Play size={22} /></span><strong>Ready to orchestrate</strong><p>Run the selected scenario to inspect the result, SQL, policy checks, and execution trace.</p><button type="button" onClick={runScenario}>Run demo</button>
                </div>
              ) : view === "results" ? (
                <div className="demo-results">
                  <div className="demo-result-summary"><span><Sparkles size={17} /></span><p><strong>Answer</strong>{scenario.insight}</p><small>{scenario.confidence}% confidence</small></div>
                  <div className="demo-table-wrap">
                    <table>
                      <thead><tr>{scenario.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
                      <tbody>{scenario.rows.map((row) => <tr key={row.join("-")}>{row.map((cell, index) => <td key={`${cell}-${index}`}>{index === 0 ? <><span className="demo-row-dot" />{cell}</> : cell}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                </div>
              ) : view === "sql" ? (
                <div className="demo-code-panel">
                  <div className="demo-code-toolbar"><span><TerminalSquare size={14} /> PostgreSQL · validated</span><button type="button" onClick={copySql}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}</button></div>
                  <pre><code>{scenario.sql}</code></pre>
                  <div className="demo-policy-strip"><span><ShieldCheck size={14} /> SELECT only</span><span><Check size={13} /> AST validated</span><span><Check size={13} /> Row limit enforced</span><span><Check size={13} /> Mutation blocked</span></div>
                </div>
              ) : view === "trace" ? (
                <div className="demo-trace-list">
                  {visibleTrace.map(({ step, done, active }, index) => (
                    <div className={`${done ? "done" : ""} ${active ? "active" : ""}`} key={step[0]}>
                      <span className="demo-trace-index">{done && !active ? <Check size={13} /> : String(index + 1).padStart(2, "0")}</span>
                      <span><strong>{step[0]}</strong><small>{step[1]}</small></span><time>{done ? step[2] : "—"}</time>
                    </div>
                  ))}
                </div>
              ) : (
                <div id="architecture" className="demo-architecture">
                  <div className="demo-arch-column"><span className="demo-arch-label">Interface</span><div><Search size={17} /><strong>Natural language</strong><small>Intent + context</small></div></div>
                  <ChevronRight className="demo-arch-arrow" size={18} />
                  <div className="demo-arch-column"><span className="demo-arch-label">Orchestrator</span><div className="accent"><Bot size={17} /><strong>Supervisor</strong><small>Route + plan</small></div></div>
                  <ChevronRight className="demo-arch-arrow" size={18} />
                  <div className="demo-arch-stack"><span className="demo-arch-label">Specialists</span>{tools.map(({ icon: Icon, name }) => <div key={name}><Icon size={14} /> {name}</div>)}</div>
                  <ChevronRight className="demo-arch-arrow" size={18} />
                  <div className="demo-arch-column"><span className="demo-arch-label">Governance</span><div><ShieldCheck size={17} /><strong>Policy gate</strong><small>Observe + audit</small></div></div>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="demo-inspector">
          <section className="demo-kpi-grid">
            <div className="liquid-card"><span><Clock3 size={14} /> Latency</span><strong>{runState === "complete" ? scenario.latency : "—"}<small>ms</small></strong><em>p95 healthy</em></div>
            <div className="liquid-card"><span><Activity size={14} /> Tokens</span><strong>{runState === "complete" ? scenario.tokens : "—"}</strong><em>budget 2.4k</em></div>
          </section>

          <section id="capabilities" className="demo-tools liquid-card">
            <div className="demo-section-heading"><span><Layers3 size={15} /> Agent toolkit</span><small>4 available</small></div>
            <div className="demo-tool-list">
              {tools.map(({ icon: Icon, name, detail, color }) => <button type="button" key={name} onClick={() => showDemoNotice(`${name} tool`)}><span className={`demo-tool-icon ${color}`}><Icon size={16} /></span><span><strong>{name} agent</strong><small>{detail}</small></span><ArrowUpRight size={13} /></button>)}
            </div>
          </section>

          <section className="demo-observability liquid-card">
            <div className="demo-section-heading"><span><BarChart3 size={15} /> Observability</span><small>last run</small></div>
            <div className="demo-mini-chart" aria-label="Latency by agent">
              {[42, 76, 100, 34, 63, 51].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}
            </div>
            <div className="demo-observability-row"><span>Success rate</span><strong>99.8%</strong></div>
            <div className="demo-progress"><span style={{ width: "99.8%" }} /></div>
            <div className="demo-observability-row"><span>Policy coverage</span><strong>100%</strong></div>
            <div className="demo-progress green"><span style={{ width: "100%" }} /></div>
          </section>

          <section className="demo-audit liquid-card">
            <div className="demo-section-heading"><span><FileCode2 size={15} /> Audit log</span><small>immutable</small></div>
            <div><time>now</time><span><strong>Query validated</strong><small>policy.select_only</small></span><CheckCircle2 size={14} /></div>
            <div><time>-0.4s</time><span><strong>Context retrieved</strong><small>{scenario.tables.length} schema objects</small></span><CheckCircle2 size={14} /></div>
            <div><time>-0.6s</time><span><strong>Route selected</strong><small>supervisor.sql</small></span><CheckCircle2 size={14} /></div>
          </section>
        </aside>
      </section>

      <footer className="demo-footer">
        <span><ShieldCheck size={13} /> Simulated data · no API keys · no database connection · no external writes</span>
        <a href="https://www.npmjs.com/package/melcp" target="_blank" rel="noreferrer">Explore melcp <ArrowUpRight size={13} /></a>
      </footer>

      {notice && <div className="demo-toast" role="status"><CheckCircle2 size={16} /><span>{notice}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notification"><X size={14} /></button></div>}
    </main>
  );
}
