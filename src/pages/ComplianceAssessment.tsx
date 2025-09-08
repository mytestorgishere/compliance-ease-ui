import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ComplianceForm } from "@/components/ui/compliance-form";
import { Navigation } from "@/components/ui/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validateFileSize } from "@/utils/fileValidation";

interface ComplianceFormData {
  country: string;
  businessType: string;
  companySize: string;
  dataProcessingType: string;
  industry: string;
  existingCompliance: string;
  specificConcerns: string;
}

export default function ComplianceAssessment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [complianceData, setComplianceData] = useState<ComplianceFormData | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = await validateFileSize(file, user?.email);
      if (!validation.isValid) {
        toast({
          title: "File validation failed",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleComplianceFormSubmit = (data: ComplianceFormData) => {
    setComplianceData(data);
    toast({
      title: "Business details saved",
      description: "Now upload a document to generate your compliance report",
    });
  };

  const handleGenerateReport = async () => {
    if (!selectedFile || !complianceData || !user) {
      toast({
        title: "Missing information",
        description: "Please complete the form and select a file",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const fileContent = await selectedFile.text();
      
      const { data, error } = await supabase.functions.invoke('process-document', {
        body: {
          document: fileContent,
          filename: selectedFile.name,
          reportType: 'gdpr-compliance',
          complianceData: complianceData // Send the form data to the backend
        }
      });

      if (error) throw error;

      toast({
        title: "Report generated successfully",
        description: "Your GDPR compliance report is ready",
      });

      // Navigate to the detailed report view
      navigate(`/report/${data.reportId}`);
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast({
        title: "Error generating report",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              GDPR Compliance Assessment
            </h1>
            <p className="text-lg text-muted-foreground">
              Get country-specific GDPR compliance analysis with actionable recommendations
            </p>
          </div>

          <Tabs defaultValue="assessment" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="assessment" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Business Assessment
              </TabsTrigger>
              <TabsTrigger value="document" className="flex items-center gap-2" disabled={!complianceData}>
                <Upload className="h-4 w-4" />
                Document Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assessment">
              <ComplianceForm 
                onSubmit={handleComplianceFormSubmit}
                isLoading={isProcessing}
              />
              
              {complianceData && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-success" />
                      Assessment Complete
                    </CardTitle>
                    <CardDescription>
                      Your business details have been saved. Now upload a document to proceed.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="font-medium">Country:</Label>
                        <Badge variant="secondary" className="ml-2">
                          {complianceData.country}
                        </Badge>
                      </div>
                      <div>
                        <Label className="font-medium">Business Type:</Label>
                        <Badge variant="secondary" className="ml-2">
                          {complianceData.businessType}
                        </Badge>
                      </div>
                      <div>
                        <Label className="font-medium">Company Size:</Label>
                        <Badge variant="secondary" className="ml-2">
                          {complianceData.companySize}
                        </Badge>
                      </div>
                      <div>
                        <Label className="font-medium">Data Processing:</Label>
                        <Badge variant="secondary" className="ml-2">
                          {complianceData.dataProcessingType}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="document">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload Document for Analysis
                  </CardTitle>
                  <CardDescription>
                    Upload your privacy policy, data processing agreement, or any compliance document for analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="document">Select Document</Label>
                    <Input
                      id="document"
                      type="file"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                    <p className="text-sm text-muted-foreground">
                      Supported formats: TXT, PDF, DOC, DOCX (max 10MB)
                    </p>
                  </div>

                  {selectedFile && (
                    <Card className="bg-muted/50">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-primary" />
                          <div>
                            <p className="font-medium">{selectedFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Button 
                    onClick={handleGenerateReport}
                    disabled={!selectedFile || !complianceData || isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Analyzing Document...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Generate GDPR Compliance Report
                      </>
                    )}
                  </Button>

                  {(!complianceData || !selectedFile) && (
                    <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                      <div className="flex items-center gap-2 text-warning mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">Requirements</span>
                      </div>
                      <ul className="text-sm space-y-1">
                        {!complianceData && (
                          <li>• Complete the business assessment form</li>
                        )}
                        {!selectedFile && (
                          <li>• Upload a document for analysis</li>
                        )}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}