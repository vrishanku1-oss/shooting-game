
import React, { useState, useCallback } from 'react';
import { MissionType, Environment } from '../types';
import { generateMissionBriefing } from '../services/geminiService';

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center space-x-2">
        <div className="w-4 h-4 rounded-full bg-[#00ffc6] animate-pulse"></div>
        <div className="w-4 h-4 rounded-full bg-[#00ffc6] animate-pulse [animation-delay:0.2s]"></div>
        <div className="w-4 h-4 rounded-full bg-[#00ffc6] animate-pulse [animation-delay:0.4s]"></div>
        <span className="ml-3 font-roboto-mono">GENERATING INTEL...</span>
    </div>
);

export const MissionGenerator: React.FC = () => {
    const [missionType, setMissionType] = useState<MissionType>(MissionType.ELIMINATION);
    const [environment, setEnvironment] = useState<Environment>(Environment.URBAN);
    const [briefing, setBriefing] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setBriefing('');
        try {
            const result = await generateMissionBriefing({ type: missionType, environment });
            setBriefing(result);
        } catch (err) {
            const e = err as Error
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [missionType, environment]);

    const renderBriefing = (text: string) => {
        return text.split('\n').map((line, index) => {
            if (line.startsWith('MISSION NAME:') || line.startsWith('BACKGROUND:') || line.startsWith('PRIMARY OBJECTIVES:') || line.startsWith('SECONDARY OBJECTIVES:') || line.startsWith('INTEL:') || line.startsWith('EXTRACTION:')) {
                return <p key={index} className="mt-4 mb-1 text-[#00ffc6] font-bold font-orbitron uppercase tracking-wider">{line}</p>;
            }
            if (line.trim().match(/^\d+\./)) {
                return <p key={index} className="ml-4 text-gray-300">{line}</p>;
            }
            return <p key={index} className="text-gray-300">{line}</p>;
        });
    };

    return (
        <div className="hud-border bg-black/50 backdrop-blur-sm p-6 md:p-8">
            <h2 className="text-2xl font-orbitron font-bold text-shadow-cyan mb-6 tracking-widest border-b-2 border-[#00ffc6]/30 pb-3">MISSION GENERATOR</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="flex flex-col">
                    <label htmlFor="missionType" className="mb-2 text-sm font-bold uppercase text-[#00ffc6]/80">Mission Type</label>
                    <select id="missionType" value={missionType} onChange={(e) => setMissionType(e.target.value as MissionType)} className="bg-black/70 border border-[#00ffc6]/50 p-2 text-white focus:ring-2 focus:ring-[#00ffc6] focus:outline-none">
                        {Object.values(MissionType).map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                <div className="flex flex-col">
                    <label htmlFor="environment" className="mb-2 text-sm font-bold uppercase text-[#00ffc6]/80">Environment</label>
                    <select id="environment" value={environment} onChange={(e) => setEnvironment(e.target.value as Environment)} className="bg-black/70 border border-[#00ffc6]/50 p-2 text-white focus:ring-2 focus:ring-[#00ffc6] focus:outline-none">
                        {Object.values(Environment).map(env => <option key={env} value={env}>{env}</option>)}
                    </select>
                </div>
                <button onClick={handleGenerate} disabled={isLoading} className="md:self-end bg-[#00ffc6] text-black font-bold py-2 px-6 hover:bg-white transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed uppercase font-orbitron">
                    {isLoading ? 'Generating...' : 'Generate Mission'}
                </button>
            </div>

            <div className="mt-8 p-4 border border-[#00ffc6]/30 min-h-[300px] bg-black/30">
                {isLoading && <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>}
                {error && <p className="text-red-500">{error}</p>}
                {briefing && <div className="font-roboto-mono whitespace-pre-wrap">{renderBriefing(briefing)}</div>}
                {!isLoading && !briefing && <p className="text-gray-500 text-center pt-20">Awaiting mission parameters...</p>}
            </div>
        </div>
    );
};
