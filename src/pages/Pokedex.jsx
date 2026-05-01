import { useEffect, useMemo, useState } from "react";
import { Grid2X2, List, Search, RotateCcw, Scale } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Pagination } from "../components/Pagination";
import { PokedexSkeleton } from "../components/PokedexSkeleton";
import { PokemonCard } from "../components/PokemonCard";
import {
  fetchPokemon,
  fetchPokemonByType,
  fetchPokemonCount,
  fetchPokemonPage,
  fetchPokemonSummaries,
  fetchPokemonTypes,
  DEFAULT_TOTAL_COUNT,
  PAGE_SIZE,
} from "../api/pokeApi";
import { formatPokemonName } from "../utils/pokemonTypes";

export const Pokedex = () => {
  const [pokemonList, setPokemonList] = useState([]);
  const [types, setTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedGeneration, setSelectedGeneration] = useState("");
  const [abilityFilter, setAbilityFilter] = useState("");
  const [sortBy, setSortBy] = useState("id-asc");
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("pokedex:view") || "grid");
  const [compare, setCompare] = useState([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(DEFAULT_TOTAL_COUNT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const normalizedSearch = search.trim().toLowerCase();
  const normalizedAbility = abilityFilter.trim().toLowerCase();
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    let cancelled = false;
    fetchPokemonTypes()
      .then((data) => {
        if (!cancelled) setTypes(data);
      })
      .catch((err) => console.error("Error loading Pokémon types:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchPokemonCount()
      .then((count) => {
        if (!cancelled) setTotalCount(count);
      })
      .catch((err) => console.error("Error loading Pokémon count:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPokemon() {
      setLoading(true);
      setError("");
      try {
        if (normalizedSearch || selectedType || selectedGeneration || normalizedAbility || sortBy !== "id-asc") {
          const source = selectedType ? await fetchPokemonByType(selectedType) : await fetchPokemonSummaries();
          const generationFiltered = filterByGeneration(source, selectedGeneration);
          const filtered = generationFiltered.filter((pokemon) => pokemon.name.toLowerCase().includes(normalizedSearch));
          const sorted = sortPokemonSummaries(filtered, sortBy);
          const visible = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
          let results = await Promise.all(visible.map((pokemon) => fetchPokemon(pokemon.id || pokemon.name)));
          if (normalizedAbility) {
            results = results.filter((pokemon) =>
              pokemon.abilities?.some((ability) => ability.ability.name.includes(normalizedAbility))
            );
          }
          if (!cancelled) {
            setPokemonList(sortPokemonDetails(results, sortBy));
            setTotalCount(normalizedAbility ? results.length : filtered.length);
          }
          return;
        }

        const offset = (page - 1) * PAGE_SIZE;
        const response = await fetchPokemonPage({ limit: PAGE_SIZE, offset });
        if (!cancelled) {
          setPokemonList(sortPokemonDetails(response.results, sortBy));
          setTotalCount(response.count);
        }
      } catch (err) {
        console.error("Error fetching Pokémon data:", err);
        if (!cancelled) {
          setPokemonList([]);
          setTotalCount(0);
          setError("Could not load Pokémon data. Check your connection and try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPokemon();
    return () => {
      cancelled = true;
    };
  }, [normalizedSearch, normalizedAbility, page, selectedGeneration, selectedType, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [normalizedSearch, normalizedAbility, selectedGeneration, selectedType, sortBy]);

  useEffect(() => {
    localStorage.setItem("pokedex:view", viewMode);
  }, [viewMode]);

  const resultRange = useMemo(() => {
    if (!totalCount || !pokemonList.length) return "0";
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(start + pokemonList.length - 1, totalCount);
    return `${start}-${end}`;
  }, [page, pokemonList.length, totalCount]);

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || loading) return;
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedType("");
    setSelectedGeneration("");
    setAbilityFilter("");
    setSortBy("id-asc");
    setPage(1);
  };

  const toggleCompare = (pokemon) => {
    setCompare((current) => {
      if (current.some((item) => item.id === pokemon.id)) return current.filter((item) => item.id !== pokemon.id);
      return current.length < 4 ? [...current, pokemon] : current;
    });
  };

  return (
    <div className="min-h-screen bg-base-100">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="game-panel-blue mb-6 p-4 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-blue-800">Professor Oak's index</p>
              <h1 className="pokemon-title text-4xl text-yellow-300 sm:text-5xl">Pokédex</h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-800">
                Browse every Pokémon from PokeAPI with cached page loading, type filters, and quick detail cards.
              </p>
            </div>
            <div className="stats stats-horizontal overflow-hidden border-2 border-blue-900 bg-white shadow">
              <div className="stat px-4 py-3 text-slate-900">
                <div className="stat-title text-xs font-black text-slate-600">Showing</div>
                <div className="stat-value text-lg text-blue-900">{resultRange}</div>
              </div>
              <div className="stat px-4 py-3 text-slate-900">
                <div className="stat-title text-xs font-black text-slate-600">Total</div>
                <div className="stat-value text-lg text-blue-900">{totalCount}</div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_160px_160px_170px_190px_auto]">
            <label className="input input-bordered flex items-center gap-2 border-2 border-blue-900 bg-white">
              <Search className="size-4 text-blue-900" />
              <input
                type="search"
                className="grow"
                placeholder="Search Pokémon name"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <select
              className="select select-bordered border-2 border-blue-900 bg-white capitalize"
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value)}
              disabled={loading}
            >
              <option value="">All types</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              className="select select-bordered border-2 border-blue-900 bg-white"
              value={selectedGeneration}
              onChange={(event) => setSelectedGeneration(event.target.value)}
              disabled={loading}
            >
              <option value="">All generations</option>
              {generationRanges.map((generation) => (
                <option key={generation.value} value={generation.value}>{generation.label}</option>
              ))}
            </select>

            <input
              className="input input-bordered border-2 border-blue-900 bg-white"
              placeholder="Ability"
              value={abilityFilter}
              onChange={(event) => setAbilityFilter(event.target.value)}
            />

            <select
              className="select select-bordered border-2 border-blue-900 bg-white"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              disabled={loading}
            >
              <option value="id-asc">Number: low to high</option>
              <option value="id-desc">Number: high to low</option>
              <option value="name-asc">Name: A-Z</option>
              <option value="name-desc">Name: Z-A</option>
              <option value="hp-desc">HP: high to low</option>
              <option value="attack-desc">Attack: high to low</option>
              <option value="defense-desc">Defense: high to low</option>
              <option value="speed-desc">Speed: high to low</option>
            </select>

            <button className="btn btn-outline" onClick={resetFilters} disabled={loading && !search && !selectedType}>
              <RotateCcw className="size-4" />
              Reset
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="join">
              <button className={`btn join-item btn-sm ${viewMode === "grid" ? "btn-primary" : "btn-outline"}`} onClick={() => setViewMode("grid")}><Grid2X2 className="size-4" /> Grid</button>
              <button className={`btn join-item btn-sm ${viewMode === "list" ? "btn-primary" : "btn-outline"}`} onClick={() => setViewMode("list")}><List className="size-4" /> List</button>
            </div>
            {compare.length > 0 && <button className="btn btn-outline btn-sm" onClick={() => setCompare([])}>Clear compare</button>}
          </div>
        </section>

        {error && <div className="alert alert-error mb-5">{error}</div>}

        {loading ? (
          <PokedexSkeleton />
        ) : pokemonList.length === 0 ? (
          <div className="game-panel p-10 text-center">
            <h2 className="text-2xl font-bold">No Pokémon found</h2>
            <p className="mt-2 text-base-content/70">Try a different name or clear your filters.</p>
            <button className="btn btn-primary mt-4" onClick={resetFilters}>
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className={`${viewMode === "grid" ? "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid grid-cols-1 gap-3"} transition-opacity duration-200 ${loading ? "opacity-60" : "opacity-100"}`}>
              {pokemonList.map((pokemon) => (
                <PokemonCard
                  key={pokemon.id}
                  pokemon={pokemon}
                  compact={viewMode === "list"}
                  compareSelected={compare.some((item) => item.id === pokemon.id)}
                  onCompare={() => toggleCompare(pokemon)}
                />
              ))}
            </div>
            {compare.length >= 2 && <ComparePanel pokemon={compare} />}

            {!normalizedSearch && (
              <div className="game-panel mt-8 p-4">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  disabled={loading}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

function sortPokemonSummaries(list, sortBy) {
  return [...list].sort((a, b) => {
    if (sortBy === "id-desc") return b.id - a.id;
    if (sortBy === "name-asc") return a.name.localeCompare(b.name);
    if (sortBy === "name-desc") return b.name.localeCompare(a.name);
    return a.id - b.id;
  });
}

function sortPokemonDetails(list, sortBy) {
  return [...list].sort((a, b) => {
    if (sortBy === "id-desc") return b.id - a.id;
    if (sortBy === "name-asc") return formatPokemonName(a.name).localeCompare(formatPokemonName(b.name));
    if (sortBy === "name-desc") return formatPokemonName(b.name).localeCompare(formatPokemonName(a.name));
    if (sortBy.endsWith("-desc")) {
      const stat = sortBy.replace("-desc", "");
      return getStatValue(b, stat) - getStatValue(a, stat);
    }
    return a.id - b.id;
  });
}

const generationRanges = [
  { value: "1", label: "Gen I", min: 1, max: 151 },
  { value: "2", label: "Gen II", min: 152, max: 251 },
  { value: "3", label: "Gen III", min: 252, max: 386 },
  { value: "4", label: "Gen IV", min: 387, max: 493 },
  { value: "5", label: "Gen V", min: 494, max: 649 },
  { value: "6", label: "Gen VI", min: 650, max: 721 },
  { value: "7", label: "Gen VII", min: 722, max: 809 },
  { value: "8", label: "Gen VIII", min: 810, max: 905 },
  { value: "9", label: "Gen IX", min: 906, max: 1025 },
];

function filterByGeneration(list, selectedGeneration) {
  const generation = generationRanges.find((item) => item.value === selectedGeneration);
  if (!generation) return list;
  return list.filter((pokemon) => pokemon.id >= generation.min && pokemon.id <= generation.max);
}

function getStatValue(pokemon, statName) {
  return pokemon.stats?.find((stat) => stat.stat.name === statName)?.base_stat || 0;
}

function ComparePanel({ pokemon }) {
  const stats = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
  return (
    <section className="game-panel mt-6 overflow-x-auto p-4">
      <h2 className="mb-3 flex items-center gap-2 text-xl font-black text-blue-950"><Scale className="size-5" /> Compare</h2>
      <table className="table table-zebra min-w-[620px]">
        <thead>
          <tr>
            <th>Stat</th>
            {pokemon.map((item) => <th key={item.id}>{formatPokemonName(item.name)}</th>)}
          </tr>
        </thead>
        <tbody>
          {stats.map((stat) => (
            <tr key={stat}>
              <td className="font-black capitalize">{stat}</td>
              {pokemon.map((item) => <td key={`${item.id}-${stat}`}>{getStatValue(item, stat)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
