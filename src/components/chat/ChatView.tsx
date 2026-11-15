import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  RotateCw,
  Glasses,
  Lightbulb,
  History,
  Sun,
  Moon,
  Sparkles,
  Plug,
  Mic,
  MicOff,
  ArrowUp,
  Square,
  X,
  FileText,
  Upload,
  HardDrive,
  Cloud,
  Radio,
  Zap,
} from 'lucide-react';
import { ModelInfo, ChatMessage, Conversation } from '../../types';
import { MessageList } from './MessageList';
import { ConnectorsSheetModal } from './ConnectorsSheetModal';
import { ModelPickerModal } from './ModelPickerModal';
import { ModelDetailsModal } from './ModelDetailsModal';
import { LiveConversationModal } from './LiveConversationModal';
import { triggerHaptic } from '../../utils/haptics';
import { apiUrl } from '../../utils/platform';
import { LiquidSpecularItem, AiProcessingCore } from '../common/LiquidGlassPrimitives';

interface ChatViewProps {
  selectedModel: ModelInfo;
  onSelectModel: (model: ModelInfo) => void;
  onNavigateToModels: () => void;
  onNavigateToAgents: () => void;
  onOpenUpgrade: () => void;
  userName?: string;
  onMessageSent?: (isImageRequest: boolean) => void;
  theme: 'light' | 'dark' | 'system';
  onToggleTheme: () => void;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  externalPrompt?: string | null;
  onClearExternalPrompt?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  selectedModel,
  onSelectModel,
  onNavigateToModels,
  onNavigateToAgents,
  onOpenUpgrade,
  userName = 'Member',
  onMessageSent,
  theme,
  onToggleTheme,
  sidebarOpen: externalSidebarOpen,
  onToggleSidebar,
  externalPrompt,
  onClearExternalPrompt,
}) => {
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(false);
  const isDrawerOpen = externalSidebarOpen !== undefined ? externalSidebarOpen : internalSidebarOpen;
  const toggleDrawer = onToggleSidebar || (() => setInternalSidebarOpen((prev) => !prev));

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'conv-init',
      title: 'New Conversation',
      modelId: selectedModel.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    },
    {
      id: 'conv-prior',
      title: 'Architecting high-concurrency microservices',
      modelId: 'opus-5',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
      messages: [],
    },
  ]);
  const [activeConvId, setActiveConvId] = useState<string>('conv-init');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSearch, setChatSearch] = useState('');
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<{ name: string; base64: string; mimeType: string }[]>([]);
  const [isListening, setIsListening] = useState(false);

  // Modals & States matching Video
  const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);
  const [isConnectorsSheetOpen, setIsConnectorsSheetOpen] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [tempChatToast, setTempChatToast] = useState(false);
  const [showSpecsDrawer, setShowSpecsDrawer] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [reasoningActive, setReasoningActive] = useState(false);
  const [conciseMode, setConciseMode] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);

  const CONCISE_SYSTEM_INSTRUCTION =
    'CONCISE SUMMARY MODE ENABLED: Provide direct, shorter, and highly optimized responses. Deliver the exact answer or key summary immediately in 1–3 crisp sentences or brief bullet points. Skip filler intros, disclaimers, and redundant context to maximize speed and clarity.';

  // Sync exchange from Live Voice & Vision session into current chat
  const handleSaveLiveExchange = (userMsg: ChatMessage, assistantMsg: ChatMessage) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConvId) {
          return {
            ...c,
            messages: [...c.messages, userMsg, assistantMsg],
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );
  };

  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const prevMsgCountRef = useRef(0);
  const scrollRafRef = useRef<number | null>(null);
  const resizeRafRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const activeConversation =
    conversations.find((c) => c.id === activeConvId) || conversations[0];

  const handleChatScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, []);

  // Reset scroll anchor when switching conversations
  useEffect(() => {
    isNearBottomRef.current = true;
    prevMsgCountRef.current = activeConversation?.messages.length || 0;
  }, [activeConvId]);

  // Smart RAF-throttled auto-scroll: smooth on new message send, instant snap during streaming without fighting user scroll
  const messagesRef = activeConversation?.messages;
  const msgCount = messagesRef?.length || 0;
  const lastMsgContentLen =
    msgCount > 0 ? messagesRef[msgCount - 1].content.length : 0;
  const isLastMsgStreaming =
    msgCount > 0 ? Boolean(messagesRef[msgCount - 1].isStreaming) : false;

  useEffect(() => {
    const countIncreased = msgCount > prevMsgCountRef.current;
    prevMsgCountRef.current = msgCount;

    if (!isNearBottomRef.current && !countIncreased) return;

    if (scrollRafRef.current !== null) {
      cancelAnimationFrame(scrollRafRef.current);
    }

    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const el = scrollContainerRef.current;
      if (!el) return;
      if (countIncreased && !isLastMsgStreaming) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      } else {
        el.scrollTop = el.scrollHeight;
      }
    });
  }, [msgCount, lastMsgContentLen, isLastMsgStreaming]);

  useEffect(() => {
    return () => {
      if (scrollRafRef.current !== null) cancelAnimationFrame(scrollRafRef.current);
      if (resizeRafRef.current !== null) cancelAnimationFrame(resizeRafRef.current);
    };
  }, []);

  // Auto-resize textarea cleanly inside requestAnimationFrame to prevent synchronous layout thrashing per keystroke
  useEffect(() => {
    if (resizeRafRef.current !== null) {
      cancelAnimationFrame(resizeRafRef.current);
    }
    resizeRafRef.current = requestAnimationFrame(() => {
      resizeRafRef.current = null;
      const el = textareaRef.current;
      if (!el) return;
      if (!input) {
        el.style.height = '';
        return;
      }
      el.style.height = 'auto';
      const nextHeight = `${Math.min(el.scrollHeight, 180)}px`;
      if (el.style.height !== nextHeight) {
        el.style.height = nextHeight;
      }
    });
  }, [input]);

  // Apply external prompt triggered via LiquidSearchOverlay
  useEffect(() => {
    if (externalPrompt) {
      setInput(externalPrompt);
      onClearExternalPrompt?.();
      setTimeout(() => textareaRef.current?.focus(), 60);
    }
  }, [externalPrompt, onClearExternalPrompt]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      setIsLiveModalOpen(true);
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleToggleTemporaryChat = () => {
    const nextState = !isTemporaryChat;
    setIsTemporaryChat(nextState);
    if (nextState) {
      setTempChatToast(true);
      setTimeout(() => setTempChatToast(false), 3500);
    }
  };

  const handleNewChat = () => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New Conversation',
      modelId: selectedModel.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    triggerHaptic('medium');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
      attachments: attachments.map((f) => ({
        name: f.name,
        type: f.mimeType,
        dataUrl: f.base64,
      })),
    };

    const assistantPlaceholderId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      model: selectedModel.name,
      isStreaming: true,
    };

    const currentText = input;
    const currentFiles = [...attachments];
    const isImageReq =
      currentText.trim().startsWith('/image') ||
      /^(generate|create|draw|make|render|paint|design|produce|show me)\s+(an?\s+)?(image|picture|photo|illustration|art|graphic|wallpaper|drawing|visual|portrait)\b/i.test(currentText.trim()) ||
      /^(image|picture|photo|illustration|drawing)\s+of\b/i.test(currentText.trim()) ||
      /^(can you|please)?\s*(generate|create|make|draw|render|paint)\s+(an?\s+)?(image|picture|photo|illustration|art)\b/i.test(currentText.trim()) ||
      /^(draw|paint)\s+(me\s+)?(a|an)?\b/i.test(currentText.trim());

    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    if (!isTemporaryChat) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? {
                ...c,
                title:
                  c.messages.length === 0
                    ? currentText.replace(/^\/image\s*/i, '').slice(0, 32) || 'Chat'
                    : c.title,
                messages: [...c.messages, userMessage, assistantMessage],
                updatedAt: new Date().toISOString(),
              }
            : c
        )
      );
    } else {
      // In temporary chat, show locally without persisting in title
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? {
                ...c,
                messages: [...c.messages, userMessage, assistantMessage],
              }
            : c
        )
      );
    }

    isNearBottomRef.current = true;
    setIsLoading(true);
    onMessageSent?.(isImageReq);
    abortControllerRef.current = new AbortController();

    let streamUpdateRaf: number | null = null;
    try {
      const response = await fetch(apiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel.id,
          messages: [...activeConversation.messages, userMessage],
          stream: true,
          reasoningActive,
          conciseMode,
          ...(conciseMode ? { systemInstruction: CONCISE_SYSTEM_INSTRUCTION } : {}),
          files: currentFiles,
          isImageRequest: isImageReq,
          aspectRatio: imageAspectRatio,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to get response`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let usedModel = selectedModel.name;
      let detectedImg: { url: string; prompt: string; revisedPrompt?: string } | undefined;
      let lineBuffer = '';
      const targetConvId = activeConvId;

      const flushStreamState = (isStreamingFlag: boolean) => {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === targetConvId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantPlaceholderId
                      ? {
                          ...m,
                          content: accumulated,
                          isStreaming: isStreamingFlag,
                          model: usedModel,
                          generatedImage: detectedImg || m.generatedImage,
                        }
                      : m
                  ),
                }
              : c
          )
        );
      };

      const scheduleStreamFlush = () => {
        if (streamUpdateRaf !== null) return;
        streamUpdateRaf = requestAnimationFrame(() => {
          streamUpdateRaf = null;
          flushStreamState(true);
        });
      };

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          lineBuffer += decoder.decode(value, { stream: true });
          const lines = lineBuffer.split('\n');
          lineBuffer = lines.pop() || '';

          let chunkHasUpdate = false;
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6).trim();
              if (dataStr === '[DONE]') break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.error) {
                  accumulated += `\n\n*Error: ${parsed.error}*`;
                  chunkHasUpdate = true;
                }
                if (parsed.model) {
                  usedModel = parsed.model;
                  chunkHasUpdate = true;
                }
                if (parsed.generatedImage) {
                  detectedImg = parsed.generatedImage;
                  chunkHasUpdate = true;
                }
                if (parsed.text) {
                  accumulated += parsed.text;
                  chunkHasUpdate = true;
                }
              } catch {
                // Ignore parse error on partial chunks
              }
            }
          }

          if (chunkHasUpdate) {
            scheduleStreamFlush();
          }
        }

        if (streamUpdateRaf !== null) {
          cancelAnimationFrame(streamUpdateRaf);
          streamUpdateRaf = null;
        }
        flushStreamState(false);
      }
    } catch (err: any) {
      if (streamUpdateRaf !== null) {
        cancelAnimationFrame(streamUpdateRaf);
        streamUpdateRaf = null;
      }
      if (err.name !== 'AbortError') {
        const fallbackText =
          err.message ||
          'Connection interrupted. Automate AI is ready to continue — please send your message again.';
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantPlaceholderId
                      ? {
                          ...m,
                          content:
                            m.content ||
                            `⚠️ **Automate AI Notice:** ${fallbackText}`,
                          isStreaming: false,
                        }
                      : m
                  ),
                }
              : c
          )
        );
      }
    } finally {
      // Finalize message streaming status
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantPlaceholderId
                    ? { ...m, isStreaming: false }
                    : m
                ),
              }
            : c
        )
      );
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const regenerateDepsRef = useRef({
    isLoading,
    activeConversation,
    activeConvId,
    selectedModel,
    reasoningActive,
    conciseMode,
    imageAspectRatio,
    onMessageSent,
  });
  regenerateDepsRef.current = {
    isLoading,
    activeConversation,
    activeConvId,
    selectedModel,
    reasoningActive,
    conciseMode,
    imageAspectRatio,
    onMessageSent,
  };

  const handleRegenerate = useCallback(async () => {
    const {
      isLoading: loadingNow,
      activeConversation: convNow,
      activeConvId: targetConvId,
      selectedModel: modelNow,
      reasoningActive: reasoningNow,
      conciseMode: conciseNow,
      imageAspectRatio: aspectNow,
      onMessageSent: notifySent,
    } = regenerateDepsRef.current;

    if (loadingNow || convNow.messages.length === 0) return;
    const msgs = [...convNow.messages];
    const lastUserIdx = msgs.reverse().findIndex((m) => m.role === 'user');
    if (lastUserIdx === -1) return;
    const actualIdx = convNow.messages.length - 1 - lastUserIdx;
    const lastUserMsg = convNow.messages[actualIdx];

    const assistantPlaceholderId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      model: modelNow.name,
      isStreaming: true,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetConvId
          ? { ...c, messages: [...c.messages.slice(0, actualIdx + 1), assistantMessage] }
          : c
      )
    );

    isNearBottomRef.current = true;
    setIsLoading(true);
    const isImage =
      lastUserMsg.content.trim().startsWith('/image') ||
      /^(generate|create|draw|make|render|paint|design)\s+(an?\s+)?(image|picture|photo|illustration|art|drawing)/i.test(
        lastUserMsg.content.trim()
      );
    notifySent?.(isImage);
    abortControllerRef.current = new AbortController();

    let streamUpdateRaf: number | null = null;
    try {
      const response = await fetch(apiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelNow.id,
          messages: convNow.messages.slice(0, actualIdx + 1),
          stream: true,
          reasoningActive: reasoningNow,
          conciseMode: conciseNow,
          ...(conciseNow ? { systemInstruction: CONCISE_SYSTEM_INSTRUCTION } : {}),
          files:
            lastUserMsg.attachments?.map((a) => ({
              name: a.name,
              mimeType: a.type,
              base64: a.dataUrl,
            })) || [],
          isImageRequest: isImage,
          aspectRatio: aspectNow,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('Regeneration failed');
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let usedModel = modelNow.name;
      let detectedImg: { url: string; prompt: string; revisedPrompt?: string } | undefined;
      let lineBuffer = '';

      const flushStreamState = (isStreamingFlag: boolean) => {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === targetConvId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantPlaceholderId
                      ? {
                          ...m,
                          content: accumulated,
                          isStreaming: isStreamingFlag,
                          model: usedModel,
                          generatedImage: detectedImg || m.generatedImage,
                        }
                      : m
                  ),
                }
              : c
          )
        );
      };

      const scheduleStreamFlush = () => {
        if (streamUpdateRaf !== null) return;
        streamUpdateRaf = requestAnimationFrame(() => {
          streamUpdateRaf = null;
          flushStreamState(true);
        });
      };

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          lineBuffer += decoder.decode(value, { stream: true });
          const lines = lineBuffer.split('\n');
          lineBuffer = lines.pop() || '';

          let chunkHasUpdate = false;
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6).trim();
              if (dataStr === '[DONE]') break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.model) {
                  usedModel = parsed.model;
                  chunkHasUpdate = true;
                }
                if (parsed.generatedImage) {
                  detectedImg = parsed.generatedImage;
                  chunkHasUpdate = true;
                }
                if (parsed.text) {
                  accumulated += parsed.text;
                  chunkHasUpdate = true;
                }
              } catch {}
            }
          }

          if (chunkHasUpdate) {
            scheduleStreamFlush();
          }
        }

        if (streamUpdateRaf !== null) {
          cancelAnimationFrame(streamUpdateRaf);
          streamUpdateRaf = null;
        }
        flushStreamState(false);
      }
    } catch (err: any) {
      if (streamUpdateRaf !== null) {
        cancelAnimationFrame(streamUpdateRaf);
        streamUpdateRaf = null;
      }
      if (err?.name !== 'AbortError') {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === targetConvId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantPlaceholderId
                      ? {
                          ...m,
                          content:
                            m.content ||
                            '⚠️ **Automate AI Notice:** Could not regenerate response. Please try again.',
                          isStreaming: false,
                        }
                      : m
                  ),
                }
              : c
          )
        );
      }
    } finally {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConvId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantPlaceholderId ? { ...m, isStreaming: false } : m
                ),
              }
            : c
        )
      );
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  const handleGenerateVariation = useCallback((prompt: string, aspectRatio: string = '1:1') => {
    setImageAspectRatio((aspectRatio as any) || '1:1');
    setInput(`/image ${prompt}`);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            base64: reader.result as string,
            mimeType: file.type || 'application/octet-stream',
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
    setShowAttachMenu(false);
  };

  return (
    <div
      className={`chat-reactive-shell flex-1 flex h-full w-full min-w-0 overflow-hidden bg-transparent text-slate-900 dark:text-slate-50 relative select-none ${
        isListening
          ? 'is-listening'
          : isLoading
          ? 'is-processing'
          : input.trim().length > 0
          ? 'is-typing'
          : ''
      }`}
    >
      {/* Voice & Typing Reactive Glowing Border Overlay */}
      <span aria-hidden="true" className="chat-reactive-border-glow" />

      {/* Temporary Chat Toast Notification */}
      <AnimatePresence>
        {tempChatToast && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, scale: 0.95, filter: 'blur(6px)' }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-40 liquid-glass-elevated text-slate-800 dark:text-slate-100 text-xs px-4 py-2 rounded-full flex items-center gap-2 max-w-[92vw]"
          >
            <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
            <span className="truncate">Your messages will not be saved and won't appear in your history.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Drawer Backdrop on Mobile */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm z-30 md:hidden"
            onClick={() => {
              if (onToggleSidebar) onToggleSidebar();
              else setInternalSidebarOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* History Drawer with iOS 27 Liquid Glass */}
      <AnimatePresence initial={false}>
        {isDrawerOpen && (
          <motion.aside
            initial={{ x: -272, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -272, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 520, damping: 38, mass: 0.5 }}
            className="fixed inset-y-2 left-2 w-72 rounded-[28px] md:inset-y-0 md:left-0 md:rounded-none md:relative md:w-64 z-40 liquid-glass-elevated md:bg-white/25 md:dark:bg-white/[0.03] md:border-0 md:border-r md:border-slate-900/10 md:dark:border-white/10 md:shadow-none flex flex-col shrink-0 transition-colors overflow-hidden"
          >
            <div className="p-3 border-b border-slate-900/10 dark:border-white/10 flex items-center justify-between gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => {
                  handleNewChat();
                  if (window.innerWidth < 768) toggleDrawer();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 liquid-glass-cta text-xs font-semibold py-2 px-3 rounded-full cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Chat</span>
              </motion.button>
              <button
                onClick={toggleDrawer}
                className="md:hidden w-8 h-8 rounded-full liquid-glass-orb flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 border-b border-slate-900/10 dark:border-white/10">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search history..."
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs liquid-glass-input rounded-full text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2.5 py-1">Recent Chats</div>
              {conversations
                .filter((c) => c.title.toLowerCase().includes(chatSearch.toLowerCase()))
                .map((conv) => {
                  const isActiveConv = activeConvId === conv.id;
                  return (
                    <motion.div
                      key={conv.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setActiveConvId(conv.id);
                        if (window.innerWidth < 768) toggleDrawer();
                      }}
                      className={`relative flex items-center justify-between px-3 py-2 rounded-2xl text-xs cursor-pointer group transition-colors ${
                        isActiveConv
                          ? 'text-violet-800 dark:text-white font-semibold'
                          : 'text-slate-600 dark:text-slate-300/80 hover:bg-white/40 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {isActiveConv && (
                        <motion.div
                          layoutId="chat-history-active-pill"
                          layout="position"
                          transition={{ type: 'spring', stiffness: 760, damping: 42, mass: 0.42 }}
                          className="absolute inset-0 rounded-2xl liquid-glass-droplet overflow-hidden"
                        >
                          <span className="absolute inset-x-2 top-0.5 h-1/2 rounded-xl bg-gradient-to-b from-white/50 to-transparent dark:from-white/22 pointer-events-none" />
                        </motion.div>
                      )}
                      <div className="relative z-10 flex items-center gap-2 truncate min-w-0">
                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActiveConv ? 'text-violet-600 dark:text-violet-300' : 'text-slate-400'}`} />
                        <span className="truncate">{conv.title}</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (conversations.length > 1) {
                            setConversations((prev) => prev.filter((c) => c.id !== conv.id));
                            if (activeConvId === conv.id) {
                              const remaining = conversations.filter((c) => c.id !== conv.id);
                              setActiveConvId(remaining[0].id);
                            }
                          }
                        }}
                        className="relative z-10 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 transition-opacity shrink-0 cursor-pointer"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </motion.div>
                  );
                })}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-transparent text-slate-900 dark:text-slate-50">
        {/* Scrollable Conversation or Pristine Center State */}
        <div
          ref={scrollContainerRef}
          onScroll={handleChatScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 min-w-0 chat-scroll-region"
        >
          {activeConversation.messages.length === 0 ? (
            /* Pristine Center State: min-h-full + my-auto centers on desktop and prevents top clipping on short mobile viewports */
            <div className="min-h-full w-full flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="my-auto flex flex-col items-center text-center max-w-xl w-full mx-auto py-3 sm:py-6 px-0.5"
              >
                {/* Model Logo Emblem inside Liquid Glass Squircle */}
                <div className="flex items-center justify-center mb-2.5 sm:mb-3.5">
                  {selectedModel.id === 'automate-x1' ? (
                    <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-[20px] sm:rounded-[26px] liquid-glass-orb flex items-center justify-center overflow-hidden">
                      <img
                        src="/assets/aistudio/Gemini_Generated_Image_ee5hycee5hycee5h_050d414c.png"
                        alt="Automate AI"
                        className="w-full h-full object-cover scale-[1.55] drop-shadow-md hover:scale-[1.62] transition-transform"
                      />
                    </div>
                  ) : selectedModel.id === 'opus-5' ? (
                    <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-[20px] sm:rounded-[26px] liquid-glass-orb flex items-center justify-center p-2.5 sm:p-3">
                      <svg viewBox="0 0 100 100" className="w-10 h-10 sm:w-14 sm:h-14 text-[#c86d51] dark:text-[#e07a5f] fill-current">
                        <path d="M50 15 C52 15 54 17 54 20 L54 35 C54 37 52 39 50 39 C48 39 46 37 46 35 L46 20 C46 17 48 15 50 15 Z" />
                        <path d="M50 61 C52 61 54 63 54 65 L54 80 C54 83 52 85 50 85 C48 85 46 83 46 80 L46 65 C46 63 48 61 50 61 Z" />
                        <path d="M15 50 C15 48 17 46 20 46 L35 46 C37 46 39 48 39 50 C39 52 37 54 35 54 L20 54 C17 54 15 52 15 50 Z" />
                        <path d="M61 50 C61 48 63 46 65 46 L80 46 C83 46 85 48 85 50 C85 52 83 54 80 54 L65 54 C63 54 61 52 61 50 Z" />
                        <path d="M25.25 25.25 C26.7 23.8 29 23.8 30.5 25.25 L41.1 35.85 C42.5 37.3 42.5 39.6 41.1 41.1 C39.6 42.5 37.3 42.5 35.85 41.1 L25.25 30.5 C23.8 29 23.8 26.7 25.25 25.25 Z" />
                        <path d="M58.9 58.9 C60.3 57.5 62.6 57.5 64.1 58.9 L74.75 69.5 C76.2 71 76.2 73.3 74.75 74.75 C73.3 76.2 71 76.2 69.5 74.75 L58.9 64.1 C57.5 62.6 57.5 60.3 58.9 58.9 Z" />
                        <path d="M74.75 25.25 C76.2 26.7 76.2 29 74.75 30.5 L64.1 41.1 C62.6 42.5 60.3 42.5 58.9 41.1 C57.5 39.6 57.5 37.3 58.9 35.85 L69.5 25.25 C71 23.8 73.3 23.8 74.75 25.25 Z" />
                        <path d="M41.1 58.9 C42.5 60.3 42.5 62.6 41.1 64.1 L30.5 74.75 C29 76.2 26.7 76.2 25.25 74.75 C23.8 73.3 23.8 71 25.25 69.5 L35.85 58.9 C37.3 57.5 39.6 57.5 41.1 58.9 Z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] sm:rounded-[24px] liquid-glass-orb flex items-center justify-center text-violet-600 dark:text-violet-300">
                      <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                  )}
                </div>

                {/* Model Title & Info Icon */}
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {selectedModel.name}
                  </h1>
                  <button
                    onClick={() => setShowSpecsDrawer(true)}
                    className="w-5 h-5 rounded-full liquid-glass-orb text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    title="Model specifications"
                  >
                    i
                  </button>
                </div>

                {/* Provider & Upvotes */}
                <div className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span>By {selectedModel.provider} &bull; 250.1K</span>
                  <span className="text-xs">👍</span>
                </div>

                {/* Model Description */}
                <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg mx-auto mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-none">
                  {selectedModel.description}
                </p>

                {/* Model Pricing */}
                <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full liquid-glass-subtle text-[11px] sm:text-xs text-slate-700 dark:text-slate-200 font-mono tabular-nums max-w-full">
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-slate-400">↳</span>
                    <span className="line-through text-slate-400 text-[10px] sm:text-[11px]">$6.02</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedModel.pricing.inputPer1M}/M</span>
                    <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold">30% off</span>
                  </div>
                  <span className="text-slate-300 dark:text-white/20 hidden sm:inline">|</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-slate-400">↳</span>
                    <span className="line-through text-slate-400 text-[10px] sm:text-[11px]">$30.12</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedModel.pricing.outputPer1M}/M</span>
                  </div>
                </div>

                {/* iOS 27 Squircle Liquid Glass Quick Starter Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full mt-4 sm:mt-6 text-left">
                  {[
                    {
                      title: 'Instant Answers',
                      desc: 'Fast, clear responses tailored to your exact question',
                      prompt: 'Summarize key architectural differences between REST, GraphQL, and gRPC in 5 crisp bullet points.',
                      icon: '✨',
                    },
                    {
                      title: 'System Architecture',
                      desc: 'Compare event-driven vs synchronous REST for high load',
                      prompt: 'What are the core trade-offs between Kafka and synchronous REST for a real-time analytics pipeline?',
                      icon: '⚡',
                    },
                    {
                      title: 'Full-Stack Code',
                      desc: 'Draft a clean TypeScript server route with error handling',
                      prompt: 'Write a robust TypeScript Express middleware for rate-limiting and request validation.',
                      icon: '💻',
                    },
                    {
                      title: 'Debug & Optimize',
                      desc: 'Identify bottlenecks and improve frontend & API speed',
                      prompt: 'How can I eliminate unnecessary React re-renders and reduce API response latency?',
                      icon: '🚀',
                    },
                  ].map((item, idx) => (
                    <motion.button
                      key={idx}
                      type="button"
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setInput(item.prompt);
                        if (textareaRef.current) {
                          textareaRef.current.focus();
                        }
                      }}
                      className="p-2.5 sm:p-3.5 rounded-[18px] sm:rounded-[24px] liquid-glass-card liquid-glass-float group text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 mb-0.5 sm:mb-1">
                        <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl liquid-glass-orb flex items-center justify-center text-xs sm:text-sm shrink-0">
                          {item.icon}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors truncate">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300/80 line-clamp-1 pl-8 sm:pl-9">
                        {item.desc}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-3xl w-full mx-auto py-4 sm:py-6">
              <MessageList
                key={activeConvId}
                messages={activeConversation.messages}
                onRegenerate={handleRegenerate}
                onGenerateVariation={handleGenerateVariation}
                isLoading={isLoading}
              />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Liquid Glass Composer Area */}
        <div className="w-full max-w-[770px] mx-auto px-3 sm:px-4 pb-3 sm:pb-4 pt-1 relative">
          {/* Prompt Suggestions Bar with Smooth Backdrop-Blur Transition */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: 8, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: 6, filter: 'blur(6px)' }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-2 overflow-x-auto pb-2 mb-1 scrollbar-none text-xs"
              >
                {[
                  { label: 'Explain microservices architecture', icon: '⚡' },
                  { label: 'Draft a clean REST API in Express', icon: '💻' },
                  { label: 'Explain quantum computing simply', icon: '💡' },
                  { label: 'Debug React re-rendering issue', icon: '🔍' },
                  { label: 'Compare DeepSeek V4 vs Claude Opus', icon: '📊' },
                  { label: 'Design a high-converting SaaS landing page', icon: '🎨' },
                ].map((s) => (
                  <motion.button
                    key={s.label}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setInput(s.label);
                      setShowSuggestions(false);
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-full liquid-glass-orb text-slate-700 dark:text-slate-200 hover:text-violet-700 dark:hover:text-violet-300 flex items-center gap-1.5 transition-colors duration-150 text-xs cursor-pointer"
                  >
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top Bar above composer */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-2 px-0.5 sm:px-1 text-xs min-w-0">
            {/* Left: Model chip + reload icon + optional reasoning/summary badge */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModelPickerOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full liquid-glass-orb text-slate-800 dark:text-slate-100 transition-colors duration-150 group min-w-0 cursor-pointer"
                title="Switch model"
              >
                <span className="text-violet-600 dark:text-violet-300 text-xs font-bold shrink-0">✱</span>
                <span className="font-semibold truncate max-w-[140px] sm:max-w-none">{selectedModel.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              </motion.button>

              <AnimatePresence>
                {reasoningActive && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full liquid-glass-droplet text-violet-700 dark:text-violet-200 text-[10px] font-semibold shrink-0"
                  >
                    <Glasses className="w-3 h-3 text-violet-600 dark:text-violet-300" />
                    <span>Thinking: XHigh</span>
                  </motion.span>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {conciseMode && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full liquid-glass-droplet text-emerald-700 dark:text-emerald-200 text-[10px] font-semibold shrink-0"
                  >
                    <Zap className="w-3 h-3 text-emerald-600 dark:text-emerald-300 fill-current" />
                    <span>Summary · Fast</span>
                  </motion.span>
                )}
              </AnimatePresence>

              <motion.button
                whileTap={{ scale: 0.88, rotate: 90 }}
                onClick={() => {
                  setInput('');
                  setAttachments([]);
                }}
                className="w-7 h-7 rounded-full liquid-glass-orb text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                title="Clear input"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </motion.button>
            </div>

            {/* Right: Glasses, Ghost, Lightbulb, History (Theme toggle only on sm+ since TopBar already has it on mobile) */}
            <div className="flex items-center gap-1 sm:gap-1.5 text-slate-500 dark:text-slate-300 shrink-0">
              <motion.button
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.88 }}
                onClick={() => setReasoningActive(!reasoningActive)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-150 cursor-pointer ${
                  reasoningActive
                    ? 'liquid-glass-droplet text-violet-700 dark:text-violet-200'
                    : 'liquid-glass-orb hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Toggle Reasoning / Deep Thinking mode"
              >
                <Glasses className="w-3.5 h-3.5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.88 }}
                onClick={handleToggleTemporaryChat}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-150 cursor-pointer ${
                  isTemporaryChat
                    ? 'liquid-glass-droplet text-violet-700 dark:text-violet-200'
                    : 'liquid-glass-orb hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Temporary Chat (Messages will not be saved)"
              >
                <span className="text-xs">👻</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.88 }}
                onClick={() => setShowSuggestions(!showSuggestions)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-150 cursor-pointer ${
                  showSuggestions
                    ? 'liquid-glass-droplet text-violet-700 dark:text-violet-200'
                    : 'liquid-glass-orb hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Prompt Suggestions"
              >
                <Lightbulb className="w-3.5 h-3.5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.88 }}
                onClick={toggleDrawer}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-150 cursor-pointer ${
                  isDrawerOpen
                    ? 'liquid-glass-droplet text-violet-700 dark:text-violet-200'
                    : 'liquid-glass-orb hover:text-slate-900 dark:hover:text-white'
                }`}
                title="History"
              >
                <History className="w-3.5 h-3.5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.88 }}
                onClick={onToggleTheme}
                className="hidden sm:flex w-7 h-7 rounded-full liquid-glass-orb hover:text-slate-900 dark:hover:text-white items-center justify-center transition-colors cursor-pointer"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-violet-600" />}
              </motion.button>
            </div>
          </div>

          {/* Attachment Popover Menu (Morphing Liquid Glass Card with Smooth Blur Transition) */}
          <AnimatePresence>
            {showAttachMenu && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.92, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: 8, scale: 0.94, filter: 'blur(8px)' }}
                transition={{ type: 'spring', stiffness: 660, damping: 34, mass: 0.45 }}
                style={{ transformOrigin: 'bottom left' }}
                className="absolute bottom-24 left-3 sm:left-4 z-40 liquid-glass-elevated text-slate-900 dark:text-white rounded-[26px] p-2.5 w-72 max-w-[calc(100vw-1.5rem)]"
              >
                <div className="space-y-1 text-xs">
                  <div className="p-2.5 rounded-2xl hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors flex items-center justify-between cursor-not-allowed opacity-75">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <HardDrive className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold">Google Drive</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Facing error from Google side.</p>
                      </div>
                    </div>
                    <span className="text-[9px] liquid-glass-subtle px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300 shrink-0">
                      Coming soon
                    </span>
                  </div>

                  <LiquidSpecularItem
                    onClick={() => {
                      triggerHaptic('selection');
                      setIsConnectorsSheetOpen(true);
                      setShowAttachMenu(false);
                    }}
                    className="p-2.5 rounded-2xl hover:bg-white/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Cloud className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold">Microsoft 365</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Connect your Microsoft 365 files</p>
                      </div>
                    </div>
                  </LiquidSpecularItem>

                  <LiquidSpecularItem
                    onClick={() => {
                      triggerHaptic('selection');
                      fileInputRef.current?.click();
                    }}
                    className="p-2.5 rounded-2xl hover:bg-white/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Upload className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold">From this device</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Images, PDFs, documents, MP3, and MP4</p>
                      </div>
                    </div>
                  </LiquidSpecularItem>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* iOS 27 Rounded Liquid Glass Composer Dock with Voice/Typing Reactive Glowing Border */}
          <div
            className={`liquid-glass-elevated composer-reactive-dock rounded-[28px] p-2.5 sm:p-3.5 relative ${
              isListening
                ? 'is-listening'
                : isLoading
                ? 'is-processing'
                : input.trim().length > 0
                ? 'is-typing'
                : ''
            }`}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/35 to-transparent"
            />
            {(isListening || isLoading) && (
              <div className="flex items-center justify-between px-1 pb-1.5">
                <AiProcessingCore
                  compact
                  label={isListening ? 'Listening to voice' : 'Processing query'}
                />
              </div>
            )}
            {/* Attachment Previews */}
            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2 mb-2 p-2 liquid-glass-subtle rounded-2xl"
                >
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 liquid-glass-orb px-2.5 py-1 rounded-full text-xs text-slate-800 dark:text-slate-100"
                    >
                      <FileText className="w-3 h-3 text-violet-600 dark:text-violet-300" />
                      <span className="max-w-[120px] truncate text-[11px]">{file.name}</span>
                      <button
                        onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="What can I do for you today?"
              rows={2}
              className="w-full bg-transparent resize-none border-0 text-slate-900 dark:text-white text-sm focus:outline-none placeholder:text-slate-500/80 dark:placeholder:text-slate-400/70 py-1 px-1 leading-relaxed max-h-[180px]"
            />

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Bottom Row (Clean & Minimal: Attach, Connectors, Single Live Trigger, Concise Mode, Mic/Send) */}
            <div className="flex items-center justify-between pt-1.5 gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-300 overflow-x-auto scrollbar-none py-0.5 min-w-0 flex-1">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                    showAttachMenu
                      ? 'liquid-glass-droplet text-violet-700 dark:text-white'
                      : 'liquid-glass-orb hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Attach"
                >
                  <motion.span
                    animate={{ rotate: showAttachMenu ? 45 : 0 }}
                    transition={{ type: 'spring', stiffness: 700, damping: 34 }}
                    className="flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => setIsConnectorsSheetOpen(true)}
                  className="w-8 h-8 rounded-full liquid-glass-orb flex items-center justify-center hover:text-slate-900 dark:hover:text-white transition-colors shrink-0 cursor-pointer"
                  title="Connectors & Tools"
                >
                  <Plug className="w-3.5 h-3.5" />
                </motion.button>

                {/* Single Live Voice & Camera Trigger */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setIsLiveModalOpen(true)}
                  className="h-8 px-2.5 sm:px-3 rounded-full liquid-glass-droplet text-violet-700 dark:text-violet-200 text-[11px] font-semibold flex items-center gap-1 sm:gap-1.5 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                  title="Start Live Voice & Vision session"
                >
                  <Radio className="w-3 h-3 text-violet-600 dark:text-violet-300 animate-pulse shrink-0" />
                  <span className="hidden sm:inline whitespace-nowrap">Live Voice & Camera</span>
                  <span className="sm:hidden whitespace-nowrap">Live</span>
                </motion.button>

                {/* Summary / Conciseness Toggle */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  aria-pressed={conciseMode}
                  aria-label="Toggle summary and conciseness mode"
                  onClick={() => setConciseMode((prev) => !prev)}
                  className={`h-8 px-2.5 sm:px-3 rounded-full text-[11px] font-semibold flex items-center gap-1 sm:gap-1.5 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    conciseMode
                      ? 'liquid-glass-droplet text-emerald-700 dark:text-emerald-200 ring-1 ring-emerald-400/40'
                      : 'liquid-glass-orb text-slate-600 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300'
                  }`}
                  title={
                    conciseMode
                      ? 'Summary Mode ON — Shorter, direct answers for faster replies'
                      : 'Enable Summary / Concise Mode for shorter, faster answers'
                  }
                >
                  <Zap
                    className={`w-3 h-3 shrink-0 ${
                      conciseMode
                        ? 'text-emerald-500 dark:text-emerald-300 fill-current'
                        : 'text-amber-500 dark:text-amber-300'
                    }`}
                  />
                  <span className="whitespace-nowrap">Concise</span>
                </motion.button>
              </div>

              {/* Mic / Send Crystal Orb */}
              <div className="shrink-0 flex items-center">
                {isLoading ? (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      abortControllerRef.current?.abort();
                      setIsLoading(false);
                    }}
                    className="w-9 h-9 rounded-full liquid-glass-orb text-slate-900 dark:text-white flex items-center justify-center cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </motion.button>
                ) : input.trim() || attachments.length > 0 ? (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.06 }}
                    onClick={handleSendMessage}
                    className="w-9 h-9 rounded-full liquid-glass-cta flex items-center justify-center cursor-pointer"
                  >
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={toggleVoice}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-150 cursor-pointer ${
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/40'
                        : 'liquid-glass-orb text-slate-700 dark:text-white'
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </motion.button>
                )}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-2 font-normal">
            Automate AI can make mistakes.
          </p>
        </div>
      </div>

      {/* Model Picker Modal matching Video 00:20 */}
      <ModelPickerModal
        isOpen={isModelPickerOpen}
        onClose={() => setIsModelPickerOpen(false)}
        selectedModel={selectedModel}
        onSelectModel={onSelectModel}
        onNavigateToModels={onNavigateToModels}
        onNavigateToAgents={onNavigateToAgents}
        onOpenUpgrade={onOpenUpgrade}
      />

      {/* Connectors Sheet Modal matching Video 00:08 */}
      <ConnectorsSheetModal
        isOpen={isConnectorsSheetOpen}
        onClose={() => setIsConnectorsSheetOpen(false)}
      />

      {/* Model Details & Specifications Sheet matching Screenshot 1 & Video */}
      <ModelDetailsModal
        isOpen={showSpecsDrawer}
        onClose={() => setShowSpecsDrawer(false)}
        model={selectedModel}
        onSelectForChat={onSelectModel}
      />

      {/* ChatGPT Voice & Gemini Live Camera Multimodal Conversation Modal */}
      <LiveConversationModal
        isOpen={isLiveModalOpen}
        onClose={() => setIsLiveModalOpen(false)}
        onSaveExchange={handleSaveLiveExchange}
        theme={theme}
        activeModelName={selectedModel.name}
      />
    </div>
  );
};
