import axios from "axios";

const localApi = axios.create({
  baseURL: import.meta.env.VITE_JSON_SERVER_URL || "http://localhost:3001",
  timeout: 2500,
});

const storageKeys = {
  team: "pokehub:team",
  battles: "pokehub:battles",
  settings: "pokehub:settings",
};

function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function withId(record) {
  return { ...record, id: record.id || crypto.randomUUID() };
}

export async function fetchTeam() {
  try {
    const response = await localApi.get("/team");
    return writeStorage(storageKeys.team, response.data);
  } catch (error) {
    console.warn("Team server unavailable. Falling back to localStorage.", error);
    return readStorage(storageKeys.team, []);
  }
}

export async function addTeamMember(member) {
  const record = withId(member);
  try {
    const response = await localApi.post("/team", record);
    const team = readStorage(storageKeys.team, []);
    writeStorage(storageKeys.team, [...team.filter((item) => item.id !== response.data.id), response.data]);
    return response.data;
  } catch (error) {
    console.warn("Team server unavailable. Saving team member locally.", error);
    const team = readStorage(storageKeys.team, []);
    writeStorage(storageKeys.team, [...team, record]);
    return record;
  }
}

export async function removeTeamMember(id) {
  const team = readStorage(storageKeys.team, []);
  writeStorage(storageKeys.team, team.filter((member) => member.id !== id));
  try {
    await localApi.delete(`/team/${id}`);
  } catch (error) {
    console.warn("Team server unavailable. Removed team member locally.", error);
  }
}

export async function saveTeamOrder(team) {
  writeStorage(storageKeys.team, team);
  try {
    await Promise.all(team.map((member, index) => localApi.patch(`/team/${member.id}`, { order: index })));
  } catch (error) {
    console.warn("Team server unavailable. Saved team order locally.", error);
  }
}

export async function fetchBattles() {
  try {
    const response = await localApi.get("/battles");
    return writeStorage(storageKeys.battles, response.data);
  } catch (error) {
    console.warn("Battle history server unavailable. Falling back to localStorage.", error);
    return readStorage(storageKeys.battles, []);
  }
}

export async function saveBattle(battle) {
  const record = withId(battle);
  const battles = readStorage(storageKeys.battles, []);
  writeStorage(storageKeys.battles, [record, ...battles]);
  try {
    await localApi.post("/battles", record);
  } catch (error) {
    console.warn("Battle result was saved locally because the local server is unavailable.", error);
  }
}

export async function deleteBattle(id) {
  const battles = readStorage(storageKeys.battles, []);
  writeStorage(storageKeys.battles, battles.filter((battle) => battle.id !== id));
  try {
    await localApi.delete(`/battles/${id}`);
  } catch (error) {
    console.warn("Battle server unavailable. Deleted battle locally.", error);
  }
}

export async function fetchSettings() {
  try {
    const response = await localApi.get("/settings");
    const settings = Array.isArray(response.data) ? response.data[0] : response.data;
    return writeStorage(storageKeys.settings, settings || {});
  } catch {
    return readStorage(storageKeys.settings, {});
  }
}

export async function saveSettings(settings) {
  writeStorage(storageKeys.settings, settings);
  try {
    const current = await localApi.get("/settings");
    const existing = Array.isArray(current.data) ? current.data[0] : current.data;
    if (existing?.id) {
      await localApi.put(`/settings/${existing.id}`, { ...settings, id: existing.id });
    } else {
      await localApi.post("/settings", settings);
    }
  } catch (error) {
    console.warn("Settings server unavailable. Saved settings locally.", error);
  }
}
