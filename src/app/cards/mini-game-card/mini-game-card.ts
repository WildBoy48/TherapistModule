import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MiniGame } from '../../services/mini-game.service';

@Component({
  selector: 'app-mini-game-card',
  imports: [RouterLink],
  templateUrl: './mini-game-card.html',
  styleUrl: './mini-game-card.css',
})
export class MiniGameCard {
  @Input() game!: MiniGame;
}
