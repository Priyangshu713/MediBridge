import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Brain, Sparkles, Heart, Calendar, Lightbulb, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { analyzeWellnessEntry, WellnessAnalysis } from '@/services/WellnessService';
import {
  saveWellnessEntryToServer,
  loadWellnessEntries,
  deleteWellnessEntryFromServer,
  WellnessEntryData,
} from '@/services/WellnessSyncService';
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
import MoodTrendChart from './MoodTrendChart';
import EmotionRadarChart from './EmotionRadarChart';
import AnalysisVisuals from './AnalysisVisuals';
import WellnessHistory from './WellnessHistory';

const MOOD_EMOJIS: Record<number, string> = {
  1: '😢', 2: '😞', 3: '😕', 4: '😐', 5: '🙂',
  6: '😊', 7: '😄', 8: '😁', 9: '🤩', 10: '🥳',
};

const MOOD_LABELS: Record<number, string> = {
  1: 'Terrible', 2: 'Very Bad', 3: 'Bad', 4: 'Below Average', 5: 'Okay',
  6: 'Good', 7: 'Great', 8: 'Very Good', 9: 'Amazing', 10: 'Best Ever',
};

/**
 * Extract emotions from the AI analysis markdown text.
 */
function extractEmotionsFromAnalysis(analysisText: string): string[] {
  const commonEmotions = [
    'happy', 'sad', 'anxious', 'stressed', 'grateful', 'calm', 'angry',
    'hopeful', 'lonely', 'excited', 'frustrated', 'content', 'fearful',
    'overwhelmed', 'motivated', 'tired', 'peaceful', 'worried', 'joyful',
    'nervous', 'confident', 'irritable', 'relaxed', 'melancholy',
  ];
  const lower = analysisText.toLowerCase();
  return commonEmotions.filter(e => lower.includes(e));
}

/**
 * Extract a stress level from AI analysis (heuristic).
 */
function extractStressLevel(analysisText: string, moodScore: number): number {
  const lower = analysisText.toLowerCase();
  const highStressWords = ['severe stress', 'high stress', 'extremely stressed', 'overwhelming', 'burnout', 'crisis'];
  const moderateStressWords = ['moderate stress', 'some stress', 'stressful', 'worried', 'anxious'];
  const lowStressWords = ['low stress', 'relaxed', 'calm', 'peaceful', 'at ease'];

  if (highStressWords.some(w => lower.includes(w))) return Math.min(10, Math.max(7, 11 - moodScore));
  if (moderateStressWords.some(w => lower.includes(w))) return Math.min(7, Math.max(4, 8 - moodScore));
  if (lowStressWords.some(w => lower.includes(w))) return Math.min(3, Math.max(1, 5 - moodScore));

  // Fallback: inverse of mood
  return Math.max(1, Math.min(10, 11 - moodScore));
}

