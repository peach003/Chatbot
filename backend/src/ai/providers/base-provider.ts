/**
 * Base LLM Provider Class
 * Abstract base class with common functionality for all LLM providers
 */

import { Injectable, Logger } from '@nestjs/common';
import { ILLMProvider } from './llm-provider.interface';
import {
  ChatMessage,
  LLMCompletionResponse,
  LLMOptions,
  LLMStreamChunk,
} from '../types';

/**
 * Token usage statistics
 */
interface UsageStats {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
  requestCount: number;
}

/**
 * Base provider with common implementation
 */
@Injectable()
export abstract class BaseLLMProvider implements ILLMProvider {
  protected readonly logger: Logger;
  protected usageStats: UsageStats = {
    totalTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalCost: 0,
    requestCount: 0,
  };

  constructor(protected readonly providerName: string) {
    this.logger = new Logger(`${providerName}Provider`);
  }

  /**
   * Provider name
   */
  get name(): string {
    return this.providerName;
  }

  /**
   * Abstract methods that must be implemented by concrete providers
   */
  abstract complete(
    prompt: string,
    options: LLMOptions,
  ): Promise<LLMCompletionResponse>;

  abstract chat(
    messages: ChatMessage[],
    options: LLMOptions,
  ): Promise<LLMCompletionResponse>;

  abstract stream(
    messages: ChatMessage[],
    options: LLMOptions,
  ): AsyncIterator<LLMStreamChunk>;

  abstract generateJSON<T = any>(
    messages: ChatMessage[],
    schema: Record<string, any>,
    options: LLMOptions,
  ): Promise<T>;

  abstract isAvailable(): Promise<boolean>;

  /**
   * Calculate cost based on token usage
   * Override this in specific providers for accurate pricing
   */
  protected calculateCost(
    model: string,
    promptTokens: number,
    completionTokens: number,
  ): number {
    // Default pricing (should be overridden)
    const inputCostPer1k = 0.01;
    const outputCostPer1k = 0.03;

    return (
      (promptTokens / 1000) * inputCostPer1k +
      (completionTokens / 1000) * outputCostPer1k
    );
  }

  /**
   * Track usage statistics
   */
  protected trackUsage(
    model: string,
    promptTokens: number,
    completionTokens: number,
  ): void {
    const totalTokens = promptTokens + completionTokens;
    const cost = this.calculateCost(model, promptTokens, completionTokens);

    this.usageStats.promptTokens += promptTokens;
    this.usageStats.completionTokens += completionTokens;
    this.usageStats.totalTokens += totalTokens;
    this.usageStats.totalCost += cost;
    this.usageStats.requestCount += 1;

    this.logger.debug(
      `Usage - Model: ${model}, Tokens: ${totalTokens} (prompt: ${promptTokens}, completion: ${completionTokens}), Cost: $${cost.toFixed(4)}`,
    );
  }

  /**
   * Get current usage statistics
   */
  getUsageStats(): {
    totalTokens: number;
    totalCost: number;
    requestCount: number;
  } {
    return {
      totalTokens: this.usageStats.totalTokens,
      totalCost: this.usageStats.totalCost,
      requestCount: this.usageStats.requestCount,
    };
  }

  /**
   * Reset usage statistics
   */
  resetUsageStats(): void {
    this.usageStats = {
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalCost: 0,
      requestCount: 0,
    };

    this.logger.log('Usage statistics reset');
  }

  /**
   * Log completion request
   */
  protected logRequest(
    method: string,
    model: string,
    messageCount?: number,
  ): void {
    this.logger.log(
      `${method} request - Model: ${model}${messageCount ? `, Messages: ${messageCount}` : ''}`,
    );
  }

  /**
   * Log completion response
   */
  protected logResponse(response: LLMCompletionResponse): void {
    this.logger.debug(
      `Response - Tokens: ${response.usage.totalTokens}, Finish: ${response.finishReason}`,
    );
  }

  /**
   * Handle errors consistently
   */
  protected handleError(error: any, context: string): never {
    this.logger.error(`${context} failed: ${error.message}`, error.stack);

    // Re-throw with additional context
    throw new Error(`${this.name} ${context}: ${error.message}`);
  }

  /**
   * Validate options and set defaults
   */
  protected validateOptions(options: LLMOptions): LLMOptions {
    return {
      model: options.model,
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 2000,
      topP: options.topP ?? 1,
      frequencyPenalty: options.frequencyPenalty ?? 0,
      presencePenalty: options.presencePenalty ?? 0,
      stop: options.stop ?? [],
      stream: options.stream ?? false,
    };
  }

  /**
   * Sanitize messages for logging (remove long content)
   */
  protected sanitizeMessages(messages: ChatMessage[]): string {
    return messages
      .map(
        (msg) =>
          `${msg.role}: ${msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content}`,
      )
      .join(' | ');
  }
}
