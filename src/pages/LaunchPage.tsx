import { useState, useCallback, useEffect } from 'react';
import { GLTFLoader } from 'three-stdlib';

interface LaunchPageProps {
  onStart: () => void;
}

const GLB_PUBLIC_PATH = `${import.meta.env.BASE_URL}capybara.glb`;
const GLB_CDN_URL = 'https://cdn.jsdelivr.net/gh/jamin1107/capybara-zoo@main/public/capybara.glb';

export function LaunchPage({ onStart }: LaunchPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [speedTestDone, setSpeedTestDone] = useState(false);

  // Speed test: compare GitHub Pages vs jsDelivr CDN
  useEffect(() => {
    const testSpeed = async () => {
      const results: { name: string; url: string; ms: number }[] = [];

      for (const { name, url } of [
        { name: 'GitHub Pages', url: GLB_PUBLIC_PATH },
        { name: 'jsDelivr CDN', url: GLB_CDN_URL },
      ]) {
        try {
          const start = performance.now();
          await fetch(url, { method: 'HEAD' });
          results.push({ name, url, ms: Math.round(performance.now() - start) });
        } catch {
          results.push({ name, url, ms: Infinity });
        }
      }

      const faster = results.reduce((a, b) => (a.ms < b.ms ? a : b));
      console.log('[GLB Speed Test]', results, '→ Winner:', faster.name, faster.ms, 'ms');
      setGlbUrl(faster.url);
      setSpeedTestDone(true);
    };

    testSpeed();
  }, []);

  const loadModel = useCallback((url: string, onComplete: () => void) => {
    const loader = new GLTFLoader();
    setStatusText('正在加载卡皮巴拉模型...');
    setProgress(0);

    let timeoutId: number;

    const tryLoad = () => {
      timeoutId = window.setTimeout(() => {
        console.warn('[GLB] Load timeout after 60s, retrying...');
        tryLoad();
      }, 60000);

      loader.load(
        url,
        () => {
          clearTimeout(timeoutId);
          setProgress(100);
          setStatusText('加载完成！即将进入游戏...');
          setTimeout(() => onComplete(), 600);
        },
        (xhr) => {
          if (xhr.total > 0) {
            const pct = Math.round((xhr.loaded / xhr.total) * 100);
            setProgress(pct);
            if (pct < 30) setStatusText('正在下载模型数据...');
            else if (pct < 70) setStatusText('正在解析3D模型...');
            else setStatusText('即将完成...');
          }
        },
        () => {
          clearTimeout(timeoutId);
          console.warn('[GLB] Load failed, retrying in 3s...');
          setStatusText('加载失败，正在重试...');
          setTimeout(tryLoad, 3000);
        }
      );
    };

    tryLoad();
    return () => { clearTimeout(timeoutId); };
  }, []);

  const handleStart = useCallback(() => {
    setIsLoading(true);
    const url = glbUrl || GLB_PUBLIC_PATH; // fallback to GitHub Pages if test not done yet
    loadModel(url, () => {
      onStart();
    });
  }, [onStart, glbUrl, loadModel]);

  return (
    <div className="absolute inset-0 overflow-hidden select-none">
      {/* Splash image */}
      <div className="absolute inset-0">
        <img
          src={`${import.meta.env.BASE_URL}splash.png`}
          alt="卡皮巴拉养成记"
          className="w-full h-full object-cover"
        />
        {/* Mask bottom-right "豆包AI生成" */}
        <div
          className="absolute bottom-0 right-0 w-28 h-8"
          style={{
            background: 'linear-gradient(to top left, rgba(110,170,90,0.95) 0%, rgba(110,170,90,0.95) 60%, transparent 100%)',
          }}
        />
      </div>

      {/* Bottom area - moved up to avoid covering "制作人: jamin" in the image */}
      <div className="absolute bottom-[18%] left-0 right-0 z-20 flex flex-col items-center">
        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={isLoading}
          className="relative px-16 py-4 text-white text-2xl md:text-3xl font-bold rounded-full transition-all duration-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(180deg, #FFD54F 0%, #FFA726 50%, #FF8F00 100%)',
            boxShadow: '0 4px 0 #E65100, 0 6px 20px rgba(0,0,0,0.25)',
            textShadow: '1px 2px 2px rgba(0,0,0,0.3)',
            border: '2px solid rgba(255,255,255,0.3)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 0 #E65100, 0 10px 24px rgba(0,0,0,0.3)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 0 #E65100, 0 6px 20px rgba(0,0,0,0.25)';
          }}
        >
          {isLoading ? '加载中...' : '开始游戏'}
        </button>

        {/* Loading progress */}
        {isLoading && (
          <div className="mt-4 w-72 text-center">
            <p className="text-sm text-white/90 mb-2 font-medium drop-shadow">{statusText}</p>
            <div className="w-full h-4 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #66BB6A, #43A047)',
                  boxShadow: '0 0 10px rgba(76,175,80,0.5)',
                }}
              />
            </div>
            <p className="text-xs text-white/70 mt-1">{progress}%</p>
          </div>
        )}
      </div>
    </div>
  );
}
