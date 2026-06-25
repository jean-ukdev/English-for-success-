"use client";

// Persistência local do estado do app (localStorage).
// Tudo é guardado num ÚNICO "snapshot" JSON — o mesmo formato que vamos
// enviar pro Supabase no futuro, então a migração depois fica trivial.

const KEY = "efs:v1"; // English for Success — versão 1 do schema local

// Lê o snapshot salvo. Retorna o objeto ou null se não houver/der erro.
export function loadSnapshot() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

// Salva o snapshot. (Sets já devem vir convertidos em arrays pelo App.)
export function saveSnapshot(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {}
}

// Limpa tudo — usado no "Recomeçar do início".
export function clearSnapshot() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {}
}
