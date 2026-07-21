import { useGameStore } from '@/store/gameStore';
import { GameSetup } from '@/sections/GameSetup';
import { MapEditor } from '@/sections/MapEditor';
import { IdentityReveal } from '@/sections/IdentityReveal';
import { GamePlay } from '@/sections/GamePlay';
import { SettlementPhase } from '@/sections/SettlementPhase';
import { DeathReport } from '@/sections/DeathReport';
import { GameEnd } from '@/sections/GameEnd';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getPhaseName } from '@/types/game';
import { Map, Users, Play, Shuffle } from 'lucide-react';

function App() {
  const { phase, players, round } = useGameStore();

  // 设置阶段 - 显示设置+地图编辑
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

          <TabsContent
            value="players"
            className="flex-1 min-h-0 mt-0 data-[state=active]:flex"
          >
            <GameSetup />
          </TabsContent>

          <TabsContent
            value="map"
            className="flex-1 min-h-0 p-4 mt-0 data-[state=active]:flex"
          >
            <MapEditor />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // 身份发布阶段
  if (phase === 'identity') {
    return <IdentityReveal />;
  }

  // 角色放置阶段
  if (phase === 'start') {
    return <PlacementScreen />;
  }

  // 游戏进行阶段
  return (
    <div className="h-screen flex flex-col bg-slate-100">
      {/* 顶部状态栏 */}
      <header className="bg-white border-b px-4 py-2 flex items-center gap-3 shrink-0">
        <h1 className="text-base font-bold text-slate-900">绒兽杀</h1>
        <Badge variant="outline" className="text-xs">主持人</Badge>
        <Separator orientation="vertical" className="h-5" />
        <Badge variant="secondary" className="text-xs font-mono">
          第 {round} 轮
        </Badge>
        <Badge variant="default" className="text-xs bg-indigo-600">
          {getPhaseName(phase)}
        </Badge>
        <div className="ml-auto text-xs text-slate-500">
          <span className="text-green-600 font-medium">
            {players.filter((p) => p.status === 'alive').length}
          </span>
          {' / '}
          {players.length} 存活
        </div>
      </header>

      {/* 主内容 */}
      <main className="flex-1 p-3 min-h-0">
        {phase.startsWith('settlement') ? (
          <SettlementPhase />
        ) : phase === 'death_report' ? (
          <DeathReport />
        ) : phase === 'end' ? (
          <GameEnd />
        ) : (
          <GamePlay />
        )}
      </main>
    </div>
  );
}

// ==================== 角色放置界面 ====================

