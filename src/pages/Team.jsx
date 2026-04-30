import { useEffect, useState } from "react";
import { AlertCircle, Inbox, Trash2 } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { TypeBadge } from "../components/TypeBadge";
import { fetchPokemon, getPokemonSprite } from "../api/pokeApi";
import { fetchTeam, removeTeamMember } from "../api/localApi";
import { formatPokemonName, typeSoftColors } from "../utils/pokemonTypes";

export const Team = () => {
  const [team, setTeam] = useState([]);
  const [details, setDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState("");

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
      setTeam(members);
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

  const confirmRemove = async () => {
    if (!selected) return;
    try {
      await removeTeamMember(selected.id);
      setTeam((current) => current.filter((member) => member.id !== selected.id));
      setToast(`${formatPokemonName(selected.name)} was removed from your team.`);
    } catch (error) {
      console.error("Error removing Pokemon:", error);
      setToast("Could not remove Pokemon. Start the local server and try again.");
    } finally {
      setSelected(null);
    }
  };

  return (
    <div className="min-h-screen bg-base-100">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="game-panel-blue mb-6 p-5">
          <p className="text-sm font-black uppercase text-blue-800">Party roster</p>
          <h1 className="pokemon-title text-4xl text-yellow-300 sm:text-5xl">My Pokemon Team</h1>
          <p className="mt-2 text-sm font-semibold text-slate-800">Build a balanced team of up to six Pokemon from the Pokedex.</p>
        </section>

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
            <p className="mt-2 font-semibold text-slate-700">Visit the Pokedex and add Pokemon to prepare for battle.</p>
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
                />
              );
            })}
          </div>
        )}
      </main>

      {selected && (
        <dialog className="modal modal-open">
          <div className="modal-box rounded-lg">
            <h3 className="text-xl font-bold text-error">Remove Pokemon</h3>
            <p className="py-4">Remove {formatPokemonName(selected.name)} from your team?</p>
            <div className="modal-action">
              <button className="btn btn-outline" onClick={() => setSelected(null)}>
                Cancel
              </button>
              <button className="btn btn-error text-white" onClick={confirmRemove}>
                Remove
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
};

function TeamCard({ member, pokemon, onRemove }) {
  const primaryType = pokemon.types[0]?.type.name || "normal";
  const hp = pokemon.stats.find((stat) => stat.stat.name === "hp")?.base_stat || 0;

  return (
    <article className="overflow-hidden rounded-lg border-4 border-slate-900 bg-white text-slate-950 shadow-[0_4px_0_#94a3b8] transition duration-200 hover:-translate-y-1 hover:shadow-[0_8px_0_#64748b]">
      <div className={`${typeSoftColors[primaryType] || "bg-base-200"} border-b-4 border-slate-900 p-5`}>
        <img src={getPokemonSprite(pokemon) || member.image} alt={pokemon.name} className="mx-auto h-44 object-contain drop-shadow-lg" />
      </div>
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black text-blue-900">#{String(pokemon.id).padStart(3, "0")}</p>
            <h2 className="text-2xl font-black text-slate-950">{formatPokemonName(pokemon.name)}</h2>
          </div>
          <button className="btn btn-error btn-sm text-white" onClick={onRemove} aria-label={`Remove ${pokemon.name}`}>
            <Trash2 className="size-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {pokemon.types.map((type) => <TypeBadge key={type.type.name} type={type} />)}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-sm font-bold">
          <div className="rounded-md border-2 border-slate-200 bg-slate-50 p-2">HP<br />{hp}</div>
          <div className="rounded-md border-2 border-slate-200 bg-slate-50 p-2">ATK<br />{getStatValue(pokemon, "attack")}</div>
          <div className="rounded-md border-2 border-slate-200 bg-slate-50 p-2">SPD<br />{getStatValue(pokemon, "speed")}</div>
        </div>
      </div>
    </article>
  );
}

function getStatValue(pokemon, statName) {
  return pokemon.stats.find((stat) => stat.stat.name === statName)?.base_stat || 0;
}
