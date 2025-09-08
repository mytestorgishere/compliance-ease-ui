import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DetailedReportView } from "@/components/ui/detailed-report-view";
import { useToast } from "@/hooks/use-toast";

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle temporary report data for demo reports
    if (id === 'temp') {
      const tempReportData = sessionStorage.getItem('temp-report');
      if (tempReportData) {
        try {
          const tempReport = JSON.parse(tempReportData);
          setReport(tempReport);
          sessionStorage.removeItem('temp-report'); // Clean up
        } catch (error) {
          console.error('Error parsing temp report:', error);
          toast({
            title: "Error",
            description: "Failed to load report data.",
            variant: "destructive",
          });
          navigate('/dashboard');
        }
        setLoading(false);
        return;
      } else {
        toast({
          title: "Error",
          description: "No report data found. Please try again.",
          variant: "destructive",
        });
        navigate('/dashboard');
        setLoading(false);
        return;
      }
    }

    if (!user || !id) {
      navigate('/login');
      return;
    }

    fetchReport();
  }, [id, user, navigate]);

  const fetchReport = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching report:', error);
        toast({
          title: "Error",
          description: "Failed to load report. Please try again.",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      if (!data) {
        toast({
          title: "Report Not Found",
          description: "The requested report could not be found.",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      setReport(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: "Your report is being downloaded.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Report not found.</p>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="ghost" 
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <DetailedReportView
          report={report}
          onDownload={() => downloadReport(
            report.processed_content,
            `compliance-report-${report.original_filename}.txt`
          )}
        />
      </div>
    </div>
  );
};

export default ReportDetail;