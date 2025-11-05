/**
 * OpenAI Provider
 * Concrete implementation of LLM provider using OpenAI SDK
 */

import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { BaseLLMProvider } from './base-provider';
import {
  ChatMessage,
  LLMCompletionResponse,
  LLMOptions,
  LLMStreamChunk,
  MessageRole,
} from '../types';

@Injectable()
export class OpenAIProvider extends BaseLLMProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    super('openai');

    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey,
    });

    this.logger.log('OpenAI provider initialized');
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

      const response = await this.client.chat.completions.create({
        model: validatedOptions.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: validatedOptions.temperature,
        max_tokens: validatedOptions.maxTokens,
        top_p: validatedOptions.topP,
        frequency_penalty: validatedOptions.frequencyPenalty,
        presence_penalty: validatedOptions.presencePenalty,
        stop: validatedOptions.stop,
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

      const openaiMessages = messages.map((msg) => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
        ...(msg.name && { name: msg.name }),
      }));

      const response = await this.client.chat.completions.create({
        model: validatedOptions.model,
        messages: openaiMessages,
        temperature: validatedOptions.temperature,
        max_tokens: validatedOptions.maxTokens,
        top_p: validatedOptions.topP,
        frequency_penalty: validatedOptions.frequencyPenalty,
        presence_penalty: validatedOptions.presencePenalty,
        stop: validatedOptions.stop,
      });

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

      const openaiMessages = messages.map((msg) => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
        ...(msg.name && { name: msg.name }),
      }));

      const stream = await this.client.chat.completions.create({
        model: validatedOptions.model,
        messages: openaiMessages,
        temperature: validatedOptions.temperature,
        max_tokens: validatedOptions.maxTokens,
        top_p: validatedOptions.topP,
        frequency_penalty: validatedOptions.frequencyPenalty,
        presence_penalty: validatedOptions.presencePenalty,
        stop: validatedOptions.stop,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        const isComplete = chunk.choices[0]?.finish_reason !== null;

        yield {
          content: delta,
          isComplete,
          metadata: {
            model: chunk.model,
            finishReason: chunk.choices[0]?.finish_reason,
          },
        };
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

      const openaiMessages = messages.map((msg) => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
        ...(msg.name && { name: msg.name }),
      }));

      // Add JSON instruction to the last user message
      const lastMessageIndex = openaiMessages.length - 1;
      openaiMessages[lastMessageIndex].content += '\n\nRespond with valid JSON only.';

      const response = await this.client.chat.completions.create({
        model: validatedOptions.model,
        messages: openaiMessages,
        temperature: validatedOptions.temperature,
        max_tokens: validatedOptions.maxTokens,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';

      // Track usage
      this.trackUsage(
        response.model,
        response.usage?.prompt_tokens || 0,
        response.usage?.completion_tokens || 0,
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
   * Check if OpenAI is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Try to list models as a health check
      await this.client.models.list();
      return true;
    } catch (error) {
      this.logger.warn(`OpenAI availability check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Format OpenAI response to our standard format
   */
  private formatResponse(
    response: OpenAI.Chat.Completions.ChatCompletion,
  ): LLMCompletionResponse {
    const choice = response.choices[0];
    const content = choice?.message?.content || '';

    // Track usage
    this.trackUsage(
      response.model,
      response.usage?.prompt_tokens || 0,
      response.usage?.completion_tokens || 0,
    );

    return {
      content,
      model: response.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      finishReason: choice?.finish_reason || 'unknown',
      metadata: {
        id: response.id,
        created: response.created,
        systemFingerprint: response.system_fingerprint,
      },
    };
  }

  /**
   * Calculate cost for OpenAI models
   * Pricing as of 2025 (update as needed)
   */
  protected calculateCost(
    model: string,
    promptTokens: number,
    completionTokens: number,
  ): number {
    // Pricing per 1M tokens (input / output)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 2.5, output: 10.0 },
      'gpt-4o-mini': { input: 0.15, output: 0.6 },
      'gpt-4-turbo': { input: 10.0, output: 30.0 },
      'gpt-4-turbo-preview': { input: 10.0, output: 30.0 },
      'gpt-4': { input: 30.0, output: 60.0 },
      'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
    };

    const modelPricing = pricing[model] || pricing['gpt-4o-mini'];

    return (
      (promptTokens / 1_000_000) * modelPricing.input +
      (completionTokens / 1_000_000) * modelPricing.output
    );
  }
}
