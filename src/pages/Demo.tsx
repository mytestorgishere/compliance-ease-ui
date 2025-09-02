import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, CheckCircle } from "lucide-react";
import complyLogo from "@/assets/comply-logo.png";
import { toast } from "@/hooks/use-toast";

interface DemoFormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  requirements: string;
}

export default function Demo() {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<DemoFormData>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      phone: "",
      preferredDate: "",
      preferredTime: "",
      requirements: "",
    },
  });

  const onSubmit = async (data: DemoFormData) => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast({
        title: t('demo.success'),
        description: "We'll send you a calendar invite within 24 hours.",
      });
    }, 2000);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md backdrop-blur bg-card/80 border border-border/50 shadow-strong">
          <CardContent className="text-center pt-8">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Demo Scheduled!</h2>
            <p className="text-muted-foreground mb-6">
              {t('demo.success')}
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full bg-gradient-primary hover:opacity-90">
                <Link to="/">{t('common.getStarted')}</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/free-trial">{t('common.freeTrial')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="p-4">
        <Link to="/" className="inline-flex items-center gap-2 text-white">
          <img src={complyLogo} alt="Logo" className="h-8 w-8" />
          <span className="text-xl font-bold">ComplianceAI</span>
        </Link>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('demo.title')}
          </h1>
          <p className="text-xl text-white/80">
            {t('demo.subtitle')}
          </p>
        </div>

        <Card className="backdrop-blur bg-card/80 border border-border/50 shadow-strong">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Schedule Your Demo</CardTitle>
            <CardDescription className="text-center">
              See how ComplianceAI transforms your regulatory documents into actionable compliance reports with risk assessments and automated recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('common.firstName')}</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('common.lastName')}</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.email')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="john@company.com"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('common.company')}</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Inc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('common.phone')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="tel" 
                            placeholder="+1 (555) 123-4567"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Scheduling */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="preferredDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Calendar className="h-4 w-4 inline mr-2" />
                          {t('demo.preferredDate')}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="preferredTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Clock className="h-4 w-4 inline mr-2" />
                          {t('demo.preferredTime')}
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="morning">{t('demo.timeSlots.morning')}</SelectItem>
                            <SelectItem value="afternoon">{t('demo.timeSlots.afternoon')}</SelectItem>
                            <SelectItem value="evening">{t('demo.timeSlots.evening')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('demo.requirements')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('demo.requirementsPlaceholder')}
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary hover:opacity-90" 
                  disabled={isSubmitting}
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Scheduling...
                    </>
                  ) : (
                    t('demo.schedule')
                  )}
                </Button>
              </form>
            </Form>

            {/* Benefits */}
            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-3">What to expect in your demo:</h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Personalized walkthrough of ComplianceAI features</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Live demonstration with your compliance use cases</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Q&A session with our compliance experts</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Custom pricing and implementation plan</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}