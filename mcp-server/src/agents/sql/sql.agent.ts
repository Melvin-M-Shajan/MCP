import { Injectable, Logger, Inject } from '@nestjs/common';
import { z } from 'zod';
import { BaseAgent, State, AgentResponse } from '../../interfaces/core.interface';
import { SchemaService } from '../../database/schema.service';
import { ReasoningLogger } from '../../logging/reasoning.logger';
import type { AIProvider } from '../../ai/ai.provider.interface';
import { SQL_GENERATION_PROMPT_V1 } from '../../prompts/sql.prompt';

@Injectable()
export class SqlAgent implements BaseAgent {
    name = 'SQL_AGENT';
    private readonly logger = new Logger(SqlAgent.name);

    // Define strict Zod schema for structured output
    private readonly sqlSchema = z.object({
        interpretation: z.string().describe('How you understand the user query in the context of the database.'),
        tables_used: z.array(z.string()).describe('The specific tables you have selected from the schema to fulfill the query.'),
        sql: z.string().describe('The generated PostgreSQL query. DO NOT include markdown formatting or backticks.'),
    });

    constructor(
        private readonly schemaService: SchemaService,
        @Inject('AIProvider') private readonly aiProvider: AIProvider
    ) { }

    async execute(state: State): Promise<AgentResponse> {
        const startTime = Date.now();
        const traceId = `trace-${Date.now()}`;
        const reasoningLogger = new ReasoningLogger(traceId);

        try {
            this.logger.log('Starting SQL Generation Agent via AIProvider...');
            const schemaCtx = this.schemaService.getSchema();

            // Hydrate Prompt Template
            let hydratedPrompt = SQL_GENERATION_PROMPT_V1
                .replace('{{schemaCtx}}', schemaCtx)
                .replace('{{query}}', state.query);

            // Execute explicitly through the AI Provider abstraction
            const response = await this.aiProvider.generateStructured(
                hydratedPrompt,
                this.sqlSchema,
                'sql_generation',
                [reasoningLogger],
                0 // Zero temperature for SQL determinism
            );

            return {
                agentName: this.name,
                reasoning: `Interpretation: ${response.interpretation}. Tables Selected: [${response.tables_used.join(', ')}].\nLogs: ${reasoningLogger.getLogs().join(' | ')}`,
                input: state.query,
                output: { sql: response.sql },
                tokensUsed: reasoningLogger.getTokenUsage(), // Now formally pulled from logger
                executionTime: Date.now() - startTime,
            };

        } catch (error: any) {
            this.logger.error(`SQL Agent Error: ${error.message}`);
            return {
                agentName: this.name,
                reasoning: 'Failed to generate SQL via AIProvider',
                input: state.query,
                output: null,
                error: error.message,
                executionTime: Date.now() - startTime,
            };
        }
    }
}
