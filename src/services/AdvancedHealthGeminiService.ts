import { GoogleGenAI } from "@google/genai";
import { HealthData, GeminiModelType } from "@/store/healthStore";
import { useRef } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface AdvancedHealthData {
  sleepHours: number;
  exerciseHours: number;
  stressLevel: number;
  waterIntake: number;
  caffeine: number;
  diet: string;
  foodHabits: {
    regularMeals: boolean;
    lateNightSnacking: boolean;
    fastFood: boolean;
    highSugar: boolean;
  };
  smoking: string;
  alcoholConsumption: string;
  medicalConditions?: string;
  medications?: string;
  familyHistory?: string;
  sleepQuality: string;
}

interface HealthAnalysisSection {
  category: string;
  icon: JSX.Element; // This will be added after parsing
  title: string;
  analysis: string;
  recommendation: string;
  score: number;
}

export const analyzeAdvancedHealthData = async (
  combinedData: HealthData & Partial<AdvancedHealthData>,
  apiKey: string,
  modelType: GeminiModelType = "gemini-3.1-flash-lite-preview",
): Promise<HealthAnalysisSection[]> => {
  if (!apiKey) {
    throw new Error("Please enable Gemini AI first by adding your API key");
  }

  try {
    console.log("darta come from advance health ", combinedData, modelType);
    // Validate that required properties exist
    const safeData = {
      age: combinedData.age || 30,
      gender: combinedData.gender || "Not specified",
      height: combinedData.height || 170,
      weight: combinedData.weight || 70,
      bmi: combinedData.bmi || 24.2,
      bmiCategory: combinedData.bmiCategory || "Normal",
      bloodGlucose: combinedData.bloodGlucose || 90,
      sleepHours: combinedData.sleepHours || 7,
      sleepQuality: combinedData.sleepQuality || "Average",
      exerciseHours: combinedData.exerciseHours || 3,
      stressLevel: combinedData.stressLevel || 5,
      waterIntake: combinedData.waterIntake || 2,
      hydrationScore: combinedData.hydrationScore || 50,
      caffeine: combinedData.caffeine !== undefined ? combinedData.caffeine : 2,
      diet: combinedData.diet || "Balanced",
      regularMeals: combinedData.foodHabits?.regularMeals || false,
      lateNightSnacking: combinedData.foodHabits?.lateNightSnacking || false,
      fastFood: combinedData.foodHabits?.fastFood || false,
      highSugar: combinedData.foodHabits?.highSugar || false,
      smoking: combinedData.smoking || "Never",
      alcoholConsumption: combinedData.alcoholConsumption || "Occasional",
      medicalConditions: combinedData.medicalConditions || "None reported",
      medications: combinedData.medications || "None reported",
      familyHistory: combinedData.familyHistory || "None reported",
    };

    const payload = {
      age: Number(safeData.age) || 0,
      gender: String(safeData.gender) || "",
      height: Number(safeData.height) || 0,
      weight: Number(safeData.weight) || 0,
      bmi: Number(safeData.bmi) || 0,
      bmiCategory: String(safeData.bmiCategory) || "",
      bloodGlucose: Number(safeData.bloodGlucose) || 0,
      modelType: String(modelType) || "",
      sleepHours: Number(safeData.sleepHours) || 0,
      sleepQuality: String(safeData.sleepQuality) || "",
      exerciseHours: Number(safeData.exerciseHours) || 0,
      stressLevel: Number(safeData.stressLevel) || 0,
      waterIntake: Number(safeData.waterIntake) || 0,
      hydrationScore: Number(safeData.hydrationScore) || 0,
      caffeine: Number(safeData.caffeine) || 0,
      diet: String(safeData.diet) || "",
      regularMeals: Boolean(safeData.regularMeals),
      lateNightSnacking: Boolean(safeData.lateNightSnacking),
      highSugar: Boolean(safeData.highSugar),
      fastFood: Boolean(safeData.fastFood),
      smoking: String(safeData.smoking) || "",
      alcoholConsumption: String(safeData.alcoholConsumption) || "",
      medicalConditions: String(safeData.medicalConditions) || "",
      medications: String(safeData.medications) || "",
      familyHistory: String(safeData.familyHistory) || "",
      // apiKey: apiKey // Removed apiKey from primary payload as it might be causing 400 error
    };

    console.log("Sending payload to backend:", { ...payload, apiKey: "***" }); // Log without exposing key

    const controller = new AbortController();

    // Try primary endpoint first, fall back if needed
    let response;
    try {
      response = await axios.post(
        `${API_BASE_URL}/api/advanced-health-analysis`,
        {
          ...payload,
          modelType,
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
          },
          signal: controller.signal,
        },
      );
    } catch (primaryError) {
      // If primary endpoint fails, try health-report as fallback
      console.warn("Primary /advanced-health-analysis endpoint failed, trying /health-report fallback...", primaryError);
      try {
        response = await axios.post(
          `${API_BASE_URL}/health-report`,
          {
            ...payload,
            apiKey: apiKey
          },
          {
            headers: {
              "Content-Type": "application/json",
              ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
            },
            signal: controller.signal,
          },
        );
      } catch (fallbackError) {
        throw primaryError; // Re-throw the original error if fallback also fails
      }
    }

    console.log("Received response from backend:", response.data);
    controller.abort();
    if (!response.data || !response.data.data) {
      console.error("Invalid response format:", response.data);
      throw new Error("Invalid response format from backend");
    }

    return parseGeminiResponse(response.data.data);
  } catch (error) {
    // Handle errors gracefully
    if (axios.isAxiosError(error)) {
      console.error(
        "Axios error while analyzing advanced health data:",
        error.message,
      );
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
        console.error("Response headers:", error.response.headers);
      }
      throw new Error(`Failed to analyze health data: ${error.message}`);
    }
    if (error instanceof Error) {
      console.error("Error analyzing advanced health data:", error.message);
      throw new Error(`Failed to analyze health data: ${error.message}`);
    }
    if (axios.isCancel(error)) {
      console.warn("Request canceled:", error.message);
      return [];
    }
    console.error("Error analyzing advanced health data:", error);
    throw new Error("Failed to analyze health data. Please try again.");
  }
};

