import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, CreditCard, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { createAppointmentOrder, verifyAppointmentPayment } from '@/api/auth';

interface AppointmentPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: {
    _id?: string;
    id?: string;
    firstName: string;
    lastName: string;
  };
  appointmentDate: Date;
  /** Called when appointment is confirmed (Lite: after payment; Pro: immediately) */
  onConfirmed: () => void;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY as string;

const AppointmentPaymentDialog: React.FC<AppointmentPaymentDialogProps> = ({
  isOpen,
  onClose,
  doctor,
  appointmentDate,
  onConfirmed,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'confirm' | 'processing' | 'success'>('confirm');

  const doctorId = doctor._id || doctor.id || '';
  const doctorName = `Dr. ${doctor.firstName} ${doctor.lastName}`;

  const loadRazorpayScript = (): Promise<boolean> =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePay = async () => {
    setIsLoading(true);
    try {
      // 1. Create order on backend (backend enforces tier check)
      const orderData = await createAppointmentOrder(doctorId, appointmentDate);

      // Pro users get immediate confirmation
      if (!orderData.requiresPayment) {
        setStep('success');
        toast({ title: '✅ Appointment Confirmed!', description: `Your appointment with ${doctorName} is booked.` });
        setTimeout(() => { onConfirmed(); onClose(); }, 2000);
        return;
      }

      // 2. Load Razorpay checkout for Lite users
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error('Could not load payment gateway. Please try again.');

      setStep('processing');

      const options = {
        key: RAZORPAY_KEY,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'MediBridge',
        description: `Appointment with ${doctorName} — ${format(appointmentDate, 'MMMM d, yyyy')}`,
        order_id: orderData.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            // 3. Verify signature server-side — critical security step
            await verifyAppointmentPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              orderData.appointmentId,
            );

            setStep('success');
            toast({ title: '✅ Payment Successful!', description: `Appointment with ${doctorName} confirmed!` });
            setTimeout(() => { onConfirmed(); onClose(); }, 2000);
          } catch (verifyError) {
            toast({
              title: 'Payment Verification Failed',
              description: 'Your payment could not be verified. Please contact support.',
              variant: 'destructive',
            });
            setStep('confirm');
          }
        },
        prefill: {
          email: localStorage.getItem('userEmail') || '',
          name: localStorage.getItem('userName') || '',
        },
        theme: { color: '#2563eb' },
        modal: {
          ondismiss: () => setStep('confirm'),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Could not start payment. Please try again.',
        variant: 'destructive',
      });
      setStep('confirm');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('confirm');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[420px] rounded-xl">
        {step === 'confirm' && (
          <>
            <DialogHeader>
              <div className="flex justify-center mb-3">
                <div className="bg-blue-100 rounded-full p-4">
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <DialogTitle className="text-xl text-center">Confirm Appointment</DialogTitle>
              <DialogDescription className="text-center">
                Review the details below before proceeding to payment.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="p-3 rounded-lg border bg-muted/40 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Doctor</span>
                  <span className="font-medium">{doctorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{format(appointmentDate, 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="font-semibold">Consultation Fee</span>
                  <span className="font-bold text-primary text-base">₹300</span>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>This is a one-time consultation fee. Upgrade to <strong>Pro</strong> (₹399/mo) to get unlimited appointments included.</span>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handlePay} disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                Pay ₹300
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="font-medium">Processing payment…</p>
            <p className="text-sm text-muted-foreground text-center">Please complete the payment in the Razorpay window.</p>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <p className="font-bold text-lg text-green-700">Appointment Confirmed!</p>
            <p className="text-sm text-muted-foreground text-center">
              Your appointment with {doctorName} on {format(appointmentDate, 'MMMM d')} is booked.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentPaymentDialog;
