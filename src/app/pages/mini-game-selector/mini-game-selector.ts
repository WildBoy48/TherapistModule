import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { MiniGameCard } from '../../cards/mini-game-card/mini-game-card';
import { MiniGameService, MiniGame } from '../../services/mini-game.service';

@Component({
  selector: 'app-mini-game-selector',
  imports: [MiniGameCard],
  templateUrl: './mini-game-selector.html',
  styleUrl: './mini-game-selector.css',
})
export class MiniGameSelector implements OnInit {
  miniGames: MiniGame[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private miniGameService: MiniGameService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadMiniGames();
  }

  private loadMiniGames(): void {
    this.ngZone.run(async () => {
      try {
        this.isLoading = true;
        this.miniGames = await this.miniGameService.getAllMiniGames();
        this.cdr.markForCheck();
      } catch (error) {
        console.error('Error loading mini-games:', error);
        this.error = 'Failed to load games. Please try again.';
        this.cdr.markForCheck();
      } finally {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
