export const typeEffectiveness = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

export const getStat = (pokemon, statName) =>
  pokemon?.stats?.find((stat) => stat.stat.name === statName)?.base_stat || 1;

export const getMaxHp = (pokemon) => Math.max(25, getStat(pokemon, "hp") * 2);

export function getBattleMoves(pokemon) {
  const primaryType = pokemon?.types?.[0]?.type?.name || "normal";
  const statAttack = getStat(pokemon, "attack");
  const statSpecial = getStat(pokemon, "special-attack");
  const sourceMoves = pokemon?.moves?.slice(0, 24) || [];
  const picked = [];

  for (const entry of sourceMoves) {
    const name = entry.move.name;
    if (picked.some((move) => move.name === name)) continue;
    picked.push({
      name,
      label: name.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "),
      type: picked.length % 2 === 0 ? primaryType : "normal",
      power: Math.max(35, Math.min(95, Math.round((statAttack + statSpecial) / 2) + picked.length * 6)),
      accuracy: Math.max(82, 96 - picked.length * 3),
    });
    if (picked.length === 4) break;
  }

  const fallback = [
    { name: "tackle", label: "Tackle", type: "normal", power: 40, accuracy: 95 },
    { name: `${primaryType}-burst`, label: `${primaryType.charAt(0).toUpperCase() + primaryType.slice(1)} Burst`, type: primaryType, power: 55, accuracy: 90 },
  ];

  return picked.length ? picked : fallback;
}

export function calculateTypeEffectiveness(attackingType, defendingTypes) {
  return defendingTypes.reduce((total, type) => {
    const defType = type.type?.name || type.name || type;
    return total * (typeEffectiveness[attackingType]?.[defType] ?? 1);
  }, 1);
}

export function calculateMoveDamage(attacker, defender, move) {
  const attack = Math.max(getStat(attacker, "attack"), getStat(attacker, "special-attack"));
  const defense = Math.max(1, Math.max(getStat(defender, "defense"), getStat(defender, "special-defense")));
  const sameTypeBonus = attacker.types.some((type) => type.type.name === move.type) ? 1.2 : 1;
  const effectiveness = calculateTypeEffectiveness(move.type, defender.types);
  const randomFactor = 0.88 + Math.random() * 0.16;
  const critical = Math.random() < 0.08 ? 1.5 : 1;
  const missed = Math.random() * 100 > move.accuracy;

  if (missed) {
    return { damage: 0, effectiveness, critical: false, missed: true };
  }

  const damage = Math.max(
    1,
    Math.floor(((move.power * attack) / defense) * 0.35 * sameTypeBonus * effectiveness * randomFactor * critical)
  );

  return { damage, effectiveness, critical: critical > 1, missed: false };
}

