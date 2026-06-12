import { useState, useEffect } from "react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { SutraTotal, SUTRA_CATALOG } from "../types";
import { Layers } from "lucide-react";

interface TempleStatsProps {
  refreshTrigger: number;
}

export default function TempleStats({ refreshTrigger }: TempleStatsProps) {
  const [totals, setTotals] = useState<SutraTotal[]>([]);

  // Sync total statistics in real-time
  useEffect(() => {
    const totalsRef = collection(db, "sutra_totals");
    
    const unsubscribe = onSnapshot(
      totalsRef,
      (snapshot) => {
        const list: SutraTotal[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          list.push({
            sutraId: doc.id,
            sutraName: data.sutraName || "未知法寶",
            totalCount: data.totalCount || 0,
            lastUpdatedAt: data.lastUpdatedAt
          });
        });
        
        // Sort totals by total count descending
        list.sort((a, b) => b.totalCount - a.totalCount);
        setTotals(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "sutra_totals");
      }
    );

    return () => unsubscribe();
  }, [refreshTrigger]);

  return (
    <div id="temple-stats" className="space-y-6">
      {/* 誦經累計列表 - 一目了然的數字表格 */}
      <div className="bg-white border border-gold-100 p-5 rounded-3xl shadow-sm">
        <div className="mb-4">
          <h3 className="font-serif text-base font-bold text-[#5C544E] mb-0.5 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#8B7355]" />
            <span>法寶功課持誦累計</span>
          </h3>
          <p className="text-xs text-[#8C857E]">
            十方大眾在此共同修持，功行總量即時累計如下：
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {SUTRA_CATALOG.map((s) => {
            const totalObj = totals.find((t) => t.sutraId === s.id);
            const countVal = totalObj ? totalObj.totalCount : 0;
            return (
              <div
                key={s.id}
                className="p-3 bg-[#FAF9F6] border border-[#E8E4DD] rounded-2xl flex flex-col justify-between hover:shadow-2xs transition-all"
              >
                <div className="flex items-center space-x-1.5 mb-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    s.category === "sutra" 
                      ? "bg-amber-600" 
                      : s.category === "mantra" 
                        ? "bg-red-600" 
                        : "bg-emerald-600"
                  }`} />
                  <span className="text-xs font-serif font-semibold text-[#5C544E] leading-tight">
                    {s.name}
                  </span>
                </div>
                <div className="flex justify-between items-baseline mt-1 border-t border-[#E8E4DD]/40 pt-1.5">
                  <span className="text-[10px] text-[#8C857E]">
                    {s.category === "sutra" 
                      ? "經部" 
                      : s.category === "mantra" 
                        ? "咒部" 
                        : "聖號"}
                  </span>
                  <span className="text-sm font-bold font-serif text-[#8B7355] tracking-tight">
                    {countVal.toLocaleString()}{" "}
                    <span className="text-[10px] font-sans font-normal text-[#8C857E]">
                      部
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
