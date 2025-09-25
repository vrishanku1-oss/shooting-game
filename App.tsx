import React, { useState } from 'react';
import { HUD } from './components/HUD';
import { Game } from './components/Game';

const MAX_PLAYER_HEALTH = 500;

const App: React.FC = () => {
  const [ammo, setAmmo] = useState(30);
  const [reserveAmmo, setReserveAmmo] = useState(120);
  const [isReloading, setIsReloading] = useState(false);
  const [playerHealth, setPlayerHealth] = useState(MAX_PLAYER_HEALTH);

  const handleRestart = () => {
    setAmmo(30);
    setReserveAmmo(120);
    setIsReloading(false);
    setPlayerHealth(MAX_PLAYER_HEALTH);
    // This is a bit of a hack to force the Game component to re-mount
    setGameKey(prev => prev + 1);
  };

  const [gameKey, setGameKey] = useState(0);


  return (
    <div className="relative min-h-screen w-full bg-black text-[#00ffc6] font-roboto-mono overflow-hidden">
      <Game 
        key={gameKey} // Re-mounts the component when key changes
        setAmmo={setAmmo} 
        setReserveAmmo={setReserveAmmo} 
        ammo={ammo}
        reserveAmmo={reserveAmmo}
        isReloading={isReloading}
        setIsReloading={setIsReloading}
        playerHealth={playerHealth}
        setPlayerHealth={setPlayerHealth}
      />
      <HUD 
        ammo={ammo} 
        reserveAmmo={reserveAmmo} 
        health={playerHealth}
        maxHealth={MAX_PLAYER_HEALTH}
      />
      {isReloading && <div className="reloading-text">RELOADING...</div>}
      {playerHealth <= 0 && (
          <div className="fixed inset-0 bg-black/80 flex flex-col justify-center items-center z-[1000]">
              <h2 className="text-5xl font-orbitron text-red-500">MISSION FAILED</h2>
              <button 
                onClick={handleRestart}
                className="mt-8 bg-red-500 text-black font-bold py-3 px-8 hover:bg-white transition-colors duration-300 uppercase font-orbitron"
              >
                RESTART
              </button>
          </div>
      )}
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-black/50 backdrop-blur-sm p-2 text-center text-xs text-[#00ffc6]/50 font-roboto-mono">
        <p>TACTICAL OPERATIONS SIMULATOR [v4.0 PROTOTYPE] - FOR SIMULATION PURPOSES ONLY</p>
      </footer>
    </div>
  );
};

export default App;