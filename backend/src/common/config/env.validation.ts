import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  validateSync,
  IsBoolean,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Staging = 'staging',
}

/**
 * Environment variables validation schema
 * Ensures all required environment variables are present and valid
 */
export class EnvironmentVariables {
  // Node Environment
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  // Application Configuration
  @IsNumber()
  @IsOptional()
  BACKEND_PORT: number = 3000;

  @IsUrl({ require_tld: false })
  @IsOptional()
  BACKEND_URL: string = 'http://localhost:3000';

  @IsNumber()
  @IsOptional()
  FRONTEND_PORT: number = 3001;

  @IsUrl({ require_tld: false })
  @IsOptional()
  FRONTEND_URL: string = 'http://localhost:3001';

  // Database Configuration
  @IsString()
  DATABASE_URL: string;

  // Redis Configuration
  @IsString()
  REDIS_URL: string;

  // AI/LLM Provider API Keys
  @IsString()
  @IsOptional()
  OPENAI_API_KEY?: string;

  @IsString()
  @IsOptional()
  OPENAI_MODEL_DEFAULT?: string = 'gpt-4o';

  @IsString()
  @IsOptional()
  OPENAI_MODEL_MINI?: string = 'gpt-4o-mini';

  @IsString()
  @IsOptional()
  ANTHROPIC_API_KEY?: string;

  @IsString()
  @IsOptional()
  ANTHROPIC_MODEL_DEFAULT?: string = 'claude-3-5-sonnet-20241022';

  // External API Keys
  @IsString()
  @IsOptional()
  GOOGLE_PLACES_API_KEY?: string;

  @IsString()
  @IsOptional()
  TRIPADVISOR_API_KEY?: string;

  @IsString()
  @IsOptional()
  KLOOK_API_KEY?: string;

  @IsString()
  @IsOptional()
  TIQETS_API_KEY?: string;

  @IsString()
  @IsOptional()
  GETYOURGUIDE_API_KEY?: string;

  @IsString()
  @IsOptional()
  RENTALCARS_API_KEY?: string;

  @IsString()
  @IsOptional()
  METSERVICE_API_KEY?: string;

  @IsString()
  @IsOptional()
  NZTA_API_KEY?: string;

  // Security & Session
  @IsString()
  @IsOptional()
  JWT_SECRET?: string;

  @IsString()
  @IsOptional()
  SESSION_SECRET?: string;

  @IsString()
  @IsOptional()
  CORS_ORIGINS?: string = 'http://localhost:3001,http://localhost:3000';

  // Cache Configuration
  @IsNumber()
  @IsOptional()
  CACHE_TTL_DEFAULT: number = 3600;

  @IsNumber()
  @IsOptional()
  CACHE_TTL_WEATHER: number = 1800;

  @IsNumber()
  @IsOptional()
  CACHE_TTL_PLACES: number = 86400;

  @IsNumber()
  @IsOptional()
  CACHE_TTL_PRICES: number = 7200;

  // Rate Limiting
  @IsNumber()
  @IsOptional()
  RATE_LIMIT_TTL: number = 60;

  @IsNumber()
  @IsOptional()
  RATE_LIMIT_MAX: number = 100;

  @IsNumber()
  @IsOptional()
  LLM_RATE_LIMIT_TTL: number = 60;

  @IsNumber()
  @IsOptional()
  LLM_RATE_LIMIT_MAX: number = 20;

  // Logging
  @IsString()
  @IsOptional()
  LOG_LEVEL?: string = 'debug';

  @IsBoolean()
  @IsOptional()
  LOG_TOKEN_USAGE: boolean = true;
}

/**
 * Validate environment variables
 * @param config Raw environment configuration
 * @returns Validated and typed configuration
 */
export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors.map((e) => Object.values(e.constraints || {}).join(', ')).join('\n')}`,
    );
  }

  return validatedConfig;
}
