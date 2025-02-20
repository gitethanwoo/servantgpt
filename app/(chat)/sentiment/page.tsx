import SentimentAnalyzer from '@/components/SentimentAnalyzer';

export default function SentimentPage() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-8 text-center">
                Transcript Sentiment Analysis
            </h1>
            <SentimentAnalyzer />
        </div>
    );
} 