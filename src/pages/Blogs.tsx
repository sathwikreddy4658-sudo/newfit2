import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Grid, List } from "lucide-react";

const Blogs = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'scroll'>('grid');

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching blogs:", error);
    } else {
      setBlogs(data || []);
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
      <div className="bg-[#b5edce]/50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-[#3b2a20]">Loading blogs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#b5edce]/50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="font-saira font-black text-6xl text-[#3b2a20] text-left uppercase">Blog</h1>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="flex items-center gap-2 hover:bg-[#b5edce] data-[state=on]:bg-[#b5edce]"
            >
              <Grid className="h-4 w-4" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'scroll' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('scroll')}
              className="flex items-center gap-2 hover:bg-[#b5edce] data-[state=on]:bg-[#b5edce]"
            >
              <List className="h-4 w-4" />
              Scroll
            </Button>
          </div>
        </div>

        {blogs.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="font-saira font-black text-6xl text-[#3b2a20]/30">NO BLOG POSTS YET!</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <Link key={blog.id} to={`/blogs/${blog.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img
                      src={blog.image_url || '/placeholder.svg'}
                      alt={blog.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-2 text-[#3b2a20]">{blog.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-[#3b2a20]/70">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(blog.created_at)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#3b2a20]/70 line-clamp-3">
                      {blog.content.substring(0, 150)}...
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {blogs.map((blog) => (
              <Link key={blog.id} to={`/blogs/${blog.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex flex-col md:flex-row">
                    <div className="aspect-video md:aspect-square md:w-1/3 overflow-hidden rounded-t-lg md:rounded-l-lg md:rounded-t-none">
                      <img
                        src={blog.image_url || '/placeholder.svg'}
                        alt={blog.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6 md:flex-1">
                      <CardHeader className="p-0 mb-4">
                        <CardTitle className="text-2xl text-[#3b2a20] mb-2">{blog.title}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-[#3b2a20]/70">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(blog.created_at)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <p className="text-[#3b2a20]/70 line-clamp-4">
                          {blog.content.substring(0, 300)}...
                        </p>
                      </CardContent>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blogs;
