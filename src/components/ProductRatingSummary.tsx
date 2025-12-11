import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Rating {
  id: string;
  rating: number;
  approved: boolean;
}

interface ProductRatingSummaryProps {
  productId: string;
}

const ProductRatingSummary = ({ productId }: ProductRatingSummaryProps) => {
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [starDistribution, setStarDistribution] = useState<{ [key: number]: number }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRatingSummary();
  }, [productId]);

  const fetchRatingSummary = async () => {
    try {
      const { data, error } = await supabase
        .from("product_ratings")
        .select("rating")
        .eq("product_id", productId)
        .eq("approved", true);

      if (error) throw error;

      const ratings = data || [];
      const total = ratings.length;
      setTotalRatings(total);

      if (total === 0) {
        setAverageRating(0);
        setStarDistribution({});
        return;
      }

      const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
      const avg = sum / total;
      setAverageRating(avg);

      const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings.forEach(r => {
        distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      });
      setStarDistribution(distribution);
    } catch (error: any) {
      console.error("Error fetching rating summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          // Calculate fill percentage for partial stars
          const fillAmount = Math.max(0, Math.min(1, rating - star + 1));
          
          return (
            <div key={star} className="relative h-5 w-5">
              {/* Empty star background */}
              <Star className="h-5 w-5 text-gray-300 absolute" />
              {/* Filled star with opacity */}
              {fillAmount > 0 && (
                <div style={{ width: `${fillAmount * 100}%` }} className="absolute overflow-hidden">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 opacity-70" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderStarBar = (star: number, count: number) => {
    const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
    
    return (
      <div key={star} className="flex items-center gap-2 text-sm">
        <div className="flex-1 border-2 border-[#3b2a20] rounded-none h-4 overflow-hidden">
          <div
            className="bg-[#3b2a20] h-4 rounded-none"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-4">Loading ratings...</div>;
  }

  if (totalRatings === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-[#5e4338] font-semibold">No ratings yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="text-center">
        <div className="text-3xl font-bold text-[#5e4338]">{averageRating.toFixed(1)}</div>
        {renderStars(Math.round(averageRating))}
        <div className="text-sm text-[#5e4338] mt-1">({totalRatings} reviews)</div>
      </div>
      <div className="w-full max-w-xs space-y-2">
        {[5, 4, 3, 2, 1].map(star => renderStarBar(star, starDistribution[star] || 0))}
      </div>
    </div>
  );
};

export default ProductRatingSummary;
