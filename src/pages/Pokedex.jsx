import { useEffect, useMemo, useState } from "react";
import { Search, RotateCcw } from "lucide-react";
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
  const [sortBy, setSortBy] = useState("id-asc");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(DEFAULT_TOTAL_COUNT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const normalizedSearch = search.trim().toLowerCase();
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    let cancelled = false;
    fetchPokemonTypes()
      .then((data) => {
        if (!cancelled) setTypes(data);
      })
      .catch((err) => console.error("Error loading Pokemon types:", err));
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
      .catch((err) => console.error("Error loading Pokemon count:", err));
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
        if (normalizedSearch || selectedType || sortBy !== "id-asc") {
          const source = selectedType ? await fetchPokemonByType(selectedType) : await fetchPokemonSummaries();
          const filtered = source.filter((pokemon) =>
            pokemon.name.toLowerCase().includes(normalizedSearch)
          );
          const sorted = sortPokemonSummaries(filtered, sortBy);
          const visible = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
          const results = await Promise.all(visible.map((pokemon) => fetchPokemon(pokemon.id || pokemon.name)));
          if (!cancelled) {
            setPokemonList(sortPokemonDetails(results, sortBy));
            setTotalCount(filtered.length);
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
        console.error("Error fetching Pokemon data:", err);
        if (!cancelled) {
          setPokemonList([]);
          setTotalCount(0);
          setError("Could not load Pokemon data. Check your connection and try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPokemon();
    return () => {
      cancelled = true;
    };
  }, [normalizedSearch, page, selectedType, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [normalizedSearch, selectedType, sortBy]);

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
    setSortBy("id-asc");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-base-100">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="game-panel-blue mb-6 p-4 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-blue-800">Professor Oak's index</p>
              <h1 className="pokemon-title text-4xl text-yellow-300 sm:text-5xl">Pokedex</h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-800">
                Browse every Pokemon from PokeAPI with cached page loading, type filters, and quick detail cards.
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

          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px_190px_auto]">
            <label className="input input-bordered flex items-center gap-2 border-2 border-blue-900 bg-white">
              <Search className="size-4 text-blue-900" />
              <input
                type="search"
                className="grow"
                placeholder="Search Pokemon name"
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
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              disabled={loading}
            >
              <option value="id-asc">Number: low to high</option>
              <option value="id-desc">Number: high to low</option>
              <option value="name-asc">Name: A-Z</option>
              <option value="name-desc">Name: Z-A</option>
            </select>

            <button className="btn btn-outline" onClick={resetFilters} disabled={loading && !search && !selectedType}>
              <RotateCcw className="size-4" />
              Reset
            </button>
          </div>
        </section>

        {error && <div className="alert alert-error mb-5">{error}</div>}

        {loading ? (
          <PokedexSkeleton />
        ) : pokemonList.length === 0 ? (
          <div className="game-panel p-10 text-center">
            <h2 className="text-2xl font-bold">No Pokemon found</h2>
            <p className="mt-2 text-base-content/70">Try a different name or clear your filters.</p>
            <button className="btn btn-primary mt-4" onClick={resetFilters}>
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className={`grid grid-cols-1 gap-5 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${loading ? "opacity-60" : "opacity-100"}`}>
              {pokemonList.map((pokemon) => (
                <PokemonCard key={pokemon.id} pokemon={pokemon} />
              ))}
            </div>

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
    return a.id - b.id;
  });
}
