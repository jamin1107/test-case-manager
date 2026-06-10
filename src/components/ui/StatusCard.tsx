import { useGameStore } from '@/store/gameStore';

function ProgressBar({
  icon,
  value,
  color,
}: {
  icon: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{icon}</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs text-gray-600 w-8 text-right">{value}</span>
    </div>
  );
}

export function StatusCard() {
  const selectedCapybaraId = useGameStore((state) => state.selectedCapybaraId);
  const capybaras = useGameStore((state) => state.capybaras);
  const selectCapybara = useGameStore((state) => state.selectCapybara);
  const feedCapybara = useGameStore((state) => state.feedCapybara);
  const interactCapybara = useGameStore((state) => state.interactCapybara);
  const selectedFoodId = useGameStore((state) => state.selectedFoodId);
  const selectFood = useGameStore((state) => state.selectFood);

  const capybara = capybaras.find((c) => c.id === selectedCapybaraId);

  if (!capybara) return null;

  const getMoodEmoji = (mood: number) => {
    if (mood >= 80) return '😊';
    if (mood >= 50) return '😐';
    if (mood >= 20) return '😟';
    return '😢';
  };

  const getMoodColor = (mood: number) => {
    if (mood >= 80) return '#4CAF50';
    if (mood >= 50) return '#FF9800';
    return '#F44336';
  };

  const handleFeed = () => {
    if (selectedFoodId) {
      feedCapybara(capybara.id, selectedFoodId);
      selectFood(null);
    }
  };

  return (
    <div className="absolute top-20 right-4 z-10 w-72">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{getMoodEmoji(capybara.mood)}</span>
            <div>
              <h3 className="text-lg font-bold text-[#5D4037] font-quicksand">
                {capybara.name}
              </h3>
              <span className="text-xs text-[#8D6E63]">等级 {capybara.level}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => selectCapybara(null)}
              className="text-gray-400 hover:text-gray-600 text-lg"
            >
              ×
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2 mb-4">
          <ProgressBar
            icon="❤️ 心情"
            value={Math.round(capybara.mood)}
            color={getMoodColor(capybara.mood)}
          />
          <ProgressBar
            icon="🍔 饱食"
            value={Math.round(capybara.hunger)}
            color="#FF7043"
          />
          <ProgressBar
            icon="💧 清洁"
            value={Math.round(capybara.cleanliness)}
            color="#29B6F6"
          />
        </div>

        {/* Experience */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>经验值</span>
            <span>
              {capybara.experience}/{capybara.level * 100}
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[#8BC34A] transition-all duration-300"
              style={{
                width: `${(capybara.experience / (capybara.level * 100)) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => interactCapybara(capybara.id, 'pet')}
            className="flex flex-col items-center gap-1 bg-pink-50 hover:bg-pink-100 rounded-xl py-2 transition-colors"
          >
            <span className="text-xl">🤗</span>
            <span className="text-xs font-medium text-[#5D4037]">抚摸</span>
          </button>
          <button
            onClick={() => interactCapybara(capybara.id, 'play')}
            className="flex flex-col items-center gap-1 bg-yellow-50 hover:bg-yellow-100 rounded-xl py-2 transition-colors"
          >
            <span className="text-xl">🎾</span>
            <span className="text-xs font-medium text-[#5D4037]">玩耍</span>
          </button>
          <button
            onClick={() => interactCapybara(capybara.id, 'photo')}
            className="flex flex-col items-center gap-1 bg-blue-50 hover:bg-blue-100 rounded-xl py-2 transition-colors"
          >
            <span className="text-xl">📸</span>
            <span className="text-xs font-medium text-[#5D4037]">拍照</span>
          </button>
        </div>

        {/* Feed Button (when food selected) */}
        {selectedFoodId && (
          <button
            onClick={handleFeed}
            className="w-full mt-3 bg-[#4CAF50] hover:bg-[#43A047] text-white font-bold py-2 rounded-xl transition-colors"
          >
            立即喂食
          </button>
        )}
      </div>
    </div>
  );
}
