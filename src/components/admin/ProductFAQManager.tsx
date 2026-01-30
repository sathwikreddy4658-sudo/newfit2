import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit2, Save, X, GripVertical, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  display_order: number;
}

interface ProductFAQManagerProps {
  productId: string;
}

const ProductFAQManager = ({ productId }: ProductFAQManagerProps) => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ question: "", answer: "" });
  const { toast } = useToast();

  useEffect(() => {
    fetchFAQs();
  }, [productId]);

  const fetchFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from("product_faqs")
        .select("*")
        .eq("product_id", productId)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching FAQs:", error);
        toast({ title: "Error fetching FAQs", variant: "destructive" });
      } else {
        setFaqs(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast({ title: "Please fill in both question and answer", variant: "destructive" });
      return;
    }

    try {
      const maxOrder = faqs.length > 0 ? Math.max(...faqs.map(f => f.display_order)) : -1;
      
      const { error } = await supabase.from("product_faqs").insert({
        product_id: productId,
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        display_order: maxOrder + 1,
      });

      if (error) throw error;

      toast({ title: "FAQ added successfully" });
      setFormData({ question: "", answer: "" });
      setIsAdding(false);
      fetchFAQs();
    } catch (error) {
      console.error("Error adding FAQ:", error);
      toast({ title: "Error adding FAQ", variant: "destructive" });
    }
  };

  const handleUpdate = async (id: string) => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast({ title: "Please fill in both question and answer", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from("product_faqs")
        .update({
          question: formData.question.trim(),
          answer: formData.answer.trim(),
        })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "FAQ updated successfully" });
      setEditingId(null);
      setFormData({ question: "", answer: "" });
      fetchFAQs();
    } catch (error) {
      console.error("Error updating FAQ:", error);
      toast({ title: "Error updating FAQ", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;

    try {
      const { error } = await supabase.from("product_faqs").delete().eq("id", id);

      if (error) throw error;

      toast({ title: "FAQ deleted successfully" });
      fetchFAQs();
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      toast({ title: "Error deleting FAQ", variant: "destructive" });
    }
  };

  const startEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    setFormData({ question: faq.question, answer: faq.answer });
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ question: "", answer: "" });
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;

    const newFaqs = [...faqs];
    [newFaqs[index], newFaqs[index - 1]] = [newFaqs[index - 1], newFaqs[index]];

    try {
      await Promise.all(
        newFaqs.map((faq, idx) =>
          supabase.from("product_faqs").update({ display_order: idx }).eq("id", faq.id)
        )
      );
      fetchFAQs();
    } catch (error) {
      console.error("Error reordering FAQs:", error);
      toast({ title: "Error reordering FAQs", variant: "destructive" });
    }
  };

  const moveDown = async (index: number) => {
    if (index === faqs.length - 1) return;

    const newFaqs = [...faqs];
    [newFaqs[index], newFaqs[index + 1]] = [newFaqs[index + 1], newFaqs[index]];

    try {
      await Promise.all(
        newFaqs.map((faq, idx) =>
          supabase.from("product_faqs").update({ display_order: idx }).eq("id", faq.id)
        )
      );
      fetchFAQs();
    } catch (error) {
      console.error("Error reordering FAQs:", error);
      toast({ title: "Error reordering FAQs", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading FAQs...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Product FAQs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add FAQ Button */}
        {!isAdding && !editingId && (
          <Button onClick={() => setIsAdding(true)} className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Add New FAQ
          </Button>
        )}

        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <Card className="border-2 border-primary">
            <CardContent className="pt-4 space-y-3">
              <div>
                <label className="text-sm font-semibold mb-1 block">Question</label>
                <Input
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Enter question..."
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Answer</label>
                <Textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Enter answer..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => (editingId ? handleUpdate(editingId) : handleAdd())}
                  className="flex-1 gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingId ? "Update" : "Add"}
                </Button>
                <Button onClick={cancelEdit} variant="outline" className="flex-1 gap-2">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* FAQ List */}
        {faqs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No FAQs added yet. Click "Add New FAQ" to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <Card key={faq.id} className={editingId === faq.id ? "border-primary" : ""}>
                <CardContent className="pt-4">
                  <div className="flex gap-2">
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        <GripVertical className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-2">
                      <div className="font-semibold text-sm">Q: {faq.question}</div>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                        A: {faq.answer}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(faq)}
                        disabled={!!editingId || isAdding}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(faq.id)}
                        disabled={!!editingId || isAdding}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductFAQManager;
