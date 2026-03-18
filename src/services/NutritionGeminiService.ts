import { GoogleGenAI } from "@google/genai";
import { HealthData, GeminiModelType } from "@/store/healthStore";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface FoodNutritionInfo {
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  isVegan: boolean;
  dishes: string[];
  preparationTips: string;
  benefits: string;
}

export interface FoodCategory {
  category: string;
  foods: string[];
  benefits: string;
  mealPlan?: string;
}

export interface Recipe {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  preparationTime: string;
  nutritionInfo?: string;
}

export interface NutritionPlan {
  categories: FoodCategory[];
  generalAdvice: string;
}

export interface MealIdeaFromIngredients {
  title: string;
  description: string;
  ingredients: {
    name: string;
    amount: string;
    optional?: boolean;
  }[];
  instructions: string[];
  preparationTime: string;
  nutritionInfo: {
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
  };
  tips?: string;
}

export interface NutritionAnalysis {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber?: string;
  recommendations?: string[];
}

export const analyzeNutrition = async (
  foodList: string,
  apiKey: string,
  modelType: GeminiModelType = "gemini-3.1-flash-lite-preview"
): Promise<NutritionAnalysis> => {
  try {

    const controller = new AbortController();
    const response = await axios.post(`${API_BASE_URL}/api/nutrition-analysis`, {
      modelType: modelType,
      foodList: foodList,
    }, {
      headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
        },
      signal: controller.signal,
    })
    const text = response.data.data;


    controller.abort();
    return parseNutritionAnalysis(text);
  } catch (error) {
    console.error("Error analyzing nutrition:", error);
    if (axios.isCancel(error)) {
      console.log("Request canceled:", error.message);
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error("Response data:", error.response.data);
      } else if (error.request) {
        console.error("Request made but no response received:", error.request);
      } else {
        console.error("Error setting up request:", error.message);
      }
    }
    console.error("Error analyzing nutrition:", error);
    throw new Error("Failed to analyze nutrition. Please try again.");
  }
};

const parseNutritionAnalysis = (response: string): NutritionAnalysis => {
  try {
    // Find the JSON object in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON object found in response");
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    // Return parsed data with fallbacks for any missing properties
    return {
      calories: parsedData.calories || "0 kcal",
      protein: parsedData.protein || "0g",
      carbs: parsedData.carbs || "0g",
      fat: parsedData.fat || "0g",
      fiber: parsedData.fiber || "0g",
      recommendations: Array.isArray(parsedData.recommendations) ? parsedData.recommendations : []
    };
  } catch (error) {
    console.error("Error parsing nutrition analysis:", error);

    // Return default info if parsing fails
    return {
      calories: "N/A",
      protein: "N/A",
      carbs: "N/A",
      fat: "N/A",
      fiber: "N/A",
      recommendations: []
    };
  }
};

export const fetchNutritionPlanFromGemini = async (
  healthData: HealthData,
  allergies: string[],
  apiKey: string,
  modelType: GeminiModelType = "gemini-3.1-flash-lite-preview"
): Promise<NutritionPlan> => {
  try {
    // Validate required health data
    if (!healthData.age || !healthData.weight || !healthData.height) {
      throw new Error("Required health data is missing (age, weight, height)");
    }

    const controller = new AbortController();
    const response = await axios.post(`${API_BASE_URL}/api/nutrition-plan-generation`, {
      modelType: modelType,
      allergies: allergies || [],
      age: healthData.age || 0,
      gender: healthData.gender || "Not specified",
      height: healthData.height || 170,
      weight: healthData.weight || 70,
      bmi: healthData.bmi || 24,
      bmiCategory: healthData.bmiCategory || "Normal",
      bloodGlucose: healthData.bloodGlucose || 100,
    }, {
      headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
        },
      signal: controller.signal,
    })
    const text = response.data.data;
    console.log("Received response from backend:", response.data);
    controller.abort();

    return parseGeminiResponse(text);
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log("Request canceled:", error.message);
    } else {
      console.error("Error fetching nutrition plan from Gemini:", error);
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
    console.error("Error fetching nutrition plan from Gemini:", error);
    throw new Error("Failed to get AI nutrition plan. Please try again.");
  }
};

export const fetchRecipeFromGemini = async (
  mealIdea: string,
  allergies: string[],
  apiKey: string,
  modelType: GeminiModelType = "gemini-3.1-flash-lite-preview"
): Promise<Recipe> => {
  try {
    const controller = new AbortController();
    const response = await axios.post(`${API_BASE_URL}/api/recipe-generation`, {
      modelType: modelType,
      allergies: allergies,
      mealIdea: mealIdea,
    }, {
      headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
        },
      signal: controller.signal,
    })
    const text = response.data.data;
    console.log("Received response from backend:", response.data);
    controller.abort();
    return parseRecipeResponse(text);
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log("Request canceled:", error.message);
    } else {
      console.error("Error fetching recipe from Gemini:", error);
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
    console.error("Error fetching recipe from Gemini:", error);
    throw new Error("Failed to generate recipe. Please try again.");
  }
};

