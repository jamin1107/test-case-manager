import { useRef, useCallback, useMemo, useState, Component, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { Environment } from './Environment';
import { CapybaraModelWithFallback } from './CapybaraModel';
import { Decoration3D } from './Decoration3D';
import { SnowParticles } from './SnowParticles';
import { FarmScene } from './FarmScene';
import { DayNightCycle } from './DayNightCycle';
import { WeatherEffects } from './WeatherEffects';
import { Toy3D } from './Toy3D';
import { DEFAULT_TOYS } from '@/store/gameStore';

// Error Boundary to prevent Canvas crash from GLTF loading errors
class CanvasErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
          <div className="text-center text-white">
            <p className="text-xl font-bold mb-2">渲染出错</p>
            <p className="text-sm text-gray-400">{this.state.error}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Stars effect for night background */
function StarsEffect() {
  const starsRef = useRef<THREE.Points>(null);

  const starPositions = useMemo(() => {
    const positions = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5;
      const r = 40 + Math.random() * 10;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) + 5;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.y = state.clock.getElapsedTime() * 0.01;
    }
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={300}
          array={starPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color="#FFFFFF"
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

/** Click handler for placing decorations */
function DecorationGroundClickHandler() {
  const selectedDecorationId = useGameStore((state) => state.selectedDecorationId);
  const placeDecoration = useGameStore((state) => state.placeDecoration);

  const handleClick = useCallback((e: any) => {
    if (!selectedDecorationId) return;
    e.stopPropagation();
    placeDecoration(selectedDecorationId, [e.point.x, 0, e.point.z]);
  }, [selectedDecorationId, placeDecoration]);

  if (!selectedDecorationId) return null;

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.002, 0]}
      onClick={handleClick}
    >
      <circleGeometry args={[20, 32]} />
      <meshStandardMaterial transparent opacity={0} />
    </mesh>
  );
}

/** Click handler for throwing toys */
function ToyThrowClickHandler() {
  const throwToy = useGameStore((state) => state.throwToy);
  const [throwingToyId, setThrowingToyId] = useState<string | null>(null);

  const handleClick = useCallback((e: any) => {
    if (!throwingToyId) return;
    e.stopPropagation();
    throwToy(throwingToyId, [e.point.x, 0, e.point.z]);
    setThrowingToyId(null);
  }, [throwingToyId, throwToy]);

  if (!throwingToyId) return null;

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.001, 0]}
      onClick={handleClick}
    >
      <circleGeometry args={[20, 32]} />
      <meshStandardMaterial transparent opacity={0} />
    </mesh>
  );
}

/** Click handler for placing food */
function GroundClickHandler() {
  const placeFood = useGameStore((state) => state.placeFood);
  const selectedFoodId = useGameStore((state) => state.selectedFoodId);

  const handleClick = useCallback((e: any) => {
    if (!selectedFoodId) return;
    e.stopPropagation();
    placeFood([e.point.x, 0, e.point.z]);
  }, [selectedFoodId, placeFood]);

  if (!selectedFoodId) return null;

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.001, 0]}
      onClick={handleClick}
    >
      <circleGeometry args={[20, 32]} />
      <meshStandardMaterial transparent opacity={0} />
    </mesh>
  );
}

/** Background color overlay that responds to day/night cycle */
function SkyOverlay() {
  const gameHour = useGameStore((state) => state.gameHour);

  const getSkyColor = () => {
    const h = gameHour;
    if (h >= 21 || h < 5) return '#0a0a2e';
    if (h < 6) return '#3a2a5e';
    if (h < 8) return '#FF8C42';
    if (h < 17) return '#87CEEB';
    if (h < 19) return '#FF6B35';
    if (h < 21) return '#4a2a6e';
    return '#87CEEB';
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none transition-colors duration-[3000ms]"
      style={{ background: getSkyColor(), opacity: 0.15 }}
    />
  );
}

