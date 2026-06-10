import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import type { CapybaraAnimation } from '@/types/game';

// Vite 会处理这个 import 并生成正确的路径（带 base path）
import capybaraModel from '@/assets/capybara.glb?url';

interface CapybaraModelProps {
  animation: CapybaraAnimation;
  onClick?: () => void;
  scale?: number;
  furColor?: string;
  accessories?: string[];
}

// ============================================
// GLB Model - imperative loading with full error handling and debug
// ============================================

function GLBCapybara({ animation, onClick, scale = 1 }: {
  animation: CapybaraAnimation;
  onClick?: () => void;
  scale?: number;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new GLTFLoader();

    console.log('[GLB] Starting to load:', capybaraModel);

    loader.load(
      capybaraModel,
      (gltf) => {
        if (cancelled) return;

        console.log('[GLB] Loaded successfully!');

        // Log model info for debugging
        const box = new THREE.Box3().setFromObject(gltf.scene);
        console.log('[GLB] Bounding box:', {
          min: [box.min.x.toFixed(2), box.min.y.toFixed(2), box.min.z.toFixed(2)],
          max: [box.max.x.toFixed(2), box.max.y.toFixed(2), box.max.z.toFixed(2)],
          size: [
            (box.max.x - box.min.x).toFixed(2),
            (box.max.y - box.min.y).toFixed(2),
            (box.max.z - box.min.z).toFixed(2)
          ],
          center: [
            ((box.max.x + box.min.x) / 2).toFixed(2),
            ((box.max.y + box.min.y) / 2).toFixed(2),
            ((box.max.z + box.min.z) / 2).toFixed(2)
          ]
        });

        // Log materials
        const materials: string[] = [];
        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.material) {
              materials.push(child.material.type);
              child.castShadow = true;
              child.receiveShadow = true;
            }
          }
        });
        console.log('[GLB] Materials:', materials);
        console.log('[GLB] Children count:', gltf.scene.children.length);

        // Store the model
        setModel(gltf.scene);
      },
      (progress) => {
        if (progress.total > 0) {
          console.log(`[GLB] Loading: ${(progress.loaded / progress.total * 100).toFixed(0)}%`);
        }
      },
      (err) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[GLB] Load error:', msg);
        setError(msg);
      }
    );

    return () => { cancelled = true; };
  }, []);

  // Animation frame updates
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

  if (error) {
    console.warn('[GLB] Failed to load:', error);
    return null;
  }

  if (!model) {
    return null; // Still loading - show nothing until ready
  }

  console.log('[GLB] Rendering model with scale:', scale * 0.8);

  return (
    <group ref={groupRef} onClick={handleClick}>
      <primitive object={model} scale={scale * 0.8} />
    </group>
  );
}

// ============================================
// Main Export
// ============================================

export function CapybaraModelWithFallback(props: CapybaraModelProps) {
  return <GLBCapybara {...props} />;
}
