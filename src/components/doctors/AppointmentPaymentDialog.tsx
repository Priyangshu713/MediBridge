import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, CreditCard, CheckCircle, Loader2, AlertCircle, Crown, FileText, ArrowUpCircle, Download, FileUp } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useHealthStore } from '@/store/healthStore';
import { createAppointmentOrder, verifyAppointmentPayment } from '@/api/auth';
import { generatePDF, downloadPDF } from '@/utils/pdfGenerator';
import { Doctor } from '@/types/doctor';
import { supabase } from '@/lib/supabase';

interface AppointmentPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  geminiTier?: 'free' | 'lite' | 'pro';
  doctor: Doctor;
  appointmentDate: Date;
  /** Called when appointment is fully confirmed and message sent */
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
  geminiTier = 'lite',
  onConfirmed,
}) => {
  const { toast } = useToast();
  const { healthData } = useHealthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'confirm' | 'processing' | 'success'>('confirm');

  // ── Message & health data sharing state ──────────────────────────────
  const [message, setMessage] = useState('');
  const [shareHealthData, setShareHealthData] = useState(true);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const doctorId = doctor._id || doctor.id || '';
  const doctorName = `Dr. ${doctor.firstName} ${doctor.lastName}`;
  const isPro = geminiTier === 'pro';

  // Pre-fill message when dialog opens
  useEffect(() => {
    if (isOpen && appointmentDate) {
      const formattedDate = format(appointmentDate, 'EEEE, MMMM do, yyyy');
      setMessage(`Hi Dr. ${doctor.lastName}, I would like to schedule a consultation on ${formattedDate}.`);
    }
  }, [isOpen, appointmentDate, doctor.lastName]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setStep('confirm');
      setPdfGenerated(false);
      setPdfBlob(null);
    }
  }, [isOpen]);

  // ── Razorpay script loader ───────────────────────────────────────────
  const loadRazorpayScript = (): Promise<boolean> =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  // ── PDF helpers ──────────────────────────────────────────────────────
  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const handleDownloadPdf = async () => {
    if (pdfGenerated && pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `health_report_for_dr_${doctor.lastName.toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
      toast({ title: 'PDF Downloaded', description: 'Your health data PDF has been downloaded successfully.' });
    } else {
      try {
        setDownloadingPdf(true);
        await downloadPDF(healthData, doctor);
        setDownloadingPdf(false);
        toast({ title: 'PDF Downloaded', description: 'Your health data PDF has been downloaded successfully.' });
      } catch {
        setDownloadingPdf(false);
        toast({ title: 'Download Failed', description: 'Could not download health data PDF.', variant: 'destructive' });
      }
    }
  };

  // ── Send message to doctor (via Supabase) ────────────────────────────
  const sendMessageToDoctor = async () => {
    const patientName = localStorage.getItem('userName') || localStorage.getItem('userEmail')?.split('@')[0] || 'Patient';
    const patientEmail = localStorage.getItem('userEmail') || 'unknown@example.com';

    let base64Pdf = null;
    if (shareHealthData) {
      setPdfGenerating(true);
      try {
        const generatedPdf = await generatePDF(healthData, doctor);
        setPdfBlob(generatedPdf);
        setPdfGenerated(true);
        base64Pdf = await blobToBase64(generatedPdf);
      } catch (error) {
        console.error('Error generating PDF:', error);
      }
      setPdfGenerating(false);
    }

    const { error: insertError } = await supabase
      .from('doctor_messages')
      .insert({
        doctor_id: doctor.id || doctor._id,
        patient_name: patientName,
        patient_email: patientEmail,
        subject: `Requested appointment date: ${format(appointmentDate, 'EEEE, MMMM do, yyyy')}`,
        body: message,
        attachment_base64: base64Pdf,
        has_attachment: !!base64Pdf,
      });

    if (insertError) throw insertError;
  };

  // ── Main action handler ──────────────────────────────────────────────
  const handleConfirmAndSend = async () => {
    if (!message.trim()) {
      toast({ title: 'Message required', description: 'Please write a message for the doctor.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create appointment order on backend (tier check enforced server-side)
      const orderData = await createAppointmentOrder(doctorId, appointmentDate, doctorName);

      // Pro users → appointment confirmed immediately, send message
      if (!orderData.requiresPayment) {
        await sendMessageToDoctor();
        setStep('success');
        toast({ title: '✅ Appointment Confirmed!', description: `Your appointment with ${doctorName} is booked and message sent.` });
        setTimeout(() => { onConfirmed(); onClose(); }, 2500);
        return;
      }

      // Lite users → Razorpay payment flow
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
            // Verify payment server-side
            await verifyAppointmentPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              orderData.appointmentId,
            );
            // Payment verified — send message to doctor
            await sendMessageToDoctor();
            setStep('success');
            toast({ title: '✅ Payment Successful!', description: `Appointment with ${doctorName} confirmed and message sent!` });
            setTimeout(() => { onConfirmed(); onClose(); }, 2500);
          } catch {
            toast({ title: 'Payment Verification Failed', description: 'Please contact support.', variant: 'destructive' });
            setStep('confirm');
          }
        },
        prefill: {
          email: localStorage.getItem('userEmail') || '',
          name: localStorage.getItem('userName') || '',
        },
        theme: { color: '#2563eb' },
        modal: { ondismiss: () => setStep('confirm') },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Could not process your request. Please try again.',
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

  // ── Health data preview ──────────────────────────────────────────────
  const renderHealthDataDetails = () => {
    if (!shareHealthData) return null;

    return (
      <div className="space-y-2.5">
        <div className="bg-muted p-3 rounded-md flex items-start gap-3">
          <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-medium text-sm">Health data to be shared:</p>
            <ul className="list-disc ml-4 mt-1 text-muted-foreground space-y-0.5">
              <li>Age: {healthData.age} years</li>
              <li>Gender: {healthData.gender}</li>
              <li>Height: {healthData.height} cm</li>
              <li>Weight: {healthData.weight} kg</li>
              <li>BMI: {(healthData.weight / Math.pow(healthData.height / 100, 2)).toFixed(1)}</li>
              {healthData.bloodGlucose && <li>Blood Glucose: {healthData.bloodGlucose} mg/dL</li>}
            </ul>
          </div>
        </div>

        {healthData.completedAdvancedAnalysis ? (
          <div className="bg-muted p-3 rounded-md flex items-start gap-3">
            <ArrowUpCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-medium text-sm">Advanced analysis will be shared:</p>
              <ul className="list-disc ml-4 mt-1 text-muted-foreground space-y-0.5">
                <li>Lifestyle factors (sleep, exercise, stress)</li>
                <li>Nutrition habits and dietary preferences</li>
                <li>Medical history and conditions</li>
                <li>Health risk assessments</li>
                <li>Personalized health recommendations</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 p-2.5 rounded-md flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400/80">
              Advanced health analysis not yet completed. Only basic health data will be shared.
            </p>
          </div>
        )}

        {shareHealthData && !pdfGenerated && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex gap-1 text-xs h-7"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
          >
            {downloadingPdf ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                Preview Health PDF
              </>
            )}
          </Button>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden rounded-xl">
        {step === 'confirm' && (
          <>
            <DialogHeader className="px-6 pt-6 pb-3">
              <div className="flex justify-center mb-2">
                <div className="bg-blue-100 rounded-full p-3">
                  <Calendar className="h-7 w-7 text-blue-600" />
                </div>
              </div>
              <DialogTitle className="text-lg text-center">Confirm Appointment</DialogTitle>
              <DialogDescription className="text-center text-sm">
                Review details, add a message, and confirm your booking.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="px-6 py-3 space-y-4">
                {/* ── Appointment summary card ── */}
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
                    <span className="font-bold text-primary text-base">
                      {isPro ? '₹0 (Included)' : '₹300'}
                    </span>
                  </div>
                </div>

                {/* ── Tier info banner ── */}
                {isPro ? (
                  <div className="flex items-start gap-2 p-2.5 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-800">
                    <Crown className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-600" />
                    <span>Your Pro subscription includes unlimited appointments. No additional payment required.</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>This is a one-time consultation fee. Upgrade to <strong>Pro</strong> (₹399/mo) to get unlimited appointments included.</span>
                  </div>
                )}

                {/* ── Message to doctor ── */}
                <div className="space-y-1.5">
                  <label htmlFor="appt-message" className="text-sm font-medium">
                    Message to {doctorName}
                  </label>
                  <Textarea
                    id="appt-message"
                    placeholder={`Hi Dr. ${doctor.lastName}, I would like to schedule a consultation about...`}
                    className="resize-none text-sm"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                {/* ── Health data sharing ── */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="share-health-data"
                    checked={shareHealthData}
                    onCheckedChange={(checked) => setShareHealthData(!!checked)}
                  />
                  <div className="grid gap-1 leading-none">
                    <label
                      htmlFor="share-health-data"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Share my health data with {doctorName}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Includes your health profile and analysis results as a PDF attachment.
                    </p>
                  </div>
                </div>

                {renderHealthDataDetails()}
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto" disabled={isLoading || pdfGenerating}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAndSend}
                disabled={isLoading || pdfGenerating}
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLoading || pdfGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : isPro ? (
                  <CheckCircle className="mr-2 h-4 w-4" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                {pdfGenerating
                  ? 'Generating PDF...'
                  : isPro
                    ? 'Confirm & Send'
                    : 'Pay ₹300 & Send'}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-14 gap-4 px-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="font-medium">Processing payment…</p>
            <p className="text-sm text-muted-foreground text-center">Please complete the payment in the Razorpay window.</p>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-14 gap-4 px-6">
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <p className="font-bold text-lg text-green-700">Appointment Confirmed!</p>
            <p className="text-sm text-muted-foreground text-center">
              Your appointment with {doctorName} on {format(appointmentDate, 'MMMM d')} is booked.
              {shareHealthData && ' Your health data has been shared.'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentPaymentDialog;
