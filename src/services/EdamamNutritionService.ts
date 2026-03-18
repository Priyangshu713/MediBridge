// Nutrition Service with standard nutrition recommendations
import axios from "axios";
export interface NutritionCategory {
  category: string;
  foods: string[];
  benefits: string;
  imageUrl: string;
}

// Food categories with their default images
const NUTRITION_CATEGORIES = [
  {
    category: 'Colorful Vegetables',
    foods: ['Spinach', 'Broccoli', 'Bell peppers', 'Carrots', 'Purple cabbage', 'Kale', 'Sweet potatoes', 'Tomatoes'],
    benefits: 'Rich in vitamins, minerals, and antioxidants that help protect against chronic diseases. Regular consumption is linked to reduced risk of heart disease and certain cancers.',
    imageUrl: 'https://images.unsplash.com/photo-1568625365131-079e026a927d?auto=format&fit=crop&q=80&w=500',
  },
  {
    category: 'Fruits',
    foods: ['Berries', 'Apples', 'Citrus fruits', 'Bananas', 'Avocados', 'Kiwi', 'Pineapple', 'Mango'],
    benefits: 'Provide fiber, vitamins, and antioxidants while satisfying sweet cravings naturally. The diverse colors indicate different phytonutrients that support immune function.',
    imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&q=80&w=500',
  },
  {
    category: 'Lean Proteins',
    foods: ['Fish', 'Chicken breast', 'Tofu', 'Legumes', 'Greek yogurt', 'Eggs', 'Turkey', 'Cottage cheese'],
    benefits: 'Essential for muscle repair, immune function, and creating hormones and enzymes. They also provide satiety, helping control appetite and maintain healthy weight.',
    imageUrl: 'https://images.unsplash.com/photo-1600423115367-87ea7661688f?auto=format&fit=crop&q=80&w=500',
  },
  {
    category: 'Whole Grains',
    foods: ['Oats', 'Quinoa', 'Brown rice', 'Whole grain bread', 'Barley', 'Farro', 'Buckwheat', 'Whole wheat pasta'],
    benefits: 'Provide sustained energy, fiber, and various nutrients that refined grains lack. They support digestive health and help maintain stable blood sugar levels.',
    imageUrl: 'https://images.unsplash.com/photo-1514946379532-90281f815889?auto=format&fit=crop&q=80&w=500',
  },
  {
    category: 'Healthy Fats',
    foods: ['Olive oil', 'Avocado', 'Nuts', 'Seeds', 'Fatty fish', 'Chia seeds', 'Flaxseed', 'Walnuts'],
    benefits: 'Support brain health, hormone production, and absorption of fat-soluble vitamins. Omega-3 fatty acids from fish and certain plant sources have anti-inflammatory properties.',
    imageUrl: 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&q=80&w=500',
  }
];

// For personalized nutrition only - Still using Gemini API
import { GoogleGenAI } from "@google/genai";

// Food category images mapping
const CATEGORY_IMAGES = {
  'vegetables': 'https://images.unsplash.com/photo-1568625365131-079e026a927d?auto=format&fit=crop&q=80&w=500',
  'fruits': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&q=80&w=500',
  'proteins': 'https://images.unsplash.com/photo-1600423115367-87ea7661688f?auto=format&fit=crop&q=80&w=500',
  'grains': 'https://images.unsplash.com/photo-1514946379532-90281f815889?auto=format&fit=crop&q=80&w=500',
  'fats': 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&q=80&w=500',
};

export const fetchNutritionData = async (): Promise<NutritionCategory[]> => {
  try {
    // Return the standard nutrition categories
    return NUTRITION_CATEGORIES;
  } catch (error) {
    console.error('Error fetching nutrition data:', error);
    return NUTRITION_CATEGORIES;
  }
};

// The following functions will still be used for personalized nutrition
export const fetchNutritionFromGemini = async (apiKey: string): Promise<NutritionCategory[]> => {
  try {
    const controller = new AbortController();
    const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL_PROD}/get-Nutrition`, {
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

    return parseGeminiResponse(text);
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log("Request canceled:", error.message);
    } else {
      console.error("Error fetching nutrition data from Gemini:", error);
    }
    // Handle Axios errors
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error("Response data:", error.response.data);
      }
      else if (error.request) {
        console.error("Request made but no response received:", error.request);
      }
      else {
        console.error("Error setting up request:", error.message);
      }
    }
    console.error("Error fetching nutrition data from Gemini:", error);
    throw new Error("Failed to get AI nutrition recommendations");
  }
};

const parseGeminiResponse = (response: string): NutritionCategory[] => {
  try {
    // Find the JSON array in the response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No valid JSON array found in response");
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsedData)) {
      throw new Error("Parsed data is not an array");
    }

    return parsedData.map(category => ({
      category: category.category || "Food Category",
      foods: Array.isArray(category.foods) ? category.foods : [],
      benefits: category.benefits || "No benefits information provided",
      imageUrl: getCategoryImage(category.type || '')
    })).slice(0, 5);
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    throw new Error("Could not parse nutrition recommendations from AI response");
  }
};

// Get appropriate image URL based on food category type
const getCategoryImage = (type: string): string => {
  const lowerType = type.toLowerCase();

  for (const [key, url] of Object.entries(CATEGORY_IMAGES)) {
    if (lowerType.includes(key)) {
      return url;
    }
  }

  // Default to vegetables image if no match
  return CATEGORY_IMAGES.vegetables;
};
