import { AnalysisResult, IngredientCategory, ChildSuitabilityStatus } from "../types";

// Helper to convert file to Base64 with compression and resizing
// Keeps the image optimized for API usage
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
  // Check for API Key
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key 未設定。請至 Vercel Settings 輸入您的 xAI API Key (以 xai- 開頭)。");
  }

  // System Prompt for Grok
  const systemPrompt = `
    你是一位專業、親切且擅長用白話文解釋的營養師。
    你的任務是分析食品包裝圖片。
    
    請遵循以下規則：
    1. 識別產品名稱與成份。
    2. 用「白話文」（一般人、甚至阿嬤都能聽懂的語言）解釋成份。
    3. 特別評估「幼童（2-6歲）」是否適合食用。
    4. 成份分類：HEALTHY (有益), NEUTRAL (普通), CAUTION (需注意), UNHEALTHY (不健康)。
    
    Output MUST be valid JSON only. Do not wrap in markdown code blocks.
    JSON Schema:
    {
      "productName": "string",
      "summary": "string",
      "childSuitability": {
        "status": "SAFE" | "MODERATE" | "AVOID",
        "reason": "string"
      },
      "ingredients": [
        { "name": "string", "description": "string", "category": "HEALTHY" | "NEUTRAL" | "CAUTION" | "UNHEALTHY" }
      ],
      "warnings": ["string"],
      "pros": ["string"]
    }
  `;

  // Prepare messages for xAI (OpenAI compatible format)
  const contentParts: any[] = [
      { type: "text", text: "請分析這些圖片中的食品成份：" }
  ];

  // Add images
  images.forEach(img => {
      contentParts.push({
          type: "image_url",
          image_url: {
              url: `data:${img.mimeType};base64,${img.data}`,
              detail: "high"
          }
      });
  });

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "grok-2-vision-1212", // Latest Grok Vision model
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: contentParts }
            ],
            stream: false,
            temperature: 0.1, // Low temperature for consistent JSON
            response_format: { type: "json_object" } // Enforce JSON
        })
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("xAI API Error:", errData);
        if (response.status === 401) throw new Error("API Key 無效，請檢查設定。");
        throw new Error(`分析服務暫時無法使用 (${response.status})`);
    }

    const data = await response.json();
    const contentText = data.choices?.[0]?.message?.content;

    if (!contentText) throw new Error("AI 沒有回傳內容");

    // Parse JSON
    let parsed;
    try {
        parsed = JSON.parse(contentText);
    } catch (e) {
        console.error("JSON Parse Error", contentText);
        throw new Error("AI 回傳格式錯誤，請重試");
    }

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
    throw new Error(error.message || "分析圖片時發生錯誤");
  }
};