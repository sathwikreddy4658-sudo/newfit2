import { useEffect, useState } from "react";
import { 
  getAllNewsletterSubscribers, 
  deleteNewsletterSubscriber 
} from "@/integrations/firebase/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Trash2, Mail, Download } from "lucide-react";

const NewsletterTab = () => {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState<any[]>([]);
  const [selectedSubscribers, setSelectedSubscribers] = useState<Set<string>>(new Set());
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  useEffect(() => {
    filterSubscribersByDate();
  }, [subscribers, fromDate, toDate]);

  const filterSubscribersByDate = () => {
    let filtered = [...subscribers];

    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      filtered = filtered.filter(sub => {
        const subDate = sub.createdAt?.toDate?.() || new Date(sub.createdAt);
        return subDate >= from;
      });
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(sub => {
        const subDate = sub.createdAt?.toDate?.() || new Date(sub.createdAt);
        return subDate <= to;
      });
    }

    setFilteredSubscribers(filtered);
    // Clear selections when filter changes
    setSelectedSubscribers(new Set());
  };

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const data = await getAllNewsletterSubscribers();
      setSubscribers(data || []);
      setFilteredSubscribers(data || []);
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      toast.error("Error fetching subscribers");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from the newsletter?`)) return;

    try {
      await deleteNewsletterSubscriber(id);
      toast.success("Subscriber removed successfully");
      fetchSubscribers();
    } catch (error) {
      console.error("Error deleting subscriber:", error);
      toast.error("Deletion failed");
    }
  };

  const toggleSelectSubscriber = (id: string) => {
    const newSelected = new Set(selectedSubscribers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSubscribers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedSubscribers.size === filteredSubscribers.length) {
      setSelectedSubscribers(new Set());
    } else {
      setSelectedSubscribers(new Set(filteredSubscribers.map(s => s.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedSubscribers.size === 0) {
      toast.error("No subscribers selected");
      return;
    }

    const confirmed = confirm(
      `⚠️ WARNING: You are about to delete ${selectedSubscribers.size} selected subscriber(s)!\n\n` +
      `This action cannot be undone. Continue?`
    );

    if (!confirmed) return;

    toast.loading("Deleting selected subscribers...");

    try {
      const subscriberIds = Array.from(selectedSubscribers);
      await Promise.all(
        subscriberIds.map(id => deleteNewsletterSubscriber(id))
      );

      toast.success(`${selectedSubscribers.size} subscriber(s) have been removed`);
      setSelectedSubscribers(new Set());
      fetchSubscribers();
    } catch (error: any) {
      console.error("Error deleting subscribers:", error);
      toast.error("Failed to delete subscribers");
    }
  };

  const handleDownloadCSV = () => {
    const subscribersToExport = selectedSubscribers.size > 0 
      ? filteredSubscribers.filter(s => selectedSubscribers.has(s.id))
      : filteredSubscribers;

    if (subscribersToExport.length === 0) {
      toast.error("No subscribers to download");
      return;
    }

    // Create CSV content
    const csvHeaders = "Email,Source,Subscribed Date\n";
    const csvRows = subscribersToExport.map(subscriber => {
      const subDate = subscriber.createdAt?.toDate?.() || new Date(subscriber.createdAt);
      return `"${subscriber.email}","${subscriber.source || 'footer'}","${subDate.toLocaleDateString()}"`;
    }).join("\n");

    const csvContent = csvHeaders + csvRows;

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`${subscribersToExport.length} subscriber(s) exported`);
  };

  const formatDate = (firebaseTimestamp: any) => {
    try {
      const date = firebaseTimestamp?.toDate?.() || new Date(firebaseTimestamp);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading subscribers...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Newsletter Subscribers</h2>
        <div className="flex items-center gap-2">
          {selectedSubscribers.size > 0 && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDeleteSelected}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedSubscribers.size})
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadCSV}
            disabled={filteredSubscribers.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download CSV {selectedSubscribers.size > 0 && `(${selectedSubscribers.size})`}
          </Button>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{filteredSubscribers.length} subscriber{filteredSubscribers.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Date Filter Section */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">From:</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">To:</label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-40"
            />
          </div>
          {(fromDate || toDate) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
            >
              Clear Filters
            </Button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Checkbox
              id="select-all-subs"
              checked={selectedSubscribers.size === filteredSubscribers.length && filteredSubscribers.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <label htmlFor="select-all-subs" className="text-sm font-medium cursor-pointer">
              Select All ({filteredSubscribers.length})
            </label>
          </div>
        </div>
      </Card>

      {filteredSubscribers.length === 0 ? (
        <Card className="p-8 text-center">
          <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">
            {fromDate || toDate ? "No subscribers found" : "No subscribers yet"}
          </h3>
          <p className="text-muted-foreground">
            {fromDate || toDate 
              ? "No subscribers found in the selected date range"
              : "Newsletter subscribers will appear here once people sign up from the footer."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredSubscribers.map((subscriber) => {
            const isSelected = selectedSubscribers.has(subscriber.id);
            
            return (
              <Card key={subscriber.id} className="p-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelectSubscriber(subscriber.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{subscriber.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Subscribed on {formatDate(subscriber.createdAt)}
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NewsletterTab;
