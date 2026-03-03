import { Injectable, Logger, Inject } from '@nestjs/common';
import { z } from 'zod';
import { BaseAgent, State, AgentResponse } from '../../interfaces/core.interface';
import { ReasoningLogger } from '../../logging/reasoning.logger';
import type { AIProvider } from '../../ai/ai.provider.interface';

@Injectable()
export class TaskAgent implements BaseAgent {
    name = 'TASK_AGENT';
    private readonly logger = new Logger(TaskAgent.name);

    private readonly taskSchema = z.object({
        response: z.string().describe('Your helpful, conversational response to the user query.'),
    });

    constructor(
        @Inject('AIProvider') private readonly aiProvider: AIProvider
    ) { }

    async execute(state: State): Promise<AgentResponse> {
        const startTime = Date.now();
        const traceId = `trace-task-${Date.now()}`;
        const reasoningLogger = new ReasoningLogger(traceId);

        try {
            this.logger.log('Starting Task Agent via AIProvider...');

            const hydratedPrompt = `
You are a helpful, intelligent AI assistant in a complex multi-agent system.
The user has asked a general question or given a task that does not require database access.
Respond conversationally, helpfully, and directly.

User Query:
${state.query}
            `.trim();

            const response = await this.aiProvider.generateStructured(
                hydratedPrompt,
                this.taskSchema,
                'task_response',
                [reasoningLogger],
                0.7, // Higher temperature for conversational responses
                state.provider
            );

            return {
                agentName: this.name,
                reasoning: `Conversational response generated.`,
                input: state.query,
                output: { text: response.response },
                tokensUsed: reasoningLogger.getTokenUsage(),
                executionTime: Date.now() - startTime,
            };

        } catch (error: any) {
            this.logger.error(`Task Agent Error: ${error.message}`);
            return {
                agentName: this.name,
                reasoning: 'Fallback invoked due to generic error',
                input: state.query,
                output: { text: "I'm sorry, I encountered an error while processing your request." },
                executionTime: Date.now() - startTime,
                error: error.message
            };
        }
    }
}
