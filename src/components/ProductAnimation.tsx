import { useEffect, useState } from "react";
// Set 1 - Current (PB)
import i1 from "@/assets/i1.png";
import i2 from "@/assets/i2.png";
import i3 from "@/assets/i3.png";
import i4 from "@/assets/i4.png";
import i5 from "@/assets/i5.png";
import i6 from "@/assets/i6.png";
import i7 from "@/assets/i7.png";
import dressedpb from "@/assets/dressedpb.png";
import undressedpb from "@/assets/undressedpb.png";

// Set 2 - Cranberry Cocoa
import c1 from "@/assets/c1.png";
import c2 from "@/assets/c2.png";
import c3 from "@/assets/c3.png";
import c4 from "@/assets/c4.png";
import c5 from "@/assets/c5.png";
import c6 from "@/assets/c6.png";
import c7 from "@/assets/c7.png";
import dressedcc from "@/assets/dressedcc.png";
import undressedcc from "@/assets/undressedcc.png";

// Set 3 - Caramelly Peanut
import p1 from "@/assets/p1.png";
import p2 from "@/assets/p2.png";
import p3 from "@/assets/p3.png";
import p4 from "@/assets/p4.png";
import p5 from "@/assets/p5.png";
import p6 from "@/assets/p6.png";
import p7 from "@/assets/p7.png";
import dressedcp from "@/assets/dressedcp.png";
import undressedcp from "@/assets/undressedcp.png";

