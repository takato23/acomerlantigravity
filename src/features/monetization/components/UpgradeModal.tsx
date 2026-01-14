'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { SubscriptionButton } from './SubscriptionButton';
import { Check, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UpgradeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    triggerReason?: string;
}

export function UpgradeModal({ open, onOpenChange, triggerReason }: UpgradeModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white text-slate-900 border-0 rounded-3xl overflow-hidden p-0 shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-10"></div>

                <div className="p-6 relative z-10">
                    <DialogHeader className="mb-6 text-center">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg transform -rotate-3">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <DialogTitle className="text-2xl font-black tracking-tight text-slate-900">
                            Desbloqueá tu Potencial
                        </DialogTitle>
                        <DialogDescription className="text-slate-600 font-medium text-base mt-2">
                            {triggerReason || 'Llegaste al límite de tu plan gratuito.'}
                            <br />
                            Pasate a PRO y cocina sin límites.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="min-w-[24px] h-6 rounded-full bg-green-100 flex items-center justify-center">
                                <Check className="w-4 h-4 text-green-600 font-bold" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Planes semanales ilimitados</span>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="min-w-[24px] h-6 rounded-full bg-green-100 flex items-center justify-center">
                                <Check className="w-4 h-4 text-green-600 font-bold" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Chat con Chef IA ilimitado</span>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="min-w-[24px] h-6 rounded-full bg-green-100 flex items-center justify-center">
                                <Check className="w-4 h-4 text-green-600 font-bold" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Acceso a nuevas funciones beta</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <SubscriptionButton className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl border-0" />
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="text-slate-400 hover:text-slate-600 font-semibold"
                        >
                            Quizás más tarde
                        </Button>
                    </div>

                    <div className="mt-4 text-center">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Solo $4.500 ARS / mes
                        </span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
