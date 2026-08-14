// Une SEULE disposition d'affichage. La saisie physique reste agnostique au
// layout (on lit event.key, qui rend le vrai caractère tapé), donc inutile de
// détecter QWERTY/AZERTY : seul l'affichage est figé ici. "ENTER"/"DEL" sont
// traités à part par le composant Keyboard.
export const KEYBOARD_ROWS: string[][] = [
  ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "DEL"],
];
