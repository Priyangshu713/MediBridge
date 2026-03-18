import { FoodSearchInfo } from '@/components/nutrition/FoodSearchResults';
import { getFoodNutritionInfoFromGemini } from '@/services/NutritionGeminiService';
import { GeminiModelType } from '@/store/healthStore';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';


export const searchFoodHealth = async (
  foodName: string,
  apiKey: string,
  modelType: GeminiModelType
): Promise<FoodSearchInfo> => {
  try {
    // First check if the input is actually a food item
    const isFoodResult = await checkIfFoodItem(foodName, apiKey, modelType);

    if (!isFoodResult.isFood) {
      // Return non-food response
      return {
        name: foodName,
        category: 'junk',
        calories: "0 per 100g",
        protein: "0g per 100g",
        carbs: "0g per 100g",
        fat: "0g per 100g",
        isVegan: false,
        ingredients: isFoodResult.components || ["Not edible"],
        healthImplications: [
          "Not a food item - not meant for consumption",
          "Could be harmful if ingested",
          "No nutritional value",
          "Please search for actual food items for nutritional information"
        ],
        benefitsInfo: [],
        isNonFood: true
      };
    }

    // If it is a food item, proceed with normal processing
    const nutritionInfo = await getFoodNutritionInfoFromGemini(foodName, apiKey, modelType);

    // Then get additional health categorization from Gemini
    const healthInfo = await getHealthCategorization(foodName, apiKey, modelType);

    // Combine the information
    return {
      name: nutritionInfo.name,
      category: healthInfo.category,
      calories: nutritionInfo.calories,
      protein: nutritionInfo.protein,
      carbs: nutritionInfo.carbs,
      fat: nutritionInfo.fat,
      isVegan: nutritionInfo.isVegan,
      ingredients: healthInfo.ingredients,
      healthImplications: healthInfo.healthImplications,
      benefitsInfo: healthInfo.benefits ? healthInfo.benefits.split('. ').filter(b => b.trim()) : [],
      isNonFood: false
    };
  } catch (error) {
    console.error('Error searching food health:', error);
    throw new Error('Failed to get food health information');
  }
};

interface FoodCheckResult {
  isFood: boolean;
  components?: string[];
}

const checkIfFoodItem = async (
  query: string,
  apiKey: string,
  modelType: GeminiModelType
): Promise<FoodCheckResult> => {
  try {
    // Import GoogleGenerativeAI dynamically to avoid SSR issues

    const controller = new AbortController();
    const response = await axios.post(`${API_BASE_URL}/api/food-identification`, {
      query: query,
      modelType: modelType,
    }, {
      headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
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

    // Parse the response
    const jsonMatch = await text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format");
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    return {
      isFood: parsedData.isFood === true,
      components: Array.isArray(parsedData.components) ? parsedData.components : undefined
    };
  } catch (error) {
    // Handle errors gracefully
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error("Response data:", error.response.data);
      } else if (error.request) {
        console.error("Request made but no response received:", error.request);
      } else {
        console.error("Error setting up request:", error.message);
      }
    }
    // Log the error for debugging
    if (axios.isCancel(error)) {
      console.log("Request canceled:", error.message);
    } else {
      console.error("Error checking food item:", error);
    }
    console.error("Error in food identification:", error);

    // Default to assuming it's food in case of error to avoid false negatives
    return { isFood: true };
  }
};

interface HealthCategorizationResponse {
  category: 'healthy' | 'unhealthy' | 'junk' | 'neutral';
  ingredients: string[];
  healthImplications: string[];
  benefits: string;
}

const getHealthCategorization = async (
  foodName: string,
  apiKey: string,
  modelType: GeminiModelType
): Promise<HealthCategorizationResponse> => {
  try {
    // Import GoogleGenerativeAI dynamically to avoid SSR issues

    const controller = new AbortController();
    const response = await axios.post(`${API_BASE_URL}/api/nutrition-categories`, {
      foodName: foodName,
      modelType: modelType,
    }, {
      headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
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
    // Parse the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format");
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    return {
      category: parsedData.category || 'neutral',
      ingredients: Array.isArray(parsedData.ingredients) ? parsedData.ingredients : [],
      healthImplications: Array.isArray(parsedData.healthImplications) ? parsedData.healthImplications :
        ["Information not available"],
      benefits: parsedData.benefits || "Information not available"
    };
  } catch (error) {
    // Handle errors gracefully
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error("Response data:", error.response.data);
      } else if (error.request) {
        console.error("Request made but no response received:", error.request);
      } else {
        console.error("Error setting up request:", error.message);
      }
    }
    // Log the error for debugging
    if (axios.isCancel(error)) {
      console.log("Request canceled:", error.message);
    } else {
      console.error("Error getting health categorization:", error);
    }

    console.error("Error in health categorization:", error);

    // Return default fallback data
    return {
      category: 'neutral',
      ingredients: [],
      healthImplications: ["Could not determine health implications"],
      benefits: "Information not available"
    };
  }
};
