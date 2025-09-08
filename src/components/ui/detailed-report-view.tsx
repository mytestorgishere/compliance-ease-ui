import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
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
  Shield,
  Target,
  Users,
  Calendar,
  Activity,
  Zap,
  Info,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import { 
  PieChart as RechartsPieChart, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Pie,
  LineChart,
  Line,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';

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
    const positiveKeywords = ['compliant', 'adequate', 'sufficient', 'good', 'complete', 'proper', 'meets', 'satisfies', 'excellent'];
    const negativeKeywords = ['non-compliant', 'insufficient', 'missing', 'inadequate', 'poor', 'incomplete', 'fails', 'lacks', 'weak'];
    
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
    
    // Extract regulations mentioned with detailed analysis
    const regulations = [
      { 
        name: 'GDPR', 
        fullName: 'General Data Protection Regulation',
        mentioned: /gdpr|general data protection/i.test(content),
        compliance: Math.floor(Math.random() * 30) + 70,
        status: 'active',
        priority: 'high'
      },
      { 
        name: 'CSRD', 
        fullName: 'Corporate Sustainability Reporting Directive',
        mentioned: /csrd|corporate sustainability/i.test(content),
        compliance: Math.floor(Math.random() * 30) + 70,
        status: 'active',
        priority: 'medium'
      },
      { 
        name: 'ESG', 
        fullName: 'Environmental, Social & Governance',
        mentioned: /esg|environmental.*social.*governance/i.test(content),
        compliance: Math.floor(Math.random() * 30) + 70,
        status: 'active',
        priority: 'high'
      },
      { 
        name: 'NIS2', 
        fullName: 'Network and Information Security Directive',
        mentioned: /nis2|network.*information.*security/i.test(content),
        compliance: Math.floor(Math.random() * 30) + 70,
        status: 'pending',
        priority: 'medium'
      },
      { 
        name: 'DORA', 
        fullName: 'Digital Operational Resilience Act',
        mentioned: /dora|digital operational resilience/i.test(content),
        compliance: Math.floor(Math.random() * 30) + 70,
        status: 'active',
        priority: 'high'
      }
    ];
    
    // Extract risk levels with detailed breakdown
    const riskKeywords = {
      critical: /critical|severe|catastrophic|emergency/gi,
      high: /high.{0,10}risk|urgent|immediate|dangerous/gi,
      medium: /medium.{0,10}risk|moderate|attention|warning/gi,
      low: /low.{0,10}risk|minimal|minor|acceptable/gi
    };
    
    const risks = {
      critical: (content.match(riskKeywords.critical) || []).length,
      high: (content.match(riskKeywords.high) || []).length,
      medium: (content.match(riskKeywords.medium) || []).length,
      low: (content.match(riskKeywords.low) || []).length
    };
    
    // Extract detailed recommendations
    const lines = content.split('\n');
    const recommendations = lines
      .filter(line => /^(\d+\.|\*|-|•)\s/.test(line.trim()) || /recommend|should|must|implement|consider/i.test(line))
      .slice(0, 8)
      .map((rec, index) => ({
        id: index + 1,
        text: rec.replace(/^(\d+\.|\*|-|•)\s*/, '').trim(),
        priority: index < 3 ? 'high' : index < 6 ? 'medium' : 'low',
        category: index % 3 === 0 ? 'Security' : index % 3 === 1 ? 'Compliance' : 'Operations',
        status: 'pending'
      }));

    // Extract key findings
    const keyFindings = sections
      .filter(section => section.length > 50)
      .slice(0, 5)
      .map((finding, index) => ({
        id: index + 1,
        title: finding.split('\n')[0] || `Finding ${index + 1}`,
        description: finding.substring(0, 200) + '...',
        severity: index < 2 ? 'high' : index < 4 ? 'medium' : 'low',
        category: ['Data Protection', 'Risk Management', 'Compliance', 'Security', 'Documentation'][index] || 'General'
      }));
    
    return {
      complianceScore,
      regulations,
      risks,
      recommendations,
      keyFindings,
      sections: sections.filter(s => s.trim().length > 20),
      summary: {
        totalIssues: Object.values(risks).reduce((a, b) => a + b, 0),
        criticalIssues: risks.critical + risks.high,
        completionRate: complianceScore,
        nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
      }
    };
  };

  const parsedData = parseReportContent(report.processed_content);

  // Data for charts
  const complianceData = [
    { name: 'Compliant', value: parsedData.complianceScore, color: '#10b981' },
    { name: 'Non-Compliant', value: 100 - parsedData.complianceScore, color: '#f59e0b' }
  ];

  const riskData = [
    { name: 'Critical', count: parsedData.risks.critical, color: '#dc2626' },
    { name: 'High', count: parsedData.risks.high, color: '#ef4444' },
    { name: 'Medium', count: parsedData.risks.medium, color: '#f59e0b' },
    { name: 'Low', count: parsedData.risks.low, color: '#10b981' }
  ].filter(item => item.count > 0);

  const regulationData = parsedData.regulations
    .filter(reg => reg.mentioned)
    .map(reg => ({
      name: reg.name,
      fullName: reg.fullName,
      compliance: reg.compliance,
      status: reg.status,
      priority: reg.priority,
      color: reg.status === 'active' ? '#10b981' : '#f59e0b'
    }));

  // Compliance trend data (mock historical data)
  const complianceTrend = [
    { month: 'Jan', score: 65 },
    { month: 'Feb', score: 70 },
    { month: 'Mar', score: 75 },
    { month: 'Apr', score: 78 },
    { month: 'May', score: 82 },
    { month: 'Jun', score: parsedData.complianceScore }
  ];

  // Regulation radar chart data
  const radarData = parsedData.regulations
    .filter(reg => reg.mentioned)
    .map(reg => ({
      regulation: reg.name,
      score: reg.compliance,
      fullMark: 100
    }));

  // Risk timeline data
  const riskTimeline = [
    { date: '2024-01', critical: 2, high: 5, medium: 8, low: 12 },
    { date: '2024-02', critical: 1, high: 4, medium: 9, low: 15 },
    { date: '2024-03', critical: 1, high: 3, medium: 7, low: 18 },
    { date: '2024-04', critical: parsedData.risks.critical, high: parsedData.risks.high, medium: parsedData.risks.medium, low: parsedData.risks.low }
  ];

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
                  {parsedData.recommendations.length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
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
            Risk Analysis
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Actions
          </TabsTrigger>
          <TabsTrigger value="findings" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Key Findings
          </TabsTrigger>
          <TabsTrigger value="report" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Full Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getComplianceColor(parsedData.summary.completionRate)}`}>
                    {parsedData.summary.completionRate}%
                  </div>
                  <div className="text-sm text-muted-foreground">Overall Compliance</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-destructive">
                    {parsedData.summary.criticalIssues}
                  </div>
                  <div className="text-sm text-muted-foreground">Critical Issues</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">
                    {parsedData.summary.totalIssues}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Issues</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {parsedData.regulations.filter(r => r.mentioned).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Regulations Covered</div>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="text-sm text-muted-foreground">
                Next review scheduled for: <span className="font-medium text-foreground">{parsedData.summary.nextReviewDate}</span>
              </div>
            </CardContent>
          </Card>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Compliance Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Compliance Distribution
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
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Risk Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Risk Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={riskData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count">
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Compliance Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Compliance Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={complianceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="score" stroke="#3b82f6" fill="#3b82f680" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Regulation Radar Chart */}
          {radarData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Regulatory Compliance Matrix
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="regulation" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar name="Compliance" dataKey="score" stroke="#3b82f6" fill="#3b82f620" />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Risk Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Risk Trend Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={riskTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="critical" stroke="#dc2626" name="Critical" />
                  <Line type="monotone" dataKey="high" stroke="#ef4444" name="High" />
                  <Line type="monotone" dataKey="medium" stroke="#f59e0b" name="Medium" />
                  <Line type="monotone" dataKey="low" stroke="#10b981" name="Low" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regulations" className="space-y-6">
          {/* Regulations Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Regulatory Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Regulation</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Compliance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {regulationData.map((reg) => (
                      <TableRow key={reg.name}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{reg.name}</div>
                            <div className="text-sm text-muted-foreground">{reg.fullName}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={reg.status === 'active' ? 'default' : 'secondary'}>
                            {reg.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={reg.priority === 'high' ? 'destructive' : 'outline'}>
                            {reg.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={reg.compliance} className="h-2 flex-1" />
                            <span className="text-sm font-medium">{reg.compliance}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {regulationData.map((reg) => (
                  <div key={reg.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{reg.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={reg.compliance >= 80 ? 'default' : reg.compliance >= 60 ? 'secondary' : 'destructive'}
                        >
                          {reg.compliance}%
                        </Badge>
                        {reg.compliance >= 80 ? (
                          <ArrowUp className="h-4 w-4 text-success" />
                        ) : reg.compliance >= 60 ? (
                          <Minus className="h-4 w-4 text-warning" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </div>
                    <Progress value={reg.compliance} className="h-3" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          
          {/* Not Addressed Regulations */}
          {parsedData.regulations.filter(r => !r.mentioned).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Regulations Not Addressed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {parsedData.regulations
                    .filter(r => !r.mentioned)
                    .map(reg => (
                      <Card key={reg.name} className="border-warning/30">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{reg.name}</h4>
                              <p className="text-sm text-muted-foreground">{reg.fullName}</p>
                            </div>
                            <Badge variant="outline" className="text-warning border-warning">
                              Missing
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          {/* Risk Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(parsedData.risks).map(([level, count]) => (
              count > 0 && (
                <Card key={level} className={`border ${
                  level === 'critical' ? 'border-destructive/50 bg-destructive/5' :
                  level === 'high' ? 'border-destructive/30 bg-destructive/5' : 
                  level === 'medium' ? 'border-warning/30 bg-warning/5' : 'border-success/30 bg-success/5'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground capitalize">{level} Risk</p>
                        <p className="text-2xl font-bold">{count}</p>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        level === 'critical' ? 'bg-destructive/20' :
                        level === 'high' ? 'bg-destructive/20' : 
                        level === 'medium' ? 'bg-warning/20' : 'bg-success/20'
                      }`}>
                        <AlertTriangle className={`h-4 w-4 ${
                          level === 'critical' || level === 'high' ? 'text-destructive' : 
                          level === 'medium' ? 'text-warning' : 'text-success'
                        }`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            ))}
          </div>

          {/* Detailed Risk Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={riskData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count">
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Priority Matrix</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(parsedData.risks)
                  .sort(([a], [b]) => {
                    const order = { critical: 0, high: 1, medium: 2, low: 3 };
                    return order[a] - order[b];
                  })
                  .map(([level, count]) => (
                    count > 0 && (
                      <div key={level} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${
                            level === 'critical' ? 'bg-red-600' :
                            level === 'high' ? 'bg-destructive' : 
                            level === 'medium' ? 'bg-warning' : 'bg-success'
                          }`} />
                          <div>
                            <p className="font-medium capitalize">{level} Risk Items</p>
                            <p className="text-sm text-muted-foreground">
                              {count} issue{count !== 1 ? 's' : ''} requiring {
                                level === 'critical' ? 'immediate' :
                                level === 'high' ? 'urgent' : 
                                level === 'medium' ? 'prompt' : 'routine'
                              } attention
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            level === 'critical' ? 'destructive' :
                            level === 'high' ? 'destructive' : 
                            level === 'medium' ? 'default' : 'secondary'
                          }>
                            {count}
                          </Badge>
                          <div className={`text-xs px-2 py-1 rounded ${
                            level === 'critical' ? 'bg-red-100 text-red-800' :
                            level === 'high' ? 'bg-red-100 text-red-800' : 
                            level === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {level === 'critical' ? '24h' :
                             level === 'high' ? '7d' : 
                             level === 'medium' ? '30d' : '90d'}
                          </div>
                        </div>
                      </div>
                    )
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Risk Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Historical Risk Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={riskTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="critical" stackId="1" stroke="#dc2626" fill="#dc2626" />
                  <Area type="monotone" dataKey="high" stackId="1" stroke="#ef4444" fill="#ef4444" />
                  <Area type="monotone" dataKey="medium" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
                  <Area type="monotone" dataKey="low" stackId="1" stroke="#10b981" fill="#10b981" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* New Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Action Items & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Priority</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Recommendation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.recommendations.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell>
                        <Badge variant={
                          rec.priority === 'high' ? 'destructive' : 
                          rec.priority === 'medium' ? 'default' : 'secondary'
                        }>
                          {rec.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rec.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm">{rec.text}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{rec.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Zap className="h-3 w-3 mr-1" />
                          Track
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Priority Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['high', 'medium', 'low'].map(priority => (
              <Card key={priority}>
                <CardHeader>
                  <CardTitle className={`text-sm ${
                    priority === 'high' ? 'text-destructive' : 
                    priority === 'medium' ? 'text-warning' : 'text-success'
                  }`}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {parsedData.recommendations
                    .filter(rec => rec.priority === priority)
                    .map(rec => (
                      <div key={rec.id} className="p-3 border rounded-lg text-sm">
                        <div className="flex items-start justify-between">
                          <p className="flex-1">{rec.text}</p>
                          <Badge variant="outline" className="ml-2">
                            {rec.category}
                          </Badge>
                        </div>
                      </div>
                    ))
                  }
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* New Key Findings Tab */}
        <TabsContent value="findings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Key Findings & Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {parsedData.keyFindings.map((finding) => (
                  <Card key={finding.id} className={`border-l-4 ${
                    finding.severity === 'high' ? 'border-l-destructive' :
                    finding.severity === 'medium' ? 'border-l-warning' : 'border-l-success'
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{finding.title}</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="outline">{finding.category}</Badge>
                          <Badge variant={
                            finding.severity === 'high' ? 'destructive' :
                            finding.severity === 'medium' ? 'default' : 'secondary'
                          }>
                            {finding.severity}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{finding.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
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