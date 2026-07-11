"use client";

import React, { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export function Toast({ message, type = "success", onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // נעלם אחרי 3 שניות
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = 
    type === "success" ? "bg-emerald-600" : 
    type === "error" ? "bg-rose-600" : 
    "bg-neutral-800";

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className={`${bgColor} text-white px-4 py-3 rounded-full shadow-lg font-medium text-sm flex items-center gap-2`}>
        <span>{type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"}</span>
        {message}
      </div>
    </div>
  );
}
