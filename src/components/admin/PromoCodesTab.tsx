import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface PromoCode {
  id: string;
  code: string;
  discount_percentage: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  max_uses: number | null;
  current_uses: number;
  free_shipping: boolean | null;
  min_order_amount: number | null;
  description: string | null;
  max_discount_amount: number | null;
}

const PromoCodesTab = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    discount_percentage: "",
    max_uses: "",
    free_shipping: false,
    min_order_amount: "",
    description: "",
    max_discount_amount: "",
  });

  const fetchPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error) {
      console.error("Error fetching promo codes:", error);
      toast.error("Failed to fetch promo codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate discount percentage if provided
    const discount = formData.discount_percentage ? parseFloat(formData.discount_percentage) : 0;
    if (formData.discount_percentage && (isNaN(discount) || discount <= 0 || discount > 100)) {
      toast.error("Discount percentage must be between 1 and 100");
      return;
    }

    // For non-free-shipping codes, discount is required
    if (!formData.free_shipping && discount === 0) {
      toast.error("Discount percentage is required for discount codes");
      return;
    }

    const maxUses = formData.max_uses ? parseInt(formData.max_uses) : null;
    if (maxUses !== null && (isNaN(maxUses) || maxUses <= 0)) {
      toast.error("Usage limit must be a positive number");
      return;
    }

    const minOrderAmount = formData.min_order_amount ? parseFloat(formData.min_order_amount) : 0;
    const maxDiscountAmount = formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null;

    try {
      if (editingCode) {
        const { error } = await supabase
          .from("promo_codes")
          .update({
            code: formData.code.toUpperCase(),
            discount_percentage: discount,
            max_uses: maxUses,
            free_shipping: formData.free_shipping,
            min_order_amount: minOrderAmount,
            description: formData.description || null,
            max_discount_amount: maxDiscountAmount,
          })
          .eq("id", editingCode.id);

        if (error) throw error;
        toast.success("Promo code updated successfully");
      } else {
        const { error } = await supabase
          .from("promo_codes")
          .insert({
            code: formData.code.toUpperCase(),
            discount_percentage: discount,
            max_uses: maxUses,
            free_shipping: formData.free_shipping,
            min_order_amount: minOrderAmount,
            description: formData.description || null,
            max_discount_amount: maxDiscountAmount,
          });

        if (error) throw error;
        toast.success("Promo code created successfully");
      }

      setFormData({ 
        code: "", 
        discount_percentage: "", 
        max_uses: "", 
        free_shipping: false,
        min_order_amount: "",
        description: "",
        max_discount_amount: "",
      });
      setShowForm(false);
      setEditingCode(null);
      fetchPromoCodes();
    } catch (error: any) {
      console.error("Error saving promo code:", error);
      if (error.code === "23505") {
        toast.error("Promo code already exists");
      } else {
        toast.error("Failed to save promo code");
      }
    }
  };

  const handleEdit = (promoCode: PromoCode) => {
    setEditingCode(promoCode);
    setFormData({
      code: promoCode.code,
      discount_percentage: promoCode.discount_percentage.toString(),
      max_uses: promoCode.max_uses?.toString() || "",
      free_shipping: promoCode.free_shipping || false,
      min_order_amount: promoCode.min_order_amount?.toString() || "",
      description: promoCode.description || "",
      max_discount_amount: promoCode.max_discount_amount?.toString() || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promo code?")) return;

    try {
      const { error } = await supabase
        .from("promo_codes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Promo code deleted successfully");
      fetchPromoCodes();
    } catch (error) {
      console.error("Error deleting promo code:", error);
      toast.error("Failed to delete promo code");
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from("promo_codes")
        .update({ active })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Promo code ${active ? "activated" : "deactivated"}`);
      fetchPromoCodes();
    } catch (error) {
      console.error("Error updating promo code:", error);
      toast.error("Failed to update promo code");
    }
  };

  const resetForm = () => {
    setFormData({ 
      code: "", 
      discount_percentage: "", 
      max_uses: "", 
      free_shipping: false,
      min_order_amount: "",
      description: "",
      max_discount_amount: "",
    });
    setEditingCode(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading promo codes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Promo Codes</h2>
        <Button onClick={() => setShowForm(true)} className="font-poppins font-bold">
          <Plus className="mr-2 h-4 w-4" />
          Add Promo Code
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingCode ? "Edit Promo Code" : "Add New Promo Code"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Switch
                  id="free_shipping"
                  checked={formData.free_shipping}
                  onCheckedChange={(checked) => setFormData({ ...formData, free_shipping: checked })}
                />
                <div>
                  <Label htmlFor="free_shipping" className="font-semibold cursor-pointer">
                    🚚 Free Shipping Promo
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enable free shipping. Can also include percentage discount for dual benefits.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Promo Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="SUMMER2024"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="discount">Discount Percentage {!formData.free_shipping && '*'}</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                    placeholder="10.00"
                    required={!formData.free_shipping}
                  />
                  {formData.free_shipping && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Optional: Add discount on top of free shipping
                    </p>
                  )}
                </div>
              </div>
              
              {formData.free_shipping && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min_order">Minimum Order Amount (₹)</Label>
                    <Input
                      id="min_order"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.min_order_amount}
                      onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                      placeholder="499.00"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum order value for this promo
                    </p>
                  </div>
                  <div></div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_uses">Usage Limit (optional)</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    min="1"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    placeholder="Leave empty for unlimited"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum number of times this code can be used
                  </p>
                </div>
                
                {formData.discount_percentage && (
                  <div>
                    <Label htmlFor="max_discount">Max Discount Amount (₹)</Label>
                    <Input
                      id="max_discount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.max_discount_amount}
                      onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                      placeholder="Leave empty for no cap"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum discount amount for percentage-based codes
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Internal note about this promo code"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Admin-only note to remember the purpose of this code
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="font-poppins font-bold">
                  {editingCode ? "Update" : "Create"} Promo Code
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Min Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promoCodes.map((promoCode) => (
                <TableRow key={promoCode.id}>
                  <TableCell className="font-mono font-bold">{promoCode.code}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {promoCode.free_shipping && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          🚚 Free Shipping
                        </Badge>
                      )}
                      {promoCode.discount_percentage > 0 && (
                        <Badge variant="outline" className="bg-green-50 text-green-800">
                          💰 {promoCode.discount_percentage}% OFF
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {promoCode.discount_percentage > 0 
                      ? `${promoCode.discount_percentage}%${promoCode.max_discount_amount ? ` (max ₹${promoCode.max_discount_amount})` : ''}`
                      : "-"
                    }
                  </TableCell>
                  <TableCell>
                    {promoCode.current_uses} / {promoCode.max_uses || "∞"}
                  </TableCell>
                  <TableCell>
                    {promoCode.min_order_amount ? `₹${promoCode.min_order_amount}` : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={promoCode.active}
                        onCheckedChange={(checked) => toggleActive(promoCode.id, checked)}
                      />
                      <Badge variant={promoCode.active ? "default" : "secondary"}>
                        {promoCode.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{new Date(promoCode.created_at).toLocaleDateString()}</span>
                      {promoCode.description && (
                        <span className="text-xs text-muted-foreground">{promoCode.description}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(promoCode)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(promoCode.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {promoCodes.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No promo codes found. Create your first promo code to get started.
        </div>
      )}
    </div>
  );
};

export default PromoCodesTab;