export const getFoodNutritionInfoFromGemini = async (
  foodName: string,
  apiKey: string,
  modelType: GeminiModelType = "gemini-3.1-flash-lite-preview"
): Promise<FoodNutritionInfo> => {
  try {
    const controller = new AbortController();
    const response = await axios.post(`${API_BASE_URL}/api/food-nutrition-info`, {
      modelType: modelType,
      foodName: foodName,
    }, {
      headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
        },
      signal: controller.signal,
    })
    const text = response.data.data;
    console.log("Received response from backend:", response.data);
    controller.abort();

    return parseFoodNutritionResponse(text, foodName);
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log("Request canceled:", error.message);
    } else {
      console.error("Error fetching food nutrition from Gemini:", error);
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
    console.error("Error fetching food nutrition from Gemini:", error);
    throw new Error("Failed to get AI food nutrition information. Please try again.");
  }
};

export const generateMealFromIngredients = async (
  ingredients: string[],
  servings: number,
  restrictions: string[],
  apiKey: string,
  modelType: GeminiModelType = "gemini-3.1-flash-lite-preview"
): Promise<MealIdeaFromIngredients> => {
  try {

    const controller = new AbortController();
    const response = await axios.post(`${API_BASE_URL}/api/meal-idea-generation`, {
      modelType: modelType,
      ingredients: ingredients,
      servings: servings,
      restrictions: restrictions,
    }, {
      headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
        },
      signal: controller.signal,
    })
    const text = response.data.data;
    if (!text) {
      throw new Error("No data received from backend");
    }
    if (typeof text !== 'string') {
      throw new Error("Received data is not a string");
    }
    console.log("Received response from backend:", response.data);
    controller.abort();


    return parseMealResponse(text);
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log("Request canceled:", error.message);
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error("Response data:", error.response.data);
      } else if (error.request) {
        console.error("Request made but no response received:", error.request);
      } else {
        console.error("Error setting up request:", error.message);
      }
    }
    console.error("Error generating meal from ingredients:", error);
    throw new Error("Failed to generate meal idea. Please try again.");
  }
};

const parseMealResponse = (response: string): MealIdeaFromIngredients => {
  try {
    // Find the JSON object in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON object found in response");
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    // Return parsed data with fallbacks for any missing properties
    return {
      title: parsedData.title || "Meal Idea",
      description: parsedData.description || "A meal created with your ingredients",
      ingredients: Array.isArray(parsedData.ingredients)
        ? parsedData.ingredients.map((ing: any) => ({
          name: ing.name || "Ingredient",
          amount: ing.amount || "As needed",
          optional: ing.optional || false
        }))
        : [],
      instructions: Array.isArray(parsedData.instructions)
        ? parsedData.instructions
        : ["No instructions provided"],
      preparationTime: parsedData.preparationTime || "Not specified",
      nutritionInfo: {
        calories: parsedData.nutritionInfo?.calories || "Not available",
        protein: parsedData.nutritionInfo?.protein || "Not available",
        carbs: parsedData.nutritionInfo?.carbs || "Not available",
        fat: parsedData.nutritionInfo?.fat || "Not available"
      },
      tips: parsedData.tips
    };
  } catch (error) {
    console.error("Error parsing meal response:", error);

    // Return default meal idea if parsing fails
    return {
      title: "Simple Meal",
      description: "A simple meal with your ingredients",
      ingredients: [],
      instructions: ["Unable to generate detailed instructions"],
      preparationTime: "Not available",
      nutritionInfo: {
        calories: "Not available",
        protein: "Not available",
        carbs: "Not available",
        fat: "Not available"
      }
    };
  }
};

const parseGeminiResponse = (response: string): NutritionPlan => {
  try {
    // Find the JSON object in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON object found in response");
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    if (!parsedData.categories || !Array.isArray(parsedData.categories)) {
      throw new Error("Parsed data doesn't contain valid categories array");
    }

    return {
      categories: parsedData.categories.map((category: any) => ({
        category: category.category || "Food Category",
        foods: Array.isArray(category.foods) ? category.foods : [],
        benefits: category.benefits || "No benefits information provided",
        mealPlan: category.mealPlan || undefined
      })),
      generalAdvice: parsedData.generalAdvice || "No general advice provided"
    };
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    throw new Error("Could not parse nutrition plan from AI response");
  }
};

