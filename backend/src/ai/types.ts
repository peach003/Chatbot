/**
 * AI Module Types and Interfaces
 * Central type definitions for the AI/LLM module
 */

import { BilingualText } from '../common/types';

/**
 * Supported LLM providers
 */
export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  LOCAL = 'local',
}

/**
 * Available LLM models
 */
export enum LLMModel {
  // OpenAI models
  GPT_4O = 'gpt-4o',
  GPT_4O_MINI = 'gpt-4o-mini',
  GPT_4_TURBO = 'gpt-4-turbo-preview',

  // Anthropic models
  CLAUDE_OPUS = 'claude-3-opus-20240229',
  CLAUDE_SONNET = 'claude-3-5-sonnet-20241022',
  CLAUDE_HAIKU = 'claude-3-5-haiku-20241022',

  // Local models (optional)
  MISTRAL_7B = 'mistral-7b',
  MIXTRAL_8X7B = 'mixtral-8x7b',
  LLAMA_3_8B = 'llama-3-8b',
}

/**
 * LLM generation options
 */
export interface LLMOptions {
  model: LLMModel;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  stream?: boolean;
}

/**
 * LLM message role
 */
export enum MessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  FUNCTION = 'function',
}

/**
 * Chat message structure
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
  name?: string;
}

/**
 * LLM completion response
 */
export interface LLMCompletionResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  metadata?: Record<string, any>;
}

/**
 * LLM streaming chunk
 */
export interface LLMStreamChunk {
  content: string;
  isComplete: boolean;
  metadata?: Record<string, any>;
}

/**
 * Intent types that the chatbot can handle
 */
export enum IntentType {
  CREATE_ITINERARY = 'create_itinerary',
  COMPARE_PRICES = 'compare_prices',
  RECOMMEND_RESTAURANT = 'recommend_restaurant',
  RECOMMEND_RENTAL = 'recommend_rental',
  CHECK_WEATHER = 'check_weather',
  CHECK_TRAFFIC = 'check_traffic',
  GENERAL_QUERY = 'general_query',
  GREETING = 'greeting',
  HELP = 'help',
}

/**
 * Extracted user intent
 */
export interface ExtractedIntent {
  type: IntentType;
  confidence: number;
  parameters: Record<string, any>;
  locale: 'en' | 'zh';
}

/**
 * Itinerary generation parameters
 */
export interface ItineraryParams {
  destination: string;
  startDate: Date;
  endDate: Date;
  days: number;
  preferences: {
    interests?: string[];
    budget?: 'low' | 'medium' | 'high';
    pace?: 'relaxed' | 'moderate' | 'fast';
    accommodation?: string;
  };
  locale: 'en' | 'zh';
}

/**
 * Generated itinerary day
 */
export interface ItineraryDay {
  day: number;
  date: string;
  activities: ItineraryActivity[];
  meals: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
  };
  accommodation?: string;
  notes?: BilingualText;
}

/**
 * Itinerary activity
 */
export interface ItineraryActivity {
  time: string;
  name: BilingualText;
  description: BilingualText;
  location: {
    name: string;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  duration: number; // in minutes
  cost?: {
    amount: number;
    currency: string;
  };
  category: string;
}

/**
 * AI-generated itinerary
 */
export interface AIItinerary {
  title: BilingualText;
  summary: BilingualText;
  destination: string;
  startDate: string;
  endDate: string;
  days: ItineraryDay[];
  totalCost?: {
    amount: number;
    currency: string;
  };
  recommendations: BilingualText[];
}

/**
 * Price comparison request
 */
export interface PriceComparisonParams {
  activityName: string;
  location: string;
  date?: string;
  locale: 'en' | 'zh';
}

/**
 * Price option from a provider
 */
export interface PriceOption {
  provider: string;
  name: string;
  price: {
    amount: number;
    currency: string;
  };
  rating?: number;
  reviews?: number;
  url?: string;
  features?: string[];
}

/**
 * AI price comparison result
 */
export interface AIPriceComparison {
  activity: BilingualText;
  summary: BilingualText;
  options: PriceOption[];
  recommendation: BilingualText;
}

/**
 * Restaurant recommendation request
 */
export interface RestaurantRecommendationParams {
  location: string;
  cuisine?: string;
  budget?: 'low' | 'medium' | 'high';
  occasion?: string;
  locale: 'en' | 'zh';
}

/**
 * AI restaurant recommendation
 */
export interface AIRestaurantRecommendation {
  name: BilingualText;
  description: BilingualText;
  cuisine: string;
  priceRange: string;
  rating?: number;
  address?: string;
  highlights: BilingualText[];
  reasons: BilingualText;
}

/**
 * Chain execution context
 */
export interface ChainContext {
  userId?: string;
  sessionId?: string;
  locale: 'en' | 'zh';
  conversationHistory?: ChatMessage[];
  metadata?: Record<string, any>;
}

/**
 * Prompt template variables
 */
export interface PromptVariables {
  [key: string]: string | number | boolean | string[];
}

/**
 * JSON Schema validation result
 */
export interface ValidationResult {
  valid: boolean;
  data?: any;
  errors?: Array<{
    path: string;
    message: string;
  }>;
}
