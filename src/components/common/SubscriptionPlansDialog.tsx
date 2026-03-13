
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { Bot, Zap, Sparkles, Check, ChevronDown, ChevronUp, Info, Clock, Star, Crown, Shield, Lock } from 'lucide-react';
import { GeminiTier } from '@/store/healthStore';
import GeminiTierBenefits from './GeminiTierBenefits';
import { initiatePayment, cancelSubscription, startTrialOnServer } from "@/api/auth";
import { useNavigate } from 'react-router-dom';

interface SubscriptionPlansDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTier: (tier: GeminiTier) => void;
  initialTab?: string | null;
}

type BillingCycle = 'trial' | 'weekly' | 'monthly' | 'sixMonths' | 'yearly';

interface PlanPricing {
  amount: number;
  originalAmount?: number;
  discount?: string;
  perMonth?: string;
  tag?: string;
}

type PricingMap = {
  [key in GeminiTier]: {
    [key in BillingCycle]?: PlanPricing;
  };
};

const planPricing: PricingMap = {
  free: {},
  lite: {
    weekly: { amount: 49 },
    monthly: { amount: 149 },
    sixMonths: { amount: 749, originalAmount: 894, discount: '16% Off', perMonth: '₹125/month' },
    yearly: { amount: 1199, originalAmount: 1788, discount: '33% Off', perMonth: '₹100/month', tag: 'Best Value' },
  },
  pro: {
    trial: { amount: 0, tag: '3-Day Free Trial' },
    weekly: { amount: 149, tag: 'Includes Appointments' },
    monthly: { amount: 399, tag: 'Most Popular · Includes Appointments' },
    sixMonths: { amount: 1999, originalAmount: 2394, discount: '17% Off', perMonth: '₹333/month', tag: 'Includes Appointments' },
    yearly: { amount: 3499, originalAmount: 4788, discount: '27% Off', perMonth: '₹292/month', tag: 'Best Value · Includes Appointments' },
  }
};

const billingCycleLabels: { [key in BillingCycle]: string } = {
  trial: '3-Day Trial',
  weekly: 'Weekly',
  monthly: 'Monthly',
  sixMonths: '6 Months',
  yearly: 'Yearly',
};

// Hierarchy rank — higher = longer commitment. Users can only go UP.
const cycleRank: { [key in BillingCycle]: number } = {
  trial: 0,
  weekly: 1,
  monthly: 2,
  sixMonths: 3,
  yearly: 4,
};

const tierRank: { [key in GeminiTier]: number } = {
  free: 0,
  lite: 1,
  pro: 2,
};

const billingCycleOrder: BillingCycle[] = ['trial', 'weekly', 'monthly', 'sixMonths', 'yearly'];

