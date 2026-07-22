import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

// ============================================
// 配置
// ============================================
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = join(import.meta.dirname, '..', 'dist');

// ============================================
// HTTP 服务器 - 托管前端静态文件
// ============================================
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

const httpServer = createServer((req, res) => {
  let path = req.url === '/' ? '/index.html' : req.url;
  const filePath = join(PUBLIC_DIR, path);

  if (existsSync(filePath)) {
    const ext = extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(readFileSync(filePath));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(readFileSync(join(PUBLIC_DIR, 'index.html')));
  }
});

// ============================================
// WebSocket 服务器
// ============================================
const wss = new WebSocketServer({ server: httpServer });

// 房间管理
const rooms = new Map(); // roomId -> { host: ws, players: Map<playerId, ws>, state: GameState }

function generateId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

wss.on('connection', (ws) => {
  let playerId = null;
  let roomId = null;
  let isHost = false;

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      handleMessage(ws, msg);
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', message: '消息格式错误' }));
    }
  });

  ws.on('close', () => {
    if (roomId && rooms.has(roomId)) {
      const room = rooms.get(roomId);
      if (isHost) {
        // 房主断开 → 通知所有玩家并解散房间
        broadcast(room, { type: 'room_closed', message: '房主已断开连接' });
        rooms.delete(roomId);
      } else if (playerId) {
        room.players.delete(playerId);
        broadcast(room, { type: 'player_left', playerId, players: getPlayerList(room) });
        if (room.players.size === 0) rooms.delete(roomId);
      }
    }
  });

  function handleMessage(ws, msg) {
    switch (msg.type) {
      // ========= 房间管理 =========
      case 'create_room': {
        roomId = generateId();
        isHost = true;
        playerId = 'host_' + generateId();
        rooms.set(roomId, { host: ws, players: new Map(), state: null });
        ws.send(JSON.stringify({ type: 'room_created', roomId, playerId, isHost: true }));
        break;
      }

      case 'join_room': {
        const room = rooms.get(msg.roomId);
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: '房间不存在' }));
          return;
        }
        roomId = msg.roomId;
        playerId = 'player_' + generateId();
        room.players.set(playerId, ws);
        ws.send(JSON.stringify({
          type: 'joined_room',
          roomId, playerId, isHost: false,
          players: getPlayerList(room),
        }));
        broadcast(room, { type: 'player_joined', playerId, players: getPlayerList(room) }, ws);
        break;
      }

      // ========= 游戏操作 =========
      case 'game_action': {
        // 转发到房主（主持人）确认
        const room = rooms.get(roomId);
        if (room && room.host && room.host.readyState === 1) {
          room.host.send(JSON.stringify({
            type: 'player_action',
            playerId,
            action: msg.action,
            data: msg.data,
          }));
        }
        break;
      }

      case 'host_command': {
        // 房主发送指令（阶段推进、确认操作等）
        if (!isHost) return;
        const room = rooms.get(roomId);
        if (!room) return;
        broadcast(room, { type: 'host_update', command: msg.command, data: msg.data });
        break;
      }

      default:
        ws.send(JSON.stringify({ type: 'error', message: '未知消息类型' }));
    }
  }
});

function getPlayerList(room) {
  return Array.from(room.players.keys()).map((id) => ({ id }));
}

function broadcast(room, msg, exclude = null) {
  const data = JSON.stringify(msg);
  // 发给房主
  if (room.host && room.host !== exclude && room.host.readyState === 1) {
    room.host.send(data);
  }
  // 发给玩家
  room.players.forEach((ws, id) => {
    if (ws !== exclude && ws.readyState === 1) {
      ws.send(data);
    }
  });
}

// ============================================
// 启动
// ============================================
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  🎮 绒兽杀在线版服务器`);
  console.log(`  ─────────────────────`);
  console.log(`  🌐 网页: http://localhost:${PORT}`);
  console.log(`  📡 WebSocket: ws://localhost:${PORT}`);
  console.log(`  📱 局域网: http://<本机IP>:${PORT}\n`);
});
