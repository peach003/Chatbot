/**
 * Itinerary Chain Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ItineraryChain } from './itinerary.chain';
import { AiService } from '../ai.service';
import { PromptTemplateService } from '../prompts/prompt-template.service';
import { SchemaValidator } from '../validators/schema.validator';
import { GenerateItineraryDto, GeneratedItinerary } from '../dto/itinerary.dto';

describe('ItineraryChain', () => {
  let itineraryChain: ItineraryChain;
  let aiService: AiService;
  let promptTemplateService: PromptTemplateService;
  let schemaValidator: SchemaValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItineraryChain,
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
                return 'You are an AI assistant.';
              }
              if (name === 'itinerary') {
                return 'Create a detailed itinerary.';
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

    itineraryChain = module.get<ItineraryChain>(ItineraryChain);
    aiService = module.get<AiService>(AiService);
    promptTemplateService = module.get<PromptTemplateService>(PromptTemplateService);
    schemaValidator = module.get<SchemaValidator>(SchemaValidator);
  });

  it('should be defined', () => {
    expect(itineraryChain).toBeDefined();
  });

  describe('generate', () => {
    it('should generate a basic itinerary', async () => {
      const mockItinerary: GeneratedItinerary = {
        title: {
          en: '3-Day Auckland Adventure',
          zh: '奥克兰3日探险'
        },
        summary: {
          en: 'Explore Auckland city highlights',
          zh: '探索奥克兰城市亮点'
        },
        destination: 'Auckland',
        startDate: '2025-12-01',
        endDate: '2025-12-03',
        days: [
          {
            day: 1,
            date: '2025-12-01',
            activities: [
              {
                time: '09:00',
                name: { en: 'Sky Tower', zh: '天空塔' },
                description: { en: 'Visit the iconic Sky Tower', zh: '参观标志性天空塔' },
                location: {
                  name: 'Sky Tower',
                  address: 'Victoria Street, Auckland',
                  coordinates: { lat: -36.8485, lng: 174.7633 }
                },
                duration: 120,
                cost: { amount: 32, currency: 'NZD' },
                category: 'attraction'
              }
            ],
            meals: {
              lunch: 'The Grove Restaurant',
              dinner: 'Orbit 360°'
            },
            accommodation: 'Sofitel Auckland',
            notes: { en: 'Book ahead', zh: '提前预订' }
          }
        ],
        totalCost: { amount: 500, currency: 'NZD' },
        recommendations: [
          { en: 'Get an Auckland pass', zh: '购买奥克兰通票' }
        ]
      };

      jest.spyOn(aiService, 'generateJSON').mockResolvedValue(mockItinerary);

      const request: GenerateItineraryDto = {
        destination: 'Auckland',
        startDate: '2025-12-01',
        endDate: '2025-12-03',
        days: 3,
        locale: 'en'
      };

      const result = await itineraryChain.generate(request);

      expect(result.destination).toBe('Auckland');
      expect(result.days).toHaveLength(1);
      expect(result.days[0].activities).toHaveLength(1);
      expect(result.totalCost?.amount).toBe(500);
    });

    it('should generate itinerary with preferences', async () => {
      const mockItinerary: GeneratedItinerary = {
        title: { en: 'Nature & Adventure', zh: '自然与冒险' },
        summary: { en: 'Outdoor focused trip', zh: '户外主题行程' },
        destination: 'Queenstown',
        startDate: '2025-12-10',
        endDate: '2025-12-14',
        days: [],
        totalCost: { amount: 2000, currency: 'NZD' },
        recommendations: []
      };

      jest.spyOn(aiService, 'generateJSON').mockResolvedValue(mockItinerary);

      const request: GenerateItineraryDto = {
        destination: 'Queenstown',
        startDate: '2025-12-10',
        endDate: '2025-12-14',
        days: 5,
        travelers: 2,
        preferences: {
          interests: ['nature', 'adventure'],
          budget: 'medium',
          pace: 'moderate'
        },
        locale: 'en'
      };

      const result = await itineraryChain.generate(request);

      expect(result.destination).toBe('Queenstown');
      expect(aiService.generateJSON).toHaveBeenCalled();
    });

    it('should handle Chinese locale', async () => {
      const mockItinerary: GeneratedItinerary = {
        title: { en: 'Wellington Tour', zh: '惠灵顿之旅' },
        summary: { en: 'Explore the capital', zh: '探索首都' },
        destination: '惠灵顿',
        startDate: '2025-12-01',
        endDate: '2025-12-03',
        days: [],
        totalCost: { amount: 800, currency: 'NZD' },
        recommendations: []
      };

      jest.spyOn(aiService, 'generateJSON').mockResolvedValue(mockItinerary);

      const request: GenerateItineraryDto = {
        destination: '惠灵顿',
        startDate: '2025-12-01',
        endDate: '2025-12-03',
        days: 3,
        locale: 'zh'
      };

      const result = await itineraryChain.generate(request);

      expect(result.destination).toBe('惠灵顿');
      expect(promptTemplateService.getTemplate).toHaveBeenCalledWith('system', 'zh');
      expect(promptTemplateService.getTemplate).toHaveBeenCalledWith('itinerary', 'zh');
    });

    it('should throw error for invalid date range', async () => {
      const request: GenerateItineraryDto = {
        destination: 'Auckland',
        startDate: '2025-12-10',
        endDate: '2025-12-05', // End before start
        days: 3,
        locale: 'en'
      };

      await expect(itineraryChain.generate(request)).rejects.toThrow(
        'End date must be after start date'
      );
    });

    it('should throw error on validation failure', async () => {
      const invalidItinerary = {
        title: 'Missing required fields'
      };

      jest.spyOn(aiService, 'generateJSON').mockResolvedValue(invalidItinerary);
      jest.spyOn(schemaValidator, 'validate').mockReturnValue({
        valid: false,
        errors: [{ path: 'days', message: 'Required' }]
      });

      const request: GenerateItineraryDto = {
        destination: 'Auckland',
        startDate: '2025-12-01',
        endDate: '2025-12-03',
        days: 3,
        locale: 'en'
      };

      await expect(itineraryChain.generate(request)).rejects.toThrow(
        'Invalid itinerary response'
      );
    });
  });

  describe('estimateQuality', () => {
    it('should give high score for balanced itinerary', () => {
      const goodItinerary: GeneratedItinerary = {
        title: { en: 'Test', zh: '测试' },
        summary: { en: 'Summary', zh: '概述' },
        destination: 'Auckland',
        startDate: '2025-12-01',
        endDate: '2025-12-03',
        days: [
          {
            day: 1,
            date: '2025-12-01',
            activities: [
              {
                time: '09:00',
                name: { en: 'Activity 1', zh: '活动1' },
                description: { en: 'Desc', zh: '描述' },
                location: { name: 'Location 1' },
                duration: 120,
                category: 'attraction'
              },
              {
                time: '14:00',
                name: { en: 'Activity 2', zh: '活动2' },
                description: { en: 'Desc', zh: '描述' },
                location: { name: 'Location 2' },
                duration: 180,
                category: 'attraction'
              }
            ],
            meals: { lunch: 'Restaurant', dinner: 'Dinner place' }
          },
          {
            day: 2,
            date: '2025-12-02',
            activities: [
              {
                time: '10:00',
                name: { en: 'Activity 3', zh: '活动3' },
                description: { en: 'Desc', zh: '描述' },
                location: { name: 'Location 3' },
                duration: 150,
                category: 'attraction'
              },
              {
                time: '15:00',
                name: { en: 'Activity 4', zh: '活动4' },
                description: { en: 'Desc', zh: '描述' },
                location: { name: 'Location 4' },
                duration: 120,
                category: 'attraction'
              }
            ],
            meals: { lunch: 'Lunch spot', dinner: 'Dinner place' }
          }
        ],
        totalCost: { amount: 500, currency: 'NZD' },
        recommendations: []
      };

      const score = itineraryChain.estimateQuality(goodItinerary);
      expect(score).toBeGreaterThan(80);
    });

    it('should give lower score for unbalanced itinerary', () => {
      const unbalancedItinerary: GeneratedItinerary = {
        title: { en: 'Test', zh: '测试' },
        summary: { en: 'Summary', zh: '概述' },
        destination: 'Auckland',
        startDate: '2025-12-01',
        endDate: '2025-12-02',
        days: [
          {
            day: 1,
            date: '2025-12-01',
            activities: Array(10).fill({
              time: '09:00',
              name: { en: 'Activity', zh: '活动' },
              description: { en: 'Desc', zh: '描述' },
              location: { name: 'Location' },
              duration: 60,
              category: 'attraction'
            }),
            meals: {}
          },
          {
            day: 2,
            date: '2025-12-02',
            activities: [{
              time: '10:00',
              name: { en: 'Activity', zh: '活动' },
              description: { en: 'Desc', zh: '描述' },
              location: { name: 'Location' },
              duration: 60,
              category: 'attraction'
            }],
            meals: {}
          }
        ],
        totalCost: { amount: 500, currency: 'NZD' },
        recommendations: []
      };

      const score = itineraryChain.estimateQuality(unbalancedItinerary);
      expect(score).toBeLessThan(80);
    });
  });

  describe('getStatistics', () => {
    it('should calculate correct statistics', () => {
      const itinerary: GeneratedItinerary = {
        title: { en: 'Test', zh: '测试' },
        summary: { en: 'Summary', zh: '概述' },
        destination: 'Auckland',
        startDate: '2025-12-01',
        endDate: '2025-12-03',
        days: [
          {
            day: 1,
            date: '2025-12-01',
            activities: [
              {
                time: '09:00',
                name: { en: 'Activity 1', zh: '活动1' },
                description: { en: 'Desc', zh: '描述' },
                location: { name: 'Location' },
                duration: 120,
                category: 'attraction'
              },
              {
                time: '14:00',
                name: { en: 'Activity 2', zh: '活动2' },
                description: { en: 'Desc', zh: '描述' },
                location: { name: 'Location' },
                duration: 90,
                category: 'attraction'
              }
            ],
            meals: {}
          },
          {
            day: 2,
            date: '2025-12-02',
            activities: [
              {
                time: '10:00',
                name: { en: 'Activity 3', zh: '活动3' },
                description: { en: 'Desc', zh: '描述' },
                location: { name: 'Location' },
                duration: 150,
                category: 'attraction'
              }
            ],
            meals: {}
          }
        ],
        totalCost: { amount: 1000, currency: 'NZD' },
        recommendations: []
      };

      const stats = itineraryChain.getStatistics(itinerary);

      expect(stats.totalDays).toBe(2);
      expect(stats.totalActivities).toBe(3);
      expect(stats.totalCost).toBe(1000);
      expect(stats.avgActivitiesPerDay).toBe(2); // 3 / 2 = 1.5, rounded to 2
      expect(stats.avgDailyBudget).toBe(500); // 1000 / 2
    });
  });
});
