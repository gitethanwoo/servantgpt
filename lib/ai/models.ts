// Define your models here.
import { CodeIcon, GlobeIcon, SparklesIcon, LightningIcon, LightbulbIcon } from '@/components/icons';
import type { ReactNode } from 'react';

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
  provider: 'openai' | 'fireworks' | 'anthropic' | 'perplexity';
  icon?: ReactNode;
}

export const models: Array<Model> = [
  {
    id: 'o3-mini',
    label: 'o3 Mini',
    apiIdentifier: 'o3-mini',
    description: 'Smallest model that balances speed and quality',
    provider: 'openai',
    icon: LightningIcon({ size: 16 }),
  },
  {
    id: 'gpt-4.5-preview',
    label: 'GPT 4.5 Preview',
    apiIdentifier: 'gpt-4.5-preview',
    description: 'The most expensive model. Great at writing.',
    provider: 'openai',
    icon: SparklesIcon({ size: 16 }),
  },
  {
    id: 'deepseek-r1',
    label: 'DeepSeek R1',
    apiIdentifier: 'accounts/fireworks/models/deepseek-r1',
    description: 'DeepSeek Reasoning model for difficult tasks',
    provider: 'fireworks',
    icon: LightbulbIcon({ size: 20 }),
  },
  {
    id: 'claude-3-7-sonnet-20250219',
    label: 'Claude 3.7 Sonnet',
    apiIdentifier: 'claude-3-7-sonnet-20250219',
    description: 'Best for implementing code and writing more expressively',
    provider: 'anthropic',
    icon: CodeIcon({ size: 16 }),
  },
] as const;

export const DEFAULT_MODEL_NAME: string = 'claude-3-7-sonnet-20250219';
