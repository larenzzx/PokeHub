import axios from "axios";
import { getPokemonIdFromUrl } from "../utils/pokemonTypes";

const api = axios.create({
  baseURL: "https://pokeapi.co/api/v2",
  timeout: 12000,
});

const pokemonCache = new Map();
const listCache = new Map();
const typeCache = new Map();
let typesPromise;
let summariesPromise;

export const PAGE_SIZE = 12;
export const DEFAULT_TOTAL_COUNT = 1302;

export const getPokemonSprite = (pokemon) =>
  pokemon?.sprites?.other?.["official-artwork"]?.front_default ||
  pokemon?.sprites?.other?.dream_world?.front_default ||
  pokemon?.sprites?.front_default ||
  "";

export const simplifyPokemon = (pokemon) => ({
  id: pokemon.id,
  name: pokemon.name,
  height: pokemon.height,
  weight: pokemon.weight,
  stats: pokemon.stats,
  moves: pokemon.moves,
  sprites: pokemon.sprites,
  types: pokemon.types,
  abilities: pokemon.abilities,
  sprite: getPokemonSprite(pokemon),
});

export async function fetchPokemon(identifier) {
  const key = String(identifier).toLowerCase();
  if (pokemonCache.has(key)) return pokemonCache.get(key);

  const promise = api
    .get(`/pokemon/${key}`)
    .then((response) => {
      const simplified = simplifyPokemon(response.data);
      pokemonCache.set(String(simplified.id), Promise.resolve(simplified));
      pokemonCache.set(simplified.name, Promise.resolve(simplified));
      return simplified;
    })
    .catch((error) => {
      pokemonCache.delete(key);
      throw error;
    });

  pokemonCache.set(key, promise);
  return promise;
}

export async function fetchPokemonPage({ limit = PAGE_SIZE, offset = 0 }) {
  const key = `${limit}:${offset}`;
  if (listCache.has(key)) return listCache.get(key);

  const promise = api
    .get(`/pokemon?limit=${limit}&offset=${offset}`)
    .then(async (response) => {
      const details = await Promise.all(
        response.data.results.map((item) =>
          fetchPokemon(getPokemonIdFromUrl(item.url) || item.name)
        )
      );

      return {
        count: response.data.count,
        results: details,
      };
    })
    .catch((error) => {
      listCache.delete(key);
      throw error;
    });

  listCache.set(key, promise);
  return promise;
}

export async function fetchPokemonCount() {
  const response = await api.get("/pokemon?limit=1&offset=0");
  return response.data.count;
}

export async function fetchPokemonTypes() {
  if (!typesPromise) {
    typesPromise = api.get("/type").then((response) =>
      response.data.results
        .map((type) => type.name)
        .filter((name) => !["unknown", "shadow"].includes(name))
    );
  }
  return typesPromise;
}

export async function fetchPokemonSummaries() {
  if (!summariesPromise) {
    summariesPromise = api.get("/pokemon?limit=1&offset=0").then((countResponse) =>
      api.get(`/pokemon?limit=${countResponse.data.count}&offset=0`).then((response) =>
        response.data.results.map((pokemon) => ({
          name: pokemon.name,
          id: getPokemonIdFromUrl(pokemon.url),
        }))
      )
    );
  }
  return summariesPromise;
}

export async function fetchPokemonByType(typeName) {
  if (!typeName) return [];
  if (typeCache.has(typeName)) return typeCache.get(typeName);

  const promise = api
    .get(`/type/${typeName}`)
    .then((response) =>
      response.data.pokemon
        .map(({ pokemon }) => ({
          name: pokemon.name,
          id: getPokemonIdFromUrl(pokemon.url),
        }))
        .filter((pokemon) => pokemon.id)
        .sort((a, b) => a.id - b.id)
    )
    .catch((error) => {
      typeCache.delete(typeName);
      throw error;
    });

  typeCache.set(typeName, promise);
  return promise;
}

export async function fetchWeaknesses(types) {
  const typeNames = types.map((type) => type.type?.name || type.name);
  const responses = await Promise.all(
    typeNames.map((type) => api.get(`/type/${type}`))
  );

  const score = {};
  for (const response of responses) {
    for (const type of response.data.damage_relations.double_damage_from) {
      score[type.name] = (score[type.name] || 0) + 1;
    }
    for (const type of response.data.damage_relations.half_damage_from) {
      score[type.name] = (score[type.name] || 0) - 1;
    }
    for (const type of response.data.damage_relations.no_damage_from) {
      score[type.name] = -10;
    }
  }

  return Object.keys(score).filter((type) => score[type] > 0);
}

export function getCachedPokemon(identifier) {
  return pokemonCache.get(String(identifier).toLowerCase());
}
