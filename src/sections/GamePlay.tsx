import { useState, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { Player, Location } from '@/types/game';
import {
  getPhaseName,
  getPhaseActionHint,
  getIdentityColor,
  getIdentityName,
} from '@/types/game';
import { getPlayersAtLocation, getAllPlayersAtLocation } from '@/data/gameData';
import { getHeroById } from '@/data/heroData';
import type { HeroSkill } from '@/types/hero';
import { VotePhase } from '@/sections/VotePhase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ChevronRight,
  Users,
  MapPin,
  RotateCcw,
  AlertTriangle,
  Navigation,
  Lock,
  Zap,
  Skull,
  Heart,
  ArrowRight,
  Swords,
  Shield,
  Eye,
  X,
  Sparkles,
  EyeOff,
  Footprints,
  Hand,
  Wind,
  ScanEye,
} from 'lucide-react';

const MAP_W = 100;
const MAP_H = 100;

// ==================== 主界面 ====================

export function GamePlay() {
  const {
    phase,
    round,
    players,
    locations,
    nextPhase,
    resetGame,
  } = useGameStore();

  const { pendingAttacks } = useGameStore();
  const alivePlayers = players.filter((p) => p.status === 'alive');
  const deadPlayers = players.filter((p) => p.status === 'dead');
  const phaseName = getPhaseName(phase);
  const actionHint = getPhaseActionHint(phase);

  // 地图显示模式：是否显示杀手颜色
  const [showKillers, setShowKillers] = useState(true);

  // 投票阶段使用独立界面
  if (phase === 'vote') {
    return <VotePhase />;
  }

  return (
    <div className="h-full flex flex-col gap-2 md:gap-3">
      {/* 顶部状态栏 */}
      <div className="flex flex-wrap items-center gap-2 bg-white rounded-lg border px-3 md:px-4 py-2 md:py-3">
        <Badge variant="secondary" className="text-xs md:text-sm font-mono shrink-0">
          第 {round} 轮
        </Badge>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm md:text-base font-bold text-slate-900 truncate">{phaseName}</h2>
        </div>
        <div className="flex items-center gap-1 md:gap-2 shrink-0 flex-wrap">
          <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
            <Heart className="w-3 h-3 mr-1" />
            存活 {alivePlayers.length}
          </Badge>
          {pendingAttacks.length > 0 && (
            <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
              <Swords className="w-3 h-3 mr-1" />
              已记录 {pendingAttacks.length} 次攻击
            </Badge>
          )}
          {deadPlayers.length > 0 && (
            <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">
              <Skull className="w-3 h-3 mr-1" />
              死亡 {deadPlayers.length}
            </Badge>
          )}
        </div>
      </div>

      {/* 操作提示 */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 md:px-4 py-2 md:py-2.5 flex items-start gap-2">
        <AlertTriangle className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs md:text-sm text-amber-800">{actionHint}</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-2 md:gap-3 min-h-0 overflow-hidden">
        {/* 左侧：地图 */}
        <Card className="flex-1 flex flex-col min-h-[200px] max-h-[45vh] lg:max-h-none">
          <CardHeader className="pb-2 shrink-0 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Navigation className="w-4 h-4 text-blue-600" />
              游戏地图
            </CardTitle>
            <button
              onClick={() => setShowKillers(!showKillers)}
              className="bg-white rounded-md px-2 py-1 shadow-sm border text-[11px] font-medium flex items-center gap-1 hover:bg-slate-50 transition-colors"
            >
              {showKillers ? (
                <><Eye className="w-3 h-3 text-red-600" /><span className="text-red-700 text-[11px]">显杀手</span></>
              ) : (
                <><EyeOff className="w-3 h-3 text-blue-600" /><span className="text-blue-700 text-[11px]">隐杀手</span></>
              )}
            </button>
          </CardHeader>
          <CardContent className="flex-1 p-1 md:p-2">
            <div className="w-full h-full min-h-[200px]">
              <GameMapWithNumbers showKillers={showKillers} />
            </div>
          </CardContent>
        </Card>

        {/* 右侧：角色操作卡片 / 凌宇神社查看 */}
        <Card className="w-full lg:w-[400px] shrink-0 flex flex-col min-h-0 max-h-[50vh] lg:max-h-none overflow-hidden">
          <CardHeader className="pb-2 shrink-0">
            <CardTitle className="flex items-center gap-2 text-sm">
              {phase === 'shrine_vision' ? (
                <><Eye className="w-4 h-4 text-purple-600" />凌宇神社 - 神视</>
              ) : (
                <><Users className="w-4 h-4 text-indigo-600" />角色操作面板</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-0 overflow-auto">
            {phase === 'shrine_vision' ? (
              <ShrineVisionPanel />
            ) : (
              <div className="px-3 md:px-4 pb-4 space-y-3">
                {players.map((player, index) => (
                  <PlayerActionCard
                    key={player.id}
                    index={index}
                    player={player}
                    allPlayers={players}
                    locations={locations}
                    phase={phase}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 底部阶段控制 */}
      <div className="flex gap-2 shrink-0 sticky bottom-0 bg-white p-2 rounded-lg border shadow-sm">
        <Button onClick={nextPhase} className="flex-1 font-semibold" size="sm">
          进入下一阶段
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { if (confirm('确定重置游戏？')) resetGame(); }}
          className="shrink-0"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ==================== 凌宇神社查看面板 ====================

function ShrineVisionPanel() {
  const { players, locations, shrineVisionPlayerId, locationVisits, nextPhase } = useGameStore();
  const [selectedLocId, setSelectedLocId] = useState<string | null>(null);

  const shrinePlayer = players.find((p) => p.id === shrineVisionPlayerId);
  const hero = shrinePlayer?.heroId ? getHeroById(shrinePlayer.heroId) : null;

  // 选择地点后显示经过该地点的人员
  const selectedVisits = selectedLocId ? (locationVisits[selectedLocId] || []) : [];
  const visitPlayers = selectedVisits
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean);
  const selectedLoc = locations.find((l) => l.id === selectedLocId);

  return (
    <div className="h-full flex flex-col p-4 gap-3">
      {/* 说明 */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
        <p className="text-sm text-purple-700">
          <span className="font-bold">{shrinePlayer?.name}</span>
          {hero && <span style={{ color: hero.color }}>（{hero.name}）</span>}
          获得神视能力，可选择一个地点查看本轮经过该地点的人员名单。
        </p>
      </div>

      {!selectedLocId ? (
        /* 地点选择 */
        <div className="flex-1">
          <p className="text-sm text-slate-600 mb-2">选择一个地点查看：</p>
          <div className="grid grid-cols-2 gap-2">
            {locations.map((loc, i) => (
              <Button
                key={loc.id}
                variant="outline"
                size="sm"
                onClick={() => setSelectedLocId(loc.id)}
                className="h-auto py-2 text-xs justify-start"
              >
                <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 mr-2 shrink-0">
                  {i + 1}
                </span>
                <span className="truncate">{loc.name}</span>
                {loc.effect && loc.effect.type !== 'placeholder' && (
                  <span
                    className="ml-auto text-[10px] px-1 py-0.5 rounded shrink-0"
                    style={{ backgroundColor: '#f59e0b20', color: '#d97706' }}
                  >
                    {loc.effect.name}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        /* 查看结果 */
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">
              <MapPin className="w-3.5 h-3.5 inline text-slate-400 mr-1" />
              {selectedLoc?.name} 的经过记录
            </p>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedLocId(null)}>
              重新选择
            </Button>
          </div>

          {visitPlayers.length > 0 ? (
            <div className="space-y-1.5">
              {visitPlayers.map((p, idx) => (
                <div
                  key={p!.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-50 border"
                >
                  <span className="text-xs text-slate-400 font-mono">{idx + 1}.</span>
                  <span className="text-sm font-medium text-slate-700">{p!.name}</span>
                  {p!.heroId && getHeroById(p!.heroId) && (
                    <Badge variant="outline" className="text-[10px] h-5" style={{ borderColor: getHeroById(p!.heroId)!.color + '60', color: getHeroById(p!.heroId)!.color }}>
                      {getHeroById(p!.heroId)!.name}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className="text-[10px] h-5 ml-auto"
                    style={{
                      borderColor: getIdentityColor(p!.identity),
                      color: getIdentityColor(p!.identity),
                    }}
                  >
                    {getIdentityName(p!.identity)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed">
              本轮无人经过 {selectedLoc?.name}
            </div>
          )}
        </div>
      )}

      {/* 完成按钮 */}
      <Button onClick={nextPhase} className="w-full font-semibold bg-purple-600 hover:bg-purple-700" size="sm">
        <Eye className="w-4 h-4 mr-1.5" />
        完成神视
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

// ==================== 角色操作卡片 ====================

function PlayerActionCard({
  index,
  player,
  allPlayers,
  locations,
  phase,
}: {
  index: number;
  player: Player;
  allPlayers: Player[];
  locations: Location[];
  phase: string;
}) {
  const { movePlayer, killPlayer, addEvent, activateKungFu, kungFuActivePlayers, trackedPlayerId, trackRecords, addTrackRecord, roundSkillUsage, incrementRoundSkillUsage,droneLocationId, dronePlayerId, droneRound, locationVisits  } = useGameStore();
  const hasKungFu = kungFuActivePlayers.includes(player.id);
  const round = useGameStore((state) => state.round);
  const [moveInput, setMoveInput] = useState('');
  const [attackError, setAttackError] = useState('');

  // 英雄技能状态（once_per_game 技能使用组件 state，once_per_round 技能使用 store 的 roundSkillUsage）
  const [skillUsage, setSkillUsage] = useState<Record<string, number>>({}); // skillId -> usedCount
  const [selectingSkill, setSelectingSkill] = useState<string | null>(null); // 当前正在选择目标的技能ID
  const [skillResult, setSkillResult] = useState<{ skillName: string; message: string } | null>(null);

  // 张扬-断路技能状态
  const [cutConnectionMode, setCutConnectionMode] = useState<{
    active: boolean;
    firstLocId: string | null;
    skillId: string | null;
  }>({ active: false, firstLocId: null, skillId: null });

  // 王力-大力射门技能状态
  const [bigShotMode, setBigShotMode] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  const playerNum = index + 1;
  const isDead = player.status === 'dead';
  const loc = locations.find((l) => l.id === player.locationId);
  const locName = loc ? loc.name : '未放置';

  // 从 store 获取 pendingAttacks 来检查是否被攻击
  const { pendingAttacks } = useGameStore();
  const isAttacked = pendingAttacks.some((a: { targetId: string }) => a.targetId === player.id);

  // 英雄信息
  const hero = player.heroId ? getHeroById(player.heroId) : null;
  const heroColor = hero ? hero.color : '#6b7280';

  // 地点编号映射
  const locNumberMap = new Map<string, number>();
  locations.forEach((l, i) => locNumberMap.set(l.id, i + 1));

  // 角色编号映射
  const playerNumberMap = new Map<string, number>();
  allPlayers.forEach((p, i) => playerNumberMap.set(p.id, i + 1));

  // 同地点的其他存活角色
  const sameLocationPlayers = player.locationId
    ? allPlayers.filter((p) => p.id !== player.id && p.locationId === player.locationId && p.status === 'alive')
    : [];

  // 同地点的尸体（死亡角色，仅在探查阶段显示）
  const isInvestigatePhase = phase.startsWith('investigate');
  const sameLocationDeadPlayers = player.locationId && isInvestigatePhase
    ? allPlayers.filter((p) => p.id !== player.id && p.locationId === player.locationId && p.status === 'dead')
    : [];

  // 商业街人头攒动效果：平民在此探查时看不到周围的人和尸体
/*
  const isCrowded = isInvestigatePhase
    && player.identity === 'civilian'
    && loc?.effect?.type === 'crowded';
*/
  const isCrowded = player.identity === 'civilian'
    && loc?.effect?.type === 'crowded';

  // 处理移动输入
  const handleMoveSubmit = () => {
    const input = moveInput.trim();
    if (!input) return;
    setAttackError('');

    const killMatch = input.match(/^杀(\d+)$/);
    if (killMatch && player.identity === 'killer') {
      const targetNum = parseInt(killMatch[1]);
      const target = allPlayers[targetNum - 1];
      if (!target || target.status === 'dead' || target.locationId !== player.locationId) {
        setAttackError('请重新选择角色');
        return;
      }
      // 检查禁武效果：该地点内任何攻击技能无法使用
      if (loc?.effect?.type === 'no_attack') {
        setAttackError(`【${loc.effect.name || '禁武'}】该地点内无法发起攻击`);
        return;
      }
      // 检查杀手攻击次数
      const isAsylum = loc?.effect?.type === 'asylum_extra_attack';
      if (isAsylum && player.asylumAttackRemaining <= 0) {
        setAttackError('你已进行过攻击');
        return;
      }
      if (!isAsylum && player.normalAttackRemaining <= 0) {
        setAttackError('你已进行过攻击');
        return;
      }
      // 传递 attackerId 用于功夫反击判定
      killPlayer(target.id, player.id);
      // 消耗对应攻击次数
      useGameStore.getState().consumeAttackCharge(player.id, loc?.effect?.type);
      // 白野追踪：记录刀人行为（被追踪目标才会记录）
      addTrackRecord(player.id, '对同地点玩家发起攻击', player.locationId);
      setMoveInput('');
      return;
    }

    const locNum = parseInt(input);
    if (!isNaN(locNum) && locNum >= 1 && locNum <= locations.length) {
      const targetLoc = locations[locNum - 1];
      if (targetLoc && !targetLoc.isBlocked) {
        // 检查是否只能移动到相邻地点（传送可跳过此限制）
        const currentLoc = locations.find((l) => l.id === player.locationId);
        if (!player.teleportReady && currentLoc) {
          const isConnected = currentLoc.connectedTo.includes(targetLoc.id);
          // 志成桥【断桥】效果：可单向移动到指定额外地点
          const isBridgeJump = currentLoc.effect?.type === 'bridge_jump' &&
            currentLoc.effect?.extraDestinations?.includes(targetLoc.name);
          if (!isConnected && !isBridgeJump) {
            setAttackError('重新选择移动目标');
            return;
          }
        }
        movePlayer(player.id, targetLoc.id);
        setMoveInput('');
      }
      return;
    }

    if (player.identity === 'killer' && input.startsWith('杀')) {
      setAttackError('请重新选择角色');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleMoveSubmit();
  };

  // ==================== 英雄技能系统 ====================

  /** 获取技能已使用次数 */
  const getSkillUsedCount = (skill: HeroSkill): number => {
    // once_per_round 技能从 store 的 roundSkillUsage 读取（每轮重置，不受组件卸载影响）
    if (skill.limit === 'once_per_round') {
      return roundSkillUsage[skill.id] || 0;
    }
    // once_per_game 技能从组件 state 读取
    return skillUsage[skill.id] || 0;
  };

  /** 获取技能可选目标 */
  const getSkillTargets = (skill: HeroSkill): Player[] => {
    if (isDead) return [];
    switch (skill.targetType) {
      case 'self':
        return [player]; // 对自己使用
      case 'same_location_player':
        return sameLocationPlayers;
      case 'any_player':
        return allPlayers.filter((p) => p.id !== player.id && p.status === 'alive');
      default:
        return [];
    }
  };

  /** 执行技能 */
  const executeSkill = (skill: HeroSkill, target: Player) => {
    // 标记技能已使用：once_per_round 技能存入 store（每轮重置），once_per_game 技能存入组件 state
    if (skill.limit === 'once_per_round') {
      incrementRoundSkillUsage(skill.id);
    } else {
      setSkillUsage((prev) => ({ ...prev, [skill.id]: (prev[skill.id] || 0) + 1 }));
    }
    setSelectingSkill(null);

    // 白野追踪：记录使用技能（不暴露具体技能名称，只有被追踪目标才会记录）
    addTrackRecord(player.id, '使用了技能', player.locationId);

    switch (skill.id) {
      case 'niangao_kungfu': {
        // 年糕：功夫 - 对自己激活功夫状态
        activateKungFu(player.id);
        setSkillResult({ skillName: '功夫', message: '功夫已激活！本行动阶段内任何同房间攻击都将被反击' });
        setTimeout(() => setSkillResult(null), 5000);
        break;
      }
      case 'xiling_kill_same_room': {
        // 西凌：影杀 - 检查禁武效果
        const currentLoc = locations.find((l) => l.id === player.locationId);
        if (currentLoc?.effect?.type === 'no_attack') {
          setSkillResult({ skillName: '影杀', message: `【${currentLoc.effect.name || '禁武'}】该地点内无法使用攻击技能` });
          setTimeout(() => setSkillResult(null), 5000);
          // 退还技能使用次数
          setSkillUsage((prev) => ({ ...prev, [skill.id]: Math.max(0, (prev[skill.id] || 0) - 1) }));
          return;
        }
        // 标记目标为濒死（传递 attackerId 用于功夫反击）
        killPlayer(target.id, player.id);
        // 白野追踪：记录刀人行为（被追踪目标才会记录）
        addTrackRecord(player.id, '对同地点玩家发起攻击', player.locationId);
        addEvent({
          round: useGameStore.getState().round,
          phase: useGameStore.getState().phase,
          type: 'info',
          description: `${player.name}（西凌）使用【影杀】将 ${target.name} 标记为濒死`,
          playerId: player.id,
          targetId: target.id,
        });
        break;
      }
      case 'kexiong_investigate': {
        // 科雄：洞察 - 查验身份（主持人直接看到结果）
        const identity = getIdentityName(target.identity);
        addEvent({
          round: useGameStore.getState().round,
          phase: useGameStore.getState().phase,
          type: 'info',
          description: `${player.name}（科雄）使用【洞察】查验 ${target.name}：${identity}`,
          playerId: player.id,
          targetId: target.id,
        });
        setSkillResult({ skillName: '洞察', message: `${target.name} 的身份是：${identity}` });
        setTimeout(() => setSkillResult(null), 5000);
        break;
      }
      case 'tianyi_investigate_same_room': {
        // 天燚先生：识破 - 查验同地点玩家身份
        const identity = getIdentityName(target.identity);
        addEvent({
          round: useGameStore.getState().round,
          phase: useGameStore.getState().phase,
          type: 'info',
          description: `${player.name}（天燚先生）使用【识破】查验同地点的 ${target.name}：${identity}`,
          playerId: player.id,
          targetId: target.id,
        });
        setSkillResult({ skillName: '识破', message: `${target.name} 的身份是：${identity}` });
        setTimeout(() => setSkillResult(null), 5000);
        break;
      }
      case 'yanzhuo_suplex': {
        // 言浊：过肩摔 - 目标获得"停步"，跳过下一个行动阶段
        useGameStore.getState().applyHalt(target.id);
        addEvent({
          round: useGameStore.getState().round,
          phase: useGameStore.getState().phase,
          type: 'info',
          description: `${player.name}（言浊）使用【过肩摔】将 ${target.name} 摔倒！${target.name} 获得"停步"`,
          playerId: player.id,
          targetId: target.id,
        });
        setSkillResult({ skillName: '过肩摔', message: `${target.name} 获得"停步"，将跳过下一个行动阶段` });
        setTimeout(() => setSkillResult(null), 5000);
        break;
      }
      case 'yeyu_stealth': {
        // 夜羽：潜伏 - 自己获得"停步"，跳过下一个行动阶段
        useGameStore.getState().applyHalt(player.id);
        addEvent({
          round: useGameStore.getState().round,
          phase: useGameStore.getState().phase,
          type: 'info',
          description: `${player.name}（夜羽）使用【潜伏】进入隐匿状态，获得"停步"`,
          playerId: player.id,
        });
        setSkillResult({ skillName: '潜伏', message: '获得"停步"，将跳过下一个行动阶段' });
        setTimeout(() => setSkillResult(null), 5000);
        break;
      }
      case 'fengming_teleport': {
        // 冯明：传送 - 下次移动可到达任意地点
        useGameStore.getState().activateTeleport(player.id);
        addEvent({
          round: useGameStore.getState().round,
          phase: useGameStore.getState().phase,
          type: 'info',
          description: `${player.name}（冯明）使用【传送】，下次移动可到达任意地点`,
          playerId: player.id,
        });
        setSkillResult({ skillName: '传送', message: '传送已激活，下次移动可到达任意地点' });
        setTimeout(() => setSkillResult(null), 5000);
        break;
      }
      case 'zhuxun_double_move': {
        // 竹隼：疾行 - 本移动阶段可连续移动两次
        useGameStore.getState().activateDoubleMove(player.id);
        addEvent({
          round: useGameStore.getState().round,
          phase: useGameStore.getState().phase,
          type: 'info',
          description: `${player.name}（竹隼）使用【疾行】，本移动阶段可连续移动两次`,
          playerId: player.id,
        });
        setSkillResult({ skillName: '疾行', message: '疾行已激活，本移动阶段可连续移动两次' });
        setTimeout(() => setSkillResult(null), 5000);
        break;
      }
      case 'baiye_track': {
        // 白野：追踪 - 标记同地点玩家，追踪其后续行动
        const { setTrackedPlayer } = useGameStore.getState();
        setTrackedPlayer(target.id);
        addEvent({
          round: useGameStore.getState().round,
          phase: useGameStore.getState().phase,
          type: 'info',
          description: `${player.name}（白野）使用【追踪】标记了同地点的 ${target.name}，将追踪其本轮后续行动`,
          playerId: player.id,
          targetId: target.id,
        });
        setSkillResult({ skillName: '追踪', message: `已标记 ${target.name}，将追踪其从本回合行动阶段之后的所有操作和经过地点，直到本轮结束` });
        setTimeout(() => setSkillResult(null), 8000);
        break;
      }
      case 'zhangyang_cut_connection': {
        // 张扬：断路 - 这个技能通过地点选择UI处理，不在此处执行
        break;
      }
      case 'jiangfeng_drone': {
        // 江枫：侦察无人机 - 记录当前地点，本轮结束时显示经过人员
        const currentLoc = locations.find((l) => l.id === player.locationId);
        if (currentLoc) {
          useGameStore.getState().setDrone(player.id, currentLoc.id);
          addEvent({
            round: useGameStore.getState().round,
            phase: useGameStore.getState().phase,
            type: 'info',
            description: `${player.name}（江枫）在 ${currentLoc.name} 放置了【侦察无人机】，开始记录经过人员`,
            playerId: player.id,
            locationId: currentLoc.id,
          });
          setSkillResult({ skillName: '侦察无人机', message: `已在 ${currentLoc.name} 放置无人机，本轮结束时将报告经过人员` });
          setTimeout(() => setSkillResult(null), 5000);
        }
        break;
      }
      default:
        break;
    }
  };

  /** 执行断路 - 切断两个地点之间的道路 */
  const executeCutConnection = (locAId: string, locBId: string) => {
    const locA = locations.find((l) => l.id === locAId);
    const locB = locations.find((l) => l.id === locBId);
    if (!locA || !locB) return;

    const hasConnection = locA.connectedTo.includes(locBId);
    if (hasConnection) {
      // 切断道路
      useGameStore.getState().severConnection(locAId, locBId);
      // 白野追踪：记录使用技能（被追踪目标才会记录）
      addTrackRecord(player.id, '使用了技能', player.locationId);
      addEvent({
        round: useGameStore.getState().round,
        phase: useGameStore.getState().phase,
        type: 'info',
        description: `${player.name}（张扬）使用【断路】切断了 ${locA.name} 与 ${locB.name} 之间的道路`,
        playerId: player.id,
      });
      setSkillResult({ skillName: '断路', message: `已切断 ${locA.name} 与 ${locB.name} 之间的道路` });
      setTimeout(() => setSkillResult(null), 5000);
      // 只有成功切断道路才标记技能已使用
      setSkillUsage((prev) => ({ ...prev, ['zhangyang_cut_connection']: (prev['zhangyang_cut_connection'] || 0) + 1 }));
      setCutConnectionMode({ active: false, firstLocId: null, skillId: null });
    } else {
      // 没有道路相连：提示错误，不消耗使用次数，回到选择第1个地点的状态
      setSkillResult({ skillName: '断路', message: `${locA.name} 与 ${locB.name} 之间没有道路相连，请重新选择` });
      setTimeout(() => setSkillResult(null), 5000);
      // 重置到选择第1个地点的状态
      setCutConnectionMode({ active: true, firstLocId: null, skillId: 'zhangyang_cut_connection' });
    }
  };

  // 当前正在选择目标的技能
  const activeSkill = selectingSkill && hero
    ? hero.skills.find((s) => s.id === selectingSkill)
    : null;
  const skillTargets = activeSkill ? getSkillTargets(activeSkill) : [];

  return (
    <div
      ref={cardRef}
      className={`rounded-lg border transition-all ${
        isDead
          ? 'bg-red-50/60 border-red-200 opacity-60'
          : isAttacked
            ? 'bg-orange-50 border-orange-300 opacity-90'
            : selectingSkill
              ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-200'
              : 'bg-white border-slate-200'
      }`}
    >
      {/* ====== 卡片头部 ====== */}
      <div className="px-3 py-2 flex items-center gap-2 border-b border-slate-100">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            isDead ? 'bg-red-200 text-red-700' : isAttacked ? 'bg-orange-200 text-orange-700' : selectingSkill ? 'bg-amber-200 text-amber-700' : 'bg-indigo-100 text-indigo-700'
          }`}
        >
          {playerNum}
        </div>

        <span className={`text-sm font-bold ${isDead ? 'line-through text-slate-400' : isAttacked ? 'text-orange-700' : 'text-slate-900'}`}>
          {player.name}
        </span>

        {/* 英雄 + 身份 */}
        <div className="flex items-center gap-1.5">
          {hero && (
            <>
              {/* TODO: 英雄头像 - 替换为 <img src={hero.assets.avatar} /> */}
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ backgroundColor: heroColor + '20', color: heroColor, border: `1.5px solid ${heroColor}50` }}
              >
                {hero.name.charAt(0)}
              </div>
              <Badge
                variant="outline"
                className="text-xs shrink-0"
                style={{ borderColor: heroColor + '60', color: heroColor }}
              >
                {hero.name}
              </Badge>
              <span
                className="text-[10px] px-1 rounded font-mono shrink-0"
                style={{ backgroundColor: heroColor + '15', color: heroColor }}
              >
                速{hero.speed}
              </span>
            </>
          )}
          <Badge
            variant="outline"
            className="text-xs shrink-0"
            style={{ borderColor: getIdentityColor(player.identity), color: getIdentityColor(player.identity) }}
          >
            {getIdentityName(player.identity)}
          </Badge>
          {/* 杀手显示攻击次数 */}
          {player.identity === 'killer' && player.status === 'alive' && (
            <div className="flex items-center gap-1 text-[10px]">
              <span className="px-1 py-0.5 rounded bg-red-50 text-red-600 border border-red-200" title="常规攻击剩余">
                常{player.normalAttackRemaining}
              </span>
              <span className="px-1 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-200" title="疯人院攻击剩余">
                疯{player.asylumAttackRemaining}
              </span>
            </div>
          )}
        </div>

        {/* 状态 */}
        <div className="ml-auto flex items-center gap-1">
          {isDead ? (
            <Badge variant="destructive" className="text-xs h-5 px-1.5">
              <Skull className="w-3 h-3 mr-0.5" />
              死亡
            </Badge>
          ) : isAttacked ? (
            <Badge variant="outline" className="text-xs h-5 px-1.5 text-orange-600 border-orange-400 bg-orange-50">
              <Swords className="w-3 h-3 mr-0.5" />
              被攻击
            </Badge>
          ) : hasKungFu ? (
            <Badge variant="outline" className="text-xs h-5 px-1.5 text-amber-700 border-amber-500 bg-amber-100">
              <Shield className="w-3 h-3 mr-0.5" />
              功夫
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs h-5 px-1.5 text-green-600 border-green-400 bg-green-50">
              <Heart className="w-3 h-3 mr-0.5" />
              存活
            </Badge>
          )}
        </div>
      </div>

      {/* ====== 卡片主体 ====== */}
      <div className="px-3 py-2 space-y-2">
        {/* 位置 + 同地点角色 */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">位置：</span>
            <span className="font-mono font-bold text-slate-700">
              {loc ? `${locNumberMap.get(loc.id) ?? '?'}. ${locName}` : locName}
            </span>
            {loc?.isBlocked && <Lock className="w-3 h-3 text-red-500" />}
            {/* 地点效果标记 */}
            {loc?.effect && loc.effect.type !== 'placeholder' && (
              <span
                className="text-[10px] px-1 py-0.5 rounded font-medium"
                style={{ backgroundColor: '#f59e0b20', color: '#d97706', border: '1px solid #f59e0b40' }}
              >
                {loc.effect.name}
              </span>
            )}
          </div>

          {/* 商业街人头攒动效果：平民看不到周围的人和尸体 */}
          {isCrowded ? (
            <span className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
              商业街人头攒动
            </span>
          ) : (
            <>
              {sameLocationPlayers.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-500">同地点：</span>
                  <div className="flex gap-1">
                    {sameLocationPlayers.map((p) => (
                      <span
                        key={p.id}
                        className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700"
                      >
                        {playerNumberMap.get(p.id)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 探查阶段：显示同地点的尸体 */}
              {sameLocationDeadPlayers.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Skull className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-slate-500">尸体：</span>
                  <div className="flex gap-1.5">
                    {sameLocationDeadPlayers.map((p) => (
                      <span
                        key={p.id}
                        className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.5"
                      >
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 技能结果提示 */}
        {skillResult && (
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-md px-3 py-1.5">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="text-sm text-purple-700 font-medium">{skillResult.message}</span>
            <button onClick={() => setSkillResult(null)} className="ml-auto text-purple-400 hover:text-purple-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ====== 断路模式：选择两个地点切断道路 ====== */}
        {cutConnectionMode.active && cutConnectionMode.skillId === 'zhangyang_cut_connection' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 shrink-0" style={{ color: heroColor }} />
                <span className="text-sm font-medium" style={{ color: heroColor }}>
                  使用【断路】- 选择两个地点切断道路：
                </span>
                {cutConnectionMode.firstLocId ? (
                  <span className="text-xs text-slate-500">
                    已选第1个：{locNumberMap.get(cutConnectionMode.firstLocId)}.{locations.find((l) => l.id === cutConnectionMode.firstLocId)?.name}，请选择第2个
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">请选择第1个地点</span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-slate-500"
                onClick={() => setCutConnectionMode({ active: false, firstLocId: null, skillId: null })}
              >
                <X className="w-3.5 h-3.5 mr-1" />
                取消
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {locations.map((targetLoc, i) => {
                const isSelected = cutConnectionMode.firstLocId === targetLoc.id;
                return (
                  <Button
                    key={targetLoc.id}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    disabled={isSelected}
                    onClick={() => {
                      if (!cutConnectionMode.firstLocId) {
                        // 选择第一个地点
                        setCutConnectionMode({
                          active: true,
                          firstLocId: targetLoc.id,
                          skillId: 'zhangyang_cut_connection',
                        });
                      } else {
                        // 选择第二个地点，执行切断
                        executeCutConnection(cutConnectionMode.firstLocId, targetLoc.id);
                      }
                    }}
                    className="h-8 text-xs gap-1"
                    style={
                      isSelected
                        ? { backgroundColor: heroColor, borderColor: heroColor }
                        : { borderColor: heroColor + '40', color: heroColor }
                    }
                  >
                    <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {i + 1}
                    </span>
                    {targetLoc.name}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* ====== 大力射门模式：选择相邻地点 ====== */}
        {bigShotMode && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 shrink-0" style={{ color: heroColor }} />
                <span className="text-sm font-medium" style={{ color: heroColor }}>
                  使用【大力射门】- 选择相邻地点：
                </span>
                <span className="text-xs text-slate-500">
                  当前位置：{loc ? loc.name : '未知'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-slate-500"
                onClick={() => setBigShotMode(false)}
              >
                <X className="w-3.5 h-3.5 mr-1" />
                取消
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {(loc?.connectedTo || [])
                .map((connId) => locations.find((l) => l.id === connId))
                .filter((adj): adj is import('@/types/game').Location => adj !== undefined)
                .map((adjLoc, i) => (
                  <Button
                    key={adjLoc.id}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // 大力射门：给相邻地点内的所有存活玩家施加"停步"
                      const victims = allPlayers.filter(
                        (ap) => ap.id !== player.id && ap.status === 'alive' && ap.locationId === adjLoc.id
                      );
                      victims.forEach((v) => useGameStore.getState().applyHalt(v.id));
                      const victimNames = victims.map((v) => v.name).join('、') || '无人';
                      addEvent({
                        round: useGameStore.getState().round,
                        phase: useGameStore.getState().phase,
                        type: 'info',
                        description: `${player.name}（王力）使用【大力射门】射门至 ${adjLoc.name}！${victimNames} 获得"停步"`,
                        playerId: player.id,
                      });
                      setSkillResult({ skillName: '大力射门', message: `已射门至 ${adjLoc.name}，${victimNames} 获得"停步"` });
                      setTimeout(() => setSkillResult(null), 5000);
                      // 标记技能已使用
                      setSkillUsage((prev) => ({ ...prev, ['wangli_big_shot']: (prev['wangli_big_shot'] || 0) + 1 }));
                      setBigShotMode(false);
                    }}
                    className="h-8 text-xs gap-1"
                    style={{ borderColor: heroColor + '40', color: heroColor }}
                  >
                    <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {loc ? locations.indexOf(loc) + 1 : i + 1}
                    </span>
                    {adjLoc!.name}
                  </Button>
                ))}
              {(!loc || (loc.connectedTo || []).length === 0) && (
                <p className="text-xs text-slate-400 col-span-4">当前地点没有相邻地点</p>
              )}
            </div>
          </div>
        )}

        {/* ====== 选择目标模式 ====== */}
        {selectingSkill && activeSkill && activeSkill.targetType !== 'self' ? (
          <div className="space-y-2">
            {/* 目标选择提示 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 shrink-0" style={{ color: heroColor }} />
                <span className="text-sm font-medium" style={{ color: heroColor }}>
                  使用【{activeSkill.name}】- 选择目标：
                </span>
                <span className="text-xs text-slate-500">
                  {activeSkill.targetType === 'same_location_player'
                    ? '同地点玩家'
                    : activeSkill.targetType === 'any_player'
                      ? '任意玩家'
                      : '其他'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-slate-500"
                onClick={() => setSelectingSkill(null)}
              >
                <X className="w-3.5 h-3.5 mr-1" />
                取消
              </Button>
            </div>

            {/* 目标列表 */}
            {skillTargets.length === 0 ? (
              <div className="text-sm text-slate-400 bg-slate-50 rounded-md px-3 py-2 text-center">
                没有可选目标
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {skillTargets.map((target) => {
                  const targetNum = playerNumberMap.get(target.id) || 0;
                  const targetHero = target.heroId ? getHeroById(target.heroId) : null;
                  return (
                    <Button
                      key={target.id}
                      variant="outline"
                      size="sm"
                      onClick={() => executeSkill(activeSkill, target)}
                      className="h-8 text-xs gap-1.5 hover:scale-105 transition-transform"
                      style={{
                        borderColor: heroColor + '60',
                        color: heroColor,
                        backgroundColor: heroColor + '08',
                      }}
                    >
                      <span className="w-5 h-5 rounded-full bg-white/80 flex items-center justify-center text-[10px] font-bold shrink-0 border"
                        style={{ borderColor: heroColor + '40', color: heroColor }}
                      >
                        {targetNum}
                      </span>
                      {target.name}
                      {targetHero && (
                        <span className="text-slate-400">({targetHero.name})</span>
                      )}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ====== 正常操作模式 ====== */
          !isDead && !cutConnectionMode.active && !bigShotMode && (
            <div className="flex items-center gap-2">
              {/* 停步提示：移动阶段显示 */}
              {player.halted && useGameStore.getState().phase.startsWith('move') ? (
                <div className="flex-1 flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5">
                  <Hand className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="text-xs text-amber-700 font-medium">"停步" — 跳过本移动阶段</span>
                </div>
              ) : (
                <>
                  {/* 疾行：额外移动提示 */}
                  {player.doubleMoveActive && player.doubleMoveFirstDone && (
                    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1">
                      <Wind className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-xs text-emerald-700 font-medium">疾行：还可移动一次</span>
                    </div>
                  )}
                  {/* 移动输入框 */}
                  <div className="flex-1 flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <Input
                      placeholder={`输入地点编号移动${player.identity === 'killer' ? '，或"杀X"标记濒死' : ''}`}
                      value={moveInput}
                      onChange={(e) => { setMoveInput(e.target.value); setAttackError(''); }}
                      onKeyDown={handleKeyDown}
                      className="h-7 text-xs"
                    />
                    <Button onClick={handleMoveSubmit} size="sm" className="h-7 px-2.5 text-xs shrink-0">
                      执行
                    </Button>
                  </div>
                </>
              )}

              {/* 英雄技能按钮 */}
              {hero && hero.skills.length > 0 && (
                <div className="flex items-center gap-1 shrink-0">
                  {hero.skills.map((skill) => {
                    const used = getSkillUsedCount(skill);
                    const available = used < skill.maxUses;
                    const currentPhase = useGameStore.getState().phase;
                    const isInUsablePhase = skill.usablePhase.some((p) => currentPhase.startsWith(p));
                    const canUse = available && isInUsablePhase;

                    return (
                      <Button
                        key={skill.id}
                        variant="outline"
                        size="sm"
                        disabled={!available}
                        onClick={() => {
                          // 不在可用阶段时给出明确提示
                          if (!isInUsablePhase) {
                            const phaseNames = skill.usablePhase.map((p) => {
                              if (p.startsWith('action')) return '行动阶段';
                              if (p.startsWith('move')) return '移动阶段';
                              if (p === 'vote') return '投票阶段';
                              return p;
                            }).join('、');
                            setSkillResult({ skillName: skill.name, message: `该技能只能在${phaseNames}使用` });
                            setTimeout(() => setSkillResult(null), 3000);
                            return;
                          }
                          // self 类型技能直接执行，无需选择目标
                          if (skill.targetType === 'self') {
                            executeSkill(skill, player);
                          } else if (skill.targetType === 'location_pair') {
                            // 张扬：断路 - 进入地点选择模式
                            setCutConnectionMode({ active: true, firstLocId: null, skillId: skill.id });
                          } else if (skill.targetType === 'adjacent_location') {
                            // 王力：大力射门 - 进入相邻地点选择模式
                            setBigShotMode(true);
                          } else {
                            setSelectingSkill(skill.id);
                          }
                        }}
                        className="h-7 px-2 text-xs gap-1 shrink-0 disabled:opacity-40"
                        style={canUse ? { color: heroColor, borderColor: heroColor + '60', backgroundColor: heroColor + '08' } : {}}
                      >
                        {skill.type === 'investigate' ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : skill.id === 'niangao_kungfu' ? (
                          <Shield className="w-3.5 h-3.5" />
                        ) : skill.id === 'fengming_teleport' ? (
                          <Navigation className="w-3.5 h-3.5" />
                        ) : skill.id === 'zhuxun_double_move' ? (
                          <Wind className="w-3.5 h-3.5" />
                        ) : skill.id === 'zhangyang_cut_connection' ? (
                          <Zap className="w-3.5 h-3.5" />
                        ) : skill.id === 'baiye_track' ? (
                          <Footprints className="w-3.5 h-3.5" />
                        ) : skill.id === 'yanzhuo_suplex' ? (
                          <Hand className="w-3.5 h-3.5" />
                        ) : skill.id === 'yeyu_stealth' ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : skill.id === 'wangli_big_shot' ? (
                          <Zap className="w-3.5 h-3.5" />
                        ) : skill.id === 'jiangfeng_drone' ? (
                          <ScanEye className="w-3.5 h-3.5" />
                        ) : (
                          <Swords className="w-3.5 h-3.5" />
                        )
                        }
                        {skill.name}
                        {!available && <span className="text-slate-400 ml-0.5">(已用)</span>}
                      </Button>
                    );
                  })}
                </div>
              )}

              {/* 杀手指示器 */}
              {player.identity === 'killer' && (
                <div className="shrink-0">
                  {attackError ? (
                    <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded px-2 py-1">
                      <Swords className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-xs text-red-600 font-medium">{attackError}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2 py-1">
                      <Swords className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500">杀手</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        )}

        {/* 白野【追踪】日志：显示被标记目标的行动记录 */}
        {hero?.id === 'baiye' && trackedPlayerId && trackRecords.length > 0 && (
          <div className="mt-1 border-t border-slate-200 pt-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Footprints className="w-3 h-3" style={{ color: heroColor }} />
              <span className="text-[11px] font-bold" style={{ color: heroColor }}>
                追踪日志
              </span>
              <span className="text-[10px] text-slate-400">
                （目标：{(() => {
                  const t = allPlayers.find((p) => p.id === trackedPlayerId);
                  if (!t) return '?';
                  const idx = allPlayers.indexOf(t) + 1;
                  return `编号${idx} - ${t.name}`;
                })()}）
              </span>
            </div>
            <div className="space-y-1">
              {trackRecords.map((record, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-[11px] bg-slate-50 rounded px-2 py-1"
                >
                  <span className="text-slate-400 font-mono shrink-0">{idx + 1}.</span>
                  <span className="text-slate-500 shrink-0">
                    {record.phase === 'move1' ? '移动②'
                      : record.phase === 'move2' ? '移动③'
                      : record.phase === 'move4' ? '移动④'
                      : record.phase === 'investigate4' ? '探查④'
                      : record.phase === 'action4' ? '行动④'
                      : record.phase === 'settlement4' ? '结算④'
                      : record.phase.replace('investigate', '探查').replace('action', '行动').replace('settlement', '结算')}
                  </span>
                  <span className="text-slate-700">{record.action}</span>
                  {record.locationId && (
                    <span className="text-slate-400 shrink-0">
                      @{locations.find((l) => l.id === record.locationId)?.name || '?'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

         {/* 江枫【侦察无人机】：显示已放置无人机及经过人员 */}
        {hero?.id === 'jiangfeng' && droneLocationId && dronePlayerId === player.id && droneRound === round && (
          <div className="mt-1 border-t border-slate-200 pt-2">
            <div className="flex items-center gap-1.5 mb-1">
              <ScanEye className="w-3 h-3" style={{ color: heroColor }} />
              <span className="text-[11px] font-bold" style={{ color: heroColor }}>
                侦察无人机
              </span>
              <span className="text-[10px] text-slate-400">
                （位置：{locations.find((l) => l.id === droneLocationId)?.name || '?'}）
              </span>
            </div>
            {(() => {
              const visits = locationVisits[droneLocationId] || [];
              const visitors = visits
                .map((id) => allPlayers.find((p) => p.id === id))
                .filter(Boolean);
              return visitors.length > 0 ? (
                <div className="space-y-1">
                  {visitors.map((v, idx) => {
                    const playerIndex = allPlayers.indexOf(v!) + 1;
                    return (
                      <div key={idx} className="flex items-center gap-2 text-[11px] bg-slate-50 rounded px-2 py-1">
                        <span className="text-slate-400 font-mono shrink-0">{playerIndex}.</span>
                        <span className="font-medium text-slate-700">{v!.name}</span>
                        <Badge variant="outline" className="text-[10px] h-4 ml-auto" style={{ borderColor: getIdentityColor(v!.identity), color: getIdentityColor(v!.identity) }}>
                          {getIdentityName(v!.identity)}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 bg-slate-50 rounded px-2 py-1 text-center">
                  暂无人员经过
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== 带编号的游戏地图 ====================

function GameMapWithNumbers({ showKillers = true }: { showKillers?: boolean }) {
  const { locations, players, cutConnections } = useGameStore();

  // 存活玩家
  const getAlivePlayers = (locId: string) =>
    getPlayersAtLocation(players, locId);
  // 包含尸体
  const getAllPlayers = (locId: string) =>
    getAllPlayersAtLocation(players, locId);

  // 获取玩家显示颜色
  const getPlayerColor = (identity: string) => {
    if (!showKillers) return '#3b82f6'; // 不显示杀手时全部蓝色
    return identity === 'killer' ? '#dc2626' : '#3b82f6';
  };

  return (
    <div className="w-full h-full relative min-h-[200px]">
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="w-full h-full min-h-[200px] bg-slate-50 rounded-lg border"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* 连线 */}
        {locations.map((loc) =>
          loc.connectedTo.map((connId) => {
            if (connId <= loc.id) return null;
            const target = locations.find((l) => l.id === connId);
            if (!target) return null;
            const isBlocked = loc.isBlocked || target.isBlocked;
            return (
              <line
                key={`${loc.id}_${connId}`}
                x1={loc.x}
                y1={loc.y}
                x2={target.x}
                y2={target.y}
                stroke={isBlocked ? '#fca5a5' : '#cbd5e1'}
                strokeWidth={isBlocked ? '0.8' : '0.6'}
                strokeDasharray={isBlocked ? '2,2' : 'none'}
              />
            );
          })
        )}

        {/* 被切断的道路（张扬【断路】）- 绘制红× */}
        {cutConnections.map((cut, idx) => {
          const locA = locations.find((l) => l.id === cut.locA);
          const locB = locations.find((l) => l.id === cut.locB);
          if (!locA || !locB) return null;
          // 计算连线中点
          const midX = (locA.x + locB.x) / 2;
          const midY = (locA.y + locB.y) / 2;
          // 计算连线角度
          const angle = Math.atan2(locB.y - locA.y, locB.x - locA.x);
          // 红×大小
          const size = 2.5;
          // 计算×的两端点（旋转45度）
          const x1 = midX - size * Math.cos(angle + Math.PI / 4);
          const y1 = midY - size * Math.sin(angle + Math.PI / 4);
          const x2 = midX + size * Math.cos(angle + Math.PI / 4);
          const y2 = midY + size * Math.sin(angle + Math.PI / 4);
          const x3 = midX - size * Math.cos(angle - Math.PI / 4);
          const y3 = midY - size * Math.sin(angle - Math.PI / 4);
          const x4 = midX + size * Math.cos(angle - Math.PI / 4);
          const y4 = midY + size * Math.sin(angle - Math.PI / 4);
          return (
            <g key={`cut_${idx}`}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#dc2626" strokeWidth="1.2" strokeLinecap="round" />
              <line x1={x3} y1={y3} x2={x4} y2={y4} stroke="#dc2626" strokeWidth="1.2" strokeLinecap="round" />
            </g>
          );
        })}

        {/* 地点 */}
        {locations.map((loc, locIndex) => {
          const alivePlayers = getAlivePlayers(loc.id);
          const allPlayersHere = getAllPlayers(loc.id);
          const deadPlayersHere = allPlayersHere.filter((p) => p.status === 'dead');
          const isBlocked = loc.isBlocked;
          const locNum = locIndex + 1;

          return (
            <g key={loc.id}>
              <circle
                cx={loc.x}
                cy={loc.y}
                r={5}
                fill={isBlocked ? '#ef4444' : '#64748b'}
                opacity={isBlocked ? '0.6' : '0.9'}
                stroke="white"
                strokeWidth="1"
              />
              <text
                x={loc.x}
                y={loc.y + 1.2}
                textAnchor="middle"
                fontSize="4.5"
                fill="white"
                fontWeight="bold"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {locNum}
              </text>
              <text
                x={loc.x}
                y={loc.y + 10}
                textAnchor="middle"
                fontSize="3.2"
                fill={isBlocked ? '#ef4444' : '#334155'}
                fontWeight={allPlayersHere.length > 0 ? '700' : '500'}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {loc.name}
              </text>
              {/* 地点效果标记 */}
              {loc.effect && loc.effect.type !== 'placeholder' && (
                <text
                  x={loc.x}
                  y={loc.y + 13.5}
                  textAnchor="middle"
                  fontSize="2.6"
                  fill="#d97706"
                  fontWeight="600"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {loc.effect.name}
                </text>
              )}

              {/* 存活玩家 - 正常显示 */}
              {alivePlayers.map((p, i) => {
                const playerIndex = players.indexOf(p) + 1;
                const angle = (2 * Math.PI * i) / Math.max(alivePlayers.length + deadPlayersHere.length, 1) - Math.PI / 2;
                const offset = 8;
                const px = loc.x + Math.cos(angle) * offset;
                const py = loc.y + Math.sin(angle) * offset;

                return (
                  <g key={p.id}>
                    <circle
                      cx={px}
                      cy={py}
                      r={3}
                      fill={getPlayerColor(p.identity)}
                      stroke="white"
                      strokeWidth="0.5"
                    />
                    <text
                      x={px}
                      y={py + 1}
                      textAnchor="middle"
                      fontSize="3"
                      fill="white"
                      fontWeight="bold"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {playerIndex}
                    </text>
                  </g>
                );
              })}

              {/* 尸体 - 红色半透明，显示 X */}
              {deadPlayersHere.map((p, i) => {
                const angle = (2 * Math.PI * (alivePlayers.length + i)) / Math.max(alivePlayers.length + deadPlayersHere.length, 1) - Math.PI / 2;
                const offset = 8;
                const px = loc.x + Math.cos(angle) * offset;
                const py = loc.y + Math.sin(angle) * offset;

                return (
                  <g key={p.id}>
                    {/* 尸体背景圆圈 - 红色半透明 */}
                    <circle
                      cx={px}
                      cy={py}
                      r={3}
                      fill={getIdentityColor(p.identity)}
                      opacity="0.5"
                      stroke="#dc2626"
                      strokeWidth="0.5"
                    />
                    {/* 尸体 X 标记 */}
                    <text
                      x={px}
                      y={py + 1}
                      textAnchor="middle"
                      fontSize="3"
                      fill="#7f1d1d"
                      fontWeight="bold"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      ×
                    </text>
                  </g>
                );
              })}

              {allPlayersHere.length > 0 && (
                <text
                  x={loc.x + 6.5}
                  y={loc.y - 5}
                  textAnchor="middle"
                  fontSize="3"
                  fill="#2563eb"
                  fontWeight="bold"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {allPlayersHere.length}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* 图例 */}
      <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur rounded-md px-3 py-2 shadow-sm border text-xs space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-slate-500 flex items-center justify-center text-white text-xs font-bold">N</span>
          <span>地点编号</span>
        </div>
        {showKillers ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span>平民</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
              <span>杀手</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>存活</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 opacity-50" />
          <span>尸体</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span>封锁</span>
        </div>
      </div>
    </div>
  );
}
