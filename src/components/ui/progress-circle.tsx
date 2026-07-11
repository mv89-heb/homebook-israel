import React from "react";

interface ProgressCircleProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export function ProgressCircle({ score, size = 120, strokeWidth = 10 }: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute transform -rotate-90 drop-shadow-xl" width={size} height={size}>
        {/* הגדרת הגרדיאנטים לפי הציון */}
        <defs>
          <linearGradient id="score-gradient-good" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" /> {/* Emerald 500 */}
            <stop offset="100%" stopColor="#34d399" /> {/* Emerald 400 */}
          </linearGradient>
          <linearGradient id="score-gradient-ok" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" /> {/* Amber 500 */}
            <stop offset="100%" stopColor="#fbbf24" /> {/* Amber 400 */}
          </linearGradient>
          <linearGradient id="score-gradient-bad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" /> {/* Rose 500 */}
            <stop offset="100%" stopColor="#fb7185" /> {/* Rose 400 */}
          </linearGradient>
        </defs>

        {/* מעגל רקע עדין */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* מעגל התקדמות עם הגרדיאנט */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#score-gradient-${score >= 80 ? 'good' : score >= 50 ? 'ok' : 'bad'})`}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="flex flex-col items-center z-10">
        <span className="text-4xl font-black text-neutral-800 tracking-tight">{score}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">בריאות</span>
      </div>
    </div>
  );
}
