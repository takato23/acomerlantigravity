import React, { useState, useEffect } from 'react';
import { ChefHat, Loader2, ArrowRight } from 'lucide-react';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Text, Heading } from '@/components/design-system/Typography';
// MOCK_RECIPES removed, using SmartParser


interface RecipeMatcherProps {
    addedItems: string[];
    onClose: () => void;
}

export const RecipeMatcher: React.FC<RecipeMatcherProps> = ({ addedItems, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [suggestions, setSuggestions] = useState<any[]>([]);

    useEffect(() => {
        let mounted = true;
        const fetchRecipes = async () => {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { smartParser } = require('@/lib/services/smartParser');
            const recipes = await smartParser.suggestRecipes(addedItems);

            if (mounted) {
                setSuggestions(recipes);
                setLoading(false);
            }
        };

        if (addedItems.length > 0) {
            fetchRecipes();
        } else {
            setLoading(false);
        }

        return () => { mounted = false; };
    }, [addedItems]);

    return (
        <Card className="p-4 bg-orange-50 border-orange-200 mt-4">
            <div className="flex items-center gap-2 mb-3">
                <ChefHat className="w-5 h-5 text-orange-600" />
                <Heading size="md" className="text-orange-900">
                    ¡Con lo que compraste podés cocinar!
                </Heading>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                    <Text className="ml-2 text-orange-700">Imaginando recetas...</Text>
                </div>
            ) : (
                <div className="space-y-3">
                    {suggestions.slice(0, 3).map((recipe, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-100 shadow-sm">
                            <div>
                                <Text className="font-bold text-gray-900">{recipe.title}</Text>
                                <Text size="sm" className="text-gray-500">
                                    Usando: {recipe.ingredients && recipe.ingredients.join(', ')}
                                </Text>
                            </div>
                            <Button size="sm" variant="ghost" className="text-orange-600">
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                    {suggestions.length === 0 && (
                        <Text className="text-center text-gray-500">No se encontraron recetas inmediatas.</Text>
                    )}
                    <div className="flex justify-end mt-2">
                        <Button size="sm" variant="secondary" onClick={onClose}>
                            Cerrar
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
};
