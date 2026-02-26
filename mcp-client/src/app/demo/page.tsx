"use client";

import { motion } from "framer-motion";
import { Sparkles, Database, Layers, ArrowRight } from "lucide-react";
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";

export default function DemoPage() {
    return (
        <div className="relative min-h-screen flex items-center justify-center p-8 bg-black overflow-hidden selection:bg-purple-500/30">
            {/* Unsplash Background Image with beautiful abstract liquid/glass look */}
            <div
                className="absolute inset-0 z-0 opacity-40 mix-blend-screen"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            />

            {/* Gradient Orbs for extra glow behind the card */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[128px] z-0" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-[128px] z-0" />

            {/* Glass Card Container */}
            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 flex flex-col items-center justify-center w-full max-w-2xl p-10 mx-auto border sm:p-16 rounded-[2rem] bg-white/5 border-white/10 backdrop-blur-2xl shadow-2xl"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="p-3 mb-6 border rounded-2xl bg-white/5 border-white/10 backdrop-blur-md"
                >
                    <Sparkles className="w-8 h-8 text-purple-300" />
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="mb-4 text-4xl mt-2 font-bold tracking-tight text-transparent sm:text-5xl bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/40 text-center"
                >
                    MCP Agent Interface
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="mb-10 text-lg text-center text-white/60 max-w-[400px]"
                >
                    Experience the next generation of multi-agent orchestration with our dynamic liquid UI.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="flex flex-col w-full gap-4 sm:flex-row sm:justify-center"
                >
                    <LiquidGlassButton variant="liquid" size="lg" className="w-full sm:w-auto">
                        <Layers className="w-5 h-5 mr-2" />
                        Launch Agents
                    </LiquidGlassButton>

                    <LiquidGlassButton variant="outline" size="lg" className="w-full sm:w-auto">
                        <Database className="w-5 h-5 mr-2" />
                        View Telemetry
                    </LiquidGlassButton>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="mt-12 text-sm text-white/40 flex items-center justify-center gap-2 hover:text-white/70 transition-colors cursor-pointer"
                >
                    Explore Documentation <ArrowRight className="w-4 h-4" />
                </motion.div>
            </motion.div>
        </div>
    );
}
