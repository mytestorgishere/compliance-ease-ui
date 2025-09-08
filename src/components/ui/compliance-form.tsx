import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, Users, Briefcase } from "lucide-react";

interface ComplianceFormData {
  country: string;
  businessType: string;
  companySize: string;
  dataProcessingType: string;
  industry: string;
  existingCompliance: string;
  specificConcerns: string;
}

interface ComplianceFormProps {
  onSubmit: (data: ComplianceFormData) => void;
  isLoading?: boolean;
}

const europeanCountries = [
  { code: "AT", name: "Austria", gdprSpecific: "Austrian Data Protection Act (DSG)" },
  { code: "BE", name: "Belgium", gdprSpecific: "Belgian Data Protection Authority requirements" },
  { code: "BG", name: "Bulgaria", gdprSpecific: "Personal Data Protection Act" },
  { code: "HR", name: "Croatia", gdprSpecific: "Personal Data Protection Act" },
  { code: "CY", name: "Cyprus", gdprSpecific: "Processing of Personal Data Law" },
  { code: "CZ", name: "Czech Republic", gdprSpecific: "Personal Data Protection Act" },
  { code: "DK", name: "Denmark", gdprSpecific: "Danish Data Protection Act" },
  { code: "EE", name: "Estonia", gdprSpecific: "Personal Data Protection Act" },
  { code: "FI", name: "Finland", gdprSpecific: "Data Protection Act" },
  { code: "FR", name: "France", gdprSpecific: "French Data Protection Act (Loi Informatique et Libertés)" },
  { code: "DE", name: "Germany", gdprSpecific: "Federal Data Protection Act (BDSG)" },
  { code: "GR", name: "Greece", gdprSpecific: "Personal Data Protection Law" },
  { code: "HU", name: "Hungary", gdprSpecific: "Act on Information Self-Determination" },
  { code: "IE", name: "Ireland", gdprSpecific: "Data Protection Acts" },
  { code: "IT", name: "Italy", gdprSpecific: "Italian Personal Data Protection Code" },
  { code: "LV", name: "Latvia", gdprSpecific: "Personal Data Processing Law" },
  { code: "LT", name: "Lithuania", gdprSpecific: "Law on Legal Protection of Personal Data" },
  { code: "LU", name: "Luxembourg", gdprSpecific: "Data Protection Law" },
  { code: "MT", name: "Malta", gdprSpecific: "Data Protection Act" },
  { code: "NL", name: "Netherlands", gdprSpecific: "Dutch GDPR Implementation Act (UAVG)" },
  { code: "PL", name: "Poland", gdprSpecific: "Personal Data Protection Act" },
  { code: "PT", name: "Portugal", gdprSpecific: "Personal Data Protection Law" },
  { code: "RO", name: "Romania", gdprSpecific: "Law on Personal Data Processing" },
  { code: "SK", name: "Slovakia", gdprSpecific: "Personal Data Protection Act" },
  { code: "SI", name: "Slovenia", gdprSpecific: "Personal Data Protection Act" },
  { code: "ES", name: "Spain", gdprSpecific: "Organic Law on Personal Data Protection (LOPDGDD)" },
  { code: "SE", name: "Sweden", gdprSpecific: "Personal Data Act" },
];

const businessTypes = [
  "E-commerce/Online Retail",
  "Financial Services",
  "Healthcare/Medical",
  "Technology/Software",
  "Marketing/Advertising",
  "Education",
  "Manufacturing",
  "Professional Services",
  "Government/Public Sector",
  "Non-profit",
  "Media/Publishing",
  "Travel/Hospitality",
  "Real Estate",
  "Other"
];

const companySizes = [
  "Startup (1-10 employees)",
  "Small Business (11-50 employees)",
  "Medium Business (51-250 employees)",
  "Large Enterprise (251+ employees)"
];

const dataProcessingTypes = [
  "Basic customer data (names, emails)",
  "Payment processing",
  "Employee data management",
  "Marketing and analytics",
  "Special categories (health, biometric)",
  "Cross-border data transfers",
  "Automated decision-making",
  "Multiple data types"
];

export function ComplianceForm({ onSubmit, isLoading }: ComplianceFormProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>("");

  const form = useForm<ComplianceFormData>({
    defaultValues: {
      country: "",
      businessType: "",
      companySize: "",
      dataProcessingType: "",
      industry: "",
      existingCompliance: "",
      specificConcerns: "",
    },
  });

  const selectedCountryData = europeanCountries.find(c => c.code === selectedCountry);

  const handleSubmit = (data: ComplianceFormData) => {
    onSubmit(data);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          GDPR Compliance Assessment
        </CardTitle>
        <p className="text-muted-foreground">
          Provide details about your business to generate a country-specific GDPR compliance report
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Country Selection */}
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Country of Operation
                  </FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedCountry(value);
                  }}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60">
                      {europeanCountries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCountryData && (
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      <Badge variant="secondary" className="mb-2">
                        Country-Specific Requirements
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {selectedCountryData.gdprSpecific}
                      </p>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Business Details */}
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Business Type
                    </FormLabel>
                    <Select onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {businessTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companySize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Company Size
                    </FormLabel>
                    <Select onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companySizes.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dataProcessingType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Data Processing Activities
                  </FormLabel>
                  <Select onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary data processing type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {dataProcessingTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry/Sector Details</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., SaaS platform, retail clothing, medical practice"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="existingCompliance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Compliance Measures</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe any existing privacy policies, data protection measures, or compliance frameworks you currently have in place..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specificConcerns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specific Concerns or Requirements</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any specific GDPR concerns, recent changes in your data processing, or particular areas you want to focus on..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Report...
                </>
              ) : (
                "Generate Country-Specific Compliance Report"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}