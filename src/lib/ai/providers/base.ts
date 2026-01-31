export interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface AIProviderOptions {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
}

export interface AIProvider {
    generateText(systemPrompt: string, userPrompt: string, options?: AIProviderOptions): Promise<string>;
    generateJSON<T>(systemPrompt: string, userPrompt: string, options?: AIProviderOptions): Promise<T>;
}
