'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChefHat,
    Send,
    X,
    MessageCircle,
    Loader2,
    Sparkles,
    User
} from 'lucide-react';
import { toast } from 'sonner';

import { useMealPlanningStore } from '@/features/meal-planning/store/useMealPlanningStore';
import { useMonetization } from '@/features/monetization/MonetizationProvider';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics/mixpanel';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChefAIChatProps {
    className?: string;
    onClose?: () => void;
    isOpen?: boolean;
}

export function ChefAIChat({ className = '', onClose, isOpen = true }: ChefAIChatProps) {
    const { currentWeekPlan, preferences } = useMealPlanningStore();
    const { checkAccess, trackAction } = useMonetization();
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: '¡Hola! Soy tu Chef IA 👨‍🍳 ¿En qué te puedo ayudar hoy? Puedo sugerirte recetas, ayudarte a modificar tu plan semanal, o darte tips de cocina.',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        // Check daily chat quota
        const canChat = await checkAccess('chef_chat');
        if (!canChat) return; // UpgradeModal shown automatically

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        // Track chat message sent
        trackEvent(AnalyticsEvents.CHAT_MESSAGE_SENT, {
            message_length: userMessage.content.length,
        });

        try {
            // Prepare current plan context
            const planContext = currentWeekPlan?.slots?.map(slot => ({
                day: slot.date,
                mealType: slot.mealType,
                recipeName: slot.recipe?.name || 'Sin planificar'
            }));

            const response = await fetch('/api/chef-ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage.content,
                    history: messages.filter(m => m.id !== 'welcome').map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    currentPlan: planContext ? {
                        startDate: currentWeekPlan?.startDate,
                        endDate: currentWeekPlan?.endDate,
                        meals: planContext
                    } : undefined,
                    userPreferences: preferences ? {
                        dietaryRestrictions: preferences.dietaryPreferences || preferences.dietary?.restrictions || [],
                        householdSize: preferences.family?.householdSize || 1
                    } : undefined
                })
            });

            if (!response.ok) {
                throw new Error('Error en la respuesta');
            }

            const data = await response.json();

            const assistantMessage: ChatMessage = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: data.message,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Increment chat usage quota
            await trackAction('chef_chat');
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Error al enviar el mensaje');

            const errorMessage: ChatMessage = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: 'Perdón, tuve un problema técnico. ¿Podés repetir tu pregunta? 🙏',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const quickSuggestions = [
        '¿Qué puedo cocinar con pollo?',
        'Dame una receta rápida para hoy',
        'Ideas para el almuerzo de mañana',
        'Tips para cocinar milanesas'
    ];

    if (!isOpen) return null;

    return (
        <div className={`flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden ${className}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <ChefHat className="text-white" size={22} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Chef IA</h3>
                        <p className="text-white/80 text-xs">Tu asistente de cocina</p>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    >
                        <X size={18} className="text-white" />
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px] min-h-[300px]">
                <AnimatePresence>
                    {messages.map((message) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${message.role === 'user'
                                ? 'bg-blue-500'
                                : 'bg-gradient-to-br from-orange-500 to-pink-500'
                                }`}>
                                {message.role === 'user' ? (
                                    <User size={16} className="text-white" />
                                ) : (
                                    <ChefHat size={16} className="text-white" />
                                )}
                            </div>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-white/10 text-slate-900 dark:text-white'
                                }`}>
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-3"
                    >
                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-orange-500 to-pink-500">
                            <ChefHat size={16} className="text-white" />
                        </div>
                        <div className="bg-gray-100 dark:bg-white/10 rounded-2xl px-4 py-3">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Loader2 className="animate-spin" size={14} />
                                Pensando...
                            </div>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions (only if no messages after welcome) */}
            {messages.length === 1 && (
                <div className="px-4 pb-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Sugerencias rápidas:</p>
                    <div className="flex flex-wrap gap-2">
                        {quickSuggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => setInputValue(suggestion)}
                                className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/10 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-white/10">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Preguntale algo al Chef..."
                        className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/10 border-0 focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white placeholder:text-gray-500"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading}
                        className="px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Floating Chat Button to open the Chef AI chat
 */
interface ChefAIChatButtonProps {
    onClick: () => void;
}

export function ChefAIChatButton({ onClick }: ChefAIChatButtonProps) {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50"
        >
            <ChefHat size={24} />
        </motion.button>
    );
}
