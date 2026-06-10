import { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import type { CapybaraAnimation } from '@/types/game';

import capybaraModel from '@/assets/capybara.glb?url';

interface CapybaraModelProps {
  animation: CapybaraAnimation;
  onClick?: () => void;
  scale?: number;
  furColor?: string;
  accessories?: string[];
}

// jsDelivr CDN mirrors GitHub files - much faster in China
const GLB_CDN_URL = 'https://cdn.jsdelivr.net/gh/jamin1107/capybara-zoo@main/src/assets/capybara.glb';

function GLBCapybara({ animation, onClick, scale = 1 }: {
  animation: CapybaraAnimation;
  onClick?: () => void;
  scale?: number;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number;

    const tryLoad = (url: string, isRetry: boolean = false) => {
      const loader = new GLTFLoader();

      // Timeout: abort if loading takes > 15 seconds
      timeoutId = window.setTimeout(() => {
        if (!cancelled) {
          if (!isRetry) {
            console.warn('[GLB] Load timeout, trying CDN fallback');
            tryLoad(GLB_CDN_URL, true);
          } else {
            console.error('[GLB] CDN also timed out');
            setLoadError(true);
          }
        }
      }, 15000);

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
        (err) => {
          clearTimeout(timeoutId);
          if (cancelled) return;
          if (!isRetry) {
            console.warn('[GLB] Primary load failed, trying CDN:', err);
            tryLoad(GLB_CDN_URL, true);
          } else {
            console.error('[GLB] All load attempts failed:', err);
            setLoadError(true);
          }
        }
      );
    };

    tryLoad(capybaraModel);
    return () => { cancelled = true; clearTimeout(timeoutId); };
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

  if (loadError) {
    return (
      <group ref={groupRef} onClick={handleClick}>
        <mesh castShadow position={[0, 0.5, 0]}>
          <boxGeometry args={[0.6, 0.5, 1.0]} />
          <meshStandardMaterial color="#8B5E3C" />
        </mesh>
        <mesh castShadow position={[0, 0.85, 0.35]}>
          <boxGeometry args={[0.4, 0.35, 0.35]} />
          <meshStandardMaterial color="#8B5E3C" />
        </mesh>
        <mesh castShadow position={[0, 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.12, 0.3, 4, 8]} />
          <meshStandardMaterial color="#6B4E2C" />
        </mesh>
      </group>
    );
  }

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
