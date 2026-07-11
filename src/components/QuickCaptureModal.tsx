"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";

interface QuickCaptureModalProps {
  homeId?: string; // אופציונלי: לאיזה בית לשייך אם אנחנו בעמוד של בית ספציפי
}

export function QuickCaptureModal({ homeId }: QuickCaptureModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCaptureClick = () => {
    // טריגר לפתיחת חלון בחירת הקבצים/מצלמה
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOpen(false); // סוגרים את המודל כדי שהמשתמש יחזור לדשבורד מיד
    setIsUploading(true);

    try {
      // 1. קריאה ל-API שלך שמשתמש ב-r2.ts (createUploadUrl)
      // דוגמה: const { uploadUrl } = await fetch('/api/documents/presign', ...);
      
      // 2. העלאת הקובץ ל-R2
      // await fetch(uploadUrl, { method: 'PUT', body: file });

      // 3. טריגר לניתוח ה-AI (Gemini) שהגדרתם ב-Phase 7
      
      // סימולציה של השהייה לצורך הדוגמה
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setToastMessage("המסמך צולם, הועלה ומנותח בהצלחה!");
    } catch (error) {
      console.error(error);
      setToastMessage("שגיאה בהעלאת המסמך.");
    } finally {
      setIsUploading(false);
      // איפוס ה-input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      {/* ה-Toast שלנו */}
      {toastMessage && (
        <Toast 
          message={toastMessage} 
          type={toastMessage.includes("שגיאה") ? "error" : "success"}
          onClose={() => setToastMessage(null)} 
        />
      )}

      {/* רקע מעומעם כשהמודל פתוח */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-neutral-900/40 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* תפריט הפעולות (נפתח מלמטה) */}
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

      {/* כפתור ה-FAB הראשי */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-8 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg text-white transition-transform duration-300 ${isOpen ? "bg-neutral-800 rotate-45" : "bg-brand-600 hover:bg-brand-700 hover:scale-105"} ${isUploading ? "animate-pulse" : ""}`}
      >
        <span className="text-3xl font-light mb-1">{isOpen ? "+" : "+"}</span>
      </button>

      {/* Input נסתר לניהול הקובץ */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,application/pdf"
        capture="environment" // פותח מצלמה אוטומטית בנייד!
        onChange={handleFileChange}
      />
    </>
  );
}
