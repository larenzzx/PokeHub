import assert from "node:assert/strict";
import test from "node:test";
import { calculateMoveDamage, calculateTypeEffectiveness, getBattleMoves } from "../src/utils/battleLogic.js";
import { normalizeBattleMove, normalizeTypeNames } from "../src/utils/pokemonData.js";

const attacker = {
  types: [{ type: { name: "fire" } }],
  stats: [
    { stat: { name: "attack" }, base_stat: 80 },
    { stat: { name: "defense" }, base_stat: 70 },
    { stat: { name: "special-attack" }, base_stat: 100 },
    { stat: { name: "special-defense" }, base_stat: 75 },
    { stat: { name: "hp" }, base_stat: 70 },
  ],
};

const defender = {
  types: ["grass"],
  stats: [
    { stat: { name: "attack" }, base_stat: 70 },
    { stat: { name: "defense" }, base_stat: 70 },
    { stat: { name: "special-attack" }, base_stat: 70 },
    { stat: { name: "special-defense" }, base_stat: 70 },
    { stat: { name: "hp" }, base_stat: 70 },
  ],
};

test("normalizes type shapes", () => {
  assert.deepEqual(normalizeTypeNames(["fire", { name: "water" }, { type: { name: "grass" } }]), ["fire", "water", "grass"]);
});

test("normalizes PokeAPI move details into battle moves", () => {
  const move = normalizeBattleMove({
    name: "flamethrower",
    type: { name: "fire" },
    power: 90,
    accuracy: 100,
    pp: 15,
    damage_class: { name: "special" },
  });

  assert.equal(move.name, "flamethrower");
  assert.equal(move.label, "Flamethrower");
  assert.equal(move.type, "fire");
  assert.equal(move.power, 90);
  assert.equal(move.category, "special");
});

test("calculates type effectiveness from string and object defender types", () => {
  assert.equal(calculateTypeEffectiveness("fire", ["grass"]), 2);
  assert.equal(calculateTypeEffectiveness({ name: "electric" }, [{ type: { name: "ground" } }]), 0);
});

test("critical hits increase damage", () => {
  const originalRandom = Math.random;
  try {
    Math.random = () => 0.5;
    const normal = calculateMoveDamage(attacker, defender, {
      name: "flamethrower",
      type: "fire",
      power: 90,
      accuracy: 100,
      category: "special",
    });

    Math.random = () => 0.01;
    const critical = calculateMoveDamage(attacker, defender, {
      name: "flamethrower",
      type: "fire",
      power: 90,
      accuracy: 100,
      category: "special",
    });

    assert.equal(critical.critical, true);
    assert.ok(critical.damage > normal.damage);
  } finally {
    Math.random = originalRandom;
  }
});

test("uses hydrated battle moves when available", () => {
  const moves = getBattleMoves({
    ...attacker,
    battleMoves: [{ name: "ember", type: "fire", power: 40, accuracy: 100, category: "special", pp: 25 }],
  });

  assert.deepEqual(moves.map((move) => move.name), ["ember"]);
});
