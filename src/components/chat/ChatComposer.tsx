import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Plus,
  Plug,
  Mic,
  MicOff,
  History,
  Lightbulb,
  Glasses,
  X,
  FileText,
  Upload,
  HardDrive,
  Cloud,
} from 'lucide-react';
import { ModelInfo } from '../../types';

interface ChatComposerProps {
  selectedModel: ModelInfo;
  onSendMessage: (text: string, files?: any[]) => void;
  isLoading: boolean;
  onStopGeneration?: () => void;
  onOpenModelSelector?: () => void;
  onOpenConnectorsSheet?: () => void;
  placeholder?: string;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  selectedModel,
  onSendMessage,
  isLoading,
  onStopGeneration,
  onOpenModelSelector,
  onOpenConnectorsSheet,
  placeholder = 'What can I do for you today?',
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<{ name: string; base64: string; mimeType: string }[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

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
    if (!recognitionRef.current) return;
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    onSendMessage(input, attachments);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

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
    <div className="w-full max-w-[770px] mx-auto px-4 select-none relative">
      {/* Contextual controls bar directly above composer (matching Screenshot 1 / Video) */}
      <div className="flex items-center justify-between mb-2 px-1">
        {/* Left: Model chip + green status dot + history clock */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenModelSelector}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-gray-50 border border-gray-200/70 text-gray-700 text-xs font-medium transition-all shadow-2xs group"
          >
            <span className="text-[#c86d51] text-xs font-bold">✱</span>
            <span className="font-semibold text-gray-800">{selectedModel.name}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
          </button>

          <button
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Chat History"
          >
            <History className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Binoculars / Glasses & Lightbulb icons */}
        <div className="flex items-center gap-3 text-gray-400">
          <button
            className="hover:text-gray-700 transition-colors"
            title="Research & Vision Mode"
          >
            <Glasses className="w-4 h-4" />
          </button>
          <button
            className="hover:text-gray-700 transition-colors"
            title="Prompt Insights & Suggestions"
          >
            <Lightbulb className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Attachment Popover Menu */}
      {showAttachMenu && (
        <div className="absolute bottom-20 left-4 z-40 liquid-glass-elevated text-slate-900 dark:text-white rounded-2xl p-2 w-72 animate-in fade-in duration-150">
          <div className="space-y-1 text-xs">
            {/* Google Drive */}
            <div className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-between cursor-not-allowed opacity-80">
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-4 h-4 text-amber-500" />
                <div>
                  <p className="font-semibold">Google Drive</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Connect from Integrations</p>
                </div>
              </div>
              <span className="text-[9px] liquid-glass-subtle px-2 py-0.5 rounded-full">
                Coming soon
              </span>
            </div>

            {/* Microsoft 365 */}
            <div
              onClick={() => {
                onOpenConnectorsSheet?.();
                setShowAttachMenu(false);
              }}
              className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-2.5 cursor-pointer"
            >
              <Cloud className="w-4 h-4 text-blue-500" />
              <div>
                <p className="font-semibold">Microsoft 365</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Connect your Microsoft 365 files</p>
              </div>
            </div>

            {/* From this device */}
            <div
              onClick={() => {
                fileInputRef.current?.click();
              }}
              className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-2.5 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-violet-500" />
              <div>
                <p className="font-semibold">From this device</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Images, PDFs, documents, MP3, and MP4</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Rounded Composer Box */}
      <div className="liquid-glass-elevated rounded-[26px] p-3 transition-all">
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 p-1.5 bg-white rounded-xl border border-gray-100">
            {attachments.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-lg text-xs text-gray-700"
              >
                <FileText className="w-3 h-3 text-purple-600" />
                <span className="max-w-[120px] truncate text-[11px]">{file.name}</span>
                <button
                  onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          className="w-full bg-transparent resize-none border-0 text-gray-900 text-sm focus:outline-none placeholder:text-gray-400 py-1 px-1 leading-relaxed max-h-[180px]"
        />

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Bottom Toolbar */}
        <div className="flex items-center justify-between pt-1">
          {/* Left: Circle Plus (+) & Circle Plug (🔌) */}
          <div className="flex items-center gap-1 text-gray-400">
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-500 hover:text-gray-700 transition-colors"
              title="Add attachment"
            >
              <Plus className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenConnectorsSheet || onOpenModelSelector}
              className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-500 hover:text-gray-700 transition-colors"
              title="Connect tools & integrations"
            >
              <Plug className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Circular Dark Microphone / Send Button */}
          <div>
            {isLoading ? (
              <button
                onClick={onStopGeneration}
                className="w-8 h-8 rounded-full bg-[#1e293b] hover:bg-black text-white flex items-center justify-center shadow-xs transition-colors"
                title="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
              </button>
            ) : input.trim() || attachments.length > 0 ? (
              <button
                onClick={handleSubmit}
                className="w-8 h-8 rounded-full bg-[#1e293b] hover:bg-black text-white flex items-center justify-center shadow-xs transition-all"
                title="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <button
                onClick={toggleVoice}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-[#1e293b] hover:bg-black text-white'
                }`}
                title="Voice input"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Disclaimer below composer */}
      <p className="text-[11px] text-gray-400 text-center mt-2 font-normal">
        Automate AI can make mistakes.
      </p>
    </div>
  );
};
