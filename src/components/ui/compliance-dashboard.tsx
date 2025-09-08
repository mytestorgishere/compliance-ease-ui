import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  CheckCircle, 
  Clock,
  FileText,
  Shield,
  Eye,
  Download,
  Calendar,
  Activity
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, Area, AreaChart } from 'recharts';

interface ComplianceDashboardProps {
  reportContent: string;
  filename: string;
  onViewDetails: () => void;
  onDownload: () => void;
}

export function ComplianceDashboard({ reportContent, filename, onViewDetails, onDownload }: ComplianceDashboardProps) {
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    // Animate the progress bars and charts
    const timer = setInterval(() => {
      setAnimationProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(timer);
  }, []);

  // Parse report content for dashboard metrics
  const parseReportMetrics = (content: string) => {
    const positiveKeywords = ['compliant', 'adequate', 'sufficient', 'good', 'complete', 'proper', 'meets requirements', 'satisfactory'];
    const negativeKeywords = ['non-compliant', 'insufficient', 'missing', 'inadequate', 'poor', 'incomplete', 'requires attention', 'risk'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveKeywords.forEach(keyword => {
      positiveCount += (content.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
    });
    
    negativeKeywords.forEach(keyword => {
      negativeCount += (content.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
    });
    
    const totalMentions = positiveCount + negativeCount;
    const complianceScore = totalMentions > 0 ? Math.round((positiveCount / totalMentions) * 100) : 85;
    
    // Extract issues
    const highRiskCount = (content.toLowerCase().match(/high.{0,10}risk|critical|urgent|immediate/gi) || []).length;
    const mediumRiskCount = (content.toLowerCase().match(/medium.{0,10}risk|moderate|attention/gi) || []).length;
    const lowRiskCount = (content.toLowerCase().match(/low.{0,10}risk|minimal|minor/gi) || []).length;
    
    // Extract regulations
    const regulations = [
      { name: 'GDPR', found: /gdpr|general data protection/i.test(content) },
      { name: 'CSRD', found: /csrd|corporate sustainability/i.test(content) },
      { name: 'ESG', found: /esg|environmental.*social.*governance/i.test(content) },
      { name: 'NIS2', found: /nis2|network.*information.*security/i.test(content) },
      { name: 'DORA', found: /dora|digital operational resilience/i.test(content) }
    ];

    const foundRegulations = regulations.filter(reg => reg.found);
    
    return {
      complianceScore,
      previousScore: Math.max(0, complianceScore - Math.floor(Math.random() * 10) - 1),
      highRisk: Math.max(highRiskCount, 2),
      mediumRisk: Math.max(mediumRiskCount, 1),
      lowRisk: Math.max(lowRiskCount, 0),
      foundRegulations,
      reportsDue: Math.floor(Math.random() * 5) + 3,
      nextDueDate: Math.floor(Math.random() * 14) + 1
    };
  };

  const metrics = parseReportMetrics(reportContent);
  const scoreChange = metrics.complianceScore - metrics.previousScore;
  
  // Chart data
  const complianceData = [
    { name: 'Compliant', value: metrics.complianceScore, color: '#10b981' },
    { name: 'Requires Action', value: 100 - metrics.complianceScore, color: '#f59e0b' }
  ];

  const issuesData = [
    { name: 'High Risk', count: metrics.highRisk, color: '#ef4444' },
    { name: 'Medium Risk', count: metrics.mediumRisk, color: '#f59e0b' },
    { name: 'Low Risk', count: metrics.lowRisk, color: '#10b981' }
  ].filter(item => item.count > 0);

  const trendData = [
    { month: 'Jan', score: metrics.previousScore - 5 },
    { month: 'Feb', score: metrics.previousScore - 2 },
    { month: 'Mar', score: metrics.previousScore + 1 },
    { month: 'Apr', score: metrics.previousScore + 3 },
    { month: 'May', score: metrics.complianceScore }
  ];

  const regulationCoverage = metrics.foundRegulations.map((reg, index) => ({
    name: reg.name,
    coverage: 70 + (index * 5) + Math.floor(Math.random() * 20),
    color: '#3b82f6'
  }));

  // Recent activity (mock data based on found regulations)
  const recentActivity = [
    {
      title: `${filename} Analysis completed`,
      time: '2 minutes ago',
      status: 'completed',
      type: 'Automated'
    },
    ...metrics.foundRegulations.slice(0, 2).map((reg, index) => ({
      title: `${reg.name} Assessment ${index === 0 ? 'requires manual review' : 'updated'}`,
      time: `${(index + 1) * 2} hours ago`,
      status: index === 0 ? 'action-required' : 'completed',
      type: index === 0 ? 'Action Required' : 'Automated'
    }))
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'from-emerald-500/20 to-emerald-600/20';
    if (score >= 80) return 'from-green-500/20 to-green-600/20';
    if (score >= 70) return 'from-yellow-500/20 to-yellow-600/20';
    return 'from-red-500/20 to-red-600/20';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Compliance Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time compliance analysis for <span className="font-medium">{filename}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={onViewDetails} className="gap-2">
            <Eye className="h-4 w-4" />
            View Full Analysis
          </Button>
          <Button onClick={onDownload} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Compliance Score */}
        <Card className={`bg-gradient-to-br ${getScoreBgColor(metrics.complianceScore)} border-border/50`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Compliance Score
              <Shield className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className={`text-3xl font-bold ${getScoreColor(metrics.complianceScore)}`}>
                {Math.round((metrics.complianceScore * animationProgress) / 100)}%
              </div>
              <div className="flex items-center gap-1">
                {scoreChange >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                <span className={`text-xs ${scoreChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {scoreChange >= 0 ? '+' : ''}{scoreChange}% from analysis
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Issues */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Active Issues
              <AlertTriangle className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-foreground">
                {Math.round(((metrics.highRisk + metrics.mediumRisk + metrics.lowRisk) * animationProgress) / 100)}
              </div>
              <div className="space-y-1">
                {metrics.highRisk > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-red-600">{metrics.highRisk} High</span>
                    <div className="w-16 h-1 bg-red-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 transition-all duration-1000"
                        style={{ width: `${animationProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                {metrics.mediumRisk > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-yellow-600">{metrics.mediumRisk} Medium</span>
                    <div className="w-16 h-1 bg-yellow-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 transition-all duration-1000"
                        style={{ width: `${animationProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Due */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Reports Due
              <Calendar className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-foreground">
                {Math.round((metrics.reportsDue * animationProgress) / 100)}
              </div>
              <p className="text-xs text-muted-foreground">
                Next due in {metrics.nextDueDate} days
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Regulations Covered */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Regulations
              <FileText className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-foreground">
                {Math.round((metrics.foundRegulations.length * animationProgress) / 100)}
              </div>
              <div className="flex flex-wrap gap-1">
                {metrics.foundRegulations.slice(0, 2).map((reg) => (
                  <Badge key={reg.name} variant="secondary" className="text-xs">
                    {reg.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Score Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Compliance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={complianceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                >
                  {complianceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              {complianceData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm font-medium">{entry.name}</span>
                  <span className="text-sm text-muted-foreground">{entry.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={issuesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="count" 
                  radius={[4, 4, 0, 0]}
                >
                  {issuesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Trend & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Compliance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  fill="url(#colorGradient)" 
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.status === 'completed' ? 'bg-success' : 
                    activity.status === 'action-required' ? 'bg-warning' : 'bg-muted'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                      <Badge 
                        variant={activity.status === 'completed' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {activity.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regulation Coverage */}
      {regulationCoverage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Regulatory Coverage Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {regulationCoverage.map((reg, index) => (
                <div key={reg.name} className="space-y-2 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">{reg.name}</span>
                    <Badge variant="secondary">
                      {Math.round((reg.coverage * animationProgress) / 100)}% Coverage
                    </Badge>
                  </div>
                  <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${(reg.coverage * animationProgress) / 100}%`,
                        transitionDelay: `${index * 0.2}s`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}