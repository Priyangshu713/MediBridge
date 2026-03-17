import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell,
  PieChart, Pie, Tooltip,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import {
  Heart, Brain, Zap, Shield, Sun, Moon, Dumbbell, Users,
  Music, BookOpen, Coffee, TreePine, Smile, Target,
} from 'lucide-react';

interface AnalysisVisualsProps {
  analysisText: string;
  moodScore: number;
  emotions: string[];
  stressLevel: number;
}

// Maps sentiment keywords to color + label
function detectSentiment(text: string, score: number): { label: string; color: string; emoji: string; value: number } {
  const lower = text.toLowerCase();
  if (lower.includes('very positive') || lower.includes('extremely positive'))
    return { label: 'Very Positive', color: '#22c55e', emoji: '🌟', value: 90 };
  if (lower.includes('positive') && !lower.includes('negative'))
    return { label: 'Positive', color: '#4ade80', emoji: '😊', value: 75 };
  if (lower.includes('mixed'))
    return { label: 'Mixed', color: '#f59e0b', emoji: '🤔', value: 50 };
  if (lower.includes('negative/melancholic') || lower.includes('very negative') || lower.includes('severely negative'))
    return { label: 'Melancholic', color: '#ef4444', emoji: '😢', value: 20 };
  if (lower.includes('negative'))
    return { label: 'Negative', color: '#f97316', emoji: '😔', value: 30 };
  if (lower.includes('neutral'))
    return { label: 'Neutral', color: '#94a3b8', emoji: '😐', value: 50 };
  // Fallback based on mood score
  if (score >= 7) return { label: 'Positive', color: '#4ade80', emoji: '😊', value: 75 };
  if (score >= 4) return { label: 'Neutral', color: '#94a3b8', emoji: '😐', value: 50 };
  return { label: 'Negative', color: '#f97316', emoji: '😔', value: 30 };
}

// Extract coping strategies / recommendations from analysis
function extractRecommendations(text: string): { title: string; icon: React.ReactNode }[] {
  const recs: { title: string; icon: React.ReactNode }[] = [];
  const lower = text.toLowerCase();

  const strategies = [
    { keywords: ['meditation', 'mindfulness', 'breathe', 'breathing', 'deep breath'], title: 'Try Mindfulness Meditation', icon: <Brain className="h-4 w-4" /> },
    { keywords: ['exercise', 'physical activity', 'workout', 'yoga', 'stretching', 'walk'], title: 'Physical Activity', icon: <Dumbbell className="h-4 w-4" /> },
    { keywords: ['sleep', 'rest', 'nap', 'bedtime'], title: 'Prioritize Sleep', icon: <Moon className="h-4 w-4" /> },
    { keywords: ['social', 'friend', 'family', 'connect', 'talk to'], title: 'Social Connection', icon: <Users className="h-4 w-4" /> },
    { keywords: ['journal', 'writing', 'express', 'self-reflect'], title: 'Expressive Writing', icon: <BookOpen className="h-4 w-4" /> },
    { keywords: ['nature', 'outdoor', 'fresh air', 'park', 'garden'], title: 'Time in Nature', icon: <TreePine className="h-4 w-4" /> },
    { keywords: ['music', 'listen', 'playlist', 'song'], title: 'Music Therapy', icon: <Music className="h-4 w-4" /> },
    { keywords: ['routine', 'habit', 'schedule', 'structure'], title: 'Build a Routine', icon: <Target className="h-4 w-4" /> },
    { keywords: ['positive', 'affirmation', 'gratitude', 'grateful'], title: 'Practice Gratitude', icon: <Sun className="h-4 w-4" /> },
    { keywords: ['professional help', 'therapist', 'counselor', 'mental health professional'], title: 'Seek Professional Support', icon: <Shield className="h-4 w-4" /> },
    { keywords: ['hydrat', 'water', 'drink'], title: 'Stay Hydrated', icon: <Coffee className="h-4 w-4" /> },
    { keywords: ['self-compassion', 'kind to yourself', 'self-care', 'be gentle'], title: 'Self-Compassion', icon: <Heart className="h-4 w-4" /> },
  ];

  for (const s of strategies) {
    if (s.keywords.some(k => lower.includes(k))) {
      recs.push({ title: s.title, icon: s.icon });
    }
  }

  return recs.slice(0, 6); // Max 6 recommendations
}

