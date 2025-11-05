/**
 * Intent Chain DTOs
 * Data transfer objects for intent extraction
 */

import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsObject,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IntentType } from '../types';

/**
 * Traveler information
 */
export class TravelerInfo {
  @IsNumber()
  @Min(0)
  adults: number;

  @IsNumber()
  @Min(0)
  children: number;
}

/**
 * Budget information
 */
export class BudgetInfo {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  currency: string;
}

/**
 * Intent parameters extracted from user query
 */
export class IntentParameters {
  @IsOptional()
  @IsString()
  destination?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => TravelerInfo)
  travelers?: TravelerInfo;

  @IsOptional()
  @ValidateNested()
  @Type(() => BudgetInfo)
  budget?: BudgetInfo;

  @IsOptional()
  @IsString({ each: true })
  preferences?: string[];

  @IsOptional()
  @IsString()
  specificRequests?: string;
}

/**
 * Intent extraction response
 */
export class IntentResult {
  @IsEnum(IntentType)
  type: IntentType;

  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  @IsEnum(['en', 'zh'])
  locale: 'en' | 'zh';

  @ValidateNested()
  @Type(() => IntentParameters)
  parameters: IntentParameters;

  @IsOptional()
  @IsString()
  detectedLanguage?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
