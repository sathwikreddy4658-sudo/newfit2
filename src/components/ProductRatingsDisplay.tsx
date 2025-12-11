import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Star, User, ThumbsUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

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

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {ratings.map((rating) => {
          const isLongComment = rating.comment && rating.comment.length > 150;
          return (
            <Card key={rating.id} className="p-4 sm:p-6 bg-[#b5edce]/30 border-2 border-[#3b2a20]/20 flex flex-col h-full">
              <div className="space-y-4 flex-1">
                <div className="flex justify-end">
                  {renderStars(rating.rating)}
                </div>

                {rating.comment && (
                  <div className="space-y-2">
                    <p className={cn(
                      "font-saira font-medium text-sm sm:text-base text-[#3b2a20] leading-relaxed",
                      isLongComment && "line-clamp-3"
                    )}>
                      "{rating.comment}"
                    </p>
                    {isLongComment && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="text-[#5e4338] hover:text-[#4a3428] font-semibold text-sm">
                            Read Full Review
                          </button>
                        </DialogTrigger>
                        <DialogContent className="w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                          <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                              <div className="flex-1">
                                <div className="flex justify-start mb-2">
                                  {renderStars(rating.rating)}
                                </div>
                                <p className="font-poppins font-bold text-sm sm:text-base text-[#3b2a20] mb-1">
                                  {rating.profiles?.name || "Anonymous"}
                                </p>
                                <p className="text-xs sm:text-sm text-[#3b2a20]/70">
                                  {new Date(rating.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <p className="font-saira font-medium text-sm sm:text-base text-[#3b2a20] leading-relaxed break-words whitespace-pre-wrap">
                              {rating.comment}
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <User className="h-5 sm:h-6 w-5 sm:w-6 text-[#3b2a20] flex-shrink-0" />
                    <span className="font-poppins font-bold text-xs sm:text-base text-[#3b2a20] truncate">
                      {rating.profiles?.name || "Anonymous"}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-[#3b2a20]/70 font-medium whitespace-nowrap">
                    {new Date(rating.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Helpful Vote Section */}
                <div className="pt-2 border-t border-[#3b2a20]/10 space-y-2">
                  <button
                    onClick={() => handleHelpfulVote(rating.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto justify-center sm:justify-start",
                      userVotes.has(rating.id)
                        ? "bg-[#5e4338] text-white hover:bg-[#4a3428]"
                        : "bg-[#5e4338]/10 text-[#5e4338] hover:bg-[#5e4338]/20"
                    )}
                  >
                    <ThumbsUp className="h-3 sm:h-4 w-3 sm:w-4" />
                    {userVotes.has(rating.id) ? "Helpful" : "Find Helpful"}
                  </button>
                  <div className="text-xs sm:text-sm text-[#3b2a20]/60">
                    {rating.helpful_votes || 0} people found this helpful
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ProductRatingsDisplay;
