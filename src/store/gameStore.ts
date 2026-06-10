import { create } from 'zustand';
import type { GameStore, Capybara, CapybaraAnimation, FoodOnGround, Decoration, BackgroundType, CropPlot, CropType, FarmTool, SeedItem, CapybaraGrowthStage, CapybaraHealth, WeatherType, WeatherState, Toy, ToyInScene, LearnedCommand, CommandType } from '@/types/game';
import { DEFAULT_FOODS } from '@/utils/foodData';

const DEFAULT_DECORATIONS: Decoration[] = [
  { id: 'mushroom', name: '蘑菇', icon: '🍄', cost: 50, category: 'structure', model: 'mushroom', owned: false },
  { id: 'bench', name: '长椅', icon: '🪑', cost: 80, category: 'furniture', model: 'bench', owned: false },
  { id: 'fountain', name: '喷泉', icon: '⛲', cost: 150, category: 'structure', model: 'fountain', owned: false },
  { id: 'lantern', name: '灯笼', icon: '🏮', cost: 60, category: 'lighting', model: 'lantern', owned: false },
  { id: 'sunflower', name: '向日葵', icon: '🌻', cost: 30, category: 'plant', model: 'sunflower', owned: false },
  { id: 'fence', name: '栅栏', icon: '🏗️', cost: 40, category: 'structure', model: 'fence', owned: false },
];

// 玩具商店
export const DEFAULT_TOYS: Toy[] = [
  { id: 'toy-ball', name: '弹力球', icon: '🎾', type: 'ball', cost: 30, durability: 100, owned: false, inUse: false },
  { id: 'toy-frisbee', name: '飞盘', icon: '🥏', type: 'frisbee', cost: 40, durability: 100, owned: false, inUse: false },
  { id: 'toy-plush', name: '毛绒熊', icon: '🧸', type: 'plush', cost: 50, durability: 100, owned: false, inUse: false },
  { id: 'toy-water_gun', name: '水枪', icon: '🔫', type: 'water_gun', cost: 60, durability: 100, owned: false, inUse: false },
];

// 种子数据
export const SEEDS_DATA: SeedItem[] = [
  { id: 'seed-lettuce', cropType: 'lettuce', name: '生菜', icon: '🥬', growTime: 30, cost: 10, harvestReward: 20, foodId: 'lettuce' },
  { id: 'seed-carrot', cropType: 'carrot', name: '胡萝卜', icon: '🥕', growTime: 45, cost: 15, harvestReward: 30, foodId: 'carrot' },
  { id: 'seed-tomato', cropType: 'tomato', name: '番茄', icon: '🍅', growTime: 60, cost: 20, harvestReward: 45, foodId: 'tomato' },
  { id: 'seed-corn', cropType: 'corn', name: '玉米', icon: '🌽', growTime: 90, cost: 25, harvestReward: 60, foodId: 'corn' },
  { id: 'seed-potato', cropType: 'potato', name: '土豆', icon: '🥔', growTime: 120, cost: 30, harvestReward: 75, foodId: 'potato' },
];

// 种子查找表
const SEED_MAP: Record<CropType, SeedItem> = {
  lettuce: SEEDS_DATA.find(s => s.cropType === 'lettuce')!,
  carrot: SEEDS_DATA.find(s => s.cropType === 'carrot')!,
  tomato: SEEDS_DATA.find(s => s.cropType === 'tomato')!,
  corn: SEEDS_DATA.find(s => s.cropType === 'corn')!,
  potato: SEEDS_DATA.find(s => s.cropType === 'potato')!,
};

// 农场格子初始化 (3行 x 4列)
function createInitialPlots(): CropPlot[] {
  const plots: CropPlot[] = [];
  const spacingX = 1.5; // X方向间距
  const spacingZ = 1.5; // Z方向间距
  const originX = -((4 - 1) * spacingX) / 2;
  const originZ = -((3 - 1) * spacingZ) / 2;
  const baseY = -4; // 在场景中的Z偏移

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const worldX = originX + col * spacingX;
      const worldZ = originZ + row * spacingZ;
      plots.push({
        id: `plot-${row}-${col}`,
        gridPosition: [row, col],
        worldPosition: [worldX, 0, worldZ],
        cropType: null,
        stage: 'seed',
        growthProgress: 0,
        waterLevel: 0,
        fertilized: false,
        plantedAt: 0,
        lastWateredAt: 0,
      });
    }
  }
  return plots;
}

const personalities: Capybara['personality'][] = ['active', 'calm', 'playful', 'lazy'];

const initialCapybaras: Capybara[] = [
  {
    id: 'capy-1',
    name: '麻糬',
    growthStage: 'baby',
    position: [0, 0, 0],
    hunger: 70,
    thirst: 80,
    mood: 80,
    energy: 90,
    cleanliness: 90,
    health: 'healthy',
    age: 5,
    experience: 0,
    level: 1,
    maxExp: 100,
    currentAnimation: 'idle',
    rotation: 0,
    wanderTimer: Math.random() * 5,
    restTimer: 10 + Math.random() * 10,
    furColor: '#8B5E3C',
    accessories: [],
    isCustom: false,
    personality: 'playful',
    weatherReaction: 'none' as const,
    learnedCommands: [],
  },
];

// 场景边界
const BOUNDS = { minX: -8, maxX: 8, minZ: -7, maxZ: 7 };

