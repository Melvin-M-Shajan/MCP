import { Injectable, Logger, Inject } from '@nestjs/common';
import { z } from 'zod';
import { BaseAgent, State, AgentResponse } from '../../interfaces/core.interface';
import { ReasoningLogger } from '../../logging/reasoning.logger';
import type { AIProvider } from '../../ai/ai.provider.interface';
import { SUPERVISOR_DECOMPOSITION_PROMPT_V1 } from '../../prompts/supervisor.prompt';

@Injectable()
export class SupervisorAgent implements BaseAgent {
    name = 'SUPERVISOR_AGENT';
    private readonly logger = new Logger(SupervisorAgent.name);

    private readonly routeSchema = z.object({
        reasoning: z.string().describe('Explain why this particular route structure was chosen.'),
        mode: z.enum(['SEQUENTIAL', 'PARALLEL']).describe('How to execute the downstream agents.'),
        nextAgents: z.array(z.string()).describe('The exact string names of the agents to invoke, e.g. SQL_AGENT or TASK_AGENT.'),
        confidenceScore: z.number().min(0).max(1).describe('Confidence in the ability of selected agents to fulfill the query (0 to 1).'),
    });

    constructor(
        @Inject('AIProvider') private readonly aiProvider: AIProvider
    ) { }

    async execute(state: State): Promise<AgentResponse> {
        const startTime = Date.now();
        const traceId = `trace-supervisor-${Date.now()}`;
        const reasoningLogger = new ReasoningLogger(traceId);

        try {
            this.logger.log('Starting Supervisor Agent via AIProvider...');

            const hydratedPrompt = SUPERVISOR_DECOMPOSITION_PROMPT_V1
                .replace('{{query}}', state.query);

            const response = await this.aiProvider.generateStructured(
                hydratedPrompt,
                this.routeSchema,
                'supervisor_routing',
                [reasoningLogger],
                0 // Deterministic logic routing
            );

            return {
                agentName: this.name,
                reasoning: `Confidence [${response.confidenceScore}]: ${response.reasoning}`,
                input: state.query,
                output: response,
                tokensUsed: reasoningLogger.getTokenUsage(),
                executionTime: Date.now() - startTime,
            };

        } catch (error: any) {
            this.logger.error(`Supervisor Routing Error: ${error.message}`);
            // Fallback routing if LLM fails
            return {
                agentName: this.name,
                reasoning: 'Fallback invoked due to generic error',
                input: state.query,
                output: { nextAgents: ['TASK_AGENT'], mode: 'SEQUENTIAL', confidenceScore: 0.1 },
                executionTime: Date.now() - startTime,
                error: error.message
            };
        }
    }
}
