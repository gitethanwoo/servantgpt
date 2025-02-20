'use client';

import { experimental_useObject as useObject } from 'ai/react';
import { z } from 'zod';
import SentimentGraph from './SentimentGraph';

const sentimentSchema = z.object({
    timestampStart: z.number(),
    relevantText: z.string(),
    sentimentCommentary: z.string(),
    sentimentDescriptor: z.string(),
    sentiment: z.enum(["very positive", "positive", "neutral", "negative", "very negative"]),
});

export default function SentimentAnalyzer() {
    const { object: results, submit, isLoading, error } = useObject({
        api: '/api/tools/sentiment',
        schema: z.array(sentimentSchema),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const transcript = form.transcript.value;
        submit({ text: transcript });
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    name="transcript"
                    placeholder="Paste your transcript here..."
                    className="w-full h-32 p-2 border rounded"
                    required
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
                >
                    {isLoading ? 'Analyzing...' : 'Analyze Sentiment'}
                </button>
            </form>

            {error && (
                <div className="text-red-500 mt-4">
                    Error: {error.message}
                </div>
            )}

            {results && (
                <div className="mt-8 space-y-8">
                    <SentimentGraph results={results} />
                    
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold">Detailed Analysis</h2>
                        {results.map((result, index) => (
                            <div key={index} className="border p-4 rounded">
                                <div className="font-bold">
                                    {result.sentimentDescriptor} ({result.sentiment})
                                </div>
                                <div className="text-sm text-gray-600">
                                    at {result.timestampStart}s
                                </div>
                                <div className="mt-2 italic">
                                    "{result.relevantText}"
                                </div>
                                <div className="mt-2">
                                    {result.sentimentCommentary}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
} 