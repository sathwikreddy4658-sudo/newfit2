import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import animationVideo from "@/assets/freelit-animation.mp4";
import newProteinBarImage from "@/assets/newproteinbar.jpg";
import image2 from "@/assets/2.png";
import image4 from "@/assets/4.png";
import image6 from "@/assets/6.png";
import image8 from "@/assets/8.png";
import image10 from "@/assets/10.png";
import image24 from "@/assets/24.png";

const Index = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showMobileShopBar, setShowMobileShopBar] = useState(true);
  const widgetsRef = useRef<HTMLDivElement>(null);
  const shopNowSectionRef = useRef<HTMLDivElement>(null);
  const hasScrolledPastRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (widgetsRef.current) {
        const rect = widgetsRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const elementTop = rect.top;
        const elementHeight = rect.height;

        // Calculate progress: 0 when top of element enters viewport, 1 when bottom leaves
        let progress = 0;
        if (elementTop < windowHeight && elementTop + elementHeight > 0) {
          progress = Math.min(1, Math.max(0, (windowHeight - elementTop) / (windowHeight + elementHeight)));
        }
        setScrollProgress(progress);
      }

      // Check if the Shop Now section is visible
      if (shopNowSectionRef.current) {
        const rect = shopNowSectionRef.current.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        
        // If button is visible again, reset the flag (user scrolled back up)
        if (isVisible) {
          hasScrolledPastRef.current = false;
        }
        // If user scrolls past the button (bottom above viewport), mark it
        else if (rect.bottom < 0) {
          hasScrolledPastRef.current = true;
        }
        
        // Show sticky bar only if button is not visible AND we haven't scrolled past it
        const shouldShow = !isVisible && !hasScrolledPastRef.current;
        setShowMobileShopBar(shouldShow);
      }
    };

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const getWidgetStyles = (index: number) => {
    const isMobile = windowWidth < 768;
    const baseStyles = {
      position: 'absolute' as const,
      transition: isMobile ? 'all 0.8s ease-out' : 'all 0.3s ease-out', // Slower transition on mobile
      width: isMobile ? '240px' : '400px', // w-60 on mobile, w-96 on desktop
      height: isMobile ? '180px' : '300px', // h-45 on mobile, h-72 on desktop
      zIndex: 1,
    };

    // Phase 1: Tiny and attached (progress 0-0.1)
    if (scrollProgress < 0.1) {
      const scale = 0.1 + (scrollProgress / 0.1) * 0.9; // 0.1 to 1.0
      const opacity = scrollProgress / 0.1; // 0 to 1
      return {
        ...baseStyles,
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
      };
    }
    // Phase 2: Growing and separating (progress 0.1-0.25)
    else if (scrollProgress < 0.25) {
      const isMobile = windowWidth < 768;
      const positions = isMobile
        ? [{ left: '50%', top: '10%' }, { left: '50%', top: '50%' }, { left: '50%', top: '90%' }]
        : ['0%', '50%', '100%'];
      const scale = 1;
      const opacity = 1;
      return {
        ...baseStyles,
        left: isMobile ? (positions[index] as { left: string; top: string }).left : positions[index] as string,
        top: isMobile ? (positions[index] as { left: string; top: string }).top : '50%',
        transform: 'translate(-50%, -50%) scale(1)',
        opacity,
      };
    }
    // Phase 3: Slight gap after expansion (progress 0.25-0.5 for mobile, 0.25-0.4 for desktop)
    else if (scrollProgress < (windowWidth < 768 ? 0.5 : 0.4)) {
      const isMobile = windowWidth < 768;
      const positions = isMobile
        ? [{ left: '50%', top: '10%' }, { left: '50%', top: '50%' }, { left: '50%', top: '90%' }]
        : ['0%', '50%', '100%'];
      const scale = 1;
      const opacity = 1;
      return {
        ...baseStyles,
        left: isMobile ? (positions[index] as { left: string; top: string }).left : positions[index] as string,
        top: isMobile ? (positions[index] as { left: string; top: string }).top : '50%',
        transform: 'translate(-50%, -50%) scale(1)',
        opacity,
      };
    }
    // Phase 4: Merging into one big widget on mobile, stay expanded on PC (progress 0.4-1.0)
    else {
      if (isMobile) {
        const mergeProgress = (scrollProgress - 0.4) / 0.6; // 0 to 1
        const scale = 1 + mergeProgress * 0.5; // 1 to 1.5
        const fadeSpeed = 0.5;
        const opacity = 1 - mergeProgress * fadeSpeed;
        return {
          ...baseStyles,
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity: Math.max(0, opacity),
        };
      } else {
        // On PC, keep widgets expanded and separated with slightly increased gaps
        const positions = ['10%', '50%', '90%'];
        return {
          ...baseStyles,
          left: positions[index],
          top: '50%',
          transform: 'translate(-50%, -50%) scale(1)',
          opacity: 1,
        };
      }
    }
  };

  const getMergedStyle = () => {
    const isMobile = windowWidth < 768;
    const gapEnd = isMobile ? 0.5 : 0.4;
    if (scrollProgress < gapEnd) return { opacity: 0 };
    const mergeProgress = (scrollProgress - gapEnd) / (1 - gapEnd); // 0 to 1
    const finalWidth = isMobile ? 245 : 576; // 9 inches = 576px (64px per inch)
    const finalHeight = isMobile ? 480 : 224; // 3.5 inches = 224px (64px per inch)
    const baseStyle = {
      position: 'absolute' as const,
      left: '50%',
      top: isMobile ? '40%' : '30%',
      transform: 'translate(-50%, -50%)',
      width: mergeProgress > 0 ? `${finalWidth}px` : '0px',
      height: mergeProgress > 0 ? `${finalHeight}px` : '0px',
      opacity: Math.min(mergeProgress * 8, 1), // Increases much faster for quick fade-in
      zIndex: 3,
    };

    return baseStyle;
  };

  return (
    <>
      <Helmet>
        <link rel="canonical" href="https://freelit.in/" />
      </Helmet>
    <div className="min-h-screen flex flex-col md:pb-0 pb-20">
      <main className="flex-1">
        <div className="video-heading-container">
          <div className="video-heading">REBUILDING YOUR FAVORITE SNACKS INTO HEALTHIER VERSIONS.</div>
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full mb-0 h-48 md:h-96 object-cover"
          >
            <source src={animationVideo} type="video/mp4" />
          </video>
        </div>
        <div className="bg-[#b5edce]/50 py-20">
          <h1 className="text-6xl font-saira font-black text-[#4e342e] mb-12 text-center">
            BETTER FOOD ISN'T ABOUT LESS. IT'S ABOUT BALANCE.
          </h1>
          <div
            ref={widgetsRef}
            className="relative mt-16 max-w-5xl mx-auto container px-4 mb-12 h-96"
          >
            <Card className="bg-[#4e342e] text-white rounded-lg" style={getWidgetStyles(0)}>
              <CardHeader className="pb-2">
                <CardTitle className={`${windowWidth >= 768 ? 'text-3xl' : 'text-lg'} font-saira font-black text-white uppercase`}>REAL INGREDIENTS</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className={`${windowWidth >= 768 ? 'text-xl' : 'text-sm'} font-saira font-medium text-white`}>Made with real ingredients and free from artificial preservatives or chemicals.</p>
              </CardContent>
            </Card>

            <Card className="bg-[#4e342e] text-white rounded-lg" style={getWidgetStyles(1)}>
              <CardHeader className="pb-2">
                <CardTitle className={`${windowWidth >= 768 ? 'text-3xl' : 'text-lg'} font-saira font-black text-white uppercase`}>BALANCED NUTRITION</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className={`${windowWidth >= 768 ? 'text-xl' : 'text-sm'} font-saira font-medium text-white`}>Designed to offer meaningful nutrition and steady energy without overloading sugar or calories.</p>
              </CardContent>
            </Card>

            <Card className="bg-[#4e342e] text-white rounded-lg" style={getWidgetStyles(2)}>
              <CardHeader className="pb-2">
                <CardTitle className={`${windowWidth >= 768 ? 'text-3xl' : 'text-lg'} font-saira font-black text-white uppercase`}>BETTER SWEETNESS</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className={`${windowWidth >= 768 ? 'text-xl' : 'text-sm'} font-saira font-medium text-white`}>Sweetness, balanced with real and better sources, that goes easy on you.</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center mb-8">
            <img src={image24} alt="Image 24" width="700" height="250" className="w-100 h-100 object-contain spaceship-float" loading="lazy" />
          </div>

          <h3 className="text-2xl font-poppins font-bold text-black mb-4 text-center">
            FEATURING
          </h3>
          <h2 className="text-6xl font-saira font-black text-white mb-8 text-center">
            A BUILT BETTER PROTEIN BAR
          </h2>
          <div className="max-w-3xl mx-auto text-center container px-4">
            <div className="flex flex-col gap-4 items-center justify-center">
              {/* Text with transparency */}
              <p className="button-layer-text text-white opacity-70">
                try our low calorie protein bar
              </p>
              {/* Shop Now button below */}
              <Link to="/product/CHOCO NUT" ref={shopNowSectionRef}>
                <Button size="lg" className="bg-white text-black hover:bg-[#5e4338] hover:text-white font-poppins font-bold">SHOP NOW</Button>
              </Link>
            </div>

          </div>

        </div>

        <div className="bg-white flex-grow py-12 mt-8 flex items-center justify-center min-h-screen">
          <div className="max-w-3xl px-4 text-center">
            <h2 className="text-6xl font-saira font-black text-[#b5edce] mb-8 text-center">
              HOW WE MAKE SNACKING BETTER
            </h2>
            <p className="text-xl font-saira font-medium text-[#3b2a20] mb-8">
              We start with the foods you love - then rebuild them with real ingredients and a balance that keeps both nutrition and flavor in check.<br />
              We don't just make healthy versions, we build better ones.
            </p>
            <div className="flex flex-col items-center gap-4 md:flex-row md:gap-8 md:justify-center">
              <div className="flex gap-4 justify-center md:hidden">
                <img src={image2} alt="Image 2" width="96" height="96" className="w-24 h-24" loading="lazy" />
                <img src={image4} alt="Image 4" width="96" height="96" className="w-24 h-24" loading="lazy" />
                <img src={image6} alt="Image 6" width="96" height="96" className="w-24 h-24" loading="lazy" />
              </div>
              <div className="flex gap-4 justify-center md:hidden">
                <img src={image8} alt="Image 8" width="96" height="96" className="w-24 h-24" loading="lazy" />
                <img src={image10} alt="Image 10" width="96" height="96" className="w-24 h-24" loading="lazy" />
              </div>
              <div className="hidden md:flex gap-8 justify-center">
                <img src={image2} alt="Image 2" width="192" height="192" className="w-48 h-48" loading="lazy" />
                <img src={image4} alt="Image 4" width="192" height="192" className="w-48 h-48" loading="lazy" />
                <img src={image6} alt="Image 6" width="192" height="192" className="w-48 h-48" loading="lazy" />
                <img src={image8} alt="Image 8" width="192" height="192" className="w-48 h-48" loading="lazy" />
                <img src={image10} alt="Image 10" width="192" height="192" className="w-48 h-48" loading="lazy" />
              </div>
            </div>
            {/* OUR STORY Button */}
            <div className="mt-12 flex justify-center">
              <Link to="/about">
                <button
                  className="px-8 py-3 rounded-lg font-poppins font-bold text-white transition-all duration-300 transform hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: '#b5edce',
                    color: 'white',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = 'black';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#b5edce';
                    e.currentTarget.style.color = 'white';
                  }}
                >
                  OUR STORY
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      {/* Mobile Sticky Shop Now Bar - appears when Shop Now button is not visible */}
      {showMobileShopBar && (
        <Link to="/product/CHOCO NUT" className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 pb-4 transition-opacity duration-300">
          <div className="max-w-md bg-white shadow-lg py-4 px-8 text-center rounded-lg border-t-4 border-black">
            <div className="font-poppins font-bold text-lg text-black">
              SHOP NOW
            </div>
          </div>
        </Link>
      )}
    </div>
    </>
  );
};

export default Index;
