import { useState, useEffect } from "react";
import {
  getKYFLinksForSection,
  createKYFLink,
  updateKYFLink,
  deleteKYFLink,
  getKYFItems,
  upsertKYFItem,
  deleteKYFItem,
  getINSDefinitions,
  upsertINSDefinition,
  deleteINSDefinition,
  type KYFItemContent,
  type INSDefinitionEntry,
} from "@/integrations/firebase/db";
import { KYF_SECTIONS } from "@/config/kyfSections";
import {
  DEFAULT_SECTIONS,
  DEFAULT_COMMON_WORDS,
  DEFAULT_INGREDIENT_TERMS,
} from "@/config/kyfDefaults";
import { INS_NUMBERS } from "@/data/insNumbers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Save, X, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────
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

interface EditableItem {
  itemId: string;
  group: string;
  title: string;
  points: string[];
}

// ── Static helpers ────────────────────────────────────────────────────────────
const ALL_DEFAULT_ITEMS = [
  ...DEFAULT_SECTIONS.map(s => ({ itemId: s.id, group: "how-to-read", title: s.title, points: s.points })),
  ...DEFAULT_COMMON_WORDS.map(w => ({ itemId: w.id, group: "common-words", title: w.term, points: w.points })),
  ...DEFAULT_INGREDIENT_TERMS.map(t => ({ itemId: t.id, group: "ingredient-terms", title: t.term, points: t.points })),
];

const GROUP_LABELS: Record<string, string> = {
  "how-to-read": "How To Read A Food Pack",
  "common-words": "Common Words On Food Packs",
  "ingredient-terms": "Ingredient Terms & Additives",
};

