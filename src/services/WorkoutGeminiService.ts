
import { GoogleGenAI } from "@google/genai";
import { GeminiModelType } from "@/store/healthStore";
import axios from "axios";

export interface WorkoutAnalysis {
    caloriesBurned: number;
    benefitsSummary: string;
    recommendations: string[];
    bodyImpact: string;
    calorieBalance?: {
        totalBurned: number;
        bmr: number;
        activityBurn: number;
        consumed: number;
        deficit: number;
        weightImpact: string;
    };
}

export const analyzeWorkout = async (
    workoutType: string,
    duration: number,
    intensity: string,
    weight: number,
    gender: string,
    age: number,
    caloriesConsumed: number,
    bmrValue: number,
    apiKey: string,
    modelType: GeminiModelType = "gemini-3.1-flash-lite-preview"
): Promise<WorkoutAnalysis> => {
    try {

        const controller = new AbortController();
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL_PROD}/workout-analysis`, {
            workoutType: workoutType,
            duration: duration,
            intensity: intensity,
            weight: weight,
            gender: gender,
            age: age,
            caloriesConsumed: caloriesConsumed,
            bmrValue: bmrValue,
            modelType: modelType
        }, {
            headers: {
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
        })
        const text = response.data.data;

        if (!text || typeof text !== 'string') {
            console.error("Invalid response format:", response.data);
            throw new Error("Invalid response format from backend");
        }
        console.log("Received response from backend:", response.data);
        controller.abort();

        return parseWorkoutAnalysis(text);
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log("Request canceled:", error.message);
        } else {
            console.error("Error analyzing workout:", error);
        }
        if (axios.isAxiosError(error)) {
            if (error.response) {
                console.error("Response data:", error.response.data);
            } else if (error.request) {
                console.error("Request made but no response received:", error.request);
            } else {
                console.error("Error setting up request:", error.message);
            }
        }
        // Show a user-friendly error message
        // toast({
        //     title: "Error",
        //     description: "Failed to analyze workout. Please try again.",
        //     status: "error",
        //     duration: 5000,
        //     isClosable: true,
        // });
        console.error("Error analyzing workout:", error);
        throw new Error("Failed to analyze workout. Please try again.");
    }
};

const parseWorkoutAnalysis = (response: string): WorkoutAnalysis => {
    try {
        // Find the JSON object in the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No valid JSON object found in response");
        }

        const parsedData = JSON.parse(jsonMatch[0]);

        // Return parsed data with fallbacks for any missing properties
        return {
            caloriesBurned: parsedData.caloriesBurned || 0,
            benefitsSummary: parsedData.benefitsSummary || "No information available",
            recommendations: Array.isArray(parsedData.recommendations) ? parsedData.recommendations : [],
            bodyImpact: parsedData.bodyImpact || "No information available",
            calorieBalance: parsedData.calorieBalance ? {
                totalBurned: parsedData.calorieBalance.totalBurned || 0,
                bmr: parsedData.calorieBalance.bmr || 0,
                activityBurn: parsedData.calorieBalance.activityBurn || 0,
                consumed: parsedData.calorieBalance.consumed || 0,
                deficit: parsedData.calorieBalance.deficit || 0,
                weightImpact: parsedData.calorieBalance.weightImpact || "No information available"
            } : undefined
        };
    } catch (error) {
        console.error("Error parsing workout analysis:", error);

        // Return default info if parsing fails
        return {
            caloriesBurned: 0,
            benefitsSummary: "Analysis unavailable",
            recommendations: [],
            bodyImpact: "Analysis unavailable"
        };
    }
};
