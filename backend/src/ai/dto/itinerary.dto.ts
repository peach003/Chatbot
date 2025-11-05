/**
 * Itinerary Chain DTOs
 * Data transfer objects for itinerary generation
 */

import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  IsDateString,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Travel preferences for itinerary generation
 */
export class ItineraryPreferences {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[]; // e.g., ['nature', 'culture', 'food', 'adventure']

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  budget?: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsEnum(['relaxed', 'moderate', 'fast'])
  pace?: 'relaxed' | 'moderate' | 'fast';

  @IsOptional()
  @IsString()
  accommodation?: string; // e.g., 'hotel', 'hostel', 'airbnb'

  @IsOptional()
  @IsString()
  transportation?: string; // e.g., 'car', 'public', 'mixed'
}

/**
 * Generate itinerary request
 */
export class GenerateItineraryDto {
  @IsString()
  destination: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  @Min(1)
  @Max(30)
  days: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  travelers?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ItineraryPreferences)
  preferences?: ItineraryPreferences;

  @IsOptional()
  @IsEnum(['en', 'zh'])
  locale?: 'en' | 'zh';

  @IsOptional()
  @IsString()
  specificRequests?: string;
}

// Re-export types from types.ts to avoid duplication
export {
  ItineraryActivity,
  ItineraryDay,
  AIItinerary as GeneratedItinerary
} from '../types';
