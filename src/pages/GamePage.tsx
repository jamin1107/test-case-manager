import { TopBar } from '@/components/ui/TopBar';
import { FoodPanel } from '@/components/ui/FoodPanel';
import { StatusDetailed } from '@/components/ui/StatusDetailed';
import { ShopPanel } from '@/components/ui/ShopPanel';
import { DecorationPanel } from '@/components/ui/DecorationPanel';
import { FarmPanel } from '@/components/ui/FarmPanel';
import { FarmInfoCard } from '@/components/ui/FarmInfoCard';
import { SaveManager } from '@/components/ui/SaveManager';
import { GameScene } from '@/components/game/GameScene';
import { WeatherWidget } from '@/components/ui/WeatherWidget';
import { ToyPanel } from '@/components/ui/ToyPanel';
import { CommandPanel } from '@/components/ui/CommandPanel';
import { DiseaseIndicator } from '@/components/ui/DiseaseIndicator';
import { CameraSystem } from '@/components/ui/CameraSystem';
import { useGameStore } from '@/store/gameStore';
import { useState, useCallback } from 'react';
import { LaunchPage } from './LaunchPage';

export function GamePage() {
  const farmMode = useGameStore((s) => s.farmMode);
  const [gameStarted, setGameStarted] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);

  const handleGameStart = useCallback(() => {
    setGameStarted(true);
  }, []);

  const toggleCameraMode = useCallback(() => {
    setCameraMode((prev) => !prev);
  }, []);

  const exitCameraMode = useCallback(() => {
    setCameraMode(false);
  }, []);

  // Show launch page until GLB model is loaded
  if (!gameStarted) {
    return <LaunchPage onStart={handleGameStart} />;
  }

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      {/* 3D Scene */}
      <GameScene />

      {/* UI Overlays - hidden in camera mode */}
      {!cameraMode && (
        <>
          <TopBar />
          <WeatherWidget />
          {!farmMode && <FoodPanel />}
          <StatusDetailed />
          <ShopPanel />
          <DecorationPanel />
          <ToyPanel />
          <CommandPanel />
          <DiseaseIndicator />

          {/* Farm UI */}
          {farmMode && <FarmPanel />}
          <FarmInfoCard />

          {/* Save Manager */}
          <SaveManager />
        </>
      )}

      {/* Camera System */}
      <CameraSystem cameraMode={cameraMode} onExit={exitCameraMode} />

      {/* Camera mode toggle button - shown when not in camera mode */}
      {!cameraMode && (
        <div className="absolute bottom-4 right-4 z-50">
          <button
            onClick={toggleCameraMode}
            className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 active:scale-95 transition-all"
            title="拍照模式"
          >
            <span className="text-xl"></span>
          </button>
        </div>
      )}
    </div>
  );
}
