import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getAllProducts } from "@/integrations/firebase/db";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { getThumbnailUrl, getLazyLoadingStrategy } from "@/utils/imageOptimization";

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const categoriesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Limit to 20 products for faster initial load (can add load more later)
      const data = await getAllProducts(20);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Memoize filter calculation to prevent unnecessary recalculation
  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.nutrition && p.nutrition.toLowerCase().includes(query)) ||
          (p.description && p.description.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [products, searchQuery, categoryFilter]);

  const handleCategoryClick = (category: string) => {
    setCategoryFilter(category);
    // Auto-scroll logic for mobile
    if (categoriesRef.current) {
      const container = categoriesRef.current;
      const buttons = container.querySelectorAll('button');
      const clickedButton = Array.from(buttons).find(btn => btn.textContent?.toLowerCase().replace(' ', '_') === category || (category === 'all' && btn.textContent === 'All Categories'));
      if (clickedButton) {
        const buttonRect = clickedButton.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const buttonLeft = buttonRect.left - containerRect.left;
        const buttonRight = buttonLeft + buttonRect.width;
        const containerWidth = containerRect.width;

        // If button is near left or right edge, scroll to center it
        if (buttonLeft < 50 || buttonRight > containerWidth - 50) {
          const scrollLeft = buttonLeft - (containerWidth / 2) + (buttonRect.width / 2);
          container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-6 md:py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="p-3 sm:p-4">
              <Skeleton className="h-32 sm:h-40 w-full mb-3 sm:mb-4" />
              <Skeleton className="h-5 sm:h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#b5edce]/50 min-h-screen">
      <div className="container mx-auto px-3 sm:px-4 py-6 md:py-8 pt-16 md:pt-20">
      <div className="flex flex-col gap-3 sm:gap-4 mb-6 md:mb-8 mt-12 sm:mt-16">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#3b2a20]/50 pointer-events-none" />
          <Input
            placeholder=""
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 text-sm border-[#b5edce] focus:border-[#3b2a20] focus:ring-[#3b2a20]"
          />
        </div>

        <div
          ref={categoriesRef}
          className="flex gap-1 sm:gap-2 overflow-x-auto pb-2 md:overflow-x-visible md:justify-start scrollbar-hide"
        >
          <Button
            variant={categoryFilter === "all" ? "default" : "outline"}
            onClick={() => handleCategoryClick("all")}
            className={`whitespace-nowrap rounded-lg font-poppins font-bold text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 flex-shrink-0 bg-white text-[#3b2a20] border-white hover:bg-[#5e4338] hover:text-white transition-colors ${categoryFilter === "all" ? "bg-[#5e4338] text-white" : ""}`}
          >
            All Categories
          </Button>
          <Button
            variant={categoryFilter === "protein_bars" ? "default" : "outline"}
            onClick={() => handleCategoryClick("protein_bars")}
            className={`whitespace-nowrap rounded-lg font-poppins font-bold text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 flex-shrink-0 bg-white text-[#3b2a20] border-white hover:bg-[#5e4338] hover:text-white transition-colors ${categoryFilter === "protein_bars" ? "bg-[#5e4338] text-white" : ""}`}
          >
            Protein Bars
          </Button>
          <Button
            variant={categoryFilter === "dessert_bars" ? "default" : "outline"}
            onClick={() => handleCategoryClick("dessert_bars")}
            className={`whitespace-nowrap rounded-lg font-poppins font-bold text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 flex-shrink-0 bg-white text-[#3b2a20] border-white hover:bg-[#5e4338] hover:text-white transition-colors ${categoryFilter === "dessert_bars" ? "bg-[#5e4338] text-white" : ""}`}
          >
            Dessert Bars
          </Button>
          <Button
            variant={categoryFilter === "chocolates" ? "default" : "outline"}
            onClick={() => handleCategoryClick("chocolates")}
            className={`whitespace-nowrap rounded-lg font-poppins font-bold text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 flex-shrink-0 bg-white text-[#3b2a20] border-white hover:bg-[#5e4338] hover:text-white transition-colors ${categoryFilter === "chocolates" ? "bg-[#5e4338] text-white" : ""}`}
          >
            Chocolates
          </Button>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
          <p className="font-saira font-black text-2xl sm:text-4xl md:text-6xl text-[#3b2a20]/30 text-center px-4">NO PRODUCTS HERE YET!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="p-3 sm:p-4 cursor-pointer product-card hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/product/${encodeURIComponent(product.name)}`)}
            >
              <div className="w-full aspect-square rounded-lg mb-3 sm:mb-4 overflow-hidden mx-auto flex items-center justify-center bg-white">
                {/* Single Image */}
                {product.products_page_image ? (
                  <img
                    src={getThumbnailUrl(product.products_page_image)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : product.images && product.images.length > 0 ? (
                  <img
                    src={getThumbnailUrl(product.images[0])}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600">No Image</div>
                )}
              </div>
              <h3 className="font-saira font-black text-xs sm:text-sm md:text-lg mb-2 text-[#3b2a20] uppercase line-clamp-2">{product.name}</h3>
              <p className="font-montserrat text-sm sm:text-lg md:text-xl font-bold text-primary">
                {product.price ? `₹${product.price}` : `₹${product.price_15g} - ₹${product.price_20g}`}
              </p>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default Products;
