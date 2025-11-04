# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

**🚧 EARLY IMPLEMENTATION:** The project has basic scaffolding in place. Backend (NestJS) and frontend (Next.js) are initialized with modular structure. Currently implementing Phase 1-2 of the 40-task plan (see `IMPLEMENTATION_PLAN.md`).

## Project Overview

**SmartNZ Travel Planner** is a bilingual (English/Chinese) AI-powered travel chatbot for New Zealand that generates personalized itineraries, compares ticket prices across providers, recommends restaurants, suggests rental cars, and adjusts routes based on real-time weather and traffic.

**Architecture Type:** Modular Monolith (NestJS backend + Next.js frontend)

**Build Plan:** A 40-task implementation plan is available in `IMPLEMENTATION_PLAN.md`. See the full architecture specification in `scop.md`.

## System Architecture

```
Frontend: Next.js 15 + React Server Components + next-intl
        │
REST/GraphQL API
        ▼
Backend: NestJS (Modular Monolith)
  ├─ ai/              → LangChain + LLM Providers
  ├─ itinerary/       → Itinerary generation + OR-Tools optimization
  ├─ data/            → External API aggregation (Klook/Tripadvisor/Rentalcars)
  ├─ weather/         → Weather + Traffic (MetService/NZTA)
  ├─ cache/           → Redis cache layer
  ├─ proxy/           → Outbound API proxy + key security
  ├─ user/            → Preferences/favorites/sessions
  └─ common/          → Logging/config/types

Infra: PostgreSQL (Supabase/Neon) + Prisma / Redis (Upstash)
```

## AI Module Architecture

### Directory Structure

```
/src/ai/
├── ai.module.ts
├── ai.service.ts
├── chains/
│   ├── intent.chain.ts        # Intent extraction
│   ├── itinerary.chain.ts     # Itinerary planning
│   ├── compare.chain.ts       # Price comparison
│   ├── recommend.chain.ts     # Restaurant/rental suggestions
│   ├── summarizer.chain.ts    # Trip summary generation
│   └── translation.chain.ts   # Bilingual output
├── providers/
│   ├── openai.provider.ts
│   ├── anthropic.provider.ts
│   └── local.provider.ts      # Open-source model adapter (optional)
└── validators/
    ├── schema.validator.ts
    └── response.guard.ts
```

### LLM Provider Strategy

- All LLM calls go through a unified `LLMProvider` interface for model-agnostic integration
- Primary models: GPT-4o for complex tasks, GPT-4o-mini for lightweight operations
- Optional open-source alternatives: Mistral 7B, Mixtral 8×7B, Llama 3 8B
- Strict JSON Schema validation to prevent hallucinations
- Token usage and latency logging for cost control

### LangChain Flow Patterns

**Itinerary Generation:**
```
User Query → Intent Chain → Parameter Validation →
External API Aggregation → Route Optimization (OR-Tools) →
Itinerary Generation Chain → Translation Chain → Output
```

**Price Comparison:**
```
User selects attraction → Fetch prices from providers →
AI compares and summarizes → Output bilingual comparison
```

## Bilingual Support

- **Frontend:** `next-intl` for routing and UI localization
- **Prompts:** Dual directories (`/prompts/en`, `/prompts/zh`) for language-specific system prompts
- **LLM Output:** All AI responses return `{ zh: "", en: "" }` structure via `translation.chain.ts`
- **External APIs:** Locale parameters applied to Google Places and Tripadvisor
- **User Sessions:** Redis stores language preference persistence

## Security Architecture

### Proxy Layer (`proxy.service.ts`)

All outbound requests route through a security proxy with:
- Domain whitelisting (maps.googleapis.com, metservice.com, klook.com, tiqets.com, getyourguide.com, tripadvisor.com, rentalcars.com)
- API key protection (keys never exposed to frontend)
- Rate limiting and Redis caching
- Comprehensive error handling and logging

### Security Practices

- **LLM Output:** JSON Schema validation + content moderation
- **Input:** Sensitive data redaction (no personal info in logs)
- **Network:** HTTPS + internal proxy only
- **Compliance:** NZ Privacy Act 2020

## Technology Stack

| Layer      | Technology                                                  |
|------------|-------------------------------------------------------------|
| Frontend   | Next.js 15, React 19, TailwindCSS, shadcn/ui, next-intl     |
| Backend    | NestJS, LangChainJS, OpenAI/Anthropic SDK, OR-Tools         |
| Data       | PostgreSQL (Supabase/Neon), Prisma                          |
| Cache      | Redis (Upstash), BullMQ                                     |
| Deployment | Vercel (frontend) / Railway (backend)                       |
| AI         | LLM Provider + LangChain Chains + Prompt Templates          |

## External API Integration

- **Google Places API:** Restaurant recommendations with locale support
- **Tripadvisor API:** User reviews and ratings
- **Klook/Tiqets/GetYourGuide:** Activity ticket pricing
- **Rentalcars API:** Vehicle rental options
- **MetService:** New Zealand weather forecasts
- **NZTA:** Real-time traffic data

