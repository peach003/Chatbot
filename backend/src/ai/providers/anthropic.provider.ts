/**
 * Anthropic Provider
 * Concrete implementation of LLM provider using Anthropic SDK
 */

import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { BaseLLMProvider } from './base-provider';
import {
  ChatMessage,
  LLMCompletionResponse,
  LLMOptions,
  LLMStreamChunk,
  MessageRole,
} from '../types';

@Injectable()
export class AnthropicProvider extends BaseLLMProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    super('anthropic');

    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }

    this.client = new Anthropic({
      apiKey,
    });

    this.logger.log('Anthropic provider initialized');
  }

  /**
   * Generate completion from a single prompt
   */
  async complete(
    prompt: string,
    options: LLMOptions,
  ): Promise<LLMCompletionResponse> {
    try {
      const validatedOptions = this.validateOptions(options);

      this.logRequest('Complete', validatedOptions.model);

      const response = await this.client.messages.create({
        model: validatedOptions.model,
        max_tokens: validatedOptions.maxTokens || 2048,
        messages: [{ role: 'user', content: prompt }],
        temperature: validatedOptions.temperature,
        top_p: validatedOptions.topP,
        stop_sequences: validatedOptions.stop,
      });

      const result = this.formatResponse(response);
      this.logResponse(result);

      return result;
    } catch (error) {
      return this.handleError(error, 'Complete');
    }
  }

  /**
   * Generate chat completion
   */
  async chat(
    messages: ChatMessage[],
    options: LLMOptions,
  ): Promise<LLMCompletionResponse> {
    try {
      const validatedOptions = this.validateOptions(options);

      this.logRequest('Chat', validatedOptions.model, messages.length);

      // Anthropic requires system messages to be separate
      const { system, anthropicMessages } = this.convertMessages(messages);

      const requestParams: Anthropic.MessageCreateParams = {
        model: validatedOptions.model,
        max_tokens: validatedOptions.maxTokens || 2048,
        messages: anthropicMessages,
        temperature: validatedOptions.temperature,
        top_p: validatedOptions.topP,
        stop_sequences: validatedOptions.stop,
      };

      if (system) {
        requestParams.system = system;
      }

      const response = await this.client.messages.create(requestParams);

      const result = this.formatResponse(response);
      this.logResponse(result);

      return result;
    } catch (error) {
      return this.handleError(error, 'Chat');
    }
  }

  /**
   * Generate streaming completion
   */
  async *stream(
    messages: ChatMessage[],
    options: LLMOptions,
  ): AsyncIterator<LLMStreamChunk> {
    try {
      const validatedOptions = this.validateOptions(options);

      this.logRequest('Stream', validatedOptions.model, messages.length);

      const { system, anthropicMessages } = this.convertMessages(messages);

      const requestParams: Anthropic.MessageCreateParams = {
        model: validatedOptions.model,
        max_tokens: validatedOptions.maxTokens || 2048,
        messages: anthropicMessages,
        temperature: validatedOptions.temperature,
        top_p: validatedOptions.topP,
        stop_sequences: validatedOptions.stop,
      };

      if (system) {
        requestParams.system = system;
      }

      const stream = await this.client.messages.stream(requestParams);

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          const delta = event.delta;
          if (delta.type === 'text_delta') {
            yield {
              content: delta.text,
              isComplete: false,
            };
          }
        } else if (event.type === 'message_stop') {
          yield {
            content: '',
            isComplete: true,
            metadata: {
              stopReason: 'end_turn',
            },
          };
        }
      }

      this.logger.debug('Stream completed');
    } catch (error) {
      this.logger.error(`Stream failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate structured JSON output
   */
  async generateJSON<T = any>(
    messages: ChatMessage[],
    schema: Record<string, any>,
    options: LLMOptions,
  ): Promise<T> {
    try {
      const validatedOptions = this.validateOptions(options);

      this.logRequest('GenerateJSON', validatedOptions.model, messages.length);

      // Add JSON instruction to messages
      const modifiedMessages = [...messages];
      const lastMessage = modifiedMessages[modifiedMessages.length - 1];
      lastMessage.content += '\n\nRespond with valid JSON only. Do not include any other text.';

      const { system, anthropicMessages } = this.convertMessages(modifiedMessages);

      const requestParams: Anthropic.MessageCreateParams = {
        model: validatedOptions.model,
        max_tokens: validatedOptions.maxTokens || 2048,
        messages: anthropicMessages,
        temperature: validatedOptions.temperature,
      };

      if (system) {
        requestParams.system = system;
      }

      const response = await this.client.messages.create(requestParams);

      const content = this.extractContent(response);

      // Track usage
      this.trackUsage(
        response.model,
        response.usage.input_tokens,
        response.usage.output_tokens,
      );

      // Parse and return JSON
      const parsed = JSON.parse(content);

      this.logger.debug(`JSON generated successfully`);

      return parsed as T;
    } catch (error) {
      return this.handleError(error, 'GenerateJSON');
    }
  }

  /**
   * Check if Anthropic is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Try a minimal request as health check
      await this.client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      });
      return true;
    } catch (error) {
      this.logger.warn(`Anthropic availability check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Convert messages to Anthropic format
   * Anthropic requires system messages to be separate from the messages array
   */
  private convertMessages(messages: ChatMessage[]): {
    system?: string;
    anthropicMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  } {
    let system: string | undefined;
    const anthropicMessages: Array<{ role: 'user' | 'assistant'; content: string }> =
      [];

    for (const msg of messages) {
      if (msg.role === MessageRole.SYSTEM) {
        // Combine all system messages
        system = system ? `${system}\n\n${msg.content}` : msg.content;
      } else if (msg.role === MessageRole.USER || msg.role === MessageRole.ASSISTANT) {
        anthropicMessages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    return { system, anthropicMessages };
  }

  /**
   * Extract content from Anthropic response
   */
  private extractContent(response: Anthropic.Message): string {
    const contentBlock = response.content[0];
    if (contentBlock && contentBlock.type === 'text') {
      return contentBlock.text;
    }
    return '';
  }

  /**
   * Format Anthropic response to our standard format
   */
  private formatResponse(response: Anthropic.Message): LLMCompletionResponse {
    const content = this.extractContent(response);

    // Track usage
    this.trackUsage(
      response.model,
      response.usage.input_tokens,
      response.usage.output_tokens,
    );

    return {
      content,
      model: response.model,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      finishReason: response.stop_reason || 'unknown',
      metadata: {
        id: response.id,
        type: response.type,
        role: response.role,
      },
    };
  }

  /**
   * Calculate cost for Anthropic models
   * Pricing as of 2025 (update as needed)
   */
  protected calculateCost(
    model: string,
    promptTokens: number,
    completionTokens: number,
  ): number {
    // Pricing per 1M tokens (input / output)
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
      'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
      'claude-3-5-haiku-20241022': { input: 0.8, output: 4.0 },
      'claude-3-sonnet-20240229': { input: 3.0, output: 15.0 },
      'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
    };

    const modelPricing = pricing[model] || pricing['claude-3-5-haiku-20241022'];

    return (
      (promptTokens / 1_000_000) * modelPricing.input +
      (completionTokens / 1_000_000) * modelPricing.output
    );
  }
}
