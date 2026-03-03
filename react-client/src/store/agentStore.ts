import { create } from 'zustand';
import type { AgentExecution, ChatMessage, SystemLog, AgentStatus } from '@/types/agent';
import { v4 as uuidv4 } from 'uuid';

export type AIProviderName = 'gemini' | 'groq';

interface AgentStoreState {
    currentExecutionId: string | null;
    messages: ChatMessage[];
    agents: AgentExecution[];
    logs: SystemLog[];
    isThinking: boolean;
    provider: AIProviderName;
    providerLimitReached: Record<AIProviderName, boolean>;

    // Actions
    addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    updateStreamingMessage: (content: string) => void;
    updateAgent: (id: string, partial: Partial<AgentExecution>) => void;
    addLog: (log: Omit<SystemLog, 'id' | 'timestamp'>) => void;
    startExecution: () => void;
    stopExecution: () => void;
    reset: () => void;
    setProvider: (provider: AIProviderName) => void;
    setProviderLimitReached: (provider: AIProviderName, reached: boolean) => void;
}

export const useAgentStore = create<AgentStoreState>((set) => ({
    currentExecutionId: null,
    messages: [],
    agents: [],
    logs: [],
    isThinking: false,
    provider: 'gemini',
    providerLimitReached: { gemini: false, groq: false },

    setProvider: (provider) => set({ provider }),

    setProviderLimitReached: (provider, reached) =>
        set((state) => ({
            providerLimitReached: { ...state.providerLimitReached, [provider]: reached },
        })),

    addMessage: (msg) => set((state) => ({
        messages: [...state.messages, { ...msg, id: uuidv4(), timestamp: new Date().toISOString() }],
    })),

    updateStreamingMessage: (content) => set((state) => {
        const messages = [...state.messages];
        const lastMessage = messages[messages.length - 1];

        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isStreaming) {
            lastMessage.content += content;
            return { messages };
        }

        messages.push({
            id: uuidv4(),
            role: 'assistant',
            content,
            timestamp: new Date().toISOString(),
            isStreaming: true
        });
        return { messages };
    }),

    updateAgent: (id, partial) => set((state) => {
        const agentIndex = state.agents.findIndex(a => a.id === id);
        if (agentIndex > -1) {
            const newAgents = [...state.agents];
            newAgents[agentIndex] = { ...newAgents[agentIndex], ...partial };
            return { agents: newAgents };
        }

        if (partial.name && partial.status) {
            return {
                agents: [...state.agents, {
                    id,
                    name: partial.name,
                    status: partial.status as AgentStatus,
                    reasoning: partial.reasoning || '',
                    executionTimeMs: partial.executionTimeMs || 0,
                    tokensUsed: partial.tokensUsed || 0,
                    startTime: Date.now(),
                    ...partial
                }]
            };
        }
        return state;
    }),

    addLog: (log) => set((state) => ({
        logs: [...state.logs, { ...log, id: uuidv4(), timestamp: new Date().toISOString() }].slice(-100),
    })),

    startExecution: () => set({
        currentExecutionId: uuidv4(),
        isThinking: true,
        agents: [],
    }),

    stopExecution: () => set((state) => {
        const messages = [...state.messages];
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.isStreaming) {
            lastMessage.isStreaming = false;
        }
        return { isThinking: false, messages };
    }),

    reset: () => set({ currentExecutionId: null, messages: [], agents: [], logs: [], isThinking: false }),
}));
