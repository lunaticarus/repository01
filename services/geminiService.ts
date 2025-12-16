import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, IngredientCategory, ChildSuitabilityStatus } from "../types";

// Helper to convert file to Base64 with compression and resizing
// This prevents "Payload Too Large" errors and speeds up mobile uploads
export const fileToGenerativePart = async (file: File): Promise<{ mimeType: string; data: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions (max 1024px to balance quality and size)
        const MAX_DIMENSION = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
        }
        
        // High quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG at 80% quality
        // This makes the payload much smaller for mobile networks
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        // Remove prefix "data:image/jpeg;base64,"
        const base64Data = dataUrl.split(',')[1];
        
        resolve({
          mimeType: 'image/jpeg',
          data: base64Data
        });
      };
      
      img.onerror = () => reject(new Error("Failed to load image"));
      
      if (readerEvent.target?.result) {
        img.src = readerEvent.target.result as string;
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

export const analyzeIngredients = async (images: { mimeType: string; data: string }[]): Promise<AnalysisResult> => {
  // Explicitly check for API Key to give a better error message in Vercel
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key 未設定。請至 Vercel Settings > Environment Variables 新增 'API_KEY' 並重新部署。");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    你是一位專業、親切且擅長用白話文解釋的營養師。請分析這些食品包裝圖片。

    請遵循以下規則：
    1. 整合所有圖片中的資訊，識別產品名稱與成份。
    2. 用「白話文」（一般人、甚至阿嬤都能聽懂的語言）解釋成份。例如：不要只說「抗氧化劑」，要說「防止食物變壞的添加物」。
    3. 特別評估「幼童（2-6歲）」是否適合食用此產品。
    4. 成份分類：HEALTHY (有益/天然), NEUTRAL (普通), CAUTION (需注意), UNHEALTHY (不健康/加工過度)。

    請回傳 JSON：
    {
      "productName": "產品名稱",
      "summary": "簡短總結（白話文，請用溫暖的語氣）",
      "childSuitability": {
        "status": "SAFE" | "MODERATE" | "AVOID", 
        "reason": "為什麼適合或不適合幼童的簡單原因"
      },
      "ingredients": [
        { "name": "成份名", "description": "白話文解釋", "category": "HEALTHY" }
      ],
      "warnings": ["高糖", "有咖啡因"],
      "pros": ["無防腐劑"]
    }
  `;

  // Construct parts from all images
  const imageParts = images.map(img => ({
    inlineData: {
      mimeType: img.mimeType,
      data: img.data
    }
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: {
        parts: [
          ...imageParts,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING },
            summary: { type: Type.STRING },
            childSuitability: {
              type: Type.OBJECT,
              properties: {
                status: { type: Type.STRING, enum: [ChildSuitabilityStatus.SAFE, ChildSuitabilityStatus.MODERATE, ChildSuitabilityStatus.AVOID] },
                reason: { type: Type.STRING }
              }
            },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  category: { type: Type.STRING, enum: [IngredientCategory.HEALTHY, IngredientCategory.NEUTRAL, IngredientCategory.CAUTION, IngredientCategory.UNHEALTHY] }
                }
              }
            },
            warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
            pros: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI 沒有回應資料");
    
    const parsed = JSON.parse(text);

    const result: AnalysisResult = {
      productName: parsed.productName || "未知產品",
      summary: parsed.summary || "無法提供總結",
      childSuitability: parsed.childSuitability || { status: ChildSuitabilityStatus.MODERATE, reason: "資料不足，請自行判斷" },
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      pros: Array.isArray(parsed.pros) ? parsed.pros : []
    };

    return result;

  } catch (error: any) {
    console.error("Error analyzing ingredients:", error);
    
    // Pass through specific API Key errors
    if (error.message?.includes("API Key") || error.message?.includes("API_KEY")) {
        throw error;
    }
    
    // Provide a more helpful error message including the actual system error
    const errorMessage = error.message || "未知錯誤";
    throw new Error(`分析失敗 (${errorMessage})。請試著減少照片數量或檢查網路連線。`);
  }
};