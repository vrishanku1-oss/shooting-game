import React from 'react';

interface HUDProps {
    ammo: number;
    reserveAmmo: number;
    health: number;
    maxHealth: number;
}

export const HUD: React.FC<HUDProps> = ({ ammo, reserveAmmo, health, maxHealth }) => {
    const healthPercentage = maxHealth > 0 ? (health / maxHealth) * 100 : 0;

    return (
        <header className="fixed top-0 left-0 right-0 z-50 p-4 pointer-events-none">
            <div className="flex justify-between items-center">
                <h1 className="text-xl md:text-2xl font-orbitron font-bold text-shadow-cyan tracking-widest">
                    TAC-OPS
                </h1>
            </div>

            {/* Bottom HUD elements */}
            <div className="fixed bottom-8 left-4 right-4 flex justify-between items-end text-[#00ffc6]">
                {/* Left side: Controls */}
                <div className="hud-border bg-black/50 p-3 relative hidden md:block text-xs uppercase">
                    <p><span className="font-bold">WASD</span> - Move</p>
                    <p><span className="font-bold">Space</span> - Jump</p>
                    <p><span className="font-bold">Shift</span> - Crouch</p>
                    <p><span className="font-bold">Mouse</span> - Look</p>
                    <p><span className="font-bold">LMB</span> - Shoot</p>
                    <p><span className="font-bold">RMB</span> - Aim</p>
                    <p><span className="font-bold">R</span> - Reload</p>
                </div>
                
                {/* Right side: Health/Ammo */}
                <div className="flex flex-col items-end space-y-4">
                    <div className="hud-border bg-black/50 p-2 w-48 text-right">
                        <p className="text-xs opacity-70 font-roboto-mono">AMMO</p>
                        <p className="text-4xl font-orbitron">
                            {ammo}<span className="text-xl opacity-70"> / {reserveAmmo}</span>
                        </p>
                    </div>
                    <div className="hud-border bg-black/50 p-2 w-64 text-right">
                        <p className="text-xs opacity-70 font-roboto-mono">HEALTH</p>
                        <div className="w-full bg-[#00ffc6]/10 h-6 mt-1">
                            <div className="bg-[#00ffc6] h-6 transition-all duration-300" style={{ width: `${healthPercentage}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};