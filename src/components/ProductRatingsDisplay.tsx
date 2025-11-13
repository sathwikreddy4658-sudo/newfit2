import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Star, User, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Rating {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  helpful_votes: number | null;
  profiles: {
    name: string | null;
  };
}

interface ProductRatingsDisplayProps {
  productId: string;
}

const ProductRatingsDisplay = ({ productId }: ProductRatingsDisplayProps) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchApprovedRatings();
    loadUserVotes();
  }, [productId]);

  const loadUserVotes = async () => {
    try {
      // For guests, we'll use sessionStorage to track votes
      const guestVotes = JSON.parse(localStorage.getItem('rating_helpful_votes') || '[]');
      setUserVotes(new Set(guestVotes));

      // For logged-in users, check database
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: userVotesData } = await supabase
          .from('rating_helpful_votes')
          .select('rating_id')
          .eq('user_identifier', session.user.id);

        if (userVotesData) {
          const userVoteIds = new Set([...guestVotes, ...userVotesData.map(v => v.rating_id)]);
          setUserVotes(userVoteIds);
        }
      }
    } catch (error) {
      console.error('Error loading user votes:', error);
    }
  };

  const fetchApprovedRatings = async () => {
    try {
      const { data, error } = await supabase
        .from("product_ratings")
        .select(`
          id,
          rating,
          comment,
          created_at,
          helpful_votes,
          user_id
        `)
        .eq("product_id", productId)
        .eq("approved", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      const ratingsWithProfiles = await Promise.all(
        (data || []).map(async (rating) => {
          const { data: profile } = await supabase
            .from("profiles" as any)
            .select("name")
            .eq("id", rating.user_id)
            .single();

          return {
            ...rating,
            profiles: profile ? { name: (profile as any).name } : { name: null }
          };
        })
      );

      setRatings(ratingsWithProfiles);
    } catch (error: any) {
      console.error("Error fetching ratings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleHelpfulVote = async (ratingId: string) => {
    const hasVoted = userVotes.has(ratingId);
    const isRemoving = hasVoted;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userIdentifier = session?.user?.id || `guest_${Date.now()}_${Math.random()}`;

      if (isRemoving) {
        // Remove vote
        const { error } = await supabase
          .from('rating_helpful_votes')
          .delete()
          .eq('rating_id', ratingId)
          .eq('user_identifier', userIdentifier);

        if (error) throw error;

        // Update local state
        const newUserVotes = new Set(userVotes);
        newUserVotes.delete(ratingId);
        setUserVotes(newUserVotes);

        // Remove from localStorage for guests
        const guestVotes = JSON.parse(localStorage.getItem('rating_helpful_votes') || '[]');
        const filteredVotes = guestVotes.filter((id: string) => id !== ratingId);
        localStorage.setItem('rating_helpful_votes', JSON.stringify(filteredVotes));

        // Update the rating's helpful count locally
        setRatings(prev => prev.map(rating =>
          rating.id === ratingId
            ? { ...rating, helpful_votes: Math.max((rating.helpful_votes || 0) - 1, 0) }
            : rating
        ));
      } else {
        // Add vote
        const { error } = await supabase
          .from('rating_helpful_votes')
          .insert([{
            rating_id: ratingId,
            user_identifier: userIdentifier
          }]);

        if (error) throw error;

        // Update local state
        const newUserVotes = new Set(userVotes);
        newUserVotes.add(ratingId);
        setUserVotes(newUserVotes);

        // Store in localStorage for guests
        const guestVotes = JSON.parse(localStorage.getItem('rating_helpful_votes') || '[]');
        guestVotes.push(ratingId);
        localStorage.setItem('rating_helpful_votes', JSON.stringify(guestVotes));

        // Update the rating's helpful count locally
        setRatings(prev => prev.map(rating =>
          rating.id === ratingId
            ? { ...rating, helpful_votes: (rating.helpful_votes || 0) + 1 }
            : rating
        ));
      }

    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-4 w-4",
                  star <= rating ? "fill-black text-black" : "text-white"
                )}
              />
          ))}
        </div>
        <span className="font-saira font-bold text-sm text-[#3b2a20]">
          {rating}/5
        </span>
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-4">Loading ratings...</div>;
  }

  if (ratings.length === 0) {
    return null; // Don't show anything if no approved ratings
  }

  return (
    <div className="mt-8">
      <h3 className="font-saira font-bold text-xl text-[#5e4338] mb-6">Customer Reviews</h3>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {ratings.map((rating) => (
          <Card key={rating.id} className="p-6 bg-[#b5edce]/30 border-2 border-[#3b2a20]/20">
            <div className="space-y-4">
              <div className="flex justify-end">
                {renderStars(rating.rating)}
              </div>

              {rating.comment && (
                <p className="font-saira font-medium text-base text-[#3b2a20] leading-relaxed">
                  "{rating.comment}"
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="h-6 w-6 text-[#3b2a20]" />
                  <span className="font-poppins font-bold text-base text-[#3b2a20]">
                    {rating.profiles?.name || "Anonymous"}
                  </span>
                </div>
                <div className="text-sm text-[#3b2a20]/70 font-medium">
                  {new Date(rating.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Helpful Vote Section */}
              <div className="pt-2 border-t border-[#3b2a20]/10 space-y-2">
                <button
                  onClick={() => handleHelpfulVote(rating.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors",
                    userVotes.has(rating.id)
                      ? "bg-[#5e4338] text-white hover:bg-[#4a3428]"
                      : "bg-[#5e4338]/10 text-[#5e4338] hover:bg-[#5e4338]/20"
                  )}
                >
                  <ThumbsUp className="h-4 w-4" />
                  {userVotes.has(rating.id) ? "Helpful" : "Find Helpful"}
                </button>
                <div className="text-sm text-[#3b2a20]/60">
                  {rating.helpful_votes || 0} people found this helpful
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProductRatingsDisplay;
