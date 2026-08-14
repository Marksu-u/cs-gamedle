import type { KeyState } from "@/lib/wordle/types";

const STATE_CLASS: Record<KeyState, string> = {
  unused: "bg-[var(--surface)] text-foreground",
  absent: "bg-[var(--wordle-absent)] text-[color:var(--muted)]",
  present: "bg-[var(--wordle-present)] text-black",
  correct: "bg-[var(--wordle-correct)] text-black",
};

type Props = {
  label: string;
  state: KeyState;
  wide?: boolean; // ENTER / DEL
  flash?: boolean; // illumination brève au moment où la touche est "pressée"
  onPress: (label: string) => void;
};

export default function Key({ label, state, wide, flash, onPress }: Props) {
  return (
    <button
      type="button"
      onClick={() => onPress(label)}
      className={`flex h-12 min-w-7 items-center justify-center rounded-md text-sm font-semibold uppercase transition active:scale-95 ${wide ? "px-3 text-xs" : "flex-1"} ${STATE_CLASS[state]} ${flash ? "ring-2 ring-[color:var(--accent)] brightness-125" : ""}`}
    >
      {label === "DEL" ? "⌫" : label}
    </button>
  );
}
