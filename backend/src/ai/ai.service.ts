/**
 * AI Service
 * Core service for AI operations, orchestrates LLM providers and chains
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../common/config/config.service';
import { ILLMProvider } from './providers/llm-provider.interface';
import {
  ChatMessage,
  LLMCompletionResponse,
  LLMModel,
  LLMOptions,
  LLMProvider,
  MessageRole,
} from './types';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private providers: Map<LLMProvider, ILLMProvider> = new Map();
  private defaultProvider: LLMProvider;
  private defaultModel: LLMModel;

  constructor(private readonly configService: ConfigService) {
    this.initializeDefaults();
  }

  /**
   * Initialize default settings from configuration
   */
  private initializeDefaults(): void {
    // Set default provider (prefer Anthropic if available, fallback to OpenAI)
    this.defaultProvider = this.configService.anthropicApiKey
      ? LLMProvider.ANTHROPIC
      : LLMProvider.OPENAI;

    // Set default model based on provider
    this.defaultModel =
      this.defaultProvider === LLMProvider.ANTHROPIC
        ? LLMModel.CLAUDE_SONNET
        : LLMModel.GPT_4O_MINI;

    this.logger.log(
      `Default provider: ${this.defaultProvider}, Default model: ${this.defaultModel}`,
    );
  }

  /**
   * Register an LLM provider
   */
  registerProvider(type: LLMProvider, provider: ILLMProvider): void {
    this.providers.set(type, provider);
    this.logger.log(`Registered ${type} provider`);
  }

  /**
   * Get a specific LLM provider
   */
  getProvider(type?: LLMProvider): ILLMProvider {
    const providerType = type || this.defaultProvider;
    const provider = this.providers.get(providerType);

    if (!provider) {
      throw new Error(`Provider ${providerType} not registered`);
    }

    return provider;
  }

  /**
   * Generate a completion from a single prompt
   */
  async complete(
    prompt: string,
    options?: Partial<LLMOptions>,
    provider?: LLMProvider,
  ): Promise<LLMCompletionResponse> {
    const llmProvider = this.getProvider(provider);
    const fullOptions: LLMOptions = {
      model: this.defaultModel,
      ...options,
    };

    this.logger.log(
      `Generating completion with ${llmProvider.name} (${fullOptions.model})`,
    );

    return llmProvider.complete(prompt, fullOptions);
  }

  /**
   * Generate a chat completion
   */
  async chat(
    messages: ChatMessage[],
    options?: Partial<LLMOptions>,
    provider?: LLMProvider,
  ): Promise<LLMCompletionResponse> {
    const llmProvider = this.getProvider(provider);
    const fullOptions: LLMOptions = {
      model: this.defaultModel,
      ...options,
    };

    this.logger.log(
      `Generating chat completion with ${llmProvider.name} (${fullOptions.model}), ${messages.length} messages`,
    );

    return llmProvider.chat(messages, fullOptions);
  }

  /**
   * Generate structured JSON output
   */
  async generateJSON<T = any>(
    messages: ChatMessage[],
    schema: Record<string, any>,
    options?: Partial<LLMOptions>,
    provider?: LLMProvider,
  ): Promise<T> {
    const llmProvider = this.getProvider(provider);
    const fullOptions: LLMOptions = {
      model: this.defaultModel,
      ...options,
    };

    this.logger.log(
      `Generating JSON with ${llmProvider.name} (${fullOptions.model})`,
    );

    return llmProvider.generateJSON<T>(messages, schema, fullOptions);
  }

  /**
   * Create a system message
   */
  createSystemMessage(content: string): ChatMessage {
    return {
      role: MessageRole.SYSTEM,
      content,
    };
  }

  /**
   * Create a user message
   */
  createUserMessage(content: string): ChatMessage {
    return {
      role: MessageRole.USER,
      content,
    };
  }

  /**
   * Create an assistant message
   */
  createAssistantMessage(content: string): ChatMessage {
    return {
      role: MessageRole.ASSISTANT,
      content,
    };
  }

  /**
   * Get usage statistics for all providers
   */
  getAllUsageStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const [type, provider] of this.providers.entries()) {
      stats[type] = provider.getUsageStats();
    }

    return stats;
  }

  /**
   * Reset usage statistics for all providers
   */
  resetAllUsageStats(): void {
    for (const provider of this.providers.values()) {
      provider.resetUsageStats();
    }

    this.logger.log('All usage statistics reset');
  }

  /**
   * Check if a provider is available
   */
  async isProviderAvailable(type: LLMProvider): Promise<boolean> {
    const provider = this.providers.get(type);
    if (!provider) {
      return false;
    }

    return provider.isAvailable();
  }

  /**
   * Get list of available providers
   */
  async getAvailableProviders(): Promise<LLMProvider[]> {
    const available: LLMProvider[] = [];

    for (const [type, provider] of this.providers.entries()) {
      if (await provider.isAvailable()) {
        available.push(type);
      }
    }

    return available;
  }

  /**
   * Get default provider and model
   */
  getDefaults(): { provider: LLMProvider; model: LLMModel } {
    return {
      provider: this.defaultProvider,
      model: this.defaultModel,
    };
  }
}
