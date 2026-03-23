export interface AgentTokensUsed {
  prompt: number;
  completion: number;
  total: number;
}

export interface AgentResponse {
  agentName: string;
  reasoning: string;   // The internal thought process or LangChain intermediate steps
  input: any;          // What the agent received
  output: any;         // The final agent output (SQL, JSON, text)
  tokensUsed?: AgentTokensUsed;
  executionTime: number; // in milliseconds
  error?: string;        // Optional error description if agent failed internally
}

export interface State {
  query: string;
  userRole?: string;
  intent?: string;
  sqlQuery?: string;
  dbResults?: any;
  finalResponse?: any;
  chatHistory: any[];
  agentResponses: AgentResponse[];
  errors: string[];
  provider?: 'gemini' | 'groq';
  targetFile?: string;
}

export interface BaseAgent {
  name: string;
  execute(state: State): Promise<AgentResponse>;
}
