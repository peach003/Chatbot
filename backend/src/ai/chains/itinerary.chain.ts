/**
 * Itinerary Chain
 * Generates personalized day-by-day travel itineraries for New Zealand
 */

import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai.service';
import { PromptTemplateService } from '../prompts/prompt-template.service';
import { SchemaValidator, itinerarySchema } from '../validators/schema.validator';
import { GenerateItineraryDto, GeneratedItinerary } from '../dto/itinerary.dto';
import { MessageRole } from '../types';

@Injectable()
export class ItineraryChain {
  private readonly logger = new Logger(ItineraryChain.name);

  constructor(
    private readonly aiService: AiService,
    private readonly promptTemplateService: PromptTemplateService,
    private readonly schemaValidator: SchemaValidator,
  ) {
    this.logger.log('ItineraryChain initialized');
  }

  /**
   * Generate a complete itinerary
   */
  async generate(dto: GenerateItineraryDto): Promise<GeneratedItinerary> {
    try {
      const locale = dto.locale || 'en';

      this.logger.debug(
        `Generating itinerary for ${dto.destination}, ${dto.days} days (${dto.startDate} to ${dto.endDate})`,
      );

      // Validate date range
      this.validateDateRange(dto.startDate, dto.endDate, dto.days);

      // Load prompt templates
      const systemPrompt = this.promptTemplateService.getTemplate('system', locale);
      const itineraryPrompt = this.promptTemplateService.getTemplate('itinerary', locale);

      // Build context message with parameters
      const contextMessage = this.buildContextMessage(dto, locale);

      // Prepare messages
      const messages = [
        this.aiService.createSystemMessage(systemPrompt),
        this.aiService.createSystemMessage(itineraryPrompt),
        this.aiService.createUserMessage(contextMessage),
      ];

      // Generate itinerary JSON
      const response = await this.aiService.generateJSON<GeneratedItinerary>(
        messages,
        {},
        {
          temperature: 0.7, // Higher for creative itinerary planning
          maxTokens: 4000, // Large response for detailed itinerary
        },
      );

      // Validate response
      const validationResult = this.schemaValidator.validate(response, itinerarySchema);

      if (!validationResult.valid) {
        this.logger.warn(
          `Itinerary validation failed: ${JSON.stringify(validationResult.errors)}`,
        );
        throw new Error(`Invalid itinerary response: ${JSON.stringify(validationResult.errors)}`);
      }

      const itinerary = validationResult.data;

      // Post-process and optimize
      this.optimizeItinerary(itinerary);

      this.logger.log(
        `Itinerary generated: ${itinerary.days.length} days, ${this.countActivities(itinerary)} activities`,
      );

      return itinerary;
    } catch (error) {
      this.logger.error(`Itinerary generation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Build context message with all parameters
   */
  private buildContextMessage(dto: GenerateItineraryDto, locale: 'en' | 'zh'): string {
    const parts: string[] = [];

    if (locale === 'en') {
      parts.push(`Create a ${dto.days}-day itinerary for ${dto.destination}.`);
      parts.push(`Travel dates: ${dto.startDate} to ${dto.endDate}`);

      if (dto.travelers) {
        parts.push(`Number of travelers: ${dto.travelers}`);
      }

      if (dto.preferences) {
        if (dto.preferences.interests && dto.preferences.interests.length > 0) {
          parts.push(`Interests: ${dto.preferences.interests.join(', ')}`);
        }
        if (dto.preferences.budget) {
          parts.push(`Budget level: ${dto.preferences.budget}`);
        }
        if (dto.preferences.pace) {
          parts.push(`Preferred pace: ${dto.preferences.pace}`);
        }
        if (dto.preferences.accommodation) {
          parts.push(`Accommodation preference: ${dto.preferences.accommodation}`);
        }
        if (dto.preferences.transportation) {
          parts.push(`Transportation: ${dto.preferences.transportation}`);
        }
      }

      if (dto.specificRequests) {
        parts.push(`Specific requests: ${dto.specificRequests}`);
      }
    } else {
      parts.push(`为${dto.destination}创建${dto.days}天的行程。`);
      parts.push(`旅行日期：${dto.startDate}至${dto.endDate}`);

      if (dto.travelers) {
        parts.push(`旅行者人数：${dto.travelers}`);
      }

      if (dto.preferences) {
        if (dto.preferences.interests && dto.preferences.interests.length > 0) {
          parts.push(`兴趣：${dto.preferences.interests.join('、')}`);
        }
        if (dto.preferences.budget) {
          const budgetMap = { low: '经济', medium: '中等', high: '高端' };
          parts.push(`预算水平：${budgetMap[dto.preferences.budget]}`);
        }
        if (dto.preferences.pace) {
          const paceMap = { relaxed: '轻松', moderate: '适中', fast: '紧凑' };
          parts.push(`节奏：${paceMap[dto.preferences.pace]}`);
        }
        if (dto.preferences.accommodation) {
          parts.push(`住宿偏好：${dto.preferences.accommodation}`);
        }
        if (dto.preferences.transportation) {
          parts.push(`交通方式：${dto.preferences.transportation}`);
        }
      }

      if (dto.specificRequests) {
        parts.push(`特殊要求：${dto.specificRequests}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Validate date range consistency
   */
  private validateDateRange(startDate: string, endDate: string, days: number): void {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      throw new Error('End date must be after start date');
    }

    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff !== days) {
      this.logger.warn(
        `Days mismatch: specified ${days} but date range is ${daysDiff} days. Using date range.`,
      );
    }
  }

  /**
   * Optimize itinerary for better flow and timing
   */
  private optimizeItinerary(itinerary: GeneratedItinerary): void {
    // Sort activities by time for each day
    itinerary.days.forEach(day => {
      day.activities.sort((a, b) => {
        const timeA = this.parseTime(a.time);
        const timeB = this.parseTime(b.time);
        return timeA - timeB;
      });
    });

    // Calculate total cost if not provided
    if (!itinerary.totalCost) {
      itinerary.totalCost = this.calculateTotalCost(itinerary);
    }
  }

  /**
   * Parse time string to minutes since midnight
   */
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  }

