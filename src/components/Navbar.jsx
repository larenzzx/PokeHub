import { Link, NavLink } from "react-router-dom";
import { useEffect } from "react";
import { Menu, Settings } from "lucide-react";

export const Navbar = () => {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "pokemon");
    localStorage.setItem("theme", "pokemon");
  }, []);

  const navClass = ({ isActive }) =>
    `rounded-md font-black ${isActive ? "bg-yellow-300 text-blue-950" : "text-white hover:bg-white/15"}`;

  return (
    <div className="navbar sticky top-0 z-10 border-b-4 border-slate-950 bg-gradient-to-r from-blue-700 via-blue-500 to-sky-400 px-3 shadow-md sm:px-6 lg:px-12">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn border-none bg-transparent text-white hover:bg-white/10 lg:hidden">
            <Menu className="size-5" />
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content z-1 mt-3 w-52 rounded-box bg-base-200 p-2 shadow">
            <li><Link to="/pokedex">Pokédex</Link></li>
            <li><Link to="/team">Team</Link></li>
            <li><Link to="/battle">Battle</Link></li>
            <li><Link to="/history">History</Link></li>
            <li><Link to="/settings">Settings</Link></li>
          </ul>
        </div>
        <Link to="/" className="flex min-w-0 items-center gap-2 rounded-sm px-2 text-xl font-black text-white hover:bg-white/10 lg:text-3xl">
          <span className="inline-block size-5 rounded-full border-2 border-slate-950 bg-gradient-to-b from-red-500 from-0% via-red-500 via-45% to-white to-50% shadow" />
          PokeHub
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 lg:text-lg">
          <li><NavLink className={navClass} to="/pokedex">Pokédex</NavLink></li>
          <li><NavLink className={navClass} to="/team">Team</NavLink></li>
          <li><NavLink className={navClass} to="/history">History</NavLink></li>
          <li><NavLink className={navClass} to="/settings">Settings</NavLink></li>
        </ul>
      </div>

      <div className="navbar-end gap-3">
        <button className="relative cursor-pointer transition hover:translate-y-0.5">
          <span className="absolute left-0 top-0 ml-1 mt-1 h-full w-full rounded bg-blue-800" />
          <Link
            to="/battle"
            className="relative inline-block h-full w-full rounded border-2 border-blue-800 bg-yellow-400 px-3 py-1 text-base font-bold text-blue-950 transition duration-100 hover:bg-yellow-500"
          >
            Battle
          </Link>
        </button>
        <Link to="/settings" className="btn btn-ghost btn-sm text-white" aria-label="Settings">
          <Settings className="size-5" />
        </Link>
      </div>
    </div>
  );
};
