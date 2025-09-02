import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, Zap, Building, Briefcase } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";


export function PricingSection() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isYearly, setIsYearly] = useState(false);
  
  const plans = [
    {
      name: "Starter",
      monthlyPrice: 199,
      yearlyPrice: 179, // 10% discount
      tier: "starter",
      description: "Perfect for small businesses starting their compliance journey",
      icon: Zap,
      features: [
        "Basic GDPR compliance monitoring",
        "Monthly compliance reports",
        "Email support",
        "Up to 100 data subjects",
        "Standard templates"
      ],
      popular: false
    },
    {
      name: "Professional", 
      monthlyPrice: 399,
      yearlyPrice: 359, // 10% discount
      tier: "professional",
      description: "Comprehensive compliance solution for growing businesses",
      icon: Building,
      features: [
        "Full GDPR, CSRD & ESG compliance",
        "Real-time monitoring & alerts",
        "Custom report generation",
        "Priority support",
        "Up to 10,000 data subjects",
        "Advanced analytics",
        "API access"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      monthlyPrice: 799,
      yearlyPrice: 719, // 10% discount
      tier: "enterprise",
      description: "Enterprise-grade compliance for large organizations",
      icon: Briefcase,
      features: [
        "Everything in Professional",
        "Multi-jurisdiction support",
        "Dedicated compliance manager",
        "Custom integrations",
        "Unlimited data subjects", 
        "White-label options",
        "24/7 phone support",
        "Compliance consulting"
      ],
      popular: false
    }
  ];

  const handleSubscribe = async (tier: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to a plan.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          tier: tier,
          yearly: isYearly
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Error",
        description: "Failed to start subscription process. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <section id="pricing" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Simple, transparent pricing for businesses of all sizes
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <Label htmlFor="billing-toggle" className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <Label htmlFor="billing-toggle" className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Yearly
            </Label>
            {isYearly && (
              <Badge variant="secondary" className="ml-2 bg-success/20 text-success">
                Save 10%
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            return (
              <Card 
                key={index} 
                className={`relative p-8 bg-gradient-card border-border shadow-soft hover:shadow-medium transition-all duration-300 ${
                  plan.popular ? 'ring-2 ring-primary' : ''
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary">
                    Most Popular
                  </Badge>
                )}

                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-3xl font-bold text-foreground">
                      €{isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      /{isYearly ? 'year' : 'month'}
                    </span>
                  </div>
                  {isYearly && (
                    <p className="text-xs text-success mt-1">
                      Save €{(plan.monthlyPrice * 12) - (plan.yearlyPrice * 12)}/year
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-success mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-gradient-primary hover:opacity-90' 
                      : 'bg-background hover:bg-muted border border-border'
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan.tier)}
                >
                  {user ? 'Subscribe Now' : 'Sign Up to Subscribe'}
                </Button>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            {t('pricing.customSolution')}
          </p>
          <Button variant="outline">
            {t('pricing.contactSales')}
          </Button>
        </div>
      </div>
    </section>
  );
}