import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Trash2, Upload, Plus, Download, FileText } from "lucide-react";
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

const LabReportsTab = () => {
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [testType, setTestType] = useState("");
  const [testDate, setTestDate] = useState("");
  const [filterProduct, setFilterProduct] = useState("all");

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
        toast({ title: "Error fetching lab reports", variant: "destructive" });
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

  const uploadLabReport = async () => {
    if (!selectedFile || !selectedProduct) {
      toast({ title: "Please select a product and file", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      // Upload file to storage
      const fileName = `lab-report-${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("lab-reports")
        .upload(fileName, selectedFile);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast({ title: "Error uploading file", variant: "destructive" });
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("lab-reports")
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase.from("lab_reports").insert({
        product_id: selectedProduct,
        file_url: publicUrl,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        test_type: testType || null,
        test_date: testDate || null,
      });

      if (dbError) {
        console.error("Database error:", dbError);
        toast({ title: "Error saving report details", variant: "destructive" });
        return;
      }

      toast({ title: "Lab report uploaded successfully" });
      setShowDialog(false);
      resetForm();
      fetchLabReports();
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error uploading lab report", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const deleteLabReport = async (id: string, fileName: string) => {
    if (!confirm("Are you sure you want to delete this lab report?")) return;

    try {
      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from("lab-reports")
        .remove([fileName.split("/").pop() || fileName]);

      if (deleteError) {
        console.error("Delete error:", deleteError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("lab_reports")
        .delete()
        .eq("id", id);

      if (dbError) {
        console.error("Database error:", dbError);
        toast({ title: "Error deleting report", variant: "destructive" });
        return;
      }

      toast({ title: "Lab report deleted successfully" });
      fetchLabReports();
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error deleting lab report", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setSelectedProduct("");
    setTestType("");
    setTestDate("");
  };

  const filteredReports =
    filterProduct === "all"
      ? labReports
      : labReports.filter((report) => report.product_id === filterProduct);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading lab reports...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-bold">Lab Reports Management</h2>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Lab Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Upload Lab Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="product-select">Select Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger id="product-select">
                    <SelectValue placeholder="Choose a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="test-type">Test Type (Optional)</Label>
                <Input
                  id="test-type"
                  placeholder="e.g., Nutritional Analysis, Heavy Metals Test"
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="test-date">Test Date (Optional)</Label>
                <Input
                  id="test-date"
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="file-input">Select File</Label>
                <div className="relative">
                  <Input
                    id="file-input"
                    type="file"
                    accept=".pdf,.doc,.docx,.xlsx,.jpg,.jpeg,.png"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                </div>
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              <Button
                onClick={uploadLabReport}
                disabled={uploading || !selectedProduct || !selectedFile}
                className="w-full gap-2"
              >
                {uploading ? "Uploading..." : "Upload Report"}
                {!uploading && <Upload className="h-4 w-4" />}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter by Product */}
      <Card className="p-3 sm:p-4">
        <Label className="text-sm sm:text-base font-semibold mb-2 block">Filter by Product</Label>
        <Select value={filterProduct} onValueChange={setFilterProduct}>
          <SelectTrigger className="w-full text-sm sm:text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {/* Lab Reports List */}
      {filteredReports.length === 0 ? (
        <Card className="p-6 sm:p-8 text-center">
          <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-sm sm:text-base text-gray-600">No lab reports found</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {filteredReports.map((report) => (
            <Card key={report.id} className="p-3 sm:p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                <div className="flex-1 w-full">
                  <div className="flex items-start gap-2 mb-2">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <h3 className="font-semibold text-sm sm:text-base break-words">{report.file_name}</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Product:</span> {report.product_name}
                    </div>
                    {report.test_type && (
                      <div>
                        <span className="font-medium">Test Type:</span> {report.test_type}
                      </div>
                    )}
                    {report.test_date && (
                      <div>
                        <span className="font-medium">Test Date:</span> {report.test_date}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Uploaded:</span> {formatDate(report.created_at)}
                    </div>
                    {report.file_size && (
                      <div>
                        <span className="font-medium">Size:</span> {(report.file_size / 1024).toFixed(2)} KB
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                  <a
                    href={report.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="flex-1 sm:flex-none"
                  >
                    <Button size="sm" variant="outline" className="gap-1 sm:gap-2 w-full text-xs sm:text-sm">
                      <Download className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Download</span><span className="sm:hidden">DL</span>
                    </Button>
                  </a>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteLabReport(report.id, report.file_url)}
                    className="gap-1 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Delete</span><span className="sm:hidden">Del</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LabReportsTab;
