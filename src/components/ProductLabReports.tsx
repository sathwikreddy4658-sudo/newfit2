import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import l1 from "@/assets/l1.png";

interface LabReport {
  id: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  test_type?: string;
  test_date?: string;
  created_at: string;
}

interface ProductLabReportsProps {
  productId: string;
}

const ProductLabReports = ({ productId }: ProductLabReportsProps) => {
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchLabReports();
  }, [productId]);

  const fetchLabReports = async () => {
    try {
      const { data, error } = await supabase
        .from("lab_reports")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching lab reports:", error);
      } else {
        setReports(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading || reports.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
      <div 
        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-xl sm:text-2xl font-saira font-black text-[#3b2a20] uppercase flex items-center gap-2">
          LAB REPORTS
          <span className="text-sm text-[#3b2a20]/70 font-normal">({reports.length})</span>
        </h2>
        {isExpanded ? (
          <ChevronUp className="h-6 w-6 text-[#3b2a20] flex-shrink-0" />
        ) : (
          <ChevronDown className="h-6 w-6 text-[#3b2a20] flex-shrink-0" />
        )}
      </div>
      
      {isExpanded && (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-2 mt-3 sm:mt-4">
          {reports.map((report) => (
            <Card 
              key={report.id} 
              className="hover:shadow-lg transition-shadow w-full overflow-hidden bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), url(${l1})` }}
            >
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
              </CardHeader>

              <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 overflow-hidden">
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-[#3b2a20] overflow-hidden">
                  {report.test_type && (
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="font-semibold flex-shrink-0">Test Type:</span>
                      <Badge variant="secondary" className="truncate bg-white">{report.test_type}</Badge>
                    </div>
                  )}

                  {report.test_date && (
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Calendar className="h-4 w-4 flex-shrink-0 text-[#3b2a20]" />
                      <span className="font-semibold flex-shrink-0">Test Date:</span>
                      <span className="truncate">{report.test_date}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="font-semibold flex-shrink-0">Uploaded:</span>
                    <span className="truncate">{formatDate(report.created_at)}</span>
                  </div>

                  {report.file_size && (
                    <div className="overflow-hidden">
                      <span className="font-semibold">File Size:</span>
                      <span className="ml-2 break-words">
                        {(report.file_size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                  )}
                </div>

                <a
                  href={report.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="block"
                >
                  <Button className="w-full gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3 bg-[#3b2a20] hover:bg-[#3b2a20]/90 text-white font-saira font-black uppercase">
                    <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                    DOWNLOAD
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductLabReports;
