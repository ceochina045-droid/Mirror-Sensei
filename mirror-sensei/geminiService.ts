
import { GoogleGenAI } from "@google/genai";
import { Category, Level, AdminPrompt, LevelPrompt } from "./types";

// Always use gemini-3-flash-preview for fast, reliable, and free-tier compatible text processing.
const MODEL_NAME = 'gemini-3-flash-preview';

export const getStudyContent = async (
  queryText: string,
  category: Category,
  level: Level,
  adminPrompts: AdminPrompt[],
  levelPrompts: LevelPrompt[],
  language: 'EN' | 'BN'
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  // Find the specific training prompts from the admin panel
  // We look for sub-categories that might match common themes or just general category instructions
  const categoryInstructions = adminPrompts
    .filter(p => p.category === category)
    .map(p => `[${p.subCategory} Context]: ${p.prompt}`)
    .join('\n');
    
  const levelInstruction = levelPrompts.find(p => p.level === level)?.prompt || "";
  
  const systemInstruction = `
    You are 'Mirror Sensei', a world-class educational AI tutor specialized in ${category}.
    
    ADMIN TRAINING RULES FOR THIS CATEGORY:
    ${categoryInstructions || "Provide detailed educational analysis."}
    
    DIFFICULTY LEVEL (${level}) RULES:
    ${levelInstruction || "Adjust vocabulary and complexity to suit the selected level."}
    
    OUTPUT REQUIREMENTS:
    - Primary Language: ${language === 'EN' ? 'English' : 'Bengali (Bangla)'}.
    - Format: Clear, structured, and easy to read. 
    - Tone: Encouraging, scholarly yet accessible.
    - If the user asks for a specific topic in ${category}, provide deep insights based on the training rules above.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: queryText,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    return response.text || "Sensei is reflecting... please try your question again.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error: Sensei is currently unavailable. Please check your connection.";
  }
};

export const translateText = async (text: string, targetLang: 'EN' | 'BN') => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = targetLang === 'BN' 
    ? `Translate the following English study material into natural, educational Bengali: ${text}`
    : `Translate the following Bengali study material into clear, academic English: ${text}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: "You are a professional academic translator specializing in English and Bengali. Maintain the educational tone.",
        temperature: 0.3,
      }
    });
    return response.text || "";
  } catch (error) {
    return "Translation temporarily unavailable.";
  }
};

export const askInstantQA = async (question: string, context: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `
    CONTEXT MATERIAL:
    ${context}
    
    STUDENT QUESTION:
    ${question}
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: "You are an instant Q&A assistant. Answer the student's question based strictly on the provided context material. Be concise and helpful.",
        temperature: 0.4,
      }
    });
    return response.text || "";
  } catch (error) {
    return "QA module failed to load. Please try again.";
  }
};
