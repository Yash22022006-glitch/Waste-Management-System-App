import { GoogleGenAI } from "@google/genai";

class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    // The API key is assumed to be available via process.env.API_KEY
    // Initialize GoogleGenAI only if API_KEY is present
    if (process.env.API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } else {
      console.warn("Gemini API Key is not set. Gemini features will be disabled.");
    }
  }

  public async summarizeReport(reportContent: string): Promise<string> {
    if (!this.ai) {
      return "Gemini API is not available (API Key missing). Cannot summarize report.";
    }

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash", // Using 'gemini-2.5-flash' for text tasks
        contents: `Summarize the following waste management report in one concise paragraph, focusing on the core issue and location if mentioned: "${reportContent}"`,
        config: {
          temperature: 0.5,
          maxOutputTokens: 150,
        }
      });
      return response.text;
    } catch (error: unknown) {
      console.error("Error summarizing report with Gemini API:", error);
      // Check if it's an API error
      if (error instanceof Error) {
        if (error.message.includes("403") || error.message.includes("API key not valid")) {
          return `Error: Invalid or unconfigured API key. Please ensure your API key is correctly set and has access.`;
        }
        return `Failed to summarize report: ${error.message}`;
      }
      return "Failed to summarize report due to an unknown error.";
    }
  }
}

export const geminiService = new GeminiService();