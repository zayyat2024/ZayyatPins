import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getStudyAdvice(subject: string, topic: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `As an expert Nigerian tutor for WAEC/NECO/NABTEB, provide a concise study guide and key points for the topic "${topic}" in the subject "${subject}". Include common exam pitfalls and a few practice questions. Use a helpful, encouraging tone.`,
  });
  return response.text;
}

export async function explainSyllabus(examType: string, subject: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Explain the core areas of the ${examType.toUpperCase()} syllabus for ${subject}. What are the most important topics students should focus on to score an A1?`,
  });
  return response.text;
}
