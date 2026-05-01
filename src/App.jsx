import { Hero } from "./pages/Hero";
import { Pokedex } from "./pages/Pokedex";
import { Team } from "./pages/Team";
import { History } from "./pages/History";
import { Battle } from "./pages/Battle";
import { Settings } from "./pages/Settings";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/pokedex" element={<Pokedex />} />
        <Route path="/team" element={<Team />} />
        <Route path="/battle" element={<Battle />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </>
  );
}

export default App;
