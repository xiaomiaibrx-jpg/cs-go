import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

interface PlayerNetworkData {
  id: string;
  name: string;
  team: 'T' | 'CT';
  health: number;
  maxHealth: number;
  armor: number;
  hasHelmet: boolean;
  isDead: boolean;
  position: { x: number; y: number; z: number };
  yaw: number;
  pitch: number;
  activeWeaponId: string;
  isFiring: boolean;
  isReloading: boolean;
  isCrouching: boolean;
  isJumping: boolean;
  isWalking: boolean;
  isPlanting?: boolean;
  isDefusing?: boolean;
  kills: number;
  deaths: number;
  score: number;
  ping: number;
  lastPingTime?: number;
}

interface GameRoom {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  maxPlayers: number;
  hasPassword?: boolean;
  password?: string;
  players: Map<string, { ws: WebSocket; data: PlayerNetworkData }>;
  scoreT: number;
  scoreCT: number;
  roundTimeRemaining: number;
  isRoundActive: boolean;
  plantedC4?: {
    site: 'A' | 'B';
    position: { x: number; y: number; z: number };
    planterName: string;
    timerRemaining: number;
    isDefused: boolean;
    isExploded: boolean;
  };
}

const rooms = new Map<string, GameRoom>();

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  app.use(express.json());

  // Health API
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      activeRooms: rooms.size,
      totalPlayers: Array.from(rooms.values()).reduce((sum, r) => sum + r.players.size, 0)
    });
  });

  // REST API: Get active room list
  app.get('/api/rooms', (req, res) => {
    const list = Array.from(rooms.values()).map(r => ({
      id: r.id,
      name: r.name,
      hostName: r.hostName,
      playerCount: r.players.size,
      maxPlayers: r.maxPlayers,
      hasPassword: !!r.password,
      scoreT: r.scoreT,
      scoreCT: r.scoreCT,
      state: r.isRoundActive ? 'in_progress' : 'waiting'
    }));
    res.json(list);
  });

  // Attach WebSocket Server
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    let currentRoomId: string | null = null;
    let playerId: string | null = null;

    ws.on('message', (raw: string) => {
      try {
        const msg = JSON.parse(raw.toString());

        switch (msg.type) {
          case 'ping': {
            ws.send(JSON.stringify({ type: 'pong', timestamp: msg.timestamp }));
            break;
          }

          case 'get_rooms': {
            const list = Array.from(rooms.values()).map(r => ({
              id: r.id,
              name: r.name,
              hostName: r.hostName,
              playerCount: r.players.size,
              maxPlayers: r.maxPlayers,
              hasPassword: !!r.password,
              scoreT: r.scoreT,
              scoreCT: r.scoreCT,
              state: r.isRoundActive ? 'in_progress' : 'waiting'
            }));
            ws.send(JSON.stringify({ type: 'room_list', rooms: list }));
            break;
          }

          case 'create_room': {
            const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            playerId = msg.player.id || Math.random().toString(36).substring(2, 9);
            currentRoomId = roomId;

            const newPlayer: PlayerNetworkData = {
              id: playerId,
              name: msg.player.name || 'Player',
              team: msg.player.team || 'CT',
              health: 100,
              maxHealth: 100,
              armor: 100,
              hasHelmet: true,
              isDead: false,
              position: msg.player.position || { x: 0, y: 1.7, z: 0 },
              yaw: 0,
              pitch: 0,
              activeWeaponId: msg.player.activeWeaponId || 'm4a1',
              isFiring: false,
              isReloading: false,
              isCrouching: false,
              isJumping: false,
              isWalking: false,
              kills: 0,
              deaths: 0,
              score: 0,
              ping: 20
            };

            const room: GameRoom = {
              id: roomId,
              name: msg.roomName || `اتاق ${msg.player.name}`,
              hostId: playerId,
              hostName: msg.player.name || 'Player',
              maxPlayers: msg.maxPlayers || 10,
              password: msg.password || undefined,
              players: new Map([[playerId, { ws, data: newPlayer }]]),
              scoreT: 0,
              scoreCT: 0,
              roundTimeRemaining: 115,
              isRoundActive: true
            };

            rooms.set(roomId, room);

            ws.send(JSON.stringify({
              type: 'room_joined',
              roomId,
              roomInfo: {
                id: roomId,
                name: room.name,
                hostName: room.hostName,
                playerCount: 1,
                maxPlayers: room.maxPlayers,
                scoreT: room.scoreT,
                scoreCT: room.scoreCT,
                state: 'in_progress'
              },
              playerId,
              players: [newPlayer]
            }));
            break;
          }

          case 'join_room': {
            const targetRoom = rooms.get(msg.roomId);
            if (!targetRoom) {
              ws.send(JSON.stringify({ type: 'error', message: 'اتاق یافت نشد.' }));
              return;
            }

            if (targetRoom.password && targetRoom.password !== msg.password) {
              ws.send(JSON.stringify({ type: 'error', message: 'رمز عبور اتاق اشتباه است.' }));
              return;
            }

            if (targetRoom.players.size >= targetRoom.maxPlayers) {
              ws.send(JSON.stringify({ type: 'error', message: 'ظرفیت اتاق تکمیل است.' }));
              return;
            }

            playerId = msg.player.id || Math.random().toString(36).substring(2, 9);
            currentRoomId = targetRoom.id;

            const newPlayer: PlayerNetworkData = {
              id: playerId,
              name: msg.player.name || 'Player',
              team: msg.player.team || (targetRoom.players.size % 2 === 0 ? 'T' : 'CT'),
              health: 100,
              maxHealth: 100,
              armor: 100,
              hasHelmet: true,
              isDead: false,
              position: msg.player.position || { x: 0, y: 1.7, z: 0 },
              yaw: 0,
              pitch: 0,
              activeWeaponId: msg.player.activeWeaponId || 'ak47',
              isFiring: false,
              isReloading: false,
              isCrouching: false,
              isJumping: false,
              isWalking: false,
              kills: 0,
              deaths: 0,
              score: 0,
              ping: 25
            };

            targetRoom.players.set(playerId, { ws, data: newPlayer });

            // Send existing players to new joiner
            const existingPlayers = Array.from(targetRoom.players.values()).map(p => p.data);
            ws.send(JSON.stringify({
              type: 'room_joined',
              roomId: targetRoom.id,
              roomInfo: {
                id: targetRoom.id,
                name: targetRoom.name,
                hostName: targetRoom.hostName,
                playerCount: targetRoom.players.size,
                maxPlayers: targetRoom.maxPlayers,
                scoreT: targetRoom.scoreT,
                scoreCT: targetRoom.scoreCT,
                state: 'in_progress'
              },
              playerId,
              players: existingPlayers,
              plantedC4: targetRoom.plantedC4
            }));

            // Broadcast to other players in room
            broadcastToRoom(targetRoom, ws, {
              type: 'player_joined',
              player: newPlayer
            });

            broadcastToRoom(targetRoom, null, {
              type: 'chat',
              chat: {
                id: Math.random().toString(36).substring(2, 9),
                senderName: 'سیستم',
                senderTeam: newPlayer.team,
                text: `${newPlayer.name} به سرور پیوست.`,
                timestamp: Date.now(),
                isSystem: true
              }
            });
            break;
          }

          case 'update_transform': {
            if (!currentRoomId || !playerId) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            const playerEntry = room.players.get(playerId);
            if (playerEntry) {
              Object.assign(playerEntry.data, msg.data);
              broadcastToRoom(room, ws, {
                type: 'player_transformed',
                playerId,
                data: msg.data
              });
            }
            break;
          }

          case 'shoot_event': {
            if (!currentRoomId || !playerId) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            broadcastToRoom(room, ws, {
              type: 'player_shot',
              playerId,
              weaponId: msg.weaponId,
              origin: msg.origin,
              direction: msg.direction
            });
            break;
          }

          case 'damage_event': {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            const victim = room.players.get(msg.victimId);
            if (victim) {
              victim.data.health = Math.max(0, victim.data.health - msg.damage);
              if (victim.data.health <= 0 && !victim.data.isDead) {
                victim.data.isDead = true;
                victim.data.deaths += 1;

                const killer = room.players.get(msg.killerId);
                if (killer) {
                  killer.data.kills += 1;
                  killer.data.score += msg.isHeadshot ? 300 : 200;
                }

                broadcastToRoom(room, null, {
                  type: 'kill_event',
                  killerId: msg.killerId,
                  killerName: msg.killerName,
                  killerTeam: msg.killerTeam,
                  victimId: msg.victimId,
                  victimName: victim.data.name,
                  victimTeam: victim.data.team,
                  weaponId: msg.weaponId,
                  weaponName: msg.weaponName,
                  isHeadshot: msg.isHeadshot
                });
              } else {
                broadcastToRoom(room, null, {
                  type: 'player_damaged',
                  victimId: msg.victimId,
                  health: victim.data.health,
                  armor: victim.data.armor
                });
              }
            }
            break;
          }

          case 'plant_c4': {
            if (!currentRoomId || !playerId) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            room.plantedC4 = {
              site: msg.site,
              position: msg.position,
              planterName: msg.planterName,
              timerRemaining: 45,
              isDefused: false,
              isExploded: false
            };

            broadcastToRoom(room, null, {
              type: 'c4_planted',
              plantedC4: room.plantedC4
            });
            break;
          }

          case 'defuse_c4': {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (!room || !room.plantedC4) return;

            room.plantedC4.isDefused = true;
            room.scoreCT += 1;

            broadcastToRoom(room, null, {
              type: 'c4_defused',
              defuserPlayerId: playerId,
              defuserName: msg.defuserName,
              scoreCT: room.scoreCT
            });
            break;
          }

          case 'send_chat': {
            if (!currentRoomId || !playerId) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            const player = room.players.get(playerId);
            const chatMsg = {
              id: Math.random().toString(36).substring(2, 9),
              senderName: player?.data.name || 'Player',
              senderTeam: player?.data.team || 'CT',
              text: msg.text,
              timestamp: Date.now()
            };

            broadcastToRoom(room, null, {
              type: 'chat',
              chat: chatMsg
            });
            break;
          }

          case 'leave_room': {
            cleanupPlayer(currentRoomId, playerId, ws);
            currentRoomId = null;
            playerId = null;
            break;
          }
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    ws.on('close', () => {
      cleanupPlayer(currentRoomId, playerId, ws);
    });
  });

  function broadcastToRoom(room: GameRoom, senderWs: WebSocket | null, payload: object) {
    const json = JSON.stringify(payload);
    room.players.forEach(({ ws }) => {
      if (ws !== senderWs && ws.readyState === WebSocket.OPEN) {
        ws.send(json);
      }
    });
  }

  function cleanupPlayer(roomId: string | null, pId: string | null, ws: WebSocket) {
    if (!roomId || !pId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const playerEntry = room.players.get(pId);
    room.players.delete(pId);

    if (playerEntry) {
      broadcastToRoom(room, ws, {
        type: 'player_left',
        playerId: pId,
        playerName: playerEntry.data.name
      });
    }

    // If room is empty, delete it
    if (room.players.size === 0) {
      rooms.delete(roomId);
    } else if (room.hostId === pId) {
      // Migrate host
      const nextHost = room.players.keys().next().value;
      if (nextHost) {
        room.hostId = nextHost;
        const hostData = room.players.get(nextHost);
        if (hostData) room.hostName = hostData.data.name;
      }
    }
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[CS3D Real-time Server] running on http://0.0.0.0:${PORT} with WebSockets enabled.`);
  });
}

startServer();
