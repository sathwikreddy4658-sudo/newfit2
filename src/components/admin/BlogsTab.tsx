import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Upload, X } from "lucide-react";

const BlogsTab = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image_url: "",
  });

  useEffect(() => {
    fetchBlogs();
  }, []);

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
      content: "",
      image_url: "",
    });
    setEditingBlog(null);
    setImageFile(null);
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
    setUploadingImage(true);

    try {
      let imageUrl = formData.image_url;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile) || "";
      }

      const blogData = {
        title: formData.title,
        content: formData.content,
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
      content: blog.content,
      image_url: blog.image_url || "",
    });
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
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Content *</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  required
                />
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
                      />
                    </div>
                  )}

                  {editingBlog?.image_url && !imageFile && (
                    <div className="w-32 h-32 border rounded overflow-hidden">
                      <img
                        src={editingBlog.image_url}
                        alt="Current blog image"
                        className="w-full h-full object-cover"
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
          <Card key={blog.id} className="p-4">
            {blog.image_url && (
              <img
                src={blog.image_url}
                alt={blog.title}
                className="h-32 w-full object-cover rounded-lg mb-3"
              />
            )}
            <h3 className="font-semibold mb-1 line-clamp-2">{blog.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {formatDate(blog.created_at)}
            </p>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
              {blog.content.substring(0, 100)}...
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
