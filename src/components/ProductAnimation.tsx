import { useEffect, useState } from "react";
import i1 from "@/assets/i1.png";
import i2 from "@/assets/i2.png";
import i3 from "@/assets/i3.png";
import i4 from "@/assets/i4.png";
import i5 from "@/assets/i5.png";
import i6 from "@/assets/i6.png";
import i7 from "@/assets/i7.png";
import wrapper from "@/assets/dressedpb.png";
import undressedBar from "@/assets/undressedpb.png";

const ProductAnimation = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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

  const ingredients = [
    { src: i1, delay: 0 },
    { src: i2, delay: 0.4 },
    { src: i3, delay: 0.8 },
    { src: i4, delay: 1.2 },
    { src: i5, delay: 1.6 },
    { src: i6, delay: 2.0 },
    { src: i7, delay: 2.4 },
  ];

  return (
    <div 
      id="product-animation"
      className="relative w-full h-[400px] md:h-[500px] flex items-center justify-center overflow-hidden bg-transparent"
    >
      {/* Wrapper Image - Always visible in center */}
      <div className="absolute z-20 top-[60%] md:top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2">
        <img
          src={wrapper}
          alt="Wrapper"
          className="w-[150px] md:w-[250px] h-auto object-contain"
          style={{ transform: "rotate(-90deg)" }}
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </div>

      {/* Ingredient Images - Flow from left to wrapper */}
      {ingredients.map((ingredient, index) => (
        <div
          key={index}
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
        }}
      >
        <img
          src={undressedBar}
          alt="Final Product"
          className="w-[220px] md:w-[350px] h-auto object-contain"
          style={{ width: isMobile ? '220px' : '350px', height: 'auto' }}
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </div>

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
            top: 50%;
            opacity: 0;
            transform: translate(-50%, -50%) rotate(90deg) scale(1);
            width: 350px;
          }
          7% {
            opacity: 1;
            transform: translate(-50%, -50%) rotate(90deg) scale(1);
            width: 350px;
          }
          63% {
            left: calc(100% + 100px);
            top: 50%;
            opacity: 1;
            transform: translate(-50%, -50%) rotate(90deg) scale(1);
            width: 350px;
          }
          73% {
            left: calc(100% + 200px);
            top: 50%;
            opacity: 0;
            transform: translate(-50%, -50%) rotate(90deg) scale(1);
            width: 350px;
          }
          100% {
            left: calc(100% + 200px);
            top: 50%;
            opacity: 0;
            transform: translate(-50%, -50%) rotate(90deg) scale(1);
            width: 350px;
          }
        }

        @keyframes emergeFromWrapperMobile {
          0% {
            top: 60%;
            left: 50%;
            opacity: 0;
            transform: translate(-50%, -50%) rotate(90deg);
          }
          11% {
            opacity: 1;
            transform: translate(-50%, -50%) rotate(90deg);
          }
          63% {
            top: calc(100% + 50px);
            opacity: 1;
            transform: translate(-50%, -50%) rotate(90deg);
          }
          71% {
            top: calc(100% + 150px);
            opacity: 0;
            transform: translate(-50%, -50%) rotate(90deg);
          }
          100% {
            top: calc(100% + 150px);
            opacity: 0;
            transform: translate(-50%, -50%) rotate(90deg);
          }
        }

        .animate-flow-to-wrapper {
          animation: flowToWrapper 3s linear infinite;
        }

        .animate-flow-to-wrapper-mobile {
          animation: flowToWrapperMobile 3.2s linear infinite;
        }

        .animate-emerge-from-wrapper {
          animation: emergeFromWrapper 3s linear infinite;
        }

        .animate-emerge-from-wrapper-mobile {
          animation: emergeFromWrapperMobile 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ProductAnimation;
