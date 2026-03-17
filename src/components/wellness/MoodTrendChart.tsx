import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';
import type { WellnessEntryData } from '@/services/WellnessSyncService';

interface MoodTrendChartProps {
  entries: WellnessEntryData[];
}

const RANGE_OPTIONS = [
  { label: '7D', days: 7 },
  { label: '14D', days: 14 },
  { label: '30D', days: 30 },
  { label: 'All', days: 9999 },
];

const MoodTrendChart: React.FC<MoodTrendChartProps> = ({ entries }) => {
  const [range, setRange] = useState(30);

  const chartData = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now.getTime() - range * 24 * 60 * 60 * 1000);

    return entries
      .filter(e => new Date(e.date) >= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(e => ({
        date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        mood: e.moodScore,
        stress: e.stressLevel,
      }));
  }, [entries, range]);

  if (entries.length < 2) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Mood Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            Add at least 2 journal entries to see your mood trends
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Mood Trends
          </CardTitle>
          <div className="flex gap-1">
            {RANGE_OPTIONS.map(opt => (
              <Button
                key={opt.days}
                variant={range === opt.days ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setRange(opt.days)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis domain={[1, 10]} tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area
                type="monotone"
                dataKey="mood"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#moodGradient)"
                name="Mood"
                dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                activeDot={{ r: 5 }}
              />
              <Area
                type="monotone"
                dataKey="stress"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#stressGradient)"
                name="Stress"
                dot={{ r: 3, fill: '#f97316' }}
                activeDot={{ r: 5 }}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded bg-primary" />
            Mood Score
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded bg-orange-500" style={{ borderTop: '2px dashed #f97316' }} />
            Stress Level
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MoodTrendChart;
