import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Eye, Download, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ComplianceDashboard } from "@/components/ui/compliance-dashboard";
import complyLogo from "@/assets/comply-logo.png";
import { validateFileSize } from "@/utils/fileValidation";

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
  file_upload_limit?: number;
  file_uploads_used?: number;
  file_size_limit_mb?: number;
}

interface TierFeatures {
  tier_name: string;
  features: any; // Json type from Supabase
  file_upload_limit: number;
  monthly_price: number;
  yearly_price: number;
}

interface Report {
  id: string;
  original_filename: string;
  status: string;
  report_type: string;
  processed_content?: string;
  created_at: string;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string>("");
  const [reportId, setReportId] = useState<string>("");
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({ subscribed: false });
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [tierFeatures, setTierFeatures] = useState<TierFeatures | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Fetch subscription data and reports
  useEffect(() => {
    if (user) {
      fetchSubscriptionData();
      fetchReports();
      fetchTierFeatures();
    }
  }, [user]);

  const fetchSubscriptionData = async () => {
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('subscribed, subscription_tier, subscription_end, file_upload_limit, file_uploads_used')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription data:', error);
        return;
      }

      setSubscriptionData({
        subscribed: data?.subscribed || false,
        subscription_tier: data?.subscription_tier,
        subscription_end: data?.subscription_end,
        file_upload_limit: data?.file_upload_limit || 0,
        file_uploads_used: data?.file_uploads_used || 0,
      });
    } catch (error) {
      console.error('Error in fetchSubscriptionData:', error);
    }
  };

  const fetchReports = async () => {
    if (!user) return;
    
    setLoadingReports(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchTierFeatures = async () => {
    if (!subscriptionData.subscription_tier) return;
    
    try {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('tier_name', subscriptionData.subscription_tier.toLowerCase())
        .single();

      if (error) throw error;
      setTierFeatures(data);
    } catch (error) {
      console.error('Error fetching tier features:', error);
    }
  };

  // Fetch tier features when subscription data changes
  useEffect(() => {
    if (subscriptionData.subscription_tier) {
      fetchTierFeatures();
    }
  }, [subscriptionData.subscription_tier]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
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
    setReportReady(false);
    setGeneratedReport("");
    
    toast({
      title: "File Uploaded",
      description: `${file.name} is ready for processing.`,
    });
  };

  const generateReport = async () => {
    if (!uploadedFile) {
      toast({
        title: "No File Selected",
        description: "Please upload a document first.",
        variant: "destructive",
      });
      return;
    }

    // Check usage limits
    if (!subscriptionData.subscribed) {
      toast({
        title: "Subscription Required",
        description: "Please subscribe to generate compliance reports.",
        variant: "destructive",
      });
      return;
    }

    if (subscriptionData.file_uploads_used >= subscriptionData.file_upload_limit) {
      toast({
        title: "Upload Limit Reached",
        description: `You've reached your monthly limit of ${subscriptionData.file_upload_limit} uploads.`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const fileContent = await uploadedFile.text();
      
      const { data, error } = await supabase.functions.invoke('process-document', {
        body: {
          document: fileContent,
          filename: uploadedFile.name,
          reportType: 'compliance'
        }
      });

      if (error) throw error;

      setGeneratedReport(data.report);
      setReportId(data.reportId);
      setReportReady(true);
      
      // Refresh subscription data to show updated usage
      await fetchSubscriptionData();
      await fetchReports();
      
      toast({
        title: "Report Generated",
        description: "Your compliance report is ready for download.",
      });
    } catch (error: any) {
      console.error('Report generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadReport = (reportContent: string, filename: string) => {
    if (!reportContent) {
      toast({
        title: "No Report Available",
        description: "Please generate a report first.",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Complete",
      description: "Report downloaded successfully.",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'processing': return <Clock className="h-4 w-4 text-warning animate-spin" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/20 text-success border-success/30';
      case 'processing': return 'bg-warning/20 text-warning border-warning/30';
      default: return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="p-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="inline-flex items-center gap-2 text-white">
            <img src={complyLogo} alt="Logo" className="h-8 w-8" />
            <span className="text-xl font-bold">Compliance Ease</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="text-white text-sm">
              Welcome, {user.email}
            </div>
            <Button variant="outline" className="border-white/20 text-black hover:bg-white/10" asChild>
              <Link to="/subscription">My Subscription</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Subscription Status */}
        <Card className="backdrop-blur bg-card/80 border border-border/50 shadow-strong mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Subscription Status</span>
              {subscriptionData.subscribed && (
                <Badge className="bg-success/20 text-success border-success/30">
                  {subscriptionData.subscription_tier} Plan
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptionData.subscribed ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">File Uploads Used</span>
                  <span className="font-medium">
                    {subscriptionData.file_uploads_used} / {subscriptionData.file_upload_limit}
                  </span>
                </div>
                <Progress 
                  value={(subscriptionData.file_uploads_used / subscriptionData.file_upload_limit) * 100} 
                  className="h-2"
                />
                {subscriptionData.subscription_end && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Next billing date</span>
                    <span>{new Date(subscriptionData.subscription_end).toLocaleDateString()}</span>
                  </div>
                )}
                
                {/* Current Plan Features */}
                {tierFeatures && (
                  <div className="mt-6 p-4 bg-muted/20 rounded-lg border border-border/30">
                    <h4 className="font-medium mb-3 text-foreground">Your {tierFeatures.tier_name} Plan Includes:</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {Array.isArray(tierFeatures.features) && tierFeatures.features.map((feature: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-success flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">No active subscription found.</p>
                <Button asChild>
                  <Link to="/#pricing">Subscribe Now</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="backdrop-blur bg-card/80 border border-border/50 shadow-strong">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Upload Document
                </CardTitle>
                <CardDescription>
                  Upload your compliance document to generate an AI-powered analysis report.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {uploadedFile ? `Selected: ${uploadedFile.name}` : 'Choose a file to upload'}
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button asChild variant="outline">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        {uploadedFile ? 'Change File' : 'Select File'}
                      </label>
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Supported formats: PDF, DOC, DOCX, TXT
                      {subscriptionData && (
                        <span className="block mt-1">
                          Max file size: {subscriptionData.file_size_limit_mb || 1}MB
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={generateReport}
                  disabled={!uploadedFile || isProcessing || !subscriptionData.subscribed}
                  className="w-full bg-gradient-primary hover:opacity-90"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing Document...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Compliance Report
                    </>
                  )}
                </Button>

                {reportReady && generatedReport && (
                  <div className="mt-6 animate-scale-in">
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
                        // Store the report data temporarily and navigate to report detail
                        sessionStorage.setItem('temp-report', JSON.stringify(tempReport));
                        navigate('/report/temp');
                      }}
                      onDownload={() => downloadReport(generatedReport, `compliance-report-${uploadedFile?.name || 'document'}.txt`)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Reports History */}
          <div className="space-y-6">
            <Card className="backdrop-blur bg-card/80 border border-border/50 shadow-strong">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Recent Reports
                </CardTitle>
                <CardDescription>
                  Your generated compliance reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingReports ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Loading reports...</p>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No reports generated yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.slice(0, 5).map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/30"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusIcon(report.status)}
                            <p className="text-sm font-medium truncate">
                              {report.original_filename}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${getStatusColor(report.status)}`}>
                              {report.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(report.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                         {report.status === 'completed' && report.processed_content && (
                           <div className="flex gap-1">
                              <Button
                                onClick={() => navigate(`/report/${report.id}`)}
                                variant="ghost"
                                size="sm"
                                title="View Details"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                             <Button
                               onClick={() => downloadReport(report.processed_content!, `compliance-report-${report.original_filename}.txt`)}
                               variant="ghost"
                               size="sm"
                               title="Download Report"
                             >
                               <Download className="h-3 w-3" />
                             </Button>
                           </div>
                         )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}