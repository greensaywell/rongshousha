import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getIdentityColor, getIdentityName } from '@/types/game';
import { getHeroById, HERO_POOL } from '@/data/heroData';
import { HERO_POOL_V1_1_IDS } from '@/data/gameData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, ChevronRight, Shield, Swords, Sparkles } from 'lucide-react';

export function IdentityReveal() {
  const {
    players,
    heroPoolEnabled,
    assignHeroes,
    startPlacement,
  } = useGameStore();

  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [allRevealed, setAllRevealed] = useState(false);

  const hasHeroesAssigned = players.length > 0 && players[0].heroId !== '';

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const revealAll = () => {
    setRevealedIds(new Set(players.map((p) => p.id)));
    setAllRevealed(true);
  };

  const hideAll = () => {
    setRevealedIds(new Set());
    setAllRevealed(false);
  };

  const killers = players.filter((p) => p.identity === 'killer');
  const civilians = players.filter((p) => p.identity === 'civilian');

  // 是否可以进入下一阶段
  const canProceed = !heroPoolEnabled || hasHeroesAssigned;

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* 头部 */}
      <header className="px-3 md:px-6 py-3 md:py-4 border-b border-slate-700 flex flex-col md:flex-row items-start md:items-center gap-2 md:justify-between">
        <div className="w-full md:w-auto">
          <h1 className="text-lg md:text-xl font-bold text-white">身份发布阶段</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            杀手 <span className="text-red-400 font-bold">{killers.length}</span> 人
            <span className="mx-2">|</span>
            平民 <span className="text-blue-400 font-bold">{civilians.length}</span> 人
            {heroPoolEnabled && (
              <>
                <span className="mx-2">|</span>
                <span className="text-amber-400 font-bold">
                  {players.filter((p) => p.heroId).length}
                </span>{' '}
                人已分配英雄
                <span className="mx-2">|</span>
                <span className="text-cyan-400 text-xs">
                  英雄池1.1（{HERO_POOL_V1_1_IDS.length}名英雄）
                </span>
              </>
            )}
          </p>
          {/* 英雄池1.1列表 */}
          {heroPoolEnabled && (
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              <span className="text-xs text-slate-500 mr-1">英雄池：</span>
              {HERO_POOL_V1_1_IDS.map((heroId) => {
                const hero = HERO_POOL.find((h) => h.id === heroId);
                if (!hero) return null;
                return (
                  <Badge
                    key={heroId}
                    variant="outline"
                    className="text-[10px] h-4 px-1"
                    style={{ borderColor: hero.color + '60', color: hero.color }}
                  >
                    {hero.name}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-2 md:mt-0">
          {/* 随机分配英雄按钮 */}
          {heroPoolEnabled && !hasHeroesAssigned && (
            <Button
              variant="outline"
              size="sm"
              onClick={assignHeroes}
              className="border-amber-500 text-amber-400 hover:bg-amber-950 hover:text-amber-300"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              随机分配英雄
            </Button>
          )}
          {heroPoolEnabled && hasHeroesAssigned && (
            <Badge
              variant="outline"
              className="text-xs text-amber-400 border-amber-500/50"
            >
              英雄已分配
            </Badge>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={allRevealed ? hideAll : revealAll}
            className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            {allRevealed ? (
              <>
                <EyeOff className="w-4 h-4 mr-1.5" />
                全部隐藏
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-1.5" />
                全部显示
              </>
            )}
          </Button>

          <Button
            onClick={startPlacement}
            disabled={!canProceed}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            确认，进入角色放置
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </header>

      {/* 身份卡片 */}
      <main className="flex-1 overflow-auto p-3 md:p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {players.map((player) => {
            const isRevealed = revealedIds.has(player.id);
            const color = getIdentityColor(player.identity);
            const isKiller = player.identity === 'killer';
            const hero = getHeroById(player.heroId);
            const heroColor = hero ? hero.color : '#6b7280';

            return (
              <div
                key={player.id}
                onClick={() => toggleReveal(player.id)}
                className="relative rounded-lg border border-slate-700 overflow-hidden cursor-pointer hover:border-slate-500 transition-all"
              >
                {/* 顶部色条 */}
                <div
                  className="h-1.5"
                  style={{
                    background: hero
                      ? `linear-gradient(90deg, ${color}40, ${heroColor})`
                      : isRevealed ? color : '#475569',
                  }}
                />

                <div className="p-4">
                  {/* 玩家名字 */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-white">{player.name}</h3>
                  </div>

                  {/* 英雄信息 */}
                  {hero && (
                    <div
                      className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded-md"
                      style={{ backgroundColor: heroColor + '15', border: `1px solid ${heroColor}30` }}
                    >
                      {/* TODO: 英雄头像占位 */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ backgroundColor: heroColor + '30', color: heroColor, border: `2px solid ${heroColor}60` }}
                      >
                        {/* TODO: 替换为 hero.assets.avatar */}
                        {hero.name.charAt(0)}
                      </div>
                      <div>
                        <span className="text-sm font-medium" style={{ color: heroColor }}>
                          {hero.name}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">{hero.title}</span>
                        <span
                          className="text-[10px] ml-2 px-1.5 py-0.5 rounded-full font-mono font-bold"
                          style={{ backgroundColor: heroColor + '20', color: heroColor }}
                        >
                          速度 {hero.speed}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 身份展示 */}
                  {isRevealed ? (
                    <div className="space-y-2">
                      <div
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg"
                        style={{
                          backgroundColor: color + '20',
                          border: `1px solid ${color}40`,
                        }}
                      >
                        {isKiller ? (
                          <Swords className="w-5 h-5" style={{ color }} />
                        ) : (
                          <Shield className="w-5 h-5" style={{ color }} />
                        )}
                        <span className="text-lg font-bold" style={{ color }}>
                          {getIdentityName(player.identity)}
                        </span>
                      </div>

                      {/* 英雄技能 */}
                      {hero && (
                        <div className="space-y-1 mt-2">
                          {hero.skills.map((skill) => (
                            <div
                              key={skill.id}
                              className="bg-slate-800 rounded px-2.5 py-1.5 border border-slate-700"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-200 font-medium">
                                  {skill.name}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-xs px-1 py-0 h-4"
                                  style={{
                                    borderColor: heroColor + '60',
                                    color: heroColor,
                                  }}
                                >
                                  {skill.limit === 'once_per_game' ? '每局1次' : skill.limit === 'once_per_round' ? '每轮1次' : skill.limit}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {skill.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-sm text-slate-400">
                        {isKiller
                          ? '隐藏身份，消灭所有平民即可获胜。'
                          : '找出所有杀手并将其投票出局即可获胜。'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-6">
                      <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center">
                        <span className="text-2xl text-slate-500">?</span>
                      </div>
                    </div>
                  )}
                </div>

                {!isRevealed && (
                  <div className="px-4 pb-3 text-center">
                    <span className="text-xs text-slate-500">点击展开查看身份和英雄</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 底部提示 */}
        <div className="max-w-6xl mx-auto mt-6 text-center space-y-2">
          {heroPoolEnabled && !hasHeroesAssigned && (
            <p className="text-sm text-amber-400">
              身份已分配，点击「随机分配英雄」为每位玩家抽取英雄
            </p>
          )}
          {canProceed && (
            <p className="text-sm text-slate-500">
              所有分配已完成，点击「确认，进入角色放置」开始游戏
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