// ── Component ─────────────────────────────────────────────────────────────────
const KnowYourFoodTab = () => {
  // ── Links state ──────────────────────────────────────────────────────────
  const [links, setLinks] = useState<KYFLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [activeLinkSection, setActiveLinkSection] = useState("how-to-read");
  const [activeSubsection, setActiveSubsection] = useState("nutrition");
  const [editingLink, setEditingLink] = useState<KYFLink | null>(null);
  const [linkFormData, setLinkFormData] = useState({ title: "", url: "" });
  const [showLinkForm, setShowLinkForm] = useState(false);

  // ── Page Content state ───────────────────────────────────────────────────
  const [dbItems, setDbItems] = useState<KYFItemContent[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [activeGroup, setActiveGroup] = useState("how-to-read");
  const [editingItem, setEditingItem] = useState<EditableItem | null>(null);

  // ── INS state ────────────────────────────────────────────────────────────
  const [insDbDefs, setInsDbDefs] = useState<INSDefinitionEntry[]>([]);
  const [insLoading, setInsLoading] = useState(false);
  const [insSearch, setInsSearch] = useState("");
  const [insCategory, setInsCategory] = useState("all");
  const [editingInsDef, setEditingInsDef] = useState<{ number: string; name: string; definition: string } | null>(null);

  // ── Fetch helpers ─────────────────────────────────────────────────────────
  const fetchLinks = async () => {
    try {
      setLinksLoading(true);
      const data = await getKYFLinksForSection(activeLinkSection);
      setLinks(data || []);
    } catch {
      toast.error("Failed to fetch KYF links");
    } finally {
      setLinksLoading(false);
    }
  };

  const fetchContent = async () => {
    try {
      setContentLoading(true);
      const data = await getKYFItems();
      setDbItems(data);
    } catch {
      toast.error("Failed to fetch page content");
    } finally {
      setContentLoading(false);
    }
  };

  const fetchInsDefs = async () => {
    try {
      setInsLoading(true);
      const data = await getINSDefinitions();
      setInsDbDefs(data);
    } catch {
      toast.error("Failed to fetch INS definitions");
    } finally {
      setInsLoading(false);
    }
  };

  useEffect(() => { fetchLinks(); }, [activeLinkSection]);
  useEffect(() => { fetchContent(); fetchInsDefs(); }, []);

  // ── Computed: merged page content ─────────────────────────────────────────
  const overrideMap = new Map(dbItems.map(item => [item.itemId, item]));
  const mergedItems = ALL_DEFAULT_ITEMS.map(item => {
    const ov = overrideMap.get(item.itemId);
    return {
      ...item,
      title: ov?.title ?? item.title,
      points: ov?.points ?? item.points,
      hasOverride: !!ov,
    };
  });
  const groupItems = mergedItems.filter(item => item.group === activeGroup);

  // ── Computed: merged INS ──────────────────────────────────────────────────
  const insDefMap = new Map(insDbDefs.map(d => [d.number, d.definition]));
  const insCategories = Array.from(new Set(INS_NUMBERS.map(e => e.category))).sort();
  const filteredINS = INS_NUMBERS.filter(entry => {
    const q = insSearch.toLowerCase();
    return (
      (!q || entry.number.toLowerCase().includes(q) || entry.name.toLowerCase().includes(q)) &&
      (insCategory === "all" || entry.category === insCategory)
    );
  }).map(entry => ({
    ...entry,
    resolvedDefinition: insDefMap.get(entry.number) ?? entry.definition ?? "",
    hasOverride: insDefMap.has(entry.number),
  }));

  // ── Links handlers ────────────────────────────────────────────────────────
  const currentSubsectionLinks = links.filter(l => l.subsectionId === activeSubsection);

  const handleAddLink = () => {
    setEditingLink(null);
    setLinkFormData({ title: "", url: "" });
    setShowLinkForm(true);
  };

  const handleEditLink = (link: KYFLink) => {
    setEditingLink(link);
    setLinkFormData({ title: link.title, url: link.url });
    setShowLinkForm(true);
  };

  const handleSubmitLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkFormData.title.trim()) { toast.error("Link title is required"); return; }
    if (!linkFormData.url.trim()) { toast.error("URL is required"); return; }
    try { new URL(linkFormData.url); } catch { toast.error("Invalid URL format"); return; }
    try {
      if (editingLink) {
        await updateKYFLink(editingLink.id!, { title: linkFormData.title, url: linkFormData.url });
        toast.success("Link updated successfully");
      } else {
        await createKYFLink({
          sectionId: activeLinkSection,
          subsectionId: activeSubsection,
          title: linkFormData.title,
          url: linkFormData.url,
          order: currentSubsectionLinks.length,
        });
        toast.success("Link added successfully");
      }
      setShowLinkForm(false);
      setLinkFormData({ title: "", url: "" });
      await fetchLinks();
    } catch {
      toast.error("Failed to save link");
    }
  };

  const handleDeleteLink = async (link: KYFLink) => {
    if (!confirm(`Delete link "${link.title}"?`)) return;
    try {
      await deleteKYFLink(link.id!);
      toast.success("Link deleted successfully");
      await fetchLinks();
    } catch {
      toast.error("Failed to delete link");
    }
  };

  // ── Page Content handlers ─────────────────────────────────────────────────
  const handleEditItem = (item: typeof mergedItems[0]) => {
    setEditingItem({ itemId: item.itemId, group: item.group, title: item.title, points: [...item.points] });
  };

  const handleSaveItem = async () => {
    if (!editingItem) return;
    try {
      await upsertKYFItem(editingItem.itemId, {
        itemId: editingItem.itemId,
        group: editingItem.group,
        title: editingItem.title.trim(),
        points: editingItem.points.filter(p => p.trim()),
      });
      toast.success("Content saved successfully");
      setEditingItem(null);
      await fetchContent();
    } catch {
      toast.error("Failed to save content");
    }
  };

  const handleResetItem = async (itemId: string) => {
    if (!confirm("Reset this item to its default content?")) return;
    try {
      await deleteKYFItem(itemId);
      toast.success("Item reset to default");
      await fetchContent();
    } catch {
      toast.error("Failed to reset item");
    }
  };

  const updatePoint = (idx: number, val: string) => {
    if (!editingItem) return;
    const pts = [...editingItem.points];
    pts[idx] = val;
    setEditingItem({ ...editingItem, points: pts });
  };

  const addPoint = () =>
    editingItem && setEditingItem({ ...editingItem, points: [...editingItem.points, ""] });

  const removePoint = (idx: number) =>
    editingItem && setEditingItem({ ...editingItem, points: editingItem.points.filter((_, i) => i !== idx) });

  // ── INS handlers ──────────────────────────────────────────────────────────
  const handleEditInsDef = (entry: typeof filteredINS[0]) => {
    setEditingInsDef({ number: entry.number, name: entry.name, definition: entry.resolvedDefinition });
  };

  const handleSaveInsDef = async () => {
    if (!editingInsDef) return;
    try {
      await upsertINSDefinition(editingInsDef.number, editingInsDef.definition);
      toast.success("Definition saved");
      setEditingInsDef(null);
      await fetchInsDefs();
    } catch {
      toast.error("Failed to save definition");
    }
  };

  const handleResetInsDef = async (number: string) => {
    if (!confirm("Remove custom definition? The default definition will be shown.")) return;
    try {
      await deleteINSDefinition(number);
      toast.success("Definition reset to default");
      await fetchInsDefs();
    } catch {
      toast.error("Failed to reset definition");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Know Your Food</h2>
        <p className="text-gray-500 mt-1">Manage content for the Know Your Food page</p>
      </div>

      <Tabs defaultValue="content" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Page Content</TabsTrigger>
          <TabsTrigger value="ins">INS Numbers</TabsTrigger>
          <TabsTrigger value="links">External Links</TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════
            TAB: Page Content
        ═══════════════════════════════════════════════ */}
        <TabsContent value="content" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {Object.entries(GROUP_LABELS).map(([key, label]) => (
              <Button
                key={key}
                variant={activeGroup === key ? "default" : "outline"}
                onClick={() => { setActiveGroup(key); setEditingItem(null); }}
                size="sm"
              >
                {label}
              </Button>
            ))}
          </div>

          {contentLoading ? (
            <p className="text-gray-500">Loading…</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {groupItems.map(item => (
                <Card key={item.itemId}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
                      <Badge variant={item.hasOverride ? "default" : "secondary"} className="shrink-0 text-xs">
                        {item.hasOverride ? "DB Override" : "Code Default"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {editingItem?.itemId === item.itemId ? (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs font-medium">Title</Label>
                          <Input
                            value={editingItem.title}
                            onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Bullet Points</Label>
                          {editingItem.points.map((pt, i) => (
                            <div key={i} className="flex gap-2">
                              <Input
                                value={pt}
                                onChange={e => updatePoint(i, e.target.value)}
                                placeholder={`Point ${i + 1}`}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removePoint(i)}
                                className="shrink-0 text-red-500 hover:text-red-600"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={addPoint} className="flex items-center gap-1">
                            <Plus className="h-3 w-3" /> Add Point
                          </Button>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" onClick={handleSaveItem} className="flex items-center gap-1">
                            <Save className="h-3 w-3" /> Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingItem(null)} className="flex items-center gap-1">
                            <X className="h-3 w-3" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                          {item.points.slice(0, 3).map((pt, i) => <li key={i}>{pt}</li>)}
                          {item.points.length > 3 && (
                            <li className="text-gray-400">+{item.points.length - 3} more…</li>
                          )}
                        </ul>
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" variant="outline" onClick={() => handleEditItem(item)} className="flex items-center gap-1">
                            <Edit className="h-3 w-3" /> Edit
                          </Button>
                          {item.hasOverride && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleResetItem(item.itemId)}
                              className="flex items-center gap-1 text-amber-600 hover:text-amber-700"
                            >
                              <RotateCcw className="h-3 w-3" /> Reset to Default
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════
            TAB: INS Numbers
        ═══════════════════════════════════════════════ */}
        <TabsContent value="ins" className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by number or name…"
                value={insSearch}
                onChange={e => setInsSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={insCategory} onValueChange={setInsCategory}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {insCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-gray-500">{filteredINS.length} entries</p>

          {insLoading ? (
            <p className="text-gray-500">Loading…</p>
          ) : (
            <div className="space-y-2">
              {filteredINS.map(entry => (
                <Card key={entry.number}>
                  <CardContent className="pt-4 pb-4">
                    {editingInsDef?.number === entry.number ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge variant="outline" className="font-mono text-sm">INS {entry.number}</Badge>
                          <span className="font-semibold">{entry.name}</span>
                          <Badge variant="secondary" className="text-xs">{entry.category}</Badge>
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Definition</Label>
                          <Textarea
                            value={editingInsDef.definition}
                            onChange={e => setEditingInsDef({ ...editingInsDef, definition: e.target.value })}
                            rows={3}
                            className="mt-1"
                            placeholder="Describe what this additive is and what it's used for…"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveInsDef} className="flex items-center gap-1">
                            <Save className="h-3 w-3" /> Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingInsDef(null)} className="flex items-center gap-1">
                            <X className="h-3 w-3" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge variant="outline" className="font-mono text-sm">INS {entry.number}</Badge>
                            <span className="font-semibold">{entry.name}</span>
                            <Badge variant="secondary" className="text-xs">{entry.category}</Badge>
                            {entry.hasOverride && (
                              <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
                                Custom
                              </Badge>
                            )}
                          </div>
                          {entry.resolvedDefinition ? (
                            <p className="text-sm text-gray-600 leading-relaxed">{entry.resolvedDefinition}</p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">No definition set</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditInsDef(entry)}
                            className="flex items-center gap-1 h-8"
                          >
                            <Edit className="h-3 w-3" /> Edit
                          </Button>
                          {entry.hasOverride && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleResetInsDef(entry.number)}
                              className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700"
                              title="Reset to default"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════
            TAB: External Links
        ═══════════════════════════════════════════════ */}
        <TabsContent value="links">
          <Card>
            <CardHeader>
              <CardTitle>External Links</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeLinkSection}
                onValueChange={v => { setActiveLinkSection(v); setShowLinkForm(false); }}
              >
                <TabsList className="grid w-full grid-cols-3">
                  {KYF_SECTIONS.map(section => (
                    <TabsTrigger key={section.id} value={section.id}>
                      {section.name.substring(0, 15)}…
                    </TabsTrigger>
                  ))}
                </TabsList>

                {KYF_SECTIONS.map(section => (
                  <TabsContent key={section.id} value={section.id}>
                    {/* Subsection selector */}
                    <div className="mb-6">
                      <Label className="mb-2 block font-semibold">Select Subsection</Label>
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                        {section.subsections.map(sub => (
                          <Button
                            key={sub.id}
                            variant={activeSubsection === sub.id ? "default" : "outline"}
                            onClick={() => setActiveSubsection(sub.id)}
                            className="text-sm"
                          >
                            {sub.name.substring(0, 12)}…
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Links list + form */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">
                          {section.subsections.find(s => s.id === activeSubsection)?.name}
                        </h3>
                        {!showLinkForm && (
                          <Button onClick={handleAddLink} className="flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Add Link
                          </Button>
                        )}
                      </div>

                      {showLinkForm && (
                        <Card className="bg-blue-50">
                          <CardContent className="pt-6">
                            <form onSubmit={handleSubmitLink} className="space-y-4">
                              <div>
                                <Label htmlFor="link-title">Link Title</Label>
                                <Input
                                  id="link-title"
                                  placeholder="e.g., Learn about nutrition labels"
                                  value={linkFormData.title}
                                  onChange={e => setLinkFormData({ ...linkFormData, title: e.target.value })}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="link-url">URL</Label>
                                <Input
                                  id="link-url"
                                  type="url"
                                  placeholder="https://example.com"
                                  value={linkFormData.url}
                                  onChange={e => setLinkFormData({ ...linkFormData, url: e.target.value })}
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button type="submit" className="flex items-center gap-2">
                                  <Save className="h-4 w-4" />
                                  {editingLink ? "Update" : "Create"} Link
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => { setShowLinkForm(false); setEditingLink(null); }}
                                  className="flex items-center gap-2"
                                >
                                  <X className="h-4 w-4" /> Cancel
                                </Button>
                              </div>
                            </form>
                          </CardContent>
                        </Card>
                      )}

                      <div className="space-y-2">
                        {currentSubsectionLinks.length === 0 ? (
                          <p className="text-gray-500">No links for this subsection yet.</p>
                        ) : (
                          currentSubsectionLinks
                            .sort((a, b) => a.order - b.order)
                            .map(link => (
                              <Card key={link.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="pt-4 pb-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold truncate">{link.title}</h4>
                                      <p className="text-sm text-gray-600 truncate">{link.url}</p>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KnowYourFoodTab;
