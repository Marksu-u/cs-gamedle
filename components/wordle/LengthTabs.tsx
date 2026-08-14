type Props = {
  lengths: number[];
  active: number;
  onSelect: (length: number) => void;
};

export default function LengthTabs({ lengths, active, onSelect }: Props) {
  return (
    <div className="flex justify-center gap-1.5" role="tablist" aria-label="Longueur du mot">
      {lengths.map((len) => {
        const isActive = len === active;
        return (
          <button
            key={len}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(len)}
            className={`h-9 w-9 rounded-md text-sm font-bold transition ${isActive ? "bg-[var(--accent)] text-black" : "bg-[var(--surface)] text-[color:var(--muted)] hover:text-foreground"}`}
          >
            {len}
          </button>
        );
      })}
    </div>
  );
}
