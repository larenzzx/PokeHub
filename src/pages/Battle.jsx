import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Shuffle, Swords, Users, Volume2, VolumeX, Zap } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { TypeBadge } from "../components/TypeBadge";
import { fetchTeam, saveBattle } from "../api/localApi";
import { fetchPokemon, fetchPokemonSummaries, getBattleSprite, getPokemonSprite, hydratePokemonBattleMoves } from "../api/pokeApi";
import { calculateMoveDamage, calculateTypeEffectiveness, getBattleMoves, getMaxHp, getStat } from "../utils/battleLogic";
import { formatPokemonName, typeSoftColors } from "../utils/pokemonTypes";
import { useBattleAudio } from "../hooks/useBattleAudio";
import { normalizeTypeNames } from "../utils/pokemonData";

const emptyHp = { player: 0, enemy: 0 };

export const Battle = () => {
  const [team, setTeam] = useState([]);
  const [enemyOptions, setEnemyOptions] = useState([]);
  const [player, setPlayer] = useState(null);
  const [enemy, setEnemy] = useState(null);
  const [battleMode, setBattleMode] = useState(() => localStorage.getItem("battleMode") || "single");
  const [playerParty, setPlayerParty] = useState([]);
  const [enemyParty, setEnemyParty] = useState([]);
  const [partyIndex, setPartyIndex] = useState({ player: 0, enemy: 0 });
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
  const [damagePop, setDamagePop] = useState(null);
  const [pp, setPp] = useState({ player: {}, enemy: {} });
  const [startedAt, setStartedAt] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const audio = useBattleAudio();
  const battleSpeed = readGameSettings().battleSpeed || "normal";

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

  useEffect(() => {
    localStorage.setItem("battleMode", battleMode);
  }, [battleMode]);

  const playerMoves = useMemo(() => (player ? getBattleMoves(player) : []), [player]);
  const enemyMoves = useMemo(() => (enemy ? getBattleMoves(enemy) : []), [enemy]);

  const selectPokemon = async (value, setter) => {
    if (!value) {
      setter(null);
      return;
    }
    try {
      const selected = await hydratePokemonBattleMoves(await fetchPokemon(value));
      setter(selected);
      resetClassic(false);
    } catch (error) {
      console.error("Error selecting Pokémon:", error);
    }
  };

  const pickRandomEnemy = async () => {
    if (!enemyOptions.length) return;
    const random = enemyOptions[Math.floor(Math.random() * enemyOptions.length)];
    await selectPokemon(random.id, setEnemy);
  };

  const changeBattleMode = (mode) => {
    setBattleMode(mode);
    resetClassic(false);
  };

  const runStatsBattle = () => {
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
    void saveBattle({
      pokemon1: player.name,
      pokemon2: enemy.name,
      result,
      date: new Date().toISOString(),
      battleType: "stats",
    }).catch((error) => console.error("Error saving stats battle:", error));
  };

  const beginClassicBattle = (activePlayer, activeEnemy) => {
    if (!activePlayer || !activeEnemy || intro || battleStarted) return;
    audio.play("click");
    audio.play("start");
    setIntro(true);
    const initialPp = {
      player: Object.fromEntries(getBattleMoves(activePlayer).map((move) => [move.name, move.pp])),
      enemy: Object.fromEntries(getBattleMoves(activeEnemy).map((move) => [move.name, move.pp])),
    };
    setPp(initialPp);
    setStartedAt(Date.now());
    setMoveHistory([]);
    setMessages([`A wild ${formatPokemonName(activeEnemy.name)} appeared!`]);
    window.setTimeout(() => {
      const playerStarts = getStat(activePlayer, "speed") >= getStat(activeEnemy, "speed");
      setHp({ player: getMaxHp(activePlayer), enemy: getMaxHp(activeEnemy) });
      setTurn(playerStarts ? "player" : "enemy");
      setBattleStarted(true);
      setIntro(false);
      setWinner("");
      setMessages((prev) => [
        ...prev,
        `${formatPokemonName(playerStarts ? activePlayer.name : activeEnemy.name)} moves first.`,
      ]);
      audio.stop("main");
      audio.playLoop("battle");
      if (!playerStarts) {
        window.setTimeout(() => enemyTurn(getMaxHp(activePlayer), getMaxHp(activeEnemy)), speedMs(700, battleSpeed));
      }
    }, speedMs(1700, battleSpeed));
  };

  const startClassicBattle = () => beginClassicBattle(player, enemy);

  const startTeamBattle = async () => {
    if (!team.length || intro || battleStarted) return;
    setLoading(true);
    try {
      const hydratedTeam = await Promise.all(
        team.slice(0, 6).map(async (member) => hydratePokemonBattleMoves(await fetchPokemon(member.name)))
      );
      const enemySeeds = [...enemyOptions]
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.max(1, Math.min(6, hydratedTeam.length)));
      const hydratedEnemies = await Promise.all(
        enemySeeds.map(async (option) => hydratePokemonBattleMoves(await fetchPokemon(option.id || option.name)))
      );
      setPlayerParty(hydratedTeam);
      setEnemyParty(hydratedEnemies);
      setPartyIndex({ player: 0, enemy: 0 });
      setPlayer(hydratedTeam[0]);
      setEnemy(hydratedEnemies[0]);
      beginClassicBattle(hydratedTeam[0], hydratedEnemies[0]);
    } catch (error) {
      console.error("Error starting team battle:", error);
    } finally {
      setLoading(false);
    }
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
    setDamagePop(null);
    setPp({ player: {}, enemy: {} });
    setMoveHistory([]);
    setStartedAt(null);
    setPlayerParty([]);
    setEnemyParty([]);
    setPartyIndex({ player: 0, enemy: 0 });
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
    const usableMoves = enemyMoves.filter((move) => (pp.enemy[move.name] ?? move.pp) > 0);
    const move = pickBestEnemyMove(usableMoves.length ? usableMoves : enemyMoves, enemy, player);
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
    setPp((current) => ({
      ...current,
      [side]: {
        ...current[side],
        [move.name]: Math.max(0, (current[side]?.[move.name] ?? move.pp) - 1),
      },
    }));

    await delay(speedMs(360, battleSpeed));
    const result = calculateMoveDamage(attacker, defender, move);
    const nextHp = { ...currentHp };
    const targetSide = side === "player" ? "enemy" : "player";
    nextHp[targetSide] = Math.max(0, nextHp[targetSide] - result.damage);
    setHp(nextHp);
    if (!result.missed) {
      setDamagePop({ side: targetSide, damage: result.damage, critical: result.critical });
    }
    setMoveHistory((current) => [
      ...current,
      {
        turn: current.length + 1,
        user: attacker.name,
        target: defender.name,
        move: move.name,
        damage: result.damage,
        missed: result.missed,
        critical: result.critical,
        effectiveness: result.effectiveness,
      },
    ]);

    const newMessages = [
      `${formatPokemonName(attacker.name)} used ${move.label}!`,
      result.missed
        ? "The attack missed!"
        : `${formatPokemonName(defender.name)} took ${result.damage} damage.${effectivenessText(result.effectiveness)}${result.critical ? " Critical hit!" : ""}`,
    ];
    setMessages((prev) => [...newMessages, ...prev].slice(0, 8));

    await delay(speedMs(520, battleSpeed));
    setAnimation({ actor: "", target: "", effect: "" });
    setDamagePop(null);

    if (nextHp[targetSide] <= 0) {
      const switched = await maybeSwitchNextPokemon({ faintedSide: targetSide, nextHp });
      if (switched) return;

      const resultText = side === "player"
        ? `${formatPokemonName(player.name)}, You Win!`
        : `${formatPokemonName(enemy.name)}, You Lose!`;
      setWinner(resultText);
      setMessages((prev) => [`${formatPokemonName(defender.name)} fainted!`, ...prev]);
      setBusy(false);
      audio.stop("battle");
      audio.play(side === "player" ? "win" : "lose");
      void saveBattle({
        pokemon1: player.name,
        pokemon2: enemy.name,
        result: resultText,
        date: new Date().toISOString(),
        battleType: "classic",
        battleMode,
        difficulty: "normal",
        duration: startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0,
        turns: moveHistory.length + 1,
        remainingHp: { ...nextHp },
        moveHistory: [
          ...moveHistory,
          { turn: moveHistory.length + 1, user: attacker.name, target: defender.name, move: move.name, damage: result.damage },
        ],
        mvpPokemon: side === "player" ? player.name : enemy.name,
      }).catch((error) => console.error("Error saving battle:", error));
      return;
    }

    if (side === "player") {
      setTurn("enemy");
      setBusy(false);
      window.setTimeout(() => enemyTurn(nextHp.player, nextHp.enemy), speedMs(650, battleSpeed));
    } else {
      setTurn("player");
      setBusy(false);
    }
  };

  const maybeSwitchNextPokemon = async ({ faintedSide, nextHp }) => {
    if (battleMode !== "team") return false;
    const party = faintedSide === "player" ? playerParty : enemyParty;
    const nextIndex = partyIndex[faintedSide] + 1;
    if (nextIndex >= party.length) return false;

    const faintedPokemon = faintedSide === "player" ? player : enemy;
    const nextPokemon = party[nextIndex];
    const nextHpState = { ...nextHp, [faintedSide]: getMaxHp(nextPokemon) };
    setPartyIndex((current) => ({ ...current, [faintedSide]: nextIndex }));
    setMessages((prev) => [
      `${formatPokemonName(nextPokemon.name)} switched in!`,
      `${formatPokemonName(faintedPokemon.name)} fainted!`,
      ...prev,
    ].slice(0, 8));

    if (faintedSide === "player") {
      setPlayer(nextPokemon);
      setHp(nextHpState);
      setTurn("enemy");
      setBusy(false);
      window.setTimeout(() => enemyTurn(nextHpState.player, nextHpState.enemy), speedMs(750, battleSpeed));
    } else {
      setEnemy(nextPokemon);
      setHp(nextHpState);
      setTurn("player");
      setBusy(false);
    }

    return true;
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
            <h1 className="pokemon-title text-4xl text-yellow-300 sm:text-5xl">Pokémon Battle</h1>
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
            <BattleModePicker battleMode={battleMode} setBattleMode={changeBattleMode} teamCount={team.length} />
            {battleMode === "single" ? (
              renderSelectors({ team, enemyOptions, player, enemy, selectPokemon, setPlayer, setEnemy, pickRandomEnemy })
            ) : (
              <TeamBattleSetup team={team} enemyParty={enemyParty} />
            )}
            <BattleArena
              battleMode={battleMode}
              teamCount={team.length}
              player={player}
              enemy={enemy}
              playerParty={playerParty}
              enemyParty={enemyParty}
              partyIndex={partyIndex}
              hp={hp}
              intro={intro}
              started={battleStarted}
              winner={winner}
              turn={turn}
              busy={busy}
              animation={animation}
              moves={playerMoves}
              messages={messages}
              damagePop={damagePop}
              pp={pp.player}
              onStart={battleMode === "team" ? startTeamBattle : startClassicBattle}
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
                      <th>Your Pokémon</th>
                      <th>Enemy Pokémon</th>
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
        label="Your Pokémon"
        value={player?.name || ""}
        options={team.map((member) => ({ name: member.name, id: member.name }))}
        onChange={(value) => selectPokemon(value, setPlayer)}
        pokemon={player}
      />
      <div className="hidden pb-8 text-center text-5xl font-black text-primary lg:block">VS</div>
      <PokemonSelect
        label="Wild Pokémon"
        value={enemy?.name || ""}
        options={enemyOptions}
        onChange={(value) => selectPokemon(value, setEnemy)}
        pokemon={enemy}
        action={<button className="btn btn-secondary" type="button" onClick={pickRandomEnemy}><Shuffle className="size-4" /> Random</button>}
      />
    </div>
  );
}

