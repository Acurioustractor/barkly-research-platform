import OpenAI from 'openai';
import { AIProvider, AIProviderOptions } from './base';
import { aiConfig } from '../config';

export class OpenAIProvider implements AIProvider {
    private client: OpenAI;
    private model: string;

    constructor(apiKey: string, model: string = 'gpt-4-turbo') {
        this.client = new OpenAI({
            apiKey: apiKey,
            timeout: 120000,
            maxRetries: 2,
        });
        this.model = model;
    }

    async generateText(systemPrompt: string, userPrompt: string, options?: AIProviderOptions): Promise<string> {
        const config = aiConfig.getModelConfig();
        const completion = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: options?.temperature ?? config.temperature ?? 0.3,
            max_tokens: options?.maxTokens ?? config.maxTokens ?? 1500,
            top_p: options?.topP ?? config.topP,
            frequency_penalty: options?.frequencyPenalty ?? config.frequencyPenalty,
            presence_penalty: options?.presencePenalty ?? config.presencePenalty,
        });

        return completion.choices[0]?.message?.content || '';
    }

    async generateJSON<T>(systemPrompt: string, userPrompt: string, options?: AIProviderOptions): Promise<T> {
        const config = aiConfig.getModelConfig();
        const completion = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: options?.temperature ?? config.temperature ?? 0.3,
            max_tokens: options?.maxTokens ?? config.maxTokens ?? 1500,
            top_p: options?.topP ?? config.topP,
            frequency_penalty: options?.frequencyPenalty ?? config.frequencyPenalty,
            presence_penalty: options?.presencePenalty ?? config.presencePenalty,
            response_format: { type: 'json_object' }
        });

        const response = completion.choices[0]?.message?.content || '{}';
        try {
            return JSON.parse(response) as T;
        } catch (error) {
            throw new Error(`Failed to parse JSON: ${error}`);
        }
    }
}