// 特殊位置
const POND_POSITION: [number, number, number] = [4, 0, 3];
const BED_POSITION: [number, number, number] = [-5, 0, -3];

function getRandomTarget(): [number, number, number] {
  return [
    BOUNDS.minX + Math.random() * (BOUNDS.maxX - BOUNDS.minX),
    0,
    BOUNDS.minZ + Math.random() * (BOUNDS.maxZ - BOUNDS.minZ),
  ];
}

function clampToBounds(pos: [number, number, number]): [number, number, number] {
  return [
    Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, pos[0])),
    pos[1],
    Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, pos[2])),
  ];
}

function distanceTo(pos1: [number, number, number], pos2: [number, number, number]): number {
  const dx = pos1[0] - pos2[0];
  const dz = pos1[2] - pos2[2];
  return Math.sqrt(dx * dx + dz * dz);
}

let foodIdCounter = 0;

// Helper: apply level-up logic to a capybara after gaining experience
function applyLevelUp(c: Capybara): Capybara {
  let capy = { ...c };
  while (capy.experience >= capy.maxExp) {
    capy.experience -= capy.maxExp;
    capy.level += 1;
    capy.maxExp = Math.floor(capy.maxExp * 1.2);
    // Age-based growth stage
    if (capy.age < 15) {
      capy.growthStage = 'baby';
    } else if (capy.age < 40) {
      capy.growthStage = 'teen';
    } else {
      capy.growthStage = 'adult';
    }
  }
  return capy;
}

