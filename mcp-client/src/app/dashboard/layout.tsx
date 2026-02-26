import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/app/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'MCP Multi-Agent Dashboard',
    description: 'Production-grade interactive AI orchestration UI',
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className={`${inter.className} min-h-screen bg-[#09090b] text-white selection:bg-purple-500/30 overflow-hidden`}>
            {/* Global abstract liquid background matching the theme */}
            <div
                className="fixed inset-0 z-0 opacity-20 mix-blend-screen pointer-events-none"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            />
            {/* Ambient static lighting */}
            <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[150px] pointer-events-none z-0" />
            <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none z-0" />

            <main className="relative z-10 h-screen w-screen overflow-hidden flex flex-col">
                {/* Top Navbar */}
                <header className="h-14 border-b border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                            <span className="font-bold text-white text-xs tracking-wider">MCP</span>
                        </div>
                        <h1 className="font-medium text-white/90">Multi-Agent Console</h1>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Socket Active
                        </div>
                    </div>
                </header>

                {/* Main Dashboard Content */}
                <div className="flex-1 overflow-hidden">
                    {children}
                </div>
            </main>
        </div>
    )
}