  /**
   * Calculate total cost of itinerary
   */
  private calculateTotalCost(itinerary: GeneratedItinerary): { amount: number; currency: string } {
    let total = 0;
    let currency = 'NZD';

    itinerary.days.forEach(day => {
      day.activities.forEach(activity => {
        if (activity.cost) {
          total += activity.cost.amount;
          currency = activity.cost.currency;
        }
      });
    });

    return { amount: Math.round(total), currency };
  }

  /**
   * Count total activities in itinerary
   */
  private countActivities(itinerary: GeneratedItinerary): number {
    return itinerary.days.reduce((sum, day) => sum + day.activities.length, 0);
  }

  /**
   * Estimate itinerary quality score (0-100)
   */
  estimateQuality(itinerary: GeneratedItinerary): number {
    let score = 100;

    // Check for balanced activity distribution
    const activitiesPerDay = itinerary.days.map(d => d.activities.length);
    const avgActivities = activitiesPerDay.reduce((a, b) => a + b, 0) / activitiesPerDay.length;
    const variance = activitiesPerDay.reduce((sum, count) => sum + Math.pow(count - avgActivities, 2), 0) / activitiesPerDay.length;

    if (variance > 4) {
      score -= 10; // Penalize unbalanced distribution
    }

    // Check for reasonable activity duration
    itinerary.days.forEach(day => {
      const totalDuration = day.activities.reduce((sum, act) => sum + act.duration, 0);
      if (totalDuration > 720) { // More than 12 hours
        score -= 15; // Too packed
      } else if (totalDuration < 240) { // Less than 4 hours
        score -= 10; // Too sparse
      }
    });

    // Check for meal planning
    const mealsPlanned = itinerary.days.filter(d => d.meals && (d.meals.lunch || d.meals.dinner)).length;
    if (mealsPlanned < itinerary.days.length * 0.8) {
      score -= 5; // Missing meal recommendations
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get summary statistics for an itinerary
   */
  getStatistics(itinerary: GeneratedItinerary): {
    totalDays: number;
    totalActivities: number;
    totalCost: number;
    avgActivitiesPerDay: number;
    avgDailyBudget: number;
  } {
    const totalActivities = this.countActivities(itinerary);
    const totalCost = itinerary.totalCost?.amount || 0;

    return {
      totalDays: itinerary.days.length,
      totalActivities,
      totalCost,
      avgActivitiesPerDay: Math.round(totalActivities / itinerary.days.length),
      avgDailyBudget: Math.round(totalCost / itinerary.days.length),
    };
  }
}
