import { useState, useEffect, useRef } from 'react'
import { createRoom, joinRoom, disconnect, on, broadcast, MSG, getState } from './peerjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Copy, Check, Wifi, LogOut, ArrowLeft, RefreshCw, Play, Eye } from 'lucide-react'

interface LobbyProps {
  onBack: () => void
}

export function Lobby({ onBack }: LobbyProps) {
  const [mode, setMode] = useState<'host' | 'join' | null>(null)
  const [roomCode, setRoomCode] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [status, setStatus] = useState('')
  const [players, setPlayers] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)       // 防止重复点击
  const [showWarning, setShowWarning] = useState(true) // 首次进入提示
  const [isSpectator, setIsSpectator] = useState(false) // 观战模式
  const connectingRef = useRef(false)                   // 防止并发连接

  useEffect(() => {
    on('playerJoin', (playerId: string) => {
      setPlayers((prev: string[]) => [...prev, playerId])
    })
    on('playerLeave', (playerId: string) => {
      setPlayers((prev: string[]) => prev.filter((id: string) => id !== playerId))
    })
    return () => { disconnect() }
  }, [])

  // ========== 创建房间（防重复点击） ==========
  const handleCreateRoom = async () => {
    if (connectingRef.current) return
    connectingRef.current = true
    setLoading(true)
    setStatus('正在创建房间...')
    try {
      const room = await createRoom()
      setMode('host')
      setRoomCode(room.roomId)
      setPlayers([room.playerId])
      setStatus('房间已创建，等待玩家加入...')
    } catch (e: unknown) {
      setStatus('创建失败：' + (e instanceof Error ? e.message : '未知错误'))
    } finally {
      setLoading(false)
      connectingRef.current = false
    }
  }

  // ========== 加入房间（防重复点击） ==========
  const handleJoinRoom = async () => {
    if (!inputCode.trim() || connectingRef.current) return
    connectingRef.current = true
    setLoading(true)
    setStatus('正在加入房间...')
    try {
      const room = await joinRoom(inputCode.trim())
      setMode('join')
      setRoomCode(room.roomId)
      setStatus('已加入房间，等待房主开始游戏...')
    } catch (e: unknown) {
      setStatus('加入失败：' + (e instanceof Error ? e.message : '未知错误'))
    } finally {
      setLoading(false)
      connectingRef.current = false
    }
  }

  // ========== 离开房间 ==========
  const handleLeaveRoom = () => {
    disconnect()
    setMode(null)
    setRoomCode('')
    setPlayers([])
    setStatus('')
    connectingRef.current = false
    setLoading(false)
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleStartGame = () => {
    broadcast({ type: MSG.HOST_STATE, command: 'start_game' })
  }

  // 当前房间信息
  const currentRoom = getState()

  // ========== 首次警告提示 ==========
  if (showWarning) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 p-4">
        <Card className="w-full max-w-md bg-slate-800 border-amber-700">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-900/50 border-2 border-amber-500 flex items-center justify-center mx-auto">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-lg font-bold text-white">联机模式 · 开发中</h2>
            <p className="text-sm text-slate-300">
              截止目前，联机功能尚未开发完成，可能会出现各种 bug。
            </p>
            <p className="text-xs text-amber-400">
              如果你是测试人员，请点击"确定"继续。
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={onBack} className="flex-1 border-slate-600 text-slate-300">
                返回
              </Button>
              <Button onClick={() => setShowWarning(false)} className="flex-1 bg-amber-600 hover:bg-amber-700">
                确定
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* 顶部导航 */}
      <header className="px-3 md:px-4 py-3 border-b border-slate-700 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={mode ? handleLeaveRoom : onBack}
          className="h-8 px-2 text-slate-300 hover:text-white hover:bg-slate-800">
          <ArrowLeft className="w-4 h-4 mr-1" />
          {mode ? '退出房间' : '返回'}
        </Button>
        <div className="flex-1" />
        {currentRoom.roomId && (
          <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-600">
            <Wifi className="w-3 h-3 mr-1" />
            {currentRoom.isHost ? '房主' : '玩家'}
            {isSpectator && '（观战）'}
          </Badge>
        )}
      </header>

      {/* 主内容 */}
      <main className="flex-1 overflow-auto p-3 md:p-4">
        <div className="max-w-md mx-auto space-y-4">
          {!mode ? (
            <>
              {/* 已有房间时显示 */}
              {currentRoom.roomId && (
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">当前房间</p>
                      <p className="text-sm text-white font-mono">{currentRoom.roomId}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleLeaveRoom}
                      className="text-xs text-red-400 border-red-700 hover:bg-red-950">
                      <LogOut className="w-3 h-3 mr-1" />断开
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="text-center mb-4">
                <Wifi className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <h2 className="text-lg font-bold text-white">联机模式</h2>
                <p className="text-xs text-slate-400 mt-1">通过 WiFi 进行 P2P 直连，无需服务器</p>
              </div>

              <Button onClick={handleCreateRoom} disabled={loading}
                className="w-full h-12 text-base bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                {loading ? '创建中...' : '创建房间（房主）'}
              </Button>

              {/* 观战模式切换 */}
              <div className="flex items-center gap-3 bg-slate-800 rounded-lg p-3 border border-slate-700">
                <Eye className="w-5 h-5 text-slate-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-slate-300">观战模式</p>
                  <p className="text-xs text-slate-500">以观众身份加入，仅可观看无法操作</p>
                </div>
                <Button variant={isSpectator ? 'default' : 'outline'} size="sm"
                  onClick={() => setIsSpectator(!isSpectator)}
                  className={isSpectator ? 'bg-emerald-600' : 'border-slate-600 text-slate-400'}>
                  {isSpectator ? '已开启' : '关闭'}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 border-t border-slate-600" />
                <span className="text-slate-400 text-xs">或</span>
                <div className="flex-1 border-t border-slate-600" />
              </div>

              <div className="flex gap-2">
                <Input placeholder="输入房间码" value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                  className="flex-1 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 h-10" />
                <Button onClick={handleJoinRoom} disabled={loading} variant="secondary" className="h-10 shrink-0">
                  {loading ? '加入中...' : isSpectator ? '观战' : '加入'}
                </Button>
              </div>
            </>
          ) : mode === 'host' ? (
            <>
              {/* 房主界面 */}
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-slate-400 mb-1">房间码</p>
                  <p className="text-3xl font-bold text-white tracking-widest font-mono">{roomCode}</p>
                  <p className="text-xs text-slate-500 mt-1">端口：{roomCode.slice(-4)}</p>
                  <div className="flex justify-center gap-2 mt-2">
                    <Button variant="ghost" size="sm" onClick={copyRoomCode}
                      className="text-emerald-400 hover:text-emerald-300 h-7 text-xs">
                      {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                      {copied ? '已复制' : '复制房间码'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleLeaveRoom}
                      className="text-red-400 hover:text-red-300 h-7 text-xs">
                      <LogOut className="w-3.5 h-3.5 mr-1" />解散房间
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">玩家列表</span>
                    <Badge variant="outline" className="ml-auto text-xs text-slate-400 border-slate-600">
                      {players.length} 人
                    </Badge>
                  </div>
                  {players.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">暂无玩家加入</p>
                  ) : (
                    <div className="space-y-1">
                      {players.map((id, i) => (
                        <div key={id} className="flex items-center gap-2 text-sm text-slate-300 bg-slate-900/50 rounded px-2 py-1.5">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold shrink-0">
                            {i + 1}
                          </span>
                          <span className={i === 0 ? 'font-medium text-amber-400' : ''}>
                            {i === 0 ? '房主' : `玩家 ${i}`}
                          </span>
                          <span className="text-[10px] text-slate-600 font-mono ml-auto">{id.slice(-4)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Button onClick={handleStartGame} disabled={players.length < 4}
                className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
                <Play className="w-5 h-5 mr-2" />开始游戏（{players.length}/4人）
              </Button>
              {players.length < 4 && (
                <p className="text-xs text-slate-400 text-center">至少需要4人才能开始</p>
              )}

              {status && <p className="text-xs text-slate-400 text-center">{status}</p>}
            </>
          ) : (
            <>
              {/* 玩家界面 */}
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-slate-400 mb-1">已加入房间</p>
                  <p className="text-lg text-emerald-400 font-mono font-bold">{roomCode}</p>
                  <Button variant="ghost" size="sm" onClick={handleLeaveRoom}
                    className="mt-2 text-red-400 hover:text-red-300 h-7 text-xs">
                    <LogOut className="w-3.5 h-3.5 mr-1" />退出房间
                  </Button>
                </CardContent>
              </Card>

              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-emerald-500 mx-auto animate-spin mb-3" />
                <p className="text-sm text-slate-400">等待房主开始游戏...</p>
                <p className="text-xs text-slate-600 mt-2">请确保与房主在同一 WiFi 网络</p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
