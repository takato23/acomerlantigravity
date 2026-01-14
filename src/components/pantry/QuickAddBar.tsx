'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Plus, X, Check, Trash2, Edit2, Loader2, Sparkles, Search } from 'lucide-react';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { parseSpanishVoiceInput } from '@/lib/voice/spanishVoiceParser';
import { cn } from '@/lib/utils';

export interface PendingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  location: string;
  confidence: number;
  isPreview?: boolean;
}

type InputMode = 'add' | 'search';

interface QuickAddBarProps {
  onItemsAdded: (items: PendingItem[]) => Promise<void>;
  onSearchChange?: (query: string) => void;
  searchQuery?: string;
  hasItems?: boolean; // If pantry has items, enable search mode
  isAdding?: boolean;
  className?: string;
}

const UNIT_OPTIONS = [
  { value: 'pcs', label: 'unidades' },
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'gramos' },
  { value: 'L', label: 'litros' },
  { value: 'ml', label: 'ml' },
  { value: 'pack', label: 'paquetes' },
  { value: 'can', label: 'latas' },
  { value: 'bottle', label: 'botellas' },
  { value: 'box', label: 'cajas' },
];

export function QuickAddBar({
  onItemsAdded,
  onSearchChange,
  searchQuery = '',
  hasItems = false,
  isAdding = false,
  className
}: QuickAddBarProps) {
  const [mode, setMode] = useState<InputMode>('add');
  const [inputValue, setInputValue] = useState('');
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [previewItems, setPreviewItems] = useState<PendingItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const lastParsedTextRef = useRef<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isRecording,
    transcript,
    interimTranscript,
    startRecording,
    stopRecording,
    clearTranscript,
    isSupported,
    error: voiceError,
  } = useVoiceRecording({
    continuous: true,
    interimResults: true,
    language: 'es-AR',
    maxSilenceDuration: 4000,
  });

  // Sync search query from parent when in search mode
  useEffect(() => {
    if (mode === 'search' && searchQuery !== inputValue) {
      setInputValue(searchQuery);
    }
  }, [searchQuery, mode]);

  const generateId = () => `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const toPendingItem = useCallback((item: ReturnType<typeof parseSpanishVoiceInput>[0], isPreview = false): PendingItem => ({
    id: generateId(),
    name: item.extracted_name || item.name || '',
    quantity: item.quantity || 1,
    unit: item.unit || 'pcs',
    category: item.category || 'otros',
    location: 'despensa',
    confidence: item.confidence || 0.8,
    isPreview,
  }), []);

  const addParsedItems = useCallback((parsed: ReturnType<typeof parseSpanishVoiceInput>) => {
    const newItems = parsed.map(item => toPendingItem(item, false));
    setPendingItems(prev => [...prev, ...newItems]);
    setPreviewItems([]);
  }, [toPendingItem]);

  // Parse and show preview in real-time while recording
  useEffect(() => {
    if (isRecording) {
      const textToParse = transcript + ' ' + interimTranscript;
      if (textToParse.trim() && textToParse !== lastParsedTextRef.current) {
        lastParsedTextRef.current = textToParse;
        const parsed = parseSpanishVoiceInput(textToParse);
        if (parsed.length > 0) {
          setPreviewItems(parsed.map(item => toPendingItem(item, true)));
        }
      }
    }
  }, [isRecording, transcript, interimTranscript, toPendingItem]);

  // Handle input change based on mode
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (mode === 'search' && onSearchChange) {
      onSearchChange(value);
    }
  };

  // Handle text input submission (only for add mode)
  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || mode === 'search') return;

    const parsed = parseSpanishVoiceInput(inputValue);
    if (parsed.length > 0) {
      addParsedItems(parsed);
    }
    setInputValue('');
  };

  // Switch between modes
  const switchMode = (newMode: InputMode) => {
    setMode(newMode);
    setInputValue('');
    if (newMode === 'search' && onSearchChange) {
      onSearchChange('');
    }
    // Focus input after mode switch
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Handle voice recording
  const handleMicPointerDown = async () => {
    if (!isSupported || mode === 'search') return;
    clearTranscript();
    lastParsedTextRef.current = '';
    setPreviewItems([]);
    startRecording();
  };

  const handleMicPointerUp = () => {
    if (!isSupported || !isRecording) return;
    stopRecording();
  };

  // Process transcript when recording stops
  useEffect(() => {
    if (!isRecording && transcript && transcript.trim()) {
      setIsProcessing(true);
      const timer = setTimeout(() => {
        const parsed = parseSpanishVoiceInput(transcript);
        if (parsed.length > 0) {
          addParsedItems(parsed);
        }
        clearTranscript();
        lastParsedTextRef.current = '';
        setIsProcessing(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isRecording, transcript, addParsedItems, clearTranscript]);

  const updateItem = (id: string, updates: Partial<PendingItem>) => {
    setPendingItems(prev =>
      prev.map(item => item.id === id ? { ...item, ...updates } : item)
    );
  };

  const removeItem = (id: string) => {
    setPendingItems(prev => prev.filter(item => item.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const clearAll = () => {
    setPendingItems([]);
    setPreviewItems([]);
    setEditingId(null);
  };

  const handleConfirmAll = async () => {
    if (pendingItems.length === 0 || isAdding) return;
    await onItemsAdded(pendingItems);
    clearAll();
  };

  const allDisplayItems = useMemo(() => {
    return [...pendingItems, ...previewItems];
  }, [pendingItems, previewItems]);

  const displayText = isRecording
    ? (interimTranscript || transcript || 'Escuchando...')
    : isProcessing
      ? 'Procesando...'
      : '';

  const placeholder = mode === 'search'
    ? 'Buscar en tu despensa...'
    : 'Ej: 2kg milanesas, 1 docena huevos...';

  return (
    <div className={cn("space-y-3", className)}>
      {/* Input Bar */}
      <form onSubmit={handleInputSubmit} className="relative">
        <div className="flex items-center gap-2">
          {/* Mode Toggle (only show if search is enabled) */}
          {hasItems && onSearchChange && (
            <div className="flex p-0.5 bg-slate-100 dark:bg-white/10 rounded-lg">
              <button
                type="button"
                onClick={() => switchMode('add')}
                className={cn(
                  "px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                  mode === 'add'
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200"
                )}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => switchMode('search')}
                className={cn(
                  "px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                  mode === 'search'
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200"
                )}
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Input Field */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              {mode === 'search' ? (
                <Search className="w-4 h-4 text-slate-400 dark:text-gray-500" />
              ) : (
                <Plus className="w-4 h-4 text-slate-400 dark:text-gray-500" />
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={isRecording || isProcessing ? '' : inputValue}
              onChange={handleInputChange}
              placeholder={isRecording ? "Escuchando..." : placeholder}
              className={cn(
                "w-full pl-10 pr-4 py-3 bg-white dark:bg-white/10",
                "border rounded-xl text-sm",
                "focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500",
                "transition-all placeholder:text-slate-400 dark:placeholder:text-gray-500",
                "text-slate-900 dark:text-white",
                isRecording
                  ? "border-red-500 dark:border-red-400 bg-red-50/50 dark:bg-red-900/20"
                  : "border-slate-200 dark:border-white/10"
              )}
              disabled={isRecording || isProcessing}
            />

            {/* Clear button for search */}
            {mode === 'search' && inputValue && (
              <button
                type="button"
                onClick={() => {
                  setInputValue('');
                  onSearchChange?.('');
                }}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Live transcript overlay during recording */}
            <AnimatePresence>
              {(isRecording || isProcessing) && displayText && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center pl-10 pr-4 pointer-events-none"
                >
                  <span className={cn(
                    "truncate text-sm",
                    isRecording ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-gray-400"
                  )}>
                    {displayText}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Microphone Button (only in add mode) */}
          {isSupported && mode === 'add' && (
            <motion.button
              type="button"
              onPointerDown={handleMicPointerDown}
              onPointerUp={handleMicPointerUp}
              onPointerLeave={handleMicPointerUp}
              onPointerCancel={handleMicPointerUp}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "p-3 rounded-xl transition-all touch-none select-none border",
                isRecording
                  ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30"
                  : "bg-white dark:bg-white/10 text-slate-500 dark:text-gray-400 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/20"
              )}
              title="Mantener presionado para hablar"
            >
              {isRecording ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                >
                  <Mic className="w-5 h-5" />
                </motion.div>
              ) : isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </motion.button>
          )}
        </div>

        {voiceError && (
          <p className="mt-2 text-xs text-red-500 dark:text-red-400">
            Error de voz: {voiceError}
          </p>
        )}
      </form>

      {/* Pending Items Chips (only in add mode) */}
      <AnimatePresence>
        {mode === 'add' && allDisplayItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-slate-500 dark:text-gray-400">
                {isRecording ? (
                  <>
                    <Sparkles className="w-3 h-3 inline mr-1 text-orange-500 animate-pulse" />
                    Detectando...
                  </>
                ) : (
                  `${pendingItems.length} pendiente${pendingItems.length !== 1 ? 's' : ''}`
                )}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {allDisplayItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: item.isPreview ? 0.7 : 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm",
                    "backdrop-blur-sm border",
                    item.isPreview
                      ? "bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-500/50 border-dashed"
                      : "bg-white dark:bg-white/10 border-slate-200 dark:border-white/10"
                  )}
                >
                  {item.isPreview ? (
                    <>
                      <Sparkles className="w-3 h-3 text-orange-500 animate-pulse" />
                      <span className="font-medium text-orange-700 dark:text-orange-300">{item.name}</span>
                      <span className="text-orange-500 dark:text-orange-400 text-xs">
                        {item.quantity} {UNIT_OPTIONS.find(u => u.value === item.unit)?.label || item.unit}
                      </span>
                    </>
                  ) : editingId === item.id ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, { name: e.target.value })}
                        className="w-20 px-1.5 py-0.5 text-xs border border-slate-300 dark:border-white/20 rounded bg-white dark:bg-slate-800 dark:text-white"
                        autoFocus
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 1 })}
                        className="w-12 px-1.5 py-0.5 text-xs border border-slate-300 dark:border-white/20 rounded bg-white dark:bg-slate-800 dark:text-white"
                        step="0.1"
                        min="0.1"
                      />
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-slate-900 dark:text-white">{item.name}</span>
                      <span className="text-slate-500 dark:text-gray-400 text-xs">
                        {item.quantity} {UNIT_OPTIONS.find(u => u.value === item.unit)?.label || item.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingId(item.id)}
                        className="p-0.5 text-slate-400 hover:text-slate-600 rounded"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-0.5 text-red-400 hover:text-red-600 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </motion.div>
              ))}
            </div>

            {!isRecording && pendingItems.length > 0 && (
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={clearAll}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg"
                >
                  <Trash2 className="w-3 h-3" />
                  Limpiar
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAll}
                  disabled={isAdding || pendingItems.length === 0}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium",
                    "bg-orange-500 hover:bg-orange-600 text-white",
                    (isAdding || pendingItems.length === 0) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isAdding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Agregar {pendingItems.length}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
