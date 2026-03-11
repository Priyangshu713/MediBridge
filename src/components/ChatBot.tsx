import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, Send, Sparkles, Brain, ChevronDown, ChevronUp, Lightbulb, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { createGeminiChatSession, fetchChatHistory } from '@/services/GeminiChatService';
import { ThinkingModel } from '@/components/common/ThinkingModel';
import { useHealthStore } from '@/store/healthStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  thinking?: string[];
  thinkingTime?: number;
  isStreaming?: boolean;
}

interface ChatBotProps {
  useGemini: boolean;
  geminiTier?: 'free' | 'lite' | 'pro';
  onRequestUpgrade?: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ useGemini: initialUseGemini, geminiTier = 'free', onRequestUpgrade }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi there! How can I help with your health questions today?',
      sender: 'bot',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useGemini, setUseGemini] = useState(initialUseGemini);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const healthStore = useHealthStore();
  const { geminiModel, geminiApiKey } = healthStore;
  const currentGeminiTier = healthStore.geminiTier;
  const isThinkingModel = geminiModel.includes('thinking') || geminiModel === 'gemini-2.5-flash';
  const isPaidUser = currentGeminiTier === 'lite' || currentGeminiTier === 'pro';
  const isPremiumModel = geminiModel.includes('gemini-2.0-pro') ||
    geminiModel.includes('gemini-2.0-flash-thinking') ||
    geminiModel.includes('gemini-2.0-flash-thinking');
  const canUseSelectedModel = isPaidUser && (!isPremiumModel || currentGeminiTier === 'pro');

  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [mode, setMode] = useState<'chat' | 'symptom-checker'>('chat');

  useEffect(() => {
    if (isPaidUser && geminiApiKey) {
      setUseGemini(true);
    } else {
      setUseGemini(false);
    }
  }, [isPaidUser, geminiApiKey]);

  useEffect(() => {
    const loadHistory = async () => {
      const sessionKey = mode === 'chat' ? "geminiChatSession" : "geminiSymptomCheckerSession";
      const sessionId = localStorage.getItem(sessionKey);
      if (sessionId && useGemini && geminiApiKey) {
        try {
          const history = await fetchChatHistory(sessionId);
          if (history.length > 0) {
            const formattedMessages: Message[] = history.map((msg, index) => ({
              id: `history-${index}-${Date.now()}`,
              text: msg.parts[0].text,
              sender: msg.role === 'model' ? 'bot' : 'user',
            }));

            setMessages(prev => {
              // If the only message is the default greeting, replace it
              if (prev.length === 1 && prev[0].sender === 'bot' && prev[0].text.startsWith('Hi there')) {
                return formattedMessages;
              }
              // Otherwise, keep existing messages (though usually this runs on mount)
              return formattedMessages;
            });
          }
        } catch (error) {
          console.error("Failed to load chat history", error);
        }
      }
    };
    loadHistory();
  }, [useGemini, geminiApiKey, mode]);

  // Effect to handle model changes - clear session to ensure backend uses the correct model
  const prevModelRef = useRef(geminiModel);
  useEffect(() => {
    if (prevModelRef.current !== geminiModel) {
      const sessionKey = mode === 'chat' ? "geminiChatSession" : "geminiSymptomCheckerSession";
      localStorage.removeItem(sessionKey);
      setMessages([
        {
          id: '1',
          text: 'Hi there! How can I help with your health questions today?',
          sender: 'bot',
        },
      ]);
      prevModelRef.current = geminiModel;
    }
  }, [geminiModel, mode]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const { scrollHeight, clientHeight } = scrollAreaRef.current;
      const maxScrollTop = scrollHeight - clientHeight;

      scrollAreaRef.current.scrollTo({
        top: maxScrollTop,
        behavior: 'smooth'
      });
    }
  };

  const toggleThinking = (messageId: string) => {
    setExpandedMessages(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const handleClearChat = () => {
    const sessionKey = mode === 'chat' ? "geminiChatSession" : "geminiSymptomCheckerSession";
    localStorage.removeItem(sessionKey);

    setMessages([
      {
        id: '1',
        text: mode === 'chat'
          ? 'Hi there! How can I help with your health questions today?'
          : 'Hello. I am the Symptom Checker. Please describe your main symptom.',
        sender: 'bot',
      },
    ]);

    toast({
      title: "Chat Cleared",
      description: "Your chat history has been cleared.",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    if (isPremiumModel && currentGeminiTier !== 'pro') {
      toast({
        title: "Premium Model Restricted",
        description: "You need to upgrade to Pro tier to use this premium model",
        variant: "destructive",
      });

      if (onRequestUpgrade) {
        onRequestUpgrade();
      }
      return;
    }

    if (currentGeminiTier === 'free' && useGemini) {
      if (onRequestUpgrade) {
        onRequestUpgrade();
      }
      return;
    }

    const userMessageId = Date.now().toString();
    const userMessage: Message = {
      id: userMessageId,
      text: input,
      sender: 'user',
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input; // Capture input for retry
    setInput('');
    setIsLoading(true);

    const startTime = Date.now();
    const botMessageId = (Date.now() + 1).toString();

    // Create placeholder for bot message immediately
    setMessages(prev => [
      ...prev,
      {
        id: botMessageId,
        text: '',
        sender: 'bot',
        thinking: isThinkingModel ? [] : undefined,
        isStreaming: true
      }
    ]);

    const processStream = async (stream: AsyncGenerator<any>) => {
      let fullText = "";
      let thinkingText = "";
      let isCollectingThinking = false;

      for await (const chunk of stream) {
        const chunkText = chunk.text || "";

        if (isThinkingModel) {
          // Handle thinking process markers
          if (chunkText.includes("THINKING PROCESS:")) {
            isCollectingThinking = true;
            const parts = chunkText.split("THINKING PROCESS:");
            if (parts[1]) {
              thinkingText += parts[1];
              // If the chunk also contains the end marker
              if (parts[1].includes("RESPONSE_BEGINS_HEALTH_CONNECT:")) {
                const subParts = parts[1].split("RESPONSE_BEGINS_HEALTH_CONNECT:");

                // The `thinkingText` variable currently holds `parts[1]` which includes the end marker and the answer.
                // We need to remove the answer part from `thinkingText` and add it to `fullText`.
                thinkingText = thinkingText.replace("RESPONSE_BEGINS_HEALTH_CONNECT:" + subParts[1], "");

                fullText += subParts[1];
                isCollectingThinking = false;
              }
            }
          } else if (chunkText.includes("RESPONSE_BEGINS_HEALTH_CONNECT:") || chunkText.includes("ANSWER:")) {
            isCollectingThinking = false;
            const marker = chunkText.includes("RESPONSE_BEGINS_HEALTH_CONNECT:") ? "RESPONSE_BEGINS_HEALTH_CONNECT:" : "ANSWER:";
            const parts = chunkText.split(marker);
            if (parts[0]) thinkingText += parts[0];
            if (parts[1]) fullText += parts[1];
          } else {
            if (isCollectingThinking) {
              thinkingText += chunkText;
            } else {
              fullText += chunkText;
            }
          }

          // Update state
          setMessages(prev => prev.map(msg =>
            msg.id === botMessageId
              ? {
                ...msg,
                text: fullText,
                thinking: thinkingText ? [thinkingText] : undefined,
                thinkingTime: Date.now() - startTime
              }
              : msg
          ));

        } else {
          fullText += chunkText;
          setMessages(prev => prev.map(msg =>
            msg.id === botMessageId
              ? { ...msg, text: fullText }
              : msg
          ));
        }
      }

      setMessages(prev => prev.map(msg =>
        msg.id === botMessageId
          ? { ...msg, isStreaming: false }
          : msg
      ));
    };

    try {
      if (useGemini && geminiApiKey && canUseSelectedModel) {
        let geminiSession = await createGeminiChatSession(geminiApiKey, geminiModel, mode);

        try {
          const stream = await geminiSession.sendMessageStream(currentInput);
          await processStream(stream);
        } catch (error: any) {
          if (error.message && error.message.includes("Session expired")) {
            console.log("Session expired. Creating new session and retrying...");
            toast({
              title: "Session Expired",
              description: "Starting a new chat session automatically...",
            });

            // Create new session
            geminiSession = await createGeminiChatSession(geminiApiKey, geminiModel, mode);
            // Retry sending message
            const stream = await geminiSession.sendMessageStream(currentInput);
            await processStream(stream);
          } else {
            throw error;
          }
        }

      } else {
        // Fallback logic for free tier or simulation
        let stream;
        if (currentGeminiTier === 'free') {
          const upgradeMessage = `**Upgrade Required**
            
To access the AI-powered health assistant with personalized recommendations, please upgrade to our Lite or Pro tier.

* Lite Tier: AI-powered personalized responses
* Pro Tier: Advanced AI models with in-depth health analysis

Click the "Upgrade" button below to access premium features.`;
          stream = streamText(upgradeMessage);
        } else {
          stream = simulateResponse(currentInput);
        }

        await processStream(stream);
      }
    } catch (error) {
      console.error('Error generating response:', error);
      toast({
        title: "Error",
        description: "Failed to generate a response. Please try again.",
        variant: "destructive",
      });

      setMessages(prev => prev.map(msg =>
        msg.id === botMessageId
          ? {
            ...msg,
            text: "I'm sorry, I encountered an error processing your request. Please try again.",
            isStreaming: false
          }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const streamText = async function* (text: string) {
    const chunkSize = 4; // Characters per chunk
    for (let i = 0; i < text.length; i += chunkSize) {
      yield { text: text.slice(i, i + chunkSize) };
      await new Promise(resolve => setTimeout(resolve, 20)); // Typing delay
    }
  };

  const simulateResponse = async function* (query: string) {
    // Initial delay to simulate thinking
    await new Promise(resolve => setTimeout(resolve, 600));

    let responseText = "";
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('headache') || lowerQuery.includes('head pain')) {
      responseText = "Headaches can be caused by various factors such as stress, dehydration, lack of sleep, or eye strain. For occasional headaches, rest, hydration, and over-the-counter pain relievers may help. If you're experiencing severe or recurring headaches, it's best to consult a healthcare professional.";
    } else if (lowerQuery.includes('diet') || lowerQuery.includes('eat') || lowerQuery.includes('food')) {
      responseText = "A balanced diet is essential for good health. Try to include plenty of fruits, vegetables, whole grains, lean proteins, and healthy fats in your meals. Limit processed foods, sugary drinks, and excessive salt. Remember to stay hydrated by drinking plenty of water throughout the day.";
    } else if (lowerQuery.includes('sleep') || lowerQuery.includes('insomnia')) {
      responseText = "Good sleep hygiene is important for overall health. Aim for 7-9 hours of quality sleep each night. Establish a regular sleep schedule, create a relaxing bedtime routine, and make your bedroom comfortable and free from distractions. Avoid caffeine, large meals, and screen time before bed.";
    } else if (lowerQuery.includes('exercise') || lowerQuery.includes('workout')) {
      responseText = "Regular physical activity is beneficial for both physical and mental health. Aim for at least 150 minutes of moderate-intensity aerobic activity or 75 minutes of vigorous activity per week, along with muscle-strengthening activities twice a week. Find activities you enjoy to make exercise a sustainable part of your routine.";
    } else if (lowerQuery.includes('stress') || lowerQuery.includes('anxiety')) {
      responseText = "Managing stress is crucial for wellbeing. Consider techniques like deep breathing, meditation, physical activity, or connecting with loved ones. Ensure you're getting enough sleep and maintaining a balanced diet. If stress or anxiety is significantly affecting your daily life, consider speaking with a healthcare provider.";
    } else {
      responseText = "I'm here to provide general health information. While I can offer basic guidance on topics like nutrition, exercise, sleep, and common health concerns, I'm not a substitute for professional medical advice. If you have specific health concerns, please consult with a healthcare provider.";
    }

    yield* streamText(responseText);
  };

  const formatThinkingTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const handleModeChange = async (newMode: 'chat' | 'symptom-checker') => {
    if (mode === newMode) return;
    setMode(newMode);

    // Load existing session for the new mode
    const newSessionKey = newMode === 'chat' ? "geminiChatSession" : "geminiSymptomCheckerSession";
    const existingSessionId = localStorage.getItem(newSessionKey);

    if (existingSessionId && useGemini && geminiApiKey) {
      try {
        const history = await fetchChatHistory(existingSessionId);
        if (history.length > 0) {
          const formattedMessages: Message[] = history.map((msg, index) => ({
            id: `history-${index}-${Date.now()}`,
            text: msg.parts[0].text,
            sender: msg.role === 'model' ? 'bot' : 'user',
          }));
          setMessages(formattedMessages);
          return;
        }
      } catch (error) {
        console.error('Error loading history for new mode:', error);
      }
    }

    // If no existing session, show default greeting
    setMessages([
      {
        id: '1',
        text: newMode === 'chat'
          ? 'Hi there! How can I help with your health questions today?'
          : 'Hello. I am the Symptom Checker. Please describe your main symptom.',
        sender: 'bot',
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b flex justify-between md:justify-center items-center relative gap-2 bg-muted/30">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowHelpDialog(true)}
          className="rounded-full h-8 w-8 md:absolute md:left-3"
          title="Help & Info"
        >
          <Lightbulb className="h-3 w-3 text-amber-500" />
        </Button>

        <div className="flex gap-2">
          <Button
            variant={mode === 'chat' ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeChange('chat')}
            className="text-xs h-8 rounded-full"
          >
            <Bot className="w-3 h-3 mr-1" />
            General Chat
          </Button>
          <Button
            variant={mode === 'symptom-checker' ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeChange('symptom-checker')}
            className="text-xs h-8 rounded-full"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Symptom Checker
          </Button>
        </div>
      </div>

      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <Avatar className={message.sender === 'user' ? 'bg-primary/10' : 'bg-muted'}>
                    <AvatarFallback>{message.sender === 'user' ? 'U' : 'AI'}</AvatarFallback>
                    {message.sender === 'bot' && (
                      <AvatarImage
                        src="/lovable-uploads/d0d800ca-f073-4663-a228-b3dca4178d45.png"
                        alt="AI Bot"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/lovable-uploads/85e10dd8-810c-44de-8661-df3911e610ce.png';
                        }}
                      />
                    )}
                  </Avatar>

                  <div className={`rounded-lg p-3 ${message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                    }`}>
                    <div className="text-sm prose-sm max-w-none">
                      {message.thinking && message.thinking.length > 0 && (
                        <div className="mb-4">
                          <button
                            onClick={() => toggleThinking(message.id)}
                            className="flex items-center justify-between w-full mb-2 p-2 bg-primary/10 hover:bg-primary/15 rounded-md transition-colors"
                          >
                            <div className="flex items-center gap-1 text-xs text-primary font-medium">
                              <Brain className="h-3 w-3" />
                              <span>
                                {message.isStreaming && (!message.thinkingTime || message.thinkingTime === 0)
                                  ? "Thinking..."
                                  : `Thought for ${message.thinkingTime ? formatThinkingTime(message.thinkingTime) : '?'}`}
                              </span>
                            </div>
                            {expandedMessages[message.id] ? (
                              <ChevronUp className="h-3 w-3 text-primary" />
                            ) : (
                              <ChevronDown className="h-3 w-3 text-primary" />
                            )}
                          </button>

                          {expandedMessages[message.id] && (
                            <div className="bg-primary/5 p-3 rounded-md border border-primary/10 mb-2 animate-in fade-in-50 duration-150">
                              <div className="text-xs text-muted-foreground prose prose-sm max-w-none dark:prose-invert">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    ul: ({ node, ...props }) => <ul className="list-disc pl-4 my-1" {...props} />,
                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-4 my-1" {...props} />,
                                    li: ({ node, ...props }) => <li className="mb-0.5" {...props} />,
                                    p: ({ node, ...props }) => <p className="mb-1 last:mb-0" {...props} />,
                                    strong: ({ node, ...props }) => <strong className="font-semibold text-primary/80" {...props} />,
                                  }}
                                >
                                  {message.thinking.join('\n')}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )}

                          <div className="border-t border-primary/10 pt-3 mt-1">
                            <div className="font-medium text-sm mb-2">Answer:</div>
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  ul: ({ node, ...props }) => <ul className="list-disc pl-4 my-2" {...props} />,
                                  ol: ({ node, ...props }) => <ol className="list-decimal pl-4 my-2" {...props} />,
                                  li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                  h1: ({ node, ...props }) => <h1 className="text-xl font-bold my-3" {...props} />,
                                  h2: ({ node, ...props }) => <h2 className="text-lg font-bold my-2" {...props} />,
                                  h3: ({ node, ...props }) => <h3 className="text-md font-bold my-2" {...props} />,
                                  strong: ({ node, ...props }) => <strong className="font-bold text-primary" {...props} />,
                                  p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                }}
                              >
                                {message.text}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      )}

                      {(!message.thinking || message.thinking.length === 0) && (
                        <div className="relative">
                          <div className="prose prose-sm dark:prose-invert max-w-none inline-block">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                ul: ({ node, ...props }) => <ul className="list-disc pl-4 my-2" {...props} />,
                                ol: ({ node, ...props }) => <ol className="list-decimal pl-4 my-2" {...props} />,
                                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                h1: ({ node, ...props }) => <h1 className="text-xl font-bold my-3" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-lg font-bold my-2" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-md font-bold my-2" {...props} />,
                                strong: ({ node, ...props }) => <strong className="font-bold text-primary" {...props} />,
                                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                              }}
                            >
                              {message.text}
                            </ReactMarkdown>
                          </div>
                          {message.isStreaming && (
                            <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-primary animate-pulse" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && !messages[messages.length - 1]?.isStreaming && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex gap-3 max-w-[80%]">
                <Avatar className="bg-muted">
                  <AvatarFallback>AI</AvatarFallback>
                  <AvatarImage
                    src="/lovable-uploads/85e10dd8-810c-44de-8661-df3911e610ce.png"
                    alt="AI Bot"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/path/to/default/bot/icon.png';
                    }}
                  />
                </Avatar>
                <div className="bg-muted rounded-lg p-4 flex items-center space-x-2">
                  {isThinkingModel ? (
                    <div className="flex items-center space-x-2 text-primary/70">
                      <Brain className="h-4 w-4 animate-pulse" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  ) : (
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleClearChat}
            className="shrink-0 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Input
            placeholder={mode === 'symptom-checker' ? "Describe your symptoms..." : "Type your health question..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || (!isPaidUser && useGemini)}
            className="flex-1"
          />

          {isPaidUser ? (
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onRequestUpgrade}
              className="bg-amber-500 hover:bg-amber-600 text-white flex gap-2 px-4"
            >
              <Sparkles className="h-4 w-4" />
              Upgrade
            </Button>
          )}
        </form>

        {!isPaidUser && (
          <p className="text-xs text-muted-foreground mt-2">
            <Bot className="h-3 w-3 inline mr-1" />
            Upgrade to access AI-powered health assistant
          </p>
        )}
      </div>

      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              General Chat vs Symptom Checker
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="space-y-4 text-sm">
            <div>
              <p className="font-semibold text-foreground mb-2">🤖 General Chat - Use when:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>You have general health questions</li>
                <li>You need nutrition or fitness advice</li>
                <li>You want to learn about healthy habits</li>
                <li>You need explanations about medical terms</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-2">🩺 Symptom Checker - Use when:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>You're experiencing specific symptoms</li>
                <li>You need preliminary triage advice</li>
                <li>You want to assess urgency of care</li>
                <li>You need guidance on next steps</li>
              </ul>
            </div>

            <p className="text-muted-foreground italic pt-2">
              ⚠️ <strong>Important:</strong> Neither mode is a substitute for professional medical advice. Always consult a healthcare provider for diagnosis and treatment.
            </p>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatBot;
