
import { GoogleGenAI } from "@google/genai";

/**
 * এআই এর মাধ্যমে ছবি এডিট করার ফাংশন।
 * এটি ফাংশনের ভেতরে ইন্সট্যান্স তৈরি করে যাতে টপ-লেভেল 'process' এরর না হয়।
 */
export const editImageWithGemini = async (
  base64Image: string, 
  instruction: string
): Promise<string> => {
  // এপিআই কী চেক করা হচ্ছে
  let apiKey = "";
  try {
    apiKey = process.env.API_KEY || "";
  } catch (e) {
    console.error("Process object not found, usually this happens in raw browser environments.");
  }

  if (!apiKey) {
    throw new Error("API Key পাওয়া যায়নি। দয়া করে পরিবেশের সেটিংস চেক করুন।");
  }

  // রিকোয়েস্টের সময় এআই ইন্সট্যান্স তৈরি করা হচ্ছে
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
    text: `TASK: PROFESSIONAL PHOTO EDITING.
    Identity Preservation: High.
    Requirement: ${instruction}
    Final Output: Return only the processed image.`
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, textPart] },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("এআই থেকে কোনো উত্তর পাওয়া যায়নি।");

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("এআই ছবি তৈরি করতে ব্যর্থ হয়েছে।");
  } catch (error: any) {
    console.error("Gemini Edit Error:", error);
    throw new Error(error.message || "ছবি প্রসেসিং ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
  }
};