const WellnessJournal: React.FC = () => {
    const [entry, setEntry] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<WellnessAnalysis | null>(null);
    const [showHelpDialog, setShowHelpDialog] = useState(false);
    const [moodScore, setMoodScore] = useState(5);
    const [pastEntries, setPastEntries] = useState<WellnessEntryData[]>([]);
    const [isLoadingEntries, setIsLoadingEntries] = useState(false);
    const [lastEmotions, setLastEmotions] = useState<string[]>([]);
    const [lastStress, setLastStress] = useState(5);
    const { toast } = useToast();
    const { geminiTier } = useHealthStore();
    const isPaidUser = geminiTier === 'lite' || geminiTier === 'pro';

    // Load past entries on mount
    const loadEntries = useCallback(async () => {
      const userId = localStorage.getItem('userEmail');
      if (!userId) return;
      setIsLoadingEntries(true);
      try {
        const entries = await loadWellnessEntries(userId);
        setPastEntries(entries);
      } catch (e) {
        console.error('Failed to load wellness entries:', e);
      } finally {
        setIsLoadingEntries(false);
      }
    }, []);

    useEffect(() => {
      loadEntries();
    }, [loadEntries]);

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

            // Extract emotions and stress from AI analysis
            const emotions = extractEmotionsFromAnalysis(result.analysis);
            const stressLevel = extractStressLevel(result.analysis, moodScore);

            // Store for visuals display
            setLastEmotions(emotions);
            setLastStress(stressLevel);

            // Save to server for cross-device sync
            const userId = localStorage.getItem('userEmail');
            if (userId) {
              const saved = await saveWellnessEntryToServer(
                userId,
                entry,
                result.analysis,
                moodScore,
                emotions,
                stressLevel
              );
              if (saved) {
                setPastEntries(prev => [saved, ...prev]);
              }
            }

            toast({
                title: 'Analysis Complete',
                description: 'Your wellness journal has been analyzed and saved.',
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
        setMoodScore(5);
    };

    const handleDelete = async (id: string) => {
      const success = await deleteWellnessEntryFromServer(id);
      if (success) {
        setPastEntries(prev => prev.filter(e => e._id !== id));
        toast({ title: 'Deleted', description: 'Journal entry removed.' });
      } else {
        toast({ title: 'Error', description: 'Failed to delete entry.', variant: 'destructive' });
      }
    };

    return (
        <div className="min-h-screen bg-background">

            <div className="container mx-auto p-4 md:p-6 max-w-6xl pt-20 md:pt-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                                <Heart className="h-7 w-7 md:h-8 md:w-8 text-primary" />
                                Mood & Mental Wellness
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
                        <p className="text-muted-foreground mt-2 text-sm md:text-base">
                            Track your mood, write journal entries, and visualize your mental wellness journey.
                        </p>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
                        <MoodTrendChart entries={pastEntries} />
                        <EmotionRadarChart entries={pastEntries} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                        {/* Journal Entry Card */}
                        <div className="space-y-4 md:space-y-6">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Calendar className="h-5 w-5" />
                                        Today's Entry
                                    </CardTitle>
                                    <CardDescription>
                                        Share what's on your mind. Be as detailed as you'd like.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Mood Selector */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium">How are you feeling?</label>
                                            <span className="text-2xl" title={MOOD_LABELS[moodScore]}>
                                                {MOOD_EMOJIS[moodScore]}
                                            </span>
                                        </div>
                                        <Slider
                                            value={[moodScore]}
                                            onValueChange={(v) => setMoodScore(v[0])}
                                            min={1}
                                            max={10}
                                            step={1}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>😢 Terrible</span>
                                            <span className="font-medium text-foreground">
                                                {moodScore}/10 — {MOOD_LABELS[moodScore]}
                                            </span>
                                            <span>🥳 Best</span>
                                        </div>
                                    </div>

                                    <Textarea
                                        placeholder="Dear journal, today I felt..."
                                        value={entry}
                                        onChange={(e) => setEntry(e.target.value)}
                                        className="min-h-[160px] resize-none"
                                        disabled={isAnalyzing}
                                    />
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">
                                            {entry.length} characters
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={handleClear}
                                                disabled={isAnalyzing || !entry}
                                                size="sm"
                                            >
                                                Clear
                                            </Button>
                                            <Button
                                                onClick={handleAnalyze}
                                                disabled={isAnalyzing || !entry.trim() || !isPaidUser}
                                                className="flex gap-2"
                                                size="sm"
                                            >
                                                {isAnalyzing ? (
                                                    <>
                                                        <Brain className="h-4 w-4 animate-pulse" />
                                                        Analyzing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="h-4 w-4" />
                                                        Analyze & Save
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {!isPaidUser && (
                                        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
                                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                                <Sparkles className="h-4 w-4 inline mr-1" />
                                                Upgrade to Lite or Pro to unlock AI-powered wellness analysis.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Current Analysis */}
                            {analysis && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-4"
                                >
                                    {/* Visual Dashboard */}
                                    <AnalysisVisuals
                                        analysisText={analysis.analysis}
                                        moodScore={moodScore}
                                        emotions={lastEmotions}
                                        stressLevel={lastStress}
                                    />

                                    {/* Detailed AI Text */}
                                    <Card className="border-primary/20 bg-primary/5">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <Brain className="h-5 w-5 text-primary" />
                                                Detailed Analysis
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

                        {/* History Column */}
                        <div>
                            {isLoadingEntries ? (
                                <Card className="border-border/50">
                                    <CardContent className="h-[400px] flex items-center justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </CardContent>
                                </Card>
                            ) : (
                                <WellnessHistory entries={pastEntries} onDelete={handleDelete} />
                            )}
                        </div>
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
                                <li><strong>Track your mood</strong> - Rate your mood and see trends over time</li>
                                <li><strong>Process your day</strong> - Reflect on daily events and experiences</li>
                                <li><strong>Identify stress triggers</strong> - Understand what causes you stress or anxiety</li>
                                <li><strong>Get coping strategies</strong> - Receive personalized mental wellness advice</li>
                                <li><strong>Monitor mental health</strong> - Track emotional patterns with beautiful charts</li>
                            </ul>
                            <p className="text-muted-foreground italic pt-2">
                                💡 Your entries sync across devices — write on your phone, review on your laptop.
                            </p>
                        </DialogDescription>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default WellnessJournal;