const ProductAnimation = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [fadeOpacity, setFadeOpacity] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.2 }
    );

    const element = document.getElementById("product-animation");
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  // Single unified timing system
  const CYCLE_TIME = 5000; // 5 seconds per cycle (slower ingredients + longer gap)
  const FADE_START = 73; // When bar starts disappearing (73% of cycle)
  const FADE_END = 100; // End of cycle

  // Cycle through image sets and update fade opacity with unified timing
  useEffect(() => {
    if (!isVisible) {
      setFadeOpacity(1);
      return;
    }

    const animationInterval = setInterval(() => {
      const now = Date.now();
      const cycleStartTime = Math.floor(now / CYCLE_TIME) * CYCLE_TIME;
      const timeInCycle = now - cycleStartTime;
      const progressPercent = (timeInCycle / CYCLE_TIME) * 100;

      // Update set index based on cycles completed
      setCurrentSetIndex(Math.floor(now / CYCLE_TIME) % 3);

      // Sync fade with undressed bar disappearing
      if (progressPercent < FADE_START) {
        setFadeOpacity(1);
      } else if (progressPercent > FADE_END) {
        setFadeOpacity(0);
      } else {
        // Smooth fade between fade start and fade end
        const fadeProgress = (progressPercent - FADE_START) / (FADE_END - FADE_START);
        setFadeOpacity(Math.max(0, 1 - fadeProgress));
      }
    }, 16); // ~60fps

    return () => clearInterval(animationInterval);
  }, [isVisible]);

  // Image sets for the three different product combinations
  const imageSets = [
    {
      ingredients: [
        { src: i1, delay: 0 },
        { src: i2, delay: 0.5 },
        { src: i3, delay: 1.0 },
        { src: i4, delay: 1.5 },
        { src: i5, delay: 2.0 },
        { src: i6, delay: 2.5 },
        { src: i7, delay: 3.0 },
      ],
      wrapper: dressedpb,
      undressedBar: undressedpb,
    },
    {
      ingredients: [
        { src: c1, delay: 0 },
        { src: c2, delay: 0.5 },
        { src: c3, delay: 1.0 },
        { src: c4, delay: 1.5 },
        { src: c5, delay: 2.0 },
        { src: c6, delay: 2.5 },
        { src: c7, delay: 3.0 },
      ],
      wrapper: dressedcc,
      undressedBar: undressedcc,
    },
    {
      ingredients: [
        { src: p1, delay: 0 },
        { src: p2, delay: 0.5 },
        { src: p3, delay: 1.0 },
        { src: p4, delay: 1.5 },
        { src: p5, delay: 2.0 },
        { src: p6, delay: 2.5 },
        { src: p7, delay: 3.0 },
      ],
      wrapper: dressedcp,
      undressedBar: undressedcp,
    },
  ];

  const currentSet = imageSets[currentSetIndex];
  const nextSet = imageSets[(currentSetIndex + 1) % 3];

  // Function to get undressed bar position based on which set is displaying
  const getUndressedBarPosition = (wrapper: string) => {
    // Adjust position for undressedcp to be slightly higher due to smaller size
    if (wrapper === dressedcp && !isMobile) {
      return '48%';
    }
    return isMobile ? '60%' : '50%';
  };

  // Function to get undressed bar size based on which set is displaying
  const getUndressedBarSize = (wrapper: string) => {
    if (wrapper === dressedcp && !isMobile) {
      return '310px'; // Size for undressedcp
    }
    if (wrapper === dressedcc && !isMobile) {
      return '280px'; // Size for undressedcc
    }
    if ((wrapper === dressedcp || wrapper === dressedcc) && isMobile) {
      return '190px'; // Smaller size for mobile cp and cc
    }
    return isMobile ? '220px' : '350px';
  };

  // Function to get wrapper size based on which set is displaying
  const getWrapperSize = (wrapper: string) => {
    if (wrapper === dressedcc || wrapper === dressedcp) {
      return { mobile: '260px', desktop: '400px' };
    }
    return { mobile: '150px', desktop: '250px' };
  };

  const currentWrapperSize = getWrapperSize(currentSet.wrapper);
  const nextWrapperSize = getWrapperSize(nextSet.wrapper);

  return (
    <div 
      id="product-animation"
      className="relative w-full h-[500px] md:h-[500px] flex items-center justify-center overflow-hidden bg-transparent"
    >
      {/* CURRENT SET - Fades out */}
      <div style={{ opacity: fadeOpacity }}>
        {/* Wrapper Image - Always visible in center */}
        <div className="absolute z-20 top-[60%] md:top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2">
          <img
            src={currentSet.wrapper}
            alt="Wrapper"
            className="object-contain"
            style={{ 
              transform: "rotate(-90deg)",
              width: isMobile ? currentWrapperSize.mobile : currentWrapperSize.desktop,
              minWidth: isMobile ? currentWrapperSize.mobile : currentWrapperSize.desktop,
              maxWidth: isMobile ? currentWrapperSize.mobile : currentWrapperSize.desktop,
              height: 'auto',
              display: 'block'
            }}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </div>

        {/* Ingredient Images - Flow from left to wrapper */}
        {currentSet.ingredients.map((ingredient, index) => (
          <div
            key={`current-${index}`}
            className={`absolute z-10 ingredient-animation ${
              isVisible ? (isMobile ? "animate-flow-to-wrapper-mobile" : "animate-flow-to-wrapper") : "opacity-0"
            }`}
            style={{
              animationDelay: `${ingredient.delay}s`,
            }}
          >
            <img
              src={ingredient.src}
              alt={`Ingredient ${index + 1}`}
              className="w-[120px] md:w-[200px] h-auto object-contain"
              loading="eager"
              decoding="async"
              fetchPriority={index < 3 ? "high" : "low"}
            />
          </div>
        ))}

        {/* Undressed Bar - Emerges from wrapper to right (under wrapper) */}
        <div
          className={`absolute z-10 undressed-animation ${
            isVisible ? (isMobile ? "animate-emerge-from-wrapper-mobile" : "animate-emerge-from-wrapper") : "opacity-0"
          }`}
          style={{
            animationDelay: "3.2s",
            top: getUndressedBarPosition(currentSet.wrapper),
            '--img-width': getUndressedBarSize(currentSet.wrapper),
          } as React.CSSProperties & { '--img-width': string }}
        >
          <img
            src={currentSet.undressedBar}
            alt="Final Product"
            className="object-contain"
            style={{ width: getUndressedBarSize(currentSet.wrapper), height: 'auto' }}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </div>
      </div>

      {/* NEXT SET - Fades in (absolute positioned, layered behind) */}
      <div style={{ opacity: 1 - fadeOpacity, position: 'absolute', width: '100%', height: '100%' }}>
        {/* Wrapper Image - Always visible in center */}
        <div className="absolute z-20 top-[60%] md:top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2">
          <img
            src={nextSet.wrapper}
            alt="Wrapper Next"
            className="object-contain"
            style={{ 
              transform: "rotate(-90deg)",
              width: isMobile ? nextWrapperSize.mobile : nextWrapperSize.desktop,
              minWidth: isMobile ? nextWrapperSize.mobile : nextWrapperSize.desktop,
              maxWidth: isMobile ? nextWrapperSize.mobile : nextWrapperSize.desktop,
              height: 'auto',
              display: 'block'
            }}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </div>

        {/* Ingredient Images - Flow from left to wrapper */}
        {nextSet.ingredients.map((ingredient, index) => (
          <div
            key={`next-${index}`}
            className={`absolute z-10 ingredient-animation ${
              isVisible ? (isMobile ? "animate-flow-to-wrapper-mobile" : "animate-flow-to-wrapper") : "opacity-0"
            }`}
            style={{
              animationDelay: `${ingredient.delay}s`,
            }}
          >
            <img
              src={ingredient.src}
              alt={`Ingredient Next ${index + 1}`}
              className="w-[120px] md:w-[200px] h-auto object-contain"
              loading="eager"
              decoding="async"
              fetchPriority={index < 3 ? "high" : "low"}
            />
          </div>
        ))}

        {/* Undressed Bar - Emerges from wrapper to right (under wrapper) */}
        <div
          className={`absolute z-10 undressed-animation ${
            isVisible ? (isMobile ? "animate-emerge-from-wrapper-mobile" : "animate-emerge-from-wrapper") : "opacity-0"
          }`}
          style={{
            animationDelay: "3.2s",
            top: getUndressedBarPosition(nextSet.wrapper),
            '--img-width': getUndressedBarSize(nextSet.wrapper),
          } as React.CSSProperties & { '--img-width': string }}
        >
          <img
            src={nextSet.undressedBar}
            alt="Final Product Next"
            className="object-contain"
            style={{ width: getUndressedBarSize(nextSet.wrapper), height: 'auto' }}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </div>
      </div>

      {/* Fade trigger animation */}
      <style>{`
        @keyframes triggerFade {
          0% { --fade: 1; }
          60% { --fade: 1; }
          65% { --fade: 0.5; }
          70% { --fade: 0; }
          100% { --fade: 0; }
        }

        #product-animation {
          animation: triggerFade 3.2s linear infinite;
        }
      `}</style>

      {/* CSS Animations */}
      <style>{`
        .ingredient-animation {
          left: 50%;
          top: -250px;
          transform: translate(-50%, 0);
        }

        @media (min-width: 768px) {
          .ingredient-animation {
            left: -250px;
            top: 50%;
            transform: translateY(-50%);
          }
        }

        .undressed-animation {
          left: 50%;
          top: 60%;
          transform: translate(-50%, -50%) rotate(90deg);
          will-change: transform, opacity;
        }

        .undressed-animation img {
          min-width: var(--img-width);
          max-width: var(--img-width);
          width: var(--img-width) !important;
          height: auto !important;
        }

        @media (min-width: 768px) {
          .undressed-animation {
            top: 50%;
          }
        }

        @keyframes flowToWrapper {
          0% {
            left: -250px;
            opacity: 0;
            transform: translateY(-50%);
          }
          7% {
            opacity: 1;
            transform: translateY(-50%);
          }
          11% {
            left: 10%;
            opacity: 1;
            transform: translateY(-50%);
          }
          30% {
            left: 30%;
            opacity: 1;
            transform: translateY(-50%);
          }
          48% {
            left: 48%;
            opacity: 1;
            transform: translateY(-50%);
          }
          63% {
            left: 50%;
            opacity: 0.5;
            transform: translateY(-50%);
          }
          73% {
            left: 50%;
            opacity: 0;
            transform: translateY(-50%);
          }
          100% {
            left: -250px;
            opacity: 0;
            transform: translateY(-50%);
          }
        }

        @keyframes flowToWrapperMobile {
          0% {
            top: -250px;
            left: 50%;
            opacity: 0;
            transform: translate(-50%, 0);
          }
          8% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          11% {
            top: 10%;
            opacity: 1;
            transform: translate(-50%, 0);
          }
          31% {
            top: 35%;
            opacity: 1;
            transform: translate(-50%, 0);
          }
          53% {
            top: 43%;
            opacity: 1;
            transform: translate(-50%, 0);
          }
          65% {
            top: 46%;
            opacity: 0.3;
            transform: translate(-50%, -50%);
          }
          73% {
            top: 48%;
            left: 50%;
            opacity: 0;
            transform: translate(-50%, -50%);
          }
          100% {
            top: -250px;
            left: 50%;
            opacity: 0;
            transform: translate(-50%, 0);
          }
        }

        @keyframes emergeFromWrapper {
          0% {
            left: 50%;
            opacity: 0;
            transform: translate(-50%, -50%) rotate(90deg) scale(1);
          }
          7% {
            opacity: 1;
            transform: translate(-50%, -50%) rotate(90deg) scale(1);
          }
          73% {
            left: calc(100% + 100px);
            opacity: 1;
            transform: translate(-50%, -50%) rotate(90deg) scale(1);
          }
          85% {
            left: calc(100% + 200px);
            opacity: 0;
            transform: translate(-50%, -50%) rotate(90deg) scale(1);
          }
          100% {
            left: calc(100% + 200px);
            opacity: 0;
            transform: translate(-50%, -50%) rotate(90deg) scale(1);
          }
        }

        @keyframes emergeFromWrapperMobile {
          0% {
            top: 60%;
            left: 50%;
            opacity: 0;
            transform: translate(-50%, -50%) rotate(90deg) scale(1);
          }
          11% {
            opacity: 1;
            transform: translate(-50%, -50%) rotate(90deg) scale(1);
          }
          63% {
            top: calc(100% + 50px);
            opacity: 1;
            transform: translate(-50%, -50%) rotate(90deg) scale(1);
          }
          71% {
            top: calc(100% + 150px);
            opacity: 0;
            transform: translate(-50%, -50%) rotate(90deg) scale(1);
          }
          100% {
            top: calc(100% + 150px);
            opacity: 0;
            transform: translate(-50%, -50%) rotate(90deg) scale(1);
          }
        }

        .animate-flow-to-wrapper {
          animation: flowToWrapper 5s linear infinite;
        }

        .animate-flow-to-wrapper-mobile {
          animation: flowToWrapperMobile 5s linear infinite;
        }

        .animate-emerge-from-wrapper {
          animation: emergeFromWrapper 5s linear infinite;
        }

        .animate-emerge-from-wrapper-mobile {
          animation: emergeFromWrapperMobile 5s linear infinite;
        }

        @keyframes triggerFade {
          0% { --fade: 1; }
          60% { --fade: 1; }
          65% { --fade: 0.5; }
          70% { --fade: 0; }
          100% { --fade: 0; }
        }

        #product-animation {
          animation: triggerFade 3.2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ProductAnimation;
