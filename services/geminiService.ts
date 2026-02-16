
import { GoogleGenAI } from "@google/genai";

/**
 * Edits an image using Gemini 2.5 Flash Image with enhanced identity preservation
 * and professional posture correction for passport standards.
 */
export const editImageWithGemini = async (
  base64Image: string, 
  instruction: string
): Promise<string> => {
  // Always initialize right before use to ensure the most current API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const base64Data = base64Image.split(',')[1];
  const mimeType = base64Image.split(';')[0].split(':')[1] || 'image/png';

  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType: mimeType,
    },
  };

  // Enhanced prompt for facial preservation and posture alignment
  const textPart = {
    text: `TASK: PROFESSIONAL IMAGE EDITING & IDENTITY LOCK.
    
    CORE REQUIREMENTS:
    1. IDENTITY: The person's face and unique features MUST remain 100% identical. 
    2. POSTURE CORRECTION: If the head is tilted or not straight, realign it to be perfectly vertical and symmetrical (Passport Style).
    3. FEATURES: Ensure BOTH ears are clearly visible if possible. The person must look directly into the camera lens with a neutral or slight professional smile.
    4. CLOTHING: Seamlessly apply requested formal clothing (suit/tie) at the shoulder and neck area.
    5. QUALITY: Studio lighting, high resolution, realistic skin textures.

    USER SPECIFIC INSTRUCTION: ${instruction}`
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

    throw new Error("AI ছবি তৈরি করতে পারেনি। প্রম্পট পরিবর্তন করে আবার চেষ্টা করুন।");
  } catch (error: any) {
    console.error("Gemini Image Error:", error);
    if (error.message?.includes("429")) {
      throw new Error("ফ্রি লিমিট শেষ। ১ মিনিট পর আবার চেষ্টা করুন।");
    }
    throw new Error(error.message || "এডিটিং ব্যর্থ হয়েছে।");
  }
};
