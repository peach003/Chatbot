/**
 * Intent Chain
 * Extracts user intent and parameters from natural language queries
 */

import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai.service';
import { PromptTemplateService } from '../prompts/prompt-template.service';
import { SchemaValidator, intentSchema } from '../validators/schema.validator';
import { IntentResult } from '../dto/intent.dto';
import { ExtractIntentDto } from '../dto/ai.dto';
import { MessageRole } from '../types';

@Injectable()
export class IntentChain {
  private readonly logger = new Logger(IntentChain.name);

  constructor(
    private readonly aiService: AiService,
    private readonly promptTemplateService: PromptTemplateService,
    private readonly schemaValidator: SchemaValidator,
  ) {
    this.logger.log('IntentChain initialized');
  }

  /**
   * Extract intent from user query
   */
  async extract(dto: ExtractIntentDto): Promise<IntentResult> {
    try {
      const locale = dto.locale || this.detectLanguage(dto.query);

      this.logger.debug(
        `Extracting intent from query (locale: ${locale}): "${dto.query}"`,
      );

      // Load prompt templates
      const systemPrompt = this.promptTemplateService.getTemplate('system', locale);
      const intentPrompt = this.promptTemplateService.getTemplate('intent', locale);

      // Prepare messages
      const messages = [
        this.aiService.createSystemMessage(systemPrompt),
        this.aiService.createSystemMessage(intentPrompt),
      ];

      // Add context (conversation history) if provided
      if (dto.context && dto.context.length > 0) {
        messages.push(...dto.context.map(msg => ({
          role: msg.role as any,
          content: msg.content,
        })));
      }

      // Add user query
      messages.push(this.aiService.createUserMessage(dto.query));

      // Generate JSON response
      const response = await this.aiService.generateJSON<IntentResult>(
        messages,
        {},
        {
          temperature: 0.3, // Lower temperature for more deterministic intent extraction
          maxTokens: 1000,
        },
      );

      // Validate response against schema
      const validationResult = this.schemaValidator.validate(response, intentSchema);

      if (!validationResult.valid) {
        this.logger.warn(
          `Intent validation failed: ${JSON.stringify(validationResult.errors)}`,
        );
        // Return a fallback intent
        return this.createFallbackIntent(dto.query, locale);
      }

      const intent = validationResult.data;

      // Enhance intent with detected language
      intent.detectedLanguage = locale;

      this.logger.log(
        `Intent extracted: ${intent.type} (confidence: ${intent.confidence})`,
      );

      return intent;
    } catch (error) {
      this.logger.error(`Intent extraction failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Batch extract intents from multiple queries
   */
  async extractBatch(
    queries: ExtractIntentDto[],
  ): Promise<IntentResult[]> {
    this.logger.debug(`Batch extracting ${queries.length} intents`);

    const results = await Promise.all(
      queries.map(query => this.extract(query)),
    );

    return results;
  }

  /**
   * Detect language from query text
   * Simple heuristic: check for Chinese characters
   */
  private detectLanguage(query: string): 'en' | 'zh' {
    // Check if query contains Chinese characters
    const chineseRegex = /[\u4e00-\u9fff]/;
    return chineseRegex.test(query) ? 'zh' : 'en';
  }

  /**
   * Create a fallback intent when extraction or validation fails
   */
  private createFallbackIntent(query: string, locale: 'en' | 'zh'): IntentResult {
    this.logger.warn('Using fallback intent for query');

    return {
      type: 'general_query' as any,
      confidence: 0.5,
      locale,
      parameters: {},
      metadata: {
        fallback: true,
        originalQuery: query,
      },
    };
  }

  /**
   * Validate if an intent is actionable (has sufficient parameters)
   */
  isActionable(intent: IntentResult): boolean {
    // High confidence threshold for critical actions
    if (intent.confidence < 0.7) {
      return false;
    }

    // Check if intent type requires specific parameters
    switch (intent.type) {
      case 'create_itinerary' as any:
        return !!(intent.parameters.destination || intent.parameters.duration);

      case 'compare_prices' as any:
        return !!(intent.parameters.destination || intent.parameters.specificRequests);

      case 'recommend_restaurant' as any:
      case 'recommend_rental' as any:
        return !!intent.parameters.destination;

      case 'check_weather' as any:
      case 'check_traffic' as any:
        return !!intent.parameters.destination;

      default:
        // Greetings, help, and general queries are always actionable
        return true;
    }
  }

  /**
   * Get suggested follow-up questions based on intent
   */
  getSuggestedFollowUps(intent: IntentResult): string[] {
    const followUps: Record<string, { en: string[]; zh: string[] }> = {
      create_itinerary: {
        en: [
          'How many days would you like to spend?',
          'What is your approximate budget?',
          'What are your main interests (nature, food, adventure)?',
        ],
        zh: [
          '您计划旅行多少天？',
          '您的大概预算是多少？',
          '您的主要兴趣是什么（自然、美食、冒险）？',
        ],
      },
      recommend_restaurant: {
        en: [
          'What type of cuisine are you interested in?',
          'What is your budget per person?',
          'Any dietary restrictions?',
        ],
        zh: [
          '您对什么类型的美食感兴趣？',
          '您的人均预算是多少？',
          '有什么饮食限制吗？',
        ],
      },
    };

    const suggestions = followUps[intent.type as string];
    if (!suggestions) {
      return [];
    }

    return suggestions[intent.locale] || suggestions.en;
  }
}
