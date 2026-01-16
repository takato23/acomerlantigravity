/**
 * OpenAI Provider
 * Implementation for OpenAI's GPT models
 */

import {
  AIProvider,
  AIServiceConfig,
  AITextRequest,
  AIImageRequest,
  AITextResponse,
  AIStreamResponse,
  AIImageGenerationRequest,
  AIImageGenerationResponse,
  AIServiceError,
} from '../types';

import { AIProviderInterface, AIProviderCapabilities } from './AIProviderInterface';

interface OpenAIConfig {
  apiKey: string;
  organization?: string;
  baseURL?: string;
}

export class OpenAIProvider extends AIProviderInterface {
  name: AIProvider = 'openai';
  private apiKey: string;
  private useProxy: boolean = false;
  private organization?: string;
  private baseURL: string;

  constructor(config: OpenAIConfig & { useProxy?: boolean }) {
    super(config);
    this.apiKey = config.apiKey || '';
    this.useProxy = !!config.useProxy;
    this.organization = config.organization;
    this.baseURL = config.baseURL || 'https://api.openai.com/v1';
  }

  async generateText(
    request: AITextRequest,
    config: AIServiceConfig
  ): Promise<AITextResponse> {
    if (this.useProxy) {
      const { aiProxy } = require('@/lib/ai/AIProxyClient');
      const text = await aiProxy.generateText(request.prompt, 'openai', config.model);
      return {
        data: text,
        provider: 'openai',
        model: (config.model || 'gpt-3.5-turbo') as any,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        format: request.format || 'text',
        metadata: { requestId: 'proxy', timestamp: new Date(), processingTime: 0 }
      };
    }

    try {
      const messages = this.buildMessages(request);

      const response = await this.retry(async () => {
        const res = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            ...(this.organization && { 'OpenAI-Organization': this.organization }),
          },
          body: JSON.stringify({
            model: config.model || 'gpt-3.5-turbo',
            messages,
            temperature: config.temperature,
            max_tokens: config.maxTokens,
            top_p: config.topP,
            frequency_penalty: config.frequencyPenalty,
            presence_penalty: config.presencePenalty,
            response_format: request.format === 'json' ? { type: 'json_object' } : undefined,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error?.message || `HTTP ${res.status}`);
        }

        return res.json();
      }, config.retryAttempts, config.retryDelay);

      const choice = response.choices[0];
      const text = choice.message.content;

      return {
        data: text,
        provider: 'openai',
        model: response.model as any,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
          cost: this.calculateCost(response.model, response.usage),
        },
        format: request.format || 'text',
        metadata: {
          requestId: response.id,
          timestamp: new Date(response.created * 1000),
          processingTime: 0,
        },
      };
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  async streamText(
    request: AITextRequest,
    config: AIServiceConfig
  ): Promise<AIStreamResponse> {
    try {
      const messages = this.buildMessages(request);

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...(this.organization && { 'OpenAI-Organization': this.organization }),
        },
        body: JSON.stringify({
          model: config.model || 'gpt-3.5-turbo',
          messages,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          top_p: config.topP,
          frequency_penalty: config.frequencyPenalty,
          presence_penalty: config.presencePenalty,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }

      // Create stream from SSE response
      const stream = new ReadableStream<string>({
        async start(controller) {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') {
                    controller.close();
                    return;
                  }

                  try {
                    const json = JSON.parse(data);
                    const content = json.choices[0]?.delta?.content;
                    if (content) {
                      controller.enqueue(content);
                    }
                  } catch (e: unknown) {
                    // Skip invalid JSON
                  }
                }
              }
            }
          } catch (error: unknown) {
            controller.error(error);
          }
        },
      });

      return {
        stream,
        provider: 'openai',
        model: (config.model || 'gpt-3.5-turbo') as any,
      };
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  async generateImage(
    request: AIImageGenerationRequest,
    config: AIServiceConfig
  ): Promise<AIImageGenerationResponse> {
    try {
      const response = await this.retry(async () => {
        const res = await fetch(`${this.baseURL}/images/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            ...(this.organization && { 'OpenAI-Organization': this.organization }),
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: request.prompt,
            n: request.n || 1,
            size: request.size || '1024x1024',
            quality: request.quality || 'standard',
            style: request.style || 'natural',
            response_format: 'b64_json',
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error?.message || `HTTP ${res.status}`);
        }

        return res.json();
      }, config.retryAttempts, config.retryDelay);

      return {
        data: response.data.map((item: any) => ({
          url: item.url, // Might be undefined if response_format is b64_json, but typically provided or we use b64_json
          b64_json: item.b64_json,
          revised_prompt: item.revised_prompt,
        })),
        provider: 'openai',
        model: 'dall-e-3',
      };
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  async analyzeImage(
    request: AIImageRequest,
    config: AIServiceConfig
  ): Promise<AITextResponse> {
    try {
      // Convert image to base64 URL if needed
      let imageUrl: string;

      if (typeof request.image === 'string') {
        imageUrl = request.image;
      } else if (Buffer.isBuffer(request.image)) {
        const base64 = request.image.toString('base64');
        imageUrl = `data:${request.mimeType || 'image/jpeg'};base64,${base64}`;
      } else {
        // Blob
        const buffer = await (request.image as Blob).arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        imageUrl = `data:${(request.image as Blob).type};base64,${base64}`;
      }

      const messages = [
        {
          role: 'user' as const,
          content: [
            {
              type: 'text' as const,
              text: request.prompt || 'What is in this image?',
            },
            {
              type: 'image_url' as const,
              image_url: {
                url: imageUrl,
                detail: 'high' as const,
              },
            },
          ],
        },
      ];

      const response = await this.retry(async () => {
        const res = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            ...(this.organization && { 'OpenAI-Organization': this.organization }),
          },
          body: JSON.stringify({
            model: 'gpt-4-vision-preview',
            messages,
            max_tokens: config.maxTokens || 4096,
            temperature: config.temperature || 0.4,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error?.message || `HTTP ${res.status}`);
        }

        return res.json();
      }, config.retryAttempts, config.retryDelay);

      const text = response.choices[0].message.content;

      return {
        data: text,
        provider: 'openai',
        model: 'gpt-4-vision-preview' as any,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
          cost: this.calculateCost('gpt-4-vision-preview', response.usage),
        },
        format: 'text',
        metadata: {
          requestId: response.id,
          timestamp: new Date(response.created * 1000),
          processingTime: 0,
        },
      };
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  getCapabilities(): AIProviderCapabilities {
    return {
      textGeneration: true,
      imageAnalysis: true,
      streaming: true,
      functionCalling: true,
      maxTokens: 128000, // GPT-4 Turbo
    };
  }

  private calculateCost(model: string, usage: any): number {
    // Pricing as of 2024 (per 1K tokens)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-32k': { input: 0.06, output: 0.12 },
      'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
      'gpt-4-vision-preview': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 },
    };

    const modelPricing = pricing[model] || pricing['gpt-3.5-turbo'];
    const inputCost = (usage.prompt_tokens / 1000) * modelPricing.input;
    const outputCost = (usage.completion_tokens / 1000) * modelPricing.output;

    return inputCost + outputCost;
  }

  private handleError(error: any): AIServiceError {
    const message = error.message || 'OpenAI API error';
    let code: any = 'PROVIDER_ERROR';

    if (message.includes('401') || message.includes('api key')) {
      code = 'AUTHENTICATION_ERROR';
    } else if (message.includes('429') || message.includes('rate limit')) {
      code = 'RATE_LIMIT';
    } else if (message.includes('quota')) {
      code = 'QUOTA_EXCEEDED';
    } else if (message.includes('timeout')) {
      code = 'TIMEOUT';
    }

    return new AIServiceError(message, code, 'openai', error);
  }
}
