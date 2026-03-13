import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MiniGameCard } from '../../cards/mini-game-card/mini-game-card';
import { MiniGameService, MiniGame } from '../../services/mini-game.service';

@Component({
  selector: 'app-session-config',
  imports: [RouterLink, MiniGameCard],
  templateUrl: './session-config.html',
  styleUrl: './session-config.css',
})
export class SessionConfig implements OnInit {
  selectedMiniGame: MiniGame | null = null;

  constructor(
    private miniGameService: MiniGameService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.selectedMiniGame = this.miniGameService.getSelectedMiniGame();
  }

  deselectMiniGame(): void {
    this.selectedMiniGame = null;
    this.miniGameService.setSelectedMiniGame(null);
  }

  changeMiniGame(): void {
    this.router.navigate(['/mini-game-selector']);
  }
}
