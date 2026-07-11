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

  // קביעת צבע לפי הציון
  const colorClass = 
    score >= 80 ? "text-emerald-500" : 
    score >= 50 ? "text-amber-500" : 
    "text-rose-500";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* מעגל רקע */}
      <svg className="absolute transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-neutral-100"
        />
        {/* מעגל התקדמות */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-out ${colorClass}`}
        />
      </svg>
      <div className="flex flex-col items-center">
        <span className="text-3xl font-bold text-neutral-900">{score}</span>
        <span className="text-xs font-medium text-neutral-500">ציון בריאות</span>
      </div>
    </div>
  );
}
