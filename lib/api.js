"use client";

// Ponte entre a interface e o endpoint único /api/ai.
// O navegador só fala com a sua própria rota; a chave da OpenAI fica no servidor.

import { useState, useRef, useCallback } from "react";

/* ---- Chat + correção (tutor) -> { reply, translation, correction } ---- */
export async function tutorReply(apiMessages, profile, chatMode = "free") {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "tutor",
      chatMode,
      messages: apiMessages,
      level: profile?.level || "B1",
      goal: profile?.goalLabel || "Conversação",
    }),
  });
  if (!res.ok) throw new Error("chat_failed");
  return res.json();
}

/* ---- Aula de gramática gerada pela IA -> { title, explanation, rules, examples, tip } ---- */
export async function grammarLesson(topic, profile) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "grammar", topic, level: profile?.level || "B1" }),
  });
  if (!res.ok) throw new Error("grammar_failed");
  return res.json();
}

/* ---- Vocabulário gerado pela IA -> { words: [{word, translation, example, synonyms, antonyms}] } ---- */
export async function generateVocab(category, profile, exclude = [], count = 8) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "vocab", category, level: profile?.level || "B1", count, exclude }),
  });
  if (!res.ok) throw new Error("vocab_failed");
  return res.json();
}

/* ---- Mini-lição interativa -> { title, intro, questions:[{q, options, answer, explain}] } ---- */
export async function lessonContent(topic, profile) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "lesson", topic, level: profile?.level || "B1" }),
  });
  if (!res.ok) throw new Error("lesson_failed");
  return res.json();
}

/* ---- Role-play (simulações) -> texto em inglês ---- */
export async function roleReply(apiMessages, scenario, profile) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "role",
      messages: apiMessages,
      level: profile?.level || "B1",
      scenarioRole: scenario.role,
      opener: scenario.opener,
    }),
  });
  if (!res.ok) throw new Error("role_failed");
  const data = await res.json();
  return data.reply || "(Sorry, could you say that again?)";
}

/* ---- Tradução sob demanda (EN -> PT) ---- */
export async function translateText(text) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "translate", text }),
  });
  if (!res.ok) throw new Error("translate_failed");
  const data = await res.json();
  return data.translation || "";
}

/* ---- Falar (TTS) -> toca o áudio em qualquer navegador ---- */
let currentAudio = null;
export async function speak(text, onend) {
  try {
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "tts", text }),
    });
    if (!res.ok) throw new Error("tts_failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = () => { URL.revokeObjectURL(url); if (currentAudio === audio) currentAudio = null; if (onend) onend(); };
    await audio.play();
  } catch (e) {
    if (onend) onend();
  }
}

/* ---- Gravar voz -> Whisper. Mesma "cara" do antigo useSpeech ----
   { supported, listening, transcript, busy, start(onResult), stop } */
const MAX_RECORD_MS = 15000;

export function useRecorder() {
  const supported =
    typeof window !== "undefined" &&
    !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) &&
    typeof window.MediaRecorder !== "undefined";

  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState("");

  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const onResRef = useRef(null);
  const timerRef = useRef(null);

  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const start = useCallback(async (onResult) => {
    if (!supported) return;
    onResRef.current = onResult;
    setTranscript("");
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      recRef.current = rec;

      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        setListening(false);
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        cleanupStream();
        if (!blob.size) { onResRef.current && onResRef.current(""); return; }
        setBusy(true);
        try {
          const fd = new FormData();
          fd.append("audio", blob, "speech.webm");
          const res = await fetch("/api/ai", { method: "POST", body: fd });
          const data = await res.json();
          const text = (data.text || "").trim();
          setTranscript(text);
          onResRef.current && onResRef.current(text);
        } catch (e) {
          onResRef.current && onResRef.current("");
        }
        setBusy(false);
      };

      rec.start();
      setListening(true);
      timerRef.current = setTimeout(() => {
        try { if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop(); } catch (e) {}
      }, MAX_RECORD_MS);
    } catch (e) {
      setListening(false);
      cleanupStream();
    }
  }, [supported]);

  const stop = useCallback(() => {
    try { if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop(); } catch (e) {}
  }, []);

  return { supported, listening, transcript, busy, start, stop };
}
