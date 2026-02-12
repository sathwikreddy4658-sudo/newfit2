import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";
import { getThumbnailUrl } from "@/utils/imageOptimization";

interface FavoriteProduct {
  id: string;
  name: string;
  price_15g: number;
  price_20g: number;
  images: string[];
  cart_image: string | null;
  stock: number;
  stock_status_15g?: boolean;
  stock_status_20g?: boolean;
  description: string;
}

const Favorites = () => {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { addItem } = useCart();

  useEffect(() => {
    checkUserAndFetchFavorites();
  }, []);

  const checkUserAndFetchFavorites = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      setUser(null);
      setLoading(false);
      return;
    }

    setUser(session.user);
    await fetchFavorites(session.user.id);
  };

  const fetchFavorites = async (userId: string) => {
    try {
      // Get user's favorites from local storage as a fallback
      const localFavorites = JSON.parse(localStorage.getItem(`favorites_${userId}`) || '[]');
      
      if (localFavorites.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      // Fetch product details for favorited items
      const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .in("id", localFavorites)
        .eq("is_hidden", false);

      if (error) {
        console.error("Error fetching favorites:", error);
        toast({ title: "Error loading favorites", variant: "destructive" });
      } else {
        setFavorites(products || []);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
      toast({ title: "Error loading favorites", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (productId: string) => {
    if (!user) return;

    try {
      const localFavorites = JSON.parse(localStorage.getItem(`favorites_${user.id}`) || '[]');
      const updatedFavorites = localFavorites.filter((id: string) => id !== productId);
      localStorage.setItem(`favorites_${user.id}`, JSON.stringify(updatedFavorites));

      setFavorites(favorites.filter(p => p.id !== productId));
      toast({ title: "Removed from favorites" });
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast({ title: "Error removing favorite", variant: "destructive" });
    }
  };

  const handleAddToCart = (product: FavoriteProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (product.stock === 0) {
      toast({ title: "Product out of stock", variant: "destructive" });
      return;
    }

    // Default to 15g protein variant
    addItem({
      id: product.id,
      name: product.name,
      price: product.price_15g,
      stock: product.stock,
      quantity: 1,
      protein: "15g",
      image: product.cart_image || (product.images && product.images.length > 0 ? product.images[0] : null),
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="font-saira font-black text-4xl md:text-6xl text-[#3b2a20] mb-4 uppercase">
          MY FAVORITES
        </h1>
        <div className="max-w-md mx-auto mt-12">
          <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg text-muted-foreground mb-6">
            Sign in to save your favorite products
          </p>
          <Button 
            onClick={() => navigate("/auth", { state: { returnTo: "/favorites" } })}
            className="font-poppins font-bold bg-[#5e4338] hover:bg-[#3b2a20]"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="font-saira font-black text-4xl md:text-6xl text-[#3b2a20] mb-4 uppercase">
          MY FAVORITES
        </h1>
        <div className="max-w-md mx-auto mt-12">
          <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg text-muted-foreground mb-6">
            You haven't added any favorites yet
          </p>
          <Button 
            onClick={() => navigate("/products")}
            className="font-poppins font-bold bg-[#5e4338] hover:bg-[#3b2a20]"
          >
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-saira font-black text-4xl md:text-6xl text-[#3b2a20] mb-8 uppercase">
        MY FAVORITES
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {favorites.map((product) => (
          <Card
            key={product.id}
            className="group cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-300"
            onClick={() => navigate(`/product/${encodeURIComponent(product.name)}`)}
          >
            <div className="relative aspect-square overflow-hidden bg-gray-100">
              {product.images && product.images.length > 0 ? (
                <img
                  src={getThumbnailUrl(product.images[0])}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
              
              {/* Remove from favorites button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFavorite(product.id);
                }}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
              >
                <Heart className="h-5 w-5 text-red-500 fill-current" />
              </button>

              {product.stock === 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold">
                    OUT OF STOCK
                  </span>
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-saira font-black text-lg text-[#3b2a20] uppercase mb-2 line-clamp-2">
                {product.name}
              </h3>
              
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-montserrat text-xl font-bold text-primary">
                    ₹{product.price_15g}
                  </p>
                  <p className="text-xs text-muted-foreground">15g Protein</p>
                </div>
                {product.price_20g && (
                  <div className="text-right">
                    <p className="font-montserrat text-xl font-bold text-primary">
                      ₹{product.price_20g}
                    </p>
                    <p className="text-xs text-muted-foreground">20g Protein</p>
                  </div>
                )}
              </div>

              <Button
                onClick={(e) => handleAddToCart(product, e)}
                disabled={product.stock === 0}
                className="w-full font-poppins font-bold bg-[#5e4338] hover:bg-[#3b2a20] text-white disabled:opacity-50 uppercase"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Favorites;
