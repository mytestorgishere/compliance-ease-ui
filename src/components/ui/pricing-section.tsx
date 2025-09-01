import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Building, Briefcase } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "€199",
    period: "per month",
    description: "Perfect for small businesses getting started with compliance",
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
    price: "€399",
    period: "per month",
    description: "Comprehensive compliance for growing companies",
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
    price: "€799",
    period: "per month",
    description: "Advanced features for large organizations",
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

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your business needs. All plans include core compliance features 
            with 30-day free trial.
          </p>
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
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground ml-1">/{plan.period}</span>
                  </div>
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
                >
                  Start Free Trial
                </Button>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Need a custom solution? We offer tailored packages for large enterprises.
          </p>
          <Button variant="outline">
            Contact Sales
          </Button>
        </div>
      </div>
    </section>
  );
}