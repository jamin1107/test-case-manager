import { useState } from 'react';
import { saveToDB, loadFromDB, exportSaveJSON, importSaveJSON } from '@/utils/saveSystem';

export function SaveManager() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleManualSave = async () => {
    setSaving(true);
    setStatus('保存中...');
    await saveToDB();
    setStatus('保存成功 ✓');
    setSaving(false);
    setTimeout(() => setStatus(''), 2000);
  };

  const handleLoad = async () => {
    setLoading(true);
    setStatus('加载中...');
    const data = await loadFromDB();
    if (data) {
      const { useGameStore } = await import('@/store/gameStore');
      useGameStore.setState({
        gameHour: data.gameHour,
        gameMinute: data.gameMinute,
        gold: data.gold,
        capybaras: data.capybaras,
        unlockedFoods: data.unlockedFoods,
        decorations: data.decorations,
        farmPlots: data.farmPlots,
        currentBackground: data.currentBackground as any,
      });
      setStatus('加载成功 ✓');
    } else {
      setStatus('没有找到存档');
    }
    setLoading(false);
    setTimeout(() => setStatus(''), 2000);
  };

  const handleExport = () => {
    exportSaveJSON();
    setStatus('导出成功 ✓');
    setTimeout(() => setStatus(''), 2000);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const success = await importSaveJSON(text);
      setStatus(success ? '导入成功 ✓' : '导入失败');
      setTimeout(() => setStatus(''), 2000);
    };
    input.click();
  };

  return (
    <div className="absolute bottom-4 left-4 z-10">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="mb-2 flex items-center gap-1 bg-white/80 backdrop-blur-md rounded-full px-2.5 py-1.5 shadow-lg hover:bg-white transition-colors"
      >
        <span className="text-xs">💾</span>
        <span className="text-xs font-medium text-[#5D4037]">存档</span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="2 4 6 8 10 4" />
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-3 shadow-lg w-48">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs">💾</span>
            <span className="text-xs font-medium text-[#5D4037]">自动保存中</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          </div>

          <div className="space-y-1.5">
            <button
              onClick={handleManualSave}
              disabled={saving}
              className="w-full text-xs px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? '保存中...' : '手动保存'}
            </button>

            <button
              onClick={handleLoad}
              disabled={loading}
              className="w-full text-xs px-2 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? '加载中...' : '加载存档'}
            </button>

            <div className="flex gap-1.5">
              <button
                onClick={handleExport}
                className="flex-1 text-xs px-2 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
              >
                导出存档
              </button>
              <button
                onClick={handleImport}
                className="flex-1 text-xs px-2 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-colors"
              >
                导入存档
              </button>
            </div>
          </div>

          {status && (
            <div className="mt-1.5 text-xs text-center text-green-600 font-medium">
              {status}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
