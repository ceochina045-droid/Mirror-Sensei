
export type Category = 'Poem' | 'Drama' | 'Literature' | 'Exam';
export type Level = 'Level 1' | 'Level 2' | 'Level 3';

export interface AdminPrompt {
  id: string;
  category: Category;
  subCategory: string;
  prompt: string;
}

export interface LevelPrompt {
  id: string;
  level: Level;
  prompt: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  query: string;
  response: string;
  category: Category;
  level: Level;
}

export interface AppState {
  view: 'user' | 'admin' | 'login';
  language: 'EN' | 'BN';
  selectedCategory: Category;
  selectedLevel: Level;
}
