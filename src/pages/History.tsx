
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Activity, Scale } from 'lucide-react';
import { useHealthStore } from '@/store/healthStore';
import { useHistoryStore } from '@/store/historyStore';
import HistoryComparisonCard from '@/components/history/HistoryComparisonCard';
import HistoryAnalysisList from '@/components/history/HistoryAnalysisList';
import EmptyHistoryState from '@/components/history/EmptyHistoryState';

export default function History() {
  const navigate = useNavigate();
  const { healthData } = useHealthStore();
  const { historyEntries, loading, fetchHistory } = useHistoryStore();

  useEffect(() => {
    // ProtectedRoute in App.tsx already guards this route.
    // We only need to fetch history data.
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="container max-w-5xl mx-auto px-4 py-20 sm:py-24 space-y-8">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Health History</h1>
        <p className="text-muted-foreground mt-2">
          Track your health progress over time and see how your metrics have changed
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-pulse space-y-4 w-full">
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      ) : historyEntries.length === 0 ? (
        <EmptyHistoryState />
      ) : (
        <Tabs defaultValue="comparison" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Comparison</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Past Analyses</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="comparison" className="mt-6">
            {historyEntries.length < 2 ? (
              <div className="p-6 text-center bg-muted rounded-lg">
                <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium text-lg">Not enough data to compare</h3>
                <p className="text-muted-foreground mt-2">
                  You need at least 2 saved health analyses to see a comparison.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <HistoryComparisonCard 
                  currentData={historyEntries[0]?.healthData}
                  historicalData={historyEntries[historyEntries.length - 1]?.healthData}
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
            <HistoryAnalysisList historyEntries={historyEntries} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
