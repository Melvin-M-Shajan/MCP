import { Controller, Post, Body, Get } from '@nestjs/common';
import { OrchestratorService } from './orchestrator/orchestrator.service';
import { QueryRequestDto } from './dto/query.dto';

@Controller()
export class AppController {
  constructor(private readonly orchestratorService: OrchestratorService) { }

  @Get()
  healthCheck() {
    return { status: 'MCP Server is running', timestamp: new Date() };
  }

  @Post('query')
  async processQuery(@Body() body: QueryRequestDto) {
    // Process the query through the Multi-Agent Orchestrator
    const resultState = await this.orchestratorService.execute(
      body.query,
      body.sessionId,
      body.userRole
    );

    // Return the final state payload mapping to the client
    return {
      query: resultState.query,
      traces: resultState.agentResponses, // Exposes thinking visibility
      errors: resultState.errors,
      data: resultState.finalResponse, // Formatted summary/tables
    };
  }
}
