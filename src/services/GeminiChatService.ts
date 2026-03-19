import { GeminiModelType } from "@/store/healthStore";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Message type for chat history
export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface GeminiResponse {
  text: string;
  thinking?: string; // Add thinking property for the thinking process
}



export const createGeminiChatSession = async (
  apiKey: string,
  modelType: GeminiModelType = "gemini-3-flash-preview",
  mode: 'chat' | 'symptom-checker' = 'chat',
  persistSession: boolean = true
) => {
  const isThinkingModel = modelType.includes("thinking") || modelType === "gemini-3-flash-preview";

  try {
    console.log(`Creating new Gemini chat session with model: ${modelType}, mode: ${mode}, persist: ${persistSession}`);
    const sessionKey = mode === 'chat' ? "geminiChatSession" : "geminiSymptomCheckerSession";
    let chatSession = persistSession ? localStorage.getItem(sessionKey) : null;

    // If mode has changed, we might want to force a new session, but for now let's rely on the caller to clear session if needed.
    // Actually, if we are switching modes, we probably want a fresh session or the backend to handle it.
    // The backend creates a session with a specific mode. If we reuse a session ID, the mode is already set in DB.
    // So if the user switches mode, we MUST create a new session.

    if (!chatSession) {
      if (persistSession) {
        console.log("No chat session found in local storage. Creating a new session.");
      }
      try {
        const controller = new AbortController();
        // Use configurable base URL
        const newSession = await axios.post(`${API_BASE_URL}/api/create-chat-session`,
          { modelType: modelType, mode: mode },
          {
            headers: {
              'Content-Type': 'application/json',
              ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
            },
            signal: controller.signal,
          }
        );

        chatSession = newSession.data.data;
        if (persistSession) {
          localStorage.setItem(sessionKey, chatSession!);
        }
        console.log("New chat session created:", chatSession);
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log("Request canceled:", error.message);
        } else {
          console.error("Error creating new chat session:", error);
        }
      }
    }

    if (!chatSession) {
      throw new Error("Failed to create chat session");
    }

    // Define the sendMessageStream function
    const sendMessageStream = async function* (message: string) {
      try {
        // Use configurable base URL
        const response = await fetch(`${API_BASE_URL}/api/send-message`, {
          method: 'POST',
          credentials: 'include',
          headers: {
              'Content-Type': 'application/json',
              ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
            },
          body: JSON.stringify({
            sessionId: chatSession,
            message: message,
          }),
        });

        if (!response.ok) {
          if (response.status === 404) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.error?.includes('expired') || errorData.error?.includes('not found') || !errorData.error) {
              localStorage.removeItem(sessionKey);
              throw new Error("Session expired. Please refresh to start a new chat.");
            }
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Split buffer into lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep the last incomplete line in buffer

          for (const line of lines) {
            if (line.trim()) {
              yield { text: line + '\n', thinking: undefined };
            }
          }
        }

        // Yield any remaining content in buffer
        if (buffer.trim()) {
          yield { text: buffer, thinking: undefined };
        }

      } catch (error) {
        console.error('Error streaming message:', error);
        throw error;
      }
    };

    return {
      sessionId: chatSession,
      sendMessageStream,
    };
  } catch (error) {
    console.error("Error creating Gemini chat session:", error);
    return {
      sendMessage: async (message: string): Promise<GeminiResponse> => {
        return {
          text: "I'm sorry, there was an error creating the chat session. Please check your API key and try again."
        };
      },
      sendMessageStream: async function* (message: string) {
        yield { text: "I'm sorry, there was an error creating the chat session. Please check your API key and try again." };
      }
    };
  }
};

export const fetchChatHistory = async (sessionId: string): Promise<ChatMessage[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/chat-history/${sessionId}`, {
      headers: {
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    if (response.data && response.data.success) {
      return response.data.data.map((msg: any) => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));
    }
    return [];
  } catch (error: any) {
    if (error.response?.status === 404) {
        console.warn("Chat history not found. The session may have expired on the server.");
        // Clear both possible session keys from local storage to force a fresh session next time
        localStorage.removeItem("geminiChatSession");
        localStorage.removeItem("geminiSymptomCheckerSession");
    } else {
        console.error("Error fetching chat history:", error);
    }
    return [];
  }
};