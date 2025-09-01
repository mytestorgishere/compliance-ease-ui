import { Card } from "@/components/ui/card";
import { Shield, FileText, BarChart3, Zap, CheckCircle, Globe } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "GDPR Compliance",
    description: "Automated data protection impact assessments, consent management, and privacy reporting.",
    color: "text-primary"
  },
  {
    icon: FileText,
    title: "CSRD Reporting",
    description: "Streamlined Corporate Sustainability Reporting Directive compliance with automated data collection.",
    color: "text-success"
  },
  {
    icon: BarChart3,
    title: "ESG Metrics",
    description: "Comprehensive Environmental, Social, and Governance reporting with real-time dashboards.",
    color: "text-warning"
  },
  {
    icon: Zap,
    title: "AI-Powered Automation",
    description: "Machine learning algorithms that adapt to regulatory changes and optimize reporting processes.",
    color: "text-primary"
  },
  {
    icon: CheckCircle,
    title: "Risk Assessment",
    description: "Proactive compliance risk identification with automated alerts and remediation suggestions.",
    color: "text-success"
  },
  {
    icon: Globe,
    title: "Multi-jurisdiction Support",
    description: "Navigate complex EU regulations across different member states with localized compliance rules.",
    color: "text-warning"
  }
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need for EU Compliance
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our comprehensive platform covers all major EU regulations with intelligent automation 
            and expert-designed workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="p-6 bg-gradient-card border-border shadow-soft hover:shadow-medium transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg bg-background border ${feature.color}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}