
import React from 'react';
import { Check } from 'lucide-react';

interface GeminiTierBenefitsProps {
  tierType: string;
}

const GeminiTierBenefits: React.FC<GeminiTierBenefitsProps> = ({ tierType }) => {
  const isPro = tierType === 'pro';

  return (
    <div className="space-y-1.5 mt-1">
      <div className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-2">Features include:</div>
      <ul className="space-y-1.5">
        <li className="flex items-start gap-2 text-sm">
          <Check className={`h-3.5 w-3.5 mt-0.5 ${isPro ? 'text-amber-500' : 'text-purple-500'}`} />
          <span>AI-powered health recommendations</span>
        </li>
        <li className="flex items-start gap-2 text-sm">
          <Check className={`h-3.5 w-3.5 mt-0.5 ${isPro ? 'text-amber-500' : 'text-purple-500'}`} />
          <span>Personalized nutrition suggestions</span>
        </li>
        <li className="flex items-start gap-2 text-sm">
          <Check className={`h-3.5 w-3.5 mt-0.5 ${isPro ? 'text-amber-500' : 'text-purple-500'}`} />
          <span>Basic health insights</span>
        </li>

        {isPro && (
          <div className="pt-1 space-y-1.5">
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-3.5 w-3.5 mt-0.5 text-amber-500" />
              <span>Advanced premium Gemini models</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-3.5 w-3.5 mt-0.5 text-amber-500" />
              <span>Detailed health reports & trends</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-3.5 w-3.5 mt-0.5 text-amber-500" />
              <span>Custom meal planning & recipes</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-3.5 w-3.5 mt-0.5 text-amber-500" />
              <span>Meal Generator & Tracker Access</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-3.5 w-3.5 mt-0.5 text-amber-500" />
              <span>Priority Support</span>
            </li>
          </div>
        )}
      </ul>
    </div>
  );
};

export default GeminiTierBenefits;
