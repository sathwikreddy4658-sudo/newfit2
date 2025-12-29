const SaleBanner = () => {
  return (
    <div className="w-full bg-[#b5edce] overflow-hidden py-3 relative">
      <div className="flex whitespace-nowrap animate-scroll">
        {/* Duplicate the text multiple times for seamless infinite scroll */}
        {[...Array(10)].map((_, index) => (
          <span
            key={index}
            className="inline-block font-poppins font-extrabold text-[#3b2a20] text-lg md:text-xl px-8"
          >
            YEAR END SALE IS LIVE - 26% OFF ON CHOCO NUT PROTEIN BAR (ONLY ON 29TH & 30TH DEC)
          </span>
        ))}
      </div>
      
      <style>
        {`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        
        /* Pause animation on hover (optional) */
        .animate-scroll:hover {
          animation-play-state: paused;
        }
        `}
      </style>
    </div>
  );
};

export default SaleBanner;
