import pokemonBg from "../assets/pokebg.jpg";
import pokeLogo from "../assets/pokelogo.png";
import { Link } from "react-router-dom";

export const Hero = () => {
  return (
    <main
      className="hero min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.25), rgba(15, 23, 42, 0.55)), url(${pokemonBg})` }}
    >
      <div className="hero-content px-4 text-center text-white">
        <div className="max-w-xl">
          <img src={pokeLogo} alt="Pokemon logo" className="mx-auto max-h-44 object-contain drop-shadow-2xl" />
          <p className="mb-6 mt-4 text-base font-bold leading-relaxed text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)] md:text-lg">
            Search every Pokemon, build your team, and jump into a classic turn-based battle.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/pokedex" className="btn btn-primary border-2 border-blue-800 text-blue-950 shadow-md">
              Start Journey
            </Link>
            <Link to="/battle" className="btn btn-outline border-white text-white hover:border-yellow-400 hover:bg-yellow-400 hover:text-blue-950">
              Battle
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};
