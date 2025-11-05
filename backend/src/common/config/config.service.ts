import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { EnvironmentVariables } from './env.validation';

/**
 * Type-safe configuration service
 * Provides strongly-typed access to environment variables
 */
@Injectable()
export class ConfigService {
  constructor(
    private configService: NestConfigService<EnvironmentVariables, true>,
  ) {}

  // Application Configuration
  get nodeEnv(): string {
    return this.configService.get('NODE_ENV', { infer: true });
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  get backendPort(): number {
    return this.configService.get('BACKEND_PORT', { infer: true });
  }

  get backendUrl(): string {
    return this.configService.get('BACKEND_URL', { infer: true });
  }

  get frontendPort(): number {
    return this.configService.get('FRONTEND_PORT', { infer: true });
  }

  get frontendUrl(): string {
    return this.configService.get('FRONTEND_URL', { infer: true });
  }

  // Database Configuration
  get databaseUrl(): string {
    return this.configService.get('DATABASE_URL', { infer: true });
  }

  // Redis Configuration
  get redisUrl(): string {
    return this.configService.get('REDIS_URL', { infer: true });
  }

  // OpenAI Configuration
  get openaiApiKey(): string | undefined {
    return this.configService.get('OPENAI_API_KEY', { infer: true });
  }

  get openaiModelDefault(): string {
    return this.configService.get('OPENAI_MODEL_DEFAULT', { infer: true });
  }

  get openaiModelMini(): string {
    return this.configService.get('OPENAI_MODEL_MINI', { infer: true });
  }

  // Anthropic Configuration
  get anthropicApiKey(): string | undefined {
    return this.configService.get('ANTHROPIC_API_KEY', { infer: true });
  }

  get anthropicModelDefault(): string {
    return this.configService.get('ANTHROPIC_MODEL_DEFAULT', { infer: true });
  }

  // External API Keys
  get googlePlacesApiKey(): string | undefined {
    return this.configService.get('GOOGLE_PLACES_API_KEY', { infer: true });
  }

  get tripadvisorApiKey(): string | undefined {
    return this.configService.get('TRIPADVISOR_API_KEY', { infer: true });
  }

  get klookApiKey(): string | undefined {
    return this.configService.get('KLOOK_API_KEY', { infer: true });
  }

  get tiqetsApiKey(): string | undefined {
    return this.configService.get('TIQETS_API_KEY', { infer: true });
  }

  get getyourguideApiKey(): string | undefined {
    return this.configService.get('GETYOURGUIDE_API_KEY', { infer: true });
  }

  get rentalcarsApiKey(): string | undefined {
    return this.configService.get('RENTALCARS_API_KEY', { infer: true });
  }

  get metserviceApiKey(): string | undefined {
    return this.configService.get('METSERVICE_API_KEY', { infer: true });
  }

  get nztaApiKey(): string | undefined {
    return this.configService.get('NZTA_API_KEY', { infer: true });
  }

  // Security Configuration
  get jwtSecret(): string | undefined {
    return this.configService.get('JWT_SECRET', { infer: true });
  }

  get sessionSecret(): string | undefined {
    return this.configService.get('SESSION_SECRET', { infer: true });
  }

  get corsOrigins(): string[] {
    const origins = this.configService.get('CORS_ORIGINS', { infer: true });
    if (!origins) {
      return ['http://localhost:3001', 'http://localhost:3000'];
    }
    return origins.split(',').map((origin) => origin.trim());
  }

  // Cache Configuration
  get cacheTtlDefault(): number {
    return this.configService.get('CACHE_TTL_DEFAULT', { infer: true });
  }

  get cacheTtlWeather(): number {
    return this.configService.get('CACHE_TTL_WEATHER', { infer: true });
  }

  get cacheTtlPlaces(): number {
    return this.configService.get('CACHE_TTL_PLACES', { infer: true });
  }

  get cacheTtlPrices(): number {
    return this.configService.get('CACHE_TTL_PRICES', { infer: true });
  }

  // Rate Limiting Configuration
  get rateLimitTtl(): number {
    return this.configService.get('RATE_LIMIT_TTL', { infer: true });
  }

  get rateLimitMax(): number {
    return this.configService.get('RATE_LIMIT_MAX', { infer: true });
  }

  get llmRateLimitTtl(): number {
    return this.configService.get('LLM_RATE_LIMIT_TTL', { infer: true });
  }

  get llmRateLimitMax(): number {
    return this.configService.get('LLM_RATE_LIMIT_MAX', { infer: true });
  }

  // Logging Configuration
  get logLevel(): string {
    return this.configService.get('LOG_LEVEL', { infer: true });
  }

  get logTokenUsage(): boolean {
    return this.configService.get('LOG_TOKEN_USAGE', { infer: true });
  }
}
