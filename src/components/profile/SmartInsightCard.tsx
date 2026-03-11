import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Lightbulb, ArrowRight, BrainCircuit, RefreshCw } from 'lucide-react';
import { useHealthStore } from '@/store/healthStore';
import { getDailyInsight, DailyInsight } from '@/services/InvisibleAIService';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SmartInsightCard = () => {
  const { healthData, geminiApiKey, geminiTier } = useHealthStore();
  const [insight, setInsight] = useState<DailyInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(true);

  const isPro = geminiTier === 'pro';

  useEffect(() => {
    const fetchInsight = async () => {
      // Only fetch if Pro, API key exists, and we haven't fetched today (mock logic for "today" for now)
      if (isPro && geminiApiKey && !insight) {
        setLoading(true);
        const data = await getDailyInsight(healthData, geminiApiKey);
        setInsight(data);
        setLoading(false);
      }
    };

    fetchInsight();
  }, [isPro, geminiApiKey, healthData]);

  const handleRefresh = async () => {
    if (!geminiApiKey) return;

    try {
      setLoading(true);
      const data = await getDailyInsight(healthData, geminiApiKey);
      setInsight(data);
    } catch (error) {
      console.error('Error refreshing insight:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  if (!isPro) return null; // Invisible for non-pro users

  if (loading) {
    return (
      <Card className="w-full border-health-lavender/20 bg-gradient-to-r from-white to-health-lavender/5 mb-6">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-health-lavender/20 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-1/3 bg-health-lavender/20 rounded animate-pulse" />
            <div className="h-3 w-3/4 bg-health-lavender/10 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insight) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full border-health-lavender/30 bg-gradient-to-br from-white via-health-lavender/5 to-white shadow-sm mb-6 overflow-hidden relative">
          {/* Decorative background element */}
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-health-lavender/10 blur-2xl -z-10" />
          
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-health-lavender/10 text-health-lavender">
                <Sparkles className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-medium text-health-lavender-dark">
                Daily Smart Insight
              </CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={handleRefresh}
              title="Refresh insight"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Refresh</span>
            </Button>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg text-foreground mb-1">
                  {insight.title}
                </h3>
                <div className="text-muted-foreground text-sm leading-relaxed prose prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-bold text-foreground" {...props} />,
                    }}
                  >
                    {insight.insight}
                  </ReactMarkdown>
                </div>
              </div>
              
              <div className="bg-white/60 rounded-lg p-3 border border-health-lavender/10 flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Action Item</span>
                  <div className="text-sm font-medium text-foreground prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ node, ...props }) => <p className="mb-0" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                      }}
                    >
                      {insight.actionItem}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default SmartInsightCard;
