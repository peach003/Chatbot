#!/usr/bin/env ts-node

/**
 * Environment Verification Script
 * Validates that all required environment variables are set
 */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { validate, EnvironmentVariables } from '../src/common/config/env.validation';

// Load environment variables
const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = `.env.${nodeEnv}`;
const envPath = path.resolve(__dirname, '..', envFile);

console.log('🔍 Environment Verification');
console.log('==========================');
console.log(`Environment: ${nodeEnv}`);
console.log(`Loading: ${envFile}`);
console.log('');

// Load .env file
dotenv.config({ path: envPath });

// Also try loading .env as fallback
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

try {
  // Validate environment variables
  const config = validate(process.env);

  console.log('✅ Environment validation passed!\n');

  // Display configuration summary
  console.log('📊 Configuration Summary:');
  console.log('------------------------');
  console.log(`Node Environment: ${config.NODE_ENV}`);
  console.log(`Backend URL: ${config.BACKEND_URL}`);
  console.log(`Frontend URL: ${config.FRONTEND_URL}`);
  console.log(`Database URL: ${config.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}`);
  console.log(`Redis URL: ${config.REDIS_URL?.replace(/:[^:@]+@/, ':****@')}`);
  console.log(`Log Level: ${config.LOG_LEVEL}`);
  console.log('');

  // Check API keys
  console.log('🔑 API Keys Status:');
  console.log('------------------');
  checkApiKey('OpenAI', config.OPENAI_API_KEY);
  checkApiKey('Anthropic', config.ANTHROPIC_API_KEY);
  checkApiKey('Google Places', config.GOOGLE_PLACES_API_KEY);
  checkApiKey('Tripadvisor', config.TRIPADVISOR_API_KEY);
  checkApiKey('Klook', config.KLOOK_API_KEY);
  checkApiKey('Tiqets', config.TIQETS_API_KEY);
  checkApiKey('GetYourGuide', config.GETYOURGUIDE_API_KEY);
  checkApiKey('Rentalcars', config.RENTALCARS_API_KEY);
  checkApiKey('MetService', config.METSERVICE_API_KEY);
  checkApiKey('NZTA', config.NZTA_API_KEY);
  console.log('');

  // Check secrets
  console.log('🔐 Security Configuration:');
  console.log('-------------------------');
  checkSecret('JWT Secret', config.JWT_SECRET);
  checkSecret('Session Secret', config.SESSION_SECRET);
  console.log('');

  // Check cache configuration
  console.log('⚡ Cache Configuration:');
  console.log('----------------------');
  console.log(`Default TTL: ${config.CACHE_TTL_DEFAULT}s`);
  console.log(`Weather TTL: ${config.CACHE_TTL_WEATHER}s`);
  console.log(`Places TTL: ${config.CACHE_TTL_PLACES}s`);
  console.log(`Prices TTL: ${config.CACHE_TTL_PRICES}s`);
  console.log('');

  // Check rate limiting
  console.log('🚦 Rate Limiting:');
  console.log('----------------');
  console.log(`API Rate Limit: ${config.RATE_LIMIT_MAX} req/${config.RATE_LIMIT_TTL}s`);
  console.log(`LLM Rate Limit: ${config.LLM_RATE_LIMIT_MAX} req/${config.LLM_RATE_LIMIT_TTL}s`);
  console.log('');

  console.log('✅ All checks passed! Environment is properly configured.');
  process.exit(0);
} catch (error) {
  console.error('❌ Environment validation failed!');
  console.error('');
  console.error(error instanceof Error ? error.message : error);
  console.error('');
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

function checkApiKey(name: string, value: string | undefined): void {
  if (value && value.length > 0) {
    console.log(`  ✅ ${name}: Set (${value.substring(0, 10)}...)`);
  } else {
    console.log(`  ⚠️  ${name}: Not set (optional for development)`);
  }
}

function checkSecret(name: string, value: string | undefined): void {
  if (value && value.length > 0) {
    const isWeak =
      value.includes('dev-') ||
      value.includes('staging-') ||
      value.length < 32;

    if (process.env.NODE_ENV === 'production' && isWeak) {
      console.log(
        `  ⚠️  ${name}: Set but WEAK! Generate a strong secret for production`,
      );
    } else {
      console.log(`  ✅ ${name}: Set (length: ${value.length})`);
    }
  } else {
    console.log(`  ❌ ${name}: Not set (REQUIRED for production)`);
  }
}
