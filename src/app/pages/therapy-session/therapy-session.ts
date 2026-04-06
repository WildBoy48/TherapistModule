import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { GameStatsService, GameStats } from '../../services/game-stats.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

export interface TaskLogEntry {
  timestamp: string;
  task: string;
}

export interface ScorePoint {
  score: number;
}

@Component({
  selector: 'app-therapy-session',
  imports: [NgIf, NgFor],
  templateUrl: './therapy-session.html',
  styleUrl: './therapy-session.css',
})
export class TherapySession implements OnInit, OnDestroy {
  connected = false;
  currentStats: GameStats | null = null;
  paused = false;
  showSummary = false;
  sessionSummary: {
    finalScore: number;
    totalTime: string;
    errors: number;
    tasksCompleted: number;
    status: string;
  } | null = null;

  scoreHistory: ScorePoint[] = [];
  taskLog: TaskLogEntry[] = [];

  readonly GRAPH_W = 400;
  readonly GRAPH_H = 100;
  readonly MAX_POINTS = 60;

  private lastTask = '';
  private subs = new Subscription();

  @ViewChild('taskLogEl') taskLogEl!: ElementRef<HTMLDivElement>;

  constructor(
    private gameStats: GameStatsService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.gameStats.connect();

    this.subs.add(this.gameStats.connected$.subscribe(c => {
      this.connected = c;
      this.cdr.detectChanges();
    }));

    this.subs.add(this.gameStats.stats$.subscribe(stats => {
      if (!stats) return;
      this.currentStats = stats;

      this.scoreHistory.push({ score: stats.score });
      if (this.scoreHistory.length > this.MAX_POINTS) this.scoreHistory.shift();

      if (stats.currentTask && stats.currentTask !== this.lastTask) {
        this.lastTask = stats.currentTask;
        this.taskLog.push({ timestamp: this.formatTime(stats.timeElapsed), task: stats.currentTask });
        setTimeout(() => this.scrollLogToBottom(), 0);
      }

      this.cdr.detectChanges();
    }));

    this.subs.add(this.gameStats.messages$.subscribe(msg => {
      if (msg.type === 'session_end' || msg.type === 'game_disconnected') {
        this.currentStats = null;
        this.scoreHistory = [];
        this.taskLog = [];
        this.lastTask = '';
        this.cdr.detectChanges();
      }
    }));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.gameStats.disconnect();
  }

  togglePause(): void {
    this.paused = !this.paused;
    this.gameStats.sendCommand({ type: this.paused ? 'pause' : 'resume' });
    this.cdr.detectChanges();
  }

  endSession(): void {
    const stats = this.currentStats;
    this.sessionSummary = {
      finalScore: stats?.score ?? 0,
      totalTime: this.formatTime(stats?.timeElapsed ?? 0),
      errors: stats?.errors ?? 0,
      tasksCompleted: this.taskLog.length,
      status: stats?.completed ? 'Completed' : 'Ended early',
    };
    this.gameStats.sendCommand({ type: 'end_session' });
    this.showSummary = true;
    this.cdr.detectChanges();
  }

  goBack(): void {
    this.showSummary = false;
    this.router.navigate(['/session-config']);
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  get svgPolylinePoints(): string {
    if (this.scoreHistory.length < 2) return '';
    const maxScore = Math.max(...this.scoreHistory.map(p => p.score), 1);
    return this.scoreHistory.map((p, i) => {
      const x = (i / (this.MAX_POINTS - 1)) * this.GRAPH_W;
      const y = this.GRAPH_H - (p.score / maxScore) * (this.GRAPH_H - 12);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  private scrollLogToBottom(): void {
    if (this.taskLogEl) {
      this.taskLogEl.nativeElement.scrollTop = this.taskLogEl.nativeElement.scrollHeight;
    }
  }
}
