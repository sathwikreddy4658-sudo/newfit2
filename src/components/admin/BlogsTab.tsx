import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Upload, X, Plus, Save, Bold, Italic, Type } from "lucide-react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";

// Custom line break button for Quill
const LineBreakBlot = Quill.import('blots/break');
class CustomLineBreak extends LineBreakBlot {}
Quill.register(CustomLineBreak);

// Add custom icons to Quill
const icons = Quill.import('ui/icons');
icons['linebreak'] = '<svg viewBox="0 0 18 18"><path d="M14,13 L4,13 M14,10 L4,10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M4,13 L4,10" stroke="currentColor" stroke-width="2"/></svg>';

interface ContentSection {
  type: 'heading' | 'paragraph' | 'linebreak';
  text: string;
}

interface BlogLink {
  text: string;
  url: string;
}

const BLOG_DRAFT_KEY = 'blog_draft_data';
const BLOG_CONTENT_DRAFT_KEY = 'blog_content_sections';
const BLOG_LINKS_DRAFT_KEY = 'blog_links_sections';

const BlogsTab = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [contentSections, setContentSections] = useState<ContentSection[]>([]);
  const [blogLinks, setBlogLinks] = useState<BlogLink[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    image_url: "",
    cta_heading: "Learn More",
  });
  const [draftSaved, setDraftSaved] = useState(false);
  const saveDraftTimeoutRef = useRef<NodeJS.Timeout>();
  const quillRefs = useRef<{ [key: number]: any }>({});

  // Custom modules configuration with line break handler
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'header': 1 }, { 'header': 2 }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['linebreak'], // Custom line break button
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['link'],
        ['clean']
      ],
      handlers: {
        'linebreak': function() {
          const cursorPosition = this.quill.getSelection()?.index || 0;
          this.quill.insertText(cursorPosition, '\n');
          this.quill.setSelection(cursorPosition + 1);
        }
      }
    }
  }), []);

  const formats = [
    'bold', 'italic', 'underline', 'strike',
    'blockquote', 'code-block',
    'header',
    'list',
    'size',
    'link'
  ];

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
        localStorage.setItem(BLOG_LINKS_DRAFT_KEY, JSON.stringify(blogLinks));
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
      }, 1000);
    }

    return () => {
      if (saveDraftTimeoutRef.current) {
        clearTimeout(saveDraftTimeoutRef.current);
      }
    };
  }, [formData, contentSections, blogLinks, showDialog]);

  // Load draft when dialog opens
  useEffect(() => {
    if (showDialog && !editingBlog) {
      const savedDraft = localStorage.getItem(BLOG_DRAFT_KEY);
      const savedContent = localStorage.getItem(BLOG_CONTENT_DRAFT_KEY);
      const savedLinks = localStorage.getItem(BLOG_LINKS_DRAFT_KEY);
      
      if (savedDraft) {
        setFormData(JSON.parse(savedDraft));
      }
      if (savedContent) {
        setContentSections(JSON.parse(savedContent));
      }
      if (savedLinks) {
        setBlogLinks(JSON.parse(savedLinks));
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
      cta_heading: "Learn More",
    });
    setContentSections([]);
    setBlogLinks([]);
    setEditingBlog(null);
    setImageFile(null);
    localStorage.removeItem(BLOG_DRAFT_KEY);
    localStorage.removeItem(BLOG_CONTENT_DRAFT_KEY);
    localStorage.removeItem(BLOG_LINKS_DRAFT_KEY);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      // Compress image before upload
      const compressedFile = await compressImage(file);
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `blog-${Date.now()}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(fileName, compressedFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(fileName);

      console.log('Image uploaded successfully:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error in uploadImage:', error);
      return null;
    }
  };

  // Compress image to max 2000px width, min 720px, maintaining aspect ratio
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // Calculate new dimensions (max 2000px width, maintaining aspect ratio)
          const MAX_WIDTH = 2000;
          const MIN_WIDTH = 720;
          
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          
          // Ensure minimum width
          if (width < MIN_WIDTH) {
            height = Math.round((height * MIN_WIDTH) / width);
            width = MIN_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 85% quality
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
                console.log(`Image compressed: ${file.size} -> ${compressedFile.size} bytes`);
                resolve(compressedFile);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            0.85
          );
        };
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
    });
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
        const newImageUrl = await uploadImage(imageFile) || "";
        console.log('New image URL from upload:', newImageUrl);
        imageUrl = newImageUrl;
      }

      // Convert sections to content string
      // React-Quill stores HTML directly, so we combine all sections into one HTML string
      let contentHtml = '';
      contentSections.forEach((section) => {
        if (section.type === 'heading') {
          contentHtml += `<h2>${section.text}</h2>`;
        } else if (section.type === 'linebreak') {
          contentHtml += '<br/><br/>';
        } else {
          // Already has <p> tags from Quill
          contentHtml += section.text;
        }
      });
      
      const linksJson = JSON.stringify(blogLinks);

      const blogData = {
        title: formData.title,
        content: contentHtml,
        image_url: imageUrl,
        links: linksJson,
        cta_heading: formData.cta_heading || "Learn More",
      };
      
      console.log('Saving blog with image_url:', imageUrl);

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
      cta_heading: blog.cta_heading || "Learn More",
    });
    
    // Parse content - handle both HTML and JSON formats
    try {
      const content = blog.content;
      // If it starts with <, it's pure HTML content (new format)
      if (content.startsWith('<')) {
        // Split HTML by <h2> tags to separate headings and paragraphs
        const parts = content.split(/(<h2>.*?<\/h2>)/);
        const sections: any[] = [];
        
        for (const part of parts) {
          if (part.trim()) {
            if (part.startsWith('<h2>')) {
              // Extract heading text
              const headingText = part.replace(/<\/?h2>/g, '').trim();
              sections.push({ type: 'heading', text: headingText });
            } else if (part.startsWith('<p>')) {
              sections.push({ type: 'paragraph', text: part });
            } else if (part.trim()) {
              sections.push({ type: 'paragraph', text: part });
            }
          }
        }
        setContentSections(sections.length > 0 ? sections : [{ type: 'paragraph', text: content }]);
      } else {
        // Try parsing as JSON (old format)
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          setContentSections(parsed);
        } else {
          setContentSections([{ type: 'paragraph', text: content }]);
        }
      }
    } catch {
      // Plain text fallback
      setContentSections([{ type: 'paragraph', text: blog.content }]);
    }
    
    // Parse links if they exist
    try {
      if (blog.links) {
        const parsedLinks = JSON.parse(blog.links);
        setBlogLinks(Array.isArray(parsedLinks) ? parsedLinks : []);
      } else {
        setBlogLinks([]);
      }
    } catch {
      setBlogLinks([]);
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

  // Helper function to extract preview text from blog content
  const getPreviewText = (content: any): string => {
    if (!content) return '';
    
    const stripHtmlTags = (text: string): string => {
      return text
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, '&')
        .trim();
    };
    
    try {
      let str = String(content).trim();
      
      // Remove surrounding quotes if present
      if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
        str = str.slice(1, -1);
      }
      
      // If it looks like JSON array or object, parse it
      if (str.startsWith('[') || str.startsWith('{')) {
        try {
          const parsed = JSON.parse(str);
          
          // If it's an array, find first text
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (item?.text) {
                let text = String(item.text).trim();
                text = stripHtmlTags(text);
                const result = text.replace(/\n+/g, ' ').substring(0, 100);
                return result;
              }
            }
            return 'No content';
          }
          
          // If it's an object with text, return it
          if (parsed?.text) {
            let text = String(parsed.text).trim();
            text = stripHtmlTags(text);
            const result = text.replace(/\n+/g, ' ').substring(0, 100);
            console.log('Extracted from JSON object:', result);
            return result;
          }
          
          console.log('Parsed JSON but no text found');
          return 'Blog content...';
        } catch (parseErr) {
          console.error('Failed to parse JSON:', parseErr);
          return 'Blog content...';
        }
      }
      
      // Return stripped text
      const result = str.replace(/\n+/g, ' ').substring(0, 100);
      console.log('Returning stripped text:', result);
      return result;
    } catch (error) {
      console.error('Error extracting preview:', error);
      return 'Error loading preview';
    }
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
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      onClick={() => setContentSections([...contentSections, { type: 'linebreak', text: '' }])}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Line Break
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
                              updated[index].type = e.target.value as 'heading' | 'paragraph' | 'linebreak';
                              setContentSections(updated);
                            }}
                            className="text-sm border rounded px-2 py-1 bg-white"
                          >
                            <option value="heading">Heading</option>
                            <option value="paragraph">Paragraph</option>
                            <option value="linebreak">Line Break</option>
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
                        {section.type === 'linebreak' ? (
                          <div className="border rounded bg-slate-100 p-4 text-center text-sm text-muted-foreground">
                            <div className="border-t-2 border-slate-300 my-2"></div>
                            Line Break (adds spacing between sections)
                          </div>
                        ) : (
                          <div className="border rounded bg-white">
                            <div className="text-xs text-muted-foreground px-2 py-1 bg-slate-50 border-b">
                              Tip: Use the ⏎ button for line breaks within paragraphs, or press Shift+Enter
                            </div>
                            <ReactQuill
                              value={section.text}
                              onChange={(text) => {
                                const updated = [...contentSections];
                                updated[index].text = text;
                                setContentSections(updated);
                              }}
                              modules={modules}
                              formats={formats}
                              placeholder={section.type === 'heading' ? 'Enter heading...' : 'Enter paragraph text...'}
                              theme="snow"
                              style={{ minHeight: section.type === 'heading' ? '120px' : '200px' }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="cta-heading">CTA Section Heading (Optional)</Label>
                <Input
                  id="cta-heading"
                  value={formData.cta_heading}
                  onChange={(e) => setFormData({ ...formData, cta_heading: e.target.value })}
                  placeholder="e.g., Learn More, Explore, Shop Now"
                  className="mt-1"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label>CTA Links (Optional)</Label>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="outline"
                    onClick={() => setBlogLinks([...blogLinks, { text: '', url: '' }])}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Link
                  </Button>
                </div>

                {blogLinks.length === 0 ? (
                  <div className="p-3 border-2 border-dashed rounded-lg text-center text-sm text-muted-foreground">
                    <p>No CTA links yet. Click "Add Link" to add call-to-action buttons.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-48 overflow-y-auto border rounded-lg p-3 bg-slate-50">
                    {blogLinks.map((link, index) => (
                      <div key={index} className="bg-white p-3 rounded border space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Link {index + 1}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const updated = blogLinks.filter((_, i) => i !== index);
                              setBlogLinks(updated);
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          value={link.text}
                          onChange={(e) => {
                            const updated = [...blogLinks];
                            updated[index].text = e.target.value;
                            setBlogLinks(updated);
                          }}
                          placeholder="Link text (e.g., 'Shop Now')"
                          className="text-sm"
                        />
                        <Input
                          value={link.url}
                          onChange={(e) => {
                            const updated = [...blogLinks];
                            updated[index].url = e.target.value;
                            setBlogLinks(updated);
                          }}
                          placeholder="URL (e.g., https://example.com)"
                          className="text-sm"
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
                const preview = getPreviewText(blog.content);
                // Never show JSON - if it starts with [ or {, something went wrong
                if (preview.startsWith('[') || preview.startsWith('{')) {
                  return 'Blog content...';
                }
                return preview;
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
