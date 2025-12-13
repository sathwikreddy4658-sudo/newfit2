import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Upload, X, Plus, Save } from "lucide-react";

interface ContentSection {
  type: 'heading' | 'paragraph';
  text: string;
}

const BLOG_DRAFT_KEY = 'blog_draft_data';
const BLOG_CONTENT_DRAFT_KEY = 'blog_content_sections';

const BlogsTab = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [contentSections, setContentSections] = useState<ContentSection[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    image_url: "",
  });
  const [draftSaved, setDraftSaved] = useState(false);
  const saveDraftTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Auto-save draft on form changes
  useEffect(() => {
    if (showDialog && (formData.title || contentSections.length > 0)) {
      if (saveDraftTimeoutRef.current) {
        clearTimeout(saveDraftTimeoutRef.current);
      }
      
      saveDraftTimeoutRef.current = setTimeout(() => {
        localStorage.setItem(BLOG_DRAFT_KEY, JSON.stringify(formData));
        localStorage.setItem(BLOG_CONTENT_DRAFT_KEY, JSON.stringify(contentSections));
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
      }, 1000);
    }

    return () => {
      if (saveDraftTimeoutRef.current) {
        clearTimeout(saveDraftTimeoutRef.current);
      }
    };
  }, [formData, contentSections, showDialog]);

  // Load draft when dialog opens
  useEffect(() => {
    if (showDialog && !editingBlog) {
      const savedDraft = localStorage.getItem(BLOG_DRAFT_KEY);
      const savedContent = localStorage.getItem(BLOG_CONTENT_DRAFT_KEY);
      
      if (savedDraft) {
        setFormData(JSON.parse(savedDraft));
      }
      if (savedContent) {
        setContentSections(JSON.parse(savedContent));
      }
    }
  }, [showDialog, editingBlog]);

  const fetchBlogs = async () => {
    const { data } = await supabase
      .from("blogs")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setBlogs(data);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      image_url: "",
    });
    setContentSections([]);
    setEditingBlog(null);
    setImageFile(null);
    localStorage.removeItem(BLOG_DRAFT_KEY);
    localStorage.removeItem(BLOG_CONTENT_DRAFT_KEY);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `blog-${Date.now()}-${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    
    if (contentSections.length === 0) {
      toast({ title: "Add at least one section (heading or paragraph)", variant: "destructive" });
      return;
    }

    setUploadingImage(true);

    try {
      let imageUrl = formData.image_url;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile) || "";
      }

      // Convert sections to JSON string
      const contentJson = JSON.stringify(contentSections);

      const blogData = {
        title: formData.title,
        content: contentJson,
        image_url: imageUrl,
      };

      if (editingBlog) {
        const { error } = await supabase
          .from("blogs")
          .update(blogData)
          .eq("id", editingBlog.id);

        if (error) {
          toast({ title: "Update failed", variant: "destructive" });
        } else {
          toast({ title: "Blog updated successfully" });
          setShowDialog(false);
          resetForm();
          fetchBlogs();
        }
      } else {
        const { error } = await supabase
          .from("blogs")
          .insert([blogData]);

        if (error) {
          toast({ title: "Creation failed", variant: "destructive" });
        } else {
          toast({ title: "Blog created successfully" });
          setShowDialog(false);
          resetForm();
          fetchBlogs();
        }
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEdit = (blog: any) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      image_url: blog.image_url || "",
    });
    
    // Parse content - handle both JSON and plain text for backward compatibility
    try {
      const parsed = JSON.parse(blog.content);
      if (Array.isArray(parsed)) {
        setContentSections(parsed);
      } else {
        // Old format - convert to new format
        setContentSections([{ type: 'paragraph', text: blog.content }]);
      }
    } catch {
      // Plain text fallback
      setContentSections([{ type: 'paragraph', text: blog.content }]);
    }
    
    setImageFile(null);
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;

    const { error } = await supabase.from("blogs").delete().eq("id", id);

    if (error) {
      toast({ title: "Deletion failed", variant: "destructive" });
    } else {
      toast({ title: "Blog deleted successfully" });
      fetchBlogs();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Blogs Management</h2>
        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>Add Blog Post</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBlog ? "Edit Blog Post" : "Add Blog Post"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Blog Content</h3>
                {draftSaved && (
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <Save className="h-4 w-4" />
                    Draft saved
                  </div>
                )}
              </div>
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label>Content Sections *</Label>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      onClick={() => setContentSections([...contentSections, { type: 'heading', text: '' }])}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Heading
                    </Button>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      onClick={() => setContentSections([...contentSections, { type: 'paragraph', text: '' }])}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Paragraph
                    </Button>
                  </div>
                </div>

                {contentSections.length === 0 ? (
                  <div className="p-4 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                    <p>No content sections yet. Click "Add Heading" or "Add Paragraph" to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-3 bg-slate-50">
                    {contentSections.map((section, index) => (
                      <div key={index} className="bg-white p-3 rounded border space-y-2">
                        <div className="flex justify-between items-center">
                          <select
                            value={section.type}
                            onChange={(e) => {
                              const updated = [...contentSections];
                              updated[index].type = e.target.value as 'heading' | 'paragraph';
                              setContentSections(updated);
                            }}
                            className="text-sm border rounded px-2 py-1 bg-white"
                          >
                            <option value="heading">Heading</option>
                            <option value="paragraph">Paragraph</option>
                          </select>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const updated = contentSections.filter((_, i) => i !== index);
                              setContentSections(updated);
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          value={section.text}
                          onChange={(e) => {
                            const updated = [...contentSections];
                            updated[index].text = e.target.value;
                            setContentSections(updated);
                          }}
                          placeholder={section.type === 'heading' ? 'Enter heading...' : 'Enter paragraph text...'}
                          rows={section.type === 'heading' ? 2 : 4}
                          className="text-sm"
                          required
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>Blog Image</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="flex-1"
                    />
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {imageFile && (
                    <div className="w-32 h-32 border rounded overflow-hidden">
                      <img
                        src={URL.createObjectURL(imageFile)}
                        alt="New blog image"
                        className="w-full h-full object-cover"
                        width="128"
                        height="128"
                        decoding="async"
                      />
                    </div>
                  )}

                  {editingBlog?.image_url && !imageFile && (
                    <div className="w-32 h-32 border rounded overflow-hidden">
                      <img
                        src={editingBlog.image_url}
                        alt="Current blog image"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        width="128"
                        height="128"
                        decoding="async"
                      />
                    </div>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={uploadingImage}>
                {uploadingImage ? "Uploading..." : editingBlog ? "Update" : "Create"} Blog Post
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {blogs.map((blog) => (
          <Card key={blog.id} className="p-4 flex flex-col">
            {blog.image_url ? (
              <div className="h-32 w-full bg-gray-100 rounded-lg mb-3 overflow-hidden">
                <img
                  src={blog.image_url}
                  alt={blog.title}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    console.error('Image failed to load:', blog.image_url);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  loading="lazy"
                  width="256"
                  height="128"
                  decoding="async"
                />
              </div>
            ) : (
              <div className="h-32 w-full bg-gray-200 rounded-lg mb-3 flex items-center justify-center text-sm text-gray-500">
                No image
              </div>
            )}
            <h3 className="font-semibold mb-1 line-clamp-2">{blog.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {formatDate(blog.created_at)}
            </p>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-3 flex-grow">
              {(() => {
                try {
                  const parsed = JSON.parse(blog.content);
                  if (Array.isArray(parsed)) {
                    // Extract first paragraph or heading text
                    const firstText = parsed.find((s: any) => s.text)?.text || '';
                    return firstText.substring(0, 100);
                  }
                  return blog.content.substring(0, 100);
                } catch {
                  return blog.content.substring(0, 100);
                }
              })()}...
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleEdit(blog)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(blog.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BlogsTab;