const parseRecipeResponse = (response: string): Recipe => {
  try {
    // Find the JSON object in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON object found in response");
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    return {
      title: parsedData.title || "Recipe",
      description: parsedData.description || "No description provided",
      ingredients: Array.isArray(parsedData.ingredients) ? parsedData.ingredients : [],
      instructions: Array.isArray(parsedData.instructions) ? parsedData.instructions : [],
      preparationTime: parsedData.preparationTime || "Not specified",
      nutritionInfo: parsedData.nutritionInfo || undefined
    };
  } catch (error) {
    console.error("Error parsing recipe response:", error);
    throw new Error("Could not parse recipe from AI response");
  }
};

const parseFoodNutritionResponse = (response: string, originalFoodName: string): FoodNutritionInfo => {
  try {
    // Find the JSON object in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON object found in response");
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    // Return parsed data with fallbacks for any missing properties
    return {
      name: parsedData.name || originalFoodName,
      calories: parsedData.calories || "Information not available",
      protein: parsedData.protein || "Information not available",
      carbs: parsedData.carbs || "Information not available",
      fat: parsedData.fat || "Information not available",
      isVegan: typeof parsedData.isVegan === 'boolean' ? parsedData.isVegan : false,
      dishes: Array.isArray(parsedData.dishes) ? parsedData.dishes : ["Information not available"],
      preparationTips: parsedData.preparationTips || "Information not available",
      benefits: parsedData.benefits || "Information not available"
    };
  } catch (error) {
    console.error("Error parsing food nutrition response:", error);

    // Return default information if parsing fails
    return {
      name: originalFoodName,
      calories: "Information not available",
      protein: "Information not available",
      carbs: "Information not available",
      fat: "Information not available",
      isVegan: false,
      dishes: ["Information not available"],
      preparationTips: "Information not available",
      benefits: "Information not available"
    };
  }
};


/*const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: modelType,
    });

    console.log("Analyzing nutrition for food list:", foodList);
    const prompt = `
      You are a nutritionist AI. Please analyze the following food list and provide a nutritional breakdown.
      Format your response in a JSON object with the following structure:
      {
        "calories": "Total calories with unit (e.g., 450 kcal)",
        "protein": "Total protein with unit (e.g., 25g)",
        "carbs": "Total carbs with unit (e.g., 60g)",
        "fat": "Total fat with unit (e.g., 15g)",
        "fiber": "Total fiber with unit (e.g., 8g)",
        "recommendations": ["1-3 brief recommendations for improving this meal nutritionally"]
      }
      
      Food list: "${foodList}"
      
      Make your best estimate based on standard portion sizes if quantities are not specified.
      Be realistic in your assessment and provide reasonable estimates.
      Return ONLY a valid JSON object with no other text.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log(text); 
    
    
    
    

        const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: modelType,
    });
    console.log("Fetching nutrition plan from Gemini with data:", healthData, "and allergies:", allergies);

    const allergyString = allergies.length > 0
      ? `The patient has the following food allergies: ${allergies.join(', ')}.`
      : 'The patient has no reported food allergies.';

    const prompt = `
      You are a nutrition advisor AI. Please analyze the following health data and provide a personalized nutrition plan.
      Format your response in a JSON object with the following structure:
      {
        "categories": [
          {
            "category": "Category name (e.g., Low-Calorie, Nutrient-Dense Foods)",
            "foods": ["Food 1", "Food 2", "Food 3", "Food 4"],
            "benefits": "Brief description of benefits",
            "mealPlan": "Example meal plan/recipe using these foods"
          }
        ],
        "generalAdvice": "General nutrition advice for this person"
      }
      
      Patient health data:
      - Age: ${healthData.age || 'Not specified'}
      - Gender: ${healthData.gender || 'Not specified'}
      - Height: ${healthData.height || 'Not specified'} cm
      - Weight: ${healthData.weight || 'Not specified'} kg
      - BMI: ${healthData.bmi || 'Not specified'} (Category: ${healthData.bmiCategory || 'Not specified'})
      - Blood Glucose: ${healthData.bloodGlucose || 'Not specified'} mg/dL
      - ${allergyString}
      
      Provide:
      - 3-4 categories of foods appropriate for this person's health profile
      - For each category, list 4-6 specific foods that would be beneficial
      - Include a brief explanation of why these foods are beneficial
      - Include a simple meal plan or recipe example for each category
      - Avoid any foods mentioned in allergies list
      - Make sure to address blood sugar management if glucose is elevated
      - Make sure to address weight management if BMI is in overweight or obese range
      
      Return ONLY a valid JSON object with no other text.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log(text);
    */
