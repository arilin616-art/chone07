import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: AI Wisdom Helper using Gemini API
  app.post("/api/wisdom", async (req, res) => {
    try {
      const { wishType, customDetails, name } = req.body;
      
      if (!wishType) {
        return res.status(400).json({ error: "缺少祈願主題 (wishType)" });
      }

      const geminiKey = process.env.GEMINI_API_KEY;
      
      // Gentle offline fallback when API key is missing or inactive
      if (!geminiKey) {
        let fallbackText = "願以此功德，莊嚴佛淨土。上報四重恩，下濟三途苦。若有見聞者，悉發菩提心。盡此一報身，同生極樂國。";
        if (wishType === "health") {
          fallbackText = `願以此誦經功德，迴向給 ${name || "親眷"}。祈求佛力加持，消災延壽、身體健康、諸病消除、身心安樂、福慧雙增、安稱吉祥。`;
        } else if (wishType === "ancestors") {
          fallbackText = `願以此誦經功德，迴向給 ${name || "歷代祖先與冤親債主"}。祈求彌陀引導、安享蓮邦、業障消除、高升蓮品、皈依三寶。`;
        } else if (wishType === "career") {
          fallbackText = `願以此誦經功德，迴向給 ${name || "弟子"}。祈求文殊開慧、事業圓滿、障礙盡除、開顯慧根、吉祥順遂。`;
        } else if (wishType === "peace") {
          fallbackText = `願以此誦經功德，普皆迴向給法界一切有情眾生。祈求世界和平、災難平息、風調雨順、大眾安康，同証菩提。`;
        }
        
        return res.json({
          dedication: fallbackText,
          zenQuote: "「若人欲了知，三世一切佛，應觀法界性，一切唯心造。」── 《華嚴經》。修行在於淨化心靈，誦經當下，心若安詳，即是極樂淨土。",
          isFallback: true
        });
      }

      // Initialize Google GenAI securely with User-Agent definition
      const ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });

      const prompt = `你是一位精通大乘佛教佛法與禪宗開示的宗師長老。
請為一位名叫「${name || "弟子"}」的禪修者，生成一篇莊嚴、優美的【佛學誦經迴向文】以及一句啟迪靈性的【禪心開示】。

回報人姓名或法名：${name || "妙音居士"}
祈願主題：${wishType} (health 身體健康/消災, ancestors 歷代祖先/超薦, career 事業學業/開慧, peace 普同安樂/世界和平)
具體描述細節：${customDetails || "普皆功德，迴向清淨菩提"}

生成格式必須是一個 JSON 對象，包含以下屬性：
1. "dedication": （字數大約 80-150 字，文筆莊嚴，開頭可用常規迴向句，中間融入具體大眾名字和心願，最後以「阿彌陀佛」或「吉祥圓滿」結尾，文字極具安心感）
2. "zenQuote": （一句溫馨、極富禪意的開示，字數 60-100 字左右，勸勉行者不執著於功德次數的多寡，而是安住當下，用清淨心持經念佛，可附帶佛經金句）

請直接返回 JSON，千萬不要包含 Markdown 格式的 \`\`\`json 標記或任何換行贅字。`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "{}";
      const data = JSON.parse(responseText.trim());
      
      return res.json({
        dedication: data.dedication || "願以此功德，普及於一切。我等與眾生，皆共成佛道。",
        zenQuote: data.zenQuote || "「安坐當下，不迎不送，念念自省，清虛湛寂。诵經即是心歸處。」"
      });

    } catch (error) {
      console.error("Gemini API Error in wisdom helper:", error);
      return res.status(500).json({ error: "內部的禪修導師目前在坐禪中，請稍後再試。" });
    }
  });

  // Serve static assets correctly using Vite middleware in dev or static routes in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
