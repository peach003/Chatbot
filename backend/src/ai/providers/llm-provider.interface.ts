/**
 * LLM Provider Interface
 * Unified interface for all LLM providers (OpenAI, Anthropic, Local)
 */

import {
  ChatMessage,
  LLMCompletionResponse,
  LLMOptions,
  LLMStreamChunk,
} from '../types';

/**
 * Base interface that all LLM providers must implement
 * Ensures model-agnostic integration across different LLM services
 */
export interface ILLMProvider {
  /**
   * Provider name (openai, anthropic, local)
   */
  readonly name: string;

  /**
   * Generate a completion from a single prompt
   * @param prompt - The input prompt
   * @param options - Generation options (model, temperature, etc.)
   * @returns Completion response with content and usage stats
   */
  complete(prompt: string, options: LLMOptions): Promise<LLMCompletionResponse>;

  /**
   * Generate a completion from a chat conversation
   * @param messages - Array of chat messages (system, user, assistant)
   * @param options - Generation options
   * @returns Completion response
   */
  chat(
    messages: ChatMessage[],
    options: LLMOptions,
  ): Promise<LLMCompletionResponse>;

  /**
   * Generate a streaming completion
   * @param messages - Array of chat messages
   * @param options - Generation options with stream: true
   * @returns AsyncIterator of stream chunks
   */
  stream(
    messages: ChatMessage[],
    options: LLMOptions,
  ): AsyncIterator<LLMStreamChunk>;

  /**
   * Generate structured JSON output with schema validation
   * @param messages - Chat messages
   * @param schema - JSON schema for response validation
   * @param options - Generation options
   * @returns Parsed and validated JSON object
   */
  generateJSON<T = any>(
    messages: ChatMessage[],
    schema: Record<string, any>,
    options: LLMOptions,
  ): Promise<T>;

  /**
   * Check if the provider is properly configured and available
   * @returns True if the provider can be used
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get current token usage statistics for cost tracking
   * @returns Token usage stats
   */
  getUsageStats(): {
    totalTokens: number;
    totalCost: number;
    requestCount: number;
  };

  /**
   * Reset usage statistics
   */
  resetUsageStats(): void;
}

/**
 * Provider factory interface for creating LLM providers
 */
export interface ILLMProviderFactory {
  /**
   * Create a provider instance
   * @param config - Provider-specific configuration
   */
  createProvider(config: any): ILLMProvider;
}
