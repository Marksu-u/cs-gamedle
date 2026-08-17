// Une SEULE disposition d'affichage. La saisie physique reste agnostique au
// layout (we read event.key, which gives the character actually typed), so there
// is no need to detect QWERTY/AZERTY: only the display is fixed here.
// "ENTER"/"DEL" are handled separately by the Keyboard component.
export const KEYBOARD_ROWS: string[][] = [
  ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "DEL"],
];
