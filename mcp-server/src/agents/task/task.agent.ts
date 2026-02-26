import { BaseAgent, State, AgentResponse } from '../../interfaces/core.interface';

export class TaskAgent implements BaseAgent {
    name = 'TASK_AGENT';

    async execute(state: State): Promise<AgentResponse> {
        const startTime = Date.now();

        return {
            agentName: this.name,
            reasoning: 'This is a general task. Replying with standard text.',
            input: state.query,
            output: { text: "This is a generic task response from the TASK_AGENT." },
            tokensUsed: { prompt: 5, completion: 5, total: 10 },
            executionTime: Date.now() - startTime,
        };
    }
}