// Icons will be added in the frontend component
const parseGeminiResponse = (response: string): HealthAnalysisSection[] => {
  try {
    // Find the JSON array in the response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("No valid JSON array found in response:", response);
      throw new Error("No valid JSON array found in response");
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsedData)) {
      console.error("Parsed data is not an array:", parsedData);
      throw new Error("Parsed data is not an array");
    }

    // Validate and transform the data
    // Validate and transform the data
    const result = parsedData.map((item) => {
      // Handle fallback data format (from /health-report endpoint)
      let category = item.category || "overall";
      let analysis = item.analysis || "No analysis provided";
      let recommendation = item.recommendation || "No recommendations provided";

      // If we have 'type' but no 'category' (fallback format), map it
      if (!item.category && item.type) {
        const typeMap: Record<string, string> = {
          'diet': 'nutrition',
          'exercise': 'exercise',
          'lifestyle': 'lifestyle',
          'medical': 'medical'
        };
        category = typeMap[item.type] || 'overall';
      }

      // Force category inference from title/ID if it contains specific keywords
      // This overrides the default mapping if the title is very specific (e.g. "Sleep" in "Lifestyle" type)
      const lowerId = (item.id || "").toLowerCase();
      const lowerTitle = (item.title || "").toLowerCase();

      if (lowerId.includes("sleep") || lowerTitle.includes("sleep")) category = "sleep";
      else if (lowerId.includes("stress") || lowerTitle.includes("stress")) category = "stress";
      else if (lowerId.includes("hydra") || lowerTitle.includes("water")) category = "hydration";

      if (!category || category === 'overall') {
        if (lowerId.includes("diet") || lowerTitle.includes("diet") || lowerTitle.includes("food") || lowerTitle.includes("eat")) category = "nutrition";
        else if (lowerId.includes("exercise") || lowerTitle.includes("exercise") || lowerTitle.includes("workout") || lowerTitle.includes("activity")) category = "exercise";
        else if (lowerId.includes("med") || lowerTitle.includes("doctor")) category = "medical";
        else if (lowerId.includes("life") || lowerTitle.includes("habit")) category = "lifestyle";
      }

      // If we have 'description' but no 'analysis'/'recommendation' (fallback format)
      if (!item.analysis && !item.recommendation) {
        if (item.description) {
          analysis = item.description;
          recommendation = item.title || item.description;
        } else if (item.title) {
          // If even description is missing, use title
          analysis = item.title;
          recommendation = item.title;
        }
      }

      return {
        category: category,
        title: item.title || "Health Analysis",
        analysis: analysis,
        recommendation: recommendation,
        score: typeof item.score === "number" ? item.score : 70,
        icon: null, // Icons will be added in the React component
      };
    });
    console.log("Parsed Analysis Data:", result);
    return result;
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    // Return default placeholder data instead of throwing
    return [
      {
        category: "overall",
        title: "Overall Health",
        analysis: "Unable to analyze health data at this time.",
        recommendation:
          "Please try again later or contact support if the issue persists.",
        score: 70,
        icon: null,
      },
    ];
  }
};