// Emotion intensity data for bar chart
const EMOTION_COLORS: Record<string, string> = {
  happy: '#4ade80', sad: '#60a5fa', anxious: '#f59e0b', stressed: '#ef4444',
  grateful: '#a78bfa', calm: '#22d3ee', angry: '#dc2626', hopeful: '#34d399',
  lonely: '#94a3b8', excited: '#f97316', frustrated: '#fb923c', content: '#86efac',
  fearful: '#fbbf24', overwhelmed: '#f87171', motivated: '#10b981', tired: '#cbd5e1',
  peaceful: '#67e8f9', worried: '#fbbf24', joyful: '#22c55e', nervous: '#f59e0b',
  confident: '#8b5cf6', irritable: '#ef4444', relaxed: '#34d399', melancholy: '#93c5fd',
  vulnerability: '#fdba74', sadness: '#60a5fa', frustration: '#fb923c', loneliness: '#94a3b8',
};

const AnalysisVisuals: React.FC<AnalysisVisualsProps> = ({ analysisText, moodScore, emotions, stressLevel }) => {
  const sentiment = useMemo(() => detectSentiment(analysisText, moodScore), [analysisText, moodScore]);
  const recommendations = useMemo(() => extractRecommendations(analysisText), [analysisText]);

  const emotionBarData = useMemo(() => {
    return emotions.map(e => ({
      name: e.charAt(0).toUpperCase() + e.slice(1),
      value: 70 + Math.floor(Math.random() * 30), // We show presence; slight variation for visuals
      color: EMOTION_COLORS[e.toLowerCase()] || 'hsl(var(--primary))',
    }));
  }, [emotions]);

  // Wellness score breakdown pie chart
  const wellnessBreakdown = useMemo(() => [
    { name: 'Mood', value: moodScore * 10, fill: '#8b5cf6' },
    { name: 'Calm', value: Math.max(10, (10 - stressLevel) * 10), fill: '#22d3ee' },
    { name: 'Emotional Balance', value: Math.max(20, emotions.filter(e =>
      ['happy', 'grateful', 'calm', 'content', 'hopeful', 'excited', 'peaceful', 'relaxed', 'joyful', 'confident', 'motivated'].includes(e.toLowerCase())
    ).length * 25), fill: '#4ade80' },
  ], [moodScore, stressLevel, emotions]);

  return (
    <div className="space-y-4">
      {/* Row 1: Sentiment + Wellness Score */}
      <div className="grid grid-cols-2 gap-3">
        {/* Sentiment Indicator */}
        <Card className="border-border/30 bg-card/50">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-3xl mb-1">{sentiment.emoji}</span>
            <p className="text-xs font-medium text-muted-foreground">Overall Tone</p>
            <p className="text-sm font-bold" style={{ color: sentiment.color }}>{sentiment.label}</p>
            {/* Sentiment bar */}
            <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${sentiment.value}%`,
                  background: `linear-gradient(90deg, ${sentiment.color}88, ${sentiment.color})`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Wellness Score Donut */}
        <Card className="border-border/30 bg-card/50">
          <CardContent className="p-4 flex flex-col items-center">
            <p className="text-xs font-medium text-muted-foreground mb-1">Wellness Snapshot</p>
            <div className="h-[90px] w-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={wellnessBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={40}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {wellnessBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-2 text-[10px] text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />Mood</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#22d3ee]" />Calm</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4ade80]" />Balance</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Emotion Breakdown Bars */}
      {emotionBarData.length > 0 && (
        <Card className="border-border/30 bg-card/50">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Emotions Detected
            </p>
            <div className="space-y-2">
              {emotionBarData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs w-20 text-right font-medium truncate">{item.name}</span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${item.value}%`,
                        backgroundColor: item.color,
                        animationDelay: `${i * 100}ms`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Row 3: Actionable Recommendations */}
      {recommendations.length > 0 && (
        <Card className="border-border/30 bg-card/50">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1">
              <Smile className="h-3 w-3" />
              How to Improve
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors"
                >
                  <div className="text-primary flex-shrink-0">{rec.icon}</div>
                  <span className="text-xs font-medium leading-tight">{rec.title}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mood + Stress Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/30 bg-card/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
              {moodScore >= 7 ? '😄' : moodScore >= 4 ? '🙂' : '😔'}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mood Score</p>
              <p className="text-lg font-bold">{moodScore}<span className="text-xs font-normal text-muted-foreground">/10</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/30 bg-card/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-lg">
              {stressLevel <= 3 ? '😌' : stressLevel <= 6 ? '😐' : '😰'}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Stress Level</p>
              <p className="text-lg font-bold">{stressLevel}<span className="text-xs font-normal text-muted-foreground">/10</span></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalysisVisuals;