export function GameScene() {
  const capybaras = useGameStore((state) => state.capybaras);
  const selectCapybara = useGameStore((state) => state.selectCapybara);
  const foodOnGround = useGameStore((state) => state.foodOnGround);
  const decorations = useGameStore((state) => state.decorations);
  const toysInScene = useGameStore((state) => state.toysInScene);
  const placedDecorations = useMemo(
    () => decorations.filter((d) => d.position),
    [decorations]
  );
  const toyDataMap = useMemo(() => {
    const map: Record<string, string> = {};
    DEFAULT_TOYS.forEach((t) => { map[t.id] = t.type; });
    return map;
  }, []);

  return (
    <div className="absolute inset-0">
      <CanvasErrorBoundary>
        <Canvas
          shadows
          camera={{ position: [8, 6, 8], fov: 50, near: 0.1, far: 100 }}
          gl={{ antialias: true }}
          style={{ background: '#87CEEB' }}
        >
          {/* Sky background - will be updated by DayNightCycle */}
          <color attach="background" args={['#87CEEB']} />
          {/* Day/Night Cycle - controls all lighting */}
          <DayNightCycle />

          {/* Weather Effects */}
          <WeatherEffects />

          {/* Environment */}
          <Environment />

          {/* AI Controller */}
          <CapybaraAI />

          {/* Night stars - shown during night hours */}
          <NightStars />

          {/* Snow particles */}
          <SnowConditional />

          {/* Ground click handlers */}
          <GroundClickHandler />
          <DecorationGroundClickHandler />
          <ToyThrowClickHandler />

          {/* Food on ground */}
          {foodOnGround.map((food) => (
            <FoodItem
              key={food.id}
              position={food.position}
              icon={food.icon}
              foodId={food.id}
            />
          ))}

          {/* Toys in scene */}
          {toysInScene.map((toy) => {
            const type = toyDataMap[toy.toyId] || 'ball';
            return (
              <Toy3D
                key={toy.id}
                id={toy.id}
                type={type as any}
                position={toy.position}
              />
            );
          })}

          {/* Placed decorations */}
          {placedDecorations.map((decoration) => (
            <Decoration3D
              key={decoration.id}
              model={decoration.model}
              position={decoration.position!}
            />
          ))}

          {/* Capybaras */}
          {capybaras.map((capybara) => (
            <group
              key={capybara.id}
              position={capybara.position}
              rotation-y={capybara.rotation || 0}
            >
              <CapybaraModelWithFallback
                animation={capybara.currentAnimation}
                onClick={() => selectCapybara(capybara.id)}
                scale={getScaleForGrowthStage(capybara.growthStage)}
                furColor={capybara.furColor}
                accessories={capybara.accessories}
              />
            </group>
          ))}

          {/* Farm grid */}
          <FarmScene />

          {/* Post-processing */}
          <PostProcessingEffects />

          {/* Camera controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={25}
            maxPolarAngle={Math.PI / 2.2}
            target={[0, 0, 0]}
          />
        </Canvas>
      </CanvasErrorBoundary>

      {/* Sky overlay for background tint */}
      <SkyOverlay />
    </div>
  );
}

function getScaleForGrowthStage(stage: string): number {
  switch (stage) {
    case 'baby': return 0.3;
    case 'teen': return 0.45;
    case 'adult': return 0.6;
    default: return 0.6;
  }
}

/** AI loop - updates capybaras each frame */
function CapybaraAI() {
  const updateCapybarasAI = useGameStore((state) => state.updateCapybarasAI);

  useFrame((state, delta) => {
    updateCapybarasAI(delta);
  });

  return null;
}

/** Food item on the ground */
function FoodItem({ position, icon, foodId }: { position: [number, number, number]; icon: string; foodId: string }) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.5;
      groupRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 2) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <circleGeometry args={[0.3, 16]} />
        <meshStandardMaterial color={0xffffff} transparent opacity={0.3} />
      </mesh>
      <Text
        position={[0, 0.25, 0]}
        fontSize={0.5}
        color="#333"
        anchorX="center"
        anchorY="middle"
      >
        {icon}
      </Text>
    </group>
  );
}

/** Stars effect - shown at night based on game time */
function NightStars() {
  const gameHour = useGameStore((state) => state.gameHour);
  const isNight = gameHour >= 19 || gameHour < 6;

  if (!isNight) return null;

  const starsRef = useRef<THREE.Points>(null);

  const starPositions = useMemo(() => {
    const positions = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5;
      const r = 40 + Math.random() * 10;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) + 5;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.y = state.clock.getElapsedTime() * 0.01;
    }
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={300}
          array={starPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color="#FFFFFF"
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

/** Snow particles - conditional based on background */
function SnowConditional() {
  const currentBackground = useGameStore((state) => state.currentBackground);
  if (currentBackground !== 'snow') return null;
  return <SnowParticles />;
}

/** Post-processing effects */
function PostProcessingEffects() {
  const gameHour = useGameStore((state) => state.gameHour);

  const bloomConfig = useMemo(() => {
    const h = gameHour;
    if (h >= 21 || h < 5) return { intensity: 0.35, threshold: 0.2 };
    if (h < 7) return { intensity: 0.3, threshold: 0.4 };
    if (h < 17) return { intensity: 0.15, threshold: 0.8 };
    if (h < 20) return { intensity: 0.25, threshold: 0.5 };
    return { intensity: 0.35, threshold: 0.3 };
  }, [gameHour]);

  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={bloomConfig.threshold}
        luminanceSmoothing={0.9}
        intensity={bloomConfig.intensity}
      />
    </EffectComposer>
  );
}