function BattleModePicker({ battleMode, setBattleMode, teamCount }) {
  return (
    <section className="mb-5 rounded-lg border-4 border-slate-950 bg-slate-950 p-3 text-white">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-yellow-300">Battle mode</p>
          <h2 className="text-xl font-black">Choose your arcade cabinet</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            className={`btn w-full ${battleMode === "single" ? "btn-primary" : "btn-outline text-white"}`}
            onClick={() => setBattleMode("single")}
          >
            <Swords className="size-4" />
            Single Battle
          </button>
          <button
            type="button"
            className={`btn w-full ${battleMode === "team" ? "btn-primary" : "btn-outline text-white"}`}
            onClick={() => setBattleMode("team")}
            disabled={teamCount === 0}
          >
            <Users className="size-4" />
            Team Battle
          </button>
        </div>
      </div>
      {battleMode === "team" && (
        <p className="mt-2 text-sm font-bold text-slate-200">
          Your saved team enters in order. When one Pokémon faints, the next slot switches in.
        </p>
      )}
    </section>
  );
}

function TeamBattleSetup({ team, enemyParty }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="game-panel p-4">
        <h2 className="text-xl font-black text-blue-950">Your team queue</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {team.length ? team.slice(0, 6).map((member, index) => (
            <div key={member.id || member.name} className="rounded-md border-2 border-slate-900 bg-white p-2 text-sm font-black text-slate-900">
              #{index + 1} {formatPokemonName(member.name)}
            </div>
          )) : (
            <p className="col-span-full rounded-md border-2 border-dashed border-slate-400 p-4 font-bold text-slate-600">
              Add Pokémon to your team before starting a team battle.
            </p>
          )}
        </div>
      </div>
      <div className="game-panel p-4">
        <h2 className="text-xl font-black text-blue-950">Opponent queue</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(enemyParty.length ? enemyParty : Array.from({ length: Math.min(6, Math.max(1, team.length)) })).map((pokemon, index) => (
            <div key={pokemon?.id || index} className="rounded-md border-2 border-slate-900 bg-yellow-100 p-2 text-sm font-black text-slate-900">
              #{index + 1} {pokemon ? formatPokemonName(pokemon.name) : "Random"}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PokemonSelect({ label, value, options, onChange, pokemon, action }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const selectedOption = useMemo(
    () => options.find((option) => String(option.id || option.name) === String(value) || option.name === value),
    [options, value]
  );
  const filteredOptions = useMemo(() => {
    const matches = normalizedQuery
      ? options.filter((option) => option.name.toLowerCase().includes(normalizedQuery) || String(option.id || "").includes(normalizedQuery))
      : options;
    const visible = matches.slice(0, 150);
    if (selectedOption && !visible.some((option) => option.name === selectedOption.name)) {
      return [selectedOption, ...visible];
    }
    return visible;
  }, [normalizedQuery, options, selectedOption]);
  const totalMatches = useMemo(() => {
    if (!normalizedQuery) return options.length;
    return options.filter((option) => option.name.toLowerCase().includes(normalizedQuery) || String(option.id || "").includes(normalizedQuery)).length;
  }, [normalizedQuery, options]);

  return (
    <div className="game-panel p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-xl font-black text-blue-950">{label}</h2>
        {action}
      </div>
      <input
        className="input input-bordered mb-2 w-full border-2 border-blue-900 bg-white"
        type="search"
        placeholder={`Search ${label.toLowerCase()}`}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <select className="select select-bordered w-full border-2 border-blue-900 bg-white capitalize" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select Pokémon</option>
        {filteredOptions.map((option) => (
          <option key={`${option.id}-${option.name}`} value={option.id || option.name}>
            {formatPokemonName(option.name)}
          </option>
        ))}
      </select>
      {totalMatches > filteredOptions.length && (
        <p className="mt-1 text-xs font-bold text-slate-600">
          Showing {filteredOptions.length} of {totalMatches}. Keep typing to narrow the list.
        </p>
      )}
      {pokemon ? <MiniPokemon pokemon={pokemon} /> : <div className="mt-4 rounded-lg border-2 border-dashed border-slate-400 bg-white p-8 text-center font-bold text-slate-600">Choose a Pokémon</div>}
    </div>
  );
}

function MiniPokemon({ pokemon }) {
  const primaryType = normalizeTypeNames(pokemon.types)[0] || "normal";
  return (
    <div className={`mt-4 rounded-lg border-2 border-slate-900 ${typeSoftColors[primaryType] || "bg-base-100"} p-4`}>
      <img src={getPokemonSprite(pokemon)} alt={pokemon.name} className="mx-auto h-36 object-contain drop-shadow-lg" />
      <div className="mt-2 flex items-center justify-between gap-2">
        <div>
          <p className="font-black text-slate-950">{formatPokemonName(pokemon.name)}</p>
          <p className="text-sm font-bold text-slate-700">HP {getMaxHp(pokemon)} / SPD {getStat(pokemon, "speed")}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          {pokemon.types.map((type) => <TypeBadge key={type.type?.name || type.name || type} type={type} />)}
        </div>
      </div>
    </div>
  );
}

function BattleArena({ battleMode, teamCount, player, enemy, playerParty, enemyParty, partyIndex, hp, intro, started, winner, turn, busy, animation, moves, messages, damagePop, pp, onStart, onMove, onReset }) {
  const canStart = battleMode === "team" ? teamCount > 0 && !started && !intro : player && enemy && !started && !intro;
  return (
    <section className="battlefield relative mt-6 overflow-hidden rounded-lg border-4 border-slate-950 p-4 shadow-[0_6px_0_#334155]">
      {intro && (
        <div className="battle-intro absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-600 text-white">
          <div className="pokeball-pulse mb-5" />
          <p className="text-center text-3xl font-black drop-shadow">A wild {formatPokemonName(enemy?.name)} appeared!</p>
        </div>
      )}

      <div className="grid min-h-[360px] grid-rows-[1fr_auto] gap-4 sm:min-h-[430px]">
        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
          <Fighter pokemon={player} side="player" hp={hp.player} active={started} animation={animation} damagePop={damagePop} />
          <Fighter pokemon={enemy} side="enemy" hp={hp.enemy} active={started} animation={animation} damagePop={damagePop} />
        </div>

        <div className="grid gap-3 rounded-lg border-4 border-slate-950 bg-white p-3 md:grid-cols-[1fr_1fr]">
          <div className="min-h-32 rounded-md border-4 border-slate-700 bg-slate-950 p-4 text-white">
            {winner ? (
              <p className="text-2xl font-black">{winner}</p>
            ) : started ? (
              <p className="text-lg font-bold">{turn === "player" ? "What will you do?" : `${formatPokemonName(enemy?.name)} is choosing a move...`}</p>
            ) : (
              <p className="text-lg font-bold">Select two Pokémon and start a classic battle.</p>
            )}
            <div className="mt-3 space-y-1 text-sm">
              {messages.slice(0, 3).map((message, index) => <p key={`${message}-${index}`}>{message}</p>)}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                  disabled={busy || turn !== "player" || (pp[move.name] ?? move.pp) <= 0}
                  onClick={() => onMove(move)}
                >
                  <span className="font-black">{move.label}</span>
                  <span className="text-xs uppercase opacity-70">{move.type} / {move.category} / {move.power} pow / PP {pp[move.name] ?? move.pp}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
      {battleMode === "team" && started && (
        <PartyTracker playerParty={playerParty} enemyParty={enemyParty} partyIndex={partyIndex} />
      )}
      {!started && player && enemy && <BattleSetupSummary player={player} enemy={enemy} />}
    </section>
  );
}

function PartyTracker({ playerParty, enemyParty, partyIndex }) {
  return (
    <div className="mt-4 grid gap-3 rounded-lg border-4 border-slate-950 bg-white/95 p-3 text-slate-950 md:grid-cols-2">
      <PartyLine title="Your party" party={playerParty} activeIndex={partyIndex.player} />
      <PartyLine title="Opponent party" party={enemyParty} activeIndex={partyIndex.enemy} />
    </div>
  );
}

function PartyLine({ title, party, activeIndex }) {
  return (
    <div>
      <p className="mb-2 text-xs font-black uppercase text-blue-800">{title}</p>
      <div className="flex flex-wrap gap-2">
        {party.map((pokemon, index) => (
          <span
            key={`${pokemon.id}-${index}`}
            className={`rounded border-2 px-2 py-1 text-xs font-black ${index < activeIndex ? "border-slate-400 bg-slate-200 text-slate-500 line-through" : index === activeIndex ? "border-yellow-500 bg-yellow-200 text-blue-950" : "border-slate-900 bg-white"}`}
          >
            {formatPokemonName(pokemon.name)}
          </span>
        ))}
      </div>
    </div>
  );
}

function Fighter({ pokemon, side, hp, active, animation, damagePop }) {
  if (!pokemon) {
    return <div className="h-72 rounded-lg border-2 border-dashed border-white/70 bg-white/30" />;
  }
  const maxHp = getMaxHp(pokemon);
  const percent = active ? Math.max(0, (hp / maxHp) * 100) : 100;
  const primaryType = normalizeTypeNames(pokemon.types)[0] || "normal";
  const className = [
    "pokemon-sprite mx-auto h-40 image-render-pixel object-contain drop-shadow-2xl sm:h-52",
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
          <div className={`h-full transition-all duration-700 ${percent > 50 ? "bg-success" : percent > 20 ? "bg-warning" : "hp-low bg-error"}`} style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-1 text-right text-xs font-bold">HP {active ? hp : maxHp}/{maxHp}</p>
      </div>
      <img
        src={getBattleSprite(pokemon, side === "player" ? "back" : "front")}
        alt={pokemon.name}
        className={className}
        style={{ "--attack-distance": side === "player" ? "28px" : "-28px" }}
      />
      {animation.target === side && <span className={`skill-effect ${typeSoftColors[primaryType] || "bg-white"}`} />}
      {damagePop?.side === side && (
        <span className={`damage-pop ${damagePop.critical ? "text-yellow-300" : "text-white"}`}>
          -{damagePop.damage}
        </span>
      )}
    </div>
  );
}

function BattleSetupSummary({ player, enemy }) {
  const playerTypes = normalizeTypeNames(player.types);
  const enemyTypes = normalizeTypeNames(enemy.types);
  const coverage = getBattleMoves(player).map((move) => move.type);
  return (
    <div className="mt-4 grid gap-3 rounded-lg border-4 border-slate-950 bg-white/95 p-3 text-slate-950 md:grid-cols-3">
      <div>
        <p className="text-xs font-black uppercase text-blue-800">Your coverage</p>
        <div className="mt-2 flex flex-wrap gap-1">{[...new Set(coverage)].map((type) => <TypeBadge key={type} type={type} />)}</div>
      </div>
      <div>
        <p className="text-xs font-black uppercase text-blue-800">Type matchup</p>
        <p className="mt-1 text-sm font-bold">{playerTypes.join(" / ")} vs {enemyTypes.join(" / ")}</p>
      </div>
      <div className="flex items-center gap-2 text-sm font-bold">
        <Zap className="size-5 text-yellow-500" />
        Higher speed attacks first. Critical hits now multiply damage.
      </div>
    </div>
  );
}

function pickBestEnemyMove(moves, attacker, defender) {
  return [...moves].sort((a, b) => {
    const scoreA = estimateMoveScore(a, attacker, defender);
    const scoreB = estimateMoveScore(b, attacker, defender);
    return scoreB - scoreA;
  })[0];
}

function estimateMoveScore(move, attacker, defender) {
  const sameType = normalizeTypeNames(attacker.types).includes(move.type) ? 1.5 : 1;
  const effectiveness = calculateTypeEffectiveness(move.type, defender.types);
  return move.power * sameType * effectiveness * (move.accuracy / 100);
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

function speedMs(ms, speed) {
  if (speed === "fast") return Math.round(ms * 0.55);
  if (speed === "slow") return Math.round(ms * 1.35);
  return ms;
}

function readGameSettings() {
  try {
    return JSON.parse(localStorage.getItem("pokehub:settings")) || {};
  } catch {
    return {};
  }
}
