
import React, { useState, useCallback } from 'react';
import { generateConceptArt } from '../services/geminiService';

const LoadingSpinner: React.FC = () => (
    <div className="absolute inset-0 bg-black/70 flex flex-col justify-center items-center backdrop-blur-sm z-10">
        <div className="flex justify-center items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#00ffc6] animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-[#00ffc6] animate-pulse [animation-delay:0.2s]"></div>
            <div className="w-4 h-4 rounded-full bg-[#00ffc6] animate-pulse [animation-delay:0.4s]"></div>
        </div>
        <p className="mt-4 font-roboto-mono text-lg">RENDERING VISUAL DATA...</p>
    </div>
);

export const ConceptArtGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('M4A1 carbine with holographic sight in a dusty desert environment');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async () => {
        if (!prompt) {
            setError('Prompt cannot be empty.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setImageUrl(null);
        try {
            const result = await generateConceptArt(prompt);
            setImageUrl(result);
        } catch (err) {
            const e = err as Error
            setError(e.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, [prompt]);

    return (
        <div className="hud-border bg-black/50 backdrop-blur-sm p-6 md:p-8">
            <h2 className="text-2xl font-orbitron font-bold text-shadow-cyan mb-6 tracking-widest border-b-2 border-[#00ffc6]/30 pb-3">CONCEPT ART GENERATOR</h2>
            
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <input 
                    type="text" 
                    value={prompt} 
                    onChange={(e) => setPrompt(e.target.value)} 
                    placeholder="Enter a detailed description..."
                    className="flex-grow bg-black/70 border border-[#00ffc6]/50 p-3 text-white focus:ring-2 focus:ring-[#00ffc6] focus:outline-none"
                />
                <button onClick={handleGenerate} disabled={isLoading} className="bg-[#00ffc6] text-black font-bold py-3 px-8 hover:bg-white transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed uppercase font-orbitron">
                    {isLoading ? 'Generating...' : 'Generate Art'}
                </button>
            </div>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}

            <div className="mt-8 border border-[#00ffc6]/30 min-h-[400px] bg-black/30 relative flex justify-center items-center">
                {isLoading && <LoadingSpinner />}
                {imageUrl && <img src={imageUrl} alt={prompt} className="object-contain max-w-full max-h-[70vh] p-2" />}
                {!isLoading && !imageUrl && <p className="text-gray-500 text-center">Concept art will be displayed here.</p>}
            </div>
        </div>
    );
};
