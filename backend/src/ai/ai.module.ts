/**
 * AI Module
 * Module for AI/LLM functionality including providers, chains, and services
 */

import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { CommonModule } from '../common/common.module';
import { ConfigService } from '../common/config/config.service';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { SchemaValidator } from './validators/schema.validator';
import { PromptTemplateService } from './prompts/prompt-template.service';
import { IntentChain } from './chains/intent.chain';
import { ItineraryChain } from './chains/itinerary.chain';
import { LLMProvider } from './types';

/**
 * Factory function to create and register LLM providers
 */
const aiServiceFactory = {
  provide: AiService,
  useFactory: (configService: ConfigService) => {
    const aiService = new AiService(configService);

    // Register OpenAI provider if API key is available
    if (configService.openaiApiKey) {
      const openaiProvider = new OpenAIProvider(configService.openaiApiKey);
      aiService.registerProvider(LLMProvider.OPENAI, openaiProvider);
    }

    // Register Anthropic provider if API key is available
    if (configService.anthropicApiKey) {
      const anthropicProvider = new AnthropicProvider(
        configService.anthropicApiKey,
      );
      aiService.registerProvider(LLMProvider.ANTHROPIC, anthropicProvider);
    }

    return aiService;
  },
  inject: [ConfigService],
};

@Module({
  imports: [CommonModule],
  providers: [
    aiServiceFactory,
    SchemaValidator,
    PromptTemplateService,
    IntentChain,
    ItineraryChain,
  ],
  exports: [AiService, SchemaValidator, PromptTemplateService, IntentChain, ItineraryChain],
})
export class AiModule {}
