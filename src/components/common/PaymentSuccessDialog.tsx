
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-window-size';
import { useNavigate } from 'react-router-dom';

interface PaymentSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plan: string;
  amount: string;
  billingCycle: string;
}

const PaymentSuccessDialog: React.FC<PaymentSuccessDialogProps> = ({
  isOpen,
  onClose,
  plan,
  amount,
  billingCycle
}) => {
  const { width, height } = useWindowSize();
  const navigate = useNavigate();
  
  // Auto-close after 5 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);
  
  const formattedBillingCycle = billingCycle === 'weekly' 
    ? 'week' 
    : billingCycle === 'monthly' 
      ? 'month' 
      : billingCycle;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] text-center">
        {isOpen && (
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={200}
          />
        )}
        
        <div className="flex flex-col items-center justify-center py-6">
          <div className="rounded-full bg-green-100 p-3 mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Payment Successful!</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-2">
            <p className="text-muted-foreground">
              Your payment of {amount} for the {plan} Plan was successful.
            </p>
            <p className="text-muted-foreground">
              Your subscription is now active and will renew every {formattedBillingCycle}.
            </p>
            <p className="mt-4 text-sm font-medium text-green-600">
              Thank you for subscribing to MediBridge!
            </p>
          </div>
          
          <DialogFooter className="mt-6 w-full flex flex-col gap-2">
            {plan.toLowerCase().includes('pro') && (
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-white gap-2"
                onClick={() => {
                  onClose();
                  navigate('/profile', { state: { showAnalysisResults: true } });
                }}
              >
                <Sparkles className="h-4 w-4" />
                Try Advanced Health Analysis
              </Button>
            )}
            <Button variant="outline" className="w-full" onClick={onClose}>
              Continue to Dashboard
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentSuccessDialog;
