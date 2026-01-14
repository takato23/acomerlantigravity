import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
    className?: string;
    showText?: boolean;
    variant?: 'default' | 'icon-only' | 'white';
}

export const Logo: React.FC<LogoProps> = ({
    className,
    showText = true,
    variant = 'default'
}) => {
    return (
        <div className={cn("flex items-center gap-2.5", className)}>
            <div className="relative w-8 h-8 md:w-9 md:h-9">
                <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full drop-shadow-sm"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Fondo con gradiente sutil */}
                    <rect
                        width="100"
                        height="100"
                        rx="24"
                        className="fill-lime-500 dark:fill-lime-500"
                    />
                    <rect
                        width="100"
                        height="100"
                        rx="24"
                        fill="url(#shine)"
                        className="opacity-20"
                    />

                    {/* Letras KC estilizadas */}
                    <path
                        d="M32 28V72M32 52L52 28M32 52L54 72"
                        stroke="white"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M60 28H82V38M60 72H82V62M60 28V72"
                        stroke="white"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="hidden" // Ocultamos la C completa para simplificar si es muy pequeño
                    />

                    {/* C estilizada como un plato/bowl */}
                    <path
                        d="M84 34C84 34 84 28 72 28C60 28 60 38 60 50C60 62 60 72 72 72C84 72 84 66 84 66"
                        stroke="white"
                        strokeWidth="8"
                        strokeLinecap="round"
                    />

                    {/* Detalle de hoja/frescura */}
                    <path
                        d="M72 18C72 18 80 18 84 24C88 30 84 34 84 34"
                        fill="none"
                        stroke="#ecfccb"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />

                    <defs>
                        <linearGradient id="shine" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                            <stop stopColor="white" />
                            <stop offset="1" stopColor="white" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            {showText && variant !== 'icon-only' && (
                <div className="flex flex-col leading-none">
                    <span className={cn(
                        "font-black text-lg tracking-tight",
                        variant === 'white' ? "text-white" : "text-slate-900 dark:text-white"
                    )}>
                        KeCarajo<span className="text-lime-600 dark:text-lime-500">Comer</span>
                    </span>
                </div>
            )}
        </div>
    );
};
