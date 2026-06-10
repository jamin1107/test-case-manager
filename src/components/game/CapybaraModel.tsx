import { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import type { CapybaraAnimation } from '@/types/game';

interface CapybaraModelProps {
  animation: CapybaraAnimation;
  onClick?: () => void;
  scale?: number;
  furColor?: string;
  accessories?: string[];
}

// Stable path: GLB in public/ directory (no hash)
const GLB_PUBLIC_PATH = `${import.meta.env.BASE_URL}capybara.glb`;
// jsDelivr CDN as fallback (faster in China)
const GLB_CDN_URL = 'https://cdn.jsdelivr.net/gh/jamin1107/capybara-zoo@main/public/capybara.glb';

function GLBCapybara({ animation, onClick, scale = 1 }: {
  animation: CapybaraAnimation;
  onClick?: () => void;
  scale?: number;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const [model, setModel] = useState<THREE.Object3D | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new GLTFLoader();

    const tryLoad = (url: string) => {
      let timeoutId: number;

      const clearAndRetry = () => {
        clearTimeout(timeoutId);
        if (cancelled) return;
        // Try CDN as fallback after 60s
        if (url === GLB_PUBLIC_PATH) {
          console.warn('[GLB] Primary source timeout, trying CDN');
          tryLoad(GLB_CDN_URL);
        }
      };

      timeoutId = window.setTimeout(clearAndRetry, 60000);

      loader.load(
        url,
        (gltf) => {
          clearTimeout(timeoutId);
          if (cancelled) return;
          gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          setModel(gltf.scene);
        },
        undefined,
        () => {
          clearTimeout(timeoutId);
          if (cancelled) return;
          if (url === GLB_PUBLIC_PATH) {
            console.warn('[GLB] Primary load failed, trying CDN');
            tryLoad(GLB_CDN_URL);
          } else {
            console.error('[GLB] CDN failed, retrying in 3s');
            setTimeout(() => tryLoad(GLB_CDN_URL), 3000);
          }
        }
      );
    };

    tryLoad(GLB_PUBLIC_PATH);
    return () => { cancelled = true; };
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const g = groupRef.current;
    if (!g) return;

    if (animation === 'walking' || animation === 'running') {
      const speed = animation === 'running' ? 8 : 4;
      g.position.y += Math.sin(t * speed) * 0.008;
    }
    if (animation === 'happy') {
      g.position.y = Math.abs(Math.sin(t * 6)) * 0.12;
      g.rotation.y += Math.sin(t * 3) * 0.02;
    }
    if (animation === 'idle' || animation === 'resting') {
      g.position.y += Math.sin(t * 1.5) * 0.003;
    }
    if (animation === 'resting') {
      g.position.y = THREE.MathUtils.lerp(g.position.y, -0.05, delta * 3);
    }
    if (animation === 'sleeping') {
      g.position.y = THREE.MathUtils.lerp(g.position.y, -0.08, delta * 3);
    }
  });

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    onClick?.();
  }, [onClick]);

  if (!model) return null;

  return (
    <group ref={groupRef} onClick={handleClick}>
      <primitive object={model} scale={scale * 0.8} />
    </group>
  );
}

export function CapybaraModelWithFallback(props: CapybaraModelProps) {
  return <GLBCapybara {...props} />;
}
