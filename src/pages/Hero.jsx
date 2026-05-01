import { Link } from "react-router-dom";
import { BookOpen, History, Swords, Users } from "lucide-react";
import pokemonBg from "../assets/pokebg.jpg";
import pokeLogo from "../assets/pokelogo.png";

export const Hero = () => {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section
        className="relative min-h-[92vh] overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(rgba(5, 10, 28, 0.52), rgba(5, 10, 28, 0.82)), url(${pokemonBg})` }}
      >
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
        <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col items-center justify-center px-4 py-12 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <img src={pokeLogo} alt="Pokémon logo" className="mx-auto mb-4 max-h-36 object-contain drop-shadow-2xl" />
            <h1 className="arcade-title text-3xl leading-tight text-white sm:text-5xl lg:text-6xl">
              Welcome to PokeHub
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg font-bold leading-relaxed text-slate-100">
              Build a smarter Pokémon roster, study matchups, and play quick retro battles with classic front-and-back battle sprites.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link to="/pokedex" className="btn btn-primary border-4 border-blue-950 text-blue-950 shadow-[4px_4px_0_#1e3a8a]">
                Start Journey
              </Link>
              <Link to="/battle" className="btn border-4 border-yellow-300 bg-slate-950 text-yellow-200 shadow-[4px_4px_0_#ca8a04] hover:bg-yellow-300 hover:text-blue-950">
                Battle Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-black uppercase text-yellow-300">Game features</p>
          <h2 className="arcade-title text-3xl text-white sm:text-4xl">Arcade tools for trainers</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Feature icon={<BookOpen className="size-6" />} title="Pokédex Scout" text="Search, filter, compare, and inspect Pokémon before adding them to your roster." />
          <Feature icon={<Users className="size-6" />} title="Team Builder" text="Keep six Pokémon visible, reorder your party, and review type balance." />
          <Feature icon={<Swords className="size-6" />} title="Single & Team Battles" text="Play quick one-on-one matches or queue your full roster for a team battle." />
          <Feature icon={<History className="size-6" />} title="Battle Records" text="Track wins, losses, turns, duration, remaining HP, and MVP Pokémon." />
        </div>
      </section>

      <section className="border-y-4 border-yellow-300 bg-blue-800">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase text-yellow-200">How to get started</p>
            <h2 className="arcade-title text-3xl text-white">Three-button combo</h2>
          </div>
          <div className="grid gap-3">
            <Step number="1" text="Open the Pokédex and add up to six Pokémon to your team." />
            <Step number="2" text="Review your team analysis and reorder your battle queue." />
            <Step number="3" text="Choose Single Battle or Team Battle, then use move type coverage to win." />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="arcade-panel grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm font-black uppercase text-yellow-300">Ready screen</p>
            <h2 className="arcade-title text-3xl text-white">Tune the cabinet</h2>
            <p className="mt-2 font-bold text-slate-100">Adjust sound, gameplay, game information, and the guide in Settings.</p>
          </div>
          <Link to="/settings" className="btn btn-primary border-4 border-blue-950 text-blue-950">
            Open Settings
          </Link>
        </div>
      </section>
    </main>
  );
};

function Feature({ icon, title, text }) {
  return (
    <article className="rounded-lg border-4 border-yellow-300 bg-white p-4 text-slate-950 shadow-[5px_5px_0_#2563eb]">
      <div className="mb-3 inline-flex rounded border-2 border-slate-950 bg-red-500 p-2 text-white">{icon}</div>
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-2 text-sm font-bold text-slate-700">{text}</p>
    </article>
  );
}

function Step({ number, text }) {
  return (
    <div className="flex gap-3 rounded-lg border-4 border-slate-950 bg-white p-3 text-slate-950 shadow-[4px_4px_0_#111827]">
      <span className="grid size-10 shrink-0 place-items-center rounded border-2 border-slate-950 bg-yellow-300 font-black">{number}</span>
      <p className="self-center font-black">{text}</p>
    </div>
  );
}
