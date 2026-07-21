import { useState, useEffect } from 'react'
import { createRoom, joinRoom, disconnect, getState, on, broadcast, MSG } from './peerjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Copy, Check, Wifi, ArrowLeft } from 'lucide-react'

export function Lobby({ onEnterGame }) {
  const [mode, setMode] = useState(null) // 'host' | 'join' | null
  const [roomCode, setRoomCode] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [status, setStatus] = useState('')
  const [players, setPlayers] = useState([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    on('playerJoin', (playerId) => {
      setPlayers((prev) => [...prev, playerId])
    })
    on('playerLeave', (playerId) => {
      setPlayers((prev) => prev.filter((id) => id !== playerId))
    })
    return () => disconnect()
  }, [])

  const handleCreateRoom = async () => {
    setStatus('正在创建房间...')
    try {
      const room = await createRoom()
      setMode('host')
      setRoomCode(room.roomId)
      setPlayers([room.playerId])
      setStatus('房间已创建，等待玩家加入...')

      on('playerAction', (data) => {
        // 暂不处理
      })
    } catch (e) {
      setStatus('创建失败：' + e.message)
    }
  }

  const handleJoinRoom = async () => {
    if (!inputCode.trim()) return
    setStatus('正在加入房间...')
    try {
      const room = await joinRoom(inputCode.trim())
      setMode('join')
      setRoomCode(room.roomId)
      setStatus('已加入房间，等待房主开始游戏...')
    } catch (e) {
      setStatus('加入失败：' + e.message)
    }
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleStartGame = () => {
    broadcast({ type: MSG.HOST_STATE, command: 'start_game' })
    if (onEnterGame) onEnterGame({ isHost: true, roomCode })
  }

  return (
    <div className="h-screen flex items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-center text-xl">
            <Wifi className="w-5 h-5 inline mr-2 text-emerald-400" />
            绒兽杀 · 联机模式
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!mode ? (
            <>
              <Button onClick={handleCreateRoom} className="w-full h-12 text-base bg-indigo-600 hover:bg-indigo-700">
                <Wifi className="w-5 h-5 mr-2" />
                创建房间（房主）
              </Button>
              <div className="flex items-center gap-2">
                <div className="flex-1 border-t border-slate-600" />
                <span className="text-slate-400 text-sm">或</span>
                <div className="flex-1 border-t border-slate-600" />
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="输入房间码"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                  className="flex-1 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
                <Button onClick={handleJoinRoom} variant="secondary" className="shrink-0">
                  加入
                </Button>
              </div>
            </>
          ) : mode === 'host' ? (
            <>
              <div className="bg-slate-900 rounded-lg p-4 text-center">
                <p className="text-xs text-slate-400 mb-1">房间码</p>
                <p className="text-3xl font-bold text-white tracking-widest font-mono">{roomCode}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyRoomCode}
                  className="mt-1 text-emerald-400 hover:text-emerald-300"
                >
                  {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  {copied ? '已复制' : '复制房间码'}
                </Button>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">玩家列表</span>
                  <Badge variant="outline" className="ml-auto text-xs text-slate-400 border-slate-600">
                    {players.length} 人
                  </Badge>
                </div>
                <div className="space-y-1">
                  {players.map((id, i) => (
                    <div key={id} className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800 rounded px-2 py-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      {i === 0 ? <span className="font-medium text-amber-400">房主</span> : <span>玩家 {i + 1}</span>}
                      <span className="text-[10px] text-slate-500 font-mono ml-auto">{id.slice(-4)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleStartGame} className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700" disabled={players.length < 2}>
                开始游戏（至少2人）
              </Button>

              {status && <p className="text-xs text-slate-400 text-center">{status}</p>}
            </>
          ) : (
            <>
              <div className="bg-slate-900 rounded-lg p-4 text-center">
                <p className="text-sm text-emerald-400">已加入房间</p>
                <p className="text-lg text-white font-mono mt-1">{roomCode}</p>
              </div>
              <p className="text-sm text-slate-400 text-center">{status}</p>
              <div className="flex justify-center">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
