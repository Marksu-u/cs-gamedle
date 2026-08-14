"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import Board from "@/components/wordle/Board";
import Keyboard from "@/components/wordle/Keyboard";
import LengthTabs from "@/components/wordle/LengthTabs";
import ResultBanner from "@/components/wordle/ResultBanner";
import GameMenu, { type GameMenuItem } from "@/components/GameMenu";
import HelpModal from "@/components/HelpModal";
import { deriveKeyStates } from "@/lib/wordle/engine";
import { availableLengths } from "@/lib/wordle/selection";
import { wordlePoints } from "@/lib/daily/scoring";
import {
  useDailyPuzzle,
  useAutoSave,
  useDay,
} from "@/lib/daily/useDailyPuzzle";
import type { PuzzleId } from "@/lib/daily/types";
import type { BoardState, WordleData } from "@/lib/wordle/types";
import {
  createInitialState,
  createWordleReducer,
  hintCandidates,
} from "./reducer";

export default function WordleGame({ data }: { data: WordleData }) {
  const lengths = availableLengths(data);
  const defaultLength = lengths.includes(5) ? 5 : lengths[0];
  // Longueur max (8 ici) : sert à dimensionner les tuiles de TOUS les boards de
  // façon homogène (cf. Board), pour que la grille la plus large tienne à l'écran.
  const maxLength = Math.max(...lengths);

  const day = useDay();
  // Reducer mémoïsé (fermé sur `data` + le jour, stable). L'init paresseuse tire
  // le mot côté client ; comme la cible n'est jamais rendue, aucun mismatch
  // d'hydratation.
  const reducer = useMemo(() => createWordleReducer(data, day), [data, day]);
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    createInitialState(data, defaultLength, day),
  );
  const board = state.boards[state.activeLength];

  // Chaque longueur est une grille quotidienne indépendante, avec sa propre
  // entrée de stockage. On persiste donc le BOARD, pas le WordleState entier.
  const puzzleId = `wordle-${board.length}` as PuzzleId;
  const { saved, done, points, save, commit } = useDailyPuzzle<BoardState>(
    puzzleId,
    day,
  );

  // Reprise après rafraîchissement, une fois PAR LONGUEUR : le joueur peut
  // ouvrir l'onglet 7 lettres bien après avoir chargé la page.
  const restored = useRef<Set<number>>(new Set());
  useEffect(() => {
    if (!saved || restored.current.has(board.length)) return;
    restored.current.add(board.length);
    dispatch({ type: "RESTORE_BOARD", board: saved });
  }, [saved, board.length]);

  // Enregistrement du résultat dès qu'une grille quotidienne se termine.
  useEffect(() => {
    if (board.mode !== "daily" || board.status === "playing" || done) return;
    commit({
      status: board.status === "won" ? "won" : "lost",
      points: wordlePoints({
        length: board.length,
        attempt: board.guesses.length,
        hints: board.hintedChars.length,
        won: board.status === "won",
      }),
      state: board,
    });
  }, [board, done, commit]);

  // Sauvegarde de l'avancement d'une grille quotidienne en cours.
  useAutoSave(save, board, board.mode === "daily" && board.status === "playing");

  // Highlight de press : on illumine brièvement la touche correspondant au dernier
  // caractère produit (frappe physique OU clic). État purement visuel, hors reducer.
  const [flashKey, setFlashKey] = useState<string | null>(null);
  const flashTimer = useRef<number | null>(null);
  function flash(label: string) {
    setFlashKey(label);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlashKey(null), 150);
  }

  // Handlers uniques partagés par le clavier physique et le clavier visuel (DRY) :
  // chaque saisie illumine la touche puis dispatche l'action.
  function input(char: string) {
    flash(char.toUpperCase());
    dispatch({ type: "KEY_INPUT", char });
  }
  function submit() {
    flash("ENTER");
    dispatch({ type: "SUBMIT" });
  }
  function del() {
    flash("DEL");
    dispatch({ type: "DELETE" });
  }

  // Clavier physique : event.key rend le caractère réellement produit, donc la
  // saisie marche quel que soit le layout physique (QWERTY/AZERTY/…). On lie une
  // seule fois ; les handlers n'utilisent que des références stables (dispatch, refs).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter") submit();
      else if (e.key === "Backspace") del();
      else if (/^[a-zA-Z0-9]$/.test(e.key)) input(e.key);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // `invalid` déclenche le shake ; on le remet à zéro une fois l'animation finie.
  useEffect(() => {
    if (!board.invalid) return;
    const id = setTimeout(() => dispatch({ type: "CLEAR_INVALID" }), 400);
    return () => clearTimeout(id);
  }, [board.invalid]);

  // Modale d'aide (règles du jeu).
  const [helpOpen, setHelpOpen] = useState(false);

  // Pop-up d'indice : on affiche brièvement la DERNIÈRE lettre indicée en overlay.
  // On mémorise la longueur précédente de hintedChars pour ne déclencher que sur
  // un vrai AJOUT — pas au premier rendu ni lors d'un changement d'onglet (où le
  // board actif peut déjà avoir des indices).
  const [hintPop, setHintPop] = useState<string | null>(null);
  const prevHintCount = useRef(board.hintedChars.length);
  useEffect(() => {
    const count = board.hintedChars.length;
    if (count > prevHintCount.current) {
      setHintPop(board.hintedChars[count - 1]);
      const id = setTimeout(() => setHintPop(null), 1100);
      prevHintCount.current = count;
      return () => clearTimeout(id);
    }
    // Resynchronise sans pop-up (ex. changement d'onglet, REPLAY qui remet à zéro).
    prevHintCount.current = count;
  }, [board.hintedChars]);

  // Le clavier reflète aussi les caractères indicés (marqués "present").
  const keyStates = deriveKeyStates(
    board.guesses,
    board.evaluations,
    board.hintedChars,
  );

  // Actions annexes regroupées dans le menu « Options ».
  const menuItems: GameMenuItem[] = [
    {
      id: "hint",
      label: "Indice",
      icon: "hint",
      disabled:
        board.status !== "playing" || hintCandidates(board).length === 0,
      onSelect: () => dispatch({ type: "HINT" }),
    },
    {
      id: "help",
      label: "Aide",
      icon: "help",
      onSelect: () => setHelpOpen(true),
    },
    {
      id: "giveup",
      label: "Abandonner",
      icon: "giveup",
      disabled: board.status !== "playing",
      onSelect: () => dispatch({ type: "GIVE_UP" }),
    },
  ];

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-5">
      <LengthTabs
        lengths={lengths}
        active={state.activeLength}
        onSelect={(length) => dispatch({ type: "SELECT_LENGTH", length })}
      />
      {/* key={activeLength} : remonte le sous-arbre au changement d'onglet, ce qui
          rejoue l'animation d'entrée (transition de tab). */}
      <div
        key={state.activeLength}
        className="flex w-full animate-[wordle-tab_0.25s_ease] flex-col items-center gap-5"
      >
        {/* Menu d'actions annexes, aligné à droite juste au-dessus du board. */}
        <div className="flex w-full justify-end">
          <GameMenu items={menuItems} />
        </div>
        <Board board={board} maxLength={maxLength} />
        <ResultBanner
          board={board}
          points={points}
          onPractice={() => dispatch({ type: "PRACTICE" })}
        />
      </div>
      <Keyboard
        keyStates={keyStates}
        flashKey={flashKey}
        onKey={input}
        onEnter={submit}
        onDelete={del}
      />

      {/* Pop-up d'indice : grosse tuile dorée centrée, disparaît après ~1,1 s. */}
      {hintPop && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
          <div className="cs2-display animate-[hint-pop_1.1s_ease_forwards] rounded-xl bg-[var(--wordle-present)] px-8 py-6 text-6xl font-extrabold text-black">
            {hintPop}
          </div>
        </div>
      )}

      <HelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Comment jouer"
      >
        <ul className="space-y-2">
          <li>
            Devine le pseudo d’un joueur pro CS en 6 essais. Chaque essai doit
            être un pseudo du pool.
          </li>
          <li>
            🟩 vert = bon caractère bien placé, 🟨 jaune = présent mais mal
            placé, ⬛ gris = absent.
          </li>
          <li>
            Les onglets changent la longueur du pseudo : un board indépendant
            par longueur.
          </li>
          <li>
            💡 L’indice révèle un caractère de la réponse (marqué en jaune sur
            le clavier) et ne consomme pas d’essai.
          </li>
          <li>Certains pseudos contiennent des chiffres.</li>
        </ul>
      </HelpModal>
    </div>
  );
}
