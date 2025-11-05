/**
 * Common shared types used across the application
 */

// Bilingual text structure
export interface BilingualText {
  en: string;
  zh: string;
}

// Supported locales
export type Locale = 'en' | 'zh';

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// Pagination parameters
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Location coordinates
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Date range
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// LLM Token usage tracking
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost?: number;
}

// API provider enumeration
export enum ApiProvider {
  GOOGLE_PLACES = 'google_places',
  TRIPADVISOR = 'tripadvisor',
  KLOOK = 'klook',
  TIQETS = 'tiqets',
  GETYOURGUIDE = 'getyourguide',
  RENTALCARS = 'rentalcars',
  METSERVICE = 'metservice',
  NZTA = 'nzta',
}

// LLM Provider enumeration
export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  LOCAL = 'local',
}
