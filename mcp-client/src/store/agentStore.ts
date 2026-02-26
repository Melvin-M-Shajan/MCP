import { create } from 'zustand';
import { AgentExecution, ChatMessage, SystemLog } from '@/types/agent';
import { v4 as uuidv4 } from 'uuid';

interface AgentStoreState {
    currentExecutionId: string | null;
    messages: ChatMessage[];
    agents: AgentExecution[];
    logs: SystemLog[];
    isThinking: boolean;

    // Actions
    addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    updateStreamingMessage: (content: string) => void;
    updateAgent: (id: string, partial: Partial<AgentExecution>) => void;
    addLog: (log: Omit<SystemLog, 'id' | 'timestamp'>) => void;
    startExecution: () => void;
    stopExecution: () => void;
    reset: () => void;
}

export const useAgentStore = create<AgentStoreState>((set) => ({
    currentExecutionId: null,
    messages: [],
    agents: [],
    logs: [],
    isThinking: false,

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

        // If no streaming message exists, create one
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

        // If agent doesn't exist, create it (assuming minimum fields are passed)
        if (partial.name && partial.status) {
            return {
                agents: [...state.agents, {
                    id,
                    name: partial.name,
                    status: partial.status as any,
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
        logs: [...state.logs, { ...log, id: uuidv4(), timestamp: new Date().toISOString() }].slice(-100) // Keep last 100
    })),

    startExecution: () => set({
        currentExecutionId: uuidv4(),
        isThinking: true,
        agents: [], // Clear previous agents for new execution
    }),

    stopExecution: () => set((state) => {
        const messages = [...state.messages];
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.isStreaming) {
            lastMessage.isStreaming = false;
        }

        return {
            isThinking: false,
            messages
        };
    }),

    reset: () => set({ currentExecutionId: null, messages: [], agents: [], logs: [], isThinking: false }),
}));
