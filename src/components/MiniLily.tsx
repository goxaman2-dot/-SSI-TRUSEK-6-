import React from 'react';
import { Subfactors } from '../utils';

export function MiniLily({ subfactors, className = "w-[84px] h-[84px] md:w-[94px] md:h-[94px] block drop-shadow-2xl select-none" }: { subfactors: Subfactors; className?: string }) {
  const cx = 50;
  const cy = 50;
  const maxRadius = 38;
  const factorKeys: (keyof Subfactors)[] = ['T', 'U', 'R', 'S', 'E', 'K'];
  
  const factorColors: Record<keyof Subfactors, string> = {
    T: '#a855f7', // purple
    U: '#3b82f6', // blue
    R: '#ec4899', // pink
    S: '#06b6d4', // cyan
    E: '#f43f5e', // rose
    K: '#10b981'  // emerald
  };

  return (
    <svg viewBox="0 0 100 100" className={className}>
      <defs>
        {factorKeys.map(key => (
          <linearGradient key={`mini-grad-${key}`} id={`mini-grad-${key}`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.15} />
            <stop offset="85%" stopColor={factorColors[key]} stopOpacity={0.88} />
            <stop offset="100%" stopColor={factorColors[key]} stopOpacity={0.98} />
          </linearGradient>
        ))}
      </defs>

      {/* Shaggy Golden Stamens / Тычинки, делающие лилию лохматой */}
      {factorKeys.map((_, index) => {
        const midAngle = index * 60 - 60; // Gaps centered between petals
        const offsets = [-13, 0, 13]; // 3 delicate golden stems in each gap
        
        return offsets.map((offset, oIdx) => {
          const angleRad = ((midAngle + offset) * Math.PI) / 180;
          const stamenLen = 16 + (oIdx % 2 === 0 ? 6 : 9);
          
          const xTip = cx + Math.cos(angleRad) * stamenLen;
          const yTip = cy + Math.sin(angleRad) * stamenLen;
          
          const bendAngleRad = ((midAngle + offset * 0.55) * Math.PI) / 180;
          const xControl = cx + Math.cos(bendAngleRad) * stamenLen * 0.55;
          const yControl = cy + Math.sin(bendAngleRad) * stamenLen * 0.55;
          
          return (
            <g key={`mini-stamen-${index}-${oIdx}`}>
              <path
                d={`M ${cx} ${cy} Q ${xControl} ${yControl} ${xTip} ${yTip}`}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="0.75"
                opacity="0.9"
              />
              <circle
                cx={xTip}
                cy={yTip}
                r="1.2"
                fill="#d97706"
                stroke="#fef08a"
                strokeWidth="0.4"
              />
            </g>
          );
        });
      })}

      {/* Petals */}
      {factorKeys.map((key, index) => {
        const angleDeg = index * 60 - 90;
        const angleRad = (angleDeg * Math.PI) / 180;
        const leftWingRad = (angleDeg - 25) * Math.PI / 180;
        const rightWingRad = (angleDeg + 25) * Math.PI / 180;

        const valueScore = subfactors[key];
        // Mini logarithmic petal projection
        const pRadius = 10 + (maxRadius - 10) * (Math.log2(1 + valueScore) / Math.log2(11));

        const xTip = cx + Math.cos(angleRad) * pRadius;
        const yTip = cy + Math.sin(angleRad) * pRadius;

        const xControlLeft = cx + Math.cos(leftWingRad) * pRadius * 0.75;
        const yControlLeft = cy + Math.sin(leftWingRad) * pRadius * 0.75;

        const xControlRight = cx + Math.cos(rightWingRad) * pRadius * 0.75;
        const yControlRight = cy + Math.sin(rightWingRad) * pRadius * 0.75;

        return (
          <path
            key={`mini-petal-${key}`}
            d={`M ${cx} ${cy} Q ${xControlLeft} ${yControlLeft} ${xTip} ${yTip} Q ${xControlRight} ${yControlRight} ${cx} ${cy}`}
            fill={`url(#mini-grad-${key})`}
            stroke={factorColors[key]}
            strokeWidth="0.75"
            strokeLinejoin="round"
            style={{ 
              transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transformOrigin: '50px 50px',
              animation: `float-mini 3s ease-in-out infinite alternate`,
              animationDelay: `${index * 0.25}s`
            }}
          />
        );
      })}

      {/* Center Pistil core */}
      <circle cx="50" cy="50" r="3" fill="#ffffff" stroke="#fbbf24" strokeWidth="1" />
      <circle cx="50" cy="50" r="1.5" fill="#f59e0b" />
      
      {/* Dynamic CSS logic */}
      <style>{`
        @keyframes float-mini {
          0% { transform: scale(1) rotate(0deg); }
          100% { transform: scale(1.02) rotate(1deg); }
        }
      `}</style>
    </svg>
  );
}
