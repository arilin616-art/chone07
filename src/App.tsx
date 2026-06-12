import { useState } from "react";
import ChantingForm from "./components/ChantingForm";
import TempleStats from "./components/TempleStats";
import { SUTRA_CATALOG } from "./types";
import { Flame, Compass } from "lucide-react";

export default function App() {
  // Shared states to orchestrate interactions
  const [selectedSutraId, setSelectedSutraId] = useState<string>("heart_sutra");
  const [statsRefreshTrigger, setStatsRefreshTrigger] = useState<number>(0);

  // Selected sutra catalog details
  const activeSutraDetails = SUTRA_CATALOG.find(s => s.id === selectedSutraId) || SUTRA_CATALOG[0];

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-between selection:bg-gold-100 selection:text-monk-brown font-sans">
      
      {/* 2. HEADER: Top Temple Banner - Clean Minimalism */}
      <header className="border-b border-gold-100 bg-white sticky top-0 z-40 transition-colors shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-[#8B7355] border border-gold-100 flex items-center justify-center shadow-xs">
              <span className="font-serif font-semibold text-white text-base tracking-widest">蓮</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-[#8B7355] text-white text-[9px] font-semibold tracking-widest rounded-xs uppercase">
                  十方共修
                </span>
                <span className="text-xs text-gold-700 tracking-wider font-semibold font-serif">雲端妙音閣</span>
              </div>
              <h1 className="font-serif text-lg md:text-xl font-medium tracking-tight text-[#5C544E]">
                蓮池功德彙報系統
              </h1>
            </div>
          </div>

          {/* Virtual Incense Burner (香爐) Ambiance section - Sleek Minimalist Integration */}
          <div className="hidden md:flex items-center space-x-4 bg-[#F4F1EC]/80 p-2.5 rounded-2xl border border-gold-100">
            <div className="relative w-14 h-14 flex items-center justify-center">
              {/* Drift smoke vectors */}
              <div className="absolute -top-7 left-1.5 w-1 h-8 bg-gray-300/20 rounded-full incense-smoke filter blur-[2px]" />
              <div className="absolute -top-9 left-4 w-1.5 h-10 bg-gray-300/35 rounded-full incense-smoke filter blur-[3px]" style={{ animationDelay: "2s" }} />
              <div className="absolute -top-6 left-6 w-1 h-7 bg-gray-300/20 rounded-full incense-smoke filter blur-[1.5px]" style={{ animationDelay: "3.5s" }} />
              
              {/* Incense Sticks */}
              <div className="absolute bottom-4 left-4 w-[1.5px] h-9 bg-red-800/80 rotate-[-12deg] transform origin-bottom">
                <div className="absolute top-0 left-[-0.25px] w-1 h-1 bg-amber-400 rounded-full animate-pulse shadow-md" />
              </div>
              <div className="absolute bottom-4 left-6.5 w-[1.5px] h-10 bg-red-800/80 rotate-[2deg] transform origin-bottom">
                <div className="absolute top-0 left-[-0.25px] w-1 h-1 bg-amber-400 rounded-full animate-pulse shadow-md" style={{ animationDelay: "1s" }} />
              </div>
              <div className="absolute bottom-4 left-8.5 w-[1.5px] h-8.5 bg-red-800/80 rotate-[10deg] transform origin-bottom">
                <div className="absolute top-0 left-[-0.25px] w-1 h-1 bg-amber-400 rounded-full animate-pulse shadow-red" style={{ animationDelay: "2.5s" }} />
              </div>

              {/* incense burner Bowl Base */}
              <svg width="40" height="24" viewBox="0 0 40 24" fill="none" className="absolute bottom-1 text-[#8B7355]">
                <path d="M4 4C4 4 10 20 20 20C30 20 36 4 36 4C36 4 34 22 20 22C6 22 4 4 4 4Z" fill="#8B7355" />
                <ellipse cx="20" cy="4" rx="16" ry="3" fill="#725E45" />
                <rect x="18" y="21" width="4" height="2" fill="#725E45" />
                <rect x="8" y="21" width="3" height="2" fill="#5C544E" />
                <rect x="29" y="21" width="3" height="2" fill="#5C544E" />
              </svg>
            </div>
            <div className="text-left leading-tight pr-1">
              <span className="text-[10px] text-gold-700 font-bold block uppercase tracking-wide">靜心上香</span>
              <span className="text-[11px] text-gold-600 font-serif">檀香遠播，意契真如</span>
            </div>
          </div>

        </div>
      </header>

      {/* 3. BODY MAIN: Centered Chanting Form */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex-1 w-full space-y-6">
        
        {/* Centered Chanting cloud reporter Form */}
        <div className="max-w-3xl mx-auto w-full">
          <ChantingForm 
            importedCount={0} 
            onFormSubmitted={() => setStatsRefreshTrigger(prev => prev + 1)} 
            selectedSutraId={selectedSutraId} 
            onSutraSelected={setSelectedSutraId} 
          />
        </div>

        {/* Bottom Full-Width Column: Co-Cultivation real-time statistics dashboard */}
        <div className="pt-2">
          <div className="bg-amber-50/50 rounded-3xl border border-gold-100/40 p-6 shadow-2xs bg-white">
            <TempleStats refreshTrigger={statsRefreshTrigger} />
          </div>
        </div>

      </main>

      {/* 4. FOOTER: Holy closure with credit */}
      <footer className="border-t border-gold-100/40 bg-white/40 py-6 text-center text-xs text-gray-400 font-serif w-full max-w-7xl mx-auto px-4">
        <p className="mb-1 text-gold-700/80">「願以此功德，普及於一切。我等與眾生，皆共成佛道。」</p>
        <p className="text-gray-400 flex items-center justify-center gap-1">
          <span>雲端誦經共修回報系統 © 2026</span>
          <span>•</span>
          <span className="flex items-center gap-0.5 text-red-700"><Flame className="w-3.5 h-3.5 cursor-pointer fill-red-700" /> 普濟群生，法輪常轉</span>
        </p>
      </footer>

    </div>
  );
}
