
import { GoogleGenAI } from "@google/genai";
import type { MissionParams } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMissionBriefing = async (params: MissionParams): Promise<string> => {
    try {
        const prompt = `
            You are a creative director for a hyper-realistic tactical FPS game called 'Tactical Ops'.
            Generate a compelling and detailed mission briefing.

            Mission Type: ${params.type}
            Environment: ${params.environment}

            The briefing should include the following sections, clearly marked:
            - MISSION NAME: A cool, tactical-sounding name.
            - BACKGROUND: A paragraph setting the scene and explaining the strategic importance.
            - PRIMARY OBJECTIVES: A clear, numbered list of main goals.
            - SECONDARY OBJECTIVES: An optional list of bonus goals.
            - INTEL: Information on expected enemy presence, their equipment, and potential environmental hazards.
            - EXTRACTION: A brief on the exfiltration plan.

            Format the response as clean text. Be creative and immersive.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error generating mission briefing:", error);
        return "ERROR: Failed to communicate with command. Tactical network may be down. Please try again.";
    }
};

export const generateConceptArt = async (prompt: string): Promise<string> => {
     try {
        const fullPrompt = `High-fidelity, ultra-realistic concept art for a modern military shooter game, cinematic lighting, 8k, hyperdetailed: ${prompt}`;
        
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: fullPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
            throw new Error("No image was generated.");
        }
    } catch (error) {
        console.error("Error generating concept art:", error);
        throw new Error("Failed to generate visual data. Check connection to art department servers.");
    }
};


export const generateWeaponDescription = async (weaponName: string): Promise<string> => {
    try {
        const prompt = `
            You are a weapons expert and armorer for a realistic military simulation game.
            Describe the experience of firing a ${weaponName} at a shooting range.
            Focus on its recoil profile, the sound it makes (loud crack vs. deep boom), the mechanical process of reloading, its effective range, and its ideal combat scenario.
            Keep the description concise (2-3 paragraphs), immersive, and technical.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error generating weapon description:", error);
        return "ERROR: Could not retrieve weapon data from armory database.";
    }
};
