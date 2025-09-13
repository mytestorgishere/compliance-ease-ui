import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bug, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BugReportDialogProps {
  children?: React.ReactNode;
}

export function BugReportDialog({ children }: BugReportDialogProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    priority: "medium",
  });

  const getBrowserInfo = () => {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenResolution: `${screen.width}x${screen.height}`,
      windowSize: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString(),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to report bugs");
      return;
    }

    if (!formData.subject.trim() || !formData.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit to database first
      const bugReportData = {
        user_id: user.id,
        email: user.email || "",
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        browser_info: getBrowserInfo(),
        url: window.location.href,
      };

      const { error: dbError } = await supabase
        .from("bug_reports")
        .insert(bugReportData);

      if (dbError) {
        console.error("Database error:", dbError);
        throw new Error("Failed to save bug report");
      }

      // Send email notification
      const { error: emailError } = await supabase.functions.invoke("send-bug-report", {
        body: bugReportData,
      });

      if (emailError) {
        console.error("Email error:", emailError);
        // Don't throw error for email failure, bug is still saved
        toast.success("Bug report submitted successfully! (Email notification may have failed)");
      } else {
        toast.success("Bug report submitted successfully! We'll get back to you soon.");
      }

      // Reset form and close dialog
      setFormData({ subject: "", description: "", priority: "medium" });
      setIsOpen(false);
    } catch (error) {
      console.error("Error submitting bug report:", error);
      toast.error("Failed to submit bug report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <Bug className="h-4 w-4" />
            Report Bug
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Report a Bug
          </DialogTitle>
          <DialogDescription>
            Help us improve by reporting bugs or issues you've encountered.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => handleInputChange("priority", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Minor issue</SelectItem>
                <SelectItem value="medium">Medium - Regular issue</SelectItem>
                <SelectItem value="high">High - Major problem</SelectItem>
                <SelectItem value="critical">Critical - App not working</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="Brief description of the issue"
              value={formData.subject}
              onChange={(e) => handleInputChange("subject", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Please provide detailed steps to reproduce the issue..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={5}
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}