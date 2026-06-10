import { useState, useCallback } from 'react';
import { GLTFLoader } from 'three-stdlib';
import capybaraModel from '@/assets/capybara.glb?url';

interface LaunchPageProps {
  onStart: () => void;
}

export function LaunchPage({ onStart }: LaunchPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleStart = useCallback(() => {
    setIsLoading(true);
    setProgress(0);

    const loader = new GLTFLoader();
    loader.load(
      capybaraModel,
      () => {
        setProgress(100);
        // 给一个短暂的延迟让用户看到 100% 再进入游戏
        setTimeout(() => {
          onStart();
        }, 500);
      },
      (xhr) => {
        if (xhr.total > 0) {
          setProgress(Math.round((xhr.loaded / xhr.total) * 100));
        }
      },
      () => {
        // 加载失败也进入游戏（场景会显示 fallback 模型）
        setTimeout(() => {
          onStart();
        }, 500);
      }
    );
  }, [onStart]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-sky-400 via-sky-300 to-green-200">
      {/* Background decorative elements */}
      <div className="absolute top-8 left-1/4 w-16 h-8 bg-white/60 rounded-full blur-sm" />
      <div className="absolute top-16 right-1/3 w-24 h-10 bg-white/50 rounded-full blur-sm" />
      <div className="absolute top-24 left-1/3 w-12 h-6 bg-white/40 rounded-full blur-sm" />

      {/* Floating leaves */}
      <div className="absolute top-1/4 left-10 text-2xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
      <div className="absolute top-1/3 right-16 text-xl animate-bounce" style={{ animationDelay: '1s', animationDuration: '2.5s' }}>🍃</div>
      <div className="absolute top-2/3 left-20 text-lg animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}>🍂</div>
      <div className="absolute top-1/2 right-24 text-2xl animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '2.8s' }}>🍃</div>

      {/* Title */}
      <div className="absolute top-16 left-0 right-0 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-amber-800 drop-shadow-lg tracking-wide"
            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.2), -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff' }}>
          卡皮巴拉养成记
        </h1>
      </div>

      {/* Capybara illustration area - use emoji as placeholder */}
      <div className="absolute top-1/3 left-0 right-0 flex justify-center">
        <div className="relative">
          <div className="text-9xl md:text-[10rem] leading-none select-none" style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))' }}>
            
          </div>
          {/* Cute cheeks */}
          <div className="absolute top-1/2 -left-4 w-8 h-5 bg-pink-300/60 rounded-full blur-sm" />
          <div className="absolute top-1/2 -right-4 w-8 h-5 bg-pink-300/60 rounded-full blur-sm" />
        </div>
      </div>

      {/* Ground area with flowers */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="h-32 bg-gradient-to-t from-green-400 to-green-300/80 relative overflow-hidden">
          {/* Grass tufts */}
          <div className="absolute bottom-2 left-1/4 text-green-600 text-lg">🌿</div>
          <div className="absolute bottom-4 left-1/2 text-green-600 text-lg">🌿</div>
          <div className="absolute bottom-3 right-1/4 text-green-600 text-lg"></div>
          <div className="absolute bottom-6 left-1/3 text-green-500">🌱</div>
          <div className="absolute bottom-5 right-1/3 text-green-500">🌱</div>

          {/* Flowers */}
          <div className="absolute bottom-8 left-8 text-xl">🌼</div>
          <div className="absolute bottom-10 left-1/4 text-lg"></div>
          <div className="absolute bottom-12 right-1/4 text-xl">🌼</div>
          <div className="absolute bottom-6 right-8 text-lg"></div>
          <div className="absolute bottom-14 left-1/2 text-sm">🌻</div>
        </div>
      </div>

      {/* Start button */}
      <div className="absolute bottom-40 left-0 right-0 flex flex-col items-center gap-4">
        <button
          onClick={handleStart}
          disabled={isLoading}
          className="relative px-16 py-4 bg-gradient-to-b from-amber-400 to-amber-500 text-white text-2xl font-bold rounded-full shadow-lg hover:from-amber-300 hover:to-amber-400 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
            boxShadow: '0 4px 0 #c47f17, 0 6px 12px rgba(0,0,0,0.2)'
          }}
        >
          {isLoading ? '加载中...' : '开始游戏'}
        </button>

        {/* Loading progress bar */}
        {isLoading && (
          <div className="w-64 h-3 bg-white/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Credits */}
        <p className="text-amber-800/70 text-sm mt-2">
          制作人：jamin
        </p>
      </div>
    </div>
  );
}
