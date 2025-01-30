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
    id: 'gpt-4o-mini',
    label: 'GPT 4o mini',
    apiIdentifier: 'gpt-4o-mini',
    description: 'Smallest model that balances speed and quality',
    provider: 'openai',
    icon: LightningIcon({ size: 16 }),
  },
  {
    id: 'gpt-4o',
    label: 'GPT 4o',
    apiIdentifier: 'gpt-4o',
    description: 'Uses the tools very well. ',
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
    id: 'claude-3-5-sonnet-20241022',
    label: 'Claude 3.5 Sonnet',
    apiIdentifier: 'claude-3-5-sonnet-20241022',
    description: 'Best for implementing code and writing more expressively',
    provider: 'anthropic',
    icon: CodeIcon({ size: 16 }),
  },
  {
    id: 'sonar',
    label: 'Sonar',
    apiIdentifier: 'sonar',
    description: 'Fast and efficient search model for general-purpose tasks',
    provider: 'perplexity',
    icon: GlobeIcon({ size: 20 }),
  },
  {
    id: 'sonar-reasoning',
    label: 'Sonar Reasoning',
    apiIdentifier: 'sonar-reasoning',
    description: 'Specialized reasoning model with search',
    provider: 'perplexity',
    icon: GlobeIcon({ size: 20 }),
  },
] as const;

export const DEFAULT_MODEL_NAME: string = 'gpt-4o';
