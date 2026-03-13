import { Component, Input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MiniGame } from '../../services/mini-game.service';
import { MiniGameService } from '../../services/mini-game.service';

@Component({
  selector: 'app-mini-game-card',
  imports: [RouterLink],
  templateUrl: './mini-game-card.html',
  styleUrl: './mini-game-card.css',
})
export class MiniGameCard {
  @Input() game!: MiniGame;
  @Input() isSelectable: boolean = false; // true when in mini-game-selector, false when in session-config

  constructor(
    private miniGameService: MiniGameService,
    private router: Router
  ) {}

  selectGame(): void {
    if (this.isSelectable) {
      this.miniGameService.setSelectedMiniGame(this.game);
      this.router.navigate(['/session-config']);
    }
  }
}
