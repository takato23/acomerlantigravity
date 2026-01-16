/**
 * useVoiceService Hook
 * React hook for integrating voice service
 */

import { useEffect, useState, useCallback, useRef } from 'react';

import { getVoiceService } from '../UnifiedVoiceService';
import { 
  ParsedIngredient,
  VoiceCommand, 
  VoiceOptions,
  VoiceServiceConfig, 
  VoiceServiceStatus,
  VoiceAnalytics,
  VoiceServiceEvents
} from '../types';

export interface UseVoiceServiceOptions extends VoiceOptions {
  onCommand?: (command: VoiceCommand) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onInterim?: (transcript: string) => void;
  autoStart?: boolean;
}

export interface UseVoiceServiceReturn {
  // State
  state: VoiceServiceStatus;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  transcript: string;
  interimTranscript: string;
  lastCommand: VoiceCommand | null;
  error: string | null;
  status: VoiceServiceStatus;
  analytics: VoiceAnalytics;
  isSupported: boolean;
  
  // Actions
  startListening: (options?: Partial<VoiceServiceConfig>) => Promise<void>;
  stopListening: () => void;
  speak: (text: string, options?: any) => Promise<void>;
  executeCommand: (command: VoiceCommand) => Promise<void>;
  reset: () => void;
  resetTranscript: () => void;
  start: (options?: Partial<VoiceServiceConfig>) => Promise<void>;
  stop: () => void;
  clear: () => void;
  
  // Configuration
  updateConfig: (config: Partial<VoiceServiceConfig>) => void;
}

export function useVoiceService(options: UseVoiceServiceOptions = {}): UseVoiceServiceReturn {
  const service = getVoiceService(options);
  const optionsRef = useRef(options);
  
  // State
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<VoiceServiceStatus>(service.getStatus());
  const [analytics, setAnalytics] = useState<VoiceAnalytics>(service.getAnalytics());

  // Update options ref
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Keep service configuration in sync with options
  useEffect(() => {
    const config: Partial<VoiceServiceConfig> = {};

    if (options.language !== undefined) config.language = options.language;
    if (options.continuous !== undefined) config.continuous = options.continuous;
    if (options.interimResults !== undefined) config.interimResults = options.interimResults;
    if (options.enableWakeWord !== undefined) config.enableWakeWord = options.enableWakeWord;
    if (options.enableFeedback !== undefined) config.enableFeedback = options.enableFeedback;
    if (options.enableOffline !== undefined) config.enableOffline = options.enableOffline;
    if (options.maxAlternatives !== undefined) config.maxAlternatives = options.maxAlternatives;
    if (options.confidenceThreshold !== undefined) config.confidenceThreshold = options.confidenceThreshold;

    service.updateConfig(config);
    setStatus(service.getStatus());
  }, [
    service,
    options.language,
    options.continuous,
    options.interimResults,
    options.enableWakeWord,
    options.enableFeedback,
    options.enableOffline,
    options.maxAlternatives,
    options.confidenceThreshold,
  ]);

  const extractParsedItems = useCallback((command: VoiceCommand): ParsedIngredient[] | undefined => {
    const entities = command.parameters?.entities;
    const items = Array.isArray(entities?.ingredients)
      ? entities.ingredients
      : Array.isArray(command.parameters?.ingredients)
        ? command.parameters.ingredients
        : undefined;

    return items && items.length > 0 ? (items as ParsedIngredient[]) : undefined;
  }, []);

  // Event handlers
  const handleStart = useCallback(() => {
    setIsListening(true);
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    optionsRef.current.onStart?.();
  }, []);

  const handleEnd = useCallback(() => {
    setIsListening(false);
    setInterimTranscript('');
    optionsRef.current.onEnd?.();
  }, []);

  const handleResult = useCallback((command: VoiceCommand) => {
    setTranscript(command.transcript);
    setLastCommand(command);
    optionsRef.current.onCommand?.(command);
    optionsRef.current.onResult?.({
      text: command.transcript,
      transcript: command.transcript,
      isComplete: true,
      confidence: command.confidence,
      parsedItems: extractParsedItems(command),
      command,
    });
  }, []);

  const handleInterim = useCallback((data: { transcript: string }) => {
    setInterimTranscript(data.transcript);
    optionsRef.current.onInterim?.(data.transcript);
    optionsRef.current.onResult?.({
      text: data.transcript,
      transcript: data.transcript,
      isComplete: false,
    });
  }, []);

  const handleError = useCallback((err: Error) => {
    setError(err.message || 'Unknown error');
    setIsListening(false);
    optionsRef.current.onError?.(err);
  }, []);

  const handleCommand = useCallback((command: VoiceCommand) => {
    setLastCommand(command);
    optionsRef.current.onCommand?.(command);
  }, []);

  // Set up event listeners
  useEffect(() => {
    // Type assertion to match event types
    const events: Array<[keyof VoiceServiceEvents, Function]> = [
      ['start', handleStart],
      ['end', handleEnd],
      ['result', handleResult],
      ['interim', handleInterim],
      ['error', handleError],
      ['command', handleCommand],
    ];

    events.forEach(([event, handler]) => {
      service.on(event, handler as any);
    });

    // Update status periodically
    const statusInterval = setInterval(() => {
      setStatus(service.getStatus());
      setAnalytics(service.getAnalytics());
    }, 1000);

    return () => {
      events.forEach(([event, handler]) => {
        service.off(event, handler as any);
      });
      clearInterval(statusInterval);
    };
  }, [handleStart, handleEnd, handleResult, handleInterim, handleError, handleCommand]);

  // Actions
  const startListening = useCallback(async (config?: Partial<VoiceServiceConfig>) => {
    try {
      setError(null);
      await service.startListening(config || {});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, [service]);

  const stopListening = useCallback(() => {
    service.stop();
  }, [service]);

  const speak = useCallback(async (text: string, options?: any) => {
    try {
      setIsSpeaking(true);
      await service.speak(text, options);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setIsSpeaking(false);
    }
  }, [service]);

  const executeCommand = useCallback(async (command: VoiceCommand) => {
    try {
      setIsProcessing(true);
      await service.executeCommand(command);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [service]);

  const reset = useCallback(() => {
    service.reset();
    setTranscript('');
    setInterimTranscript('');
    setLastCommand(null);
    setError(null);
  }, [service]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  const updateConfig = useCallback((config: Partial<VoiceServiceConfig>) => {
    service.updateConfig(config);
    setStatus(service.getStatus());
  }, [service]);

  // Auto-start if requested
  useEffect(() => {
    if (options.autoStart && !isListening && status.isAvailable) {
      startListening();
    }
  }, [options.autoStart, isListening, status.isAvailable, startListening]);

  // Update status when processing changes
  useEffect(() => {
    setStatus(prev => ({ ...prev, isProcessing }));
  }, [isProcessing]);

  // Update status when speaking changes
  useEffect(() => {
    setStatus(prev => ({ ...prev, isSpeaking }));
  }, [isSpeaking]);

  return {
    // State
    state: status,
    isListening,
    isProcessing,
    isSpeaking,
    transcript,
    interimTranscript,
    lastCommand,
    error,
    status,
    analytics,
    isSupported: status.isAvailable,
    
    // Actions
    startListening,
    stopListening,
    speak,
    executeCommand,
    reset,
    resetTranscript,
    start: startListening,
    stop: stopListening,
    clear: resetTranscript,
    
    // Configuration
    updateConfig,
  };
}
