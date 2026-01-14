'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Mic,
    MicOff,
    Volume2,
    VolumeX,
    Play,
    Pause,
    SkipForward,
    RotateCcw,
    Timer,
    CheckCircle,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CookingStep {
    number: number;
    instruction: string;
    duration?: number; // in minutes
    tip?: string;
}

interface Recipe {
    id: string;
    name: string;
    steps: CookingStep[];
    ingredients: Array<{ name: string; amount: string }>;
}

interface Props {
    recipe: Recipe;
    onComplete?: () => void;
    onStepChange?: (step: number) => void;
}

export const CookingVoiceController: React.FC<Props> = ({
    recipe,
    onComplete,
    onStepChange
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [ttsEnabled, setTtsEnabled] = useState(true);
    const [wakeLockActive, setWakeLockActive] = useState(false);
    const [timerActive, setTimerActive] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [lastCommand, setLastCommand] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const wakeLockRef = useRef<WakeLockSentinel | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = false;
                recognition.lang = 'es-AR';

                recognition.onresult = (event) => {
                    const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
                    handleVoiceCommand(transcript);
                };

                recognition.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                    if (event.error !== 'no-speech') {
                        setError(`Error de voz: ${event.error}`);
                    }
                };

                recognition.onend = () => {
                    if (isListening) {
                        recognition.start();
                    }
                };

                recognitionRef.current = recognition;
            }

            synthRef.current = window.speechSynthesis;
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [isListening]);

    // Wake Lock to keep screen on
    useEffect(() => {
        const requestWakeLock = async () => {
            if ('wakeLock' in navigator) {
                try {
                    wakeLockRef.current = await navigator.wakeLock.request('screen');
                    setWakeLockActive(true);

                    wakeLockRef.current.addEventListener('release', () => {
                        setWakeLockActive(false);
                    });
                } catch (err) {
                    console.error('Wake Lock error:', err);
                }
            }
        };

        if (isListening) {
            requestWakeLock();
        }

        return () => {
            if (wakeLockRef.current) {
                wakeLockRef.current.release();
                wakeLockRef.current = null;
            }
        };
    }, [isListening]);

    // Timer countdown
    useEffect(() => {
        if (timerActive && timerSeconds > 0) {
            timerIntervalRef.current = setInterval(() => {
                setTimerSeconds(prev => {
                    if (prev <= 1) {
                        setTimerActive(false);
                        speak('¡El timer terminó!');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [timerActive, timerSeconds]);

    // Text-to-Speech function
    const speak = useCallback((text: string) => {
        if (!ttsEnabled || !synthRef.current) return;

        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-AR';
        utterance.rate = 0.9;
        utterance.pitch = 1;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(utterance);
    }, [ttsEnabled]);

    // Handle voice commands
    const handleVoiceCommand = useCallback((transcript: string) => {
        setLastCommand(transcript);
        setError(null);

        // Next step
        if (transcript.match(/siguiente|próximo|next/i)) {
            goToNextStep();
            return;
        }

        // Repeat / previous
        if (transcript.match(/repetir|repite|otra vez|repeat/i)) {
            repeatStep();
            return;
        }

        // Timer
        const timerMatch = transcript.match(/timer\s*(?:de\s*)?(\d+)\s*(minutos?|segundos?|min|seg)/i);
        if (timerMatch) {
            const duration = parseInt(timerMatch[1]);
            const isMinutes = timerMatch[2].startsWith('min');
            startTimer(isMinutes ? duration * 60 : duration);
            return;
        }

        // List ingredients
        if (transcript.match(/ingredientes|qué necesito|que necesito/i)) {
            listIngredients();
            return;
        }

        // Complete / done
        if (transcript.match(/listo|terminé|finalizar|done|finished/i)) {
            completeRecipe();
            return;
        }

        // Pause
        if (transcript.match(/pausar|pausa|pause/i)) {
            setIsListening(false);
            speak('Pausado. Decí "continuar" cuando quieras seguir.');
            return;
        }

    }, []);

    // Navigation functions
    const goToNextStep = useCallback(() => {
        if (currentStep < recipe.steps.length - 1) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
            onStepChange?.(nextStep);
            speak(`Paso ${nextStep + 1}: ${recipe.steps[nextStep].instruction}`);
        } else {
            speak('Este es el último paso. Decí "listo" cuando termines.');
        }
    }, [currentStep, recipe.steps, speak, onStepChange]);

    const repeatStep = useCallback(() => {
        speak(`Paso ${currentStep + 1}: ${recipe.steps[currentStep].instruction}`);
    }, [currentStep, recipe.steps, speak]);

    const goToPreviousStep = useCallback(() => {
        if (currentStep > 0) {
            const prevStep = currentStep - 1;
            setCurrentStep(prevStep);
            onStepChange?.(prevStep);
            speak(`Volviendo al paso ${prevStep + 1}: ${recipe.steps[prevStep].instruction}`);
        }
    }, [currentStep, recipe.steps, speak, onStepChange]);

    const startTimer = useCallback((seconds: number) => {
        setTimerSeconds(seconds);
        setTimerActive(true);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        speak(`Timer de ${minutes > 0 ? `${minutes} minutos` : ''} ${secs > 0 ? `${secs} segundos` : ''} iniciado`);
    }, [speak]);

    const listIngredients = useCallback(() => {
        const ingredientsList = recipe.ingredients.map(i => `${i.amount} de ${i.name}`).join(', ');
        speak(`Los ingredientes son: ${ingredientsList}`);
    }, [recipe.ingredients, speak]);

    const completeRecipe = useCallback(() => {
        speak('¡Felicitaciones! Terminaste la receta.');
        onComplete?.();
    }, [speak, onComplete]);

    // Toggle listening
    const toggleListening = useCallback(() => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
            speak(`Modo cocina activado. Estamos en el paso ${currentStep + 1}.`);
        }
    }, [isListening, currentStep, speak]);

    // Format timer display
    const formatTimer = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const step = recipe.steps[currentStep];

    return (
        <Card className="ios26-card overflow-hidden">
            <CardContent className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                            {recipe.name}
                        </h3>
                        <p className="text-sm text-slate-600">
                            Paso {currentStep + 1} de {recipe.steps.length}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {wakeLockActive && (
                            <Badge variant="secondary" className="text-xs">
                                Pantalla activa
                            </Badge>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTtsEnabled(!ttsEnabled)}
                            className="p-2"
                        >
                            {ttsEnabled ? (
                                <Volume2 className="w-5 h-5" />
                            ) : (
                                <VolumeX className="w-5 h-5" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                        className="bg-slate-700 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / recipe.steps.length) * 100}%` }}
                    />
                </div>

                {/* Current step */}
                <div className="bg-slate-50 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold flex-shrink-0">
                            {currentStep + 1}
                        </div>
                        <div className="flex-1">
                            <p className="text-lg text-slate-900 leading-relaxed">
                                {step.instruction}
                            </p>
                            {step.tip && (
                                <p className="mt-3 text-sm text-amber-600 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {step.tip}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Timer */}
                {timerActive && (
                    <div className="bg-amber-50 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Timer className="w-6 h-6 text-amber-600" />
                            <span className="text-2xl font-mono font-bold text-amber-700">
                                {formatTimer(timerSeconds)}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTimerActive(false)}
                        >
                            Cancelar
                        </Button>
                    </div>
                )}

                {/* Voice control */}
                <div className="flex items-center justify-center gap-4 py-4">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={goToPreviousStep}
                        disabled={currentStep === 0}
                        className="rounded-full p-4"
                    >
                        <RotateCcw className="w-6 h-6" />
                    </Button>

                    <Button
                        size="lg"
                        onClick={toggleListening}
                        className={`rounded-full p-6 transition-all ${isListening
                                ? 'bg-red-500 hover:bg-red-600 ios26-pulse-glow'
                                : 'bg-emerald-500 hover:bg-emerald-600'
                            }`}
                    >
                        {isListening ? (
                            <MicOff className="w-8 h-8 text-white" />
                        ) : (
                            <Mic className="w-8 h-8 text-white" />
                        )}
                    </Button>

                    <Button
                        variant="outline"
                        size="lg"
                        onClick={goToNextStep}
                        disabled={currentStep === recipe.steps.length - 1}
                        className="rounded-full p-4"
                    >
                        <SkipForward className="w-6 h-6" />
                    </Button>
                </div>

                {/* Status */}
                <div className="text-center text-sm text-slate-600">
                    {isListening ? (
                        <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Escuchando... Decí &quot;KeCarajo, siguiente paso&quot;
                        </div>
                    ) : isSpeaking ? (
                        <div className="flex items-center justify-center gap-2">
                            <Volume2 className="w-4 h-4 animate-pulse" />
                            Hablando...
                        </div>
                    ) : (
                        'Tocá el micrófono para activar controles de voz'
                    )}
                </div>

                {/* Last command */}
                {lastCommand && (
                    <div className="text-center">
                        <Badge variant="secondary" className="text-xs">
                            Último comando: &quot;{lastCommand}&quot;
                        </Badge>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Voice commands help */}
                <details className="text-sm text-slate-600">
                    <summary className="cursor-pointer hover:text-slate-900">
                        Comandos de voz disponibles
                    </summary>
                    <ul className="mt-2 space-y-1 pl-4">
                        <li>&quot;Siguiente paso&quot; - Ir al próximo paso</li>
                        <li>&quot;Repetir&quot; - Repetir paso actual</li>
                        <li>&quot;Timer 5 minutos&quot; - Poner temporizador</li>
                        <li>&quot;Qué ingredientes&quot; - Listar ingredientes</li>
                        <li>&quot;Listo&quot; - Marcar receta como terminada</li>
                    </ul>
                </details>
            </CardContent>
        </Card>
    );
};

export default CookingVoiceController;
