import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, Calendar, Crown, Zap } from 'lucide-react';
import SubscriptionPlansDialog from '@/components/common/SubscriptionPlansDialog';

interface UpgradeForAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  doctorName?: string;
}

const UpgradeForAppointmentDialog: React.FC<UpgradeForAppointmentDialogProps> = ({
  isOpen,
  onClose,
  doctorName,
}) => {
  const [showPlans, setShowPlans] = React.useState(false);

  return (
    <>
      <Dialog open={isOpen && !showPlans} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[420px] rounded-xl">
          <DialogHeader className="text-center pb-2">
            <div className="flex justify-center mb-3">
              <div className="bg-amber-100 rounded-full p-4">
                <Lock className="h-8 w-8 text-amber-600" />
              </div>
            </div>
            <DialogTitle className="text-xl text-center">Upgrade to Book Appointments</DialogTitle>
            <DialogDescription className="text-center">
              {doctorName
                ? `Booking an appointment with ${doctorName} requires a paid plan.`
                : 'Booking appointments with specialists requires a paid plan.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Lite option */}
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-purple-50 border-purple-200">
              <Zap className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-purple-900 text-sm">Lite Plan — ₹149/month</p>
                <p className="text-xs text-purple-700 mt-0.5">
                  All AI tools + schedule appointments for just <strong>₹299 per session</strong>.
                </p>
              </div>
            </div>

            {/* Pro option */}
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-amber-50 border-amber-200">
              <Crown className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-900 text-sm">Pro Plan — ₹399/month</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Free Consultation Credits <strong>included</strong> — then just ₹99/visit. Best for regular care.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>Real doctors, real appointments. Your health is our priority.</span>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Maybe Later
            </Button>
            <Button
              onClick={() => setShowPlans(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
            >
              <Crown className="mr-2 h-4 w-4" />
              View Plans
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SubscriptionPlansDialog
        isOpen={showPlans}
        onClose={() => { setShowPlans(false); onClose(); }}
        onSelectTier={() => { setShowPlans(false); onClose(); }}
        initialTab="lite"
      />
    </>
  );
};

export default UpgradeForAppointmentDialog;
