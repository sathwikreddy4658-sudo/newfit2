import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, User } from "lucide-react";

const BlogDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchBlog();
    }
  }, [id]);

  const fetchBlog = async () => {
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching blog:", error);
    } else {
      setBlog(data);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading blog post...</div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Blog post not found</h1>
          <Link to="/blogs">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blogs
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link to="/blogs">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blogs
            </Button>
          </Link>
        </div>

        <article className="max-w-[680px] mx-auto">
          {blog.image_url && (
            <div className="aspect-video overflow-hidden rounded-lg mb-8">
              <img
                src={blog.image_url}
                alt={blog.title}
                className="w-full h-full object-cover"
                loading="lazy"
                width="800"
                height="450"
                decoding="async"
              />
            </div>
          )}

          <header className="mb-8">
            <h1 className="text-4xl font-saira font-black mb-4 text-[#3b2a20]">{blog.title}</h1>
            <div className="flex items-center gap-4 text-[#3b2a20]/70 text-sm font-poppins">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(blog.created_at)}
              </div>
            </div>
          </header>

          <div className="font-poppins text-[18px] font-medium leading-[1.7] text-[#3b2a20]">
            {(() => {
              // Try to parse content
              try {
                let content = blog.content;
                
                // If content is a string, try to parse it as JSON
                if (typeof content === 'string') {
                  content = JSON.parse(content);
                }
                
                // If it's an array of sections, render it
                if (Array.isArray(content)) {
                  return (
                    <div className="space-y-6">
                      {content.map((section: any, index: number) => (
                        <div key={index}>
                          {section.type === 'heading' ? (
                            <h2 className="text-2xl font-saira font-semibold mb-4 text-[#3b2a20] mt-8 first:mt-0 pb-3 border-b-2 border-[#b5edce]">
                              {section.text}
                            </h2>
                          ) : (
                            <p className="text-[#3b2a20] whitespace-pre-wrap leading-[1.7] mb-4">
                              {section.text}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                } else {
                  // Fallback to old plain text format
                  return <div className="whitespace-pre-wrap">{blog.content}</div>;
                }
              } catch {
                // Plain text fallback
                return <div className="whitespace-pre-wrap">{blog.content}</div>;
              }
            })()}
          </div>
        </article>
      </div>
    </div>
  );
};

export default BlogDetail;
