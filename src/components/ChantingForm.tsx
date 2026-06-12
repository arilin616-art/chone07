import React, { useState, useEffect, FormEvent } from "react";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { collection, doc, writeBatch, increment, serverTimestamp } from "firebase/firestore";
import { SUTRA_CATALOG } from "../types";
import { playBellSound, playWoodenFishSound } from "../utils/audio";
import { Heart, Loader2, Compass, BookOpen, Volume2, Plus, Minus, RotateCcw, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";

interface ChantingFormProps {
  importedCount: number;
  onFormSubmitted: () => void;
  selectedSutraId: string;
  onSutraSelected: (sutraId: string) => void;
}

export default function ChantingForm({
  importedCount,
  onFormSubmitted,
  selectedSutraId,
  onSutraSelected
}: ChantingFormProps) {
  // Local states
  const userName = "十方同修";
  const [count, setCount] = useState<number | "">(1);
  const [dedicationText, setDedicationText] = useState<string>("");
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Interactive Scripture and Woodfish States
  const [fontSize, setFontSize] = useState<string>("text-lg");
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; text: string; top: number; left: number }[]>([]);

  // Slow auto-scroll script
  useEffect(() => {
    let interval: any;
    if (isAutoScrolling) {
      const container = document.getElementById("scripture-scroll-container");
      if (container) {
        interval = setInterval(() => {
          container.scrollTop += 0.5;
          // Wrap scroll if reaches the end
          if (container.scrollTop + container.clientHeight >= container.scrollHeight - 2) {
            container.scrollTop = 0;
          }
        }, 40);
      }
    }
    return () => clearInterval(interval);
  }, [isAutoScrolling, selectedSutraId]);

  // Tap Woodfish action
  const handleTapWoodFish = (e?: React.MouseEvent<HTMLDivElement>) => {
    playWoodenFishSound();
    setCount(prev => (prev === "" ? 1 : prev + 1));

    // Floating zen phrase trigger
    const id = Date.now() + Math.random();
    const x = e ? e.nativeEvent.offsetX : 50;
    const y = e ? e.nativeEvent.offsetY : 30;

    const phrases = ["功德 +1 部", "福慧雙修", "身心安寧", "消災解厄", "意氣和合", "般若光芒"];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];

    setFloatingTexts(prev => [
      ...prev,
      { id, text: phrase, top: y, left: x }
    ]);

    // Clean up particles
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== id));
    }, 1500);
  };

  // Sync selected sutra default dedication when altered
  const activeSutraItem = SUTRA_CATALOG.find(s => s.id === selectedSutraId) || SUTRA_CATALOG[0];

  useEffect(() => {
    if (!dedicationText || dedicationText.startsWith("願以此")) {
      setDedicationText(activeSutraItem.defaultDedication);
    }
  }, [selectedSutraId]);

  // Sync imported counts from local wooden fish clicks
  useEffect(() => {
    if (importedCount > 0) {
      setCount(prev => (prev === "" ? 0 : prev) + importedCount);
    }
  }, [importedCount]);

  // Handle Cloud DB batch write
  const handleSubmitPort = async (e: FormEvent) => {
    e.preventDefault();
    if (count === "" || count <= 0) {
      setErrorMessage("回報部數必須大於等於 1 部");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const targetSutra = SUTRA_CATALOG.find(s => s.id === selectedSutraId) || SUTRA_CATALOG[0];
    const recitationPath = "recitations";
    const totalsPath = "sutra_totals";

    try {
      const batch = writeBatch(db);

      // 1. Create recitation record (completely random and secured path ID)
      const newRecitationRef = doc(collection(db, recitationPath));
      const recitationData: any = {
        reporterName: userName,
        sutraId: targetSutra.id,
        sutraName: targetSutra.name,
        count: Math.floor(Number(count)),
        timestamp: serverTimestamp()
      };

      if (auth.currentUser?.uid) {
        recitationData.userId = auth.currentUser.uid;
      }
      
      if (dedicationText.trim()) {
        recitationData.dedication = dedicationText.trim();
      }

      batch.set(newRecitationRef, recitationData);

      // 2. Atomically increment the aggregator totals (utilizing the merge pattern)
      const totalDocRef = doc(db, totalsPath, targetSutra.id);
      batch.set(
        totalDocRef,
        {
          sutraId: targetSutra.id,
          sutraName: targetSutra.name,
          totalCount: increment(Math.floor(Number(count))),
          lastUpdatedAt: serverTimestamp()
        },
        { merge: true }
      );

      // Execute safe batch writing
      await batch.commit();

      // Audio climax & celebration confetti!
      playBellSound();
      
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#d4af37", "#8b0000", "#ebd6b2"]
      });

      // Clear local state fields, retaining name and resetting counts
      setCount(1);
      // Refresh timeline totals
      onFormSubmitted();

    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.WRITE, recitationPath);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Font size helpers
  const fontSizeOptions = [
    { label: "特小", value: "text-xs" },
    { label: "小", value: "text-sm" },
    { label: "中", value: "text-base" },
    { label: "大", value: "text-lg" },
    { label: "特大", value: "text-xl" },
    { label: "重磅", value: "text-2xl" }
  ];

  const increaseFont = () => {
    const idx = fontSizeOptions.findIndex(o => o.value === fontSize);
    if (idx < fontSizeOptions.length - 1) {
      setFontSize(fontSizeOptions[idx + 1].value);
    }
  };

  const decreaseFont = () => {
    const idx = fontSizeOptions.findIndex(o => o.value === fontSize);
    if (idx > 0) {
      setFontSize(fontSizeOptions[idx - 1].value);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full">
      {/* LEFT COLUMN: Submissions and Form (lg:col-span-5) */}
      <div id="chanting-form" className="lg:col-span-5 bg-white rounded-3xl border border-gold-100 p-6 md:p-8 shadow-sm flex flex-col justify-between relative">
        <div>
          <div className="flex items-center space-x-2.5 mb-5">
            <div className="p-2 rounded-xl bg-[#F4F1EC] border border-gold-100 text-[#8B7355]">
              <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: "12s" }} />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#8C857E] font-bold block">
                功德圓滿
              </span>
              <h2 className="font-serif text-lg font-medium text-[#5C544E]">誦經功德迴向</h2>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl font-medium animate-pulse">
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmitPort} className="space-y-4">
            <div className="space-y-4">
              {/* Choose scripture/mantra */}
              <div>
                <label className="block text-xs font-semibold text-[#8C857E] uppercase tracking-widest mb-1">
                  選擇持誦功修法門 <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSutraId}
                  onChange={e => onSutraSelected(e.target.value)}
                  className="w-full bg-white border border-[#E8E4DD] focus:border-[#8B7355] rounded-xl px-3 py-3 text-sm outline-none font-medium text-[#3E3A39] transition-colors cursor-pointer font-serif shadow-2xs"
                  id="form-sutra-selector"
                >
                  {SUTRA_CATALOG.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Counts input */}
              <div>
                <label className="block text-xs font-semibold text-[#8C857E] uppercase tracking-widest mb-1">
                  持誦部數 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="1000000"
                    required
                    value={count}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === "") {
                        setCount("");
                      } else {
                        const parsed = parseInt(val, 10);
                        if (!isNaN(parsed)) {
                          setCount(Math.max(1, parsed));
                        }
                      }
                    }}
                    className="w-full bg-white border border-[#E8E4DD] focus:border-[#8B7355] rounded-xl pl-3.5 pr-10 py-3 text-sm outline-none font-semibold text-[#3E3A39] transition-colors shadow-2xs"
                    id="form-recitation-count"
                  />
                  <span className="absolute right-3.5 top-3.5 text-xs text-[#8C857E] font-bold">部</span>
                </div>
                {/* Micro Helper Adjustments */}
                <div className="flex gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setCount(prev => Math.max(1, (prev === "" ? 0 : prev) - 1))}
                    className="flex-1 py-1 bg-gray-50 hover:bg-gray-100 rounded-lg text-[10px] text-gray-500 font-medium transition-colors border border-gray-100"
                  >
                    -1 部
                  </button>
                  <button
                    type="button"
                    onClick={() => setCount(prev => (prev === "" ? 0 : prev) + 5)}
                    className="flex-1 py-1 bg-[#F4F1EC] hover:bg-[#EAE4DC] rounded-lg text-[10px] text-[#8B7355] font-medium transition-colors border border-[#E8E4DD]"
                  >
                    +5 部
                  </button>
                  <button
                    type="button"
                    onClick={() => setCount(prev => (prev === "" ? 0 : prev) + 10)}
                    className="flex-1 py-1 bg-[#F4F1EC] hover:bg-[#EAE4DC] rounded-lg text-[10px] text-[#8B7355] font-medium transition-colors border border-[#E8E4DD]"
                  >
                    +10 部
                  </button>
                  <button
                    type="button"
                    onClick={() => setCount(1)}
                    className="py-1 px-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-medium transition-all border border-red-100 flex items-center justify-center"
                    title="重設為 1 部"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Dedication Textarea */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-[#8C857E] uppercase tracking-widest">
                  功德迴向文
                </label>
                <span className="text-[10px] text-[#A8947A] font-serif">功德周遍，無作自顯</span>
              </div>
              <textarea
                required
                rows={3}
                value={dedicationText}
                onChange={e => setDedicationText(e.target.value)}
                className="w-full bg-white border border-[#E8E4DD] focus:border-[#8B7355] rounded-xl px-3.5 py-3 text-xs outline-none leading-relaxed font-serif text-[#3E3A39] transition-colors shadow-2xs"
                placeholder="請輸入本次功行迴向文..."
                id="form-dedication-text"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              id="form-btn-submit"
              className="w-full bg-[#8B7355] hover:bg-[#725E45] active:scale-98 text-white py-4 rounded-xl text-sm font-serif font-medium tracking-wider flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-[#8B7355]/20 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>正將德名報呈雲端...</span>
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 fill-white text-[#8B7355]" />
                  <span>提交功德回報系統</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Scripture text reader & Interactive Wooden Fish (lg:col-span-7) */}
      <div className="lg:col-span-7 bg-white rounded-3xl border border-gold-100 p-6 md:p-8 shadow-sm flex flex-col justify-between space-y-5">
        
        {/* Title, font control and auto scroll toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-gray-100 gap-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-[#8B7355]" />
            <span className="font-serif text-[#5C544E] font-semibold text-base">
              {activeSutraItem.name} • 經文持誦
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* Auto Scrolling button */}
            <button
              type="button"
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              className={`px-3 py-1.5 rounded-lg text-xs font-serif font-medium transition-all cursor-pointer flex items-center gap-1 border ${
                isAutoScrolling 
                  ? "bg-amber-100 border-amber-300 text-[#8B7355]" 
                  : "bg-gray-50 border-gray-200 text-gray-500 hover:text-[#3E3A39]"
              }`}
            >
              <span>{isAutoScrolling ? "⏸ 暫停滾動" : "▶ 自動滾動"}</span>
            </button>

            {/* Font Scaler controls */}
            <div className="flex bg-[#F4F1EC] p-1 rounded-lg items-center text-xs border border-[#E8E4DD]">
              <button
                type="button"
                onClick={decreaseFont}
                className="p-1 text-gray-500 hover:text-[#3E3A39] cursor-pointer rounded-md hover:bg-white transition-colors"
                title="縮小經文字體"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-serif font-medium text-[#8C857E] min-w-12 text-center text-[11px]">
                {fontSizeOptions.find(o => o.value === fontSize)?.label || "中"}
              </span>
              <button
                type="button"
                onClick={increaseFont}
                className="p-1 text-gray-500 hover:text-[#3E3A39] cursor-pointer rounded-md hover:bg-white transition-colors"
                title="放大經文字體"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Traditional Woodblock Style Scripture scroll reader */}
        <div 
          id="scripture-scroll-container" 
          className="h-80 overflow-y-auto px-6 py-6 bg-[#FAF6F0] rounded-2xl border-4 border-double border-[#D4C3AD]/60 text-center select-none shadow-inner custom-scrollbar relative"
        >
          {/* Subtle floral watermark effect */}
          <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#8B7355_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          <div className={`font-serif space-y-5 tracking-widest leading-loose text-[#2F241F] transition-all duration-300 ${fontSize}`}>
            {activeSutraItem.content.split("\n\n").map((para, idx) => (
              <p 
                key={idx} 
                className="font-serif hover:bg-[#F3EDE3] py-2 px-3 rounded-xl transition-colors selection:bg-rose-100"
              >
                {para}
              </p>
            ))}
          </div>
        </div>

        {/* Online Woodfish tapping area */}
        <div className="pt-2 border-t border-gray-100 flex flex-col items-center">
          <div className="text-center mb-1">
            <span className="text-[10px] font-bold text-[#8C857E] tracking-widest uppercase flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-[#D4AF37] animate-pulse" />
              隨文敲擊計數區
            </span>
            <p className="text-[11px] text-[#A8947A] font-serif">點擊下方木魚，將清脆作響並為「持誦部數」累加一</p>
          </div>

          {/* Interactive Woodfish Area */}
          <div className="relative w-44 h-40 flex items-center justify-center select-none mt-1">
            
            {/* Absolute floating text particles */}
            <AnimatePresence>
              {floatingTexts.map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 0, scale: 0.8 }}
                  animate={{ opacity: 1, y: -80, scale: 1.1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  style={{
                    position: "absolute",
                    top: `${item.top}px`,
                    left: `${item.left}px`,
                    transform: "translate(-50%, -50%)"
                  }}
                  className="bg-amber-100/95 border border-[#E8E4DD] px-2.5 py-1 rounded-full text-[10px] font-serif font-bold text-[#8B7355] shadow-sm flex items-center space-x-1.5 whitespace-nowrap z-10"
                >
                  <Volume2 className="w-3 h-3 animate-bounce" />
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Clickable wooden fish */}
            <motion.div
              onClick={handleTapWoodFish}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94, rotate: -3 }}
              className="cursor-pointer select-none active:outline-none focus:outline-none"
              title="敲擊木魚，累計功德過關"
            >
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mx-auto drop-shadow-md">
                {/* Wooden Fish Base */}
                <path d="M100 70C100 89.33 82.09 105 60 105C37.91 105 20 89.33 20 70C20 50.67 37.91 35 60 35C82.09 35 100 50.67 100 70Z" fill="url(#wood-grad-main)" stroke="#725E45" strokeWidth="2.5" />
                {/* Carved design / scales */}
                <path d="M45 65C50 63 70 63 75 65" stroke="#3E342B" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                <path d="M40 73C48 70 72 70 80 73" stroke="#3E342B" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
                <path d="M48 81C53 78 67 78 72 81" stroke="#3E342B" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                {/* Fish tail / handle */}
                <path d="M22 55C15 50 15 40 25 45L35 52C28 53 24 54 22 55Z" fill="url(#wood-grad-tail)" stroke="#725E45" strokeWidth="1.5" />
                {/* Fish eye */}
                <circle cx="85" cy="55" r="4.5" fill="#2E241B" />
                <circle cx="86" cy="54" r="1.5" fill="white" />
                {/* Sound slot (Hollow hole) */}
                <path d="M60 88C48 88 38 84 38 80" stroke="#2E241B" strokeWidth="3" strokeLinecap="round" />
                
                {/* Definitions node for radial color maps */}
                <defs>
                  <radialGradient id="wood-grad-main" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#C49B6E" />
                    <stop offset="75%" stopColor="#A57945" />
                    <stop offset="100%" stopColor="#7F5526" />
                  </radialGradient>
                  <linearGradient id="wood-grad-tail" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#A57945" />
                    <stop offset="100%" stopColor="#7F5526" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
          </div>
        </div>

      </div>
    </div>
  );
}
