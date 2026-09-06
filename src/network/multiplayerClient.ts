import {
  RemotePlayerState,
  MultiplayerRoomInfo,
  ChatMessage,
  WeaponId,
  Team
} from '../types';

export type MultiplayerEventListener = (event: any) => void;

class MultiplayerClient {
  private ws: WebSocket | null = null;
  public isConnected: boolean = false;
  public currentRoomId: string | null = null;
  public myPlayerId: string | null = null;
  public ping: number = 20;
  private listeners: Set<MultiplayerEventListener> = new Set();
  private pingInterval: any = null;
  private lastPingSent: number = 0;

  public connect(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        resolve(true);
        return;
      }

      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.startPing();
          this.fetchRooms();
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (e) {
            console.error('[MultiplayerClient] Failed to parse message', e);
          }
        };

        this.ws.onerror = (err) => {
          console.warn('[MultiplayerClient] WebSocket connection notice', err);
          this.isConnected = false;
          resolve(false);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.currentRoomId = null;
          this.stopPing();
          this.emit({ type: 'disconnected' });
        };
      } catch (err) {
        console.warn('[MultiplayerClient] Connection catch error', err);
        resolve(false);
      }
    });
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
        this.lastPingSent = Date.now();
        this.send({ type: 'ping', timestamp: this.lastPingSent });
      }
    }, 3000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleMessage(data: any) {
    if (data.type === 'pong') {
      this.ping = Math.max(5, Date.now() - (data.timestamp || this.lastPingSent));
      return;
    }

    if (data.type === 'room_joined') {
      this.currentRoomId = data.roomId;
      this.myPlayerId = data.playerId;
    }

    this.emit(data);
  }

  public subscribe(listener: MultiplayerEventListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: any) {
    this.listeners.forEach(fn => fn(event));
  }

  public send(payload: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  public fetchRooms() {
    this.send({ type: 'get_rooms' });
  }

  public createRoom(roomName: string, player: { name: string; team: Team; activeWeaponId: WeaponId }, maxPlayers: number = 10, password?: string) {
    this.send({
      type: 'create_room',
      roomName,
      player,
      maxPlayers,
      password
    });
  }

  public joinRoom(roomId: string, player: { name: string; team: Team; activeWeaponId: WeaponId }, password?: string) {
    this.send({
      type: 'join_room',
      roomId,
      player,
      password
    });
  }

  public leaveRoom() {
    if (this.currentRoomId) {
      this.send({ type: 'leave_room' });
      this.currentRoomId = null;
    }
  }

  public sendTransform(data: Partial<RemotePlayerState>) {
    this.send({
      type: 'update_transform',
      data
    });
  }

  public sendShoot(weaponId: WeaponId, origin: { x: number; y: number; z: number }, direction: { x: number; y: number; z: number }) {
    this.send({
      type: 'shoot_event',
      weaponId,
      origin,
      direction
    });
  }

  public sendDamage(victimId: string, damage: number, isHeadshot: boolean, killerId: string, killerName: string, killerTeam: Team, weaponId: WeaponId, weaponName: string) {
    this.send({
      type: 'damage_event',
      victimId,
      damage,
      isHeadshot,
      killerId,
      killerName,
      killerTeam,
      weaponId,
      weaponName
    });
  }

  public sendPlantC4(site: 'A' | 'B', position: { x: number; y: number; z: number }, planterName: string) {
    this.send({
      type: 'plant_c4',
      site,
      position,
      planterName
    });
  }

  public sendDefuseC4(defuserName: string) {
    this.send({
      type: 'defuse_c4',
      defuserName
    });
  }

  public sendChat(text: string) {
    this.send({
      type: 'send_chat',
      text
    });
  }
}

export const mpClient = new MultiplayerClient();
