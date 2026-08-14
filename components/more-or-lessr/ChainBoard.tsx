import PlayerCard from "@/components/more-or-lessr/PlayerCard";
import {
  TOTAL_ROUNDS,
  type Category,
  type Direction,
  type Player,
} from "@/lib/more-or-lessr/types";

type Props = {
  anchor: Player; // valeur de référence, toujours visible
  challenger: Player; // valeur cachée à deviner
  category: Category;
  round: number;
  score: number;
  revealed: boolean; // round joué : on montre la valeur du challenger
  lastGuess: Direction | null;
  lastCorrect: boolean | null;
  onGuess: (direction: Direction) => void;
};

export default function ChainBoard({
  anchor,
  challenger,
  category,
  round,
  score,
  revealed,
  lastGuess,
  lastCorrect,
  onGuess,
}: Props) {
  const label = category === "rating" ? "Peak rating" : "Prize money";

  // Le flash vert/rouge porte sur la carte cliquée. On retrouve laquelle via la
  // direction : "more" = on a cliqué le challenger, "less" = on a cliqué l'ancre.
  function cardState(
    which: "anchor" | "challenger",
  ): "idle" | "correct" | "wrong" {
    if (!revealed || lastGuess === null) return "idle";
    const picked = lastGuess === "more" ? "challenger" : "anchor";
    if (which !== picked) return "idle";
    return lastCorrect ? "correct" : "wrong";
  }

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-5">
      <div className="flex w-full items-center justify-between text-xs tracking-widest text-[color:var(--muted)] uppercase">
        <span>
          Round {round}/{TOTAL_ROUNDS}
        </span>
        <span className="text-[color:var(--accent)]">{label}</span>
        <span>Score {score}</span>
      </div>

      <p className="text-center text-sm text-[color:var(--muted)]">
        Clique sur le joueur au plus grand{" "}
        <span className="text-foreground">{label.toLowerCase()}</span>
      </p>

      <div className="flex w-full items-stretch gap-3">
        {/* Ancre : valeur visible. La cliquer = parier que le challenger a MOINS. */}
        <PlayerCard
          player={anchor}
          category={category}
          revealed
          state={cardState("anchor")}
          onPick={revealed ? undefined : () => onGuess("less")}
        />
        <span className="cs2-display self-center text-xl font-extrabold text-[color:var(--accent-hot)] italic">
          VS
        </span>
        {/* Challenger : caché. Le cliquer = parier qu'il a PLUS que l'ancre.
            key sur le pseudo : rejoue l'animation d'entrée à chaque challenger. */}
        <div
          key={challenger.name}
          className="flex flex-1 animate-[mol-slide-in_0.25s_ease]"
        >
          <PlayerCard
            player={challenger}
            category={category}
            revealed={revealed}
            state={cardState("challenger")}
            onPick={revealed ? undefined : () => onGuess("more")}
          />
        </div>
      </div>
    </div>
  );
}
