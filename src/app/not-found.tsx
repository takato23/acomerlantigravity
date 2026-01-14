import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 p-8 text-center">
                    <div className="text-8xl font-black text-gray-200 mb-4 select-none">
                        404
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900 mb-2">
                        Página no encontrada
                    </h1>

                    <p className="text-gray-600 mb-8">
                        Lo sentimos, pero la página que estás buscando no existe o ha sido movida.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button asChild variant="default" className="flex items-center gap-2">
                            <Link href="/">
                                <Home className="w-4 h-4" />
                                Ir al inicio
                            </Link>
                        </Button>

                        <Button asChild variant="outline" className="flex items-center gap-2">
                            <Link href="/recetas">
                                <Search className="w-4 h-4" />
                                Buscar recetas
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
