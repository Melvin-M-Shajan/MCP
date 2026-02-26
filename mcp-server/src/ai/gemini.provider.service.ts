import { Injectable, Logger } from '@nestjs/common';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import { z } from 'zod';
import { AIProvider } from './ai.provider.interface';
import { delay, retryWhen, scan } from 'rxjs/operators';
import { defer, lastValueFrom } from 'rxjs';

@Injectable()
export class GeminiProviderService implements AIProvider {
    private readonly logger = new Logger(GeminiProviderService.name);

    // Maximum retries for transient LLM parsing errors
    private readonly MAX_RETRIES = 3;

    /**
     * Instantiates a generic model wrapper
     */
    private getModel(temperature: number = 0) {
        return new ChatGoogleGenerativeAI({
            model: 'gemini-2.5-flash',
            temperature,
            maxRetries: 2, // Native Langchain retries for networking issues
        });
    }

    /**
     * Generates structured output with explicit RxJS retries for semantic hallucination failures
     */
    async generateStructured<T>(
        prompt: string,
        schema: z.ZodSchema<T>,
        schemaName: string,
        callbacks?: BaseCallbackHandler[],
        temperature: number = 0
    ): Promise<T> {
        const model = this.getModel(temperature).withStructuredOutput(schema, { name: schemaName });

        // RxJS execution block for complex custom retry logic (e.g. LLM didn't match Zod exactly)
        const executePipeline = defer(() => model.invoke(prompt, { callbacks })).pipe(
            retryWhen((errors) =>
                errors.pipe(
                    scan((retryCount, error) => {
                        if (retryCount >= this.MAX_RETRIES) {
                            this.logger.error(`Failed after ${this.MAX_RETRIES} retries. Error: ${error.message}`);
                            throw error;
                        }
                        this.logger.warn(`LLM parsing error detected. Retrying... Attempts so far: ${retryCount + 1}`);
                        return retryCount + 1;
                    }, 0),
                    delay(1000) // 1 second delay between retries
                )
            )
        );

        return lastValueFrom(executePipeline) as Promise<T>;
    }

    /**
     * Generates an AsyncGenerator for streaming responses
     */
    async *generateStream(
        prompt: string,
        callbacks?: BaseCallbackHandler[],
        temperature: number = 0.5
    ): AsyncGenerator<string> {
        const model = this.getModel(temperature);

        // LangChain .stream() returns an AsyncGenerator of BaseMessages
        const stream = await model.stream(prompt, { callbacks });

        for await (const chunk of stream) {
            if (typeof chunk.content === 'string') {
                yield chunk.content;
            }
        }
    }
}
