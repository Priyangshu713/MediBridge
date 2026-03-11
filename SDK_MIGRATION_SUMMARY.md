# SDK Migration Summary: @google/generative-ai → @google/genai

## Overview
Updated the Health Connect App from the older Google Generative AI SDK to the latest Google GenAI SDK.

## Changes Made

### 1. Package Dependency Update
- **Old:** `@google/generative-ai@^0.24.0`
- **New:** `@google/genai@^0.1.0`
- **File:** `package.json`

### 2. Import Statement Updates
Changed all imports across the codebase:
- **Old:** `import { GoogleGenerativeAI } from "@google/generative-ai"`
- **New:** `import { GoogleGenAI } from "@google/genai"`

### 3. Files Updated
The following files have been updated with the new SDK imports:

**Services:**
- ✅ `src/services/GeminiChatService.ts`
- ✅ `src/services/AdvancedHealthGeminiService.ts`
- ✅ `src/services/WorkoutGeminiService.ts`
- ✅ `src/services/NutritionGeminiService.ts`
- ✅ `src/services/HealthReportGeminiService.ts`
- ✅ `src/services/EdamamNutritionService.ts`

**Hooks:**
- ✅ `src/hooks/useDoctorRecommendations.ts`

**Components:**
- ✅ `src/components/profile/insights/GeminiService.ts`

## Key Differences Between SDKs

| Aspect | Old SDK (@google/generative-ai) | New SDK (@google/genai) |
|--------|----------------------------------|------------------------|
| **Main Class** | `GoogleGenerativeAI` | `GoogleGenAI` |
| **Model Usage** | `genAI.getGenerativeModel()` → `.startChat()` | `ai.models.generateContentStream()` |
| **Config Structure** | Separate `generationConfig` | Unified `config` object |
| **Streaming** | Promise-based | Async generator (for-await) |
| **Tools Support** | Manual definitions | Built-in tools (e.g., `googleSearch`) |
| **Thinking Models** | Limited support | `thinkingConfig` with `thinkingBudget` |
| **Image Config** | Direct parameters | `imageConfig` object |

## Next Steps

1. **Install Dependencies:**
   ```bash
   npm install
   # or
   bun install
   ```
   This will download the new SDK and regenerate `package-lock.json`

2. **Update Backend Integration:**
   The app currently uses backend endpoints for Gemini calls. Verify that:
   - Backend endpoints are compatible with new SDK
   - `VITE_BACKEND_URL_PROD` environment variable is properly set

3. **Test Functionality:**
   - Test chat sessions and message sending
   - Verify health analysis features
   - Check nutrition recommendations
   - Validate workout analysis

## Migration Notes

- The app primarily uses backend API endpoints (not direct SDK calls in frontend)
- Backend URLs are referenced in services (e.g., `/create-chat-session`, `/send-message`)
- Consider updating backend services to use the new `@google/genai` SDK as well
- New SDK supports advanced features like:
  - `thinkingBudget: -1` for unlimited thinking tokens
  - `googleSearch` tool integration
  - Improved streaming with async generators

## Resources

- [Google GenAI SDK Documentation](https://github.com/googleapis/generative-ai-js)
- New SDK Features: Advanced thinking models, improved streaming, built-in tools support
