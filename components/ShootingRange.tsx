
import React, { useState, useCallback, useEffect } from 'react';
import { Weapon } from '../types';
import { generateWeaponDescription } from '../services/geminiService';

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-[#00ffc6] animate-pulse"></div>
        <div className="w-2 h-2 rounded-full bg-[#00ffc6] animate-pulse [animation-delay:0.2s]"></div>
        <div className="w-2 h-2 rounded-full bg-[#00ffc6] animate-pulse [animation-delay:0.4s]"></div>
        <span className="ml-2 font-roboto-mono text-sm">LOADING WEAPON DATA...</span>
    </div>
);


export const ShootingRange: React.FC = () => {
    const [selectedWeapon, setSelectedWeapon] = useState<Weapon>(Weapon.MK18);
    const [description, setDescription] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchWeaponData = useCallback(async (weapon: Weapon) => {
        setIsLoading(true);
        setError(null);
        setDescription('');
        try {
            const result = await generateWeaponDescription(weapon);
            setDescription(result);
        } catch (err) {
            const e = err as Error
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWeaponData(selectedWeapon);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedWeapon]);

    return (
        <div className="hud-border bg-black/50 backdrop-blur-sm p-6 md:p-8">
            <h2 className="text-2xl font-orbitron font-bold text-shadow-cyan mb-6 tracking-widest border-b-2 border-[#00ffc6]/30 pb-3">ARMORY & SHOOTING RANGE</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Weapon Selection */}
                <div className="md:col-span-1">
                    <h3 className="text-lg font-orbitron mb-4">SELECT WEAPON</h3>
                    <div className="flex flex-col space-y-2">
                        {Object.values(Weapon).map(weapon => (
                            <button 
                                key={weapon} 
                                onClick={() => setSelectedWeapon(weapon)}
                                className={`w-full text-left p-3 transition-colors duration-200 border-l-4
                                ${selectedWeapon === weapon 
                                    ? 'bg-[#00ffc6]/20 border-[#00ffc6]' 
                                    : 'bg-black/50 border-transparent hover:bg-[#00ffc6]/10'}`}
                            >
                                {weapon}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Description Display */}
                <div className="md:col-span-3">
                    <h3 className="text-lg font-orbitron mb-4 uppercase">Weapon Dossier: {selectedWeapon}</h3>
                    <div className="mt-2 p-4 border border-[#00ffc6]/30 min-h-[300px] bg-black/30 font-roboto-mono text-gray-300 leading-relaxed">
                        {isLoading && <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="text-red-500">{error}</p>}
                        {description && !isLoading && <p className="whitespace-pre-wrap">{description}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
