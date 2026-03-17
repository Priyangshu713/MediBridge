import React, { useMemo } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import type { WellnessEntryData } from '@/services/WellnessSyncService';

interface EmotionRadarChartProps {
  entries: WellnessEntryData[];
}

const EMOTION_LABELS: Record<string, string> = {
  happy: '😊 Happy',
  sad: '😢 Sad',
  anxious: '😰 Anxious',
  stressed: '😤 Stressed',
  grateful: '🙏 Grateful',
  calm: '😌 Calm',
  angry: '😠 Angry',
  hopeful: '🌟 Hopeful',
  lonely: '😔 Lonely',
  excited: '🎉 Excited',
  frustrated: '😩 Frustrated',
  content: '☺️ Content',
};

const EmotionRadarChart: React.FC<EmotionRadarChartProps> = ({ entries }) => {
  const chartData = useMemo(() => {
    const emotionCounts: Record<string, number> = {};

    entries.forEach(e => {
      (e.emotions || []).forEach(emotion => {
        const key = emotion.toLowerCase().trim();
        emotionCounts[key] = (emotionCounts[key] || 0) + 1;
      });
    });

    // Get top 8 emotions for readability
    const sorted = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    if (sorted.length === 0) return [];

    const maxCount = Math.max(...sorted.map(([, c]) => c));

    return sorted.map(([emotion, count]) => ({
      emotion: EMOTION_LABELS[emotion] || emotion.charAt(0).toUpperCase() + emotion.slice(1),
      count,
      normalized: Math.round((count / maxCount) * 100),
    }));
  }, [entries]);

  if (chartData.length < 3) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Emotion Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            Add more entries to see your emotion patterns
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Emotion Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid className="stroke-border/30" />
              <PolarAngleAxis
                dataKey="emotion"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fontSize: 9 }}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => {
                  const entry = chartData.find(d => d.normalized === value);
                  return [entry ? `${entry.count} entries` : value, 'Frequency'];
                }}
              />
              <Radar
                name="Emotions"
                dataKey="normalized"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmotionRadarChart;
