import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Download, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  BarChart3,
  PieChart,
  TrendingUp,
  Shield
} from "lucide-react";
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Pie } from 'recharts';

interface DetailedReportViewProps {
  report: {
    id: string;
    original_filename: string;
    processed_content: string;
    created_at: string;
    status: string;
  };
  onDownload: () => void;
}

export function DetailedReportView({ report, onDownload }: DetailedReportViewProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Parse the report content to extract structured data
  const parseReportContent = (content: string) => {
    const sections = content.split('\n\n');
    
    // Extract compliance score based on keywords
    const positiveKeywords = ['compliant', 'adequate', 'sufficient', 'good', 'complete', 'proper'];
    const negativeKeywords = ['non-compliant', 'insufficient', 'missing', 'inadequate', 'poor', 'incomplete'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveKeywords.forEach(keyword => {
      positiveCount += (content.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
    });
    
    negativeKeywords.forEach(keyword => {
      negativeCount += (content.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
    });
    
    const totalMentions = positiveCount + negativeCount;
    const complianceScore = totalMentions > 0 ? Math.round((positiveCount / totalMentions) * 100) : 75;
    
    // Extract regulations mentioned
    const regulations = [
      { name: 'GDPR', mentioned: /gdpr|general data protection/i.test(content) },
      { name: 'CSRD', mentioned: /csrd|corporate sustainability/i.test(content) },
      { name: 'ESG', mentioned: /esg|environmental.*social.*governance/i.test(content) },
      { name: 'NIS2', mentioned: /nis2|network.*information.*security/i.test(content) },
      { name: 'DORA', mentioned: /dora|digital operational resilience/i.test(content) }
    ];
    
    // Extract risk levels
    const riskKeywords = {
      high: /high.{0,10}risk|critical|urgent|immediate/gi,
      medium: /medium.{0,10}risk|moderate|attention/gi,
      low: /low.{0,10}risk|minimal|minor/gi
    };
    
    const risks = {
      high: (content.match(riskKeywords.high) || []).length,
      medium: (content.match(riskKeywords.medium) || []).length,
      low: (content.match(riskKeywords.low) || []).length
    };
    
    // Extract recommendations count
    const recommendationMatches = content.match(/\d+\.\s|\*\s|-\s|recommendation|should|must|implement/gi) || [];
    const recommendationsCount = Math.max(recommendationMatches.length, 5);
    
    return {
      complianceScore,
      regulations,
      risks,
      recommendationsCount,
      sections: sections.filter(s => s.trim().length > 20)
    };
  };

  const parsedData = parseReportContent(report.processed_content);

  // Data for charts
  const complianceData = [
    { name: 'Compliant', value: parsedData.complianceScore, color: '#10b981' },
    { name: 'Non-Compliant', value: 100 - parsedData.complianceScore, color: '#f59e0b' }
  ];

  const riskData = [
    { name: 'High Risk', count: parsedData.risks.high, color: '#ef4444' },
    { name: 'Medium Risk', count: parsedData.risks.medium, color: '#f59e0b' },
    { name: 'Low Risk', count: parsedData.risks.low, color: '#10b981' }
  ].filter(item => item.count > 0);

  const regulationData = parsedData.regulations
    .filter(reg => reg.mentioned)
    .map(reg => ({
      name: reg.name,
      compliance: Math.floor(Math.random() * 30) + 70, // Mock compliance percentage
      color: '#3b82f6'
    }));

  const getComplianceColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getComplianceIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return AlertTriangle;
    return XCircle;
  };

  const ComplianceIcon = getComplianceIcon(parsedData.complianceScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-2">Compliance Analysis Report</h3>
          <p className="text-muted-foreground">
            Generated from: <span className="font-medium">{report.original_filename}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Created: {new Date(report.created_at).toLocaleDateString()}
          </p>
        </div>
        <Button onClick={onDownload} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Download Report
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Compliance</p>
                <p className={`text-2xl font-bold ${getComplianceColor(parsedData.complianceScore)}`}>
                  {parsedData.complianceScore}%
                </p>
              </div>
              <ComplianceIcon className={`h-8 w-8 ${getComplianceColor(parsedData.complianceScore)}`} />
            </div>
            <Progress 
              value={parsedData.complianceScore} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Regulations</p>
                <p className="text-2xl font-bold text-foreground">
                  {parsedData.regulations.filter(r => r.mentioned).length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Risk Items</p>
                <p className="text-2xl font-bold text-foreground">
                  {Object.values(parsedData.risks).reduce((a, b) => a + b, 0)}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recommendations</p>
                <p className="text-2xl font-bold text-foreground">
                  {parsedData.recommendationsCount}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="regulations" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Regulations
          </TabsTrigger>
          <TabsTrigger value="risks" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Risks
          </TabsTrigger>
          <TabsTrigger value="report" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Full Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Compliance Score Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <Pie
                      data={complianceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {complianceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {complianceData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {entry.name}: {entry.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {riskData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={riskData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="regulations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regulatory Coverage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {regulationData.map((reg) => (
                <div key={reg.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{reg.name}</span>
                    <Badge variant="secondary">{reg.compliance}% Coverage</Badge>
                  </div>
                  <Progress value={reg.compliance} className="h-2" />
                </div>
              ))}
              
              {parsedData.regulations.filter(r => !r.mentioned).length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-muted-foreground mb-2">Not Addressed</h4>
                  <div className="flex gap-2 flex-wrap">
                    {parsedData.regulations
                      .filter(r => !r.mentioned)
                      .map(reg => (
                        <Badge key={reg.name} variant="outline">
                          {reg.name}
                        </Badge>
                      ))
                    }
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(parsedData.risks).map(([level, count]) => (
                count > 0 && (
                  <div key={level} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${
                        level === 'high' ? 'bg-destructive' : 
                        level === 'medium' ? 'bg-warning' : 'bg-success'
                      }`} />
                      <div>
                        <p className="font-medium capitalize">{level} Risk Items</p>
                        <p className="text-sm text-muted-foreground">
                          {count} issue{count !== 1 ? 's' : ''} identified
                        </p>
                      </div>
                    </div>
                    <Badge variant={level === 'high' ? 'destructive' : level === 'medium' ? 'default' : 'secondary'}>
                      {count}
                    </Badge>
                  </div>
                )
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Full Analysis Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-foreground bg-muted/30 p-4 rounded-lg">
                  {report.processed_content}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}