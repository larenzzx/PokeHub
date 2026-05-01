import { useEffect, useState } from "react";
import { BookOpen, Gamepad2, Info, Save, SlidersHorizontal, Volume2 } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { fetchSettings, saveSettings } from "../api/localApi";

const defaultSettings = {
  soundEnabled: true,
  volume: 0.7,
  battleSpeed: "normal",
  animations: true,
  autoSave: true,
  difficulty: "normal",
};

export function Settings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetchSettings().then((data) => setSettings({ ...defaultSettings, ...data }));
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const update = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const persist = async () => {
    await saveSettings(settings);
    setToast("Game settings saved.");
  };

  return (
    <div className="min-h-screen bg-base-100">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="arcade-panel mb-6 p-5">
          <p className="text-sm font-black uppercase text-yellow-300">Options cabinet</p>
          <h1 className="arcade-title text-3xl text-white sm:text-5xl">Game Settings</h1>
          <p className="mt-3 max-w-2xl font-bold text-slate-100">
            Tune sound, gameplay, and trainer info for a cleaner PokeHub run.
          </p>
        </section>

        {toast && (
          <div className="toast toast-top toast-end z-50">
            <div className="alert alert-success shadow-lg">{toast}</div>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          <SettingsCard icon={<Volume2 className="size-6" />} title="Sound Settings">
            <label className="flex items-center justify-between gap-4 rounded-md border-2 border-slate-900 bg-white p-3 font-black text-slate-900">
              Sound effects
              <input type="checkbox" className="toggle toggle-primary" checked={settings.soundEnabled} onChange={(event) => update("soundEnabled", event.target.checked)} />
            </label>
            <label className="block rounded-md border-2 border-slate-900 bg-white p-3 font-black text-slate-900">
              Volume
              <input type="range" min="0" max="1" step="0.05" className="range range-primary mt-3" value={settings.volume} onChange={(event) => update("volume", Number(event.target.value))} />
            </label>
          </SettingsCard>

          <SettingsCard icon={<SlidersHorizontal className="size-6" />} title="Gameplay Settings">
            <label className="block rounded-md border-2 border-slate-900 bg-white p-3 font-black text-slate-900">
              Battle speed
              <select className="select select-bordered mt-2 w-full border-2 border-blue-900 bg-white" value={settings.battleSpeed} onChange={(event) => update("battleSpeed", event.target.value)}>
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            </label>
            <label className="flex items-center justify-between gap-4 rounded-md border-2 border-slate-900 bg-white p-3 font-black text-slate-900">
              Battle animations
              <input type="checkbox" className="toggle toggle-primary" checked={settings.animations} onChange={(event) => update("animations", event.target.checked)} />
            </label>
            <label className="flex items-center justify-between gap-4 rounded-md border-2 border-slate-900 bg-white p-3 font-black text-slate-900">
              Auto-save records
              <input type="checkbox" className="toggle toggle-primary" checked={settings.autoSave} onChange={(event) => update("autoSave", event.target.checked)} />
            </label>
          </SettingsCard>

          <SettingsCard icon={<Info className="size-6" />} title="Game Information">
            <InfoRow label="Game" value="PokeHub Battle Companion" />
            <InfoRow label="Modes" value="Single battle, team battle, stats battle" />
            <InfoRow label="Data" value="PokeAPI with local JSON Server fallback" />
            <InfoRow label="Style" value="Retro arcade with classic Pokémon battle sprites" />
          </SettingsCard>

          <SettingsCard icon={<BookOpen className="size-6" />} title="Game Guide">
            <ol className="space-y-3 text-sm font-bold text-slate-800">
              <li><span className="font-black text-blue-900">1.</span> Open the Pokédex and add up to six Pokémon to your team.</li>
              <li><span className="font-black text-blue-900">2.</span> Use Team Battle for a full roster queue or Single Battle for a quick matchup.</li>
              <li><span className="font-black text-blue-900">3.</span> Pick moves with strong type coverage. STAB and type effectiveness affect damage.</li>
              <li><span className="font-black text-blue-900">4.</span> Review battle history to track turns, duration, and MVP Pokémon.</li>
            </ol>
          </SettingsCard>
        </div>

        <div className="mt-6 flex justify-end">
          <button className="btn btn-primary" onClick={persist}>
            <Save className="size-4" />
            Save Settings
          </button>
        </div>
      </main>
    </div>
  );
}

function SettingsCard({ icon, title, children }) {
  return (
    <section className="game-panel space-y-3 p-4">
      <h2 className="flex items-center gap-2 text-xl font-black text-blue-950">
        <span className="rounded-md border-2 border-slate-900 bg-yellow-300 p-2 text-blue-950">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border-2 border-slate-900 bg-white p-3 text-sm">
      <span className="font-black text-blue-900">{label}</span>
      <span className="max-w-[70%] text-right font-bold text-slate-800">{value}</span>
    </div>
  );
}
