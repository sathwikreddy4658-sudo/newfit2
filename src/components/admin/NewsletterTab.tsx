import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Trash2, Mail } from "lucide-react";

const NewsletterTab = () => {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast({ title: "Error fetching subscribers", variant: "destructive" });
      } else {
        setSubscribers(data || []);
      }
    } catch (error) {
      toast({ title: "Error fetching subscribers", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from the newsletter?`)) return;

    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .delete()
        .eq("id", id);

      if (error) {
        toast({ title: "Deletion failed", variant: "destructive" });
      } else {
        toast({ title: "Subscriber removed successfully" });
        fetchSubscribers();
      }
    } catch (error) {
      toast({ title: "Deletion failed", variant: "destructive" });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading subscribers...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Newsletter Subscribers</h2>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>{subscribers.length} subscribers</span>
        </div>
      </div>

      {subscribers.length === 0 ? (
        <Card className="p-8 text-center">
          <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No subscribers yet</h3>
          <p className="text-muted-foreground">
            Newsletter subscribers will appear here once people sign up from the footer.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {subscribers.map((subscriber) => (
            <Card key={subscriber.id} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{subscriber.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Subscribed on {formatDate(subscriber.created_at)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(subscriber.id, subscriber.email)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsletterTab;
