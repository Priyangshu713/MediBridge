import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Sparkles, Heart, Calendar, Lightbulb, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { analyzeWellnessEntry, WellnessAnalysis } from '@/services/WellnessService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useHealthStore } from '@/store/healthStore';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const WellnessJournal: React.FC = () => {
    const [entry, setEntry] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<WellnessAnalysis | null>(null);
    const [showHelpDialog, setShowHelpDialog] = useState(false);
    const { toast } = useToast();
    const { geminiTier } = useHealthStore();
    const isPaidUser = geminiTier === 'lite' || geminiTier === 'pro';

    const handleAnalyze = async () => {
        if (!entry.trim()) {
            toast({
                title: 'Entry Required',
                description: 'Please write something in your journal before analyzing.',
                variant: 'destructive',
            });
            return;
        }

        if (!isPaidUser) {
            toast({
                title: 'Upgrade Required',
                description: 'Wellness Journal analysis requires a Lite or Pro subscription.',
                variant: 'destructive',
            });
            return;
        }

        setIsAnalyzing(true);

        try {
            const result = await analyzeWellnessEntry(entry);
            setAnalysis(result);
            toast({
                title: 'Analysis Complete',
                description: 'Your wellness journal has been analyzed.',
            });
        } catch (error) {
            console.error('Error analyzing entry:', error);
            toast({
                title: 'Error',
                description: 'Failed to analyze your journal entry. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleClear = () => {
        setEntry('');
        setAnalysis(null);
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl pt-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Heart className="h-8 w-8 text-primary" />
                            Mood & Mental Wellness Journal
                        </h1>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setShowHelpDialog(true)}
                            className="rounded-full"
                        >
                            <Lightbulb className="h-4 w-4 text-amber-500" />
                        </Button>
                    </div>
                    <p className="text-muted-foreground mt-2">
                        Write about your day, your feelings, and your thoughts. Get AI-powered insights on your mental wellness.
                    </p>
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Today's Entry
                            </CardTitle>
                            <CardDescription>
                                Share what's on your mind. Be as detailed as you'd like.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="Dear journal, today I felt..."
                                value={entry}
                                onChange={(e) => setEntry(e.target.value)}
                                className="min-h-[200px] resize-none"
                                disabled={isAnalyzing}
                            />
                            <div className="flex justify-between items-center mt-4">
                                <span className="text-sm text-muted-foreground">
                                    {entry.length} characters
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={handleClear}
                                        disabled={isAnalyzing || !entry}
                                    >
                                        Clear
                                    </Button>
                                    <Button
                                        onClick={handleAnalyze}
                                        disabled={isAnalyzing || !entry.trim() || !isPaidUser}
                                        className="flex gap-2"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <Brain className="h-4 w-4 animate-pulse" />
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-4 w-4" />
                                                Analyze
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {!isPaidUser && (
                                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
                                    <p className="text-sm text-amber-800 dark:text-amber-200">
                                        <Sparkles className="h-4 w-4 inline mr-1" />
                                        Upgrade to Lite or Pro to unlock AI-powered wellness analysis.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {analysis && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="border-primary/20 bg-primary/5">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Brain className="h-5 w-5 text-primary" />
                                        AI Analysis
                                    </CardTitle>
                                    <CardDescription>
                                        Based on your journal entry from {new Date(analysis.date).toLocaleDateString()}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                h1: ({ node, ...props }) => <h1 className="text-xl font-bold my-3 text-primary" {...props} />,
                                                h2: ({ node, ...props }) => <h2 className="text-lg font-bold my-2 text-primary" {...props} />,
                                                h3: ({ node, ...props }) => <h3 className="text-md font-semibold my-2" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc pl-4 my-2" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-4 my-2" {...props} />,
                                                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                                strong: ({ node, ...props }) => <strong className="font-bold text-primary" {...props} />,
                                                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                            }}
                                        >
                                            {analysis.analysis}
                                        </ReactMarkdown>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </div>
            </motion.div>

            <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-amber-500" />
                            When to Use Wellness Journal
                        </DialogTitle>
                    </DialogHeader>
                    <DialogDescription className="space-y-3 text-sm">
                        <p className="font-semibold text-foreground">Use the Wellness Journal when you want to:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Track your mood</strong> - Write about how you're feeling emotionally</li>
                            <li><strong>Process your day</strong> - Reflect on daily events and experiences</li>
                            <li><strong>Identify stress triggers</strong> - Understand what causes you stress or anxiety</li>
                            <li><strong>Get coping strategies</strong> - Receive personalized mental wellness advice</li>
                            <li><strong>Monitor mental health</strong> - Track emotional patterns over time</li>
                        </ul>
                        <p className="text-muted-foreground italic pt-2">
                            💡 This is for mental wellness tracking, not for diagnosing physical symptoms. For health concerns, use the Symptom Checker in the AI Bot.
                        </p>
                    </DialogDescription>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WellnessJournal;
