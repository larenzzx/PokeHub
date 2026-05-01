import { useEffect, useState } from "react";
import { AlertCircle, Check, Heart, Plus, X } from "lucide-react";
import { addTeamMember, fetchTeam } from "../api/localApi";
import { fetchPokemon, fetchWeaknesses, getPokemonSprite } from "../api/pokeApi";
import { formatPokemonName, typeColors, typeSoftColors } from "../utils/pokemonTypes";
import { TypeBadge } from "./TypeBadge";
import { StatBar } from "./ui";

export function PokemonCard({ pokemon: initialPokemon, identifier, onTeamChange, compact = false, compareSelected = false, onCompare }) {
  const [pokemon, setPokemon] = useState(initialPokemon || null);
  const [weaknesses, setWeaknesses] = useState([]);
  const [weaknessLoading, setWeaknessLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (initialPokemon) {
      setPokemon(initialPokemon);
      return;
    }
    if (!identifier) return;

    fetchPokemon(identifier)
      .then((data) => {
        if (!cancelled) setPokemon(data);
      })
      .catch((error) => console.error("Error loading Pokémon card:", error));

    return () => {
      cancelled = true;
    };
  }, [identifier, initialPokemon]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!pokemon) {
    return <div className="skeleton h-80 w-full rounded-lg" />;
  }

  const primaryType = pokemon.types[0]?.type.name || "normal";
  const hp = pokemon.stats.find((stat) => stat.stat.name === "hp")?.base_stat || 0;
  const sprite = getPokemonSprite(pokemon);
  const modalId = `pokemon-modal-${pokemon.id}`;
  const confirmId = `pokemon-confirm-${pokemon.id}`;

  const loadWeaknesses = async () => {
    if (weaknesses.length || weaknessLoading) return;
    setWeaknessLoading(true);
    try {
      setWeaknesses(await fetchWeaknesses(pokemon.types));
    } catch (error) {
      console.error("Error fetching weaknesses:", error);
    } finally {
      setWeaknessLoading(false);
    }
  };

  const openDetails = () => {
    loadWeaknesses();
    document.getElementById(modalId)?.showModal();
  };

  const handleAddToTeam = async () => {
    document.getElementById(confirmId)?.close();
    document.getElementById(modalId)?.close();

    try {
      const team = await fetchTeam();
      if (team.some((member) => member.name === pokemon.name)) {
        setToast({ type: "warning", message: `${formatPokemonName(pokemon.name)} is already in your team.` });
        return;
      }
      if (team.length >= 6) {
        setToast({ type: "error", message: "Your team is full. Remove a Pokémon first." });
        return;
      }

      await addTeamMember({
        name: pokemon.name,
        image: sprite,
        stats: pokemon.stats.map((stat) => ({
          name: stat.stat.name,
          base: stat.base_stat,
        })),
      });
      setToast({ type: "success", message: `${formatPokemonName(pokemon.name)} joined your team.` });
      onTeamChange?.();
    } catch (error) {
      console.error("Error adding Pokémon to team:", error);
      setToast({ type: "error", message: "Could not add Pokémon. It will save locally if the server is offline." });
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openDetails}
        className={`card group w-full cursor-pointer overflow-hidden rounded-lg border-4 border-slate-900 bg-white text-left shadow-[0_4px_0_#94a3b8] transition duration-200 hover:-translate-y-1 hover:shadow-[0_8px_0_#64748b] ${compact ? "sm:grid sm:grid-cols-[190px_1fr]" : ""}`}
      >
        <figure className={`relative ${compact ? "h-full min-h-36 border-b-4 sm:border-b-0 sm:border-r-4" : "h-40 border-b-4"} border-slate-900 ${typeSoftColors[primaryType] || "bg-base-200"}`}>
          <div className={`absolute inset-x-0 top-0 h-2 ${typeColors[primaryType] || "bg-gray-400"}`} />
          <span className="absolute left-3 top-4 rounded-md border-2 border-slate-900 bg-white px-2 py-1 text-xs font-black text-blue-950">
            #{String(pokemon.id).padStart(3, "0")}
          </span>
          <img
            src={sprite}
            alt={pokemon.name}
            loading="lazy"
            className="h-32 w-full object-contain p-4 drop-shadow-lg transition duration-200 group-hover:scale-110"
          />
        </figure>
        <div className="card-body gap-3 bg-white p-4 text-slate-950">
          <div className="flex items-start justify-between gap-2">
            <h2 className="card-title text-lg font-black leading-tight text-slate-950">
              {formatPokemonName(pokemon.name)}
            </h2>
            <div className="flex items-center gap-1 rounded-md border-2 border-slate-900 bg-yellow-200 px-2 py-1 text-sm font-black text-slate-950">
              <Heart className="size-4 text-error" />
              {hp}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {pokemon.types.map((type) => (
              <TypeBadge key={type.type?.name || type.name || type} type={type} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-black text-slate-700">
            {["attack", "defense", "speed"].map((statName) => {
              const value = pokemon.stats.find((stat) => stat.stat.name === statName)?.base_stat || 0;
              return (
                <div key={statName} className="rounded-md border-2 border-slate-200 bg-slate-50 p-2">
                  <span className="block uppercase">{statName.slice(0, 3)}</span>
                  <span className="text-base text-blue-950">{value}</span>
                </div>
              );
            })}
          </div>
          {onCompare && (
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                onCompare();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.stopPropagation();
                  onCompare();
                }
              }}
              className={`btn btn-sm ${compareSelected ? "btn-primary" : "btn-outline"} w-full`}
            >
              {compareSelected ? "Selected for compare" : "Compare"}
            </span>
          )}
        </div>
      </button>

      <dialog id={modalId} className="modal">
        <div className="modal-box max-h-[90dvh] w-[94vw] max-w-4xl overflow-y-auto overscroll-contain rounded-lg border-4 border-slate-900 bg-white p-0 text-slate-950">
          <div className={`${typeSoftColors[primaryType] || "bg-base-200"} relative border-b-4 border-slate-900`}>
            <form method="dialog">
              <button className="btn btn-circle btn-ghost btn-sm absolute right-4 top-4 z-20 bg-white/70 shadow" aria-label="Close">
                <X className="size-4" />
              </button>
            </form>
            <div className="grid gap-4 p-6 md:grid-cols-[240px_1fr]">
              <img src={sprite} alt={pokemon.name} className="h-56 w-full object-contain drop-shadow-xl" />
              <div className="self-center">
                <p className="text-sm font-black text-blue-900">#{String(pokemon.id).padStart(3, "0")}</p>
                <h3 className="break-words text-3xl font-black leading-tight sm:text-4xl">{formatPokemonName(pokemon.name)}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {pokemon.types.map((type) => (
                    <TypeBadge key={type.type?.name || type.name || type} type={type} size="lg" />
                  ))}
                </div>
                <div className="mt-4 grid max-w-md grid-cols-2 gap-3 text-sm font-semibold">
                  <div className="rounded-md border-2 border-slate-900 bg-white p-3">Height: {(pokemon.height / 10).toFixed(1)} m</div>
                  <div className="rounded-md border-2 border-slate-900 bg-white p-3">Weight: {(pokemon.weight / 10).toFixed(1)} kg</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            <section className="rounded-lg border-2 border-slate-900 bg-slate-50 p-4">
              <h4 className="mb-3 text-lg font-bold">Base Stats</h4>
              <div className="space-y-3">
                {pokemon.stats.map((stat) => <StatBar key={stat.stat.name} label={stat.stat.name} value={stat.base_stat} />)}
              </div>
            </section>
            <section className="rounded-lg border-2 border-slate-900 bg-slate-50 p-4">
              <h4 className="mb-3 text-lg font-bold">Battle Notes</h4>
              <div className="mb-4">
                <p className="mb-2 text-sm font-black text-slate-700">Weak to</p>
                <div className="flex min-h-8 flex-wrap gap-2">
                  {weaknessLoading ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : weaknesses.length ? (
                    weaknesses.map((type) => <TypeBadge key={type} type={type} />)
                  ) : (
                    <span className="text-sm font-semibold text-slate-600">No major weaknesses found.</span>
                  )}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-black text-slate-700">Sample moves</p>
                <div className="flex flex-wrap gap-2">
                  {pokemon.moves.slice(0, 4).map((move) => (
                    <span key={move.move.name} className="badge badge-outline capitalize">
                      {(move.move?.name || move.name).replaceAll("-", " ")}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => document.getElementById(confirmId)?.showModal()}
                className="btn btn-primary mt-5 w-full"
              >
                <Plus className="size-4" />
                Add to Team
              </button>
            </section>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      <dialog id={confirmId} className="modal">
        <div className="modal-box max-h-[92dvh] overflow-y-auto rounded-lg">
          <h3 className="text-xl font-bold">Add to team?</h3>
          <p className="py-3">Add {formatPokemonName(pokemon.name)} to your six Pokémon team.</p>
          <div className="modal-action">
            <form method="dialog" className="flex w-full gap-2">
              <button className="btn btn-outline flex-1">Cancel</button>
              <button type="button" onClick={handleAddToTeam} className="btn btn-primary flex-1">
                Add
              </button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {toast && (
        <div className="toast toast-top toast-end z-50">
          <div className={`alert ${toast.type === "success" ? "alert-success" : toast.type === "warning" ? "alert-warning" : "alert-error"} shadow-lg`}>
            {toast.type === "success" ? <Check className="size-5" /> : <AlertCircle className="size-5" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </>
  );
}
