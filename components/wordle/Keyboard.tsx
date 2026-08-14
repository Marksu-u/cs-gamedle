import Key from "./Key";
import { KEYBOARD_ROWS } from "@/lib/wordle/keyboardLayout";
import type { KeyState } from "@/lib/wordle/types";

type Props = {
  keyStates: Map<string, KeyState>;
  flashKey: string | null; // touche illuminée brièvement (frappe physique ou clic)
  onKey: (char: string) => void;
  onEnter: () => void;
  onDelete: () => void;
};

export default function Keyboard({ keyStates, flashKey, onKey, onEnter, onDelete }: Props) {
  function press(label: string) {
    if (label === "ENTER") return onEnter();
    if (label === "DEL") return onDelete();
    onKey(label);
  }
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-1.5">
      {KEYBOARD_ROWS.map((row, r) => (
        <div key={r} className="flex justify-center gap-1.5">
          {row.map((label) => (
            <Key
              key={label}
              label={label}
              wide={label === "ENTER" || label === "DEL"}
              state={keyStates.get(label) ?? "unused"}
              flash={label === flashKey}
              onPress={press}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
