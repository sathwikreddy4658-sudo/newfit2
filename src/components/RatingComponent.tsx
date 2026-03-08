import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, auth } from "@/integrations/firebase/auth";
import { createRating, getAllProductRatings } from "@/integrations/firebase/db";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Star, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface RatingComponentProps {
  productId: string;
}

const RatingComponent = ({ productId }: RatingComponentProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [existingRating, setExistingRating] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser ? { id: firebaseUser.uid, email: firebaseUser.email } : null);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && productId) {
      fetchExistingRating();
    }
  }, [user, productId]);

  const fetchExistingRating = async () => {
    if (!user) return;

    // Check if user already has a rating for this product (even if pending)
    try {
      const existingRatings = await getAllProductRatings(productId, false); // false = include unapproved
      const userRating = existingRatings.find((r: any) => r.userId === user.id);
      
      if (userRating) {
        setExistingRating(userRating);
        setRating(userRating.rating || 0);
        setComment(userRating.comment || "");
      }
    } catch (error) {
      console.error("Error fetching existing rating:", error);
    }
  };

  const handleSubmitRating = async () => {
    if (!user) {
      toast({ title: "Please sign in to rate this product", variant: "destructive" });
      return;
    }

    if (rating === 0) {
      toast({ title: "Please select a rating", variant: "destructive" });
      return;
    }

    // Validate rating is 1-5
    if (rating < 1 || rating > 5) {
      toast({ title: "Invalid rating value", variant: "destructive" });
      return;
    }

    // Validate comment length (max 500 characters)
    const cleanComment = comment.trim();
    if (cleanComment.length > 500) {
      toast({ title: "Comment is too long (max 500 characters)", variant: "destructive" });
      return;
    }

    // Prevent duplicate ratings - check if user already has a rating for this product
    if (existingRating && existingRating.id) {
      toast({ title: "You have already rated this product", description: "You can only submit one rating per product", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const ratingData = {
        productId: productId,
        userId: user.id,
        rating,
        comment: cleanComment || null,
        approved: false, // New ratings need admin approval
      };

      // Create rating in Firebase
      const ratingId = await createRating(productId, ratingData);

      toast({ title: "Rating submitted successfully!" });

      // Reset form
      setRating(0);
      setComment("");

      // Refresh existing rating data
      await fetchExistingRating();
    } catch (error: any) {
      toast({ title: "Error submitting rating", description: error.message, variant: "destructive" });
      console.error("Rating submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card className="p-6 bg-white border-2 border-[#5e4338]/20">
        <div className="text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-[#5e4338] mb-4" />
          <h3 className="font-saira font-bold text-lg text-[#5e4338] mb-2">Rate This Product</h3>
          <p className="text-muted-foreground mb-4">Please sign in to leave a rating and comment.</p>
          <Button
            onClick={() => navigate(`/auth?returnTo=${encodeURIComponent(window.location.pathname)}`)}
            className="bg-[#5e4338] hover:bg-[#4a3428] text-white"
          >
            Sign In
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white border-2 border-[#5e4338]/20">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="font-saira font-bold text-xl text-[#5e4338] mb-2">
            {existingRating ? "Update Your Rating" : "Rate This Product"}
          </h3>
        </div>

        {/* Star Rating */}
        <div className="flex justify-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="focus:outline-none"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              style={{
                '--star-opacity-filled': '1',
                '--star-opacity-empty': '0.5',
                '--star-color-filled': (hoverRating || rating) >= star ? 'black' : '#b5edce',
                '--star-color-empty': '#b5edce',
              } as React.CSSProperties}
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-colors",
                  (hoverRating || rating) >= star
                    ? "fill-black text-black"
                    : ""
                )}
                style={{
                  opacity: (hoverRating || rating) >= star ? 1 : 0.5,
                  fill: (hoverRating || rating) >= star ? "black" : "#b5edce",
                  stroke: (hoverRating || rating) >= star ? "black" : "#b5edce",
                  strokeWidth: 1
                }}
              />
            </button>
          ))}
        </div>

        {/* Comment */}
        <div>
          <Textarea
            placeholder="Share your thoughts about this product (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px] resize-none"
            maxLength={500}
          />
          <div className="text-right text-sm text-muted-foreground mt-1">
            {comment.length}/500
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleSubmitRating}
            disabled={loading || rating === 0}
            className="bg-[#5e4338] hover:bg-[#4a3428] text-white px-8 py-2"
          >
            {loading ? "Submitting..." : existingRating ? "Update Rating" : "Submit Rating"}
          </Button>
        </div>

        {existingRating && (
          <div className="text-center text-sm text-muted-foreground">
            Status: {existingRating.approved ? "Approved" : "Pending Approval"}
          </div>
        )}
      </div>
    </Card>
  );
};

export default RatingComponent;
