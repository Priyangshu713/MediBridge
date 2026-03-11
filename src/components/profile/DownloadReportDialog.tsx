import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/hooks/use-toast';
import { useHealthStore } from '@/store/healthStore';
import { FileText, Loader2, AlertCircle, Check, ArrowUpCircle, Download } from 'lucide-react';
import { downloadPDF } from '@/utils/pdfGenerator';
import { ScrollArea } from "@/components/ui/scroll-area";

interface DownloadReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadReportDialog: React.FC<DownloadReportDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const { healthData } = useHealthStore();
  const [includeAdvancedData, setIncludeAdvancedData] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      // Create a temporary health data object based on selection
      const dataToExport = {
        ...healthData,
        completedAdvancedAnalysis: includeAdvancedData && healthData.completedAdvancedAnalysis
      };

      await downloadPDF(dataToExport);

      toast({
        title: "Report Downloaded",
        description: "Your health report has been downloaded successfully.",
      });
      
      onClose();
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Download Failed",
        description: "Could not generate health report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const renderHealthDataDetails = () => {
    return (
      <div className="mt-4 space-y-3">
        <div className="bg-muted p-3 rounded-md flex items-start gap-3">
          <FileText className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Basic health data included:</p>
            <ul className="list-disc ml-5 mt-1 text-muted-foreground">
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
          includeAdvancedData ? (
            <div className="bg-muted p-3 rounded-md flex items-start gap-3">
              <ArrowUpCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Advanced health analysis included:</p>
                <ul className="list-disc ml-5 mt-1 text-muted-foreground">
                  <li>Lifestyle factors (sleep, exercise, stress)</li>
                  <li>Nutrition habits and dietary preferences</li>
                  <li>Medical history and conditions</li>
                  <li>Health risk assessments</li>
                  <li>Personalized health recommendations</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-muted/50 border border-dashed p-3 rounded-md flex items-start gap-3 opacity-70">
              <ArrowUpCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-muted-foreground">Advanced analysis excluded</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Check the box above to include your detailed health analysis.
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 p-3 rounded-md flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-300">Advanced analysis not available</p>
              <p className="mt-1 text-amber-700 dark:text-amber-400/80">
                Complete your advanced health analysis to include it in your report.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Download Health Report</DialogTitle>
          <DialogDescription>
            Generate and download a PDF copy of your health profile and analysis.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 h-auto max-h-[60vh] overflow-y-auto">
          <div className="px-6 py-4">
            <div className="space-y-4">
              {healthData.completedAdvancedAnalysis && (
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="include-advanced"
                    checked={includeAdvancedData}
                    onCheckedChange={(checked) => setIncludeAdvancedData(!!checked)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="include-advanced"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Include Advanced Health Analysis
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Adds detailed insights, scores, and recommendations to your report.
                    </p>
                  </div>
                </div>
              )}

              {renderHealthDataDetails()}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDownloading}
            className="sm:order-1 w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isDownloading}
            className="sm:order-2 w-full sm:w-auto"
            onClick={handleDownload}
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
