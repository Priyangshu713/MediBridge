import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { WellnessEntryData } from '@/services/WellnessSyncService';

interface WellnessHistoryProps {
  entries: WellnessEntryData[];
  onDelete: (id: string) => void;
}

const MOOD_EMOJIS: Record<number, string> = {
  1: '😢', 2: '😞', 3: '😕', 4: '😐', 5: '🙂',
  6: '😊', 7: '😄', 8: '😁', 9: '🤩', 10: '🥳',
};

const WellnessHistory: React.FC<WellnessHistoryProps> = ({ entries, onDelete }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Journal History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[120px] flex items-center justify-center text-muted-foreground text-sm">
            Your journal entries will appear here
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Journal History
          <span className="text-xs font-normal text-muted-foreground ml-auto">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="px-6 pb-4 space-y-3">
            {entries.map((entry, index) => {
              const isExpanded = expandedId === entry._id;
              const moodEmoji = MOOD_EMOJIS[entry.moodScore] || '🙂';
              const dateStr = new Date(entry.date).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
              });
              const timeStr = new Date(entry.date).toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit', hour12: true,
              });

              return (
                <motion.div
                  key={entry._id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-border/50 rounded-lg overflow-hidden"
                >
                  <button
                    className="w-full p-3 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : (entry._id || null))}
                  >
                    <span className="text-2xl">{moodEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{entry.entry.slice(0, 80)}...</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {dateStr} · {timeStr} · Mood: {entry.moodScore}/10 · Stress: {entry.stressLevel}/10
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3 border-t border-border/50">
                          {/* Emotions */}
                          {entry.emotions && entry.emotions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-3">
                              {entry.emotions.map((emotion, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full border border-primary/20"
                                >
                                  {emotion}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Full journal entry */}
                          <div className="bg-muted/30 rounded-md p-3">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Journal Entry:</p>
                            <p className="text-sm whitespace-pre-wrap">{entry.entry}</p>
                          </div>

                          {/* AI Analysis */}
                          {entry.analysis && (
                            <div className="bg-primary/5 border border-primary/10 rounded-md p-3">
                              <p className="text-xs font-semibold text-primary mb-2">AI Analysis:</p>
                              <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {entry.analysis}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )}

                          {/* Delete button */}
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (entry._id) onDelete(entry._id);
                              }}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete Entry
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default WellnessHistory;
