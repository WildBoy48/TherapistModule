import { Component } from '@angular/core';
import { MiniGameCard } from '../../cards/mini-game-card/mini-game-card';

@Component({
  selector: 'app-mini-game-selector',
  imports: [MiniGameCard],
  templateUrl: './mini-game-selector.html',
  styleUrl: './mini-game-selector.css',
})
export class MiniGameSelector {}
