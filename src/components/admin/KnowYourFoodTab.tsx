import { useState, useEffect } from "react";
import {
  getKYFLinksForSection,
  createKYFLink,
  updateKYFLink,
  deleteKYFLink,
} from "@/integrations/firebase/db";
import { KYF_SECTIONS } from "@/config/kyfSections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";

interface KYFLink {
  id?: string;
  sectionId: string;
  subsectionId: string;
  title: string;
  url: string;
  order: number;
  createdAt?: any;
  updatedAt?: any;
}

const KnowYourFoodTab = () => {
  const [links, setLinks] = useState<KYFLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("how-to-read");
  const [activeSubsection, setActiveSubsection] = useState("nutrition");
  const [editingLink, setEditingLink] = useState<KYFLink | null>(null);
  const [formData, setFormData] = useState({ title: "", url: "" });
  const [showForm, setShowForm] = useState(false);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const data = await getKYFLinksForSection(activeSection);
      setLinks(data || []);
    } catch (error) {
      console.error("Error fetching KYF links:", error);
      toast.error("Failed to fetch KYF links");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [activeSection]);

  const currentSubsectionLinks = links.filter(
    (link) => link.subsectionId === activeSubsection
  );

  const handleAddLink = () => {
    setEditingLink(null);
    setFormData({ title: "", url: "" });
    setShowForm(true);
  };

  const handleEditLink = (link: KYFLink) => {
    setEditingLink(link);
    setFormData({ title: link.title, url: link.url });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Link title is required");
      return;
    }

    if (!formData.url.trim()) {
      toast.error("URL is required");
      return;
    }

    // Validate URL format
    try {
      new URL(formData.url);
    } catch {
      toast.error("Invalid URL format");
      return;
    }

    try {
      if (editingLink) {
        await updateKYFLink(editingLink.id!, {
          title: formData.title,
          url: formData.url,
        });
        toast.success("Link updated successfully");
      } else {
        await createKYFLink({
          sectionId: activeSection,
          subsectionId: activeSubsection,
          title: formData.title,
          url: formData.url,
          order: currentSubsectionLinks.length,
        });
        toast.success("Link added successfully");
      }
      setShowForm(false);
      setFormData({ title: "", url: "" });
      await fetchLinks();
    } catch (error) {
      console.error("Error saving KYF link:", error);
      toast.error("Failed to save link");
    }
  };

  const handleDeleteLink = async (link: KYFLink) => {
    if (!confirm(`Delete link "${link.title}"?`)) return;

    try {
      await deleteKYFLink(link.id!);
      toast.success("Link deleted successfully");
      await fetchLinks();
    } catch (error) {
      console.error("Error deleting KYF link:", error);
      toast.error("Failed to delete link");
    }
  };

  const currentSection = KYF_SECTIONS.find((s) => s.id === activeSection);
  const subsectionOptions = currentSection?.subsections || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Know Your Food - Manage Links</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeSection} onValueChange={setActiveSection}>
            <TabsList className="grid w-full grid-cols-3">
              {KYF_SECTIONS.map((section) => (
                <TabsTrigger key={section.id} value={section.id}>
                  {section.name.substring(0, 15)}...
                </TabsTrigger>
              ))}
            </TabsList>

            {KYF_SECTIONS.map((section) => (
              <TabsContent key={section.id} value={section.id}>
                {/* Subsection Selector */}
                <div className="mb-6">
                  <Label className="mb-2 block font-semibold">Select Subsection</Label>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {section.subsections.map((sub) => (
                      <Button
                        key={sub.id}
                        variant={activeSubsection === sub.id ? "default" : "outline"}
                        onClick={() => setActiveSubsection(sub.id)}
                        className="text-sm"
                      >
                        {sub.name.substring(0, 12)}...
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Links Display and Management */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      {
                        section.subsections.find((s) => s.id === activeSubsection)
                          ?.name
                      }
                    </h3>
                    {!showForm && (
                      <Button
                        onClick={handleAddLink}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Link
                      </Button>
                    )}
                  </div>

                  {/* Add/Edit Form */}
                  {showForm && (
                    <Card className="bg-blue-50">
                      <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="title">Link Title</Label>
                            <Input
                              id="title"
                              type="text"
                              placeholder="e.g., Learn about nutrition labels"
                              value={formData.title}
                              onChange={(e) =>
                                setFormData({ ...formData, title: e.target.value })
                              }
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="url">URL</Label>
                            <Input
                              id="url"
                              type="url"
                              placeholder="https://example.com"
                              value={formData.url}
                              onChange={(e) =>
                                setFormData({ ...formData, url: e.target.value })
                              }
                              className="mt-1"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="submit"
                              className="flex items-center gap-2"
                            >
                              <Save className="h-4 w-4" />
                              {editingLink ? "Update" : "Create"} Link
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowForm(false);
                                setEditingLink(null);
                              }}
                              className="flex items-center gap-2"
                            >
                              <X className="h-4 w-4" />
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {/* Links List */}
                  <div className="space-y-2">
                    {currentSubsectionLinks.length === 0 ? (
                      <p className="text-gray-500">
                        No links for this subsection yet.
                      </p>
                    ) : (
                      currentSubsectionLinks
                        .sort((a, b) => a.order - b.order)
                        .map((link) => (
                          <Card key={link.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-4 pb-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold truncate">{link.title}</h4>
                                  <p className="text-sm text-gray-600 truncate overflow-ellipsis">
                                    {link.url}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditLink(link)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteLink(link)}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                    )}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowYourFoodTab;
