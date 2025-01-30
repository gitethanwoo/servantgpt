'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { ChatRequestOptions, CreateMessage, Message } from 'ai';
import { memo } from 'react';

interface SuggestedActionsProps {
  chatId: string;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
}

function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
  const suggestedActions = [
    {
      title: 'Help me plan',
      label: 'UX exercises for a client workshop',
      action: 'I\'d like help planning engaging UX research and design exercises for a client workshop. To help me create the most effective plan, please ask me about: 1) The specific goals we want to accomplish with these exercises 2) The participants\' background and experience level 3) How much time we have for the workshop 4) What kind of insights or outcomes we need to generate. Once you understand these details, we can design exercises that will be most impactful for our specific needs.',
    },
    {
      title: 'Let\'s scope a new project',
      label: 'for a strategic engagement',
      action: 'I need help scoping a new strategic project. To create a comprehensive project scope, I\'ll need your help thinking through several key areas. Please ask me about: 1) The core business objectives and desired outcomes 2) The target users/stakeholders 3) Key features and functionality requirements 4) Technical constraints or preferences 5) Timeline expectations 6) Budget considerations 7) Team resources available. Once you understand these aspects, we can develop a detailed project scope that aligns with our goals and constraints.',
    },
    {
      title: 'Help me outline',
      label: 'a pitch deck',
      action: 'I need help creating an outline for an impactful pitch deck. To ensure we create the most effective presentation, please ask me about: 1) Who is the target audience for this pitch? 2) What is the primary goal of the presentation (e.g., fundraising, partnership, awareness)? 3) What makes our nonprofit\'s mission unique? 4) What key metrics or impact stories do we have? 5) What specific action do we want the audience to take after the presentation? Once you understand these elements, we can craft a compelling narrative that resonates with our audience.',
    },
    {
      title: 'Generate an email nurture campaign',
      label: 'for a new product launch',
      action: 'I need help creating an email nurture campaign for a product launch. To develop the most effective campaign, please ask me about: 1) Who is the target audience and what are their pain points? 2) What are the key features and benefits of the product? 3) What is the timeline for the launch? 4) What are the main objectives of this campaign (e.g., pre-orders, awareness, early adoption)? 5) What makes this product unique in the market? Once you understand these details, we can create a strategic email sequence that guides prospects through the buyer\'s journey.',
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 gap-2 w-full">
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, '', `/chat/${chatId}`);

              append({
                role: 'user',
                content: suggestedAction.action,
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
