import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Upload, Download, FileText, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function FreeTrial() {
  const { t } = useTranslation();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      if (allowedTypes.includes(file.type)) {
        setUploadedFile(file);
        toast({
          title: "File uploaded successfully!",
          description: `${file.name} is ready for processing.`,
        });
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, DOC, DOCX, or TXT file.",
          variant: "destructive",
        });
      }
    }
  };

  const generateReport = () => {
    if (!uploadedFile) {
      toast({
        title: "No file uploaded",
        description: "Please upload a document first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      setIsProcessing(false);
      setReportReady(true);
      toast({
        title: t('freeTrial.success'),
        description: "Your AI compliance report is ready for download.",
      });
    }, 3000);
  };

  const downloadReport = () => {
    // Simulate downloading a PDF report
    const link = document.createElement('a');
    link.href = 'data:application/pdf;base64,'; // In real app, this would be the actual PDF data
    link.download = t('freeTrial.sampleReport');
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
          <Shield className="h-8 w-8" />
          <span className="text-xl font-bold">ComplianceAI</span>
        </Link>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('freeTrial.title')}
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-4">
            {t('freeTrial.subtitle')}
          </p>
          <p className="text-white/70 max-w-3xl mx-auto">
            Upload company data, operational logs, or regulatory documents to see how our AI automates 
            compliance reporting for GDPR, CSRD, and ESG requirements.
          </p>
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
                disabled={isProcessing}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadedFile ? uploadedFile.name : t('common.upload')}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {t('freeTrial.supportedFormats')}
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
                disabled={!uploadedFile || isProcessing || reportReady}
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
              <Button
                onClick={downloadReport}
                disabled={!reportReady}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {t('common.download')} PDF
              </Button>
              {reportReady && (
                <div className="mt-4 text-center">
                  <p className="text-xs text-muted-foreground mb-2">
                    Report includes:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Compliance score</li>
                    <li>• Risk assessment</li>
                    <li>• Recommendations</li>
                    <li>• Action items</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <h3 className="text-2xl font-bold text-white mb-4">
            Want the full ComplianceAI experience?
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-primary hover:opacity-90">
              <Link to="/signup">{t('common.getStarted')}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-white border-white/20 hover:bg-white/10">
              <Link to="/demo">{t('common.bookDemo')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}