function PlacementScreen() {
  const { players, locations, movePlayer, nextPhase, randomPlaceAll } = useGameStore();
  const [placedCount, setPlacedCount] = useState(0);

  const unplacedPlayers = players.filter((p) => !p.locationId);

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
      <header className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">角色放置</h1>
          <p className="text-sm text-slate-400 mt-1">
            点击玩家，再点击地图上的地点进行放置
            <span className="ml-2 text-amber-400">
              已放置 {placedCount} / {players.length}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unplacedPlayers.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRandomPlace}
              className="border-amber-500 text-amber-400 hover:bg-amber-950 hover:text-amber-300"
            >
              <Shuffle className="w-4 h-4 mr-1.5" />
              随机分配位置
            </Button>
          )}
          <Button
            onClick={nextPhase}
            disabled={unplacedPlayers.length > 0}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            全部放置完成，开始游戏
            <Play className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 玩家列表 */}
        <div className="w-64 border-r border-slate-700 bg-slate-800 overflow-auto p-4">
          <h3 className="text-sm font-medium text-slate-400 mb-3">待放置玩家</h3>
          <div className="space-y-2">
            {players.map((p) => {
              const isPlaced = !!p.locationId;
              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isPlaced
                      ? 'bg-emerald-900/30 border-emerald-700/50 opacity-60'
                      : 'bg-slate-700 border-slate-600 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{p.name}</span>
                    {isPlaced && (
                      <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/50">
                        已放置
                      </Badge>
                    )}
                  </div>
                  {isPlaced && (
                    <p className="text-xs text-slate-400 mt-1">
                      {locations.find((l) => l.id === p.locationId)?.name}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 地图 */}
        <div className="flex-1 p-4">
          <PlacementMap onPlace={handlePlace} />
        </div>
      </div>
    </div>
  );
}

// ==================== 放置地图组件 ====================

import { useState } from 'react';

function PlacementMap({ onPlace }: { onPlace: (pid: string, lid: string) => void }) {
  const { players, locations } = useGameStore();
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const unplacedPlayers = players.filter((p) => !p.locationId);
  const placedPlayers = players.filter((p) => p.locationId);

  const MAP_W = 100;
  const MAP_H = 100;

  return (
    <div className="w-full h-full relative">
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="w-full h-full bg-slate-800 rounded-xl border border-slate-700"
      >
        {/* 连线 */}
        {locations.map((loc) =>
          loc.connectedTo.map((connId) => {
            if (connId <= loc.id) return null;
            const target = locations.find((l) => l.id === connId);
            if (!target) return null;
            return (
              <line
                key={`${loc.id}_${connId}`}
                x1={loc.x}
                y1={loc.y}
                x2={target.x}
                y2={target.y}
                stroke="#334155"
                strokeWidth="0.8"
              />
            );
          })
        )}

        {/* 地点 */}
        {locations.map((loc) => {
          const locPlayers = placedPlayers.filter((p) => p.locationId === loc.id);

          return (
            <g
              key={loc.id}
              onClick={() => {
                if (selectedPlayer) {
                  onPlace(selectedPlayer, loc.id);
                  setSelectedPlayer(null);
                }
              }}
              style={{ cursor: selectedPlayer ? 'pointer' : 'default' }}
            >
              {/* 可选高亮 */}
              {selectedPlayer && (
                <circle
                  cx={loc.x}
                  cy={loc.y}
                  r={6}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="1"
                  opacity="0.6"
                >
                  <animate
                    attributeName="r"
                    values="6;7;6"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              <circle
                cx={loc.x}
                cy={loc.y}
                r={4.5}
                fill={locPlayers.length > 0 ? '#475569' : '#334155'}
                stroke={selectedPlayer ? '#6366f1' : '#475569'}
                strokeWidth="1"
              />

              <text
                x={loc.x}
                y={loc.y + 9}
                textAnchor="middle"
                fontSize="3.2"
                fill="#94a3b8"
                fontWeight="500"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {loc.name}
              </text>

              {/* 已放置的玩家 */}
              {locPlayers.map((p, i) => {
                const angle = (2 * Math.PI * i) / Math.max(locPlayers.length, 1) - Math.PI / 2;
                const offset = 7;
                const px = loc.x + Math.cos(angle) * offset;
                const py = loc.y + Math.sin(angle) * offset;

                return (
                  <g key={p.id}>
                    <circle
                      cx={px}
                      cy={py}
                      r={2.8}
                      fill="#6366f1"
                      stroke="white"
                      strokeWidth="0.5"
                    />
                    <text
                      x={px}
                      y={py + 1}
                      textAnchor="middle"
                      fontSize="2.8"
                      fill="white"
                      fontWeight="bold"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {p.name.charAt(0)}
                    </text>
                  </g>
                );
              })}

              {/* 人数 */}
              {locPlayers.length > 0 && (
                <text
                  x={loc.x + 5.5}
                  y={loc.y - 4}
                  textAnchor="middle"
                  fontSize="3"
                  fill="#818cf8"
                  fontWeight="bold"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {locPlayers.length}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* 底部：选择玩家 */}
      {unplacedPlayers.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 bg-slate-800/95 backdrop-blur rounded-xl border border-slate-700 p-3">
          <p className="text-xs text-slate-400 mb-2">选择要放置的玩家，然后点击地图上的地点：</p>
          <div className="flex flex-wrap gap-2">
            {unplacedPlayers.map((p) => (
              <Button
                key={p.id}
                variant={selectedPlayer === p.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPlayer(selectedPlayer === p.id ? null : p.id)}
                className={
                  selectedPlayer === p.id
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
                }
              >
                {p.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
