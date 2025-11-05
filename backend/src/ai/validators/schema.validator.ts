/**
 * Schema Validator
 * Validates AI-generated outputs against JSON schemas using Zod
 */

import { Injectable, Logger } from '@nestjs/common';
import { z, ZodSchema, ZodError } from 'zod';
import { ValidationResult } from '../types';

@Injectable()
export class SchemaValidator {
  private readonly logger = new Logger(SchemaValidator.name);

  /**
   * Validate data against a Zod schema
   */
  validate<T>(data: unknown, schema: ZodSchema<T>): ValidationResult {
    try {
      const validatedData = schema.parse(data);

      return {
        valid: true,
        data: validatedData,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        this.logger.warn(`Validation failed: ${JSON.stringify(errors)}`);

        return {
          valid: false,
          errors,
        };
      }

      this.logger.error(`Unexpected validation error: ${error}`);

      return {
        valid: false,
        errors: [{ path: 'unknown', message: 'Validation failed' }],
      };
    }
  }

  /**
   * Validate and return data, throw on error
   */
  validateOrThrow<T>(data: unknown, schema: ZodSchema<T>): T {
    const result = this.validate(data, schema);

    if (!result.valid) {
      throw new Error(
        `Schema validation failed: ${JSON.stringify(result.errors)}`,
      );
    }

    return result.data;
  }

  /**
   * Create a Zod schema from a JSON Schema
   * This is a simplified conversion - extend as needed
   */
  createSchemaFromJSON(jsonSchema: Record<string, any>): ZodSchema {
    // TODO: Implement full JSON Schema to Zod conversion
    // For now, return a passthrough schema
    return z.any();
  }
}

/**
 * Common Zod schemas for AI outputs
 */

// Bilingual text schema
export const bilingualTextSchema = z.object({
  en: z.string(),
  zh: z.string(),
});

// Intent extraction schema
export const intentSchema = z.object({
  type: z.enum([
    'create_itinerary',
    'compare_prices',
    'recommend_restaurant',
    'recommend_rental',
    'check_weather',
    'check_traffic',
    'general_query',
    'greeting',
    'help',
  ]),
  confidence: z.number().min(0).max(1),
  parameters: z.record(z.any()),
  locale: z.enum(['en', 'zh']),
});

// Itinerary activity schema
export const itineraryActivitySchema = z.object({
  time: z.string(),
  name: bilingualTextSchema,
  description: bilingualTextSchema,
  location: z.object({
    name: z.string(),
    address: z.string().optional(),
    coordinates: z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .optional(),
  }),
  duration: z.number(),
  cost: z
    .object({
      amount: z.number(),
      currency: z.string(),
    })
    .optional(),
  category: z.string(),
});

// Itinerary day schema
export const itineraryDaySchema = z.object({
  day: z.number(),
  date: z.string(),
  activities: z.array(itineraryActivitySchema),
  meals: z.object({
    breakfast: z.string().optional(),
    lunch: z.string().optional(),
    dinner: z.string().optional(),
  }),
  accommodation: z.string().optional(),
  notes: bilingualTextSchema.optional(),
});

// Full itinerary schema
export const itinerarySchema = z.object({
  title: bilingualTextSchema,
  summary: bilingualTextSchema,
  destination: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  days: z.array(itineraryDaySchema),
  totalCost: z
    .object({
      amount: z.number(),
      currency: z.string(),
    })
    .optional(),
  recommendations: z.array(bilingualTextSchema),
});

// Price option schema
export const priceOptionSchema = z.object({
  provider: z.string(),
  name: z.string(),
  price: z.object({
    amount: z.number(),
    currency: z.string(),
  }),
  rating: z.number().optional(),
  reviews: z.number().optional(),
  url: z.string().optional(),
  features: z.array(z.string()).optional(),
});

// Price comparison schema
export const priceComparisonSchema = z.object({
  activity: bilingualTextSchema,
  summary: bilingualTextSchema,
  options: z.array(priceOptionSchema),
  recommendation: bilingualTextSchema,
});

// Restaurant recommendation schema
export const restaurantRecommendationSchema = z.object({
  name: bilingualTextSchema,
  description: bilingualTextSchema,
  cuisine: z.string(),
  priceRange: z.string(),
  rating: z.number().optional(),
  address: z.string().optional(),
  highlights: z.array(bilingualTextSchema),
  reasons: bilingualTextSchema,
});
