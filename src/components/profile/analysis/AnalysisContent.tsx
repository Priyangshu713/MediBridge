
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import AnalysisCard from './AnalysisCard';
import { AnalysisSection } from '@/store/healthStore';

interface AnalysisContentProps {
  analysis: AnalysisSection[];
  loading: boolean;
  error: string | null;
}

const AnalysisContent: React.FC<AnalysisContentProps> = ({ analysis, loading, error }) => {
  // Define the categories we want to display
  const categories = ['overall', 'sleep', 'exercise', 'nutrition', 'stress', 'hydration', 'lifestyle', 'medical'];

  return (
    <>
      {categories.map((category) => {
        // Filter items for this category
        // For 'overall', we might want to show everything or specific overall items
        // But based on the UI, 'overall' seems to be a summary or aggregation
        // If the backend returns 'overall' category items, use them.
        // Otherwise, maybe show a summary of all?
        // For now, let's stick to strict category matching.

        let categoryItems = analysis.filter(item => item.category.toLowerCase() === category);

        // For 'overall', we want a single combined recommendation
        if (category === 'overall') {
          // If we have specific 'overall' items from AI, use the first one as the main summary
          // Otherwise, construct a summary from other categories
          const specificOverall = analysis.find(item => item.category.toLowerCase() === 'overall');

          if (specificOverall) {
            categoryItems = [specificOverall];
          } else {
            // Construct a bite-sized summary from other categories
            const otherCategories = ['sleep', 'exercise', 'nutrition', 'stress', 'hydration', 'lifestyle', 'medical'];
            const summaryPoints = otherCategories.map(cat => {
              const item = analysis.find(i => i.category.toLowerCase() === cat);
              return item ? `• **${cat.charAt(0).toUpperCase() + cat.slice(1)}**: ${item.title}` : null;
            }).filter(Boolean);

            const summaryCard: AnalysisSection = {
              category: 'overall',
              title: "Comprehensive Health Summary",
              analysis: "Here is a quick overview of your personalized health insights based on your data.",
              recommendation: summaryPoints.length > 0
                ? summaryPoints.join("\n\n")
                : "Focus on maintaining a balanced lifestyle across nutrition, exercise, and sleep.",
              score: Math.round(analysis.reduce((acc, curr) => acc + (curr.score || 0), 0) / (analysis.length || 1)) || 70
            };
            categoryItems = [summaryCard];
          }
        } else {
          // For other categories, limit to just 1 recommendation as requested
          if (categoryItems.length > 1) {
            categoryItems = categoryItems.slice(0, 1);
          }
        }

        // Ensure minimum 1 recommendation per tab (fallback)
        if (categoryItems.length === 0 && !loading && !error) {
          const fallback: AnalysisSection = {
            category: category,
            title: `Improve your ${category.charAt(0).toUpperCase() + category.slice(1)}`,
            analysis: `We don't have enough data to generate a specific analysis for ${category} yet.`,
            recommendation: `Focus on maintaining healthy ${category} habits.`,
            score: 70
          };

          // Specific fallbacks
          if (category === 'hydration') {
            fallback.title = "Stay Hydrated";
            fallback.analysis = "Proper hydration is key to overall health.";
            fallback.recommendation = "Aim for 8 glasses of water a day.";
          } else if (category === 'sleep') {
            fallback.title = "Sleep Hygiene";
            fallback.recommendation = "Aim for 7-9 hours of quality sleep.";
          } else if (category === 'exercise') {
            fallback.title = "Stay Active";
            fallback.recommendation = "Aim for 150 minutes of moderate activity per week.";
          } else if (category === 'stress') {
            fallback.title = "Manage Stress";
            fallback.analysis = "Chronic stress can impact your overall well-being.";
            fallback.recommendation = "Practice mindfulness or deep breathing exercises daily.";
          }

          categoryItems = [fallback];
        }

        return (
          <TabsContent key={category} value={category} className="mt-0 space-y-4">
            {loading ? (
              // Show skeletons when loading
              <div className="space-y-4">
                <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg animate-pulse">
                  <p className="text-sm text-muted-foreground font-medium">AI is analyzing your health data...</p>
                </div>
                <AnalysisCard section={{} as AnalysisSection} loading={true} error={null} />
                <AnalysisCard section={{} as AnalysisSection} loading={true} error={null} />
              </div>
            ) : error ? (
              <AnalysisCard section={{} as AnalysisSection} loading={false} error={error} />
            ) : categoryItems.length > 0 ? (
              categoryItems.map((item, index) => (
                <AnalysisCard key={index} section={item} loading={false} error={null} />
              ))
            ) : (
              // Empty state for this category
              <div className="text-center p-8 text-muted-foreground">
                <p>No specific recommendations for {category} yet.</p>
              </div>
            )}
          </TabsContent>
        );
      })}
    </>
  );
};

export default AnalysisContent;
