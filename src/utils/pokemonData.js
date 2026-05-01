export function normalizeTypeName(type) {
  return String(type?.type?.name || type?.name || type || "normal").toLowerCase();
}

export function normalizeTypeNames(types = []) {
  return types.map(normalizeTypeName).filter(Boolean);
}

export function formatMoveLabel(name = "") {
  return String(name)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeBattleMove(moveEntry, fallbackType = "normal") {
  const move = moveEntry?.move || moveEntry || {};
  const name = move.name || moveEntry?.name || "struggle";
  const type = normalizeTypeName(move.type || moveEntry?.type || fallbackType);
  const category = move.damage_class?.name || moveEntry?.category || "physical";
  const rawPower = move.power ?? moveEntry?.power;
  const rawAccuracy = move.accuracy ?? moveEntry?.accuracy;
  const power = Number(rawPower) > 0 ? Number(rawPower) : 0;

  return {
    name,
    label: moveEntry?.label || formatMoveLabel(name),
    type,
    power,
    accuracy: Number(rawAccuracy) > 0 ? Number(rawAccuracy) : 100,
    category,
    pp: Math.max(1, Number(move.pp ?? moveEntry?.pp ?? 10)),
  };
}

export function normalizePokemon(pokemon) {
  if (!pokemon) return null;
  const types = normalizeTypeNames(pokemon.types);
  return {
    ...pokemon,
    typeNames: types,
    battleMoves: pokemon.battleMoves?.map((move) => normalizeBattleMove(move, types[0])) || [],
  };
}
