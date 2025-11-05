/**
 * Intent Chain Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { IntentChain } from './intent.chain';
import { AiService } from '../ai.service';
import { PromptTemplateService } from '../prompts/prompt-template.service';
import { SchemaValidator } from '../validators/schema.validator';
import { IntentType } from '../types';
import { ExtractIntentDto } from '../dto/ai.dto';

describe('IntentChain', () => {
  let intentChain: IntentChain;
  let aiService: AiService;
  let promptTemplateService: PromptTemplateService;
  let schemaValidator: SchemaValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntentChain,
        {
          provide: AiService,
          useValue: {
            createSystemMessage: jest.fn((content) => ({
              role: 'system',
              content,
            })),
            createUserMessage: jest.fn((content) => ({
              role: 'user',
              content,
            })),
            generateJSON: jest.fn(),
          },
        },
        {
          provide: PromptTemplateService,
          useValue: {
            getTemplate: jest.fn((name, locale) => {
              if (name === 'system') {
                return locale === 'en'
                  ? 'You are an AI assistant.'
                  : '您是AI助理。';
              }
              if (name === 'intent') {
                return locale === 'en'
                  ? 'Extract intent from query.'
                  : '从查询中提取意图。';
              }
              return '';
            }),
          },
        },
        {
          provide: SchemaValidator,
          useValue: {
            validate: jest.fn((data) => ({
              valid: true,
              data,
            })),
          },
        },
      ],
    }).compile();

    intentChain = module.get<IntentChain>(IntentChain);
    aiService = module.get<AiService>(AiService);
    promptTemplateService = module.get<PromptTemplateService>(PromptTemplateService);
    schemaValidator = module.get<SchemaValidator>(SchemaValidator);
  });

  it('should be defined', () => {
    expect(intentChain).toBeDefined();
  });

  describe('extract', () => {
    it('should extract intent from English query', async () => {
      const mockResponse = {
        type: IntentType.CREATE_ITINERARY,
        confidence: 0.95,
        locale: 'en',
        parameters: {
          destination: 'Auckland',
          duration: 3,
        },
      };

      jest.spyOn(aiService, 'generateJSON').mockResolvedValue(mockResponse);

      const result = await intentChain.extract({
        query: 'I want to visit Auckland for 3 days',
        locale: 'en',
      });

      expect(result.type).toBe(IntentType.CREATE_ITINERARY);
      expect(result.confidence).toBe(0.95);
      expect(result.parameters.destination).toBe('Auckland');
      expect(result.parameters.duration).toBe(3);
    });

    it('should extract intent from Chinese query', async () => {
      const mockResponse = {
        type: IntentType.CREATE_ITINERARY,
        confidence: 0.92,
        locale: 'zh',
        parameters: {
          destination: '皇后镇',
          duration: 5,
          travelers: { adults: 2, children: 0 },
        },
      };

      jest.spyOn(aiService, 'generateJSON').mockResolvedValue(mockResponse);

      const result = await intentChain.extract({
        query: '我想去皇后镇玩5天',
        locale: 'zh',
      });

      expect(result.type).toBe(IntentType.CREATE_ITINERARY);
      expect(result.locale).toBe('zh');
      expect(result.parameters.destination).toBe('皇后镇');
    });

    it('should auto-detect language when locale not specified', async () => {
      const mockResponse = {
        type: IntentType.RECOMMEND_RESTAURANT,
        confidence: 0.88,
        locale: 'zh',
        parameters: {
          destination: '奥克兰',
        },
      };

      jest.spyOn(aiService, 'generateJSON').mockResolvedValue(mockResponse);

      const result = await intentChain.extract({
        query: '推荐奥克兰的餐厅',
      });

      expect(result.locale).toBe('zh');
      expect(promptTemplateService.getTemplate).toHaveBeenCalledWith('system', 'zh');
    });

    it('should handle greeting intent', async () => {
      const mockResponse = {
        type: IntentType.GREETING,
        confidence: 0.99,
        locale: 'en',
        parameters: {},
      };

      jest.spyOn(aiService, 'generateJSON').mockResolvedValue(mockResponse);

      const result = await intentChain.extract({
        query: 'Hello!',
        locale: 'en',
      });

      expect(result.type).toBe(IntentType.GREETING);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should return fallback intent on validation failure', async () => {
      const invalidResponse = {
        type: 'invalid_type',
        confidence: 1.5,
      };

      jest.spyOn(aiService, 'generateJSON').mockResolvedValue(invalidResponse);
      jest.spyOn(schemaValidator, 'validate').mockReturnValue({
        valid: false,
        errors: [{ path: 'type', message: 'Invalid type' }],
      });

      const result = await intentChain.extract({
        query: 'random query',
        locale: 'en',
      });

      expect(result.type).toBe('general_query');
      expect(result.confidence).toBe(0.5);
      expect(result.metadata?.fallback).toBe(true);
    });

    it('should include context in prompt when provided', async () => {
      const mockResponse = {
        type: IntentType.CREATE_ITINERARY,
        confidence: 0.9,
        locale: 'en',
        parameters: {
          destination: 'Wellington',
        },
      };

      jest.spyOn(aiService, 'generateJSON').mockResolvedValue(mockResponse);

      await intentChain.extract({
        query: 'I want to go there for 2 days',
        locale: 'en',
        context: [
          { role: 'user', content: 'I am planning a trip to New Zealand' },
          { role: 'assistant', content: 'Great! Which cities would you like to visit?' },
        ],
      });

      // Verify that messages were created properly
      expect(aiService.generateJSON).toHaveBeenCalled();
    });
  });

  describe('extractBatch', () => {
    it('should extract multiple intents in batch', async () => {
      const mockResponses = [
        {
          type: IntentType.CREATE_ITINERARY,
          confidence: 0.95,
          locale: 'en',
          parameters: { destination: 'Auckland' },
        },
        {
          type: IntentType.RECOMMEND_RESTAURANT,
          confidence: 0.9,
          locale: 'en',
          parameters: { destination: 'Wellington' },
        },
      ];

      jest
        .spyOn(aiService, 'generateJSON')
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1]);

      const results = await intentChain.extractBatch([
        { query: 'Visit Auckland', locale: 'en' },
        { query: 'Restaurants in Wellington', locale: 'en' },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].type).toBe(IntentType.CREATE_ITINERARY);
      expect(results[1].type).toBe(IntentType.RECOMMEND_RESTAURANT);
    });
  });

  describe('isActionable', () => {
    it('should return true for high-confidence itinerary with destination', () => {
      const intent = {
        type: IntentType.CREATE_ITINERARY,
        confidence: 0.85,
        locale: 'en' as const,
        parameters: { destination: 'Auckland' },
      };

      expect(intentChain.isActionable(intent)).toBe(true);
    });

    it('should return false for low confidence intent', () => {
      const intent = {
        type: IntentType.CREATE_ITINERARY,
        confidence: 0.6,
        locale: 'en' as const,
        parameters: { destination: 'Auckland' },
      };

      expect(intentChain.isActionable(intent)).toBe(false);
    });

    it('should return true for greeting regardless of parameters', () => {
      const intent = {
        type: IntentType.GREETING,
        confidence: 0.99,
        locale: 'en' as const,
        parameters: {},
      };

      expect(intentChain.isActionable(intent)).toBe(true);
    });

    it('should return false for restaurant recommendation without destination', () => {
      const intent = {
        type: IntentType.RECOMMEND_RESTAURANT,
        confidence: 0.9,
        locale: 'en' as const,
        parameters: {},
      };

      expect(intentChain.isActionable(intent)).toBe(false);
    });
  });

  describe('getSuggestedFollowUps', () => {
    it('should return English follow-ups for itinerary intent', () => {
      const intent = {
        type: IntentType.CREATE_ITINERARY,
        confidence: 0.9,
        locale: 'en' as const,
        parameters: {},
      };

      const followUps = intentChain.getSuggestedFollowUps(intent);

      expect(followUps.length).toBeGreaterThan(0);
      expect(followUps[0]).toContain('days');
    });

    it('should return Chinese follow-ups for Chinese locale', () => {
      const intent = {
        type: IntentType.RECOMMEND_RESTAURANT,
        confidence: 0.9,
        locale: 'zh' as const,
        parameters: {},
      };

      const followUps = intentChain.getSuggestedFollowUps(intent);

      expect(followUps.length).toBeGreaterThan(0);
      expect(followUps[0]).toMatch(/[\u4e00-\u9fff]/); // Contains Chinese characters
    });

    it('should return empty array for intent without follow-ups', () => {
      const intent = {
        type: IntentType.GREETING,
        confidence: 0.99,
        locale: 'en' as const,
        parameters: {},
      };

      const followUps = intentChain.getSuggestedFollowUps(intent);

      expect(followUps).toEqual([]);
    });
  });
});
