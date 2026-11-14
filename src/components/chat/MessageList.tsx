import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  RotateCw,
  Volume2,
  VolumeX,
  User,
  FileText,
  Download,
  Maximize2,
  X,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Info,
  Camera,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage } from '../../types';
import { apiUrl } from '../../utils/platform';

interface MessageListProps {
  messages: ChatMessage[];
  onRegenerate?: () => void;
  onGenerateVariation?: (prompt: string, aspectRatio?: string) => void;
  isLoading?: boolean;
}

// -------------------------------------------------------------
// Realistic Typewriter & Markdown Renderer with Framer Motion
// -------------------------------------------------------------
interface TypewriterMarkdownProps {
  content: string;
  isStreaming?: boolean;
  messageId: string;
  copiedId: string | null;
  onCopy: (id: string, text: string) => void;
  onZoomImage: (image: { url: string; prompt: string; revisedPrompt?: string; dimensions?: string; seed?: number }) => void;
  onDownloadImage: (url: string, filename: string) => void;
  onVaryImage: (msgId: string, prompt: string, aspectRatio?: string) => void;
  varyingImageId: string | null;
}

const TypewriterMarkdown: React.FC<TypewriterMarkdownProps> = ({
  content,
  isStreaming,
  messageId,
  copiedId,
  onCopy,
  onZoomImage,
  onDownloadImage,
  onVaryImage,
  varyingImageId,
}) => {
  // Instant token streaming like ChatGPT and Claude with zero artificial lag
  const visibleText = content;

  // Waiting for first token state: classic ChatGPT 3-dot thinking pulse
  if (!visibleText && isStreaming) {
    return (
      <div className="flex items-center gap-1.5 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -6, 0], opacity: [0.35, 1, 0.35] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.16,
              ease: 'easeInOut',
            }}
            className="w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400"
          />
        ))}
      </div>
    );
  }

  // Parse inline markdown: bold, italic, code
  const parseInlineMarkdown = (text: string) => {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((chunk, i) => {
      if (chunk.startsWith('`') && chunk.endsWith('`')) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded-md liquid-glass-subtle text-violet-700 dark:text-violet-300 font-mono text-[13px]"
          >
            {chunk.slice(1, -1)}
          </code>
        );
      }
      if (chunk.startsWith('**') && chunk.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-gray-900 dark:text-white">
            {chunk.slice(2, -2)}
          </strong>
        );
      }
      if (chunk.startsWith('*') && chunk.endsWith('*')) {
        return (
          <em key={i} className="italic text-gray-700 dark:text-gray-300">
            {chunk.slice(1, -1)}
          </em>
        );
      }
      return chunk;
    });
  };

  // Render paragraphs, headings, lists, blockquotes, and markdown images
  const renderTextSegment = (text: string, isLastSegment: boolean) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];

      // Markdown Image: ![alt](url)
      const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        const alt = imgMatch[1] || 'Automate AI Generated Image';
        const src = imgMatch[2];

        elements.push(
          <motion.div
            key={`img-${idx}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="my-5 rounded-[24px] overflow-hidden liquid-glass-card group"
          >
            {/* Image Canvas with Glass Overlay */}
            <div className="relative aspect-auto max-h-[500px] overflow-hidden bg-black/20 flex items-center justify-center">
              <img
                src={src}
                alt={alt}
                loading="eager"
                className="w-full h-auto max-h-[500px] object-cover cursor-pointer transition-transform duration-500 group-hover:scale-[1.01]"
                onClick={() => onZoomImage({ url: src, prompt: alt })}
              />

              {/* Hover Action Controls */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-between p-4">
                <span className="text-xs text-white/95 font-medium truncate max-w-[65%] drop-shadow-md">
                  {alt}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onZoomImage({ url: src, prompt: alt })}
                    className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/25 flex items-center justify-center transition-colors cursor-pointer"
                    title="Fullscreen zoom"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onVaryImage(`vary-${idx}`, alt)}
                    disabled={varyingImageId === `vary-${idx}`}
                    className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-medium backdrop-blur-md border border-white/25 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Generate new variation"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${varyingImageId === `vary-${idx}` ? 'animate-spin' : ''}`} />
                    <span>Variation</span>
                  </button>
                  <button
                    onClick={() => onDownloadImage(src, `${alt.replace(/\s+/g, '-').slice(0, 30)}.jpg`)}
                    className="px-3.5 py-1.5 rounded-full liquid-glass-cta text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                    title="Download image"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quiet Glass Footer */}
            <div className="px-4 py-2.5 liquid-glass-subtle border-t border-slate-900/10 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="truncate max-w-[70%] text-[11px] italic">"{alt}"</span>
              <button
                onClick={() => onCopy(`img-url-${idx}`, src)}
                className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
              >
                {copiedId === `img-url-${idx}` ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500 font-medium">Copied link</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Copy link</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        );
        continue;
      }

      // Headings
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={idx} className="text-base font-bold text-gray-900 dark:text-white mt-4 mb-1.5">
            {parseInlineMarkdown(line.slice(4))}
          </h3>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={idx} className="text-lg font-bold text-gray-900 dark:text-white mt-5 mb-2 border-b border-gray-100 dark:border-white/5 pb-1">
            {parseInlineMarkdown(line.slice(3))}
          </h2>
        );
      } else if (line.startsWith('# ')) {
        elements.push(
          <h1 key={idx} className="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-2.5">
            {parseInlineMarkdown(line.slice(2))}
          </h1>
        );
      } else if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={idx} className="border-l-2 border-violet-500 pl-3.5 py-1.5 my-2.5 text-slate-700 dark:text-slate-200 italic liquid-glass-subtle rounded-r-xl text-[14px]">
            {parseInlineMarkdown(line.slice(2))}
          </blockquote>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <div key={idx} className="flex items-start gap-2.5 my-1 text-[14.5px] text-gray-800 dark:text-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2.5 shrink-0" />
            <div className="flex-1">{parseInlineMarkdown(line.slice(2))}</div>
          </div>
        );
      } else if (/^\d+\.\s/.test(line)) {
        const num = line.match(/^(\d+)\.\s/)?.[1] || '1';
        const rest = line.replace(/^\d+\.\s/, '');
        elements.push(
          <div key={idx} className="flex items-start gap-2 my-1 text-[14.5px] text-gray-800 dark:text-gray-200">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 mt-0.5 shrink-0 min-w-[18px]">
              {num}.
            </span>
            <div className="flex-1">{parseInlineMarkdown(rest)}</div>
          </div>
        );
      } else if (line.trim() === '---' || line.trim() === '***') {
        elements.push(<hr key={idx} className="my-4 border-gray-200 dark:border-white/10" />);
      } else if (line.trim() === '') {
        elements.push(<div key={idx} className="h-2" />);
      } else {
        const isVeryLastLine = isLastSegment && idx === lines.length - 1;
        elements.push(
          <p key={idx} className="text-[14.5px] text-gray-800 dark:text-gray-200 leading-[1.7] my-0.5">
            {parseInlineMarkdown(line)}
            {/* Realistic Blinking Caret Cursor at Tail */}
            {isVeryLastLine && isStreaming && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-block w-[3px] h-[17px] bg-purple-600 dark:bg-purple-400 ml-1 rounded-full align-middle shadow-[0_0_8px_rgba(168,85,247,0.6)]"
              />
            )}
          </p>
        );
      }
    }

    return elements;
  };

  // Split code blocks from regular prose
  const parts = visibleText.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-1">
      {parts.map((part, index) => {
        const isLastPart = index === parts.length - 1;

        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          const lang = lines[0].match(/^[a-zA-Z0-9_-]+$/) ? lines[0] : '';
          const code = lang ? lines.slice(1).join('\n') : lines.join('\n');

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="my-3.5 rounded-[20px] overflow-hidden border border-slate-900/15 dark:border-white/15 bg-slate-900/92 dark:bg-[#0b0c18]/88 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_12px_32px_-10px_rgba(15,23,42,0.35)] font-mono text-xs"
            >
              <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10 text-slate-300">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-300">
                  {lang || 'CODE'}
                </span>
                <button
                  onClick={() => onCopy(`code-${index}`, code)}
                  className="hover:text-white flex items-center gap-1.5 text-[11px] transition-colors py-1 px-2.5 rounded-full hover:bg-white/10 cursor-pointer"
                >
                  {copiedId === `code-${index}` ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-slate-100 leading-relaxed font-mono text-[13px]">
                <code>{code}</code>
              </pre>
            </motion.div>
          );
        }

        return <div key={index}>{renderTextSegment(part, isLastPart)}</div>;
      })}
    </div>
  );
};

