import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  UserPlus,
  UserMinus,
  Users,
  Swords,
  AlertCircle,
  Map,
  ChevronRight,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function GameSetup() {
  const {
    players,
    killerCount,
    civilianCount,
    locations,
    addPlayer,
    removePlayer,
    updatePlayerName,
    setKillerCount,
    setCivilianCount,
    assignIdentities,
    loadDefaultMap,
  } = useGameStore();

  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    if (newName.trim()) {
      addPlayer(newName.trim());
      setNewName('');
    }
  };

  const totalConfigured = killerCount + civilianCount;
  const totalPlayers = players.length;
  const canStart = totalPlayers >= 4 && locations.length >= 3;

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* 顶部标题 */}
      <header className="bg-white border-b px-4 md:px-6 py-3 md:py-4">
        <h1 className="text-lg md:text-2xl font-bold text-slate-900">绒兽杀后台控制器</h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">创建新游戏：配置身份、玩家和地图</p>
      </header>

      {/* 主内容 */}
      <main className="flex-1 overflow-auto p-3 md:p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* 列1：身份配置 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Swords className="w-5 h-5 text-red-600" />
                身份配置
                <Badge variant="outline" className="ml-auto">
                  共 {totalConfigured} 人
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 杀手数量 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">杀手数量</label>
                  <span className="text-lg font-bold text-red-600">{killerCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setKillerCount(killerCount - 1)}
                    disabled={killerCount <= 1}
                    className="h-8 w-8 p-0"
                  >
                    -
                  </Button>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all"
                      style={{ width: `${(killerCount / 10) * 100}%` }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setKillerCount(killerCount + 1)}
                    disabled={killerCount >= 10}
                    className="h-8 w-8 p-0"
                  >
                    +
                  </Button>
                </div>
              </div>

              <Separator />

              {/* 平民数量 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">平民数量</label>
                  <span className="text-lg font-bold text-blue-600">{civilianCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCivilianCount(civilianCount - 1)}
                    disabled={civilianCount <= 1}
                    className="h-8 w-8 p-0"
                  >
                    -
                  </Button>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${(civilianCount / 12) * 100}%` }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCivilianCount(civilianCount + 1)}
                    disabled={civilianCount >= 12}
                    className="h-8 w-8 p-0"
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* 提示 */}
              {totalConfigured !== totalPlayers && totalPlayers > 0 && (
                <Alert className="bg-amber-50 border-amber-200 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <AlertDescription className="text-amber-700">
                    身份总数（{totalConfigured}）与玩家数（{totalPlayers}）不匹配，系统将自动调整
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* 列2：玩家管理 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-5 h-5 text-indigo-600" />
                玩家管理
                <Badge variant="outline" className="ml-auto">
                  {totalPlayers} 人
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="输入玩家名称"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  className="flex-1"
                />
                <Button onClick={handleAdd} size="sm">
                  <UserPlus className="w-4 h-4 mr-1" />
                  添加
                </Button>
              </div>

              <ScrollArea className="h-[240px] border rounded-md p-2">
                {players.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                    请添加玩家
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {players.map((p, i) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 p-2 rounded-md bg-slate-50 hover:bg-slate-100"
                      >
                        <span className="text-xs text-slate-400 w-5 text-center">{i + 1}</span>
                        <Input
                          value={p.name}
                          onChange={(e) => updatePlayerName(p.id, e.target.value)}
                          className="flex-1 h-7 text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePlayer(p.id)}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {totalPlayers < 4 && (
                <Alert className="bg-red-50 border-red-200 text-xs">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    至少需要 4 名玩家
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* 列3：地图配置 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Map className="w-5 h-5 text-emerald-600" />
                地图配置
                <Badge variant="outline" className="ml-auto">
                  {locations.length} 个地点
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                在「地图编辑」标签中创建和编辑游戏地图，为地点命名并连线。
              </p>

              {locations.length < 3 ? (
                <Alert className="bg-amber-50 border-amber-200 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <AlertDescription className="text-amber-700">
                    地图至少需要 3 个地点才能开始游戏
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3">
                  <p className="text-sm text-emerald-700 font-medium">
                    地图已就绪：{locations.length} 个地点
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={loadDefaultMap}
                  className="flex-1 text-sm"
                  size="sm"
                >
                  加载示例地图
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* 底部操作栏 */}
      <footer className="bg-white border-t px-3 md:px-6 py-3 md:py-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-2 md:gap-0 md:justify-between">
          <div className="text-xs md:text-sm text-slate-500 text-center md:text-left">
            <span className="font-medium">{totalPlayers}</span> 名玩家
            <span className="mx-2">|</span>
            <span className="font-medium text-red-600">{killerCount}</span> 杀手
            <span className="mx-2">|</span>
            <span className="font-medium text-blue-600">{civilianCount}</span> 平民
            <span className="mx-2">|</span>
            <span className="font-medium">{locations.length}</span> 个地点
          </div>
          <Button
            onClick={assignIdentities}
            disabled={!canStart}
            size="lg"
            className="font-semibold"
          >
            分配身份并继续
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
