import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/ui/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  Pause, 
  Settings, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  Zap,
  Bell,
  Webhook,
  Calendar,
  BarChart3,
  Activity,
  Upload,
  Shield
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  rule_type: string;
  schedule_cron?: string;
  is_active: boolean;
  config: any;
  created_at: string;
  updated_at: string;
}

interface AutomationRun {
  id: string;
  automation_rule_id: string;
  status: string;
  started_at: string;
  completed_at?: string;
  results?: any;
  error_message?: string;
  documents_processed?: number;
}

interface ComplianceAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
}

export default function AutomationDashboard() {
  const { user } = useAuth();
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [recentRuns, setRecentRuns] = useState<AutomationRun[]>([]);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (user) {
      fetchAutomationData();
    }
  }, [user]);

  const fetchAutomationData = async () => {
    try {
      setIsLoading(true);

      // Fetch automation rules
      const { data: rules, error: rulesError } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (rulesError) throw rulesError;

      // Fetch recent runs
      const { data: runs, error: runsError } = await supabase
        .from('automation_runs')
        .select('*')
        .eq('user_id', user?.id)
        .order('started_at', { ascending: false })
        .limit(10);

      if (runsError) throw runsError;

      // Fetch alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('compliance_alerts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (alertsError) throw alertsError;

      setAutomationRules(rules || []);
      setRecentRuns(runs || []);
      setAlerts(alertsData || []);

    } catch (error: any) {
      console.error('Error fetching automation data:', error);
      toast({
        title: "Error",
        description: "Failed to load automation data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runAutomationRule = async (ruleId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('compliance-automation', {
        body: {
          action: 'run_automation_rule',
          data: { ruleId }
        }
      });

      if (error) throw error;

      toast({
        title: "Automation Started",
        description: "The automation rule is now running",
      });

      // Refresh data
      fetchAutomationData();

    } catch (error: any) {
      console.error('Error running automation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to run automation",
        variant: "destructive",
      });
    }
  };

  const toggleAutomationRule = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('automation_rules')
        .update({ is_active: !isActive })
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: isActive ? "Automation Paused" : "Automation Activated",
        description: `The automation rule has been ${isActive ? 'paused' : 'activated'}`,
      });

      // Refresh rules
      fetchAutomationData();

    } catch (error: any) {
      console.error('Error toggling automation:', error);
      toast({
        title: "Error",
        description: "Failed to update automation rule",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'running':
        return <Clock className="h-4 w-4 text-warning animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRuleTypeIcon = (ruleType: string) => {
    switch (ruleType) {
      case 'scheduled_scan':
        return <Calendar className="h-4 w-4" />;
      case 'bulk_process':
        return <Upload className="h-4 w-4" />;
      case 'threshold_alert':
        return <Bell className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-destructive';
      case 'high':
        return 'bg-destructive';
      case 'medium':
        return 'bg-warning';
      default:
        return 'bg-muted';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  const activeRules = automationRules.filter(rule => rule.is_active).length;
  const totalRuns = recentRuns.length;
  const successfulRuns = recentRuns.filter(run => run.status === 'completed').length;
  const unreadAlerts = alerts.filter(alert => !alert.is_read).length;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <Zap className="h-8 w-8 text-primary" />
                Compliance Automation
              </h1>
              <p className="text-lg text-muted-foreground">
                Automate your compliance processes and stay ahead of regulatory requirements
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Automation
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Rules</p>
                    <div className="text-2xl font-bold">{activeRules}</div>
                  </div>
                  <Activity className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Runs</p>
                    <div className="text-2xl font-bold">{totalRuns}</div>
                  </div>
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                    <div className="text-2xl font-bold">
                      {totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0}%
                    </div>
                  </div>
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Unread Alerts</p>
                    <div className="text-2xl font-bold">{unreadAlerts}</div>
                  </div>
                  <Bell className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="rules" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Automation Rules
              </TabsTrigger>
              <TabsTrigger value="runs" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Recent Runs
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Alerts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest automation runs and compliance activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentRuns.slice(0, 5).map((run) => {
                      const rule = automationRules.find(r => r.id === run.automation_rule_id);
                      return (
                        <div key={run.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(run.status)}
                            <div>
                              <p className="font-medium">{rule?.name || 'Unknown Rule'}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(run.started_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">{run.status}</Badge>
                            {run.documents_processed && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {run.documents_processed} docs processed
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rules" className="space-y-6">
              <div className="grid gap-6">
                {automationRules.map((rule) => (
                  <Card key={rule.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getRuleTypeIcon(rule.rule_type)}
                          <div>
                            <CardTitle className="text-lg">{rule.name}</CardTitle>
                            <CardDescription>
                              {rule.description || `${rule.rule_type} automation rule`}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={rule.is_active ? "default" : "secondary"}>
                            {rule.is_active ? "Active" : "Paused"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleAutomationRule(rule.id, rule.is_active)}
                          >
                            {rule.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => runAutomationRule(rule.id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Type</p>
                          <p className="capitalize">{rule.rule_type.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Schedule</p>
                          <p>{rule.schedule_cron || 'Manual trigger'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Created</p>
                          <p>{new Date(rule.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {automationRules.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Automation Rules</h3>
                      <p className="text-muted-foreground mb-6">
                        Create your first automation rule to start automating compliance processes
                      </p>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Rule
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="runs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Automation Run History</CardTitle>
                  <CardDescription>
                    Complete history of all automation executions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentRuns.map((run) => {
                      const rule = automationRules.find(r => r.id === run.automation_rule_id);
                      return (
                        <div key={run.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(run.status)}
                            <div>
                              <p className="font-medium">{rule?.name || 'Unknown Rule'}</p>
                              <p className="text-sm text-muted-foreground">
                                Started: {new Date(run.started_at).toLocaleString()}
                              </p>
                              {run.completed_at && (
                                <p className="text-sm text-muted-foreground">
                                  Completed: {new Date(run.completed_at).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">{run.status}</Badge>
                            {run.documents_processed && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {run.documents_processed} documents processed
                              </p>
                            )}
                            {run.error_message && (
                              <p className="text-sm text-destructive mt-1">
                                Error: {run.error_message}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Alerts</CardTitle>
                  <CardDescription>
                    Stay informed about compliance issues and threshold violations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <div 
                        key={alert.id} 
                        className={`p-4 border rounded-lg ${!alert.is_read ? 'border-primary bg-primary/5' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(alert.severity)}`} />
                            <div>
                              <h4 className="font-medium">{alert.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(alert.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {alert.severity}
                            </Badge>
                            {!alert.is_read && (
                              <Badge variant="default" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {alerts.length === 0 && (
                      <div className="text-center py-8">
                        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Alerts</h3>
                        <p className="text-muted-foreground">
                          All systems are running smoothly. You'll see compliance alerts here when they occur.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}