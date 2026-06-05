import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { NgIf } from '@angular/common';
import { GameStatsService, GameStats } from '../../services/game-stats.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-therapy-session',
  imports: [NgIf],
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
    totalDrops: number;
    totalMisses: number;
    totalReps: number;
    totalAccuracy: number;
  } | null = null;

  private subs = new Subscription();

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
      this.cdr.detectChanges();
    }));

    this.subs.add(this.gameStats.messages$.subscribe(msg => {
      if (msg.type === 'session_end' || msg.type === 'game_disconnected') {
        this.currentStats = null;
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
      finalScore: stats?.totalScore ?? 0,
      totalDrops: stats?.totalDrops ?? 0,
      totalMisses: stats?.totalMisses ?? 0,
      totalReps: stats?.totalReps ?? 0,
      totalAccuracy: stats?.totalAccuracy ?? 0
    };
    this.gameStats.sendCommand({ type: 'end_session' });
    this.showSummary = true;
    this.cdr.detectChanges();
  }

  goBack(): void {
    this.showSummary = false;
    this.router.navigate(['/session-config']);
  }
}
