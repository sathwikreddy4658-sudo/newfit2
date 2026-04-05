import { useEffect, useState } from "react";
import { getAllRatingsAcrossProducts, updateRating, deleteRating } from "@/integrations/firebase/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Star, Eye, Trash2, Check, X, Edit } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Rating {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string | null;
  createdAt: any;
  approved: boolean | null;
}

const CustomerRatingsTab = () => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [editingRating, setEditingRating] = useState<Rating | null>(null);
  const [editedComment, setEditedComment] = useState("");

  useEffect(() => {
    fetchRatings();
  }, [filter]);

  const fetchRatings = async () => {
    setLoading(true);
    try {
      const data = await getAllRatingsAcrossProducts(filter);
      setRatings(data as Rating[]);
    } catch (error: any) {
      toast({ title: "Error fetching ratings", variant: "destructive" });
      console.error("Error fetching ratings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (rating: Rating) => {
    try {
      await updateRating(rating.productId, rating.id, { approved: true });
      toast({ title: "Rating approved successfully" });
      fetchRatings();
    } catch (error: any) {
      toast({ title: "Error approving rating", variant: "destructive" });
      console.error("Error approving rating:", error);
    }
  };

  const handleReject = async (rating: Rating) => {
    try {
      await updateRating(rating.productId, rating.id, { approved: false });
      toast({ title: "Rating rejected" });
      fetchRatings();
    } catch (error: any) {
      toast({ title: "Error rejecting rating", variant: "destructive" });
      console.error("Error rejecting rating:", error);
    }
  };

  const handleDelete = async (rating: Rating) => {
    if (!confirm("Are you sure you want to delete this rating?")) return;

    try {
      await deleteRating(rating.productId, rating.id);
      toast({ title: "Rating deleted successfully" });
      fetchRatings();
    } catch (error: any) {
      toast({ title: "Error deleting rating", variant: "destructive" });
      console.error("Error deleting rating:", error);
    }
  };

  const handleEdit = (rating: Rating) => {
    setEditingRating(rating);
    setEditedComment(rating.comment || "");
  };

  const handleSaveEdit = async () => {
    if (!editingRating) return;

    try {
      await updateRating(editingRating.productId, editingRating.id, { comment: editedComment });
      toast({ title: "Rating comment updated successfully" });
      setEditingRating(null);
      setEditedComment("");
      fetchRatings();
    } catch (error: any) {
      toast({ title: "Error updating rating comment", variant: "destructive" });
      console.error("Error updating rating comment:", error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-4 w-4",
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            )}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading ratings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Customer Ratings</h2>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            size="sm"
          >
            All ({ratings.length})
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
            size="sm"
          >
            Pending ({ratings.filter(r => !r.approved).length})
          </Button>
          <Button
            variant={filter === "approved" ? "default" : "outline"}
            onClick={() => setFilter("approved")}
            size="sm"
          >
            Approved ({ratings.filter(r => r.approved).length})
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {ratings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No ratings found</p>
              </CardContent>
            </Card>
          ) : (
            ratings.map((rating) => (
              <Card key={rating.id} className="relative">
                <CardHeader className="pb-3">
                  <div>
                    <div className="flex justify-between items-start gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg">{rating.productName}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-muted-foreground">
                            By: <span className="font-medium text-foreground">{rating.userName || rating.userId}</span>
                          </span>
                          <Badge variant={rating.approved ? "default" : "secondary"}>
                            {rating.approved ? "Approved" : "Pending"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Email: <span className="font-medium text-foreground">{rating.userEmail}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(rating.rating)}
                          <span className="text-sm text-muted-foreground">
                            {new Date(rating.createdAt?.toMillis?.() || rating.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {!rating.approved && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(rating)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(rating)}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(rating)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Rating Comment</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Textarea
                              value={editedComment}
                              onChange={(e) => setEditedComment(e.target.value)}
                              placeholder="Edit the rating comment..."
                              rows={4}
                            />
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setEditingRating(null);
                                  setEditedComment("");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button onClick={handleSaveEdit}>
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(rating)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {rating.comment && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground italic">
                      "{rating.comment}"
                    </p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CustomerRatingsTab;
