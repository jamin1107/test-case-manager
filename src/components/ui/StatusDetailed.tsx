import { useGameStore } from '@/store/gameStore';
import type { Capybara } from '@/types/game';

function ProgressBar({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  const displayColor = value > 60 ? color : value > 30 ? '#FF9800' : '#F44336';

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{icon}</span>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-xs font-medium text-[#5D4037]">{label}</span>
          <span className="text-xs text-gray-500">{Math.round(value)}</span>
        </div>
        <div className="h-2 bg-gray-200/60 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: displayColor }}
          />
        </div>
      </div>
    </div>
  );
}

function getHealthIcon(health: Capybara['health']): string {
  switch (health) {
    case 'healthy': return '💚';
    case 'cold': return '🥶';
    case 'stomachache': return '🤢';
    case 'dirty_sick': return '🤒';
    default: return '💚';
  }
}

function getHealthLabel(health: Capybara['health']): string {
  switch (health) {
    case 'healthy': return '健康';
    case 'cold': return '感冒';
    case 'stomachache': return '肚子疼';
    case 'dirty_sick': return '脏病了';
    default: return '健康';
  }
}

function getGrowthLabel(stage: Capybara['growthStage']): string {
  switch (stage) {
    case 'baby': return '🍼 幼崽';
    case 'teen': return '🌱 少年';
    case 'adult': return '🌟 成年';
    default: return '🍼 幼崽';
  }
}

function getGrowthProgress(age: number): number {
  if (age < 15) return (age / 15) * 100;
  if (age < 40) return ((age - 15) / 25) * 100;
  return 100;
}

function getPersonalityLabel(p: Capybara['personality']): string {
  switch (p) {
    case 'active': return '🏃 活泼';
    case 'calm': return '😌 安静';
    case 'playful': return '🎈 顽皮';
    case 'lazy': return '😴 懒惰';
    default: return '🏃 活泼';
  }
}

export function StatusDetailed() {
  const selectedCapybaraId = useGameStore((state) => state.selectedCapybaraId);
  const capybaras = useGameStore((state) => state.capybaras);
  const selectCapybara = useGameStore((state) => state.selectCapybara);
  const feedCapybara = useGameStore((state) => state.feedCapybara);
  const interactBodyPart = useGameStore((state) => state.interactBodyPart);
  const batheCapybara = useGameStore((state) => state.batheCapybara);
  const putToSleep = useGameStore((state) => state.putToSleep);
  const wakeUp = useGameStore((state) => state.wakeUp);
  const cureCapybara = useGameStore((state) => state.cureCapybara);
  const selectedFoodId = useGameStore((state) => state.selectedFoodId);
  const selectFood = useGameStore((state) => state.selectFood);

  const capybara = capybaras.find((c) => c.id === selectedCapybaraId);

  if (!capybara) return null;

  const isSleeping = capybara.currentAnimation === 'sleeping';
  const growthProgress = getGrowthProgress(capybara.age);
  const expProgress = (capybara.experience / capybara.maxExp) * 100;

  const handleFeed = () => {
    if (selectedFoodId) {
      feedCapybara(capybara.id, selectedFoodId);
      selectFood(null);
    }
  };

  return (
    <div className="absolute top-20 right-4 z-10 w-80">
      <div className="bg-white/85 backdrop-blur-md rounded-2xl p-4 shadow-xl max-h-[calc(100vh-120px)] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦫</span>
            <div>
              <h3 className="text-base font-bold text-[#5D4037] font-quicksand">
                {capybara.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-[#8D6E63]">
                <span>等级 {capybara.level}</span>
                <span>·</span>
                <span>{getGrowthLabel(capybara.growthStage)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => selectCapybara(null)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Core Stats */}
        <div className="space-y-1.5 mb-3">
          <ProgressBar icon="🍖" label="饥饿度" value={capybara.hunger} color="#FF7043" />
          <ProgressBar icon="💧" label="口渴度" value={capybara.thirst} color="#29B6F6" />
          <ProgressBar icon="😊" label="心情" value={capybara.mood} color="#4CAF50" />
          <ProgressBar icon="⚡" label="精力" value={capybara.energy} color="#FFC107" />
          <ProgressBar icon="🧼" label="清洁度" value={capybara.cleanliness} color="#AB47BC" />
        </div>

        {/* Health */}
        <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg bg-white/50">
          <span className="text-sm">{getHealthIcon(capybara.health)}</span>
          <span className="text-xs font-medium text-[#5D4037]">健康状态</span>
          <span className="text-xs text-gray-500 ml-auto">{getHealthLabel(capybara.health)}</span>
        </div>

        {/* Growth Stage Progress */}
        {capybara.growthStage !== 'adult' && (
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-500 mb-0.5">
              <span>成长进度</span>
              <span>年龄 {capybara.age.toFixed(1)}h</span>
            </div>
            <div className="h-1.5 bg-gray-200/60 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[#8BC34A] transition-all duration-300"
                style={{ width: `${growthProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Experience */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-0.5">
            <span>经验值</span>
            <span>{Math.round(capybara.experience)}/{capybara.maxExp}</span>
          </div>
          <div className="h-1.5 bg-gray-200/60 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[#FF9800] transition-all duration-300"
              style={{ width: `${Math.min(100, expProgress)}%` }}
            />
          </div>
        </div>

        {/* Personality */}
        <div className="mb-3 px-2 py-1 rounded-lg bg-orange-50/50">
          <span className="text-xs text-orange-700">{getPersonalityLabel(capybara.personality)}</span>
        </div>

        {/* Interaction Buttons */}
        <div className="mb-2">
          <p className="text-xs font-medium text-[#5D4037] mb-1.5">互动</p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => interactBodyPart(capybara.id, 'head')}
              className="flex flex-col items-center gap-0.5 bg-pink-50 hover:bg-pink-100 rounded-lg py-1.5 transition-colors"
            >
              <span className="text-base">👋</span>
              <span className="text-[10px] font-medium text-[#5D4037]">摸头</span>
            </button>
            <button
              onClick={() => interactBodyPart(capybara.id, 'back')}
              className="flex flex-col items-center gap-0.5 bg-yellow-50 hover:bg-yellow-100 rounded-lg py-1.5 transition-colors"
            >
              <span className="text-base">🤚</span>
              <span className="text-[10px] font-medium text-[#5D4037]">摸背</span>
            </button>
            <button
              onClick={() => interactBodyPart(capybara.id, 'belly')}
              className="flex flex-col items-center gap-0.5 bg-red-50 hover:bg-red-100 rounded-lg py-1.5 transition-colors"
            >
              <span className="text-base">🫶</span>
              <span className="text-[10px] font-medium text-[#5D4037]">摸肚子</span>
            </button>
          </div>
        </div>

        {/* Care Buttons */}
        <div className="mb-2">
          <p className="text-xs font-medium text-[#5D4037] mb-1.5">照料</p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => batheCapybara(capybara.id)}
              className="flex flex-col items-center gap-0.5 bg-blue-50 hover:bg-blue-100 rounded-lg py-1.5 transition-colors"
            >
              <span className="text-base">🚿</span>
              <span className="text-[10px] font-medium text-[#5D4037]">洗澡</span>
            </button>
            <button
              onClick={() => isSleeping ? wakeUp(capybara.id) : putToSleep(capybara.id)}
              className="flex flex-col items-center gap-0.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg py-1.5 transition-colors"
            >
              <span className="text-base">{isSleeping ? '⏰' : '🛏️'}</span>
              <span className="text-[10px] font-medium text-[#5D4037]">{isSleeping ? '叫醒' : '睡觉'}</span>
            </button>
            <button
              onClick={() => cureCapybara(capybara.id)}
              disabled={capybara.health === 'healthy'}
              className="flex flex-col items-center gap-0.5 bg-green-50 hover:bg-green-100 rounded-lg py-1.5 transition-colors disabled:opacity-40"
            >
              <span className="text-base">💊</span>
              <span className="text-[10px] font-medium text-[#5D4037]">治疗</span>
            </button>
          </div>
        </div>

        {/* Feed Button */}
        {selectedFoodId && (
          <button
            onClick={handleFeed}
            className="w-full mt-2 bg-[#4CAF50] hover:bg-[#43A047] text-white font-bold py-2 rounded-xl transition-colors text-sm"
          >
            立即喂食
          </button>
        )}
      </div>
    </div>
  );
}
