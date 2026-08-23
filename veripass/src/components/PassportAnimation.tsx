import React, { useState, useEffect } from 'react';

/**
 * Pure CSS/JS passport animation — no Three.js dependency.
 * Features: passport booklet open/close, stamp effects, page flips.
 */
export const PassportAnimation: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [stampVisible, setStampVisible] = useState(false);
  const [pageFlip, setPageFlip] = useState(0);

  useEffect(() => {
    const openInterval = setInterval(() => {
      setOpen((prev) => !prev);
    }, 4000);

    return () => clearInterval(openInterval);
  }, []);

  useEffect(() => {
    if (open) {
      const t1 = setTimeout(() => setStampVisible(true), 800);
      const t2 = setTimeout(() => setPageFlip(1), 1200);
      const t3 = setTimeout(() => setPageFlip(2), 2000);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    } else {
      setStampVisible(false);
      setPageFlip(0);
    }
  }, [open]);

  return (
    <div className="relative w-full h-full flex items-center justify-center perspective-[800px] select-none">
      {/* Passport Booklet */}
      <div
        className="relative w-[180px] h-[240px] sm:w-[200px] sm:h-[270px] transition-transform duration-1000 ease-in-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: open ? 'rotateY(-15deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Back Cover */}
        <div
          className="absolute inset-0 rounded-sm border-2 border-[#0a1128]"
          style={{
            background: 'linear-gradient(135deg, #010766 0%, #0a1128 100%)',
            backfaceVisibility: 'hidden',
            boxShadow: '4px 4px 0px 0px rgba(1,7,102,0.4)',
          }}
        >
          {/* Inner lines */}
          <div className="absolute inset-4 border border-white/10 rounded-sm" />
          <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-1.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-[1px] bg-white/15" />
            ))}
          </div>
        </div>

        {/* Pages (stacked) */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute inset-[3px] sm:inset-[4px] rounded-sm transition-transform duration-700 ease-in-out"
            style={{
              background: 'linear-gradient(180deg, #fff9ec 0%, #f5edd6 100%)',
              transform: pageFlip > i ? `rotateY(${-60 + i * 10}deg) translateX(${-5 + i * 2}px)` : 'rotateY(0deg)',
              transformOrigin: 'left center',
              zIndex: 3 - i,
              boxShadow: '2px 2px 0px rgba(0,0,0,0.08)',
            }}
          >
            {/* Page lines */}
            <div className="p-3 sm:p-4 flex flex-col gap-2">
              {[...Array(8)].map((_, j) => (
                <div
                  key={j}
                  className="h-[1px] bg-[#d4c9a8]/40"
                  style={{ width: `${70 + Math.random() * 25}%` }}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Front Cover */}
        <div
          className="absolute inset-0 rounded-sm border-2 border-[#0a1128] transition-transform duration-1000 ease-in-out cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #010766 0%, #00104d 50%, #010766 100%)',
            backfaceVisibility: 'hidden',
            transformOrigin: 'left center',
            transform: open ? 'rotateY(-120deg)' : 'rotateY(0deg)',
            zIndex: 10,
            boxShadow: open ? '8px 0 20px rgba(0,0,0,0.3)' : '4px 4px 0px 0px rgba(1,7,102,0.4)',
          }}
          onClick={() => setOpen(!open)}
        >
          {/* Gold border */}
          <div className="absolute inset-2 border border-[#fe9832]/40 rounded-sm" />

          {/* Emblem */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-[#fe9832] rounded-full flex items-center justify-center transition-shadow duration-500"
              style={{
                boxShadow: '0 0 12px rgba(254,152,50,0.3)',
                background: 'radial-gradient(circle, rgba(254,152,50,0.15) 0%, transparent 70%)',
              }}
            >
              <span className="text-[#fe9832] font-bold text-lg sm:text-xl tracking-tighter">VP</span>
            </div>
            <span className="text-[#fe9832]/80 font-pixel text-[9px] sm:text-[10px] tracking-[0.25em] uppercase">
              VERIPASS
            </span>
            <span className="text-white/30 font-pixel text-[7px] sm:text-[8px] tracking-[0.2em] uppercase mt-1">
              PRODUCT PASSPORT
            </span>
          </div>

          {/* Bottom text */}
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <span className="text-white/20 font-pixel text-[7px] tracking-[0.15em] uppercase">
              REPUBLIC OF INDIA
            </span>
          </div>
        </div>
      </div>

      {/* Floating Visa Stamps */}
      {stampVisible && (
        <>
          <div
            className="absolute top-2 right-4 sm:top-4 sm:right-8 w-14 h-14 sm:w-16 sm:h-16 border-2 border-red-600/70 rounded-full flex items-center justify-center animate-[stampIn_0.4s_ease-out_forwards] opacity-0 rotate-[-15deg]"
            style={{ animationFillMode: 'forwards' }}
          >
            <div className="text-center leading-none">
              <span className="text-red-600/80 font-pixel text-[7px] sm:text-[8px] block uppercase tracking-wider">APPROVED</span>
              <span className="text-red-600/60 font-pixel text-[6px] block mt-0.5">2026</span>
            </div>
          </div>
          <div
            className="absolute bottom-4 left-2 sm:bottom-6 sm:left-6 w-12 h-12 sm:w-14 sm:h-14 border-2 border-[#010766]/60 flex items-center justify-center animate-[stampIn_0.4s_ease-out_0.3s_forwards] opacity-0 rotate-[8deg]"
            style={{ animationFillMode: 'forwards' }}
          >
            <div className="text-center leading-none">
              <span className="text-[#010766]/70 font-pixel text-[6px] sm:text-[7px] block uppercase tracking-wider">INDIA</span>
              <span className="text-[#fe9832]/70 font-pixel text-[8px] sm:text-[9px] block font-bold">✓</span>
            </div>
          </div>
          <div
            className="absolute top-1/2 -right-2 sm:-right-4 w-10 h-10 sm:w-12 sm:h-12 border border-[#fe9832]/50 rounded-sm flex items-center justify-center animate-[stampIn_0.4s_ease-out_0.5s_forwards] opacity-0 rotate-[20deg]"
            style={{ animationFillMode: 'forwards' }}
          >
            <span className="text-[#fe9832]/60 font-pixel text-[6px] sm:text-[7px] uppercase tracking-wider">VIP</span>
          </div>
        </>
      )}

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#fe9832]/30 rounded-full"
            style={{
              left: `${15 + i * 14}%`,
              top: `${20 + (i % 3) * 25}%`,
              animation: `float ${2 + i * 0.5}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
