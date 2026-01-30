import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  display_order: number;
}

interface ProductFAQProps {
  productId: string;
}

const ProductFAQ = ({ productId }: ProductFAQProps) => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      } else {
        setFaqs(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading || faqs.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#c9f4dd] rounded-lg p-4 sm:p-6 shadow-sm">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-2xl sm:text-3xl font-saira font-black text-[#3b2a20] uppercase flex items-center gap-2">
          <HelpCircle className="h-6 w-6 sm:h-7 sm:w-7" />
          Frequently Asked Questions
        </h2>
      </div>

      <div className="space-y-3">
        {faqs.map((faq) => (
          <div
            key={faq.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-[#3b2a20]/30 transition-colors shadow-sm"
          >
            <button
              onClick={() => toggleExpand(faq.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-base sm:text-lg font-semibold text-[#3b2a20] pr-4">
                {faq.question}
              </h3>
              {expandedId === faq.id ? (
                <ChevronUp className="h-5 w-5 text-[#3b2a20] flex-shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-[#3b2a20] flex-shrink-0" />
              )}
            </button>

            {expandedId === faq.id && (
              <div className="px-4 pb-4 pt-2">
                <div className="text-sm sm:text-base text-[#3b2a20]/80 leading-relaxed whitespace-pre-wrap">
                  {faq.answer}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductFAQ;
