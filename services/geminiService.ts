
import { GoogleGenAI } from "@google/genai";

/**
 * Edits an image using Gemini 2.5 Flash Image.
 * Initialization is done inside the function to prevent crashes during module load.
 */
export const editImageWithGemini = async (
  base64Image: string, 
  instruction: string
): Promise<string> => {
  // Check for API key presence to avoid immediate crash
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key পাওয়া যায়নি। দয়া করে সেটিংস চেক করুন।");
  }

  // Initialize strictly inside the function
  const ai = new GoogleGenAI({ apiKey });
  
  const base64Data = base64Image.split(',')[1];
  const mimeType = base64Image.split(';')[0].split(':')[1] || 'image/png';

  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType: mimeType,
    },
  };

  const textPart = {
    text: `TASK: PROFESSIONAL IMAGE EDITING. 
    Maintain face identity 100%. 
    Instructions: ${instruction}`
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, textPart] },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("AI থেকে কোনো রেসপন্স পাওয়া যায়নি।");

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("AI ছবি তৈরি করতে পারেনি।");
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error(error.message || "এডিটিং ব্যর্থ হয়েছে।");
  }
};
