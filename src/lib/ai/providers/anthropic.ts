import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, AIProviderOptions } from './base';
import { aiConfig } from '../config';

export class AnthropicProvider implements AIProvider {
    private client: Anthropic;
    private model: string;

    constructor(apiKey: string, model: string = 'claude-3-opus-20240229') {
        this.client = new Anthropic({
            apiKey: apiKey,
            timeout: 120000,
            maxRetries: 2,
        });
        this.model = model;
    }

    async generateText(systemPrompt: string, userPrompt: string, options?: AIProviderOptions): Promise<string> {
        const config = aiConfig.getModelConfig();
        const completion = await this.client.messages.create({
            model: this.model,
            max_tokens: options?.maxTokens ?? config.maxTokens ?? 1500,
            temperature: options?.temperature ?? config.temperature ?? 0.3,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }]
        });

        const content = completion.content[0];
        if (content.type === 'text') {
            return content.text;
        }
        return '';
    }

    async generateJSON<T>(systemPrompt: string, userPrompt: string, options?: AIProviderOptions): Promise<T> {
        const config = aiConfig.getModelConfig();
        const completion = await this.client.messages.create({
            model: this.model,
            max_tokens: options?.maxTokens ?? config.maxTokens ?? 1500,
            temperature: options?.temperature ?? config.temperature ?? 0.3,
            system: systemPrompt + ' Respond in JSON format only.',
            messages: [{ role: 'user', content: userPrompt }]
        });

        const content = completion.content[0];
        if (content.type !== 'text') {
            throw new Error('Unexpected response type from Anthropic');
        }

        try {
            // Basic extraction if it contains markdown code blocks
            const text = content.text;
            const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ||
                text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);

            const jsonString = jsonMatch ? jsonMatch[1] : text;
            return JSON.parse(jsonString) as T;
        } catch (error) {
            throw new Error(`Failed to parse JSON from Anthropic: ${error}`);
        }
    }
}
