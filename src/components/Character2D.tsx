import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CharacterProps {
  isTalking: boolean;
  expression?: 'happy' | 'neutral' | 'thinking';
}

export const Character2D: React.FC<CharacterProps> = ({ isTalking, expression = 'happy' }) => {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-rose-50/30 dark:bg-slate-900/50 rounded-3xl transition-colors duration-300">
      <motion.div
        animate={{
          y: [0, -6, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative w-full h-full max-w-[280px] max-h-[380px] flex items-center justify-center"
      >
        <svg viewBox="0 0 200 240" className="w-full h-full drop-shadow-lg">
          <defs>
            <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#5D4037" />
              <stop offset="100%" stopColor="#3E2723" />
            </linearGradient>
          </defs>

          {/* Hair Back - Taller and Rounder Bob Cut */}
          <path d="M25 90 Q10 150 40 190 Q100 210 160 190 Q190 150 175 90 Q100 -10 25 90 Z" fill="url(#hairGrad)" />
          
          {/* Body - Cute Stylized Uniform */}
          <path d="M50 180 Q100 165 150 180 L165 240 L35 240 Z" fill="#B2DFDB" />
          <path d="M80 180 L100 205 L120 180" fill="white" /> {/* Collar */}
          
          {/* Stethoscope - Simplified & Cute */}
          <path d="M75 185 Q75 210 100 215 Q125 210 125 185" fill="none" stroke="#546E7A" strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="225" r="6" fill="#78909C" />
          
          {/* Neck */}
          <rect x="90" y="165" width="20" height="15" fill="#FFE0BD" />
          
          {/* Face - Round & Cute */}
          <path d="M45 85 Q100 35 155 85 Q165 150 100 185 Q35 150 45 85" fill="#FFE0BD" />
          
          {/* Hair Front - Taller and Rounder Bangs */}
          <path d="M35 90 Q100 5 165 90 Q170 115 140 115 Q100 95 60 115 Q30 115 35 90" fill="url(#hairGrad)" />
          <path d="M35 95 Q25 135 45 165" fill="none" stroke="url(#hairGrad)" strokeWidth="12" strokeLinecap="round" />
          <path d="M165 95 Q175 135 155 165" fill="none" stroke="url(#hairGrad)" strokeWidth="12" strokeLinecap="round" />

          {/* Eyes - Large & Expressive */}
          <g transform="translate(75, 125)">
            {blink ? (
              <path d="M-12 0 Q0 6 12 0" fill="none" stroke="#333" strokeWidth="4" strokeLinecap="round" />
            ) : (
              <>
                <circle cx="0" cy="0" r="12" fill="#333" />
                <circle cx="4" cy="-4" r="4" fill="white" />
                <circle cx="-3" cy="3" r="2" fill="white" opacity="0.6" />
              </>
            )}
          </g>
          <g transform="translate(125, 125)">
            {blink ? (
              <path d="M-12 0 Q0 6 12 0" fill="none" stroke="#333" strokeWidth="4" strokeLinecap="round" />
            ) : (
              <>
                <circle cx="0" cy="0" r="12" fill="#333" />
                <circle cx="4" cy="-4" r="4" fill="white" />
                <circle cx="-3" cy="3" r="2" fill="white" opacity="0.6" />
              </>
            )}
          </g>

          {/* Eyebrows - Cute Soft Arches */}
          <path d="M60 105 Q75 95 90 105" fill="none" stroke="#5D4037" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M110 105 Q125 95 140 105" fill="none" stroke="#5D4037" strokeWidth="2.5" strokeLinecap="round" />

          {/* Mouth - Cute Smile */}
          <motion.path
            animate={isTalking ? {
              d: [
                "M85 155 Q100 175 115 155 Q100 185 85 155 Z",
                "M85 155 Q100 165 115 155 Q100 175 85 155 Z",
                "M85 155 Q100 175 115 155 Q100 185 85 155 Z",
              ]
            } : {
              d: "M85 155 Q100 175 115 155 Q100 175 85 155 Z"
            }}
            transition={isTalking ? {
              duration: 0.2,
              repeat: Infinity,
              ease: "easeInOut"
            } : { duration: 0.3 }}
            fill="#FF4081"
            stroke="#C2185B"
            strokeWidth="1"
          />
        </svg>
      </motion.div>
    </div>
  );
};
