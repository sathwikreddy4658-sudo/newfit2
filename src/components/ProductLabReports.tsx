import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
      month: "short",
      day: "numeric",
    });
  };

  if (loading || reports.length === 0) {
    return null;
  }

  return (
    <Card className="border-green-200 bg-green-50 w-full overflow-hidden">
      <CardHeader
        className="pb-2 sm:pb-3 px-3 sm:px-6 cursor-pointer hover:bg-green-100 transition-colors rounded-t-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center gap-2">
          <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-1.5 sm:gap-2 min-w-0">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
            <span className="text-sm sm:text-base truncate">Lab Reports ({reports.length})</span>
          </CardTitle>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 flex-shrink-0" />
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-6 pb-3 sm:pb-6 pt-0">
          <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-4">
            Download comprehensive lab test reports to verify quality and safety standards.
          </p>
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white p-2.5 sm:p-3 rounded-lg border border-green-200 hover:border-green-400 transition-colors w-full overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-3 w-full">
                <div className="flex-1 min-w-0 w-full overflow-hidden pr-0 sm:pr-2">
                  <h4 className="font-semibold text-xs sm:text-sm text-gray-800 break-all">
                    {report.file_name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 text-xs text-gray-600 overflow-hidden">
                    {report.test_type && (
                      <Badge variant="secondary" className="text-[10px] sm:text-xs max-w-full truncate flex-shrink-0">
                        {report.test_type}
                      </Badge>
                    )}
                    <span className="break-words text-[10px] sm:text-xs">
                      {report.test_date ? `Tested: ${report.test_date}` : `Added: ${formatDate(report.created_at)}`}
                    </span>
                  </div>
                </div>
                <a
                  href={report.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="w-full sm:w-auto flex-shrink-0"
                >
                  <Button
                    size="sm"
                    className="gap-1 text-[10px] sm:text-xs py-2 px-3 w-full sm:w-auto bg-green-600 hover:bg-green-700 whitespace-nowrap"
                  >
                    <Download className="h-3 w-3 flex-shrink-0" />
                    Download
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
};

export default ProductLabReports;
