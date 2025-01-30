import { openai } from '@ai-sdk/openai';
import { fireworks } from '@ai-sdk/fireworks';
import { anthropic } from '@ai-sdk/anthropic';
import { perplexity } from '@ai-sdk/perplexity';
import { replicate } from '@ai-sdk/replicate';

import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';

import { customMiddleware } from './custom-middleware';

export const customModel = (apiIdentifier: string, provider: 'openai' | 'fireworks' | 'anthropic' | 'perplexity' = 'openai') => {
  const modelMap = {
    openai: openai(apiIdentifier),
    fireworks: fireworks(apiIdentifier),
    anthropic: anthropic(apiIdentifier),
    perplexity: perplexity(apiIdentifier),
  };

  return wrapLanguageModel({
    model: modelMap[provider],
    middleware: customMiddleware,
  });
};

export const imageGenerationModel = replicate.image('black-forest-labs/flux-1.1-pro');