export const useGameStore = create<GameStore>()((set, get) => ({
  gold: 200,
  capybaras: initialCapybaras,
  unlockedFoods: ['grass'],
  decorations: DEFAULT_DECORATIONS,
  lastTick: Date.now(),
  selectedCapybaraId: null,
  selectedFoodId: null,
  foods: DEFAULT_FOODS,
  shopOpen: false,
  foodOnGround: [],
  currentBackground: 'default',
  decorationPanelOpen: false,
  selectedDecorationId: null,
  // 农场初始状态
  farmMode: false,
  farmPlots: createInitialPlots(),
  selectedTool: null,
  selectedSeed: null,
  selectedPlotId: null,
  // 游戏时间
  gameHour: 8,
  gameMinute: 0,
  // 天气与玩具
  weather: { type: 'sunny' as WeatherType, intensity: 0, duration: 300 },
  ownedToys: [],
  toysInScene: [],

  feedCapybara: (capybaraId: string, foodId: string) => {
    const { capybaras, unlockedFoods, foods, foodOnGround } = get();
    const food = foods.find((f) => f.id === foodId);
    if (!food || !unlockedFoods.includes(foodId)) return;

    // Find and remove nearest food on ground of this type
    const nearestFood = foodOnGround.find((f) => f.foodId === foodId);

    set({
      capybaras: capybaras.map((c) =>
        c.id === capybaraId
          ? applyLevelUp({
              ...c,
              hunger: Math.min(100, c.hunger + food.hungerRestore),
              thirst: Math.min(100, c.thirst + 10),
              mood: Math.min(100, c.mood + food.moodBoost),
              experience: c.experience + 10,
              currentAnimation: 'eating' as const,
            })
          : c
      ),
      gold: get().gold + food.goldReward,
      foodOnGround: nearestFood
        ? foodOnGround.filter((f) => f.id !== nearestFood.id)
        : foodOnGround,
    });

    setTimeout(() => {
      set({
        capybaras: get().capybaras.map((c) =>
          c.id === capybaraId ? { ...c, currentAnimation: 'idle' as const } : c
        ),
      });
    }, 2000);
  },

  interactCapybara: (capybaraId: string, action: 'pet' | 'play' | 'photo') => {
    const { capybaras, gold } = get();
    let animation: Capybara['currentAnimation'] = 'happy';
    let moodBoost = 5;
    let expGain = 5;
    let goldGain = 0;

    switch (action) {
      case 'pet':
        animation = 'happy';
        moodBoost = 10;
        expGain = 5;
        break;
      case 'play':
        animation = 'playing';
        moodBoost = 20;
        expGain = 15;
        goldGain = 3;
        break;
      case 'photo':
        animation = 'happy';
        moodBoost = 5;
        expGain = 3;
        goldGain = 10;
        break;
    }

    set({
      capybaras: capybaras.map((c) =>
        c.id === capybaraId
          ? applyLevelUp({
              ...c,
              mood: Math.min(100, c.mood + moodBoost),
              experience: c.experience + expGain,
              currentAnimation: animation,
            })
          : c
      ),
      gold: gold + goldGain,
    });

    setTimeout(() => {
      set({
        capybaras: get().capybaras.map((c) =>
          c.id === capybaraId ? { ...c, currentAnimation: 'idle' as const } : c
        ),
      });
    }, 3000);
  },

  updateCapybaraPosition: (capybaraId: string, position: [number, number, number]) => {
    set({
      capybaras: get().capybaras.map((c) =>
        c.id === capybaraId
          ? {
              ...c,
              position,
              targetPosition: undefined,
              currentAnimation: 'idle' as const,
            }
          : c
      ),
    });
  },

  tickStats: () => {
    set((state) => ({
      capybaras: state.capybaras.map((c) => {
        const newMood = Math.max(0, c.mood - 5);
        const newHunger = Math.max(0, c.hunger - 5);
        const newCleanliness = Math.max(0, c.cleanliness - 3);
        let newExp = c.experience;
        let newLevel = c.level;

        if (newExp >= c.level * 100) {
          newExp -= c.level * 100;
          newLevel += 1;
        }

        return {
          ...c,
          mood: newMood,
          hunger: newHunger,
          cleanliness: newCleanliness,
          level: newLevel,
          experience: newExp,
        };
      }),
      lastTick: Date.now(),
    }));
  },

  buyFood: (foodId: string) => {
    const { foods, unlockedFoods, gold } = get();
    const food = foods.find((f) => f.id === foodId);
    if (!food || unlockedFoods.includes(foodId) || gold < food.unlockCost) return;

    set({
      unlockedFoods: [...unlockedFoods, foodId],
      gold: gold - food.unlockCost,
    });
  },

  buyDecoration: (decorationId: string) => {
    const { decorations, gold } = get();
    const decoration = decorations.find((d) => d.id === decorationId);
    if (!decoration || decoration.owned || gold < decoration.cost) return;

    set({
      decorations: decorations.map((d) =>
        d.id === decorationId ? { ...d, owned: true } : d
      ),
      gold: gold - decoration.cost,
    });
  },

  placeDecoration: (decorationId: string, position: [number, number, number]) => {
    const { decorations } = get();
    const decoration = decorations.find((d) => d.id === decorationId);
    if (!decoration || !decoration.owned) return;

    set({
      decorations: decorations.map((d) =>
        d.id === decorationId ? { ...d, position } : d
      ),
      selectedDecorationId: null,
    });
  },

  removeDecoration: (decorationId: string) => {
    const { decorations } = get();
    set({
      decorations: decorations.map((d) =>
        d.id === decorationId ? { ...d, position: undefined } : d
      ),
    });
  },

  setBackground: (bg: BackgroundType) => {
    set({ currentBackground: bg });
  },

  toggleDecorationPanel: () => {
    set({ decorationPanelOpen: !get().decorationPanelOpen });
  },

  selectDecoration: (id: string | null) => {
    set({ selectedDecorationId: id });
  },

  addGold: (amount: number) => {
    set({ gold: get().gold + amount });
  },

  selectCapybara: (id: string | null) => {
    set({ selectedCapybaraId: id });
  },

  selectFood: (id: string | null) => {
    set({ selectedFoodId: id });
  },

  toggleShop: () => {
    set({ shopOpen: !get().shopOpen });
  },

  // 投放食物到地面
  placeFood: (position: [number, number, number]) => {
    const { selectedFoodId, unlockedFoods, foods } = get();
    if (!selectedFoodId || !unlockedFoods.includes(selectedFoodId)) return;

    const food = foods.find((f) => f.id === selectedFoodId);
    if (!food) return;

    foodIdCounter++;
    const newFood: FoodOnGround = {
      id: `food-${foodIdCounter}`,
      foodId: selectedFoodId,
      position: [position[0], 0.15, position[2]],
      icon: food.icon,
    };

    set({
      foodOnGround: [...get().foodOnGround, newFood],
    });
  },

  removeFood: (foodId: string) => {
    set({
      foodOnGround: get().foodOnGround.filter((f) => f.id !== foodId),
    });
  },

  // 卡皮巴拉AI - 随机走动、休息、跟随食物
  updateCapybarasAI: (delta: number) => {
    const { capybaras, foodOnGround } = get();
    const WALK_SPEED = 1.8;
    const EATING_DISTANCE = 1.2;

    let needsUpdate = false;
    const updatedCapybaras = capybaras.map((capy) => {
      let c = { ...capy } as Capybara;
      let capyNeedsUpdate = false;

      // 初始化timer
      if (c.wanderTimer === undefined) c.wanderTimer = Math.random() * 3;
      if (c.restTimer === undefined) c.restTimer = 10 + Math.random() * 10;
      if (c.rotation === undefined) c.rotation = 0;

      // 如果正在睡觉，不处理AI
      if (c.currentAnimation === 'sleeping' || c.currentAnimation === 'sleepy') {
        return c;
      }

      // 如果正在吃东西，不处理AI
      if (c.currentAnimation === 'eating') {
        return c;
      }

      // 口渴时趋向池塘
      if (c.thirst < 20 && c.currentAnimation !== 'resting') {
        const distToPond = distanceTo(c.position, POND_POSITION);
        if (distToPond > 1.5) {
          const dx = POND_POSITION[0] - c.position[0];
          const dz = POND_POSITION[2] - c.position[2];
          const targetAngle = Math.atan2(dx, dz);
          let angleDiff = targetAngle - c.rotation!;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          c.rotation = c.rotation! + angleDiff * delta * 5;
          const moveX = Math.sin(targetAngle) * WALK_SPEED * delta;
          const moveZ = Math.cos(targetAngle) * WALK_SPEED * delta;
          c.position = clampToBounds([
            c.position[0] + moveX,
            0,
            c.position[2] + moveZ,
          ]);
          c.currentAnimation = 'walking';
          capyNeedsUpdate = true;
          if (capyNeedsUpdate) return c;
        } else {
          // 到达池塘，喝水
          c.thirst = Math.min(100, c.thirst + 20);
          c.currentAnimation = 'drinking';
          setTimeout(() => {
            set((state) => ({
              capybaras: state.capybaras.map((cc) =>
                cc.id === c.id ? { ...cc, currentAnimation: 'idle' as CapybaraAnimation } : cc
              ),
            }));
          }, 2000);
          capyNeedsUpdate = true;
          if (capyNeedsUpdate) return c;
        }
      }

      // 精力极低时自动入睡
      if (c.energy < 10) {
        c.currentAnimation = 'sleeping';
        c.position = BED_POSITION;
        c.sleepTimer = 30;
        capyNeedsUpdate = true;
        return c;
      }

      // === 优先逻辑：跟随最近的食物 ===
      if (foodOnGround.length > 0 && c.currentAnimation !== 'resting') {
        let nearestFood: FoodOnGround | null = null;
        let nearestDist = Infinity;
        for (const food of foodOnGround) {
          const dist = distanceTo(c.position, food.position);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestFood = food;
          }
        }

        if (nearestFood && nearestDist < 20) {
          // 朝向食物
          const dx = nearestFood.position[0] - c.position[0];
          const dz = nearestFood.position[2] - c.position[2];
          const targetAngle = Math.atan2(dx, dz);

          // 平滑旋转
          let angleDiff = targetAngle - c.rotation!;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          c.rotation = c.rotation! + angleDiff * delta * 5;

          if (nearestDist > EATING_DISTANCE) {
            // 走向食物
            const moveX = Math.sin(targetAngle) * WALK_SPEED * delta;
            const moveZ = Math.cos(targetAngle) * WALK_SPEED * delta;
            c.position = clampToBounds([
              c.position[0] + moveX,
              0,
              c.position[2] + moveZ,
            ]);
            if (c.currentAnimation !== 'walking') {
              c.currentAnimation = 'walking';
            }
            capyNeedsUpdate = true;
          } else {
            // 到达食物，开始吃
            c.currentAnimation = 'eating';
            // 触发吃食物效果
            const foodData = DEFAULT_FOODS.find((f) => f.id === nearestFood!.foodId);
            if (foodData) {
              c.hunger = Math.min(100, c.hunger + foodData.hungerRestore);
              c.mood = Math.min(100, c.mood + foodData.moodBoost);
              c.experience += 10;
              c = applyLevelUp(c);
              // 移除食物
              set((state) => ({
                gold: state.gold + foodData.goldReward,
                foodOnGround: state.foodOnGround.filter((f) => f.id !== nearestFood!.id),
              }));
            }
            setTimeout(() => {
              set((state) => ({
                capybaras: state.capybaras.map((cc) =>
                  cc.id === c.id ? { ...cc, currentAnimation: 'idle' as const } : cc
                ),
              }));
            }, 2000);
            capyNeedsUpdate = true;
          }

          if (capyNeedsUpdate) return c;
        }
      }

      // === 休息逻辑 ===
      c.restTimer! -= delta;
      if (c.restTimer! <= 0 && c.currentAnimation !== 'resting') {
        // 低饱食度更容易休息
        const restChance = c.hunger < 30 ? 0.6 : 0.2;
        if (Math.random() < restChance) {
          c.currentAnimation = 'resting';
          c.restTimer = 8 + Math.random() * 12; // 休息8-20秒
          capyNeedsUpdate = true;
        } else {
          c.restTimer = 5 + Math.random() * 5;
        }
      }

      // 休息结束
      if (c.currentAnimation === 'resting' && c.restTimer! <= 0) {
        c.currentAnimation = 'idle';
        c.restTimer = 10 + Math.random() * 10;
        capyNeedsUpdate = true;
      }

      // 休息中不移动
      if (c.currentAnimation === 'resting') {
        return c;
      }

      // 饥饿太低时停止漫步
      if (c.hunger < 20 && c.currentAnimation !== 'walking') {
        c.currentAnimation = 'idle';
        return c;
      }

      // === 随机漫步逻辑 ===
      c.wanderTimer! -= delta;

      if (c.wanderTimer! <= 0 && c.currentAnimation !== 'walking') {
        c.targetPosition = getRandomTarget();
        c.wanderTimer = 3 + Math.random() * 7; // 3-10秒后重新决定
        capyNeedsUpdate = true;
      }

      // 走到目标点
      if (c.targetPosition && (c.currentAnimation as string) !== 'resting') {
        const dist = distanceTo(c.position, c.targetPosition);

        if (dist > 0.5) {
          const dx = c.targetPosition[0] - c.position[0];
          const dz = c.targetPosition[2] - c.position[2];
          const targetAngle = Math.atan2(dx, dz);

          let angleDiff = targetAngle - c.rotation!;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          c.rotation = c.rotation! + angleDiff * delta * 5;

          const moveX = Math.sin(targetAngle) * WALK_SPEED * 0.5 * delta;
          const moveZ = Math.cos(targetAngle) * WALK_SPEED * 0.5 * delta;
          c.position = clampToBounds([
            c.position[0] + moveX,
            0,
            c.position[2] + moveZ,
          ]);
          if (c.currentAnimation !== 'walking') {
            c.currentAnimation = 'walking';
          }
        } else {
          // 到达目标
          c.targetPosition = undefined;
          c.wanderTimer = 2 + Math.random() * 5;
          if (c.currentAnimation === 'walking') {
            c.currentAnimation = 'idle';
          }
        }
        capyNeedsUpdate = true;
      }

      if (capyNeedsUpdate) {
        needsUpdate = true;
      }

      return c;
    });

    if (needsUpdate) {
      set({ capybaras: updatedCapybaras });
    }
  },

  // === 卡皮巴拉管理 ===
  addCapybara: (name: string, furColor: string) => {
    const { capybaras } = get();
    const newId = `capy-custom-${Date.now()}`;
    const personality = personalities[Math.floor(Math.random() * personalities.length)];
    const newCapybara: Capybara = {
      id: newId,
      name: name || '新卡皮巴拉',
      growthStage: 'baby',
      position: [
        BOUNDS.minX + Math.random() * (BOUNDS.maxX - BOUNDS.minX),
        0,
        BOUNDS.minZ + Math.random() * (BOUNDS.maxZ - BOUNDS.minZ),
      ],
      hunger: 70,
      thirst: 80,
      mood: 80,
      energy: 90,
      cleanliness: 90,
      health: 'healthy',
      age: 5,
      experience: 0,
      level: 1,
      maxExp: 100,
      currentAnimation: 'idle',
      rotation: Math.random() * Math.PI * 2,
      wanderTimer: Math.random() * 5,
      restTimer: 10 + Math.random() * 10,
      furColor,
      accessories: [],
      isCustom: true,
      personality,
      weatherReaction: 'none' as const,
      learnedCommands: [],
    };
    set({ capybaras: [...capybaras, newCapybara] });
  },

  updateCapybaraName: (id: string, name: string) => {
    set({
      capybaras: get().capybaras.map((c) =>
        c.id === id ? { ...c, name } : c
      ),
    });
  },

  updateCapybaraColor: (id: string, color: string) => {
    set({
      capybaras: get().capybaras.map((c) =>
        c.id === id ? { ...c, furColor: color } : c
      ),
    });
  },

  toggleCapybaraAccessory: (id: string, accessory: string) => {
    set({
      capybaras: get().capybaras.map((c) => {
        if (c.id !== id) return c;
        const hasAccessory = c.accessories.includes(accessory);
        return {
          ...c,
          accessories: hasAccessory
            ? c.accessories.filter((a) => a !== accessory)
            : [...c.accessories, accessory],
        };
      }),
    });
  },

  removeCapybara: (id: string) => {
    set({
      capybaras: get().capybaras.filter((c) => c.id !== id),
      selectedCapybaraId: get().selectedCapybaraId === id ? null : get().selectedCapybaraId,
    });
  },

  // ===== 农场相关方法 =====
  toggleFarmMode: () => {
    set({ farmMode: !get().farmMode, selectedTool: null, selectedSeed: null, selectedPlotId: null });
  },

  selectTool: (tool: FarmTool) => {
    set({ selectedTool: tool, selectedSeed: null });
  },

  selectSeed: (seed: CropType | null) => {
    set({ selectedSeed: seed, selectedTool: null });
  },

  plantSeed: (plotId: string, cropType: CropType) => {
    const { gold, farmPlots } = get();
    const plot = farmPlots.find((p) => p.id === plotId);
    if (!plot || plot.cropType !== null) return;

    const seedData = SEED_MAP[cropType];
    if (!seedData || gold < seedData.cost) return;

    const now = Date.now();
    set({
      gold: gold - seedData.cost,
      farmPlots: farmPlots.map((p) =>
        p.id === plotId
          ? {
              ...p,
              cropType,
              stage: 'seed' as const,
              growthProgress: 0,
              waterLevel: 50, // 种植时初始水分
              fertilized: false,
              plantedAt: now,
              lastWateredAt: now,
            }
          : p
      ),
    });
  },

  waterCrop: (plotId: string) => {
    const { farmPlots } = get();
    const plot = farmPlots.find((p) => p.id === plotId);
    if (!plot || !plot.cropType || plot.stage === 'withered') return;

    const now = Date.now();
    set({
      farmPlots: farmPlots.map((p) =>
        p.id === plotId
          ? {
              ...p,
              waterLevel: Math.min(100, p.waterLevel + 40),
              lastWateredAt: now,
            }
          : p
      ),
    });
  },

  fertilizeCrop: (plotId: string) => {
    const { gold, farmPlots } = get();
    const plot = farmPlots.find((p) => p.id === plotId);
    if (!plot || !plot.cropType || plot.stage === 'withered' || plot.fertilized) return;

    const fertilizerCost = 10;
    if (gold < fertilizerCost) return;

    set({
      gold: gold - fertilizerCost,
      farmPlots: farmPlots.map((p) =>
        p.id === plotId
          ? {
              ...p,
              fertilized: true,
            }
          : p
      ),
    });
  },

  harvestCrop: (plotId: string) => {
    const { farmPlots } = get();
    const plot = farmPlots.find((p) => p.id === plotId);
    if (!plot || !plot.cropType || plot.stage !== 'mature') return;

    const seedData = SEED_MAP[plot.cropType];
    if (!seedData) return;

    // 解锁对应的食物
    const currentUnlocked = get().unlockedFoods;
    const newUnlocked = currentUnlocked.includes(seedData.foodId)
      ? currentUnlocked
      : [...currentUnlocked, seedData.foodId];

    // 清除格子
    set({
      gold: get().gold + seedData.harvestReward,
      unlockedFoods: newUnlocked,
      farmPlots: farmPlots.map((p) =>
        p.id === plotId
          ? {
              ...p,
              cropType: null,
              stage: 'seed',
              growthProgress: 0,
              waterLevel: 0,
              fertilized: false,
              plantedAt: 0,
              lastWateredAt: 0,
            }
          : p
      ),
      selectedPlotId: null,
    });
  },

  tickFarm: () => {
    const { farmPlots } = get();
    const now = Date.now();
    const TICK_INTERVAL = 1; // 每秒调用一次

    const updatedPlots = farmPlots.map((plot) => {
      if (!plot.cropType || plot.stage === 'withered' || plot.stage === 'mature') return plot;

      let newPlot = { ...plot };
      const timeSinceWater = (now - plot.lastWateredAt) / 1000;

      // 水分衰减 (每10秒减少约10点)
      newPlot.waterLevel = Math.max(0, plot.waterLevel - (TICK_INTERVAL / 10) * 10);

      // 如果水分 = 0 超过20秒，作物枯萎
      if (plot.waterLevel <= 0 && timeSinceWater > 20) {
        newPlot.stage = 'withered';
        return newPlot;
      }

      // 生长逻辑 (只有水分>0时才生长)
      if (newPlot.waterLevel > 0) {
        const seedData = SEED_MAP[plot.cropType];
        if (!seedData) return plot;

        let growRate = (100 / seedData.growTime) * TICK_INTERVAL; // 基础生长率
        if (plot.fertilized) {
          growRate *= 2; // 施肥双倍生长
        }

        newPlot.growthProgress = Math.min(100, plot.growthProgress + growRate);

        // 根据生长进度更新阶段
        if (newPlot.growthProgress >= 100) {
          newPlot.stage = 'mature';
        } else if (newPlot.growthProgress >= 50) {
          newPlot.stage = 'growing';
        } else if (newPlot.growthProgress >= 10) {
          newPlot.stage = 'sprout';
        }
      }

      return newPlot;
    });

    set({ farmPlots: updatedPlots });
  },

  selectPlot: (id: string | null) => {
    set({ selectedPlotId: id });
  },

  // ===== 新功能方法 =====

  setCapybaraGrowthStage: (id: string, stage: CapybaraGrowthStage) => {
    set({
      capybaras: get().capybaras.map((c) =>
        c.id === id ? { ...c, growthStage: stage } : c
      ),
    });
  },

  interactBodyPart: (capybaraId: string, part: 'head' | 'back' | 'belly') => {
    const { capybaras } = get();
    let moodBoost = 5;
    let animation: CapybaraAnimation = 'happy';

    switch (part) {
      case 'head':
        moodBoost = 8;
        animation = 'yawn';
        break;
      case 'back':
        moodBoost = 5;
        animation = 'scratch';
        break;
      case 'belly':
        moodBoost = 12;
        animation = 'happy';
        break;
    }

    set({
      capybaras: capybaras.map((c) =>
        c.id === capybaraId
          ? applyLevelUp({
              ...c,
              mood: Math.min(100, c.mood + moodBoost),
              experience: c.experience + 5,
              currentAnimation: animation,
            })
          : c
      ),
    });

    setTimeout(() => {
      set({
        capybaras: get().capybaras.map((c) =>
          c.id === capybaraId ? { ...c, currentAnimation: 'idle' as CapybaraAnimation } : c
        ),
      });
    }, 2000);
  },

  batheCapybara: (capybaraId: string) => {
    const { capybaras } = get();
    set({
      capybaras: capybaras.map((c) =>
        c.id === capybaraId
          ? applyLevelUp({
              ...c,
              cleanliness: Math.min(100, c.cleanliness + 30),
              mood: Math.min(100, c.mood + 5),
              experience: c.experience + 8,
              currentAnimation: 'bathing' as CapybaraAnimation,
            })
          : c
      ),
    });

    setTimeout(() => {
      set({
        capybaras: get().capybaras.map((c) =>
          c.id === capybaraId ? { ...c, currentAnimation: 'idle' as CapybaraAnimation } : c
        ),
      });
    }, 3000);
  },

  putToSleep: (capybaraId: string) => {
    const { capybaras } = get();
    set({
      capybaras: capybaras.map((c) =>
        c.id === capybaraId
          ? {
              ...c,
              position: BED_POSITION,
              currentAnimation: 'sleeping' as CapybaraAnimation,
              sleepTimer: 60,
            }
          : c
      ),
    });
  },

  wakeUp: (capybaraId: string) => {
    const { capybaras } = get();
    set({
      capybaras: capybaras.map((c) =>
        c.id === capybaraId
          ? {
              ...c,
              energy: Math.min(100, c.energy + 40),
              currentAnimation: 'idle' as CapybaraAnimation,
              sleepTimer: 0,
            }
          : c
      ),
    });
  },

  cureCapybara: (capybaraId: string) => {
    const { capybaras } = get();
    set({
      capybaras: capybaras.map((c) =>
        c.id === capybaraId
          ? applyLevelUp({
              ...c,
              health: 'healthy' as CapybaraHealth,
              mood: Math.min(100, c.mood + 10),
              experience: c.experience + 5,
            })
          : c
      ),
    });
  },

  tickAllStats: () => {
    set((state) => {
      const updatedCapybaras = state.capybaras.map((c) => {
        let capy = { ...c };

        // 基础衰减
        capy.hunger = Math.max(0, capy.hunger - 3);
        capy.thirst = Math.max(0, capy.thirst - 4);
        capy.cleanliness = Math.max(0, capy.cleanliness - 2);

        // 精力衰减
        if (capy.currentAnimation === 'walking') {
          capy.energy = Math.max(0, capy.energy - 2);
        } else if (capy.currentAnimation === 'running') {
          capy.energy = Math.max(0, capy.energy - 5);
        } else {
          capy.energy = Math.max(0, capy.energy - 2);
        }

        // 心情衰减
        let moodDrop = 2;
        if (capy.hunger < 20) moodDrop += 3;
        if (capy.thirst < 20) moodDrop += 3;
        capy.mood = Math.max(0, capy.mood - moodDrop);

        // 睡觉恢复精力
        if (capy.currentAnimation === 'sleeping') {
          capy.energy = Math.min(100, capy.energy + 15);
          if (capy.sleepTimer !== undefined) {
            capy.sleepTimer = capy.sleepTimer - 1;
            if (capy.sleepTimer <= 0) {
              capy.currentAnimation = 'idle';
              capy.sleepTimer = 0;
            }
          }
        }

        // 健康检查
        if (capy.cleanliness < 10 && capy.health === 'healthy') {
          if (Math.random() < 0.1) {
            capy.health = 'dirty_sick';
          }
        }

        // 年龄增长
        capy.age += 0.5;

        // 成长阶段
        if (capy.age < 15) {
          capy.growthStage = 'baby';
        } else if (capy.age < 40) {
          capy.growthStage = 'teen';
        } else {
          capy.growthStage = 'adult';
        }

        // 升级检查
        if (capy.experience >= capy.maxExp) {
          capy.experience -= capy.maxExp;
          capy.level += 1;
          capy.maxExp = Math.floor(capy.maxExp * 1.2);
        }

        return capy;
      });

      return {
        capybaras: updatedCapybaras,
        lastTick: Date.now(),
      };
    });
  },

  setGameHour: (hour: number) => {
    set({ gameHour: Math.max(0, Math.min(23, hour)) });
  },

  advanceGameTime: (minutes: number) => {
    const state = get();
    let newMinute = state.gameMinute + minutes;
    let newHour = state.gameHour;
    while (newMinute >= 60) {
      newMinute -= 60;
      newHour = (newHour + 1) % 24;
    }
    set({ gameHour: newHour, gameMinute: newMinute });
  },

  addExperience: (capybaraId: string, exp: number) => {
    const { capybaras } = get();
    set({
      capybaras: capybaras.map((c) => {
        if (c.id !== capybaraId) return c;
        let newExp = c.experience + exp;
        let newLevel = c.level;
        let newMaxExp = c.maxExp;

        while (newExp >= newMaxExp) {
          newExp -= newMaxExp;
          newLevel += 1;
          newMaxExp = Math.floor(newMaxExp * 1.2);
        }

        return { ...c, experience: newExp, level: newLevel, maxExp: newMaxExp };
      }),
    });
  },

  // ===== 天气系统 =====
  changeWeather: (type: WeatherType) => {
    const durations: Record<WeatherType, number> = { sunny: 180, cloudy: 120, rainy: 90 };
    set({
      weather: {
        type,
        intensity: type === 'rainy' ? 0.5 + Math.random() * 0.5 : 0,
        duration: durations[type],
      },
    });
  },

  tickWeather: (delta: number) => {
    const { weather, gameHour, capybaras } = get();
    const newDuration = weather.duration - delta;

    if (newDuration <= 0) {
      // Weather expired, pick new weather
      let newType: WeatherType;
      const isNight = gameHour >= 21 || gameHour < 5;
      if (isNight) {
        newType = Math.random() < 0.4 ? 'rainy' : (Math.random() < 0.5 ? 'cloudy' : 'sunny');
      } else {
        newType = Math.random() < 0.5 ? 'sunny' : (Math.random() < 0.5 ? 'cloudy' : 'rainy');
      }
      get().changeWeather(newType);
    } else {
      set({ weather: { ...weather, duration: newDuration } });
    }

    // Rain effects on capybaras
    const currentWeather = get().weather;
    if (currentWeather.type === 'rainy') {
      set({
        capybaras: capybaras.map((c) => {
          let updated = { ...c };
          // Cleanliness drops faster in rain
          updated.cleanliness = Math.max(0, updated.cleanliness - 1);

          // Low energy capybaras seek shelter
          if (updated.energy < 30 && updated.currentAnimation !== 'sleeping') {
            updated.weatherReaction = 'seeking_shelter';
          }

          // Rain increases sickness chance
          if (updated.cleanliness < 20 && updated.health === 'healthy') {
            if (Math.random() < 0.05) {
              updated.health = 'cold';
            }
          }

          return updated;
        }),
      });
    }
  },

  // ===== 玩具系统 =====
  buyToy: (toyId: string) => {
    const { gold, ownedToys } = get();
    const toy = DEFAULT_TOYS.find((t) => t.id === toyId);
    if (!toy || ownedToys.includes(toyId) || gold < toy.cost) return;

    set({
      ownedToys: [...ownedToys, toyId],
      gold: gold - toy.cost,
    });
  },

  throwToy: (toyId: string, position: [number, number, number]) => {
    const { ownedToys, toysInScene } = get();
    if (!ownedToys.includes(toyId)) return;

    const sceneToyId = `scene-${toyId}-${Date.now()}`;
    const newToy: ToyInScene = {
      id: sceneToyId,
      toyId,
      position: [position[0], 0.3, position[2]],
      isMoving: true,
    };

    set({ toysInScene: [...toysInScene, newToy] });
  },

  useToyOnCapybara: (capybaraId: string, toyId: string) => {
    const { capybaras, ownedToys } = get();
    if (!ownedToys.includes(toyId)) return;

    const capy = capybaras.find((c) => c.id === capybaraId);
    if (!capy) return;

    // Durability decreases
    const toyData = DEFAULT_TOYS.find((t) => t.id === toyId);
    if (toyData && toyData.durability <= 0) return;

    let animation: CapybaraAnimation = 'playing';
    let moodBoost = 15;
    let energyCost = 5;

    if (toyId === 'toy-water_gun') {
      animation = 'happy';
      moodBoost = 10;
      energyCost = 3;
    }

    set({
      capybaras: capybaras.map((c) =>
        c.id === capybaraId
          ? applyLevelUp({
              ...c,
              mood: Math.min(100, c.mood + moodBoost),
              energy: Math.max(0, c.energy - energyCost),
              experience: c.experience + 8,
              currentAnimation: animation,
            })
          : c
      ),
    });

    setTimeout(() => {
      set({
        capybaras: get().capybaras.map((c) =>
          c.id === capybaraId ? { ...c, currentAnimation: 'idle' as CapybaraAnimation } : c
        ),
      });
    }, 3000);
  },

  // ===== 命令系统 =====
  teachCommand: (capybaraId: string, commandType: CommandType) => {
    const { capybaras, gold } = get();
    const trainCost = 10;
    if (gold < trainCost) return;

    set({
      gold: gold - trainCost,
      capybaras: capybaras.map((c) => {
        if (c.id !== capybaraId) return c;
        const existing = c.learnedCommands.find((cmd) => cmd.type === commandType);
        if (existing) {
          // Already learned, increase mastery
          return {
            ...c,
            learnedCommands: c.learnedCommands.map((cmd) =>
              cmd.type === commandType
                ? { ...cmd, timesPerformed: cmd.timesPerformed + 1, level: Math.min(3, cmd.level + (cmd.timesPerformed >= 2 ? 1 : 0)) }
                : cmd
            ),
            currentAnimation: 'playing' as CapybaraAnimation,
          };
        } else {
          // New command
          return {
            ...c,
            learnedCommands: [...c.learnedCommands, { type: commandType, level: 0, timesPerformed: 1 }],
            currentAnimation: 'playing' as CapybaraAnimation,
          };
        }
      }),
    });

    setTimeout(() => {
      set({
        capybaras: get().capybaras.map((c) =>
          c.id === capybaraId ? { ...c, currentAnimation: 'idle' as CapybaraAnimation } : c
        ),
      });
    }, 2000);
  },

  executeCommand: (capybaraId: string, commandType: CommandType) => {
    const { capybaras } = get();
    set({
      capybaras: capybaras.map((c) => {
        if (c.id !== capybaraId) return c;
        const cmd = c.learnedCommands.find((cm) => cm.type === commandType);
        if (!cmd || cmd.level < 1) return c;

        let animation: CapybaraAnimation = 'playing';
        switch (commandType) {
          case 'sit':
            animation = 'resting';
            break;
          case 'shake':
            animation = 'ear_shake';
            break;
          case 'spin':
            animation = 'running';
            break;
          case 'roll':
            animation = 'playing';
            break;
        }

        return applyLevelUp({
          ...c,
          currentAnimation: animation,
          mood: Math.min(100, c.mood + 10),
          experience: c.experience + 5,
          learnedCommands: c.learnedCommands.map((cm) =>
            cm.type === commandType ? { ...cm, timesPerformed: cm.timesPerformed + 1 } : cm
          ),
        });
      }),
    });

    setTimeout(() => {
      set({
        capybaras: get().capybaras.map((c) =>
          c.id === capybaraId ? { ...c, currentAnimation: 'idle' as CapybaraAnimation } : c
        ),
      });
    }, 3000);
  },

  // ===== 疾病治疗 =====
  giveMedicine: (capybaraId: string) => {
    const { gold, capybaras } = get();
    const medicineCost = 20;
    if (gold < medicineCost) return;

    const capy = capybaras.find((c) => c.id === capybaraId);
    if (!capy || capy.health === 'healthy') return;

    set({
      gold: gold - medicineCost,
      capybaras: capybaras.map((c) =>
        c.id === capybaraId
          ? {
              ...c,
              health: 'healthy' as CapybaraHealth,
              mood: Math.min(100, c.mood + 15),
            }
          : c
      ),
    });
  },
}));

// 每30秒衰减属性
setInterval(() => {
  useGameStore.getState().tickAllStats();
}, 30000);

// 天气tick (每5秒)
setInterval(() => {
  useGameStore.getState().tickWeather(5);
}, 5000);

// 游戏时间推进: 1 real minute = 1 game hour (so 1 real second = 1 game minute)
setInterval(() => {
  useGameStore.getState().advanceGameTime(1);
}, 1000);

// 农场tick (每秒)
let farmTickTimer: ReturnType<typeof setInterval> | null = null;
const startFarmTick = () => {
  if (farmTickTimer) return;
  farmTickTimer = setInterval(() => {
    const state = useGameStore.getState();
    if (state.farmMode) {
      useGameStore.getState().tickFarm();
    }
  }, 1000);
};
startFarmTick();

// 自动保存
import { startAutoSave } from '@/utils/saveSystem';
startAutoSave();
