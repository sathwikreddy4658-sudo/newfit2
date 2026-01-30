import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Calendar, ChevronDown, ChevronUp, Search } from "lucide-react";
import l1 from "@/assets/l1.png";
import l2 from "@/assets/l2.png";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LabReport {
  id: string;
  product_id: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  test_type?: string;
  test_date?: string;
  created_at: string;
  product_name?: string;
}

interface Product {
  id: string;
  name: string;
}

const LabReports = () => {
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProduct, setFilterProduct] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchLabReports();
    fetchProducts();
  }, []);

  const fetchLabReports = async () => {
    try {
      const { data, error } = await supabase
        .from("lab_reports")
        .select(
          `
          id,
          product_id,
          file_url,
          file_name,
          file_size,
          test_type,
          test_date,
          created_at,
          products!inner(name)
          `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching lab reports:", error);
      } else {
        const formattedData = data?.map((report: any) => ({
          ...report,
          product_name: report.products?.name,
        })) || [];
        setLabReports(formattedData);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .eq("is_hidden", false)
        .order("name");

      if (error) {
        console.error("Error fetching products:", error);
      } else {
        setProducts(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const filteredReports = labReports.filter((report) => {
    const matchesSearch = searchQuery === "" ||
      report.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.test_type?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const groupedReports = filteredReports.reduce((acc: any, report) => {
    const productName = report.product_name || "Unknown Product";
    if (!acc[productName]) {
      acc[productName] = [];
    }
    acc[productName].push(report);
    return acc;
  }, {});

  const toggleProductExpansion = (productName: string) => {
    setExpandedProducts((prev) => ({
      ...prev,
      [productName]: !prev[productName],
    }));
  };

  return (
    <>
      <Helmet>
        <title>Lab Reports | Freel It</title>
        <meta
          name="description"
          content="View and download lab test reports for Freel It products. Transparency and quality assurance."
        />
      </Helmet>

      <div 
        className="min-h-screen bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `url(${window.innerWidth < 640 ? l1 : l2})`
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 pt-16">
          {/* Header */}
          <div className="mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-saira font-black mb-3 sm:mb-4 uppercase text-[#3b2a20]">LAB REPORTS</h1>
          </div>

          {/* Search Section */}
          <div className="mb-6 sm:mb-8 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#3b2a20]/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white text-[#3b2a20] rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3b2a20]/20 font-saira"
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
              <p className="mt-4 text-[#3b2a20]">Loading lab reports...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredReports.length === 0 && (
            <Card className="bg-white overflow-hidden">
              <CardContent className="py-8 sm:py-12 text-center px-4">
                <FileText className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-gray-300 mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-[#3b2a20] mb-2">No Lab Reports Available</h3>
                <p className="text-sm sm:text-base text-[#3b2a20]">
                  {searchQuery === ""
                    ? "Lab reports will be added soon. Check back later!"
                    : `No lab reports found matching "${searchQuery}". Try a different search term.`}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Reports by Product */}
          {!loading && filteredReports.length > 0 && (
            <div className="space-y-6 sm:space-y-8">
              {Object.entries(groupedReports).map(([productName, reports]: [string, any]) => (
                <div key={productName} className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
                  <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
                    onClick={() => toggleProductExpansion(productName)}
                  >
                    <h2 className="text-xl sm:text-2xl font-saira font-black text-[#3b2a20] uppercase flex items-center gap-2">
                      {productName}
                      <span className="text-sm text-[#3b2a20]/70 font-normal">({reports.length})</span>
                    </h2>
                    {expandedProducts[productName] ? (
                      <ChevronUp className="h-6 w-6 text-[#3b2a20] flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-6 w-6 text-[#3b2a20] flex-shrink-0" />
                    )}
                  </div>
                  
                  {expandedProducts[productName] && (
                    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-2 mt-3 sm:mt-4">
                    {reports.map((report: LabReport) => (
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
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LabReports;
