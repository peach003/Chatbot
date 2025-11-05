/**
 * Data Transfer Objects for AI Module
 * Validation schemas for AI-related requests
 */

import { IsString, IsEnum, IsOptional, IsArray, IsNumber, Min, Max, IsDateString, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Chat message DTO
 */
export class ChatMessageDto {
  @ApiProperty({ description: 'Message role', enum: ['system', 'user', 'assistant'] })
  @IsEnum(['system', 'user', 'assistant'])
  role: 'system' | 'user' | 'assistant';

  @ApiProperty({ description: 'Message content' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Message author name' })
  @IsOptional()
  @IsString()
  name?: string;
}

/**
 * Chat completion request DTO
 */
export class ChatCompletionDto {
  @ApiProperty({ description: 'Array of chat messages', type: [ChatMessageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];

  @ApiPropertyOptional({ description: 'Model to use', example: 'gpt-4o' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Temperature (0-2)', example: 0.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({ description: 'Maximum tokens to generate', example: 2000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTokens?: number;

  @ApiPropertyOptional({ description: 'Enable streaming', default: false })
  @IsOptional()
  @IsBoolean()
  stream?: boolean;

  @ApiPropertyOptional({ description: 'User locale', enum: ['en', 'zh'], default: 'en' })
  @IsOptional()
  @IsEnum(['en', 'zh'])
  locale?: 'en' | 'zh';
}

/**
 * Intent extraction request DTO
 */
export class ExtractIntentDto {
  @ApiProperty({ description: 'User query text', example: 'Plan a 5-day trip to Auckland' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: 'User locale', enum: ['en', 'zh'], default: 'en' })
  @IsEnum(['en', 'zh'])
  @IsOptional()
  locale?: 'en' | 'zh';

  @ApiPropertyOptional({ description: 'Conversation context' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  context?: ChatMessageDto[];
}

/**
 * Itinerary preferences DTO
 */
export class ItineraryPreferencesDto {
  @ApiPropertyOptional({ description: 'User interests', example: ['nature', 'culture', 'food'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @ApiPropertyOptional({ description: 'Budget level', enum: ['low', 'medium', 'high'] })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  budget?: 'low' | 'medium' | 'high';

  @ApiPropertyOptional({ description: 'Travel pace', enum: ['relaxed', 'moderate', 'fast'] })
  @IsOptional()
  @IsEnum(['relaxed', 'moderate', 'fast'])
  pace?: 'relaxed' | 'moderate' | 'fast';

  @ApiPropertyOptional({ description: 'Accommodation preferences' })
  @IsOptional()
  @IsString()
  accommodation?: string;
}

/**
 * Create itinerary request DTO
 */
export class CreateItineraryDto {
  @ApiProperty({ description: 'Destination city', example: 'Auckland' })
  @IsString()
  destination: string;

  @ApiProperty({ description: 'Start date (ISO 8601)', example: '2025-12-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date (ISO 8601)', example: '2025-12-05' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Number of days', example: 5 })
  @IsNumber()
  @Min(1)
  @Max(30)
  days: number;

  @ApiPropertyOptional({ description: 'User preferences', type: ItineraryPreferencesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ItineraryPreferencesDto)
  preferences?: ItineraryPreferencesDto;

  @ApiPropertyOptional({ description: 'User locale', enum: ['en', 'zh'], default: 'en' })
  @IsOptional()
  @IsEnum(['en', 'zh'])
  locale?: 'en' | 'zh';
}

/**
 * Price comparison request DTO
 */
export class ComparePricesDto {
  @ApiProperty({ description: 'Activity name', example: 'Sky Tower Admission' })
  @IsString()
  activityName: string;

  @ApiProperty({ description: 'Location', example: 'Auckland' })
  @IsString()
  location: string;

  @ApiPropertyOptional({ description: 'Date (ISO 8601)', example: '2025-12-01' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'User locale', enum: ['en', 'zh'], default: 'en' })
  @IsOptional()
  @IsEnum(['en', 'zh'])
  locale?: 'en' | 'zh';
}

/**
 * Restaurant recommendation request DTO
 */
export class RecommendRestaurantDto {
  @ApiProperty({ description: 'Location', example: 'Auckland CBD' })
  @IsString()
  location: string;

  @ApiPropertyOptional({ description: 'Cuisine type', example: 'seafood' })
  @IsOptional()
  @IsString()
  cuisine?: string;

  @ApiPropertyOptional({ description: 'Budget level', enum: ['low', 'medium', 'high'] })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  budget?: 'low' | 'medium' | 'high';

  @ApiPropertyOptional({ description: 'Occasion', example: 'anniversary' })
  @IsOptional()
  @IsString()
  occasion?: string;

  @ApiPropertyOptional({ description: 'User locale', enum: ['en', 'zh'], default: 'en' })
  @IsOptional()
  @IsEnum(['en', 'zh'])
  locale?: 'en' | 'zh';
}
