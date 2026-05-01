import { useCallback, useEffect, useRef, useState } from "react";

const AUDIO_FILES = {
  main: "/audio/main-theme.mp3",
  battle: "/audio/battle-theme.mp3",
  start: "/audio/battle-start.mp3",
  attack: "/audio/attack.mp3",
  win: "/audio/win.mp3",
  lose: "/audio/lose.mp3",
  click: "/audio/click.mp3",
};

export function useBattleAudio() {
  const savedSettings = readSavedSettings();
  const [enabled, setEnabled] = useState(Boolean(savedSettings.soundEnabled));
  const [muted, setMuted] = useState(savedSettings.soundEnabled === false);
  const [volume, setVolume] = useState(Number(savedSettings.volume ?? 0.45));
  const tracks = useRef({});
  const audioContext = useRef(null);

  const getTrack = useCallback((name) => {
    if (!tracks.current[name]) {
      const audio = new Audio(AUDIO_FILES[name]);
      audio.preload = "none";
      audio.volume = volume;
      audio.onerror = () => {
        tracks.current[name] = null;
      };
      tracks.current[name] = audio;
    }
    return tracks.current[name];
  }, [volume]);

  useEffect(() => {
    Object.values(tracks.current).forEach((track) => {
      if (track) {
        track.volume = muted ? 0 : volume;
      }
    });
  }, [muted, volume]);

  const syntheticBeep = useCallback((frequency = 440, duration = 0.12) => {
    if (muted) return;
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      audioContext.current ||= new Context();
      const ctx = audioContext.current;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.value = volume * 0.18;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + duration);
    } catch {
      // Audio is optional; silently ignore browser or device failures.
    }
  }, [muted, volume]);

  const play = useCallback(async (name) => {
    if (muted) return;
    setEnabled(true);
    const track = getTrack(name);
    if (!track) {
      syntheticBeep(name === "attack" ? 260 : 520, 0.16);
      return;
    }

    try {
      track.currentTime = 0;
      await track.play();
    } catch {
      syntheticBeep(name === "attack" ? 260 : 520, 0.16);
    }
  }, [getTrack, muted, syntheticBeep]);

  const playLoop = useCallback(async (name) => {
    if (muted) return;
    setEnabled(true);
    const track = getTrack(name);
    if (!track) return;
    try {
      track.loop = true;
      track.volume = volume * 0.55;
      await track.play();
    } catch {
      syntheticBeep(330, 0.12);
    }
  }, [getTrack, muted, syntheticBeep, volume]);

  const stop = useCallback((name) => {
    const track = tracks.current[name];
    if (track) {
      track.pause();
      track.currentTime = 0;
    }
  }, []);

  const enableSound = useCallback(() => {
    setEnabled(true);
    setMuted(false);
    syntheticBeep(620, 0.08);
  }, [syntheticBeep]);

  return {
    enabled,
    muted,
    volume,
    setVolume,
    setMuted,
    enableSound,
    play,
    playLoop,
    stop,
  };
}

function readSavedSettings() {
  try {
    return JSON.parse(localStorage.getItem("pokehub:settings")) || {};
  } catch {
    return {};
  }
}