// -------------------------------------------------------------
// Main MessageList Component (Clean, Classic, Professional)
// -------------------------------------------------------------
export const MessageList: React.FC<MessageListProps> = ({
  messages,
  onRegenerate,
  onGenerateVariation,
  isLoading,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [thumbsMap, setThumbsMap] = useState<Record<string, 'up' | 'down'>>({});
  const [zoomImageUrl, setZoomImageUrl] = useState<{
    url: string;
    prompt: string;
    revisedPrompt?: string;
    dimensions?: string;
    seed?: number;
  } | null>(null);
  const [showMetadataMap, setShowMetadataMap] = useState<Record<string, boolean>>({});
  const [showThoughtMap, setShowThoughtMap] = useState<Record<string, boolean>>({});
  const [varyingImageId, setVaryingImageId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/[*#`_\[\]]/g, '')
      .trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleDownloadImage = async (url: string, filename: string = 'automate-ai-creation.jpg') => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const toggleThumb = (msgId: string, type: 'up' | 'down') => {
    setThumbsMap((prev) => ({
      ...prev,
      [msgId]: prev[msgId] === type ? undefined! : type,
    }));
  };

  const handleVary = async (msgId: string, prompt: string, aspectRatio?: string) => {
    if (varyingImageId) return;
    setVaryingImageId(msgId);
    try {
      if (onGenerateVariation) {
        onGenerateVariation(prompt, aspectRatio);
      } else {
        const res = await fetch(apiUrl('/api/generate-image'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, aspectRatio }),
        });
        const data = await res.json();
        if (data.imageUrl) {
          const a = document.createElement('a');
          a.href = data.imageUrl;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }
    } finally {
      setTimeout(() => setVaryingImageId(null), 1000);
    }
  };

  const seenIdsRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    seenIdsRef.current = new Set(messages.map((m) => m.id));
  }, [messages]);

  const newMessageIds = messages
    .filter((m) => !seenIdsRef.current.has(m.id))
    .map((m) => m.id);

  const messageBubbleVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: (batchIndex: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.24,
        delay: Math.min(Math.max(batchIndex, 0) * 0.045, 0.28),
        ease: [0.22, 1, 0.36, 1] as const,
      },
    }),
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-6 overflow-x-hidden min-w-0">
      <AnimatePresence initial={true}>
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const thumb = thumbsMap[message.id];
          const isSpeaking = speakingId === message.id;
          const showMeta = showMetadataMap[message.id];
          const showThought = showThoughtMap[message.id];
          const batchIndex = newMessageIds.indexOf(message.id);

          return (
            <motion.div
              key={message.id}
              custom={batchIndex === -1 ? 0 : batchIndex}
              variants={messageBubbleVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -6, transition: { duration: 0.16 } }}
              className={`flex gap-2.5 sm:gap-3.5 min-w-0 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
            {/* Assistant Avatar */}
            {!isUser && (
              <div className="w-8 h-8 rounded-2xl liquid-glass-orb p-1.5 flex items-center justify-center shrink-0 mt-1 overflow-hidden">
                <img
                  src="/assets/aistudio/automate_ai_logo_transparent.png"
                  alt="Automate AI"
                  className="w-full h-full object-contain drop-shadow-2xs"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Bubble & Response Container */}
            <div className={`flex flex-col max-w-[88%] sm:max-w-[85%] min-w-0 ${isUser ? 'items-end' : 'items-start w-full'}`}>
              {/* User Liquid Glass Bubble */}
              {isUser ? (
                <div className="liquid-glass-bubble-user text-white rounded-[22px] rounded-tr-sm px-3.5 sm:px-4 py-2.5 sm:py-3 text-[14px] sm:text-[14.5px] leading-relaxed break-words max-w-full">
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2.5">
                      {message.attachments.map((att, i) => (
                        <div key={i} className="flex flex-col gap-1">
                          {(att.mimeType || att.type)?.startsWith('image/') ? (
                            <div className="rounded-xl overflow-hidden border border-white/25 max-w-[200px] shadow-xs">
                              <img
                                src={att.dataUrl || att.base64 || ''}
                                alt={att.name}
                                className="w-full h-24 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                onClick={() =>
                                  setZoomImageUrl({
                                    url: att.dataUrl || att.base64 || '',
                                    prompt: att.name,
                                  })
                                }
                              />
                              <div className="bg-black/40 px-2 py-0.5 text-[10px] text-white/90 truncate flex items-center gap-1">
                                <Camera className="w-2.5 h-2.5" />
                                <span className="truncate">{att.name}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-white/20 px-2.5 py-0.5 rounded-full text-xs backdrop-blur-xs font-medium">
                              <FileText className="w-3 h-3" />
                              <span className="max-w-[130px] truncate">{att.name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              ) : (
                /* Assistant Content inside Subtle Liquid Glass Card */
                <div className="w-full liquid-glass-card rounded-[24px] p-4 sm:p-5 text-slate-800 dark:text-slate-100">
                  {/* Clean Unboxed Metadata Header */}
                  <div className="flex items-center justify-between mb-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {message.model || 'Automate-X1'}
                      </span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-white/25">·</span>
                      <span className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                        {new Date(message.timestamp || Date.now()).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {message.isStreaming && (
                      <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-300 font-medium text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-ping" />
                        <span>Generating</span>
                      </div>
                    )}
                  </div>

                  {/* Optional Thought Process Drawer */}
                  {message.thoughtProcess && (
                    <div className="mb-3 rounded-2xl liquid-glass-subtle overflow-hidden">
                      <button
                        onClick={() =>
                          setShowThoughtMap((prev) => ({
                            ...prev,
                            [message.id]: !prev[message.id],
                          }))
                        }
                        className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                          <span>Thought process</span>
                        </div>
                        {showThought ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                      <AnimatePresence>
                        {showThought && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-3.5 pb-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-mono whitespace-pre-wrap border-t border-slate-900/10 dark:border-white/10 pt-2"
                          >
                            {message.thoughtProcess}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Structured Image Card (if present) */}
                  {message.generatedImage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="my-4 rounded-[22px] overflow-hidden liquid-glass-card group"
                    >
                      <div className="relative aspect-auto max-h-[500px] overflow-hidden bg-black/30 flex items-center justify-center">
                        <img
                          src={message.generatedImage.url}
                          alt={message.generatedImage.prompt}
                          loading="eager"
                          className="w-full h-auto max-h-[500px] object-cover transition-transform duration-500 group-hover:scale-[1.01] cursor-pointer"
                          onClick={() =>
                            setZoomImageUrl({
                              url: message.generatedImage!.url,
                              prompt: message.generatedImage!.prompt,
                              revisedPrompt: message.generatedImage!.revisedPrompt,
                              dimensions: message.generatedImage!.dimensions,
                              seed: message.generatedImage!.seed,
                            })
                          }
                        />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-between p-4">
                          <span className="text-xs text-white/95 font-medium truncate max-w-[60%] drop-shadow-md">
                            {message.generatedImage.prompt}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                setZoomImageUrl({
                                  url: message.generatedImage!.url,
                                  prompt: message.generatedImage!.prompt,
                                  revisedPrompt: message.generatedImage!.revisedPrompt,
                                  dimensions: message.generatedImage!.dimensions,
                                  seed: message.generatedImage!.seed,
                                })
                              }
                              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/25 flex items-center justify-center transition-colors cursor-pointer"
                              title="Fullscreen zoom"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleVary(
                                  message.id,
                                  message.generatedImage!.prompt,
                                  message.generatedImage!.aspectRatio
                                )
                              }
                              disabled={varyingImageId === message.id}
                              className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-medium backdrop-blur-md border border-white/25 flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Generate variation"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${varyingImageId === message.id ? 'animate-spin' : ''}`} />
                              <span>Variation</span>
                            </button>
                            <button
                              onClick={() =>
                                handleDownloadImage(
                                  message.generatedImage!.url,
                                  `${message.generatedImage!.prompt.slice(0, 25)}.jpg`
                                )
                              }
                              className="px-3.5 py-1.5 rounded-full liquid-glass-cta text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Info footer */}
                      <div className="px-4 py-2.5 liquid-glass-subtle border-t border-slate-900/10 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="text-violet-600 dark:text-violet-300 font-semibold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-violet-500" />
                            FLUX.1 Realism HD
                          </span>
                          <span aria-hidden="true" className="text-slate-300 dark:text-white/25">·</span>
                          <span className="font-mono tabular-nums text-[11px]">{message.generatedImage.dimensions || '1024×1024'}</span>
                        </div>
                        <button
                          onClick={() =>
                            setShowMetadataMap((prev) => ({
                              ...prev,
                              [message.id]: !prev[message.id],
                            }))
                          }
                          className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>
                      </div>

                      {/* Expandable Image Details */}
                      <AnimatePresence>
                        {showMeta && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="p-3.5 liquid-glass-subtle border-t border-slate-900/10 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 space-y-1.5"
                          >
                            <p className="font-semibold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider">
                              Prompt
                            </p>
                            <p className="italic text-slate-700 dark:text-slate-300 leading-relaxed">
                              {message.generatedImage.revisedPrompt || message.generatedImage.prompt}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {/* Body */}
                  <TypewriterMarkdown
                    content={message.content}
                    isStreaming={message.isStreaming}
                    messageId={message.id}
                    copiedId={copiedId}
                    onCopy={handleCopy}
                    onZoomImage={setZoomImageUrl}
                    onDownloadImage={handleDownloadImage}
                    onVaryImage={handleVary}
                    varyingImageId={varyingImageId}
                  />

                  {/* Bottom Liquid Glass Orb Action Bar */}
                  <div className="flex items-center justify-between pt-3 mt-2.5 border-t border-slate-900/5 dark:border-white/10 text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={() => handleCopy(message.id, message.content)}
                        className="w-7 h-7 rounded-full liquid-glass-orb flex items-center justify-center hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                        title="Copy text"
                      >
                        {copiedId === message.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={() => handleSpeak(message.id, message.content)}
                        className={`h-7 px-2 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer ${
                          isSpeaking
                            ? 'liquid-glass-droplet text-violet-700 dark:text-violet-200'
                            : 'liquid-glass-orb hover:text-slate-900 dark:hover:text-white'
                        }`}
                        title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                      >
                        {isSpeaking ? (
                          <>
                            <div className="flex items-center gap-0.5 h-3">
                              <span className="w-1 h-3 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                              <span className="w-1 h-2 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                              <span className="w-1 h-2.5 bg-violet-500 rounded-full animate-bounce" />
                            </div>
                            <span className="text-[11px] font-medium hidden sm:inline">Playing</span>
                          </>
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </motion.button>

                      {onRegenerate && (
                        <motion.button
                          whileTap={{ scale: 0.88, rotate: 90 }}
                          onClick={onRegenerate}
                          disabled={isLoading}
                          className="w-7 h-7 rounded-full liquid-glass-orb flex items-center justify-center hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
                          title="Regenerate response"
                        >
                          <RotateCw
                            className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-violet-500' : ''}`}
                          />
                        </motion.button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={() => toggleThumb(message.id, 'up')}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                          thumb === 'up'
                            ? 'liquid-glass-droplet text-emerald-500'
                            : 'liquid-glass-orb hover:text-slate-900 dark:hover:text-white'
                        }`}
                        title="Good response"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={() => toggleThumb(message.id, 'down')}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                          thumb === 'down'
                            ? 'liquid-glass-droplet text-rose-500'
                            : 'liquid-glass-orb hover:text-slate-900 dark:hover:text-white'
                        }`}
                        title="Bad response"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar */}
            {isUser && (
              <div className="w-8 h-8 rounded-full liquid-glass-orb text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Cinematic Liquid Glass Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {zoomImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8"
            onClick={() => setZoomImageUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative max-w-5xl max-h-[92vh] w-full liquid-glass-elevated text-white rounded-[30px] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/15 bg-black/25">
                <div className="flex items-center gap-3 max-w-[70%]">
                  <div className="w-2 h-2 rounded-full bg-violet-400" />
                  <span className="text-sm font-medium text-white truncate">
                    {zoomImageUrl.prompt}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleDownloadImage(
                        zoomImageUrl.url,
                        `${zoomImageUrl.prompt.slice(0, 25)}.jpg`
                      )
                    }
                    className="px-3.5 py-1.5 rounded-full liquid-glass-cta text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => setZoomImageUrl(null)}
                    className="w-8 h-8 rounded-full liquid-glass-orb text-slate-200 hover:text-white flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 flex items-center justify-center overflow-auto max-h-[calc(92vh-100px)] bg-black/35">
                <img
                  src={zoomImageUrl.url}
                  alt={zoomImageUrl.prompt}
                  className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl"
                />
              </div>

              {zoomImageUrl.revisedPrompt && (
                <div className="px-5 py-3 border-t border-white/15 bg-black/25 text-xs text-slate-300 flex items-center justify-between">
                  <span className="italic line-clamp-1 max-w-[80%]">
                    "{zoomImageUrl.revisedPrompt}"
                  </span>
                  <span className="text-[11px] font-mono text-violet-300">FLUX.1 · 1024×1024</span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
