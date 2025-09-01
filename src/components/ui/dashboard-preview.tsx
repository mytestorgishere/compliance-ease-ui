import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, AlertCircle, CheckCircle, Clock } from "lucide-react";

export function DashboardPreview() {
  return (
    <section id="dashboard" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Compliance Dashboard
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Monitor your compliance status in real-time with intuitive dashboards 
            and automated reporting.
          </p>
        </div>

        <div className="bg-gradient-card rounded-2xl p-8 shadow-strong border">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Compliance Score */}
            <Card className="p-6 bg-background border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Compliance Score</h3>
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">94%</div>
              <Progress value={94} className="mb-2" />
              <p className="text-sm text-muted-foreground">+5% from last month</p>
            </Card>

            {/* Active Issues */}
            <Card className="p-6 bg-background border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Active Issues</h3>
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">3</div>
              <div className="flex items-center space-x-2">
                <Badge variant="destructive" className="text-xs">2 High</Badge>
                <Badge variant="secondary" className="text-xs">1 Medium</Badge>
              </div>
            </Card>

            {/* Reports Due */}
            <Card className="p-6 bg-background border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Reports Due</h3>
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">7</div>
              <p className="text-sm text-muted-foreground">Next due in 5 days</p>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="p-6 bg-background border-border">
            <h3 className="font-semibold text-foreground mb-4">Recent Compliance Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">GDPR Data Processing Assessment completed</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
                <Badge variant="secondary">Automated</Badge>
              </div>
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-warning" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">ESG Report requires manual review</p>
                  <p className="text-xs text-muted-foreground">4 hours ago</p>
                </div>
                <Badge variant="outline">Action Required</Badge>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">CSRD Sustainability metrics updated</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
                <Badge variant="secondary">Automated</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}