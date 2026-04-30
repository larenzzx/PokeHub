import axios from "axios";

const localApi = axios.create({
  baseURL: "http://localhost:3001",
  timeout: 2500,
});

export async function fetchTeam() {
  try {
    const response = await localApi.get("/team");
    return response.data;
  } catch (error) {
    console.warn("Team server unavailable. Start `npm run server` to persist team data.", error);
    return [];
  }
}

export async function addTeamMember(member) {
  const response = await localApi.post("/team", member);
  return response.data;
}

export async function removeTeamMember(id) {
  await localApi.delete(`/team/${id}`);
}

export async function fetchBattles() {
  try {
    const response = await localApi.get("/battles");
    return response.data;
  } catch (error) {
    console.warn("Battle history server unavailable. Start `npm run server` to persist history.", error);
    return [];
  }
}

export async function saveBattle(battle) {
  try {
    await localApi.post("/battles", battle);
  } catch (error) {
    console.warn("Battle result was not persisted because the local server is unavailable.", error);
  }
}

export async function deleteBattle(id) {
  await localApi.delete(`/battles/${id}`);
}

