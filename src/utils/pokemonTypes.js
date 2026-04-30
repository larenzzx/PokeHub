export const typeColors = {
  normal: "bg-gray-400",
  fire: "bg-red-500",
  water: "bg-blue-500",
  electric: "bg-yellow-400",
  grass: "bg-green-500",
  ice: "bg-cyan-300",
  fighting: "bg-orange-700",
  poison: "bg-purple-600",
  ground: "bg-yellow-600",
  flying: "bg-indigo-400",
  psychic: "bg-pink-400",
  bug: "bg-lime-500",
  rock: "bg-yellow-800",
  ghost: "bg-violet-700",
  dragon: "bg-indigo-700",
  dark: "bg-gray-800",
  steel: "bg-gray-500",
  fairy: "bg-pink-300",
};

export const typeSoftColors = {
  normal: "bg-gray-100",
  fire: "bg-red-100",
  water: "bg-blue-100",
  electric: "bg-yellow-100",
  grass: "bg-green-100",
  ice: "bg-cyan-100",
  fighting: "bg-orange-100",
  poison: "bg-purple-100",
  ground: "bg-amber-100",
  flying: "bg-indigo-100",
  psychic: "bg-pink-100",
  bug: "bg-lime-100",
  rock: "bg-yellow-200",
  ghost: "bg-violet-100",
  dragon: "bg-indigo-200",
  dark: "bg-gray-200",
  steel: "bg-slate-100",
  fairy: "bg-pink-100",
};

export const typeBorderColors = {
  normal: "border-gray-400",
  fire: "border-red-500",
  water: "border-blue-500",
  electric: "border-yellow-400",
  grass: "border-green-500",
  ice: "border-cyan-300",
  fighting: "border-orange-700",
  poison: "border-purple-600",
  ground: "border-yellow-600",
  flying: "border-indigo-400",
  psychic: "border-pink-400",
  bug: "border-lime-500",
  rock: "border-yellow-800",
  ghost: "border-violet-700",
  dragon: "border-indigo-700",
  dark: "border-gray-800",
  steel: "border-gray-500",
  fairy: "border-pink-300",
};

export const formatPokemonName = (name = "") =>
  name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const getPokemonIdFromUrl = (url = "") => {
  const match = url.match(/\/pokemon\/(\d+)\//);
  return match ? Number(match[1]) : null;
};

