import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { GameSetup } from '@/sections/GameSetup';
import { MapEditor } from '@/sections/MapEditor';
import { IdentityReveal } from '@/sections/IdentityReveal';
import { GamePlay } from '@/sections/GamePlay';
import { SettlementPhase } from '@/sections/SettlementPhase';
import { DeathReport } from '@/sections/DeathReport';
import { GameEnd } from '@/sections/GameEnd';
import { Lobby } from '@/network/Lobby';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getPhaseName } from '@/types/game';
import { Map, Users, Play, Shuffle, Wifi, Home } from 'lucide-react';

type AppMode = 'menu' | 'local' | 'online_host' | 'online_player' | 'game';

function App() {
  const { phase, players, round, resetGame } = useGameStore();
  const [appMode, setAppMode] = useState<AppMode>('menu');

  // 菜单页
  if (appMode === 'menu') {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">绒兽杀</h1>
            <p className="text-sm text-slate-400 mt-2">选择游戏模式</p>
          </div>

          <Button
            onClick={() => { resetGame(); setAppMode('local'); }}
            className="w-full h-14 text-base bg-indigo-600 hover:bg-indigo-700"
          >
            <Users className="w-5 h-5 mr-3" />
            本地模式（主持人）
          </Button>

          <Button
            onClick={() => setAppMode('online_host')}
            variant="secondary"
            className="w-full h-14 text-base"
          >
            <Wifi className="w-5 h-5 mr-3" />
            联机模式
          </Button>
        </div>
      </div>
    );
  }

  // 联机大厅
  if (appMode === 'online_host') {
    return <Lobby onBack={() => setAppMode('menu')} />;
  }

  // 本地游戏流程
  if (phase === 'setup') {
    return (
      <div className="h-screen flex flex-col">
        <Tabs defaultValue="players" className="flex-1 flex flex-col">
          <div className="bg-white border-b px-3 md:px-4 py-2 flex flex-wrap items-center gap-2 md:gap-3">
            <h1 className="text-base md:text-lg font-bold text-slate-900 shrink-0">绒兽杀</h1>
            <Badge variant="outline" className="text-[10px] md:text-xs">设置中</Badge>
            <Separator orientation="vertical" className="hidden md:block h-5 mx-1" />
            <TabsList className="h-7 md:h-8">
              <TabsTrigger value="players" className="text-[10px] md:text-xs h-6 md:h-7 px-2 md:px-3">
                <Users className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1" />
                玩家
              </TabsTrigger>
              <TabsTrigger value="map" className="text-[10px] md:text-xs h-6 md:h-7 px-2 md:px-3">
                <Map className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1" />
                地图
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="players" className="flex-1 min-h-0 mt-0 data-[state=active]:flex">
            <GameSetup />
          </TabsContent>

          <TabsContent value="map" className="flex-1 min-h-0 p-4 mt-0 data-[state=active]:flex">
            <MapEditor />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  if (phase === 'identity') {
    return <IdentityReveal />;
  }

  if (phase === 'start') {
    return <PlacementScreen />;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      <header className="bg-white border-b px-3 md:px-4 py-2 md:py-3 flex items-center gap-2 shrink-0 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => { resetGame(); setAppMode('menu'); }} className="h-7 px-2 text-xs shrink-0">
          <Home className="w-3.5 h-3.5 mr-1" />
          菜单
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <Badge variant="outline" className="text-[10px] md:text-xs">主持人</Badge>
        <Badge variant="secondary" className="text-[10px] md:text-xs font-mono">第 {round} 轮</Badge>
        <Badge variant="default" className="text-[10px] md:text-xs bg-indigo-600">{getPhaseName(phase)}</Badge>
        <div className="ml-auto text-[10px] md:text-xs text-slate-500">
          <span className="text-green-600 font-medium">{players.filter((p) => p.status === 'alive').length}</span>
          {' / '}{players.length}
        </div>
      </header>

      <main className="flex-1 p-2 md:p-3 min-h-0 overflow-auto">
        {phase.startsWith('settlement') ? <SettlementPhase />
          : phase === 'death_report' ? <DeathReport />
          : phase === 'end' ? <GameEnd />
          : <GamePlay />}
      </main>
    </div>
  );
}

// ==================== 角色放置界面（手机适配版） ====================

function PlacementScreen() {
  const { players, locations, movePlayer, nextPhase, randomPlaceAll } = useGameStore();
  const [placedCount, setPlacedCount] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const unplacedPlayers = players.filter((p) => !p.locationId);
  const placedPlayers = players.filter((p) => p.locationId);

  const handlePlace = (playerId: string, locId: string) => {
    movePlayer(playerId, locId);
    setPlacedCount((c) => c + 1);
  };

  const handleRandomPlace = () => {
    randomPlaceAll();
    setPlacedCount(players.length);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <header className="px-3 md:px-6 py-3 md:py-4 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-white">角色放置</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            点击玩家 → 点击地点进行放置
            <span className="ml-2 text-amber-400">{placedCount}/{players.length}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unplacedPlayers.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleRandomPlace}
              className="border-amber-500 text-amber-400 hover:bg-amber-950 text-xs h-7 md:h-8">
              <Shuffle className="w-3.5 h-3.5 mr-1" />随机
            </Button>
          )}
          <Button onClick={nextPhase} disabled={unplacedPlayers.length > 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-xs h-7 md:h-8">
            开始游戏<Play className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* 手机端：底部玩家列表，桌面：左侧玩家列表 */}
        <div className="order-2 md:order-1 md:w-56 border-t md:border-t-0 md:border-r border-slate-700 bg-slate-800 overflow-auto p-3 md:p-4">
          <h3 className="text-xs font-medium text-slate-400 mb-2">玩家列表</h3>
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
            {players.map((p) => {
              const isPlaced = !!p.locationId;
              return (
                <div key={p.id} onClick={() => !isPlaced && setSelectedPlayer(selectedPlayer === p.id ? null : p.id)}
                  className={`shrink-0 md:w-full p-2 rounded-lg border transition-all cursor-pointer ${
                    isPlaced
                      ? 'bg-emerald-900/30 border-emerald-700/50 opacity-60'
                      : selectedPlayer === p.id
                        ? 'bg-indigo-900/50 border-indigo-500 ring-1 ring-indigo-500'
                        : 'bg-slate-700 border-slate-600 hover:border-slate-400'
                  }`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm md:text-base text-white font-medium truncate">{p.name}</span>
                    {isPlaced && <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/50 shrink-0">已放</Badge>}
                  </div>
                  {isPlaced && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{locations.find((l) => l.id === p.locationId)?.name}</p>}
                </div>
              );
            })}
          </div>
        </div>

        {/* 地图 */}
        <div className="flex-1 p-2 md:p-4 min-h-0 order-1 md:order-2">
          <svg viewBox="0 0 100 100" className="w-full h-full bg-slate-800 rounded-xl border border-slate-700" preserveAspectRatio="xMidYMid meet">
            {locations.map((loc) =>
              loc.connectedTo.map((connId) => {
                if (connId <= loc.id) return null;
                const target = locations.find((l) => l.id === connId);
                if (!target) return null;
                return <line key={`${loc.id}_${connId}`} x1={loc.x} y1={loc.y} x2={target.x} y2={target.y} stroke="#334155" strokeWidth="0.8" />;
              })
            )}
            {locations.map((loc) => {
              const locPlayers = placedPlayers.filter((p) => p.locationId === loc.id);
              return (
                <g key={loc.id} onClick={() => { if (selectedPlayer) { handlePlace(selectedPlayer, loc.id); setSelectedPlayer(null); } }}
                  style={{ cursor: selectedPlayer ? 'pointer' : 'default' }}>
                  {selectedPlayer && <circle cx={loc.x} cy={loc.y} r={6} fill="none" stroke="#6366f1" strokeWidth="1" opacity="0.6">
                    <animate attributeName="r" values="6;7;6" dur="1.5s" repeatCount="indefinite" />
                  </circle>}
                  <circle cx={loc.x} cy={loc.y} r={4.5} fill={locPlayers.length > 0 ? '#475569' : '#334155'}
                    stroke={selectedPlayer ? '#6366f1' : '#475569'} strokeWidth="1" />
                  <text x={loc.x} y={loc.y + 9} textAnchor="middle" fontSize="3.2" fill="#94a3b8" fontWeight="500"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}>{loc.name}</text>
                  {locPlayers.map((p, i) => {
                    const angle = (2 * Math.PI * i) / Math.max(locPlayers.length, 1) - Math.PI / 2;
                    const px = loc.x + Math.cos(angle) * 7;
                    const py = loc.y + Math.sin(angle) * 7;
                    return (
                      <g key={p.id}>
                        <circle cx={px} cy={py} r={2.8} fill="#6366f1" stroke="white" strokeWidth="0.5" />
                        <text x={px} y={py + 1} textAnchor="middle" fontSize="2.8" fill="white" fontWeight="bold"
                          style={{ pointerEvents: 'none', userSelect: 'none' }}>{p.name.charAt(0)}</text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

export default App;
