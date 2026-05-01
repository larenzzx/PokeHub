import { typeColors } from "../utils/pokemonTypes";

export function TypeBadge({ type, size = "sm" }) {
  const name = type?.type?.name || type?.name || type;
  const darkTextTypes = new Set(["electric", "ice", "fairy", "normal", "flying"]);
  return (
    <span
      className={`badge ${size === "lg" ? "badge-lg" : "badge-sm"} ${typeColors[name] || "bg-gray-400"} border-2 border-slate-900/30 font-black uppercase shadow-sm ${darkTextTypes.has(name) ? "text-slate-950" : "text-white"}`}
    >
      {name}
    </span>
  );
}
