import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, FileText, CheckCircle, AlertCircle, Eye } from "lucide-react";
import complyLogo from "@/assets/comply-logo.png";
import { ComplianceDashboard } from "@/components/ui/compliance-dashboard";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { validateFileSize } from "@/utils/fileValidation";

export default function FreeTrial() {
  const { t } = useTranslation();
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use the free trial.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    // Check subscription status
    const checkSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from('subscribers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          setSubscriptionData(data);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    };

    checkSubscription();
  }, [user, navigate]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, DOC, DOCX, or TXT file.",
          variant: "destructive",
        });
        return;
      }

      // Check file size based on subscription tier
      const validation = await validateFileSize(file, user?.email);
      if (!validation.isValid) {
        toast({
          title: "File validation failed",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }
      
      setUploadedFile(file);
      toast({
        title: "File uploaded successfully!",
        description: `${file.name} is ready for processing.`,
      });
    }
  };

  const generateReport = async () => {
    if (!uploadedFile) {
      toast({
        title: "No file uploaded",
        description: "Please upload a document first.",
        variant: "destructive",
      });
      return;
    }

    // Check usage limits based on subscription
    const isSubscribed = subscriptionData?.subscribed;
    const fileUploadLimit = subscriptionData?.file_upload_limit || 0;
    const filesUsed = subscriptionData?.file_uploads_used || 0;

    if (!isSubscribed && profile?.trial_used) {
      toast({
        title: "Trial Already Used",
        description: "You've already used your free trial. Please upgrade to a paid subscription to continue.",
        variant: "destructive",
      });
      return;
    }

    if (isSubscribed && filesUsed >= fileUploadLimit) {
      toast({
        title: "Upload Limit Reached",
        description: `You've reached your ${subscriptionData.subscription_tier} plan limit of ${fileUploadLimit} file uploads. Please upgrade your plan.`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Read file content
      const fileContent = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsText(uploadedFile);
      });

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('process-document', {
        body: {
          document: fileContent,
          filename: uploadedFile.name,
          reportType: 'compliance'
        }
      });

      if (error) {
        throw error;
      }

      setGeneratedReport(data.report);
      setReportReady(true);
      
      // Refresh profile to update trial status
      await refreshProfile();
      
      toast({
        title: t('freeTrial.success'),
        description: "Your AI compliance report is ready for download.",
      });
      
      if (data.trialUsed) {
        toast({
          title: "Free Trial Used",
          description: "This was your free trial. Upgrade for unlimited reports!",
        });
      }

    } catch (error: any) {
      console.error('Error processing document:', error);
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process document. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsProcessing(false);
  };

  const downloadReport = () => {
    if (!generatedReport) {
      toast({
        title: "No report available",
        description: "Please generate a report first.",
        variant: "destructive",
      });
      return;
    }

    // Create and download the report as a text file
    const blob = new Blob([generatedReport], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Compliance_Report_${uploadedFile?.name || 'document'}.txt`;
    link.click();
    
    toast({
      title: "Report downloaded",
      description: "Check your downloads folder for the compliance report.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="p-4">
        <Link to="/" className="inline-flex items-center gap-2 text-white">
          <img src={complyLogo} alt="Logo" className="h-8 w-8" />
          <span className="text-xl font-bold">Compliance Ease</span>
        </Link>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {subscriptionData?.subscribed 
              ? `Welcome back, ${subscriptionData.subscription_tier} subscriber!`
              : t('freeTrial.title')
            }
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-4">
            {subscriptionData?.subscribed 
              ? "Process your compliance documents with AI-powered analysis and reporting."
              : t('freeTrial.subtitle')
            }
          </p>
          <p className="text-white/70 max-w-3xl mx-auto">
            {subscriptionData?.subscribed
              ? `You have ${subscriptionData.file_upload_limit - (subscriptionData.file_uploads_used || 0)} uploads remaining this month.`
              : "Upload company data, operational logs, or regulatory documents to see how our AI automates compliance reporting for GDPR, CSRD, and ESG requirements."
            }
          </p>
          {!subscriptionData?.subscribed && profile?.trial_used && (
            <div className="mt-4 p-4 bg-warning/20 border border-warning/30 rounded-lg max-w-2xl mx-auto">
              <div className="flex items-center text-warning">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">Trial Already Used</span>
              </div>
              <p className="text-white/80 text-sm mt-1">
                You've used your free trial. Upgrade to continue processing documents.
              </p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1: Upload */}
          <Card className="backdrop-blur bg-card/80 border border-border/50 shadow-medium">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t('freeTrial.uploadTitle')}</CardTitle>
              <CardDescription>
                {t('freeTrial.uploadDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant={uploadedFile ? "secondary" : "default"}
                className="w-full"
                disabled={isProcessing || (!subscriptionData?.subscribed && profile?.trial_used)}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadedFile ? uploadedFile.name : t('common.upload')}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {t('freeTrial.supportedFormats')}
                {subscriptionData && (
                  <span className="block mt-1">
                    Max file size: {subscriptionData.file_size_limit_mb || 1}MB
                  </span>
                )}
              </p>
              {uploadedFile && (
                <div className="mt-4 flex items-center text-sm text-success">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  File ready for processing
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Process */}
          <Card className="backdrop-blur bg-card/80 border border-border/50 shadow-medium">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>{t('freeTrial.generateReport')}</CardTitle>
              <CardDescription>
                AI analyzes your document for compliance gaps and generates recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={generateReport}
                disabled={!uploadedFile || isProcessing || reportReady || (!subscriptionData?.subscribed && profile?.trial_used)}
                className="w-full bg-gradient-success hover:opacity-90"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('freeTrial.processing')}
                  </>
                ) : reportReady ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Report Ready
                  </>
                ) : (
                  t('freeTrial.generateReport')
                )}
              </Button>
              {isProcessing && (
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  AI is analyzing your document...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Download */}
          <Card className="backdrop-blur bg-card/80 border border-border/50 shadow-medium">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="h-6 w-6 text-warning" />
              </div>
              <CardTitle>{t('freeTrial.downloadReport')}</CardTitle>
              <CardDescription>
                Get your comprehensive compliance report with actionable insights.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportReady && (
                  <Button
                    onClick={() => {
                      // Create a temporary report object for the detail view
                      const tempReport = {
                        id: 'temp-' + Date.now(),
                        original_filename: uploadedFile?.name || 'document.pdf',
                        processed_content: generatedReport || '',
                        created_at: new Date().toISOString(),
                        status: 'completed'
                      };
                      // Store the report data temporarily and open in new window
                      sessionStorage.setItem('temp-report', JSON.stringify(tempReport));
                      window.open('/report/temp', '_blank');
                    }}
                    disabled={!reportReady}
                    className="w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Detailed Analysis
                  </Button>
                )}
                <Button
                  onClick={downloadReport}
                  disabled={!reportReady}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('common.download')} PDF
                </Button>
              </div>
            {reportReady && generatedReport && (
              <div className="mt-8 animate-scale-in">
                <ComplianceDashboard
                  reportContent={generatedReport}
                  filename={uploadedFile?.name || 'document.pdf'}
                  onViewDetails={() => {
                    // Create a temporary report object for the detail view
                    const tempReport = {
                      id: 'temp-' + Date.now(),
                      original_filename: uploadedFile?.name || 'document.pdf',
                      processed_content: generatedReport,
                      created_at: new Date().toISOString(),
                      status: 'completed'
                    };
                    // Store the report data temporarily and open in new window
                    sessionStorage.setItem('temp-report', JSON.stringify(tempReport));
                    window.open('/report/temp', '_blank');
                  }}
                  onDownload={() => downloadReport()}
                />
              </div>
            )}
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          {subscriptionData?.subscribed ? (
            <div className="backdrop-blur bg-card/80 border border-border/50 shadow-medium rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                🎉 Welcome, {subscriptionData.subscription_tier} subscriber!
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-success/10 rounded-lg">
                  <p className="text-success font-semibold text-lg">{subscriptionData.file_upload_limit}</p>
                  <p className="text-muted-foreground text-sm">Monthly Uploads</p>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-primary font-semibold text-lg">{subscriptionData.file_uploads_used || 0}</p>
                  <p className="text-muted-foreground text-sm">Used This Month</p>
                </div>
                <div className="p-4 bg-warning/10 rounded-lg">
                  <p className="text-warning font-semibold text-lg">{subscriptionData.file_upload_limit - (subscriptionData.file_uploads_used || 0)}</p>
                  <p className="text-muted-foreground text-sm">Remaining</p>
                </div>
              </div>
              <p className="text-muted-foreground mt-4">
                Continue processing your compliance documents with unlimited AI analysis and reporting.
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-2xl font-bold text-white mb-4">
                Want the full Compliance Ease experience?
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-gradient-primary hover:opacity-90">
                  <Link to="/signup">{t('common.getStarted')}</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-white border-white/20 hover:bg-white/10">
                  <Link to="/demo">{t('common.bookDemo')}</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}