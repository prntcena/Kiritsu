import { GoogleGenAI, Type } from "@google/genai";
import { RoutineResponse, StudyPlanResponse } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateRoutine = async (prompt: string): Promise<RoutineResponse | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Create a structured daily routine based on this request: "${prompt}". 
      Return a JSON object with a routine name and a list of items. Each item must have a time (HH:MM AM/PM format), a concise activity description, and a suggestive emoji icon.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            routineName: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING },
                  activity: { type: Type.STRING },
                  icon: { type: Type.STRING },
                },
                required: ["time", "activity", "icon"]
              }
            }
          },
          required: ["routineName", "items"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as RoutineResponse;
  } catch (error) {
    console.error("Gemini Routine Generation Error:", error);
    return null;
  }
};

export const enhanceNote = async (content: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Improve the following note. Fix grammar, make it more concise, and format it nicely with markdown bullet points if applicable. Keep the tone professional but personal.\n\nNote Content:\n${content}`,
    });
    return response.text || content;
  } catch (error) {
    console.error("Gemini Note Enhancement Error:", error);
    return content;
  }
};

export const generateStudyPlan = async (syllabusText: string): Promise<StudyPlanResponse | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following syllabus or topic list and create a structured study plan timeline. 
      Break it down into logical modules. 
      For each module, list specific topics to study and estimate the time required in hours.
      
      Syllabus Content:
      "${syllabusText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A catchy title for the course" },
            description: { type: Type.STRING, description: "A brief summary of what will be learned" },
            modules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Name of the module/section" },
                  topics: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING, description: "Specific topic name" },
                        estimatedHours: { type: Type.NUMBER, description: "Estimated hours to complete" }
                      },
                      required: ["title", "estimatedHours"]
                    }
                  }
                },
                required: ["title", "topics"]
              }
            }
          },
          required: ["title", "description", "modules"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as StudyPlanResponse;
  } catch (error) {
    console.error("Gemini Study Plan Generation Error:", error);
    return null;
  }
};
