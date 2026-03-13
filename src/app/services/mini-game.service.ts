import { Injectable, NgZone } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';

export interface MiniGame {
  id: number;
  name: string;
  targetGroup: string;
  description: string;
  image: string;
}

@Injectable({
  providedIn: 'root'
})
export class MiniGameService {
  private miniGamesCollection = 'mini-games';

  constructor(private firestore: Firestore, private ngZone: NgZone) {}

  /**
   * Fetch all mini-games from the database
   */
  async getAllMiniGames(): Promise<MiniGame[]> {
    try {
      console.log(`Fetching mini-games from collection: ${this.miniGamesCollection}`);
      const miniGamesRef = collection(this.firestore, this.miniGamesCollection);
      const querySnapshot = await getDocs(miniGamesRef);
      
      console.log(`Found ${querySnapshot.size} games`);
      
      const miniGames: MiniGame[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as MiniGame;
        console.log('Game data:', data);
        miniGames.push(data);
      });

      // Sort by id for consistent ordering
      miniGames.sort((a, b) => a.id - b.id);
      
      console.log('Mini-games loaded:', miniGames);
      return miniGames;
    } catch (error) {
      console.error('Error fetching mini-games:', error);
      throw error;
    }
  }
}
