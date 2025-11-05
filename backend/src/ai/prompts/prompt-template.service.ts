/**
 * Prompt Template Service
 * Manages bilingual prompt templates for AI operations
 */

import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PromptVariables } from '../types';

@Injectable()
export class PromptTemplateService {
  private readonly logger = new Logger(PromptTemplateService.name);
  private readonly templates: Map<string, { en: string; zh: string }> = new Map();
  private readonly promptsDir: string;

  constructor() {
    this.promptsDir = path.join(__dirname, '..', 'prompts');
    this.loadTemplates();
  }

  /**
   * Load all prompt templates from the prompts directory
   */
  private loadTemplates(): void {
    try {
      const enDir = path.join(this.promptsDir, 'en');
      const zhDir = path.join(this.promptsDir, 'zh');

      // Check if directories exist
      if (!fs.existsSync(enDir) || !fs.existsSync(zhDir)) {
        this.logger.warn('Prompt directories not found, skipping template loading');
        return;
      }

      // Load English templates
      const enFiles = fs.readdirSync(enDir).filter(f => f.endsWith('.txt'));

      for (const file of enFiles) {
        const templateName = file.replace('.txt', '');
        const enPath = path.join(enDir, file);
        const zhPath = path.join(zhDir, file);

        const enContent = fs.readFileSync(enPath, 'utf-8');
        const zhContent = fs.existsSync(zhPath)
          ? fs.readFileSync(zhPath, 'utf-8')
          : enContent; // Fallback to English if Chinese doesn't exist

        this.templates.set(templateName, {
          en: enContent,
          zh: zhContent,
        });

        this.logger.debug(`Loaded template: ${templateName}`);
      }

      this.logger.log(`Loaded ${this.templates.size} prompt templates`);
    } catch (error) {
      this.logger.error(`Failed to load templates: ${error.message}`);
    }
  }

  /**
   * Get a prompt template by name and locale
   */
  getTemplate(name: string, locale: 'en' | 'zh' = 'en'): string {
    const template = this.templates.get(name);

    if (!template) {
      this.logger.warn(`Template not found: ${name}, using fallback`);
      return this.getFallbackTemplate(name, locale);
    }

    return template[locale];
  }

  /**
   * Render a template with variables
   */
  render(name: string, variables: PromptVariables, locale: 'en' | 'zh' = 'en'): string {
    let template = this.getTemplate(name, locale);

    // Replace variables in the format {{variableName}}
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      const replacement = Array.isArray(value) ? value.join(', ') : String(value);
      template = template.replace(new RegExp(placeholder, 'g'), replacement);
    }

    return template;
  }

  /**
   * Check if a template exists
   */
  hasTemplate(name: string): boolean {
    return this.templates.has(name);
  }

  /**
   * Get all template names
   */
  getTemplateNames(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Fallback templates for missing files
   */
  private getFallbackTemplate(name: string, locale: 'en' | 'zh'): string {
    const fallbacks: Record<string, { en: string; zh: string }> = {
      system: {
        en: 'You are a helpful AI assistant for SmartNZ Travel Planner.',
        zh: '您是SmartNZ旅行规划助手的AI助理。',
      },
      intent: {
        en: 'Analyze the following user query and extract the intent and parameters.',
        zh: '分析以下用户查询并提取意图和参数。',
      },
      itinerary: {
        en: 'Create a detailed travel itinerary based on the given parameters.',
        zh: '根据给定参数创建详细的旅行行程。',
      },
      'price-comparison': {
        en: 'Compare prices for the given activity from multiple providers.',
        zh: '比较多个提供商对给定活动的价格。',
      },
      restaurant: {
        en: 'Recommend restaurants based on the given criteria.',
        zh: '根据给定标准推荐餐厅。',
      },
    };

    const fallback = fallbacks[name];
    if (fallback) {
      return fallback[locale];
    }

    // Ultimate fallback
    return locale === 'en'
      ? 'Process the user request.'
      : '处理用户请求。';
  }

  /**
   * Reload templates (useful for hot-reloading in development)
   */
  reload(): void {
    this.templates.clear();
    this.loadTemplates();
    this.logger.log('Templates reloaded');
  }
}