// const genAI = new GoogleGenerativeAI(apiKey);

// const model = genAI.getGenerativeModel({
//   model: modelType,
// });

// // Check if there's meaningful medical history information
// const hasMedicalHistory =
//   safeData.medicalConditions &&
//   safeData.medicalConditions !== "None reported" &&
//   safeData.medicalConditions.length > 5;

// const hasMedications =
//   safeData.medications &&
//   safeData.medications !== "None reported" &&
//   safeData.medications.length > 5;

// const hasFamilyHistory =
//   safeData.familyHistory &&
//   safeData.familyHistory !== "None reported" &&
//   safeData.familyHistory.length > 5;

// // Enhanced prompt with special focus on medical history when present
// const prompt = `
//   You are a health advisor AI. Please analyze the following health data and provide detailed analysis in these categories: sleep, exercise, stress, nutrition, hydration, lifestyle, and overall health.
//   Format your response in a JSON array of objects with these fields:
//   - category: "sleep", "exercise", "stress", "nutrition", "hydration", "lifestyle", or "overall"
//   - title: A title for this analysis section
//   - analysis: A paragraph analyzing this aspect of health
//   - recommendation: A specific, actionable recommendation
//   - score: A health score (0-100) for this category

//   Patient health data:
//   - Age: ${safeData.age}
//   - Gender: ${safeData.gender}
//   - Height: ${safeData.height} cm
//   - Weight: ${safeData.weight} kg
//   - BMI: ${safeData.bmi} (Category: ${safeData.bmiCategory})
//   - Blood Glucose: ${safeData.bloodGlucose} mg/dL
//   - Sleep Hours: ${safeData.sleepHours} hours per day
//   - Sleep Quality: ${safeData.sleepQuality}
//   - Exercise: ${safeData.exerciseHours} hours per week
//   - Stress Level: ${safeData.stressLevel}/10
//   - Water Intake: ${safeData.waterIntake} liters per day
//   - Caffeine Intake: ${safeData.caffeine} cups per day
//   - Diet Type: ${safeData.diet}
//   - Food Habits:
//     * Regular meals: ${safeData.foodHabits.regularMeals ? 'Yes' : 'No'}
//     * Late night snacking: ${safeData.foodHabits.lateNightSnacking ? 'Yes' : 'No'}
//     * Frequent fast food: ${safeData.foodHabits.fastFood ? 'Yes' : 'No'}
//     * High sugar consumption: ${safeData.foodHabits.highSugar ? 'Yes' : 'No'}
//   - Smoking Status: ${safeData.smoking}
//   - Alcohol Consumption: ${safeData.alcoholConsumption}
//   - Medical Conditions: ${safeData.medicalConditions}
//   - Medications: ${safeData.medications}
//   - Family History: ${safeData.familyHistory}

//   ${hasMedicalHistory || hasMedications || hasFamilyHistory ? 'IMPORTANT: The patient has provided medical history information. In your analysis and recommendations, specifically address how their medical conditions, medications, and/or family history impact their health in EACH relevant category, not just the lifestyle category. Include specific advice tailored to their medical situation.' : ''}

//   Provide thorough but concise analysis for each category.

//   For the "nutrition" category, include a detailed assessment of the diet type and food habits.

//   For the "lifestyle" category, provide specific insights about caffeine intake, smoking status, alcohol consumption, and medical history.
//   ${hasMedicalHistory ? 'Pay special attention to how the reported medical conditions might affect health outcomes. Provide specific recommendations that consider these conditions.' : ''}
//   ${hasMedications ? 'Consider how the mentioned medications might impact other health factors and provide appropriate guidance.' : ''}
//   ${hasFamilyHistory ? 'Factor in family history when assessing risk and making recommendations.' : ''}

//   For the "overall" category, provide a comprehensive summary that includes insights from all other categories, and specifically mentions the impact of their medical history, medications, and family health background if provided.

//   For the scores:
//   - Use 80-100 for excellent habits
//   - Use 60-79 for good but improvable habits
//   - Use 40-59 for habits that need moderate improvement
//   - Use 0-39 for habits that need significant improvement

//   Return ONLY a valid JSON array with exactly 7 objects, one for each category.
// `;

// console.log("Sending request to Gemini AI with sanitized data");
// const result = await model.generateContent(prompt);
// const response = await result.response;
// const text = response.text();
// console.log("Received response from Gemini AI");
