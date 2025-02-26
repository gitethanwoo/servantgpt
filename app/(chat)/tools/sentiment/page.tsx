'use client';

import { ToolHeader } from '@/components/tool-header';
import SentimentAnalyzer from '@/components/SentimentAnalyzer';

export default function SentimentPage() {
  return (
    <>
      <ToolHeader selectedToolId="sentiment" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-8 text-center">
          Transcript Sentiment Analysis
        </h1>
        <SentimentAnalyzer />
      </div>
    </>
  );
} 