All external calls are cached in Redis and routed through the proxy module.

## Development Principles

1. **Modular Design:** Each NestJS module is self-contained with clear boundaries
2. **Type Safety:** Use Prisma types and strict TypeScript across all layers
3. **Bilingual First:** All user-facing content must support EN/ZH from the start
4. **Cost Control:** Log all LLM token usage; implement caching aggressively
5. **Future-Ready:** Design for easy migration to microservices or hybrid inference

## Current Implementation Status

**Completed Modules:**
- ✅ Basic NestJS backend structure with modular architecture
- ✅ Cache module with Redis integration (`backend/src/cache/`)
- ✅ Common module with Prisma, config, and utilities (`backend/src/common/`)
- ✅ Module directories scaffolded: `ai/`, `data/`, `weather/`, `proxy/`, `itinerary/`, `user/`
- ✅ Next.js 15 frontend with next-intl for bilingual support
- ✅ Environment configuration system

**In Progress:**
- 🚧 AI module implementation (LLM providers and chains)
- 🚧 Prisma schema definition
- 🚧 External API integrations

**Working Directory Structure:**
```
/backend/
  /src/
    /ai/              - LLM providers and LangChain chains
      /chains/        - Intent, itinerary, comparison chains
      /providers/     - OpenAI, Anthropic, local model adapters
      /validators/    - Schema validation for AI outputs
    /cache/           - Redis caching service
    /common/          - Shared utilities, config, Prisma service
      /config/        - Configuration management
      /filters/       - Exception filters
      /interceptors/  - Request/response interceptors
      /types/         - Shared TypeScript types
      /utils/         - Helper functions
    /data/            - External API aggregation
      /providers/     - Google Places, Tripadvisor, etc.
    /itinerary/       - Itinerary generation and optimization
    /proxy/           - Secure API proxy layer
    /user/            - User preferences and sessions
    /weather/         - Weather and traffic integration

/frontend/
  /app/               - Next.js App Router pages
  /components/        - React components
  /lib/               - Utilities and API clients
```

## Common Commands

All commands should be run from the respective directory (`backend/` or `frontend/`).

**Backend (NestJS):**
```bash
# Development server
npm run dev                 # Start in watch mode
npm run start              # Start without watch
npm run start:prod         # Production mode

# Building
npm run build              # Build the project

# Database (Prisma)
npm run db:generate        # Generate Prisma Client
npm run db:push            # Push schema to database (dev)
npm run db:migrate         # Create and run migration
npm run db:migrate:deploy  # Deploy migrations (production)
npm run db:seed            # Seed database
npm run db:studio          # Open Prisma Studio

# Testing
npm run test              # Run all unit tests
npm run test:watch        # Watch mode
npm run test:cov          # Coverage report
npm run test:e2e          # E2E tests

# Code quality
npm run lint              # ESLint with auto-fix
npm run format            # Prettier formatting

# Utilities
npm run verify            # Verify environment setup
```

**Frontend (Next.js):**
```bash
# Development server (runs on port 3001)
npm run dev

# Production build
npm run build
npm run start             # Start production server

# Code quality
npm run lint              # Next.js ESLint
npm run format            # Prettier formatting
```

**Environment Setup:**
```bash
# 1. Copy environment template
cp .env.example .env

# 2. Set up cloud databases (one-time)
#    - Create PostgreSQL database on Supabase or Neon
#    - Create Redis instance on Upstash
#    - Add connection strings to .env

# 3. Initialize database (from backend/ directory)
cd backend
npm run db:generate       # Generate Prisma Client
npm run db:push           # Push schema to database
npm run verify            # Verify all environment variables
```

## Development Workflow

**When implementing new features:**

1. **Backend modules** should follow NestJS conventions:
   - Create `*.module.ts`, `*.service.ts`, `*.controller.ts`
   - Register in `app.module.ts`
   - Add DTOs and types in module directory

2. **AI/LLM integration:**
   - All LLM calls go through the unified `LLMProvider` interface
   - Use strict JSON Schema validation (Zod) for AI outputs
   - Log all token usage for cost tracking
   - Cache aggressively to minimize API calls

3. **External API calls:**
   - Route all through `proxy.service.ts` (security layer)
   - Domain whitelisting enforced
   - Add Redis caching with appropriate TTL
   - Never expose API keys to frontend

4. **Bilingual support:**
   - All user-facing strings must have EN/ZH versions
   - AI responses return `{ zh: string, en: string }` structure
   - Use `next-intl` for frontend translations
   - Store user language preference in Redis session

5. **Testing:**
   - Write unit tests alongside implementation
   - Use `npm run test:watch` for TDD workflow
   - E2E tests for critical user flows

**Key Files:**
- `.env.example` - Template for all required environment variables
- `backend/src/app.module.ts` - Main module registration
- `backend/src/common/config/` - Centralized configuration
- `IMPLEMENTATION_PLAN.md` - 40-task roadmap with detailed steps
