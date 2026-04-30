import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Shuffle, Swords, Volume2, VolumeX } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { TypeBadge } from "../components/TypeBadge";
import { fetchTeam, saveBattle } from "../api/localApi";
import { fetchPokemon, fetchPokemonSummaries, getPokemonSprite } from "../api/pokeApi";
import { calculateMoveDamage, getBattleMoves, getMaxHp, getStat } from "../utils/battleLogic";
import { formatPokemonName, typeSoftColors } from "../utils/pokemonTypes";
import { useBattleAudio } from "../hooks/useBattleAudio";

const emptyHp = { player: 0, enemy: 0 };

export const Battle = () => {
  const [team, setTeam] = useState([]);
  const [enemyOptions, setEnemyOptions] = useState([]);
  const [player, setPlayer] = useState(null);
  const [enemy, setEnemy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("activeTab") || "classic");
  const [statsResults, setStatsResults] = useState([]);
  const [statsWinner, setStatsWinner] = useState("");
  const [intro, setIntro] = useState(false);
  const [battleStarted, setBattleStarted] = useState(false);
  const [hp, setHp] = useState(emptyHp);
  const [turn, setTurn] = useState("player");
  const [messages, setMessages] = useState([]);
  const [winner, setWinner] = useState("");
  const [busy, setBusy] = useState(false);
  const [animation, setAnimation] = useState({ actor: "", target: "", effect: "" });
  const audio = useBattleAudio();

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      const [teamData, summaries] = await Promise.all([fetchTeam(), fetchPokemonSummaries()]);
      if (!cancelled) {
        setTeam(teamData);
        setEnemyOptions(summaries);
        setLoading(false);
      }
    }
    loadData().catch((error) => {
      console.error("Error loading battle data:", error);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  const playerMoves = useMemo(() => (player ? getBattleMoves(player) : []), [player]);
  const enemyMoves = useMemo(() => (enemy ? getBattleMoves(enemy) : []), [enemy]);

  const selectPokemon = async (value, setter) => {
    if (!value) {
      setter(null);
      return;
    }
    try {
      setter(await fetchPokemon(value));
      resetClassic(false);
    } catch (error) {
      console.error("Error selecting Pokemon:", error);
    }
  };

  const pickRandomEnemy = async () => {
    if (!enemyOptions.length) return;
    const random = enemyOptions[Math.floor(Math.random() * enemyOptions.length)];
    await selectPokemon(random.id, setEnemy);
  };

  const runStatsBattle = async () => {
    if (!player || !enemy) return;
    const rounds = ["hp", "attack", "defense", "speed"];
    let playerWins = 0;
    let enemyWins = 0;
    const results = rounds.map((stat, index) => {
      const playerValue = getStat(player, stat);
      const enemyValue = getStat(enemy, stat);
      const roundWinner = playerValue === enemyValue ? "Draw" : playerValue > enemyValue ? player.name : enemy.name;
      if (roundWinner === player.name) playerWins += 1;
      if (roundWinner === enemy.name) enemyWins += 1;
      return { round: index + 1, stat, playerValue, enemyValue, winner: roundWinner };
    });
    const result =
      playerWins === enemyWins
        ? "It's a Draw!"
        : playerWins > enemyWins
          ? `${formatPokemonName(player.name)}, You Win!`
          : `${formatPokemonName(enemy.name)}, You Lose!`;

    setStatsResults(results);
    setStatsWinner(result);
    await saveBattle({
      pokemon1: player.name,
      pokemon2: enemy.name,
      result,
      date: new Date().toISOString(),
      battleType: "stats",
    });
  };

  const startClassicBattle = () => {
    if (!player || !enemy || intro || battleStarted) return;
    audio.play("click");
    audio.play("start");
    setIntro(true);
    setMessages([`A wild ${formatPokemonName(enemy.name)} appeared!`]);
    window.setTimeout(() => {
      const playerStarts = getStat(player, "speed") >= getStat(enemy, "speed");
      setHp({ player: getMaxHp(player), enemy: getMaxHp(enemy) });
      setTurn(playerStarts ? "player" : "enemy");
      setBattleStarted(true);
      setIntro(false);
      setWinner("");
      setMessages((prev) => [
        ...prev,
        `${formatPokemonName(playerStarts ? player.name : enemy.name)} moves first.`,
      ]);
      audio.stop("main");
      audio.playLoop("battle");
      if (!playerStarts) {
        window.setTimeout(() => enemyTurn(getMaxHp(player), getMaxHp(enemy)), 700);
      }
    }, 1700);
  };

  const resetClassic = (clearPokemon = false) => {
    setBattleStarted(false);
    setIntro(false);
    setHp(emptyHp);
    setTurn("player");
    setMessages([]);
    setWinner("");
    setBusy(false);
    setAnimation({ actor: "", target: "", effect: "" });
    audio.stop("battle");
    if (clearPokemon) {
      setPlayer(null);
      setEnemy(null);
      setStatsResults([]);
      setStatsWinner("");
    }
  };

  const playerUseMove = async (move) => {
    if (!battleStarted || busy || turn !== "player" || winner) return;
    await resolveAttack({ attacker: player, defender: enemy, move, side: "player" });
  };

  const enemyTurn = async (currentPlayerHp = hp.player, currentEnemyHp = hp.enemy) => {
    if (!enemy || !player || winner) return;
    const move = enemyMoves[Math.floor(Math.random() * enemyMoves.length)];
    await resolveAttack({
      attacker: enemy,
      defender: player,
      move,
      side: "enemy",
      currentHp: { player: currentPlayerHp, enemy: currentEnemyHp },
    });
  };

  const resolveAttack = async ({ attacker, defender, move, side, currentHp = hp }) => {
    setBusy(true);
    setAnimation({ actor: side, target: side === "player" ? "enemy" : "player", effect: move.type });
    audio.play("attack");

    await delay(360);
    const result = calculateMoveDamage(attacker, defender, move);
    const nextHp = { ...currentHp };
    const targetSide = side === "player" ? "enemy" : "player";
    nextHp[targetSide] = Math.max(0, nextHp[targetSide] - result.damage);
    setHp(nextHp);

    const newMessages = [
      `${formatPokemonName(attacker.name)} used ${move.label}!`,
      result.missed
        ? "The attack missed!"
        : `${formatPokemonName(defender.name)} took ${result.damage} damage.${effectivenessText(result.effectiveness)}${result.critical ? " Critical hit!" : ""}`,
    ];
    setMessages((prev) => [...newMessages, ...prev].slice(0, 8));

    await delay(520);
    setAnimation({ actor: "", target: "", effect: "" });

    if (nextHp[targetSide] <= 0) {
      const resultText = side === "player"
        ? `${formatPokemonName(player.name)}, You Win!`
        : `${formatPokemonName(enemy.name)}, You Lose!`;
      setWinner(resultText);
      setMessages((prev) => [`${formatPokemonName(defender.name)} fainted!`, ...prev]);
      setBusy(false);
      audio.stop("battle");
      audio.play(side === "player" ? "win" : "lose");
      await saveBattle({
        pokemon1: player.name,
        pokemon2: enemy.name,
        result: resultText,
        date: new Date().toISOString(),
        battleType: "classic",
      });
      return;
    }

    if (side === "player") {
      setTurn("enemy");
      setBusy(false);
      window.setTimeout(() => enemyTurn(nextHp.player, nextHp.enemy), 650);
    } else {
      setTurn("player");
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="game-panel-blue mb-5 flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-blue-800">Battle center</p>
            <h1 className="pokemon-title text-4xl text-yellow-300 sm:text-5xl">Pokemon Battle</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-outline" onClick={audio.enableSound}>
              {audio.muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              {audio.muted ? "Enable sound" : "Sound on"}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={audio.volume}
              onChange={(event) => audio.setVolume(Number(event.target.value))}
              className="range range-primary w-28"
              aria-label="Volume"
            />
            <button className="btn btn-ghost" onClick={() => audio.setMuted(!audio.muted)}>
              {audio.muted ? "Unmute" : "Mute"}
            </button>
          </div>
        </section>

        <div className="tabs tabs-lift">
          <input
            type="radio"
            name="battle_tabs"
            className="tab"
            aria-label="Classic Battle"
            checked={activeTab === "classic"}
            onChange={() => setActiveTab("classic")}
          />
          <div className="tab-content rounded-b-lg border-base-300 bg-white/90 p-4 sm:p-6">
            {renderSelectors({ team, enemyOptions, player, enemy, selectPokemon, setPlayer, setEnemy, pickRandomEnemy })}
            <BattleArena
              player={player}
              enemy={enemy}
              hp={hp}
              intro={intro}
              started={battleStarted}
              winner={winner}
              turn={turn}
              busy={busy}
              animation={animation}
              moves={playerMoves}
              messages={messages}
              onStart={startClassicBattle}
              onMove={playerUseMove}
              onReset={() => resetClassic(false)}
            />
          </div>

          <input
            type="radio"
            name="battle_tabs"
            className="tab"
            aria-label="Stats Battle"
            checked={activeTab === "stats"}
            onChange={() => setActiveTab("stats")}
          />
          <div className="tab-content rounded-b-lg border-base-300 bg-white/90 p-4 sm:p-6">
            {renderSelectors({ team, enemyOptions, player, enemy, selectPokemon, setPlayer, setEnemy, pickRandomEnemy })}
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button className="btn btn-primary" disabled={!player || !enemy} onClick={runStatsBattle}>
                <Swords className="size-4" />
                Fight
              </button>
              <button className="btn btn-outline" onClick={() => resetClassic(true)}>
                <RotateCcw className="size-4" />
                Reset
              </button>
            </div>
            {statsResults.length > 0 && (
              <div className="game-panel mt-6 overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Round</th>
                      <th>Stat</th>
                      <th>Your Pokemon</th>
                      <th>Enemy Pokemon</th>
                      <th>Winner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statsResults.map((result) => (
                      <tr key={result.round}>
                        <td>{result.round}</td>
                        <td className="capitalize">{result.stat}</td>
                        <td>{result.playerValue}</td>
                        <td>{result.enemyValue}</td>
                        <td className="font-bold capitalize">{result.winner === "Draw" ? "Draw" : formatPokemonName(result.winner)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="bg-yellow-100 p-4 text-center text-xl font-black text-blue-950">{statsWinner}</div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

function renderSelectors({ team, enemyOptions, player, enemy, selectPokemon, setPlayer, setEnemy, pickRandomEnemy }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
      <PokemonSelect
        label="Your Pokemon"
        value={player?.name || ""}
        options={team.map((member) => ({ name: member.name, id: member.name }))}
        onChange={(value) => selectPokemon(value, setPlayer)}
        pokemon={player}
      />
      <div className="hidden pb-8 text-center text-5xl font-black text-primary lg:block">VS</div>
      <PokemonSelect
        label="Wild Pokemon"
        value={enemy?.name || ""}
        options={enemyOptions}
        onChange={(value) => selectPokemon(value, setEnemy)}
        pokemon={enemy}
        action={<button className="btn btn-secondary" type="button" onClick={pickRandomEnemy}><Shuffle className="size-4" /> Random</button>}
      />
    </div>
  );
}

function PokemonSelect({ label, value, options, onChange, pokemon, action }) {
  return (
    <div className="game-panel p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-xl font-black text-blue-950">{label}</h2>
        {action}
      </div>
      <select className="select select-bordered w-full border-2 border-blue-900 bg-white capitalize" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select Pokemon</option>
        {options.map((option) => (
          <option key={`${option.id}-${option.name}`} value={option.id || option.name}>
            {formatPokemonName(option.name)}
          </option>
        ))}
      </select>
      {pokemon ? <MiniPokemon pokemon={pokemon} /> : <div className="mt-4 rounded-lg border-2 border-dashed border-slate-400 bg-white p-8 text-center font-bold text-slate-600">Choose a Pokemon</div>}
    </div>
  );
}

function MiniPokemon({ pokemon }) {
  const primaryType = pokemon.types[0]?.type.name || "normal";
  return (
    <div className={`mt-4 rounded-lg border-2 border-slate-900 ${typeSoftColors[primaryType] || "bg-base-100"} p-4`}>
      <img src={getPokemonSprite(pokemon)} alt={pokemon.name} className="mx-auto h-36 object-contain drop-shadow-lg" />
      <div className="mt-2 flex items-center justify-between gap-2">
        <div>
          <p className="font-black text-slate-950">{formatPokemonName(pokemon.name)}</p>
          <p className="text-sm font-bold text-slate-700">HP {getMaxHp(pokemon)} / SPD {getStat(pokemon, "speed")}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          {pokemon.types.map((type) => <TypeBadge key={type.type.name} type={type} />)}
        </div>
      </div>
    </div>
  );
}

function BattleArena({ player, enemy, hp, intro, started, winner, turn, busy, animation, moves, messages, onStart, onMove, onReset }) {
  const canStart = player && enemy && !started && !intro;
  return (
    <section className="relative mt-6 overflow-hidden rounded-lg border-4 border-slate-950 bg-gradient-to-b from-sky-200 via-emerald-100 to-green-300 p-4 shadow-[0_6px_0_#334155]">
      {intro && (
        <div className="battle-intro absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-600 text-white">
          <div className="pokeball-pulse mb-5" />
          <p className="text-center text-3xl font-black drop-shadow">A wild {formatPokemonName(enemy?.name)} appeared!</p>
        </div>
      )}

      <div className="grid min-h-[430px] grid-rows-[1fr_auto] gap-4">
        <div className="grid grid-cols-2 items-end gap-4">
          <Fighter pokemon={player} side="player" hp={hp.player} active={started} animation={animation} />
          <Fighter pokemon={enemy} side="enemy" hp={hp.enemy} active={started} animation={animation} />
        </div>

        <div className="grid gap-3 rounded-lg border-4 border-slate-950 bg-white p-3 md:grid-cols-[1fr_1fr]">
          <div className="min-h-32 rounded-md border-4 border-slate-700 bg-slate-950 p-4 text-white">
            {winner ? (
              <p className="text-2xl font-black">{winner}</p>
            ) : started ? (
              <p className="text-lg font-bold">{turn === "player" ? "What will you do?" : `${formatPokemonName(enemy?.name)} is choosing a move...`}</p>
            ) : (
              <p className="text-lg font-bold">Select two Pokemon and start a classic battle.</p>
            )}
            <div className="mt-3 space-y-1 text-sm">
              {messages.slice(0, 3).map((message, index) => <p key={`${message}-${index}`}>{message}</p>)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {!started || winner ? (
              <>
                <button className="btn btn-primary col-span-2" disabled={!canStart} onClick={onStart}>
                  <Swords className="size-4" />
                  Start Battle
                </button>
                <button className="btn btn-outline col-span-2" onClick={onReset}>
                  <RotateCcw className="size-4" />
                  Reset Battle
                </button>
              </>
            ) : (
              moves.map((move) => (
                <button
                  key={move.name}
                  className="btn h-auto min-h-16 flex-col items-start justify-center border-2 border-blue-900 bg-white text-left text-blue-950 hover:bg-yellow-100"
                  disabled={busy || turn !== "player"}
                  onClick={() => onMove(move)}
                >
                  <span className="font-black">{move.label}</span>
                  <span className="text-xs uppercase opacity-70">{move.type} / {move.power} pow</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Fighter({ pokemon, side, hp, active, animation }) {
  if (!pokemon) {
    return <div className="h-72 rounded-lg border-2 border-dashed border-white/70 bg-white/30" />;
  }
  const maxHp = getMaxHp(pokemon);
  const percent = active ? Math.max(0, (hp / maxHp) * 100) : 100;
  const primaryType = pokemon.types[0]?.type.name || "normal";
  const className = [
    "pokemon-sprite mx-auto h-40 object-contain drop-shadow-2xl sm:h-52",
    side === "player" ? "scale-x-[-1]" : "",
    animation.actor === side ? "is-attacking" : "",
    animation.target === side ? "is-hit" : "",
    active && hp <= 0 ? "is-fainted" : "",
  ].join(" ");

  return (
    <div className={`relative flex flex-col ${side === "player" ? "items-start self-end" : "items-end self-start"}`}>
      <div className="mb-2 w-full max-w-xs rounded-lg border-4 border-slate-950 bg-white p-3 text-slate-950 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <p className="font-black">{formatPokemonName(pokemon.name)}</p>
          <TypeBadge type={primaryType} />
        </div>
        <div className="mt-2 h-4 overflow-hidden rounded-full bg-base-300">
          <div className={`h-full transition-all duration-700 ${percent > 50 ? "bg-success" : percent > 20 ? "bg-warning" : "bg-error"}`} style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-1 text-right text-xs font-bold">HP {active ? hp : maxHp}/{maxHp}</p>
      </div>
      <img
        src={getPokemonSprite(pokemon)}
        alt={pokemon.name}
        className={className}
        style={{ "--attack-distance": side === "player" ? "28px" : "-28px" }}
      />
      {animation.target === side && <span className={`skill-effect ${typeSoftColors[primaryType] || "bg-white"}`} />}
    </div>
  );
}

function effectivenessText(value) {
  if (value > 1) return " It's super effective!";
  if (value > 0 && value < 1) return " It's not very effective.";
  if (value === 0) return " It had no effect.";
  return "";
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
