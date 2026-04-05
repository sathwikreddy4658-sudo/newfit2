import { useEffect, useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { getCurrentUser, auth } from "@/integrations/firebase/auth";
import { getProduct, getAllProducts, addToFavorites, removeFromFavorites } from "@/integrations/firebase/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { Heart, ShoppingCart, Minus, Plus, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ProductRatingsDisplay from "@/components/ProductRatingsDisplay";
import RatingComponent from "@/components/RatingComponent";
import ProductRatingSummary from "@/components/ProductRatingSummary";
import ProductLabReports from "@/components/ProductLabReports";
import ProductFAQ from "@/components/ProductFAQ";
import { getHeroImageUrl, getLazyLoadingStrategy } from "@/utils/imageOptimization";

import image2 from "@/assets/2.png";
import image4 from "@/assets/4.png";
import image8 from "@/assets/8.png";
import image10 from "@/assets/10.png";
import undressedpb from "@/assets/undressedpb.png";
import dressedpb from "@/assets/dressedpb.png";
import undressedcc from "@/assets/undressedcc.png";
import dressedcc from "@/assets/dressedcc.png";
import undressedcp from "@/assets/undressedcp.png";
import dressedcp from "@/assets/dressedcp.png";

// Product-specific color mapping
const getProductAccentColor = (productName: string | undefined): string => {
  if (!productName) return "5e4338";
  const lowerName = productName.toLowerCase();
  const colorMap: { [key: string]: string } = {
    "cranberry cocoa": "6f3237",
    "caramelly peanut": "ecbc72",
  };
  return colorMap[lowerName] || "5e4338";
};

// Product-specific animation image mapping
const getAnimationImages = (productName: string | undefined): { undressed: string; dressed: string } => {
  if (!productName) return { undressed: undressedpb, dressed: dressedpb };
  const lowerName = productName.toLowerCase();
  const imageMap: { [key: string]: { undressed: string; dressed: string } } = {
    "cranberry cocoa": { undressed: undressedcc, dressed: dressedcc },
    "caramelly peanut": { undressed: undressedcp, dressed: dressedcp },
  };
  return imageMap[lowerName] || { undressed: undressedpb, dressed: dressedpb };
};

const ProductDetail = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem } = useCart();
  const animationSectionRef = useRef<HTMLDivElement>(null);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(0);
  const [minOrderQuantity, setMinOrderQuantity] = useState(1);
  const [selectedProtein, setSelectedProtein] = useState("15g");
  const [lastTapTime, setLastTapTime] = useState(0);
  const [tapTimeout, setTapTimeout] = useState<NodeJS.Timeout | null>(null);
  const [swipeStartX, setSwipeStartX] = useState(0);
  const [swipeStartY, setSwipeStartY] = useState(0);
  const [imageSwipeStartX, setImageSwipeStartX] = useState(0);
  const [imageSwipeStartY, setImageSwipeStartY] = useState(0);
  const [imageTransition, setImageTransition] = useState(true);
  const [modalImageTransition, setModalImageTransition] = useState(true);
  const [productTransitionActive, setProductTransitionActive] = useState(false);
  const [productTransitionDirection, setProductTransitionDirection] = useState<'left' | 'right'>('left');
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const accentColor = getProductAccentColor(product?.name);

  useEffect(() => {
    // Check Firebase auth state
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser ?? null);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (name) {
      fetchProduct();
      fetchAllProducts();
      if (user) checkFavorite();
      // Scroll to hero section when product changes
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [name, user]);

  useEffect(() => {
    if (product && animationSectionRef.current) {
      // Log product data to check for original prices
      console.log('[ProductDetail] Product loaded:', {
        name: product.name,
        price_15g: product.price_15g,
        price_20g: product.price_20g,
        original_price: product.original_price,
        original_price_15g: product.original_price_15g,
        original_price_20g: product.original_price_20g
      });
      
      // Only scroll to animation section if navigation came from animation
      if (location.state?.from === 'animation') {
        animationSectionRef.current?.scrollIntoView({ behavior: "auto", block: "center" });
      }
    }
  }, [product, location]);

  useEffect(() => {
    if (product?.min_order_quantity) {
      setMinOrderQuantity(product.min_order_quantity);
      setSelectedQuantity(product.min_order_quantity);
    }
  }, [product]);

  useEffect(() => {
    if (product?.name) {
      document.title = `${product.name.toLowerCase()} protein bar | Low-Calorie, High Protein | Freel It`;
    } else {
      document.title = "Healthy snacks & Protein Bars | Freel It";
    }
  }, [product]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tapTimeout) clearTimeout(tapTimeout);
    };
  }, [tapTimeout]);

  const fetchProduct = async () => {
    const productName = decodeURIComponent(name!);
    
    try {
      // Fetch all products and find the one matching the name
      const allProducts = await getAllProducts();
      const foundProduct = allProducts.find(p => p.name === productName);
      
      if (foundProduct) {
        setProduct(foundProduct);
      } else {
        console.error('Product not found:', productName);
      }
    } catch (error) {
      console.error('Product fetch error:', error);
    }
    setLoading(false);
  };

  const fetchAllProducts = async () => {
    try {
      const allProducts = await getAllProducts();
      // Filter out hidden products if they have is_hidden property
      const visibleProducts = allProducts.filter(p => !p.is_hidden);
      // Sort by name
      visibleProducts.sort((a, b) => a.name.localeCompare(b.name));
      setAllProducts(visibleProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const checkFavorite = async () => {
    if (!user || !product) return;
    
    try {
      const localFavorites = JSON.parse(localStorage.getItem(`favorites_${user.uid}`) || '[]');
      setIsFavorite(localFavorites.includes(product.id));
    } catch (error) {
      console.error("Error checking favorites:", error);
      setIsFavorite(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast({ title: "Please sign in to add favorites" });
      return;
    }

    const currentTime = Date.now();
    const timeSinceLastTap = currentTime - lastTapTime;
    
    // Check for double-tap (within 300ms)
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0 && lastTapTime !== 0) {
      // Double-tap detected - ONLY navigate to favorites page, don't toggle
      if (tapTimeout) clearTimeout(tapTimeout);
      setLastTapTime(0);
      navigate("/favorites");
      return;
    }
    
    // Update last tap time
    setLastTapTime(currentTime);
    
    // Clear any existing timeout
    if (tapTimeout) clearTimeout(tapTimeout);
    
    // Delay the toggle to allow for double-tap detection
    const newTimeout = setTimeout(async () => {
      // Single tap confirmed - toggle favorite status
      try {
        let localFavorites: string[] = [];
        try {
          const stored = localStorage.getItem(`favorites_${user.uid}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            localFavorites = Array.isArray(parsed) ? parsed : [];
          }
        } catch (parseError) {
          console.warn('Failed to parse favorites from localStorage:', parseError);
          localFavorites = [];
        }
        
        let updatedFavorites: string[];
        
        if (isFavorite) {
          // Remove from favorites
          updatedFavorites = localFavorites.filter((id: string) => id !== product.id);
          setIsFavorite(false);
          
          // Remove from Firestore
          await removeFromFavorites(user.uid, product.id);
          
          toast({ title: "Removed from favorites" });
        } else {
          // Add to favorites
          if (!localFavorites.includes(product.id)) {
            updatedFavorites = [...localFavorites, product.id];
          } else {
            updatedFavorites = localFavorites;
          }
          setIsFavorite(true);
          
          // Add to Firestore
          await addToFavorites(user.uid, product.id);
          
          toast({ title: "Added to favorites", description: "Double-tap heart icon to view all favorites" });
        }
        
        localStorage.setItem(`favorites_${user.uid}`, JSON.stringify(updatedFavorites));
      } catch (error) {
        console.error("Error updating favorites:", error);
        toast({ title: "Error updating favorites", variant: "destructive" });
      }
      setTapTimeout(null);
    }, 300);
    
    setTapTimeout(newTimeout);
  };

  const handleAddToCart = () => {
    if (product.stock < selectedQuantity) {
      toast({ title: "Insufficient stock", variant: "destructive" });
      return;
    }
    const price = selectedProtein === "15g" ? product.price_15g : product.price_20g;
    addItem({
      id: product.id,
      name: product.name,
      price: price,
      stock: product.stock,
      quantity: selectedQuantity,
      protein: selectedProtein,
      image: product.cart_image || (product.images && product.images.length > 0 ? product.images[0] : null),
      min_order_quantity: product.min_order_quantity || 1,
      combo_3_discount: product.combo_3_discount || 0,
      combo_6_discount: product.combo_6_discount || 0,
      combo_12_discount: product.combo_12_discount || 0,
    });
    setCartQuantity(prev => prev + selectedQuantity);
    // Toast notification is handled in CartContext
  };

  const handleBuyNow = async () => {
    if (product.stock < selectedQuantity) {
      toast({ title: "Insufficient stock", variant: "destructive" });
      return;
    }
    
    const price = selectedProtein === "15g" ? product.price_15g : product.price_20g;
    
    // Add item to cart
    addItem({
      id: product.id,
      name: product.name,
      price: price,
      combo_3_discount: product.combo_3_discount || 0,
      combo_6_discount: product.combo_6_discount || 0,
      combo_12_discount: product.combo_12_discount || 0,
      min_order_quantity: product.min_order_quantity || 1,
      stock: product.stock,
      quantity: selectedQuantity,
      protein: selectedProtein,
      image: product.cart_image || (product.images && product.images.length > 0 ? product.images[0] : null),
    });
    
    // Check if user is authenticated using Firebase
    const currentUser = await getCurrentUser();
    
    // Navigate directly to checkout with guest flag if not authenticated
    navigate("/checkout", {
      state: {
        isGuest: !currentUser
      }
    });
  };

  const increaseQuantity = () => {
    setSelectedQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    setSelectedQuantity(prev => prev > minOrderQuantity ? prev - 1 : minOrderQuantity);
  };

  const nextImage = () => {
    if (product?.images && product.images.length > 1) {
      setImageTransition(true);
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product?.images && product.images.length > 1) {
      setImageTransition(true);
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  const openImageModal = (index: number) => {
    setModalImageIndex(index);
    setIsImageModalOpen(true);
  };

  const nextModalImage = () => {
    if (product?.images && product.images.length > 1) {
      setModalImageTransition(true);
      setModalImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevModalImage = () => {
    if (product?.images && product.images.length > 1) {
      setModalImageTransition(true);
      setModalImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  const handleSwipeStart = (e: React.TouchEvent) => {
    setSwipeStartX(e.touches[0].clientX);
    setSwipeStartY(e.touches[0].clientY);
  };

  const handleSwipeEnd = (e: React.TouchEvent) => {
    const swipeEndX = e.changedTouches[0].clientX;
    const swipeEndY = e.changedTouches[0].clientY;
    const swipeDiffX = swipeStartX - swipeEndX;
    const swipeDiffY = Math.abs(swipeStartY - swipeEndY);
    
    // Only allow horizontal swipes, not vertical ones
    // Require horizontal movement to be significantly greater than vertical
    const minHorizontalThreshold = 50;
    const horizontalDistance = Math.abs(swipeDiffX);
    
    if (horizontalDistance > minHorizontalThreshold && horizontalDistance > swipeDiffY * 1.5) {
      if (swipeDiffX > 0) {
        // Swiped left, go to next product
        navigateToNextProduct();
      } else {
        // Swiped right, go to previous product
        navigateToPreviousProduct();
      }
    }
  };

  const navigateToNextProduct = () => {
    if (!product || allProducts.length === 0) return;

    // Find current product index
    const currentIndex = allProducts.findIndex(p => p.name === product.name);
    
    // Get next product index (loop to first product if at the end)
    const nextIndex = (currentIndex + 1) % allProducts.length;
    const nextProduct = allProducts[nextIndex];

    if (nextProduct) {
      setProductTransitionActive(true);
      setProductTransitionDirection('left');
      setTimeout(() => {
        navigate(`/product/${encodeURIComponent(nextProduct.name)}`, { state: { from: 'animation' } });
      }, 300);
    }
  };

  const navigateToPreviousProduct = () => {
    if (!product || allProducts.length === 0) return;

    // Find current product index
    const currentIndex = allProducts.findIndex(p => p.name === product.name);
    
    // Get previous product index (loop to last product if at the beginning)
    const prevIndex = (currentIndex - 1 + allProducts.length) % allProducts.length;
    const prevProduct = allProducts[prevIndex];

    if (prevProduct) {
      setProductTransitionActive(true);
      setProductTransitionDirection('right');
      setTimeout(() => {
        navigate(`/product/${encodeURIComponent(prevProduct.name)}`, { state: { from: 'animation' } });
      }, 300);
    }
  };

  // Image gallery swipe handlers
  const handleImageSwipeStart = (e: React.TouchEvent) => {
    setImageSwipeStartX(e.touches[0].clientX);
    setImageSwipeStartY(e.touches[0].clientY);
  };

  const handleImageSwipeEnd = (e: React.TouchEvent) => {
    const swipeEndX = e.changedTouches[0].clientX;
    const swipeEndY = e.changedTouches[0].clientY;
    const swipeDiffX = imageSwipeStartX - swipeEndX;
    const swipeDiffY = Math.abs(imageSwipeStartY - swipeEndY);
    
    // Only allow horizontal swipes, not vertical ones
    const minHorizontalThreshold = 30; // Lower threshold for image gallery
    const horizontalDistance = Math.abs(swipeDiffX);
    
    // Only navigate images if we have more than one image
    if (product?.images && product.images.length > 1 && horizontalDistance > minHorizontalThreshold && horizontalDistance > swipeDiffY * 1.5) {
      if (swipeDiffX > 0) {
        // Swiped left, go to next image
        nextImage();
      } else {
        // Swiped right, go to previous image
        prevImage();
      }
    }
  };

  // Modal image swipe handlers
  const handleModalImageSwipeStart = (e: React.TouchEvent) => {
    setImageSwipeStartX(e.touches[0].clientX);
    setImageSwipeStartY(e.touches[0].clientY);
  };

  const handleModalImageSwipeEnd = (e: React.TouchEvent) => {
    const swipeEndX = e.changedTouches[0].clientX;
    const swipeEndY = e.changedTouches[0].clientY;
    const swipeDiffX = imageSwipeStartX - swipeEndX;
    const swipeDiffY = Math.abs(imageSwipeStartY - swipeEndY);
    
    // Only allow horizontal swipes, not vertical ones
    const minHorizontalThreshold = 30;
    const horizontalDistance = Math.abs(swipeDiffX);
    
    // Only navigate images if we have more than one image
    if (product?.images && product.images.length > 1 && horizontalDistance > minHorizontalThreshold && horizontalDistance > swipeDiffY * 1.5) {
      if (swipeDiffX > 0) {
        // Swiped left, go to next image
        nextModalImage();
      } else {
        // Swiped right, go to previous image
        prevModalImage();
      }
    }
  };



  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-lg p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Product Not Found</h2>
          <p className="text-gray-600 mb-4">
            The product you're looking for doesn't exist or may have been removed.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Product: <code className="bg-gray-100 px-2 py-1 rounded">{decodeURIComponent(name || '')}</code>
          </p>
          <Button 
            onClick={() => navigate('/products')}
            className="w-full"
          >
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{product?.name ? `${product.name.toLowerCase()} protein bar | Low-Calorie, High Protein | Freel It` : "Healthy snacks & Protein Bars | Freel It"}</title>
        <meta
          name="description"
          content={product?.description || "A low calorie protein bar with high protein, real ingredients, and no added sugar. No preservatives or artificial stuff - a clean snack built for everyday energy."}
        />
        {product?.name && (
          <link
            rel="canonical"
            href={`https://freelit.in/product/${encodeURIComponent(product.name)}`}
          />
        )}
        {product && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "Product",
              "name": product.name,
              "description": product.description || "Low calorie protein bars made with clean, natural ingredients. No sugar, high protein.",
              "image": product.images && product.images.length > 0 ? product.images.map(img => getHeroImageUrl(img)) : [],
              "brand": {
                "@type": "Brand",
                "name": "Freel It"
              },
              "offers": {
                "@type": "Offer",
                "price": product.price_15g?.toString() || "0",
                "priceCurrency": "INR",
                "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                "url": `https://freelit.in/product/${encodeURIComponent(product.name)}`
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.5",
                "ratingCount": "100"
              }
            })}
          </script>
        )}
      </Helmet>
      <div 
        className="min-h-screen w-full bg-[#b5edce]/30"
        style={{
          opacity: productTransitionActive ? 0.3 : 1,
          transform: productTransitionActive ? (productTransitionDirection === 'left' ? 'translateX(-30px)' : 'translateX(30px)') : 'translateX(0)',
          transition: productTransitionActive ? 'all 0.3s ease-in' : 'all 0.3s ease-out',
          pointerEvents: productTransitionActive ? 'none' : 'auto'
        }}
      >
        <div className="container mx-auto px-4 pt-6 md:pt-0">

    {/* Animated Hero Section - Suit-Up Reveal Effect (Desktop Only) */}
    <div className="mb-0 hidden md:flex justify-center">
      <div className="relative h-96 w-full max-w-4xl md:h-screen md:max-w-full overflow-hidden flex items-center justify-center">
          {/* Base Image (Undressed) */}
          <img 
            src={getAnimationImages(product?.name).undressed} 
            alt="low calorie protein bar choco nut"
            width="800"
            height="800"
            className="w-full h-full object-contain absolute inset-0 drop-shadow-2xl"
            loading="eager"
            decoding="async"
            style={{ 
              aspectRatio: '1',
              transform: product?.name?.toLowerCase() === 'cranberry cocoa' ? 'rotate(-90deg) scale(0.75)' : product?.name?.toLowerCase() === 'caramelly peanut' ? 'rotate(-90deg) scale(0.78)' : 'rotate(-90deg)'
            }}
          />

          {/* Overlay Image (Dressed) with Reveal Animation */}
          <img 
            src={getAnimationImages(product?.name).dressed} 
            alt="freel it low calorie protein bar" 
            width="800"
            height="800"
            className="w-full h-full object-contain absolute inset-0 image-reveal-left -rotate-90"
            loading="eager"
            decoding="async"
            style={{ aspectRatio: '1' }}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 md:-mt-40">
        <div className="relative">
          <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
            <DialogTrigger asChild>
              <div 
                className="w-full max-w-xs md:max-w-lg bg-white rounded-lg mb-2 mx-auto flex items-center justify-center overflow-hidden relative aspect-square cursor-pointer"
                onTouchStart={handleImageSwipeStart}
                onTouchEnd={handleImageSwipeEnd}
              >
                {product.images && product.images.length > 0 ? (
                  <>
                    <div 
                      className="w-full h-full flex"
                      style={{
                        transform: `translateX(-${currentImageIndex * 100}%)`,
                        transition: imageTransition ? 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'transform 0s',
                        willChange: 'transform'
                      }}
                    >
                      {product.images.map((image, index) => (
                        <img
                          key={index}
                          src={getHeroImageUrl(image)}
                          alt={`${product.name} low calorie high protein bar image ${index + 1}`}
                          className="w-full h-full object-contain flex-shrink-0"
                          onClick={() => openImageModal(index)}
                          loading={index === 0 ? 'eager' : getLazyLoadingStrategy('hero')}
                        />
                      ))}
                    </div>
                    {product.images.length > 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            prevImage();
                          }}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white border-0 rounded-full p-2 shadow-md"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            nextImage();
                          }}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white border-0 rounded-full p-2 shadow-md"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-muted-foreground">
                    No image available
                  </div>
                )}
              </div>
            </DialogTrigger>
            <DialogContent className="w-[90vw] max-w-4xl h-[80vh] p-0 md:max-w-[18rem] md:h-[20vh]">
              <DialogTitle className="sr-only">Product Image Gallery</DialogTitle>
              <DialogDescription className="sr-only">Enlarged product image view. Use arrow buttons to navigate between images.</DialogDescription>
              <div 
                className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden"
                onTouchStart={handleModalImageSwipeStart}
                onTouchEnd={handleModalImageSwipeEnd}
              >
                {product.images && product.images.length > 0 && (
                  <>
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        transform: `translateX(-${modalImageIndex * 100}%)`,
                        transition: modalImageTransition ? 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'transform 0s',
                        willChange: 'transform'
                      }}
                    >
                      {product.images.map((image, index) => (
                        <img
                          key={index}
                          src={getHeroImageUrl(image)}
                          alt={`${product.name} low calorie high protein bar image ${index + 1}`}
                          className="w-full h-full object-contain flex-shrink-0"
                          loading={index === 0 ? 'eager' : getLazyLoadingStrategy('modal')}
                        />
                      ))}
                    </div>
                    {product.images.length > 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={prevModalImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white border-0 rounded-full p-3 shadow-md"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={nextModalImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white border-0 rounded-full p-3 shadow-md"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </Button>
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                          {product.images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setModalImageIndex(index)}
                              className={cn(
                                "w-3 h-3 rounded-full transition-all",
                                index === modalImageIndex ? "bg-white" : "bg-white/50"
                              )}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Mobile: Thumbnails below image - centered & scrollable */}
          {product.images && product.images.length > 1 && (
            <div className="flex md:hidden gap-2 mt-3 overflow-x-auto pb-2 justify-center px-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={cn(
                    "flex-shrink-0 w-10 h-10 rounded border-2 overflow-hidden transition-all",
                    index === currentImageIndex ? "border-gray-300 hover:border-gray-400" : "border-gray-300 hover:border-gray-400"
                  )}
                  style={{
                    ...(index === currentImageIndex && {
                      borderColor: `#${accentColor}`,
                      boxShadow: `0 0 0 2px rgba(${parseInt(accentColor.slice(0, 2), 16)}, ${parseInt(accentColor.slice(2, 4), 16)}, ${parseInt(accentColor.slice(4, 6), 16)}, 0.3)`
                    })
                  }}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

        </div>

        <div>
          <div className="flex items-start gap-4 mb-3">
            <div className="flex-1">
              <h1 className="font-saira font-black text-4xl md:text-5xl mb-1 uppercase-text" style={{ color: `#${accentColor}` }}>{product.name}</h1>
              <p className="font-poppins font-black uppercase text-[#3b2a20] text-lg md:text-lg">PROTEIN BAR</p>
            </div>
            {product.stock === 0 && (
              <div className="bg-red-500 text-white px-3 md:px-4 py-2 rounded-lg font-bold text-xs md:text-sm whitespace-nowrap">
                OUT OF STOCK
              </div>
            )}
          </div>
          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              onClick={() => setSelectedProtein("15g")}
              disabled={product.stock_status_15g === false}
              className={cn(
                "flex-1 px-3 md:px-6 py-2 md:py-3 font-poppins font-bold text-xs md:text-sm uppercase border-0 relative transition-all duration-200 hover:scale-105 active:scale-95",
                selectedProtein === "15g" ? "bg-[#b5edce] text-black shadow-lg" : "bg-white text-black hover:shadow-md",
                product.stock_status_15g === false && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex flex-col items-center">
                <span className="text-xs md:text-sm">15g Protein</span>
                {product.stock_status_15g === false && (
                  <span className="text-xs text-red-600 font-semibold mt-1">Out of Stock</span>
                )}
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedProtein("20g")}
              disabled={product.stock_status_20g === false}
              className={cn(
                "flex-1 px-3 md:px-6 py-2 md:py-3 font-poppins font-bold text-xs md:text-sm uppercase border-0 relative transition-all duration-200 hover:scale-105 active:scale-95",
                selectedProtein === "20g" ? "bg-[#b5edce] text-black shadow-lg" : "bg-white text-black hover:shadow-md",
                product.stock_status_20g === false && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex flex-col items-center">
                <span className="text-xs md:text-sm">20g Protein</span>
                {product.stock_status_20g === false && (
                  <span className="text-xs text-red-600 font-semibold mt-1">Out of Stock</span>
                )}
              </div>
            </Button>
          </div>
          <div className="flex items-center gap-4 mb-5">
          {(() => {
            const basePrice = selectedProtein === "15g" ? product.price_15g : product.price_20g;
            const originalPrice = selectedProtein === "15g" ? product.original_price_15g : product.original_price_20g;
            
            // Debug logging
            if (!originalPrice) {
              console.log('[ProductDetail] Price render - No original price found:', {
                selectedProtein,
                originalPrice,
                product_original_price_15g: product.original_price_15g,
                product_original_price_20g: product.original_price_20g,
                basePrice
              });
            }
            
            const subtotal = basePrice * selectedQuantity;
            let finalPrice = subtotal;
            let discount = 0;
            let appliedDiscountPercent = 0;
            
            // Apply combo pack discount
            // 3-pack discount applies to 3, 4, 5 bars
            // 6-pack discount applies to 6, 7, 8, 9, 10, 11 bars
            // 12-pack discount applies to 12+ bars
            if (selectedQuantity >= 12 && product.combo_12_discount) {
              discount = (subtotal * product.combo_12_discount) / 100;
              finalPrice = subtotal - discount;
              appliedDiscountPercent = product.combo_12_discount;
            } else if (selectedQuantity >= 6 && product.combo_6_discount) {
              discount = (subtotal * product.combo_6_discount) / 100;
              finalPrice = subtotal - discount;
              appliedDiscountPercent = product.combo_6_discount;
            } else if (selectedQuantity >= 3 && product.combo_3_discount) {
              discount = (subtotal * product.combo_3_discount) / 100;
              finalPrice = subtotal - discount;
              appliedDiscountPercent = product.combo_3_discount;
            }
            
            return (
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="font-montserrat text-2xl md:text-4xl font-black text-black">
                    ₹{finalPrice.toFixed(2)}
                  </p>
                  {originalPrice && originalPrice > 0 && basePrice && originalPrice > basePrice && (
                    <p className="font-montserrat text-lg md:text-2xl" style={{ 
                      color: '#999', 
                      textDecoration: 'line-through',
                      textDecorationThickness: '2px',
                      textDecorationColor: 'currentColor'
                    }}>
                      ₹{(originalPrice * selectedQuantity).toFixed(2)}
                    </p>
                  )}
                </div>
                {(discount > 0 || (originalPrice && originalPrice > 0 && originalPrice > basePrice)) && (
                  <p className="text-xs md:text-sm text-green-600 font-bold mt-2">
                    {discount > 0 && `Save ₹${discount.toFixed(2)} (${appliedDiscountPercent}%)`}
                    {discount > 0 && originalPrice && originalPrice > 0 && originalPrice > basePrice && ' • '}
                    {originalPrice && originalPrice > 0 && originalPrice > basePrice && `Special Price Below MRP`}
                  </p>
                )}
              </div>
            );
          })()}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={decreaseQuantity}
                className="h-8 w-8 rounded-full p-0 transition-all duration-200 hover:scale-110 active:scale-75 touch-action-manipulation"
                disabled={selectedQuantity <= minOrderQuantity}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-poppins font-bold text-lg min-w-[2rem] text-center">{selectedQuantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={increaseQuantity}
                className="h-8 w-8 rounded-full p-0 transition-all duration-200 hover:scale-110 active:scale-75 touch-action-manipulation"
              >
                <Plus className="h-4 w-4" />
              </Button>
              {minOrderQuantity > 1 && (
                <span className="text-sm text-muted-foreground ml-2">
                  Min: {minOrderQuantity}
                </span>
              )}
            </div>
          </div>

          <div className="mb-8">
            <div className="flex gap-2 flex-wrap">
              <div className="flex-1 min-w-[100px] flex flex-col items-center">
                <Button
                  variant="outline"
                  onClick={() => setSelectedQuantity(3)}
                  className={cn(
                    "w-full rounded-lg bg-white text-black border-0 hover:bg-black hover:text-white px-2 md:px-8 py-2 md:py-3 active:scale-105 active:shadow-xl transition-all duration-150 uppercase",
                    selectedQuantity === 3 && "bg-white text-black border-2 border-black"
                  )}
                >
                  <span className="font-poppins font-black text-sm md:text-lg">3-PACK</span>
                </Button>
                {product.combo_3_discount > 0 && (
                  <span className="text-xs text-green-600 font-bold mt-1">{product.combo_3_discount}% OFF</span>
                )}
              </div>
              <div className="flex-1 min-w-[100px] flex flex-col items-center">
                <Button
                  variant="outline"
                  onClick={() => setSelectedQuantity(6)}
                  className={cn(
                    "w-full rounded-lg bg-white text-black border-0 hover:bg-black hover:text-white px-2 md:px-8 py-2 md:py-3 active:scale-[0.97] transition-all duration-75 uppercase touch-action-manipulation",
                    selectedQuantity === 6 && "bg-white text-black border-2 border-black"
                  )}
                >
                  <span className="font-poppins font-black text-sm md:text-lg">6-PACK</span>
                </Button>
                {product.combo_6_discount > 0 && (
                  <span className="text-xs text-green-600 font-bold mt-1">{product.combo_6_discount}% OFF</span>
                )}
              </div>
              <div className="flex-1 min-w-[100px] flex flex-col items-center">
                <Button
                  variant="outline"
                  onClick={() => setSelectedQuantity(12)}
                  className={cn(
                    "w-full rounded-lg bg-white text-black border-0 hover:bg-black hover:text-white px-2 md:px-8 py-2 md:py-3 active:scale-[0.97] transition-all duration-75 uppercase touch-action-manipulation",
                    selectedQuantity === 12 && "bg-white text-black border-2 border-black"
                  )}
                >
                  <span className="font-poppins font-black text-sm md:text-lg">12-PACK</span>
                </Button>
                {product.combo_12_discount > 0 && (
                  <span className="text-xs text-green-600 font-bold mt-1">{product.combo_12_discount}% OFF</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
            <Button
              onClick={handleAddToCart}
              disabled={
                product.stock === 0 || 
                product.stock < selectedQuantity || 
                (selectedProtein === "15g" && product.stock_status_15g === false) ||
                (selectedProtein === "20g" && product.stock_status_20g === false)
              }
              className="flex-1 min-w-[130px] font-poppins font-black text-white py-2 md:py-4 text-[10px] sm:text-xs md:text-lg uppercase transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:text-white touch-action-manipulation shadow-md hover:shadow-lg"
              style={{
                backgroundColor: `#${accentColor}`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'white', e.currentTarget.style.color = `#${accentColor}`)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = `#${accentColor}`, e.currentTarget.style.color = 'white')}
            >
              <ShoppingCart className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              {product.stock === 0 || 
               (selectedProtein === "15g" && product.stock_status_15g === false) ||
               (selectedProtein === "20g" && product.stock_status_20g === false) 
                ? "Out of Stock" 
                : "Add to Cart"}
            </Button>
            
            <Button
              onClick={handleBuyNow}
              disabled={
                product.stock === 0 || 
                product.stock < selectedQuantity || 
                (selectedProtein === "15g" && product.stock_status_15g === false) ||
                (selectedProtein === "20g" && product.stock_status_20g === false)
              }
              className="flex-1 min-w-[100px] font-poppins font-black text-white py-2 md:py-4 text-[10px] sm:text-xs md:text-lg uppercase transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:text-white touch-action-manipulation shadow-md hover:shadow-lg"
              style={{
                backgroundColor: `#${accentColor}`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'white', e.currentTarget.style.color = `#${accentColor}`)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = `#${accentColor}`, e.currentTarget.style.color = 'white')}
            >
              Buy Now
            </Button>

            {cartQuantity >= minOrderQuantity && (
              <Button
                onClick={() => navigate("/cart")}
                className="px-2 md:px-3 py-2 md:py-4 font-poppins font-black text-white transition-all duration-200 hover:scale-110 active:scale-90 relative shrink-0 hover:text-white touch-action-manipulation shadow-md hover:shadow-lg"
                style={{
                  backgroundColor: `#${accentColor}`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'white', e.currentTarget.style.color = `#${accentColor}`)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = `#${accentColor}`, e.currentTarget.style.color = 'white')}
              >
                <ShoppingBag className="h-3 w-3 md:h-4 md:w-4" />
                <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-red-500 text-white rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center text-[10px] md:text-xs font-bold">
                  {cartQuantity}
                </div>
              </Button>
            )}
            <Button
              variant={isFavorite ? "default" : "outline"}
              onClick={toggleFavorite}
              className={cn(
                "px-2 md:px-3 py-2 md:py-4 font-poppins font-bold transition-all duration-300 hover:scale-120 active:scale-90 shrink-0 touch-action-manipulation",
                isFavorite && "bg-red-500 text-white hover:bg-red-600 border-red-500 shadow-lg hover:shadow-xl"
              )}
            >
              <Heart className={cn("h-3 w-3 md:h-5 md:w-5", isFavorite ? "fill-current text-white" : "")} />
            </Button>
          </div>

          {/* PC: Thumbnails below Add to Cart button */}
          {product.images && product.images.length > 1 && (
            <div className="hidden md:flex gap-3 mt-4 overflow-x-auto pb-2 justify-center">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={cn(
                    "flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden transition-all",
                    index === currentImageIndex ? "border-gray-300 hover:border-gray-400" : "border-gray-300 hover:border-gray-400"
                  )}
                  style={{
                    ...(index === currentImageIndex && {
                      borderColor: `#${accentColor}`,
                      boxShadow: `0 0 0 2px rgba(${parseInt(accentColor.slice(0, 2), 16)}, ${parseInt(accentColor.slice(2, 4), 16)}, ${parseInt(accentColor.slice(4, 6), 16)}, 0.3)`
                    })
                  }}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Animated Hero Section - Mobile Only (between buttons and description) */}
      <div ref={animationSectionRef} className="mb-0 flex md:hidden justify-center mt-2">
        <div 
          className="relative h-96 w-full overflow-hidden flex items-center justify-center group"
          onTouchStart={handleSwipeStart}
          onTouchEnd={handleSwipeEnd}
        >
          {/* Base Image (Undressed) */}
          <img 
            src={getAnimationImages(product?.name).undressed} 
            alt="low calorie protein bar choco nut"
            width="400"
            height="400"
            className="w-full h-full object-contain absolute inset-0 drop-shadow-lg"
            loading="eager"
            decoding="async"
            style={{ 
              aspectRatio: '1',
              transform: product?.name?.toLowerCase() === 'cranberry cocoa' ? 'rotate(-90deg) scale(0.75)' : product?.name?.toLowerCase() === 'caramelly peanut' ? 'rotate(-90deg) scale(0.78)' : 'rotate(-90deg)'
            }}
          />

          {/* Overlay Image (Dressed) with Reveal Animation */}
          <img 
            src={getAnimationImages(product?.name).dressed} 
            alt="freel it low calorie protein bar" 
            width="400"
            height="400"
            className="w-full h-full object-contain absolute inset-0 image-reveal-left -rotate-90"
            loading="eager"
            decoding="async"
            style={{ aspectRatio: '1' }}
          />

          {/* Left Navigation Button */}
          <Button
            onClick={navigateToPreviousProduct}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white border-0 rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            size="sm"
            variant="outline"
          >
            <ChevronLeft className="h-5 w-5 text-black" />
          </Button>

          {/* Right Navigation Button */}
          <Button
            onClick={navigateToNextProduct}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white border-0 rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            size="sm"
            variant="outline"
          >
            <ChevronRight className="h-5 w-5 text-black" />
          </Button>

          {/* Swipe Indicator - Always Visible */}
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-1">
            {/* Swipe arrows animation */}
            <div className="flex gap-1 justify-center">
              <svg className="w-4 h-4 text-gray-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <svg className="w-4 h-4 text-gray-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <span className="text-xs text-gray-600 bg-white/70 px-2 py-1 rounded font-medium">Swipe for more</span>
          </div>
        </div>
      </div>

      </div>

      {/* New section for protein bars */}
      {product.category === 'protein_bars' && (
        <div className="py-2 w-full" style={{ backgroundColor: `#${accentColor}` }}>
          <div className="w-full">
            <div className="px-4 mb-12 pt-8 ">
              <h2 className="font-saira font-black text-2xl text-left text-[#b5edce] uppercase">Product description:</h2>
              <p className="font-saira font-semibold text-xl text-white mt-4 whitespace-pre-line">
                {product.description || "No description available"}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-12 max-w-none px-4">
              {product.ingredients && product.ingredients.length > 0 && (
                <div className="border-4 border-white p-8 rounded-lg" style={{ backgroundColor: `#${accentColor}` }}>
                  <h3 className="font-saira font-black text-2xl text-white uppercase mb-4">Inside The Bar</h3>
                  <hr className="border-white mb-4" />
                  <ul className="text-white font-tomorrow list-disc list-inside space-y-1 md:text-lg">
                    {product.ingredients.map((ingredient, idx) => (
                      <li key={idx}>{ingredient}</li>
                    ))}
                  </ul>
                </div>
              )}
              {product.nutrition && (
                <div className="border-4 border-white p-8 rounded-lg" style={{ backgroundColor: `#${accentColor}` }}>
                  <h3 className="font-saira font-black text-2xl text-white uppercase mb-4">Nutrition Info</h3>
                  <hr className="border-white mb-4" />
                  <table className="w-full text-white font-tomorrow">
                    <thead>
                      <tr className="border-b border-white">
                        <th className="text-left py-2"></th>
                        <th className="text-center py-2">per ({product.nutrition?.serving_size_1_g ?? product.serving_size_1_g ?? 60} g)</th>
                        <th className="text-center py-2">({product.nutrition?.serving_size_2_g ?? product.serving_size_2_g ?? 100} g)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-white/30">
                        <td className="py-2">energy (kcal)</td>
                        <td className="text-center py-2">{product.nutrition?.energy_serving_1 ?? product.energy_serving_1 ?? product.nutrition?.energy_60g ?? 0}</td>
                        <td className="text-center py-2">{product.nutrition?.energy_serving_2 ?? product.energy_serving_2 ?? product.nutrition?.energy_100g ?? 0}</td>
                      </tr>
                      <tr className="border-b border-white/30">
                        <td className="py-2">protein (g)</td>
                        <td className="text-center py-2">{product.nutrition?.protein_serving_1 ?? product.protein_serving_1 ?? product.nutrition?.protein_60g ?? 0}</td>
                        <td className="text-center py-2">{product.nutrition?.protein_serving_2 ?? product.protein_serving_2 ?? product.nutrition?.protein_100g ?? 0}</td>
                      </tr>
                      <tr className="border-b border-white/30">
                        <td className="py-2">carbohydrates (g)</td>
                        <td className="text-center py-2">{product.nutrition?.carbs_serving_1 ?? product.carbs_serving_1 ?? product.nutrition?.carbs_60g ?? 0}</td>
                        <td className="text-center py-2">{product.nutrition?.carbs_serving_2 ?? product.carbs_serving_2 ?? product.nutrition?.carbs_100g ?? 0}</td>
                      </tr>
                      <tr className="border-b border-white/30">
                        <td className="py-2 pl-4">total sugars (g)</td>
                        <td className="text-center py-2">{product.nutrition?.sugars_serving_1 ?? product.sugars_serving_1 ?? product.nutrition?.sugars_60g ?? 0}</td>
                        <td className="text-center py-2">{product.nutrition?.sugars_serving_2 ?? product.sugars_serving_2 ?? product.nutrition?.sugars_100g ?? 0}</td>
                      </tr>
                      <tr className="border-b border-white/30">
                        <td className="py-2 pl-8">added sugars (g)</td>
                        <td className="text-center py-2">{product.nutrition?.added_sugars_serving_1 ?? product.added_sugars_serving_1 ?? product.nutrition?.added_sugars_60g ?? 0}</td>
                        <td className="text-center py-2">{product.nutrition?.added_sugars_serving_2 ?? product.added_sugars_serving_2 ?? product.nutrition?.added_sugars_100g ?? 0}</td>
                      </tr>
                      <tr className="border-b border-white/30">
                        <td className="py-2">fat (g)</td>
                        <td className="text-center py-2">{product.nutrition?.fat_serving_1 ?? product.fat_serving_1 ?? product.nutrition?.fat_60g ?? 0}</td>
                        <td className="text-center py-2">{product.nutrition?.fat_serving_2 ?? product.fat_serving_2 ?? product.nutrition?.fat_100g ?? 0}</td>
                      </tr>
                      <tr className="border-b border-white/30">
                        <td className="py-2 pl-4">saturated fat (g)</td>
                        <td className="text-center py-2">{product.nutrition?.sat_fat_serving_1 ?? product.sat_fat_serving_1 ?? product.nutrition?.sat_fat_60g ?? 0}</td>
                        <td className="text-center py-2">{product.nutrition?.sat_fat_serving_2 ?? product.sat_fat_serving_2 ?? product.nutrition?.sat_fat_100g ?? 0}</td>
                      </tr>
                      <tr className="border-b border-white/30">
                        <td className="py-2 pl-4">trans fat (g)</td>
                        <td className="text-center py-2">{product.nutrition?.trans_fat_serving_1 ?? product.trans_fat_serving_1 ?? product.nutrition?.trans_fat_60g ?? 0}</td>
                        <td className="text-center py-2">{product.nutrition?.trans_fat_serving_2 ?? product.trans_fat_serving_2 ?? product.nutrition?.trans_fat_100g ?? 0}</td>
                      </tr>
                      <tr className="border-b border-white/30">
                        <td className="py-2 pl-4">sodium (mg)</td>
                        <td className="text-center py-2">{product.nutrition?.sodium_serving_1 ?? product.sodium_serving_1 ?? 0}</td>
                        <td className="text-center py-2">{product.nutrition?.sodium_serving_2 ?? product.sodium_serving_2 ?? 0}</td>
                      </tr>
                      <tr className="border-b border-white/30">
                        <td className="py-2 pl-4">cholesterol (mg)</td>
                        <td className="text-center py-2">{product.nutrition?.cholesterol_serving_1 ?? product.cholesterol_serving_1 ?? 0}</td>
                        <td className="text-center py-2">{product.nutrition?.cholesterol_serving_2 ?? product.cholesterol_serving_2 ?? 0}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lab Reports Section */}
      <div className="bg-white py-6 sm:py-8 md:py-10 w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <ProductLabReports productId={product.id} />
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 py-6 sm:py-8 md:py-10 w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <ProductFAQ productId={product.id} />
        </div>
      </div>

      {/* New section for protein bars benefits */}
      {product.category === 'protein_bars' && (
        <div className="bg-white py-10 w-full mt">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="font-saira font-black text-3xl md:text-5xl uppercase mb-4" style={{ color: `#${accentColor}` }}>
                Not Just a Regular Real-Ingredient Bar, but a Bar Built Better.
              </h2>
              <p className="font-saira font-semibold text-xl md:text-3xl text-[#b5edce] mb-8">
                Real ingredients. Balanced calories. More protein.
              </p>
            </div>

            <div className="bg-white h-48 md:h-48 w-full flex items-center justify-center gap-8 mb-8">
              <div className="grid grid-cols-2 md:flex md:flex-row gap-8">
                <img src={image2} alt="Ingredient benefits infographic 1" width="160" height="160" className="h-28 md:h-40 w-auto" loading="lazy" decoding="async" style={{ aspectRatio: '1' }} />
                <img src={image4} alt="Ingredient benefits infographic 2" width="160" height="160" className="h-28 md:h-40 w-auto" loading="lazy" decoding="async" style={{ aspectRatio: '1' }} />
                <img src={image8} alt="Ingredient benefits infographic 3" width="160" height="160" className="h-28 md:h-40 w-auto" loading="lazy" decoding="async" style={{ aspectRatio: '1' }} />
                <img src={image10} alt="Ingredient benefits infographic 4" width="160" height="160" className="h-28 md:h-40 w-auto" loading="lazy" decoding="async" style={{ aspectRatio: '1' }} />
              </div>
            </div>

            <div className="text-center">
              <h3 className="font-saira font-black text-xl md:text-3xl text-black uppercase">
                Everything in balance, the way food should be.
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Rating Section */}
      <div className="bg-[#c9f4dd] w-full py-12 mb-0">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-center justify-center mb-6 w-full">
              <ProductRatingSummary productId={product.id} />
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="text-white font-saira font-black uppercase px-6 py-3 mt-4" style={{ backgroundColor: `#${accentColor}` }} onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')} onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
                    Rate This Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogTitle>Rate This Product</DialogTitle>
                  <DialogDescription>Share your experience with this product</DialogDescription>
                  <RatingComponent productId={product.id} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="bg-white w-full py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <ProductRatingsDisplay productId={product.id} />
          </div>
        </div>
      </div>

      {/* Internal Navigation Links for SEO */}
      <div className="bg-gray-50 w-full py-8 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="px-6 py-2 text-white rounded transition text-center font-poppins font-semibold hover:opacity-90"
                style={{ backgroundColor: `#${accentColor}` }}
              >
                See All Products
              </Link>
              <Link
                to="/"
                className="px-6 py-2 bg-[#b5edce] text-[#3b2a20] rounded hover:bg-[#a0d9ba] transition text-center font-poppins font-semibold"
              >
                Back to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>

      </div>
    </>
  );
};

export default ProductDetail;
