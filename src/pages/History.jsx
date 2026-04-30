import { Navbar } from "../components/Navbar";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { deleteBattle, fetchBattles } from "../api/localApi";

export const History = () => {
  const [battles, setBattles] = useState([]);
  const [selectedBattle, setSelectedBattle] = useState(null); // For delete modal
  const [filterType, setFilterType] = useState("all"); // Filter options: all, wins, losses, draws

  const fetchBattleHistory = async () => {
    try {
      const response = await fetchBattles();
      const sortedBattles = response.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      setBattles(sortedBattles);
    } catch (error) {
      console.error("Error fetching battle history:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBattle(id);
      setBattles((prev) => prev.filter((b) => b.id !== id));
      setSelectedBattle(null);
      // Show toast
      const toast = document.getElementById("toast-delete");
      if (toast) toast.classList.remove("hidden");
      setTimeout(() => toast?.classList.add("hidden"), 3000);
    } catch (error) {
      console.error("Error deleting battle:", error);
    }
  };

  useEffect(() => {
    fetchBattleHistory();
  }, []);

  const totalWins = battles.filter((b) => b.result.includes("You Win!")).length;
  const totalLosses = battles.filter((b) =>
    b.result.includes("You Lose!")
  ).length;
  const totalDraws = battles.filter((b) =>
    b.result.includes("It's a Draw!")
  ).length;
  const totalMatches = battles.length;

  // Determine battle type based on available data
  const getBattleMode = (battle) => {
    if (!battle) return "Unknown";

    if (battle.battleType) {
      if (battle.battleType === "classic") return "Classic Battle";
      if (battle.battleType === "stats") return "Stats Battle";
      return "Damage Based Battle";
    }

    // If battleType isn't explicitly stored, try to determine from available data
    if (
      battle.statsBased ||
      battle.result.toLowerCase().includes("stats based")
    ) {
      return "Stats Based";
    } else if (
      battle.typeBased ||
      battle.result.toLowerCase().includes("type based")
    ) {
      return "Type Based";
    } else if (
      battle.quizBased ||
      battle.result.toLowerCase().includes("quiz based")
    ) {
      return "Quiz Based";
    }

    return "Stats Based Battle"; // Default
  };

  // Filter battles based on selected filter
  const filteredBattles = battles.filter((battle) => {
    if (filterType === "all") return true;
    if (filterType === "wins") return battle.result.includes("You Win!");
    if (filterType === "losses") return battle.result.includes("You Lose!");
    if (filterType === "draws") return battle.result.includes("It's a Draw!");
    return true;
  });

  // Display appropriate result class for styling
  const getResultClass = (result) => {
    if (result.includes("You Win!")) return "text-green-700 font-black";
    if (result.includes("You Lose!")) return "text-red-700 font-black";
    return "text-amber-700 font-black";
  };

  return (
    <div className="min-h-screen bg-base-100">
      <Navbar />
      <div className="container mx-auto p-4">
        <section className="game-panel-blue my-6 p-5 text-center">
          <p className="text-sm font-black uppercase text-blue-800">Trainer records</p>
          <h2 className="pokemon-title text-4xl text-yellow-300 sm:text-5xl">Battle History</h2>
        </section>

        {/* Stats Summary Card */}
        <div className="stats mb-8 w-full overflow-hidden border-4 border-slate-900 bg-white text-slate-950 shadow-[0_4px_0_#94a3b8]">
          <div className="stat">
            <div className="stat-title font-black text-slate-600">Total Matches</div>
            <div className="stat-value text-blue-950">{totalMatches}</div>
          </div>

          <div className="stat">
            <div className="stat-title font-black text-slate-600">Wins</div>
            <div className="stat-value text-green-700">{totalWins}</div>
            <div className="stat-desc">
              {totalMatches > 0
                ? `${Math.round((totalWins / totalMatches) * 100)}%`
                : "0%"}
            </div>
          </div>

          <div className="stat">
            <div className="stat-title font-black text-slate-600">Losses</div>
            <div className="stat-value text-red-700">{totalLosses}</div>
            <div className="stat-desc">
              {totalMatches > 0
                ? `${Math.round((totalLosses / totalMatches) * 100)}%`
                : "0%"}
            </div>
          </div>

          <div className="stat">
            <div className="stat-title font-black text-slate-600">Draws</div>
            <div className="stat-value text-amber-700">{totalDraws}</div>
            <div className="stat-desc">
              {totalMatches > 0
                ? `${Math.round((totalDraws / totalMatches) * 100)}%`
                : "0%"}
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          <button
            className={`btn ${filterType === "all" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setFilterType("all")}
          >
            All Battles
          </button>
          <button
            className={`btn ${filterType === "wins" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setFilterType("wins")}
          >
            Wins
          </button>
          <button
            className={`btn ${filterType === "losses" ? "btn-error" : "btn-outline"}`}
            onClick={() => setFilterType("losses")}
          >
            Losses
          </button>
          <button
            className={`btn ${filterType === "draws" ? "btn-warning" : "btn-outline"}`}
            onClick={() => setFilterType("draws")}
          >
            Draws
          </button>
        </div>

        {battles.length === 0 ? (
          <div className="alert alert-info">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span>
              No battles recorded yet. Start battling to see your history!
            </span>
          </div>
        ) : filteredBattles.length === 0 ? (
          <div className="alert alert-info">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span>No battles match the selected filter.</span>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBattles.map((battle) => (
              <div
                key={battle.id}
                className="card border-4 border-slate-900 bg-white text-slate-950 shadow-[0_4px_0_#94a3b8] transition duration-200 hover:-translate-y-1 hover:shadow-[0_8px_0_#64748b]"
              >
                <div className="card-body p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="card-title text-lg">
                        {battle.pokemon1} vs {battle.pokemon2}
                      </h3>
                      <div className="badge badge-outline mt-1 border-slate-900 font-black text-blue-950">
                        {getBattleMode(battle)}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className={getResultClass(battle.result)}>
                        {battle.result}
                      </div>
                      <div className="text-sm font-semibold text-slate-600">
                        {dayjs(battle.date).format("MMM D, YYYY h:mm A")}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        className="btn btn-sm btn-error"
                        onClick={() => setSelectedBattle(battle)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DaisyUI Modal for confirmation */}
      {selectedBattle && (
        <dialog id="delete_modal" className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirm Deletion</h3>
            <p className="py-4">
              Are you sure you want to delete the battle between{" "}
              <strong>{selectedBattle.pokemon1}</strong> and{" "}
              <strong>{selectedBattle.pokemon2}</strong>?
            </p>
            <div className="modal-action">
              <button className="btn" onClick={() => setSelectedBattle(null)}>
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={() => handleDelete(selectedBattle.id)}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* DaisyUI Toast */}
      <div id="toast-delete" className="toast toast-top toast-end hidden z-50">
        <div className="alert alert-success">
          <span>Battle record deleted successfully.</span>
        </div>
      </div>
    </div>
  );
};
