import { useEffect, useState } from "react";
import { AlertCircle, GripVertical, Inbox, Trash2, X } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { TypeBadge } from "../components/TypeBadge";
import { fetchPokemon, fetchWeaknesses, getPokemonSprite } from "../api/pokeApi";
import { fetchTeam, removeTeamMember, saveTeamOrder } from "../api/localApi";
import { formatPokemonName, typeSoftColors } from "../utils/pokemonTypes";
import { StatBar } from "../components/ui";

export const Team = () => {
  const [team, setTeam] = useState([]);
  const [details, setDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState("");
  const [draggedId, setDraggedId] = useState(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    loadTeam();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadTeam = async () => {
    setLoading(true);
    try {
      const members = await fetchTeam();
      setTeam([...members].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      const entries = await Promise.all(
        members.map(async (member) => [member.name, await fetchPokemon(member.name)])
      );
      setDetails(Object.fromEntries(entries));
    } catch (error) {
      console.error("Error fetching team:", error);
    } finally {
      setLoading(false);
    }
  };

  const reorderTeam = async (targetId) => {
    if (!draggedId || draggedId === targetId) return;
    const current = [...team];
    const from = current.findIndex((member) => member.id === draggedId);
    const to = current.findIndex((member) => member.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = current.splice(from, 1);
    current.splice(to, 0, moved);
    const ordered = current.map((member, order) => ({ ...member, order }));
    setTeam(ordered);
    await saveTeamOrder(ordered);
    setToast("Team order updated.");
  };

  const confirmRemove = async () => {
    if (!selected) return;
    setRemoving(true);
    try {
      await removeTeamMember(selected.id);
      setTeam((current) => current.filter((member) => member.id !== selected.id));
      setToast(`${formatPokemonName(selected.name)} was removed from your team.`);
    } catch (error) {
      console.error("Error removing Pokémon:", error);
      setToast("Could not remove Pokémon on the server. Local team data was updated.");
    } finally {
      setRemoving(false);
      setSelected(null);
    }
  };

  return (
    <div className="min-h-screen bg-base-100">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="game-panel-blue mb-6 p-5">
          <p className="text-sm font-black uppercase text-blue-800">Party roster</p>
          <h1 className="pokemon-title text-4xl text-yellow-300 sm:text-5xl">My Pokémon Team</h1>
          <p className="mt-2 text-sm font-semibold text-slate-800">Build a balanced team of up to six Pokémon from the Pokédex.</p>
        </section>

        {team.length > 0 && <TeamAnalysis details={details} team={team} />}

        {toast && (
          <div className="toast toast-top toast-end z-50">
            <div className="alert alert-info shadow-lg">
              <AlertCircle className="size-5" />
              <span>{toast}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="skeleton h-72 rounded-lg" />
            ))}
          </div>
        ) : team.length === 0 ? (
          <div className="game-panel mx-auto mt-12 max-w-md p-8 text-center">
            <Inbox className="mx-auto mb-4 size-16 text-blue-900" />
            <h2 className="text-2xl font-black text-blue-950">Your team is empty</h2>
            <p className="mt-2 font-semibold text-slate-700">Visit the Pokédex and add Pokémon to prepare for battle.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((member) => {
              const pokemon = details[member.name];
              if (!pokemon) return <div key={member.id} className="skeleton h-72 rounded-lg" />;
              return (
                <TeamCard
                  key={member.id}
                  member={member}
                  pokemon={pokemon}
                  onRemove={() => setSelected(member)}
                  onDragStart={() => setDraggedId(member.id)}
                  onDrop={() => reorderTeam(member.id)}
                />
              );
            })}
          </div>
        )}
      </main>

      {selected && (
        <dialog className="modal modal-open">
          <div className="modal-box rounded-lg">
            <h3 className="text-xl font-bold text-error">Remove Pokémon</h3>
            <p className="py-4">Remove {formatPokemonName(selected.name)} from your team?</p>
            <div className="modal-action">
              <button className="btn btn-outline" onClick={() => setSelected(null)} disabled={removing}>
                Cancel
              </button>
              <button className="btn btn-error text-white" onClick={confirmRemove} disabled={removing}>
                {removing && <span className="loading loading-spinner loading-sm" />}
                {removing ? "Removing" : "Remove"}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
};

function TeamCard({ member, pokemon, onRemove, onDragStart, onDrop }) {
  const [weaknesses, setWeaknesses] = useState([]);
  const [weaknessLoading, setWeaknessLoading] = useState(false);
  const primaryType = pokemon.types[0]?.type?.name || pokemon.types[0]?.name || pokemon.types[0] || "normal";
  const hp = pokemon.stats.find((stat) => stat.stat.name === "hp")?.base_stat || 0;
  const sprite = getPokemonSprite(pokemon) || member.image;
  const modalId = `team-pokemon-modal-${pokemon.id}`;

  const openDetails = async () => {
    document.getElementById(modalId)?.showModal();
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

  return (
    <>
    <article
      role="button"
      tabIndex={0}
      onClick={openDetails}
      onKeyDown={(event) => {
        if (event.key === "Enter") openDetails();
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      className="cursor-pointer overflow-hidden rounded-lg border-4 border-slate-900 bg-white text-left text-slate-950 shadow-[0_4px_0_#94a3b8] transition duration-200 hover:-translate-y-1 hover:shadow-[0_8px_0_#64748b]"
    >
      <div className={`${typeSoftColors[primaryType] || "bg-base-200"} border-b-4 border-slate-900 p-5`}>
        <img src={sprite} alt={pokemon.name} className="mx-auto h-44 object-contain drop-shadow-lg" />
      </div>
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black text-blue-900">#{String(pokemon.id).padStart(3, "0")}</p>
            <h2 className="break-words text-2xl font-black text-slate-950">{formatPokemonName(pokemon.name)}</h2>
          </div>
          <div className="flex gap-2">
            <span draggable onClick={(event) => event.stopPropagation()} onDragStart={onDragStart} className="cursor-grab rounded p-1 active:cursor-grabbing" title="Drag to reorder">
              <GripVertical className="size-5 text-slate-400" aria-label="Drag to reorder" />
            </span>
            <button
              type="button"
              className="btn btn-error btn-sm text-white"
              onClick={(event) => {
                event.stopPropagation();
                onRemove();
              }}
              aria-label={`Remove ${pokemon.name}`}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {pokemon.types.map((type) => <TypeBadge key={type.type?.name || type.name || type} type={type} />)}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-sm font-bold">
          <div className="rounded-md border-2 border-slate-200 bg-slate-50 p-2">HP<br />{hp}</div>
          <div className="rounded-md border-2 border-slate-200 bg-slate-50 p-2">ATK<br />{getStatValue(pokemon, "attack")}</div>
          <div className="rounded-md border-2 border-slate-200 bg-slate-50 p-2">SPD<br />{getStatValue(pokemon, "speed")}</div>
        </div>
      </div>
    </article>
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
                {pokemon.types.map((type) => <TypeBadge key={type.type?.name || type.name || type} type={type} size="lg" />)}
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
            <p className="mb-2 text-sm font-black text-slate-700">Weak to</p>
            <div className="mb-4 flex min-h-8 flex-wrap gap-2">
              {weaknessLoading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : weaknesses.length ? (
                weaknesses.map((type) => <TypeBadge key={type} type={type} />)
              ) : (
                <span className="text-sm font-semibold text-slate-600">No major weaknesses found.</span>
              )}
            </div>
            <p className="mb-2 text-sm font-black text-slate-700">Sample moves</p>
            <div className="flex flex-wrap gap-2">
              {pokemon.moves.slice(0, 4).map((move) => (
                <span key={move.move?.name || move.name} className="badge badge-outline capitalize">
                  {(move.move?.name || move.name).replaceAll("-", " ")}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
    </>
  );
}

function TeamAnalysis({ details, team }) {
  const pokemon = team.map((member) => details[member.name]).filter(Boolean);
  const typeCounts = pokemon.flatMap((item) => item.types.map((type) => type.type?.name || type.name || type));
  const duplicates = [...new Set(typeCounts.filter((type, index) => typeCounts.indexOf(type) !== index))];
  const speedAverage = pokemon.length
    ? Math.round(pokemon.reduce((total, item) => total + getStatValue(item, "speed"), 0) / pokemon.length)
    : 0;
  const totalBaseStats = pokemon.reduce((total, item) => total + item.stats.reduce((sum, stat) => sum + stat.base_stat, 0), 0);

  return (
    <section className="game-panel mb-6 grid gap-3 p-4 md:grid-cols-3">
      <div>
        <p className="text-xs font-black uppercase text-blue-800">Team analysis</p>
        <p className="text-2xl font-black text-blue-950">{team.length}/6 slots</p>
      </div>
      <div className="font-bold text-slate-700">
        <p>Average speed: <span className="text-blue-950">{speedAverage}</span></p>
        <p>Total base stats: <span className="text-blue-950">{totalBaseStats}</span></p>
      </div>
      <div>
        <p className="mb-1 text-sm font-black text-slate-700">Duplicate types</p>
        <div className="flex flex-wrap gap-1">
          {duplicates.length ? duplicates.map((type) => <TypeBadge key={type} type={type} />) : <span className="text-sm font-semibold text-slate-600">None</span>}
        </div>
      </div>
    </section>
  );
}

function getStatValue(pokemon, statName) {
  return pokemon.stats.find((stat) => stat.stat.name === statName)?.base_stat || 0;
}
