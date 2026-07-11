"use client";

import React, { useState, useRef } from "react";
import { Toast } from "@/components/ui/toast";

export function QuickCaptureModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCaptureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOpen(false);
    setIsUploading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setToastMessage("המסמך צולם, הועלה ומנותח בהצלחה!");
    } catch (error) {
      console.error(error);
      setToastMessage("שגיאה בהעלאת המסמך.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      {toastMessage && (
        <Toast 
          message={toastMessage} 
          type={toastMessage.includes("שגיאה") ? "error" : "success"}
          onClose={() => setToastMessage(null)} 
        />
      )}

      {isOpen && (
        <div 
          className="fixed inset-0 bg-neutral-900/40 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`fixed bottom-24 right-6 z-50 flex flex-col gap-3 transition-all duration-300 ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}`}>
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-100 p-2 flex flex-col w-48">
          <button onClick={handleCaptureClick} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 rounded-xl transition-colors">
            <span className="text-xl">📸</span> צלם חשבונית
          </button>
          <hr className="border-neutral-100 my-1" />
          <button onClick={handleCaptureClick} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 rounded-xl transition-colors">
            <span className="text-xl">📁</span> העלה מסמך
          </button>
        </div>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-8 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg text-white transition-transform duration-300 ${isOpen ? "bg-neutral-800 rotate-45" : "bg-brand-600 hover:bg-brand-700 hover:scale-105"} ${isUploading ? "animate-pulse" : ""}`}
      >
        <span className="text-3xl font-light mb-1">{isOpen ? "✕" : "+"}</span>
      </button>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,application/pdf"
        capture="environment"
        onChange={handleFileChange}
      />
    </>
  );
}
