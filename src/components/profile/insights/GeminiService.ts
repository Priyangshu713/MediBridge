

import axios from 'axios';
import { InsightSection } from './types';
import { getInsightIcon } from './IconProvider';
import { useHealthStore, GeminiModelType } from "@/store/healthStore";
import { generateSampleInsights } from './SampleInsightsGenerator';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Function to format text content with proper markdown rendering
const formatInsightContent = (content: string): string => {
  // Handle bold text marked with asterisks
  let formattedContent = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Handle section headers (lines that begin with asterisks)
  formattedContent = formattedContent.replace(/^\s*\*\*([^*:]+):\*\*/gm, '<span class="font-bold text-primary">$1:</span> ');

  // Handle bullet points (lines starting with - or *)
  formattedContent = formattedContent.replace(/^\s*[\-\*]\s+(.+)$/gm, '<li>$1</li>');

  // Wrap lists in <ul> tags
  formattedContent = formattedContent.replace(/(<li>.*<\/li>)(?!\s*<\/ul>)/gs, '<ul class="list-disc pl-4 my-2">$1</ul>');

  // Add proper paragraph spacing for better readability
  formattedContent = formattedContent.replace(/\n\n/g, '</p><p class="mb-1">');

  // Ensure content is wrapped in paragraphs if it's not already
  if (!formattedContent.startsWith('<p') && !formattedContent.startsWith('<span') && !formattedContent.startsWith('<ul')) {
    formattedContent = '<p class="mb-1">' + formattedContent;
  }
  if (!formattedContent.endsWith('</p>') && !formattedContent.endsWith('</ul>')) {
    formattedContent = formattedContent + '</p>';
  }

  return formattedContent;
};

export const fetchInsightsFromGemini = async (
  healthData: any,
  apiKey: string,
  modelType: GeminiModelType = "gemini-3.1-flash-lite-preview"
): Promise<InsightSection[]> => {
  try {
    // Validate required health data
    if (!healthData.age || !healthData.gender || !healthData.height || !healthData.weight) {
      console.warn("Missing required health data, using sample insights");
      return generateSampleInsights(healthData);
    }

    const controller = new AbortController();
    // Use configurable base URL
    const response = await axios.post(
      `${API_BASE_URL}/api/health-insights`,
      {
        modelType: modelType,
        age: healthData.age || 0,
        gender: healthData.gender || "Not specified",
        height: healthData.height || 170,
        weight: healthData.weight || 70,
        bmi: healthData.bmi || 24,
        bmiCategory: healthData.bmiCategory || "Normal",
        bloodGlucose: healthData.bloodGlucose || 100,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
        },
        signal: controller.signal,
      }
    );

    controller.abort();

    if (!response.data || !response.data.data) {
      console.warn("Invalid response format, using sample insights");
      return generateSampleInsights(healthData);
    }

    const text = response.data.data;
    return parseGeminiResponse(text);
  } catch (error) {
    console.error("Error fetching AI insights:", error);
    // Fallback to sample insights if API call fails
    const sampleInsights = generateSampleInsights(healthData);
    return sampleInsights;
  }
};

const parseGeminiResponse = (response: string): InsightSection[] => {
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No valid JSON array found in response");
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsedData)) {
      throw new Error("Parsed data is not an array");
    }

    return parsedData.map(item => ({
      title: item.title || "Health Insight",
      content: formatInsightContent(item.content) || "No content provided",
      type: ['normal', 'warning', 'critical', 'positive'].includes(item.type)
        ? item.type
        : 'normal',
      icon: getInsightIcon(item.type)
    })).slice(0, 4);
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    throw new Error("Could not parse health insights from AI response");
  }
};
