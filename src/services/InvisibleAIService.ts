import { createGeminiChatSession } from './GeminiChatService';
import { HealthData, GeminiModelType } from '@/store/healthStore';

const INVISIBLE_SESSION_KEY = 'invisible_ai_session';

export interface DailyInsight {
  title: string;
  insight: string;
  category: 'sleep' | 'nutrition' | 'stress' | 'exercise' | 'general';
  actionItem: string;
}

export interface FoodVerdict {
  verdict: 'safe' | 'caution' | 'avoid';
  reason: string;
  healthConditionMatch?: string;
}

export const getDailyInsight = async (
  healthData: HealthData,
  apiKey: string,
  modelType: GeminiModelType = 'gemini-3.1-flash-lite-preview'
): Promise<DailyInsight | null> => {
  try {
    // 1. Create a dedicated ephemeral session for invisible AI
    // We use persistSession=false to ensure we don't pollute the main chat history
    // and we get a fresh session every time to avoid context pollution.
    const chatSession = await createGeminiChatSession(apiKey, modelType, 'chat', false);

    if (!chatSession) return null;

    // 2. Construct the prompt
    const prompt = `
      Analyze this user's health data and provide ONE single, unique, personalized daily health insight.
      
      User Data:
      - Age: ${healthData.age}
      - BMI: ${healthData.bmi} (${healthData.bmiCategory})
      - Sleep Score: ${healthData.sleepScore || 'N/A'}
      - Stress Score: ${healthData.stressScore || 'N/A'} (Higher is better, 80-100 means excellent stress management/low stress)
      - Gender: ${healthData.gender}
      
      Return ONLY a valid JSON object with this structure:
      {
        "title": "Short catchy title",
        "insight": "One sentence insight based on their specific data",
        "category": "sleep" | "nutrition" | "stress" | "exercise" | "general",
        "actionItem": "One simple specific action they can take today"
      }
    `;

    // 3. Send message and parse response
    // We need to collect the stream into a single response
    let fullResponse = '';
    const stream = chatSession.sendMessageStream(prompt);

    for await (const chunk of stream) {
      fullResponse += chunk.text;
    }

    // 4. Parse JSON
    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as DailyInsight;
    }

    return null;

  } catch (error) {
    console.error("Error generating daily insight:", error);
    return null;
  }
};

export const getFoodVerdict = async (
  foodName: string,
  healthData: HealthData,
  apiKey: string,
  modelType: GeminiModelType = 'gemini-3.1-flash-lite-preview'
): Promise<FoodVerdict | null> => {
  try {
    // Create a fresh session for this check to ensure no context pollution
    const chatSession = await createGeminiChatSession(apiKey, modelType, 'chat', false);
    if (!chatSession) return null;

    const prompt = `
      I am searching for "${foodName}".
      Based on my health profile, give me a verdict on whether I should eat this.
      
      My Health Profile:
      - BMI: ${healthData.bmi} (${healthData.bmiCategory})
      - Blood Glucose: ${healthData.bloodGlucose}
      - Medical Conditions: ${healthData.savedAnalysis ? 'See analysis' : 'None reported'}
      
      Return ONLY a valid JSON object:
      {
        "verdict": "safe" | "caution" | "avoid",
        "reason": "Short explanation why (max 15 words)",
        "healthConditionMatch": "Name of specific condition if relevant (e.g. 'High Blood Pressure'), else null"
      }
    `;

    let fullResponse = '';
    const stream = chatSession.sendMessageStream(prompt);

    for await (const chunk of stream) {
      fullResponse += chunk.text;
    }

    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as FoodVerdict;
    }

    return null;

  } catch (error) {
    console.error("Error generating food verdict:", error);
    return null;
  }
};
