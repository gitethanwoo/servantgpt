'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';

export type SentimentResult = {
    timestampStart: string;
    relevantText: string;
    sentimentCommentary: string;
    sentimentDescriptor: string;
    sentiment: "very positive" | "positive" | "neutral" | "negative" | "very negative";
};

// Parse timestamp string [HH:MM:SS] to seconds
const parseTimestamp = (timestamp: string): number => {
    const match = timestamp.match(/\[(\d{2}):(\d{2}):(\d{2})\]/);
    if (!match) return 0;
    const [_, hours, minutes, seconds] = match;
    return (parseInt(hours) * 3600) + (parseInt(minutes) * 60) + parseInt(seconds);
};

// Convert sentiment to numerical value for plotting
const sentimentToValue = (sentiment: string): number => {
    const values = {
        "very negative": -2,
        "negative": -1,
        "neutral": 0,
        "positive": 1,
        "very positive": 2
    };
    return values[sentiment as keyof typeof values];
};

// Format timestamp to MM:SS
export const formatTime = (timestamp: string): string => {
    // Remove the brackets and return the time
    return timestamp.replace(/[\[\]]/g, '');
};

export default function SentimentGraph({ results }: { results: SentimentResult[] }) {
    const data = results.map((result) => ({
        time: parseTimestamp(result.timestampStart),
        displayTime: result.timestampStart,
        value: sentimentToValue(result.sentiment),
        ...result,
    }));

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-4 border rounded-lg shadow-lg max-w-[300px]">
                    <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900">{data.sentimentDescriptor}</p>
                        <p className="text-sm text-gray-500">{formatTime(data.displayTime)}</p>
                    </div>
                    <blockquote className="mt-2 pl-3 border-l-2 border-gray-200 italic text-sm text-gray-600">
                        {data.relevantText}
                    </blockquote>
                    <p className="mt-2 text-sm text-gray-600">
                        {data.sentimentCommentary}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-[300px] mt-6">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{ top: 10, right: 30, left: 100, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis 
                        dataKey="time" 
                        tickFormatter={(value) => formatTime(data.find(d => d.time === value)?.displayTime || '[00:00:00]')}
                        stroke="#888"
                    />
                    <YAxis
                        width={90}
                        ticks={[-2, -1, 0, 1, 2]}
                        tickFormatter={(value) => {
                            const labels = {
                                '-2': 'Very Negative',
                                '-1': 'Negative',
                                '0': 'Neutral',
                                '1': 'Positive',
                                '2': 'Very Positive'
                            };
                            return labels[value as keyof typeof labels];
                        }}
                        stroke="#888"
                    />
                    <Tooltip 
                        content={<CustomTooltip />}
                        wrapperStyle={{ outline: 'none' }}
                    />
                    <ReferenceLine y={0} stroke="#ccc" />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{
                            stroke: '#2563eb',
                            strokeWidth: 2,
                            r: 3,
                            fill: 'white'
                        }}
                        activeDot={{
                            r: 5,
                            fill: '#2563eb'
                        }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
} 