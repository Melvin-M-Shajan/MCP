import { useEffect } from "react";
import { wsService } from "@/services/websocket";
import { useAgentStore } from "@/store/agentStore";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { AgentActivityViewer } from "@/components/agents/AgentActivityViewer";
import { AgentTimeline } from "@/components/agents/AgentTimeline";
import { SqlViewer } from "@/components/dashboard/SqlViewer";
import { SystemLogs } from "@/components/dashboard/SystemLogs";
import { AgentGraphView } from "@/components/observability/AgentGraphView";
import { ReasoningTreeView } from "@/components/observability/ReasoningTreeView";
import { TokenUsageChart } from "@/components/observability/TokenUsageChart";
import { PerformanceDashboard } from "@/components/observability/PerformanceDashboard";
import { ExecutionHistory } from "@/components/observability/ExecutionHistory";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Database, GitMerge, BrainCircuit, Palette } from "lucide-react";
import DemoOne from "@/components/demo";

export default function App() {
  const { fetchSessions } = useAgentStore();

  // Connect to API backend and fetch existing sessions on mount
  useEffect(() => {
    wsService.connect();
    fetchSessions();
    return () => wsService.disconnect();
  }, [fetchSessions]);

  return (
    <div className="dark flex flex-col h-screen w-full lg:flex-row overflow-hidden absolute inset-0 pt-14 text-white z-10">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover -z-10"
      >
        <source src="/3.mp4" type="video/mp4" />
      </video>

      {/* Navbar Placeholder (mimicking layout.tsx top bar) */}
      <header className="absolute top-0 left-0 right-0 h-14 border-b border-white/10 bg-black/40 backdrop-blur-xl z-50 flex items-center px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm">
            MCP
          </div>
          <h1 className="font-semibold text-lg tracking-tight">Multi-Agent Console</h1>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Socket Active</span>
          </div>
        </div>
      </header>

      {/* Left Pane - Chat & History split */}
      <div className="w-full lg:w-[450px] shrink-0 border-r border-white/10 h-full flex flex-col relative">
        {/* <div className="p-4 border-b border-white/10 shrink-0">
          <h2 className="font-semibold">Agent Chat</h2>
        </div> */}
        <div className="flex-1 min-h-0 relative">
          <ChatPanel />
        </div>
        <div className="h-[220px] shrink-0 glass-panel flex flex-col">
          <ExecutionHistory />
        </div>
      </div>

      {/* Right Pane - Advanced Telemetry Grid */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-4 gap-4 bg-black/20 backdrop-blur-sm relative">
        {/* Top: Performance KPIs & Timeline */}
        <div className="shrink-0 flex gap-4 xl:h-[120px]">
          <div className="flex-1">
            <PerformanceDashboard />
          </div>
          <div className="w-[400px] hidden xl:block">
            <AgentTimeline />
          </div>
        </div>

        {/* Main Observation Area (Tabs) */}
        <div className="flex-1 min-h-0 bg-transparent flex flex-col">
          <Tabs defaultValue="graph" className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <TabsList className="bg-black/40 border border-white/10 backdrop-blur-xl rounded-xl p-1 h-12 shadow-xl overflow-x-auto justify-start flex-nowrap custom-scrollbar">
                <TabsTrigger
                  value="graph"
                  className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 rounded-lg text-white/60 text-xs gap-2 px-4 h-full shrink-0"
                >
                  <GitMerge className="w-4 h-4" /> Agent Graph
                </TabsTrigger>
                <TabsTrigger
                  value="reasoning"
                  className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300 rounded-lg text-white/60 text-xs gap-2 px-4 h-full shrink-0"
                >
                  <BrainCircuit className="w-4 h-4" /> Reasoning Tree
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300 rounded-lg text-white/60 text-xs gap-2 px-4 h-full shrink-0"
                >
                  <Activity className="w-4 h-4" /> Live State
                </TabsTrigger>
                <TabsTrigger
                  value="sql"
                  className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 rounded-lg text-white/60 text-xs gap-2 px-4 h-full shrink-0"
                >
                  <Database className="w-4 h-4" /> Generated SQL
                </TabsTrigger>
                <TabsTrigger
                  value="showcase"
                  className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-300 rounded-lg text-white/60 text-xs gap-2 px-4 h-full shrink-0"
                >
                  {/* <Palette className="w-4 h-4" /> UI Showcase */}
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 min-h-0 relative">
              <TabsContent value="graph" className="h-full m-0 absolute inset-0 outline-none data-[state=active]:animate-in data-[state=inactive]:animate-out data-[state=active]:fade-in-0 data-[state=inactive]:fade-out-0">
                <AgentGraphView />
              </TabsContent>
              <TabsContent value="reasoning" className="h-full m-0 absolute inset-0 outline-none data-[state=active]:animate-in data-[state=inactive]:animate-out data-[state=active]:fade-in-0 data-[state=inactive]:fade-out-0">
                <ReasoningTreeView />
              </TabsContent>
              <TabsContent value="activity" className="h-full m-0 absolute inset-0 outline-none data-[state=active]:animate-in data-[state=inactive]:animate-out data-[state=active]:fade-in-0 data-[state=inactive]:fade-out-0">
                <AgentActivityViewer />
              </TabsContent>
              <TabsContent value="sql" className="h-full m-0 absolute inset-0 outline-none data-[state=active]:animate-in data-[state=inactive]:animate-out data-[state=active]:fade-in-0 data-[state=inactive]:fade-out-0">
                <SqlViewer />
              </TabsContent>
              <TabsContent value="showcase" className="h-full m-0 absolute inset-0 outline-none data-[state=active]:animate-in data-[state=inactive]:animate-out data-[state=active]:fade-in-0 data-[state=inactive]:fade-out-0 flex items-center justify-center p-8 bg-black/20 rounded-xl">
                <DemoOne />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Bottom Split - System Logs & Tokens */}
        <div className="shrink-0 xl:h-[220px] flex flex-col xl:flex-row gap-4 h-auto">
          <div className="flex-1 max-h-[220px] flex flex-col">
            <SystemLogs />
          </div>
          <div className="xl:w-[400px] w-full max-h-[220px]">
            <TokenUsageChart />
          </div>
        </div>
      </div>
    </div>
  );
}