const SubscriptionPlansDialog: React.FC<SubscriptionPlansDialogProps> = ({
  isOpen,
  onClose,
  onSelectTier,
  initialTab = 'lite'
}) => {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState(initialTab || 'lite');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [showBillingOptions, setShowBillingOptions] = useState(false);
  const navigate = useNavigate();

  const [currentTier, setCurrentTier] = useState<GeminiTier>('free');
  const [currentBillingCycle, setCurrentBillingCycle] = useState<BillingCycle | null>(null);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);

  useEffect(() => {
    if (initialTab && initialTab !== 'free') {
      setSelectedTab(initialTab);
    }
  }, [initialTab]);

  // Re-read localStorage every time the dialog opens
  useEffect(() => {
    if (isOpen) {
      const storedTier = localStorage.getItem('geminiTier') as GeminiTier || 'free';
      const storedBilling = localStorage.getItem('billingCycle') as BillingCycle | null;
      const trialUsed = localStorage.getItem('proTrialUsed') === 'true';

      setCurrentTier(storedTier);
      setCurrentBillingCycle(storedBilling);
      setHasUsedTrial(trialUsed);
      setShowBillingOptions(false);

      // Smart default tab: if on Lite, show Pro tab (upgrade). If free, show Lite.
      if (!initialTab || initialTab === 'free') {
        if (storedTier === 'lite') {
          setSelectedTab('pro');
        } else if (storedTier === 'pro') {
          setSelectedTab('pro');
        } else {
          setSelectedTab('lite');
        }
      }

      // Smart default billing cycle
      setBillingCycle(getSmartDefaultBilling(storedTier, storedBilling, trialUsed));
    }
  }, [isOpen]);

  const getSmartDefaultBilling = (tier: GeminiTier, billing: BillingCycle | null, trialUsed: boolean): BillingCycle => {
    // Free user → suggest monthly
    if (tier === 'free') return trialUsed ? 'monthly' : 'trial';
    // Paid user → suggest one step up from current or same
    if (billing) {
      const rank = cycleRank[billing];
      if (rank < cycleRank.yearly) {
        // Suggest the next higher cycle
        const nextCycle = billingCycleOrder.find(c => cycleRank[c] > rank && c !== 'trial');
        return nextCycle || billing;
      }
      return billing;
    }
    return 'monthly';
  };

  const handleTabChange = (value: string) => {
    if (value === 'free') return; // No free tab
    setSelectedTab(value);
    setShowBillingOptions(false);

    // Reset billing cycle to something valid for the selected tab
    const tier = value as GeminiTier;
    if (tier === 'pro' && currentTier === 'free' && !hasUsedTrial) {
      setBillingCycle('trial');
    } else {
      const firstValid = getFirstValidCycle(tier);
      setBillingCycle(firstValid);
    }
  };

  // Get the first valid (selectable) billing cycle for a tier
  const getFirstValidCycle = (tier: GeminiTier): BillingCycle => {
    const cycles = getAvailableCycles(tier);
    // Find first cycle that isn't locked
    for (const cycle of cycles) {
      if (!isCycleLocked(tier, cycle)) return cycle;
    }
    // Fallback to the last available
    return cycles[cycles.length - 1] || 'monthly';
  };

  // Is this billing cycle locked (user can't select it because it's a downgrade)?
  const isCycleLocked = (tier: GeminiTier | string, cycle: BillingCycle): boolean => {
    // Free users can pick anything
    if (currentTier === 'free') return false;

    // Trial is special — only locked if already used
    if (cycle === 'trial') return hasUsedTrial;

    // Same tier — can only go UP in billing cycle (or stay on current)
    if (currentTier === tier && currentBillingCycle) {
      return cycleRank[cycle] < cycleRank[currentBillingCycle];
    }

    // Upgrading from Lite to Pro — allow all cycles at or above current
    if (currentTier === 'lite' && tier === 'pro' && currentBillingCycle) {
      return cycleRank[cycle] < cycleRank[currentBillingCycle];
    }

    return false;
  };

  // Is the entire selected tab locked? (e.g., Pro user looking at Lite = downgrade)
  const isTabDowngrade = (tier: GeminiTier | string): boolean => {
    if (currentTier === 'free') return false;
    return tierRank[tier as GeminiTier] < tierRank[currentTier];
  };

  const handleSubscribe = async () => {
    const tier = selectedTab as GeminiTier;

    // Already on same plan with same billing
    if (tier === currentTier && currentBillingCycle === billingCycle) {
      toast({
        title: "Already Subscribed",
        description: `You are already on this plan.`,
      });
      return;
    }

    // Handle trial
    if (billingCycle === 'trial') {
      handleStartTrial();
      return;
    }

    // All paid plans go through Razorpay
    const pricing = planPricing[tier]?.[billingCycle];
    if (!pricing) return;

    // Save the selected billing cycle
    localStorage.setItem('billingCycle', billingCycle);

    onClose();
    await initiatePayment(pricing.amount, billingCycle, tier, billingCycle);
  };

  const handleStartTrial = async () => {
    if (hasUsedTrial) {
      toast({
        title: "Trial Already Used",
        description: "You've already used your free Pro trial. Choose a paid plan to continue.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await startTrialOnServer();

      if (!result.success) {
        // Server rejected the trial (already used)
        setHasUsedTrial(true);
        localStorage.setItem('proTrialUsed', 'true');
        toast({
          title: "Trial Already Used",
          description: result.message || "You've already used your free trial.",
          variant: "destructive",
        });
        return;
      }

      // Server confirmed — update local state
      setCurrentTier('pro');
      setCurrentBillingCycle('trial');
      setHasUsedTrial(true);

      onSelectTier('pro');

      toast({
        title: "🎉 Pro Trial Activated!",
        description: "You have 3 days of free Pro access. Enjoy all premium features!",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not start trial. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleBillingOptions = () => {
    setShowBillingOptions(!showBillingOptions);
  };

  const selectBillingCycle = (cycle: BillingCycle) => {
    if (!isCycleLocked(selectedTab as GeminiTier, cycle)) {
      setBillingCycle(cycle);
    }
    setShowBillingOptions(false);
  };

  // Determine available billing cycles for a given tier
  const getAvailableCycles = (tier: GeminiTier | string): BillingCycle[] => {
    return billingCycleOrder.filter(cycle => {
      if (cycle === 'trial') return (tier as GeminiTier) === 'pro'; // Trial only for Pro
      return planPricing[tier as GeminiTier]?.[cycle] !== undefined;
    });
  };

  // Is the subscribe button enabled?
  const isSubscribeEnabled = (): boolean => {
    const tier = selectedTab as GeminiTier;

    // Tab is a downgrade (e.g., Pro user looking at Lite)
    if (isTabDowngrade(tier)) return false;

    // Same plan + same billing
    if (currentTier === tier && currentBillingCycle === billingCycle) return false;

    // Cycle is locked
    if (isCycleLocked(tier, billingCycle)) return false;

    // Trial already used
    if (billingCycle === 'trial' && hasUsedTrial) return false;

    return true;
  };

  const getSubscribeButtonText = (): string => {
    const tier = selectedTab as GeminiTier;

    // Downgrade tab
    if (isTabDowngrade(tier)) {
      return '🔒 Cancel current plan from Account Settings';
    }

    // Same plan + billing
    if (currentTier === tier && currentBillingCycle === billingCycle) {
      return '✓ Current Plan';
    }

    // Locked cycle
    if (isCycleLocked(tier, billingCycle)) {
      return '🔒 Can\'t downgrade billing cycle';
    }

    // Trial
    if (billingCycle === 'trial') {
      return hasUsedTrial ? 'Trial Already Used' : 'Start Free Trial';
    }

    const pricing = planPricing[tier]?.[billingCycle];
    if (!pricing) return 'Subscribe';

    const tierName = tier === 'pro' ? 'Pro' : 'Lite';
    const cycleSuffix = billingCycle === 'weekly' ? 'week' : billingCycle === 'monthly' ? 'month' : billingCycle === 'sixMonths' ? '6mo' : 'year';

    // Determine action verb
    let action = 'Subscribe';
    if (currentTier !== 'free') {
      if (tierRank[tier] > tierRank[currentTier]) {
        action = 'Upgrade';
      } else if (currentTier === tier) {
        action = 'Upgrade Billing';
      }
    }

    return `${action} to ${tierName} — ₹${pricing.amount}/${cycleSuffix}`;
  };

  // Render the billing cycle selector
  const renderBillingSelector = (tier: 'lite' | 'pro') => {
    const cycles = getAvailableCycles(tier);

    return (
      <div className="relative">
        <Button
          onClick={toggleBillingOptions}
          variant="outline"
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            {billingCycle === 'trial' && <Clock className="h-3.5 w-3.5" />}
            {billingCycleLabels[billingCycle]} Billing
          </span>
          {showBillingOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {showBillingOptions && (
          <div className="absolute top-full left-0 w-full bg-background border rounded-md mt-1 shadow-md z-10">
            {cycles.map(cycle => {
              const pricing = planPricing[tier]?.[cycle];
              const isCurrent = cycle === currentBillingCycle && currentTier === tier;
              const locked = isCycleLocked(tier, cycle);

              return (
                <button
                  key={cycle}
                  className={`w-full text-left px-4 py-2.5 flex justify-between items-center transition-colors
                    ${cycle === billingCycle ? 'bg-muted' : ''}
                    ${locked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted cursor-pointer'}`}
                  onClick={() => selectBillingCycle(cycle)}
                  disabled={locked}
                >
                  <span className="flex items-center gap-2">
                    {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                    {cycle === 'trial' && !locked && <Clock className="h-3.5 w-3.5 text-green-600" />}
                    {billingCycleLabels[cycle]}
                    {pricing?.amount === 0 && cycle === 'trial' && !hasUsedTrial && (
                      <span className="text-xs text-green-600 font-medium">FREE</span>
                    )}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isCurrent && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                    {locked && !isCurrent && (
                      <span className="text-xs text-muted-foreground">Locked</span>
                    )}
                    {pricing?.tag && cycle !== 'trial' && !locked && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        {pricing.tag}
                      </span>
                    )}
                    {pricing?.discount && !locked && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        {pricing.discount}
                      </span>
                    )}
                    {pricing && pricing.amount > 0 && (
                      <span className="text-xs text-muted-foreground">₹{pricing.amount}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Render the price display
  const renderPriceDisplay = (tier: 'lite' | 'pro') => {
    const pricing = planPricing[tier]?.[billingCycle];
    if (!pricing) return null;

    if (billingCycle === 'trial') {
      return (
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">FREE</div>
          <div className="text-xs text-muted-foreground">3 days Pro access</div>
        </div>
      );
    }

    const cycleSuffix = billingCycle === 'weekly' ? 'week' : billingCycle === 'monthly' ? 'month' : billingCycle === 'sixMonths' ? '6 months' : 'year';

    return (
      <div className="text-right">
        <div className="flex items-baseline justify-end gap-1.5">
          {pricing.originalAmount && (
            <span className="text-sm text-muted-foreground line-through">₹{pricing.originalAmount}</span>
          )}
          <span className="text-2xl font-bold">₹{pricing.amount}</span>
        </div>
        <div className="text-xs text-muted-foreground">/{cycleSuffix}</div>
        {pricing.perMonth && (
          <div className="text-xs text-green-600 font-medium">{pricing.perMonth}</div>
        )}
        {pricing.discount && (
          <div className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
            {pricing.discount}
          </div>
        )}
      </div>
    );
  };

  // Render the ladder nudge
  const renderLadderNudge = () => {
    if (selectedTab !== 'lite') return null;
    if (billingCycle !== 'sixMonths' && billingCycle !== 'yearly') return null;

    const litePricing = planPricing.lite?.[billingCycle];
    const proPricing = planPricing.pro?.[billingCycle];

    if (!litePricing || !proPricing) return null;

    const diff = proPricing.amount - litePricing.amount;

    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
        <Crown className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <span className="font-medium text-amber-800">
            Upgrade to Pro for just ₹{diff} more
          </span>
          <p className="text-amber-700 text-xs mt-0.5">
            Get premium AI features, advanced health reports, and meal tracking — all for a small upgrade.
          </p>
        </div>
      </div>
    );
  };

  // Current plan info banner
  const renderCurrentPlanBanner = () => {
    if (currentTier === 'free') return null;

    const tierName = currentTier === 'pro' ? 'Pro' : 'Lite';
    const billingLabel = currentBillingCycle ? billingCycleLabels[currentBillingCycle] : '';

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center justify-between text-sm mb-2">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-600" />
          <span className="text-blue-800">
            You're on <strong>{tierName} {billingLabel}</strong>
          </span>
        </div>
        <span className="text-xs text-blue-600">Only upgrades shown</span>
      </div>
    );
  };

  const selectedPricing = planPricing[selectedTab as GeminiTier]?.[billingCycle];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {currentTier === 'free' ? 'Choose Your Plan' : 'Upgrade Your Plan'}
          </DialogTitle>
          <DialogDescription>
            {currentTier === 'free'
              ? 'Select a subscription plan to access Gemini AI features'
              : 'Upgrade your plan or billing cycle for more value'}
          </DialogDescription>
        </DialogHeader>

        {renderCurrentPlanBanner()}

        <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger
              value="lite"
              className="flex items-center gap-2"
              disabled={isTabDowngrade('lite')}
            >
              <Zap className="h-4 w-4 text-purple-500" />
              Lite
              {isTabDowngrade('lite') && <Lock className="h-3 w-3 ml-1 text-muted-foreground" />}
            </TabsTrigger>
            <TabsTrigger value="pro" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Pro
            </TabsTrigger>
          </TabsList>

          {/* Lite Plan Tab */}
          <TabsContent value="lite" className="mt-0">
            <div className="border rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-500" />
                    Lite Plan
                    {currentTier === 'lite' && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-normal">
                        Current
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">Standard AI features</p>
                </div>
                {renderPriceDisplay('lite')}
              </div>

              {renderBillingSelector('lite')}
              {renderLadderNudge()}
              <GeminiTierBenefits tierType="lite" />

              <Button
                onClick={handleSubscribe}
                className="w-full"
                disabled={!isSubscribeEnabled()}
              >
                {getSubscribeButtonText()}
              </Button>
            </div>
          </TabsContent>

          {/* Pro Plan Tab */}
          <TabsContent value="pro" className="mt-0">
            <div className="border rounded-lg p-4 pt-5 space-y-3 bg-amber-50/30">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Pro Plan
                    {currentTier === 'pro' && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-normal">
                        Current
                      </span>
                    )}
                    {selectedPricing?.tag && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-normal">
                        {selectedPricing.tag}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Premium AI features</p>
                </div>
                {renderPriceDisplay('pro')}
              </div>

              {renderBillingSelector('pro')}

              {billingCycle === 'trial' && !hasUsedTrial && (
                <div className="text-xs text-green-700 bg-green-50 p-2.5 rounded-md flex items-start gap-2 border border-green-200">
                  <Star size={14} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">3-Day Free Pro Trial</p>
                    <p className="mt-0.5 opacity-90 leading-tight">Full access to all Pro features for 3 days. No payment required. Automatically downgrades to Free after the trial ends.</p>
                  </div>
                </div>
              )}

              <GeminiTierBenefits tierType="pro" />

              <Button
                onClick={handleSubscribe}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white shadow-sm mt-1"
                disabled={!isSubscribeEnabled()}
              >
                {getSubscribeButtonText()}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionPlansDialog;
