import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, IngredientCategory, ChildSuitabilityStatus } from "../types";

// Helper to convert file to Base64
export const fileToGenerativePart = async (file: File): Promise<{ mimeType: string; data: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({
        mimeType: file.type,
        data: base64Data
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeIngredients = async (images: { mimeType: string; data: string }[]): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    你是一位專業、親切且擅長用白話文解釋的營養師。請分析這些食品包裝圖片（可能是同一產品的不同角度或多張連續圖）。

    請遵循以下規則：
    1. 整合所有圖片中的資訊，識別產品名稱與成份。
    2. 用「白話文」（一般人、甚至阿嬤都能聽懂的語言）解釋成份。例如：不要只說「抗氧化劑」，要說「防止食物變壞的添加物」。
    3. 特別評估「幼童（3-6歲）」是否適合食用此產品。
    4. 給出 0-100 健康評分。
    5. 成份分類：HEALTHY (有益), NEUTRAL (普通), CAUTION (需注意), UNHEALTHY (不健康)。

    請回傳 JSON：
    {
      "productName": "產品名稱",
      "summary": "簡短總結（白話文）",
      "healthScore": 85,
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
      model: 'gemini-flash-lite-latest', // Using Flash Lite as requested
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
            healthScore: { type: Type.INTEGER },
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
    if (!text) throw new Error("No response from AI");
    
    const parsed = JSON.parse(text);

    const result: AnalysisResult = {
      productName: parsed.productName || "未知產品",
      summary: parsed.summary || "無法提供總結",
      healthScore: typeof parsed.healthScore === 'number' ? parsed.healthScore : 50,
      childSuitability: parsed.childSuitability || { status: ChildSuitabilityStatus.MODERATE, reason: "資料不足，請自行判斷" },
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      pros: Array.isArray(parsed.pros) ? parsed.pros : []
    };

    return result;

  } catch (error) {
    console.error("Error analyzing ingredients:", error);
    throw new Error("無法分析圖片，請確保圖片清晰。");
  }
};
