import { MoonshotClient } from '../moonshot-client';
import { AIProvider, AIProviderOptions } from './base';
import { aiConfig } from '../config';

export class MoonshotProvider implements AIProvider {
    private client: MoonshotClient;
    private model: string;

    constructor(apiKey: string, model: string = 'moonshot-v1-8k') {
        this.client = new MoonshotClient({
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
        });

        const response = completion.choices[0]?.message?.content || '{}';
        try {
            // Basic extraction 
            const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
                response.match(/(\{[\s\S]*\})/);

            const jsonString = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonString) as T;
        } catch (error) {
            throw new Error(`Failed to parse JSON from Moonshot: ${error}`);
        }
    }
}
