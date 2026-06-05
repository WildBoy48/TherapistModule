import { Injectable, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { ServerConfigService } from './server-config.service';

export interface GameStats {
  type: 'stats';
  totalScore: number;
  totalDrops: number;
  totalMisses: number;
  totalReps: number;
  totalAccuracy: number;
  repTotalTime: number;
  repReactionTime: number;
  repMovingTime: number;
  repSpaceExplored: number;
  repMaxHorizontalReach: number;
  repIdealPathLength: number;
}

export interface GameConfig {
  audioCues: boolean;
  visualCues: boolean;
  sessionDuration: number;
  targetScore: number;
  device: string;
  backgroundDetail: number;
  seat: number;
  hapticFeedback: boolean;
  bci_minGripTime: number;
}

export type GameStatsMessage =
  | GameStats
  | { type: 'unity_connected' }
  | { type: 'session_end' }
  | { type: 'game_disconnected' }
  | { type: 'export_parameters'; config: Partial<GameConfig> };

@Injectable({ providedIn: 'root' })
export class GameStatsService implements OnDestroy {
  private ws: WebSocket | null = null;
  private readonly _stats = new BehaviorSubject<GameStats | null>(null);
  private readonly _connected = new BehaviorSubject<boolean>(false);
  private readonly _messages = new Subject<GameStatsMessage>();

  constructor(private ngZone: NgZone, private serverConfig: ServerConfigService) {}

  /** Latest stats snapshot (null when no session is active) */
  readonly stats$: Observable<GameStats | null> = this._stats.asObservable();

  /** Whether the Unity game is currently sending data */
  readonly connected$: Observable<boolean> = this._connected.asObservable();

  /** Raw message stream – useful for reacting to session_end / game_disconnected */
  readonly messages$: Observable<GameStatsMessage> = this._messages.asObservable();

  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(`ws://${this.serverConfig.getServerIp()}:3000`);
    } catch (error) {
      this.ngZone.run(() => this._connected.next(false));
      console.error('GameStatsService WebSocket initialization failed', error);
      return;
    }

    this.ws.onopen = () => {
      this.ngZone.run(() => {
        if (this.ws) {
          this.ws.send(JSON.stringify({ client: 'angular' }));
        }
      });
    };

    this.ws.onmessage = (event) => {
      let msg: GameStatsMessage;
      try {
        msg = JSON.parse(event.data as string);
        //console.log('[GameStats] Message received:', msg);
      } catch {
        //console.error('GameStatsService WebSocket message parsing failed', event.data);
        return;
      }

      this.ngZone.run(() => {
        this._messages.next(msg);

        if (msg.type === 'unity_connected') {
          this._connected.next(true);
        } else if (msg.type === 'stats') {
          this._stats.next(msg as GameStats);
          this._connected.next(true);
        } else if (msg.type === 'session_end' || msg.type === 'game_disconnected') {
          this._stats.next(null);
          this._connected.next(false);
        }
      });
    };

    this.ws.onclose = () => {
      this.ngZone.run(() => this._connected.next(false));
    };

    this.ws.onerror = (err) => {
      this.ngZone.run(() => this._connected.next(false));
      console.error('GameStatsService WebSocket error', err);
    };
  }

  sendCommand(payload: object): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
      console.log('[GameStats] Command sent:', payload);
    } else {
      console.warn('[GameStats] Cannot send command — WebSocket not open:', payload);
    }
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this._stats.next(null);
    this._connected.next(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
