/**
 * 绒兽杀 P2P 网络层
 * 基于 PeerJS 的浏览器直连，无需服务器
 * 
 * 使用方式：
 *   房主: createRoom().then(room => ...)
 *   玩家: joinRoom(roomId).then(room => ...)
 */

const PEERJS_HOST = '0.peerjs.com'
const PEERJS_PORT = 443
const PEERJS_PATH = '/'

let peer = null
let connections = new Map()  // peerId -> DataConnection
let roomId = null
let isHost = false
let myId = null

// 回调函数（由外部注册）
const callbacks = {
  onPlayerJoin: null,
  onPlayerLeave: null,
  onHostCommand: null,
  onPlayerAction: null,
  onDisconnect: null,
  onError: null,
}

/**
 * 加载 PeerJS（从 CDN）
 */
function loadPeerJS() {
  return new Promise((resolve, reject) => {
    if (typeof Peer !== 'undefined') {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('无法加载 PeerJS'))
    document.head.appendChild(script)
  })
}

/**
 * 创建房间（房主）
 */
export async function createRoom() {
  await loadPeerJS()
  
  return new Promise((resolve, reject) => {
    peer = new Peer(generateId(), {
      host: PEERJS_HOST,
      port: PEERJS_PORT,
      path: PEERJS_PATH,
    })

    peer.on('open', (id) => {
      isHost = true
      myId = id
      roomId = id
      console.log('[P2P] 房间已创建:', roomId)
      resolve({ roomId, playerId: id, isHost: true })
    })

    peer.on('connection', (conn) => {
      const playerId = conn.peer
      connections.set(playerId, conn)
      console.log('[P2P] 玩家加入:', playerId)

      conn.on('data', (data) => {
        if (callbacks.onPlayerAction) {
          callbacks.onPlayerAction({ playerId, ...data })
        }
      })

      conn.on('close', () => {
        connections.delete(playerId)
        if (callbacks.onPlayerLeave) callbacks.onPlayerLeave(playerId)
      })

      // 通知所有玩家新玩家加入
      broadcast({ type: 'player_joined', playerId })
      if (callbacks.onPlayerJoin) callbacks.onPlayerJoin(playerId)
    })

    peer.on('error', (err) => {
      if (callbacks.onError) callbacks.onError(err)
      reject(err)
    })
  })
}

/**
 * 加入房间
 */
export async function joinRoom(targetRoomId) {
  await loadPeerJS()
  
  return new Promise((resolve, reject) => {
    peer = new Peer(generateId(), {
      host: PEERJS_HOST,
      port: PEERJS_PORT,
      path: PEERJS_PATH,
    })

    peer.on('open', (id) => {
      myId = id
      console.log('[P2P] 连接中...', targetRoomId)

      const conn = peer.connect(targetRoomId, { reliable: true })
      
      conn.on('open', () => {
        isHost = false
        roomId = targetRoomId
        connections.set(targetRoomId, conn)
        console.log('[P2P] 已加入房间:', targetRoomId)
        resolve({ roomId: targetRoomId, playerId: id, isHost: false })
      })

      conn.on('data', (data) => {
        if (callbacks.onHostCommand) callbacks.onHostCommand(data)
      })

      conn.on('close', () => {
        if (callbacks.onDisconnect) callbacks.onDisconnect()
      })

      conn.on('error', (err) => {
        if (callbacks.onError) callbacks.onError(err)
        reject(err)
      })
    })

    peer.on('error', (err) => {
      if (callbacks.onError) callbacks.onError(err)
      reject(err)
    })
  })
}

/**
 * 房主广播消息给所有玩家
 */
export function broadcast(data) {
  connections.forEach((conn) => {
    if (conn.open) conn.send(data)
  })
}

/**
 * 玩家发送操作给房主
 */
export function sendAction(action, data = {}) {
  if (isHost) {
    // 房主模式下直接本地处理
    if (callbacks.onPlayerAction) callbacks.onPlayerAction({ playerId: myId, action, data })
    return
  }
  // 发送给房主
  const hostConn = connections.get(roomId)
  if (hostConn && hostConn.open) {
    hostConn.send({ action, data })
  }
}

/**
 * 房主发送指令给指定玩家或全部
 */
export function sendCommand(command, data = {}, targetPeerId = null) {
  if (targetPeerId) {
    const conn = connections.get(targetPeerId)
    if (conn && conn.open) conn.send({ command, data })
  } else {
    broadcast({ command, data })
  }
}

/**
 * 断开连接
 */
export function disconnect() {
  connections.forEach((conn) => conn.close())
  if (peer) peer.destroy()
  connections.clear()
  peer = null
  roomId = null
  isHost = false
  myId = null
}

/**
 * 注册回调
 */
export function on(event, fn) {
  callbacks[event] = fn
}

/**
 * 获取状态
 */
export function getState() {
  return { isHost, roomId, myId, playerCount: connections.size + (isHost ? 1 : 0) }
}

function generateId() {
  return 'rs_' + Math.random().toString(36).substring(2, 8)
}

// ============================================
// 消息类型（协议定义）
// ============================================
export const MSG = {
  // 玩家 → 房主
  PLAYER_MOVE: 'player_move',
  PLAYER_ACTION: 'player_skill',
  PLAYER_VOTE: 'player_vote',
  PLAYER_READY: 'player_ready',

  // 房主 → 玩家
  HOST_STATE: 'game_state',
  HOST_IDENTITY: 'your_identity',
  HOST_PHASE: 'phase_change',
  HOST_DEATH: 'death_report',
  HOST_VOTE: 'vote_result',

  // 广播
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  ROOM_CLOSED: 'room_closed',
}
