import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, User } from "lucide-react";
import DOMPurify from 'dompurify';

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

  // Helper function to parse blog content reliably
  const parseContent = (content: any) => {
    if (!content) return null;
    
    try {
      let str = String(content).trim();
      
      // If it starts with < it's HTML content
      if (str.startsWith('<')) {
        return { type: 'html', content: str };
      }
      
      // If it looks like JSON array or object, try to parse (backward compatibility)
      if ((str.startsWith('[') && str.endsWith(']')) || (str.startsWith('{') && str.endsWith('}'))) {
        try {
          const parsed = JSON.parse(str);
          
          // If it's an array, return it directly
          if (Array.isArray(parsed)) {
            return { type: 'json', content: parsed };
          }
          
          // If it's an object with text/type, wrap in array
          if (typeof parsed === 'object' && (parsed?.text || parsed?.type)) {
            return { type: 'json', content: [parsed] };
          }
        } catch {
          // Not valid JSON, treat as plain text
        }
      }
      
      // Plain text - return as single item
      return { type: 'text', content: str };
    } catch (error) {
      console.error('Error parsing blog content:', error);
      return { type: 'text', content: String(content) };
    }
  };

  // Helper function to check if text contains HTML (rich text)
  const isRichText = (text: string): boolean => {
    const str = String(text);
    // Check for HTML tags (both regular and escaped)
    return /<[^>]*>/.test(str) || /&lt;/.test(str);
  };

  // Helper function to unescape HTML entities
  const unescapeHtml = (text: string): string => {
    const map: { [key: string]: string } = {
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#039;': "'",
      '&amp;': '&'
    };
    return String(text).replace(/&lt;|&gt;|&quot;|&#039;|&amp;/g, m => map[m]);
  };

  // Helper function to render rich HTML content safely with product links
  const renderRichContent = (html: string) => {
    // Unescape HTML if needed
    let unescapedHtml = unescapeHtml(html);
    
    // Add product link naturally if content mentions Choco Nut
    if (unescapedHtml.toLowerCase().includes('choco nut') && !unescapedHtml.includes('/products/CHOCO%20NUT')) {
      unescapedHtml = unescapedHtml.replace(/Choco Nut/gi, '<a href="https://www.freelit.in/products/CHOCO%20NUT" class="text-blue-600 hover:underline">Choco Nut</a>');
    }
    
    // Sanitize with DOMPurify - allow all heading tags and style attributes for font sizes
    const cleanHtml = DOMPurify.sanitize(unescapedHtml, { 
      ALLOWED_TAGS: ['p', 'a', 'strong', 'em', 'u', 's', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'span', 'hr'],
      ALLOWED_ATTR: ['class', 'style', 'href', 'target', 'rel']
    });
    return (
      <div 
        className="prose prose-sm max-w-none break-words"
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
        style={{
          color: '#3b2a20',
          fontSize: '18px',
          fontWeight: '400',
          lineHeight: '1.5',
          wordSpacing: 'normal'
        }}
      />
    );
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
      <Helmet>
        <link rel="canonical" href={`https://www.freelit.in/blogs/${id}`} />
      </Helmet>
      <div className="container mx-auto px-4">
        <article className="max-w-[680px] mx-auto bg-white rounded-lg px-4 py-6 sm:px-6 sm:py-8 md:p-8 shadow-sm">
          {blog.image_url && (
            <div className="aspect-video overflow-hidden rounded-lg mb-10 -mx-4 sm:-mx-6 md:-mx-8 -mt-6 sm:-mt-8 md:-mt-8">
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

          <header className="mb-10">
            <h1 className="text-4xl font-saira font-black mb-2 text-[#3b2a20]">{blog.title}</h1>
            <p className="text-[#3b2a20]/70 font-poppins text-sm mb-4">By Freel It Team</p>
            <div className="flex items-center gap-4 text-[#3b2a20]/70 text-sm font-poppins">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(blog.created_at)}
              </div>
            </div>
          </header>

          <div className="font-poppins text-[18px] font-normal leading-[1.5] text-[#3b2a20]">
            {(() => {
              const parsedContent = parseContent(blog.content);
              
              if (!parsedContent) {
                return <div className="whitespace-pre-wrap">{blog.content}</div>;
              }
              
              // Handle HTML content (new format from React-Quill)
              if (parsedContent.type === 'html') {
                return renderRichContent(parsedContent.content);
              }
              
              // Handle JSON content (backward compatibility)
              if (parsedContent.type === 'json') {
                return (
                  <div className="space-y-4">
                    {parsedContent.content.map((section: any, index: number) => {
                      const isRich = isRichText(section.text);
                      console.log(`Section ${index} (${section.type}):`, 'isRich=', isRich, 'text=', section.text?.substring?.(0, 50));
                      return (
                        <div key={index}>
                          {section.type === 'heading' ? (
                            isRich ? (
                              <div className="font-saira font-semibold mb-3 text-[#3b2a20] mt-6 first:mt-0 pb-3 border-b-2 border-[#b5edce] leading-[1.3]">
                                {renderRichContent(section.text)}
                              </div>
                            ) : (
                              <h2 className="text-2xl font-saira font-semibold mb-3 text-[#3b2a20] mt-6 first:mt-0 pb-3 border-b-2 border-[#b5edce] leading-[1.3]">
                                {section.text}
                              </h2>
                            )
                          ) : section.type === 'divider' ? (
                            <hr className="my-6 border-t-2 border-[#b5edce]" />
                          ) : (
                            isRich ? (
                              renderRichContent(section.text)
                            ) : (
                              <p className="text-[#3b2a20] whitespace-pre-wrap leading-[1.5] mb-4">
                                {section.text}
                              </p>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              }
              
              // Handle plain text
              return <p className="text-[#3b2a20] whitespace-pre-wrap leading-[1.5]">{parsedContent.content}</p>;
            })()}
          </div>

          {/* CTA Links Section */}
          {blog.links && (() => {
            try {
              const links = JSON.parse(blog.links);
              if (Array.isArray(links) && links.length > 0) {
                const ctaHeading = blog.cta_heading || "Learn More";
                return (
                  <div className="mt-10 pt-8 border-t border-[#b5edce]">
                    <h3 className="text-lg font-saira font-semibold text-[#3b2a20] mb-6 text-center">{ctaHeading}</h3>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                      {links.map((link: any, index: number) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 bg-[#3b2a20] text-white font-poppins font-semibold rounded-lg hover:bg-[#2a1f15] transition-colors"
                        >
                          {link.text}
                        </a>
                      ))}
                    </div>
                  </div>
                );
              }
            } catch (error) {
              console.error('Error parsing blog links:', error);
            }
            return null;
          })()}

          {/* Back to Blogs Link */}
          <div className="mt-12 pt-8 text-center border-t border-[#b5edce]">
            <Link to="/blogs" className="text-[#3b2a20] hover:text-[#3b2a20]/70 font-poppins text-sm transition-colors">
              ← Back to all blogs
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
};

export default BlogDetail;
