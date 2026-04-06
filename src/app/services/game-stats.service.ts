import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';

export interface GameStats {
  type: 'stats';
  score: number;
  timeElapsed: number;   // seconds
  errors: number;
  currentTask: string;
  completed: boolean;
}

export type GameStatsMessage =
  | GameStats
  | { type: 'unity_connected' }
  | { type: 'session_end' }
  | { type: 'game_disconnected' };

const WS_URL = 'ws://localhost:3000';

@Injectable({ providedIn: 'root' })
export class GameStatsService implements OnDestroy {
  private ws: WebSocket | null = null;
  private readonly _stats = new BehaviorSubject<GameStats | null>(null);
  private readonly _connected = new BehaviorSubject<boolean>(false);
  private readonly _messages = new Subject<GameStatsMessage>();

  /** Latest stats snapshot (null when no session is active) */
  readonly stats$: Observable<GameStats | null> = this._stats.asObservable();

  /** Whether the Unity game is currently sending data */
  readonly connected$: Observable<boolean> = this._connected.asObservable();

  /** Raw message stream – useful for reacting to session_end / game_disconnected */
  readonly messages$: Observable<GameStatsMessage> = this._messages.asObservable();

  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      // Identify as an Angular viewer (no "client":"unity" → server treats as viewer)
      this.ws!.send(JSON.stringify({ client: 'angular' }));
    };

    this.ws.onmessage = (event) => {
      let msg: GameStatsMessage;
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        return;
      }

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
    };

    this.ws.onclose = () => {
      this._connected.next(false);
    };

    this.ws.onerror = (err) => {
      console.error('GameStatsService WebSocket error', err);
      this._connected.next(false);
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
