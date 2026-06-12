import { useState, useEffect, FormEvent } from "react";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { collection, doc, writeBatch, increment, serverTimestamp } from "firebase/firestore";
import { SUTRA_CATALOG } from "../types";
import { playBellSound } from "../utils/audio";
import { Heart, Loader2, Compass } from "lucide-react";
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
  const [count, setCount] = useState<number>(1);
  const [dedicationText, setDedicationText] = useState<string>("");
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      setCount(prev => prev + importedCount);
    }
  }, [importedCount]);

  // Handle Cloud DB batch write
  const handleSubmitPort = async (e: FormEvent) => {
    e.preventDefault();
    if (count <= 0) {
      setErrorMessage("回報遍數必須大於等於 1 遍");
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
        count: Math.floor(count),
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
          totalCount: increment(Math.floor(count)),
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

  return (
    <div id="chanting-form" className="bg-white rounded-3xl border border-gold-100 p-6 md:p-8 shadow-sm flex flex-col justify-between h-full relative">
      <div>
        <div className="flex items-center space-x-2.5 mb-5">
          <div className="p-2 rounded-xl bg-[#F4F1EC] border border-gold-100 text-[#8B7355]">
            <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: "12s" }} />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#8C857E] font-bold block">
              功德圓滿 • 回報法壇
            </span>
            <h2 className="font-serif text-xl font-medium text-[#5C544E]">法寶持誦雲端申報</h2>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl font-medium animate-pulse">
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmitPort} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Choose scripture/mantra */}
            <div className="md:col-span-2">
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
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-[#8C857E] uppercase tracking-widest mb-1">
                持誦遍數 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="1000000"
                  required
                  value={count}
                  onChange={e => setCount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-white border border-[#E8E4DD] focus:border-[#8B7355] rounded-xl pl-3.5 pr-10 py-3 text-sm outline-none font-semibold text-[#3E3A39] transition-colors shadow-2xs"
                  id="form-recitation-count"
                />
                <span className="absolute right-3.5 top-3.5 text-xs text-[#8C857E] font-bold">遍</span>
              </div>
            </div>
          </div>

          {/* Dedication Textarea */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-[#8C857E] uppercase tracking-widest">
                功德迴向文（疏文內容）
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
  );
}
