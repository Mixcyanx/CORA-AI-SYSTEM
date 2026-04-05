import { GoogleGenAI, Type, Modality } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

export interface MedicationInfo {
  answer: string;
  ingredients: string[];
  indications: string[];
  side_effects: string[];
  warnings: string[];
}

export async function getMedicationExplanation(query: string): Promise<MedicationInfo> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: query,
    config: {
      systemInstruction: `你是一位名叫 Cora 的專業且親切的藥劑師助手。你的任務是解釋藥物資訊。
請務必以 JSON 格式回傳，結構如下：
{
  "answer": "給一般使用者的簡單口語解釋，適合由虛擬角色唸出來",
  "ingredients": ["成分1", "成分2"],
  "indications": ["適應症1", "適應症2"],
  "side_effects": ["副作用1", "副作用2"],
  "warnings": ["禁忌與注意事項1", "禁忌與注意事項2"]
}
請確保資訊準確，並在最後提醒使用者「本系統僅供參考，請務必諮詢醫師或藥師」。
使用繁體中文。`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          answer: { type: Type.STRING },
          ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
          indications: { type: Type.ARRAY, items: { type: Type.STRING } },
          side_effects: { type: Type.ARRAY, items: { type: Type.STRING } },
          warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["answer", "ingredients", "indications", "side_effects", "warnings"],
      },
      tools: [{ googleSearch: {} }],
    },
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("無法解析 AI 回應");
  }
}

export async function generateSpeech(text: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `用親切的語氣說：${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    return base64Audio;
  }
  throw new Error("無法生成語音");
}
