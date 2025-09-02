import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Shield, FileText, BarChart3, Zap, CheckCircle, Globe } from "lucide-react";


export function FeaturesSection() {
  const { t } = useTranslation();
  
  const features = [
    {
      icon: Shield,
      title: t('features.gdpr.title'),
      description: t('features.gdpr.description'),
      color: "text-primary"
    },
    {
      icon: FileText,
      title: t('features.csrd.title'),
      description: t('features.csrd.description'),
      color: "text-success"
    },
    {
      icon: BarChart3,
      title: t('features.esg.title'),
      description: t('features.esg.description'),
      color: "text-warning"
    },
    {
      icon: Zap,
      title: t('features.ai.title'),
      description: t('features.ai.description'),
      color: "text-primary"
    },
    {
      icon: CheckCircle,
      title: t('features.risk.title'),
      description: t('features.risk.description'),
      color: "text-success"
    },
    {
      icon: Globe,
      title: t('features.multi.title'),
      description: t('features.multi.description'),
      color: "text-warning"
    }
  ];
  
  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('features.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('features.subtitle')}
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