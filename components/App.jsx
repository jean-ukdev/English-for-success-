"use client";

import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from "react";
import {
  MessageCircle, Mic, Languages, BookOpen, BarChart3, Flame, Star, Check, X, Send,
  Volume2, Target, Zap, Plus, Heart, ChevronRight, ArrowRight, ArrowLeft, Plane,
  Briefcase, Utensils, BedDouble, ShoppingBag, Landmark, Building2, Loader2, RotateCcw,
  User, Globe, GraduationCap, Sparkles, Crown, Lock, PartyPopper, Wand2, Trophy, RefreshCw, Lightbulb,
  Stethoscope, Home, Bus, Flag, Map, Dumbbell
} from "lucide-react";
// Backend integration: AI chat + correction (/api/chat), text-to-speech (/api/tts),
// speech-to-text recording (/api/stt). useRecorder mirrors the old useSpeech API.
import { tutorReply, roleReply, speak, useRecorder as useSpeech, grammarLesson, generateVocab, lessonContent, translateText } from "../lib/api";
import { loadSnapshot, saveSnapshot, clearSnapshot } from "../lib/persist";

/* ----------------------------------------------------------------------------
   English for Success — Aprenda inglês com IA
   Tutor de IA ao vivo (Claude) + voz nativa do navegador
---------------------------------------------------------------------------- */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');

.falo{
  --paper:#F4F0FB; --card:#FFFFFF; --ink:#221833; --ink2:#5A4F73; --ink3:#948BA8;
  --coral:#FF7A18; --coral-d:#E85F00; --lime:#A9DE2E; --lime-d:#7FB80F;
  --sky:#5C7CFA; --gold:#FFC24B; --line:#ECE5F4; --line2:#E0D7EC;
  --ok:#1F9D55; --err:#E5484D;
  --shadow: 0 18px 50px -22px rgba(34,24,51,.55);
  --shadow-s: 0 6px 18px -10px rgba(34,24,51,.40);
  font-family:'Inter',system-ui,sans-serif; color:var(--ink);
  -webkit-font-smoothing:antialiased; box-sizing:border-box;
}
.falo *,.falo *::before,.falo *::after{ box-sizing:border-box; }
.falo button{ font-family:inherit; cursor:pointer; border:none; background:none; color:inherit; }
.falo input{ font-family:inherit; }

.f-backdrop{
  min-height:100vh; width:100%;
  background:
    radial-gradient(1100px 520px at 12% -8%, rgba(255,122,24,.22), transparent 60%),
    radial-gradient(900px 520px at 105% 8%, rgba(255,122,24,.10), transparent 58%),
    linear-gradient(160deg,#0E1320 0%, #0A0E16 55%, #07090F 100%);
  display:flex; align-items:center; justify-content:center; padding:24px 16px;
}
.f-canvas{
  position:relative; width:100%; max-width:440px; height:min(880px,92vh);
  background:var(--paper); border-radius:30px; overflow:hidden;
  box-shadow:var(--shadow); display:flex; flex-direction:column; isolation:isolate;
}
@media (max-width:480px){
  .f-backdrop{ padding:0; }
  .f-canvas{ max-width:100%; height:100vh; min-height:100dvh; border-radius:0; }
}

.f-scroll{ flex:1; overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch; }
.f-pad{ padding:18px 18px 26px; }

/* type */
.f-display{ font-family:'Space Grotesk',sans-serif; font-weight:800; letter-spacing:-.02em; line-height:1.02; }
.f-h1{ font-family:'Space Grotesk',sans-serif; font-weight:800; font-size:26px; letter-spacing:-.02em; line-height:1.05; }
.f-h2{ font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:19px; letter-spacing:-.01em; }
.f-eyebrow{ font-size:11px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:var(--coral); }
.f-muted{ color:var(--ink2); }
.f-faint{ color:var(--ink3); }
.f-mono{ font-family:'Space Mono',monospace; }

/* top bar */
.f-top{ display:flex; align-items:center; justify-content:space-between; padding:14px 16px 12px;
  background:linear-gradient(180deg,rgba(255,255,255,.9),rgba(255,255,255,.55)); backdrop-filter:blur(8px);
  border-bottom:1px solid var(--line); position:relative; z-index:5; }
.f-brand{ display:flex; align-items:center; gap:9px; }
.f-logo{ width:30px; height:30px; border-radius:9px; display:grid; place-items:center; color:#fff;
  background:linear-gradient(135deg,var(--coral),#FFA040); box-shadow:0 6px 14px -6px rgba(255,122,24,.8); }
.f-brandname{ font-family:'Space Grotesk',sans-serif; font-weight:800; font-size:19px; letter-spacing:-.02em; }
.f-pillrow{ display:flex; align-items:center; gap:8px; }
.f-pill{ display:inline-flex; align-items:center; gap:5px; padding:5px 9px; border-radius:999px; font-size:12.5px; font-weight:800; }
.f-pill.flame{ background:#FFEDE6; color:var(--coral-d); }
.f-pill.xp{ background:#F0F9DA; color:var(--lime-d); }
.f-avatar-btn{ width:34px; height:34px; border-radius:50%; background:#fff; border:1px solid var(--line2);
  display:grid; place-items:center; color:var(--ink2); }

/* buttons */
.f-btn{ display:inline-flex; align-items:center; justify-content:center; gap:8px; font-weight:800;
  border-radius:14px; padding:13px 18px; font-size:15px; transition:transform .08s ease, box-shadow .15s; }
.f-btn:active{ transform:translateY(1px) scale(.99); }
.f-btn.primary{ background:var(--coral); color:#fff; box-shadow:0 12px 22px -12px rgba(255,122,24,.95); }
.f-btn.primary:disabled{ opacity:.5; box-shadow:none; }
.f-btn.dark{ background:var(--ink); color:#fff; }
.f-btn.ghost{ background:#fff; color:var(--ink); border:1px solid var(--line2); }
.f-btn.block{ width:100%; }
.f-btn.lime{ background:var(--lime); color:#243a00; box-shadow:0 12px 22px -12px rgba(169,222,46,.9); }

/* chips */
.f-chip{ border:1.5px solid var(--line2); background:#fff; border-radius:14px; padding:12px 13px; text-align:left;
  display:flex; align-items:center; gap:11px; font-weight:700; font-size:14.5px; transition:.12s; }
.f-chip:hover{ border-color:#cdbfe0; }
.f-chip.on{ border-color:var(--coral); background:#FFF3EF; box-shadow:0 8px 18px -12px rgba(255,122,24,.7); }
.f-chip .ic{ width:34px; height:34px; border-radius:10px; display:grid; place-items:center; background:#F4EEFB; color:var(--ink); flex:none; }
.f-chip.on .ic{ background:var(--coral); color:#fff; }

.f-card{ background:var(--card); border:1px solid var(--line); border-radius:18px; box-shadow:var(--shadow-s); }
.f-grid2{ display:grid; grid-template-columns:1fr 1fr; gap:11px; }

/* chat bubbles */
.f-chat{ display:flex; flex-direction:column; gap:14px; padding:18px 16px 14px; }
.f-row{ display:flex; gap:9px; align-items:flex-end; animation:rise .28s ease both; }
.f-row.me{ justify-content:flex-end; }
@keyframes rise{ from{opacity:0; transform:translateY(8px);} to{opacity:1; transform:none;} }
.f-av{ width:28px; height:28px; border-radius:50%; flex:none; display:grid; place-items:center; color:#fff;
  background:linear-gradient(135deg,var(--coral),#FFA040); box-shadow:0 5px 12px -6px rgba(255,122,24,.8); }
.f-bubblewrap{ max-width:80%; display:flex; flex-direction:column; gap:7px; }
.f-bubble{ padding:11px 14px; border-radius:18px; font-size:15px; line-height:1.42; }
.f-bubble.ai{ background:#fff; border:1px solid var(--line); border-bottom-left-radius:6px; box-shadow:var(--shadow-s); }
.f-bubble.me{ background:var(--ink); color:#fff; border-bottom-right-radius:6px; }
.f-bubble .name{ font-size:11px; font-weight:800; color:var(--coral); letter-spacing:.04em; margin-bottom:2px; }
.f-bubactions{ display:flex; gap:8px; padding-left:2px; }
.f-tiny{ display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:800; color:var(--ink2);
  background:#fff; border:1px solid var(--line2); border-radius:999px; padding:4px 9px; }
.f-tiny.on{ background:#EEF1FF; color:var(--sky); border-color:#cdd6ff; }
.f-trans{ font-size:13px; color:var(--ink2); background:#F3EEFA; border:1px solid var(--line2);
  border-radius:12px; padding:8px 11px; border-bottom-left-radius:5px; }

/* correction card */
.f-corr{ background:#FFFCF4; border:1px solid #F0E6C9; border-radius:14px; padding:11px 12px; box-shadow:var(--shadow-s); }
.f-corr .hd{ display:flex; align-items:center; gap:6px; font-size:11px; font-weight:800; letter-spacing:.06em;
  text-transform:uppercase; color:#B98900; margin-bottom:7px; }
.f-diff{ font-family:'Space Mono',monospace; font-size:13.5px; line-height:1.5; }
.f-diff .o{ color:var(--err); }
.f-diff .o s{ opacity:.75; }
.f-diff .c{ color:var(--ok); font-weight:700; }
.f-corr .exp{ font-size:13px; color:var(--ink2); margin-top:7px; }
.f-good{ display:flex; align-items:center; gap:7px; font-size:12.5px; font-weight:700; color:var(--ok);
  background:#EFFaf0; border:1px solid #cdebd6; border-radius:12px; padding:7px 11px; }

/* input bar */
.f-inputbar{ border-top:1px solid var(--line); background:#fff; padding:10px 12px calc(10px + env(safe-area-inset-bottom)); }
.f-inputrow{ display:flex; align-items:flex-end; gap:9px; }
.f-input{ flex:1; border:1.5px solid var(--line2); border-radius:16px; padding:11px 14px; font-size:15px;
  outline:none; resize:none; max-height:120px; line-height:1.4; transition:border-color .15s; background:#FBF9FE; }
.f-input:focus{ border-color:var(--coral); background:#fff; }
.f-iconbtn{ width:44px; height:44px; border-radius:14px; flex:none; display:grid; place-items:center;
  background:#F4EEFB; color:var(--ink); }
.f-iconbtn.send{ background:var(--coral); color:#fff; }
.f-iconbtn.live{ background:var(--coral); color:#fff; animation:pulseBtn 1.1s infinite; }
@keyframes pulseBtn{ 0%,100%{ box-shadow:0 0 0 0 rgba(255,122,24,.45);} 50%{ box-shadow:0 0 0 8px rgba(255,122,24,0);} }

/* tabbar */
.f-tabbar{ display:flex; background:#fff; border-top:1px solid var(--line);
  padding:7px 2px calc(7px + env(safe-area-inset-bottom)); position:relative; z-index:5; }
.f-tab{ flex:1; min-width:0; display:flex; flex-direction:column; align-items:center; gap:4px; padding:7px 2px; color:var(--ink3); }
.f-tab .lab{ font-size:11.5px; font-weight:800; letter-spacing:-.01em; max-width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.f-tab.on{ color:var(--coral); }
.f-tab .dot{ width:5px; height:5px; border-radius:50%; background:transparent; }
.f-tab.on .dot{ background:var(--coral); }

/* mic orb */
.f-orbwrap{ display:flex; flex-direction:column; align-items:center; gap:0; }
.f-orb{ position:relative; width:148px; height:148px; border-radius:50%; display:grid; place-items:center; }
.f-orb .core{ width:108px; height:108px; border-radius:50%; display:grid; place-items:center; color:#fff;
  background:linear-gradient(150deg,var(--coral),#FF8E5E); box-shadow:0 18px 36px -14px rgba(255,122,24,.85); transition:.2s; z-index:2; }
.f-orb.live .core{ background:linear-gradient(150deg,var(--coral-d),var(--coral)); }
.f-orb .ring{ position:absolute; inset:0; border-radius:50%; border:2px solid rgba(255,122,24,.5); opacity:0; }
.f-orb.live .ring{ animation:ripple 1.8s infinite ease-out; }
.f-orb.live .ring.r2{ animation-delay:.6s; }
.f-orb.live .ring.r3{ animation-delay:1.2s; }
@keyframes ripple{ 0%{ transform:scale(.7); opacity:.6;} 100%{ transform:scale(1.25); opacity:0;} }

/* xp bar / rings / chart */
.f-xpbar{ height:11px; background:#EEE6F6; border-radius:999px; overflow:hidden; }
.f-xpfill{ height:100%; background:linear-gradient(90deg,var(--lime),var(--lime-d)); border-radius:999px; transition:width .5s ease; }
.f-stat{ background:#fff; border:1px solid var(--line); border-radius:16px; padding:13px; box-shadow:var(--shadow-s); }
.f-statnum{ font-family:'Space Grotesk',sans-serif; font-weight:800; font-size:24px; line-height:1; }
.f-statlab{ font-size:11.5px; color:var(--ink2); font-weight:700; margin-top:3px; }
.f-bars{ display:flex; align-items:flex-end; gap:8px; height:96px; }
.f-bar{ flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; height:100%; justify-content:flex-end; }
.f-barfill{ width:100%; border-radius:7px 7px 4px 4px; background:linear-gradient(180deg,#FFA040,var(--coral)); min-height:5px; transition:height .5s; }
.f-barlab{ font-size:10px; font-weight:800; color:var(--ink3); }

.f-medal{ width:46px; height:46px; border-radius:13px; display:grid; place-items:center; color:#fff; flex:none; }
.f-badge{ display:flex; align-items:center; gap:11px; padding:11px; border-radius:14px; border:1px solid var(--line); background:#fff; }
.f-badge.locked{ opacity:.55; }
.f-badge .bic{ width:42px; height:42px; border-radius:12px; display:grid; place-items:center; flex:none; }

/* sheets */
.f-overlay{ position:absolute; inset:0; z-index:30; background:rgba(26,18,39,.5); backdrop-filter:blur(2px);
  display:flex; align-items:flex-end; animation:fade .2s ease; }
@keyframes fade{ from{opacity:0;} to{opacity:1;} }
.f-sheet{ width:100%; background:var(--paper); border-radius:24px 24px 0 0; max-height:88%; overflow-y:auto;
  padding:8px 18px calc(22px + env(safe-area-inset-bottom)); animation:slideup .26s cubic-bezier(.2,.8,.2,1); }
@keyframes slideup{ from{ transform:translateY(100%);} to{ transform:none;} }
.f-handle{ width:40px; height:4px; border-radius:999px; background:var(--line2); margin:8px auto 14px; }

/* plan card */
.f-plan{ border:1.5px solid var(--line2); border-radius:18px; padding:15px; background:#fff; }
.f-plan.feat{ border-color:var(--coral); background:linear-gradient(180deg,#FFF6F3,#fff); box-shadow:0 16px 30px -20px rgba(255,122,24,.6); }
.f-price{ font-family:'Space Grotesk',sans-serif; font-weight:800; font-size:30px; letter-spacing:-.02em; }
.f-feat{ display:flex; align-items:flex-start; gap:8px; font-size:13.5px; color:var(--ink2); font-weight:600; margin-top:8px; }
.f-feat .ck{ width:18px; height:18px; border-radius:50%; background:#EFFaf0; color:var(--ok); display:grid; place-items:center; flex:none; margin-top:1px; }

/* toasts */
.f-toasts{ position:absolute; top:0; left:0; right:0; z-index:60; display:flex; flex-direction:column; align-items:center; gap:8px; padding:12px; pointer-events:none; }
.f-toast{ background:var(--ink); color:#fff; border-radius:14px; padding:10px 14px; font-size:13.5px; font-weight:700;
  box-shadow:var(--shadow); display:flex; align-items:center; gap:9px; animation:toastIn .3s ease; max-width:340px; }
.f-toast .ti{ width:26px; height:26px; border-radius:8px; display:grid; place-items:center; flex:none; }
@keyframes toastIn{ from{opacity:0; transform:translateY(-10px) scale(.96);} to{opacity:1; transform:none;} }

.f-dots{ display:inline-flex; gap:4px; align-items:center; }
.f-dots span{ width:7px; height:7px; border-radius:50%; background:var(--ink3); animation:bounce 1.2s infinite; }
.f-dots span:nth-child(2){ animation-delay:.2s; } .f-dots span:nth-child(3){ animation-delay:.4s; }
@keyframes bounce{ 0%,80%,100%{ transform:translateY(0); opacity:.4;} 40%{ transform:translateY(-4px); opacity:1;} }

.f-seg{ display:flex; background:#EEE6F6; border-radius:12px; padding:3px; }
.f-seg button{ flex:1; padding:7px; border-radius:9px; font-size:12.5px; font-weight:800; color:var(--ink2); }
.f-seg button.on{ background:#fff; color:var(--ink); box-shadow:var(--shadow-s); }

.f-progdot{ display:flex; gap:6px; justify-content:center; margin:2px 0 18px; }
.f-progdot i{ width:7px; height:7px; border-radius:999px; background:var(--line2); transition:.2s; }
.f-progdot i.on{ background:var(--coral); width:20px; }

.f-link{ color:var(--coral); font-weight:800; }
.f-divider{ height:1px; background:var(--line); margin:14px 0; }

@media (prefers-reduced-motion: reduce){
  .falo *{ animation:none !important; transition:none !important; }
}
`;

/* ----------------------------- data ----------------------------- */
const GOALS = [
  { id: "viagem", label: "Viagem", sub: "Aeroporto, hotel, passeios", icon: Plane },
  { id: "trabalho", label: "Trabalho", sub: "Reuniões e e-mails", icon: Briefcase },
  { id: "entrevista", label: "Entrevista de emprego", sub: "Se sair bem em inglês", icon: GraduationCap },
  { id: "conversacao", label: "Conversação", sub: "Falar com naturalidade", icon: MessageCircle },
  { id: "negocios", label: "Negócios", sub: "Vocabulário corporativo", icon: Building2 },
  { id: "imigracao", label: "Imigração", sub: "Vida no exterior", icon: Globe },
];
const GOAL_FOCUS = {
  viagem: ["Frases de aeroporto, hotel e restaurante", "Pedir informações e direções", "Small talk com estrangeiros"],
  trabalho: ["Vocabulário de reuniões", "E-mails e mensagens profissionais", "Apresentar ideias com clareza"],
  entrevista: ["Responder no método STAR", "Falar sobre experiências e forças", "Simulações de entrevista"],
  conversacao: ["Fluência no dia a dia", "Expressões idiomáticas comuns", "Pronúncia e ritmo"],
  negocios: ["Termos de negócios e finanças", "Negociação e apresentações", "Reuniões com clientes"],
  imigracao: ["Inglês para serviços públicos", "Banco, saúde e moradia", "Conversas do cotidiano"],
};

const PLACEMENT = [
  { q: "She ___ a teacher.", opts: ["is", "are", "am", "be"], a: 0, lvl: "A1" },
  { q: "I ___ to the beach last weekend.", opts: ["go", "went", "gone", "going"], a: 1, lvl: "A2" },
  { q: "If it rains tomorrow, we ___ stay home.", opts: ["will", "would", "are", "was"], a: 0, lvl: "A2" },
  { q: "I've lived in this city ___ 2010.", opts: ["since", "for", "from", "during"], a: 0, lvl: "B1" },
  { q: "By the time we arrived, the movie ___.", opts: ["started", "has started", "had started", "starts"], a: 2, lvl: "B2" },
  { q: "Hardly ___ down when the phone rang.", opts: ["I had sat", "had I sat", "I sat", "did I sit"], a: 1, lvl: "C1" },
];
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LEVEL_NAMES = { A1: "Iniciante", A2: "Básico", B1: "Pré-intermediário", B2: "Intermediário", C1: "Avançado", C2: "Proficiente" };

const VOCAB = [
  { cat: "Viagem", icon: Plane, words: [
    { w: "boarding pass", t: "cartão de embarque", ex: "Please have your boarding pass ready." },
    { w: "luggage", t: "bagagem", ex: "I think they lost my luggage." },
    { w: "aisle seat", t: "assento no corredor", ex: "I'd like an aisle seat, please." },
    { w: "round trip", t: "ida e volta", ex: "I booked a round trip to London." },
    { w: "delayed", t: "atrasado", ex: "Our flight was delayed by two hours." },
  ]},
  { cat: "Negócios", icon: Briefcase, words: [
    { w: "deadline", t: "prazo", ex: "We have to meet the deadline by Friday." },
    { w: "revenue", t: "receita", ex: "Our revenue grew by twenty percent." },
    { w: "stakeholder", t: "parte interessada", ex: "We need every stakeholder to approve it." },
    { w: "proposal", t: "proposta", ex: "I'll send you the proposal tomorrow." },
    { w: "follow up", t: "dar continuidade", ex: "Let me follow up on that next week." },
  ]},
  { cat: "Restaurante", icon: Utensils, words: [
    { w: "the bill", t: "a conta", ex: "Could we have the bill, please?" },
    { w: "starter", t: "entrada", ex: "I'll have soup as a starter." },
    { w: "medium rare", t: "ao ponto para mal", ex: "I'd like my steak medium rare." },
    { w: "to recommend", t: "recomendar", ex: "What would you recommend?" },
    { w: "tip", t: "gorjeta", ex: "We left a generous tip." },
  ]},
  { cat: "Hotel", icon: BedDouble, words: [
    { w: "check-in", t: "registro de entrada", ex: "What time is check-in?" },
    { w: "booking", t: "reserva", ex: "I have a booking under Silva." },
    { w: "vacancy", t: "vaga", ex: "Do you have any vacancies tonight?" },
    { w: "key card", t: "cartão-chave", ex: "My key card isn't working." },
    { w: "checkout", t: "saída", ex: "Checkout is at eleven o'clock." },
  ]},
  { cat: "Compras", icon: ShoppingBag, words: [
    { w: "discount", t: "desconto", ex: "Is there a discount on this one?" },
    { w: "receipt", t: "recibo", ex: "Can I have a receipt, please?" },
    { w: "fitting room", t: "provador", ex: "Where is the fitting room?" },
    { w: "refund", t: "reembolso", ex: "I'd like a refund for this." },
    { w: "sold out", t: "esgotado", ex: "Sorry, that size is sold out." },
  ]},
];

const SCENARIOS = [
  { id: "interview", label: "Entrevista de emprego", sub: "Você é o candidato", icon: Briefcase,
    opener: "Hi, thanks for coming in! So, to start, could you tell me a little about yourself?",
    role: "a friendly but professional hiring manager interviewing the user for a job they want" },
  { id: "airport", label: "Aeroporto", sub: "Check-in do voo", icon: Plane,
    opener: "Good morning! May I see your passport and tell me where you're flying to today?",
    role: "an airline check-in agent at the airport helping the user check in for a flight" },
  { id: "hotel", label: "Hotel", sub: "Recepção", icon: BedDouble,
    opener: "Welcome to The Grand Hotel! Do you have a reservation with us?",
    role: "a polite hotel receptionist checking the user into the hotel" },
  { id: "restaurant", label: "Restaurante", sub: "Pedindo comida", icon: Utensils,
    opener: "Good evening! Welcome. Can I start you off with something to drink?",
    role: "a waiter taking the user's order at a nice restaurant" },
  { id: "market", label: "Mercado", sub: "No caixa", icon: ShoppingBag,
    opener: "Hi there! Did you find everything you were looking for today?",
    role: "a cashier at a grocery store helping the user check out" },
  { id: "bank", label: "Banco", sub: "Abrindo conta", icon: Landmark,
    opener: "Hello! How can I help you today? Would you like to open a new account?",
    role: "a bank clerk helping the user open a bank account" },
];

// Detecta se o usuário está no Brasil (pelo fuso horário) para mostrar o preço em R$.
function isInBrazil() {
  try {
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || "").toLowerCase();
    return /sao_paulo|bahia|fortaleza|recife|manaus|belem|campo_grande|cuiaba|boa_vista|porto_velho|rio_branco|maceio|araguaina|santarem|noronha/.test(tz);
  } catch (e) { return false; }
}

const PLANS = [
  { id: "free", name: "Gratuito", gbp: "£0", brl: "R$ 0", per: "para sempre", feat: ["20 mensagens por dia no chat", "Trilhas e lições com IA", "Vocabulário e pronúncia"], cta: "Plano atual" },
  { id: "premium", name: "Premium", gbp: "£7", brl: "R$ 12", per: "/mês", feat: ["Conversas ilimitadas com o Delagassa", "Todas as trilhas e simulações", "Voz e pronúncia sem limite", "Tudo desbloqueado"], cta: "Assinar Premium", feat_flag: true },
];

const ACHIEVEMENTS = [
  { id: "first_chat", label: "Primeira conversa", desc: "Mandou a primeira mensagem", icon: MessageCircle, color: "#FF7A18", test: (s) => s.messages >= 1 },
  { id: "chatty", label: "Tagarela", desc: "10 mensagens enviadas", icon: Sparkles, color: "#5C7CFA", test: (s) => s.messages >= 10 },
  { id: "collector", label: "Colecionador", desc: "Aprendeu 10 palavras", icon: BookOpen, color: "#A9DE2E", test: (s) => s.wordsLearned >= 10 },
  { id: "voice", label: "Voz afiada", desc: "Completou a pronúncia", icon: Mic, color: "#FFC24B", test: (s) => s.pron >= 1 },
  { id: "actor", label: "No personagem", desc: "Terminou uma simulação", icon: Wand2, color: "#E85F00", test: (s) => s.sims >= 1 },
  { id: "fire", label: "Em chamas", desc: "3 dias seguidos", icon: Flame, color: "#FF7A18", test: (s) => s.streak >= 3 },
];

/* ----------------------------- helpers ----------------------------- */
// tutorReply, roleReply, speak and useSpeech (useRecorder) now live in ../lib/api
// and talk to the OpenAI-powered backend routes. scorePron stays here — it grades
// the Whisper transcript against the target phrase.
function scorePron(target, said) {
  const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9'\s]/g, "").split(/\s+/).filter(Boolean);
  const t = norm(target), u = norm(said);
  if (!u.length) return { overall: 0, pron: 0, fluency: 0, clarity: 0, t, matched: t.map(() => false) };
  const pool = [...u]; let hit = 0; const matched = [];
  t.forEach((w) => { const i = pool.indexOf(w); if (i >= 0) { hit++; pool.splice(i, 1); matched.push(true); } else matched.push(false); });
  const base = Math.round((100 * hit) / t.length);
  const lenRatio = Math.min(1, u.length / Math.max(1, t.length));
  const pron = base;
  const clarity = Math.max(0, Math.min(100, Math.round(base * 0.65 + lenRatio * 35)));
  const fluency = Math.max(0, Math.min(100, Math.round(base * 0.55 + lenRatio * 45)));
  return { overall: Math.round((pron + clarity + fluency) / 3), pron, fluency, clarity, t, matched };
}

const medalFor = (xp) => xp >= 700 ? { n: "Diamante", c: "#6FD3E8" } : xp >= 300 ? { n: "Ouro", c: "#FFC24B" } : xp >= 100 ? { n: "Prata", c: "#B8C0CC" } : { n: "Bronze", c: "#CD8B5B" };
const tierMin = (xp) => xp >= 700 ? 700 : xp >= 300 ? 300 : xp >= 100 ? 100 : 0;
const tierMax = (xp) => xp >= 700 ? 1200 : xp >= 300 ? 700 : xp >= 100 ? 300 : 100;

/* ----------------------------- context ----------------------------- */
const Ctx = createContext(null);
const useApp = () => useContext(Ctx);

/* ============================ ONBOARDING ============================ */
function Welcome({ onNext }) {
  return (
    <div className="f-scroll">
      <div className="f-pad" style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 22 }}>
          <div className="f-brand">
            <div className="f-logo" style={{ width: 40, height: 40, borderRadius: 12 }}><Sparkles size={22} /></div>
            <span className="f-brandname" style={{ fontSize: 19 }}>English for Success</span>
          </div>
          <div>
            <div className="f-eyebrow" style={{ marginBottom: 10 }}>Delagassa · seu novo mentor de inglês</div>
            <h1 className="f-display" style={{ fontSize: 40 }}>Aprenda inglês de verdade <span style={{ color: "var(--coral)" }}>conversando.</span></h1>
            <p className="f-muted" style={{ marginTop: 14, fontSize: 15.5, lineHeight: 1.5 }}>
              Converse por texto ou voz, receba correções na hora e tenha um plano feito pra você. Tudo em poucos minutos por dia.
            </p>
          </div>
          <div className="f-card f-pad" style={{ padding: 16 }}>
            {[
              { i: MessageCircle, t: "Tutor que responde como gente", c: "var(--coral)" },
              { i: Check, t: "Correção e explicação em português", c: "var(--ok)" },
              { i: Mic, t: "Fale e ouça com voz nativa", c: "var(--sky)" },
            ].map((f, k) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 11, padding: "7px 0" }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: "#F4EEFB", color: f.c, display: "grid", placeItems: "center" }}><f.i size={17} /></div>
                <span style={{ fontWeight: 700, fontSize: 14.5 }}>{f.t}</span>
              </div>
            ))}
          </div>
        </div>
        <button className="f-btn primary block" style={{ marginTop: 18 }} onClick={onNext}>Começar agora <ArrowRight size={18} /></button>
        <p className="f-faint" style={{ textAlign: "center", fontSize: 12, marginTop: 12 }}>Sem julgamento • No seu ritmo • Feito para brasileiros</p>
      </div>
    </div>
  );
}

function ProfileSetup({ onNext }) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState(null);
  return (
    <div className="f-scroll">
      <div className="f-pad">
        <div className="f-progdot"><i className="on" /><i /><i /></div>
        <h2 className="f-h1">Vamos te conhecer</h2>
        <p className="f-muted" style={{ marginTop: 6, marginBottom: 18 }}>Assim o Delagassa adapta tudo pra você.</p>

        <label className="f-faint" style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase" }}>Como podemos te chamar?</label>
        <input className="f-input" style={{ marginTop: 8, marginBottom: 22, width: "100%" }} placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} />

        <label className="f-faint" style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase" }}>Qual é o seu objetivo?</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 10 }}>
          {GOALS.map((g) => (
            <button key={g.id} className={"f-chip" + (goal === g.id ? " on" : "")} onClick={() => setGoal(g.id)}>
              <span className="ic"><g.icon size={18} /></span>
              <span style={{ flex: 1 }}>{g.label}<div className="f-faint" style={{ fontSize: 12, fontWeight: 600 }}>{g.sub}</div></span>
              {goal === g.id && <Check size={18} color="var(--coral)" />}
            </button>
          ))}
        </div>
        <button className="f-btn primary block" style={{ marginTop: 22 }} disabled={!name.trim() || !goal}
          onClick={() => onNext({ name: name.trim(), goal, goalLabel: GOALS.find((x) => x.id === goal).label })}>
          Continuar <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

function PlacementTest({ onNext }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [correct, setCorrect] = useState(0);
  const q = PLACEMENT[i];
  const choose = (idx) => {
    if (picked !== null) return;
    setPicked(idx);
    const ok = idx === q.a;
    setTimeout(() => {
      const nc = correct + (ok ? 1 : 0);
      if (i + 1 < PLACEMENT.length) { setI(i + 1); setPicked(null); setCorrect(nc); }
      else { const lvl = LEVELS[Math.min(nc, 5)]; onNext({ level: lvl, score: nc }); }
    }, 750);
  };
  return (
    <div className="f-scroll">
      <div className="f-pad">
        <div className="f-progdot"><i className="on" /><i className="on" /><i /></div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <h2 className="f-h2">Teste de nivelamento</h2>
          <span className="f-pill xp" style={{ background: "#F4EEFB", color: "var(--ink2)" }}>{i + 1} / {PLACEMENT.length}</span>
        </div>
        <div className="f-xpbar" style={{ marginBottom: 22 }}><div className="f-xpfill" style={{ width: `${((i) / PLACEMENT.length) * 100}%`, background: "linear-gradient(90deg,#FFA040,var(--coral))" }} /></div>

        <p className="f-faint" style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>Complete a frase</p>
        <div className="f-card f-pad" style={{ padding: 18, marginBottom: 18, fontSize: 19, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", letterSpacing: "-.01em" }}>{q.q}</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {q.opts.map((o, idx) => {
            const isPick = picked === idx, isAns = idx === q.a;
            let style = {};
            if (picked !== null) {
              if (isAns) style = { borderColor: "var(--ok)", background: "#EFFaf0" };
              else if (isPick) style = { borderColor: "var(--err)", background: "#FFF0F0" };
            }
            return (
              <button key={idx} className="f-chip" style={{ ...style, justifyContent: "space-between" }} onClick={() => choose(idx)}>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 15 }}>{o}</span>
                {picked !== null && isAns && <Check size={18} color="var(--ok)" />}
                {picked !== null && isPick && !isAns && <X size={18} color="var(--err)" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Result({ data, profile, onDone }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 250); return () => clearTimeout(t); }, []);
  const focus = GOAL_FOCUS[profile.goal] || [];
  const minutes = ["A1", "A2"].includes(data.level) ? 15 : data.level === "C1" || data.level === "C2" ? 30 : 20;
  return (
    <div className="f-scroll">
      <div className="f-pad" style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
        <div className="f-progdot"><i className="on" /><i className="on" /><i className="on" /></div>
        <div style={{ textAlign: "center", marginTop: 6 }}>
          <div style={{ display: "inline-grid", placeItems: "center", width: 58, height: 58, borderRadius: 18, background: "var(--lime)", color: "#243a00", marginBottom: 14 }}><PartyPopper size={30} /></div>
          <p className="f-eyebrow" style={{ color: "var(--lime-d)" }}>Seu nível é</p>
          <div className="f-display" style={{ fontSize: 64, transform: show ? "scale(1)" : "scale(.6)", opacity: show ? 1 : 0, transition: "all .5s cubic-bezier(.2,.9,.3,1.3)" }}>{data.level}</div>
          <p className="f-h2" style={{ marginTop: 2 }}>{LEVEL_NAMES[data.level]}</p>
          <p className="f-muted" style={{ fontSize: 14, marginTop: 6 }}>{data.score} de {PLACEMENT.length} corretas. Tudo certo, montei um plano pra você crescer a partir daqui.</p>
        </div>

        <div className="f-card f-pad" style={{ padding: 16, marginTop: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><Target size={17} color="var(--coral)" /><span className="f-h2" style={{ fontSize: 16 }}>Seu plano de estudos</span></div>
          <div className="f-grid2" style={{ marginBottom: 14 }}>
            <div className="f-stat"><div className="f-statnum">{minutes}<span style={{ fontSize: 14 }}>min</span></div><div className="f-statlab">por dia</div></div>
            <div className="f-stat"><div className="f-statnum">5<span style={{ fontSize: 14 }}>dias</span></div><div className="f-statlab">por semana</div></div>
          </div>
          <p className="f-faint" style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 8 }}>Foco para {profile.goalLabel}</p>
          {focus.map((f, k) => (
            <div className="f-feat" key={k}><span className="ck"><Check size={12} /></span><span>{f}</span></div>
          ))}
        </div>

        <button className="f-btn primary block" style={{ marginTop: "auto", marginBottom: 4 }} onClick={() => onDone(data.level)}>
          Falar com o Delagassa <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

/* ============================ CHAT ============================ */
const CHAT_MODES = [
  { id: "free", label: "Livre", icon: MessageCircle, en: "Hi {name}! I'm Delagassa, your new mentor. 😊 Let's chat — tell me, how was your day?", pt: "Oi {name}! Sou o Delagassa, seu novo mentor. 😊 Vamos conversar — como foi o seu dia?" },
  { id: "teacher", label: "Professor", icon: GraduationCap, en: "Hi {name}! I'm your English teacher. Send me any sentence and I'll correct it and explain. What would you like to start with?", pt: "Oi {name}! Sou seu professor. Me manda qualquer frase que eu corrijo e explico. Por onde quer começar?" },
  { id: "interview", label: "Entrevista", icon: Briefcase, en: "Let's practice a job interview! What position are you applying for?", pt: "Vamos treinar uma entrevista! Para qual vaga você está se candidatando?" },
  { id: "business", label: "Negócios", icon: Building2, en: "Welcome! Let's practice business English. What do you do at work?", pt: "Bem-vindo! Vamos praticar inglês de negócios. O que você faz no trabalho?" },
  { id: "travel", label: "Viagem", icon: Plane, en: "Let's get you ready to travel! Where are you planning to go?", pt: "Vamos te preparar pra viajar! Para onde você pretende ir?" },
];

function ChatScreen() {
  const { profile, bump, addXp } = useApp();
  const greetFor = (mId) => {
    const m = CHAT_MODES.find((x) => x.id === mId) || CHAT_MODES[0];
    return { en: m.en.replace("{name}", profile.name), pt: m.pt.replace("{name}", profile.name) };
  };
  const [mode, setMode] = useState("free");
  const [msgs, setMsgs] = useState(() => { const g = greetFor("free"); return [{ role: "ai", text: g.en, translation: g.pt, showT: false }]; });
  const [api, setApi] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const speech = useSpeech();
  const endRef = useRef(null);
  useEffect(() => { endRef.current && endRef.current.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);
  const cur = CHAT_MODES.find((m) => m.id === mode) || CHAT_MODES[0];

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput(""); setBusy(true);
    setMsgs((m) => [...m, { role: "me", text }]);
    bump("messages", 1); addXp(5);
    const nextApi = [...api, { role: "user", content: text }];
    try {
      const r = await tutorReply(nextApi, profile, mode);
      setMsgs((m) => [...m, { role: "ai", text: r.reply, translation: r.translation, correction: r.correction, showT: false }]);
      setApi([...nextApi, { role: "assistant", content: r.reply }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "ai", text: "Hmm, não consegui responder agora. Tenta de novo? 🙏", translation: "", error: true }]);
    }
    setBusy(false);
  };
  const switchMode = (id) => { setMode(id); const g = greetFor(id); setMsgs([{ role: "ai", text: g.en, translation: g.pt, showT: false }]); setApi([]); };
  const reset = () => { const g = greetFor(mode); setMsgs([{ role: "ai", text: g.en, translation: g.pt, showT: false }]); setApi([]); };
  const mic = () => speech.listening ? speech.stop() : speech.start((t) => t && setInput(t));

  return (
    <>
      <div className="f-top">
        <div className="f-brand"><div className="f-logo"><Sparkles size={17} /></div><div><div className="f-brandname" style={{ fontSize: 17 }}>Delagassa</div><div className="f-faint" style={{ fontSize: 11, fontWeight: 700, marginTop: -2 }}>Nível {profile.level} · {cur.label}</div></div></div>
        <button className="f-tiny" onClick={reset}><RotateCcw size={13} /> Reiniciar</button>
      </div>

      <div style={{ display: "flex", gap: 7, overflowX: "auto", padding: "9px 12px", borderBottom: "1px solid var(--line)", background: "#fff" }}>
        {CHAT_MODES.map((m) => (
          <button key={m.id} className={"f-tiny" + (mode === m.id ? " on" : "")} style={{ flex: "none", padding: "7px 11px", fontSize: 12.5 }} onClick={() => switchMode(m.id)}>
            <m.icon size={13} /> {m.label}
          </button>
        ))}
      </div>

      <div className="f-scroll" style={{ background: "linear-gradient(180deg,#F4F0FB,#F8F5FC)" }}>
        <div className="f-chat">
          {msgs.map((m, i) => m.role === "me" ? (
            <div className="f-row me" key={i}>
              <div className="f-bubblewrap" style={{ alignItems: "flex-end" }}>
                <div className="f-bubble me">{m.text}</div>
              </div>
            </div>
          ) : (
            <div className="f-row" key={i}>
              <div className="f-av"><Sparkles size={15} /></div>
              <div className="f-bubblewrap">
                <div className="f-bubble ai"><div className="name">DELAGASSA</div>{m.text}</div>
                {!m.error && (
                  <div className="f-bubactions">
                    <button className="f-tiny" onClick={() => speak(m.text)}><Volume2 size={13} /> Ouvir</button>
                    {m.translation && <button className={"f-tiny" + (m.showT ? " on" : "")} onClick={() => setMsgs((mm) => mm.map((x, k) => k === i ? { ...x, showT: !x.showT } : x))}><Languages size={13} /> Traduzir</button>}
                  </div>
                )}
                {m.showT && m.translation && <div className="f-trans">{m.translation}</div>}
                {m.correction && (m.correction.hasError ? (
                  <div className="f-corr">
                    <div className="hd"><Wand2 size={13} /> Correção</div>
                    <div className="f-diff"><span className="o"><s>{m.correction.original}</s></span><br /><span className="c">→ {m.correction.corrected}</span></div>
                    {m.correction.explanation && <div className="exp">{m.correction.explanation}</div>}
                  </div>
                ) : (
                  <div className="f-good"><Check size={14} /> Sua frase ficou perfeita!</div>
                ))}
              </div>
            </div>
          ))}
          {busy && (
            <div className="f-row"><div className="f-av"><Sparkles size={15} /></div>
              <div className="f-bubble ai"><div className="f-dots"><span /><span /><span /></div></div></div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="f-inputbar">
        {speech.listening && <div className="f-faint" style={{ fontSize: 12, fontWeight: 700, marginBottom: 7, display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--coral)" }} /> Ouvindo… {speech.transcript}</div>}
        <div className="f-inputrow">
          {speech.supported && <button className={"f-iconbtn" + (speech.listening ? " live" : "")} onClick={mic}><Mic size={19} /></button>}
          <textarea className="f-input" rows={1} placeholder="Escreva em inglês…" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <button className="f-iconbtn send" onClick={send} disabled={busy || !input.trim()}>{busy ? <Loader2 size={19} className="spin" /> : <Send size={18} />}</button>
        </div>
      </div>
    </>
  );
}

/* ============================ PRONUNCIATION ============================ */
const PRON_PHRASES = [
  { en: "I would like a cup of coffee, please.", pt: "Eu gostaria de uma xícara de café, por favor." },
  { en: "Could you tell me where the station is?", pt: "Você poderia me dizer onde fica a estação?" },
  { en: "I've been learning English for two years.", pt: "Eu estou aprendendo inglês há dois anos." },
  { en: "What time does the next train leave?", pt: "Que horas sai o próximo trem?" },
  { en: "I'm really looking forward to the weekend.", pt: "Estou muito ansioso pelo fim de semana." },
  { en: "Can I have the bill, please?", pt: "Pode trazer a conta, por favor?" },
];
function PronScreen() {
  const { bump, addXp, profile } = useApp();
  const speech = useSpeech();
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [scored, setScored] = useState(false);
  const [showT, setShowT] = useState(false);
  const item = PRON_PHRASES[idx];
  const phrase = item.en;

  const listen = () => {
    if (speech.listening) { speech.stop(); return; }
    setResult(null); setScored(false);
    speech.start((said) => {
      const r = scorePron(phrase, said);
      setResult({ ...r, said });
      setScored(true);
      if (r.overall >= 50) { bump("pron", 1); bump("lessons", 1); addXp(15); }
    });
  };
  const next = () => { setIdx((idx + 1) % PRON_PHRASES.length); setResult(null); setScored(false); setShowT(false); };

  const color = (v) => v >= 80 ? "var(--ok)" : v >= 55 ? "var(--gold)" : "var(--err)";

  return (
    <div className="f-scroll">
      <div className="f-pad">
        <div className="f-eyebrow">Treino de pronúncia</div>
        <h2 className="f-h1" style={{ marginTop: 4 }}>Fale como nativo</h2>
        <p className="f-muted" style={{ marginTop: 6, marginBottom: 16, fontSize: 14 }}>Ouça a frase, toque no microfone e repita. A IA mede sua pronúncia.</p>

        {!speech.supported && (
          <div className="f-card f-pad" style={{ padding: 14, background: "#FFF6F3", borderColor: "#F0D0C7" }}>
            <p style={{ fontWeight: 700, fontSize: 14 }}>Seu navegador não suporta reconhecimento de voz.</p>
            <p className="f-muted" style={{ fontSize: 13, marginTop: 4 }}>Abra no Chrome ou no Edge para gravar a sua fala. Você ainda pode ouvir a frase abaixo.</p>
          </div>
        )}

        <div className="f-card f-pad" style={{ padding: 18, textAlign: "center", marginTop: 6 }}>
          <p className="f-faint" style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase" }}>Repita esta frase</p>
          <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 21, margin: "10px 0 14px", lineHeight: 1.25 }}>
            {result ? phrase.split(/\s+/).map((w, i) => (
              <span key={i} style={{ color: result.matched[i] ? "var(--ok)" : "var(--ink3)" }}>{w} </span>
            )) : phrase}
          </p>
          <div style={{ display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="f-tiny" onClick={() => speak(phrase)}><Volume2 size={14} /> Ouvir a frase</button>
            <button className={"f-tiny" + (showT ? " on" : "")} onClick={() => setShowT((v) => !v)}><Languages size={14} /> {showT ? "Ocultar" : "Traduzir"}</button>
          </div>
          {showT && <p className="f-muted" style={{ fontSize: 14, marginTop: 12, fontStyle: "italic" }}>{item.pt}</p>}
        </div>

        <div style={{ display: "flex", justifyContent: "center", margin: "24px 0 8px" }}>
          <div className={"f-orb" + (speech.listening ? " live" : "")}>
            <span className="ring r1" /><span className="ring r2" /><span className="ring r3" />
            <button className="core" onClick={listen} disabled={!speech.supported}><Mic size={40} /></button>
          </div>
        </div>
        <p className="f-faint" style={{ textAlign: "center", fontSize: 13, fontWeight: 700, minHeight: 18 }}>
          {speech.listening ? `Ouvindo… ${speech.transcript}` : scored ? "Toque para tentar de novo" : "Toque para gravar"}
        </p>

        {result && (
          <>
            <div className="f-card f-pad" style={{ padding: 16, marginTop: 14 }}>
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <span className="f-display" style={{ fontSize: 44, color: color(result.overall) }}>{result.overall}</span>
                <span className="f-faint" style={{ fontSize: 16, fontWeight: 800 }}>/100</span>
                <p className="f-muted" style={{ fontSize: 13, marginTop: 2 }}>{result.overall >= 80 ? "Excelente! 🎉" : result.overall >= 55 ? "Bom, continue praticando!" : "Vamos tentar mais uma vez."}</p>
              </div>
              {[["Pronúncia", result.pron], ["Fluência", result.fluency], ["Clareza", result.clarity]].map(([lab, v]) => (
                <div key={lab} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 800, marginBottom: 5 }}><span>{lab}</span><span style={{ color: color(v) }}>{v}</span></div>
                  <div className="f-xpbar"><div className="f-xpfill" style={{ width: `${v}%`, background: color(v) }} /></div>
                </div>
              ))}
              <p className="f-faint" style={{ fontSize: 12.5, marginTop: 10 }}>Você disse: “{result.said || "—"}”</p>
            </div>
            <button className="f-btn primary block" style={{ marginTop: 14 }} onClick={next}>Próxima frase <ArrowRight size={18} /></button>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================ VOCABULARY ============================ */
const VOCAB_CATEGORIES = ["Negócios", "Viagens", "Entrevista", "Tecnologia", "Atendimento", "Restaurante", "Hotelaria", "Saúde", "Finanças", "Compras", "Cotidiano"];

function VocabScreen() {
  const { profile, favorites, toggleFav, bump, addXp, learned, markLearned } = useApp();
  const [cat, setCat] = useState(VOCAB_CATEGORIES[0]);
  const [custom, setCustom] = useState("");
  const [words, setWords] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);

  const load = async (category, append) => {
    setBusy(true); setErr(false);
    try {
      const exclude = append ? words.map((w) => w.word) : [];
      const data = await generateVocab(category, profile, exclude, 8);
      const fresh = (data.words || []).filter((w) => w && w.word);
      setWords(append ? [...words, ...fresh] : fresh);
    } catch (e) { setErr(true); }
    setBusy(false);
  };
  const pick = (category) => { setCat(category); setWords([]); setErr(false); load(category, false); };
  const genCustom = () => { const c = custom.trim(); if (!c) return; setCat(c); setWords([]); setCustom(""); load(c, false); };

  return (
    <div className="f-scroll">
      <div className="f-pad">
        <div className="f-eyebrow">Vocabulário</div>
        <h2 className="f-h1" style={{ marginTop: 4, marginBottom: 6 }}>Palavras pra usar hoje</h2>
        <p className="f-muted" style={{ fontSize: 14, marginBottom: 14 }}>Escolha um tema e a IA cria palavras com tradução, exemplo, sinônimos e antônimos.</p>

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 10 }}>
          {VOCAB_CATEGORIES.map((c) => (
            <button key={c} className={"f-tiny" + (cat === c ? " on" : "")} style={{ flex: "none", padding: "8px 12px", fontSize: 13 }} onClick={() => pick(c)}>{c}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input className="f-input" style={{ flex: 1, padding: "10px 13px" }} placeholder="Ou digite um tema (ex.: futebol)" value={custom}
            onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); genCustom(); } }} />
          <button className="f-iconbtn send" onClick={genCustom} disabled={busy || !custom.trim()}><Sparkles size={18} /></button>
        </div>

        {words.length === 0 && !busy && !err && (
          <button className="f-btn primary block" onClick={() => load(cat, false)}><Sparkles size={18} /> Gerar palavras de “{cat}”</button>
        )}
        {busy && words.length === 0 && (
          <div style={{ textAlign: "center", padding: 30 }}><Loader2 size={26} className="spin" style={{ color: "var(--coral)" }} /><p className="f-faint" style={{ marginTop: 10, fontSize: 13 }}>Gerando palavras de “{cat}”…</p></div>
        )}
        {err && (
          <div className="f-card f-pad" style={{ padding: 14, textAlign: "center" }}><p className="f-muted" style={{ fontSize: 14 }}>Não consegui gerar agora. <button className="f-link" onClick={() => load(cat, false)}>Tentar de novo</button></p></div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {words.map((w, idx) => {
            const fav = favorites.has(w.word), done = learned.has(w.word);
            const syn = Array.isArray(w.synonyms) ? w.synonyms : [];
            const ant = Array.isArray(w.antonyms) ? w.antonyms : [];
            return (
              <div className="f-card f-pad" key={w.word + idx} style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="f-h2" style={{ fontSize: 17 }}>{w.word}</span>
                      <button onClick={() => speak(w.word)} style={{ color: "var(--sky)" }}><Volume2 size={16} /></button>
                    </div>
                    <p className="f-muted" style={{ fontSize: 13.5, fontWeight: 700, marginTop: 1 }}>{w.translation}</p>
                    <p className="f-faint" style={{ fontSize: 13, fontStyle: "italic", marginTop: 6 }}>“{w.example}”</p>
                    {(syn.length > 0 || ant.length > 0) && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
                        {syn.slice(0, 3).map((s, i) => (<span key={"s" + i} style={{ fontSize: 11.5, fontWeight: 700, background: "#EEF7EE", color: "var(--ok)", padding: "3px 8px", borderRadius: 999 }}>≈ {s}</span>))}
                        {ant.slice(0, 2).map((a, i) => (<span key={"a" + i} style={{ fontSize: 11.5, fontWeight: 700, background: "#FDEEEE", color: "var(--err)", padding: "3px 8px", borderRadius: 999 }}>≠ {a}</span>))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => toggleFav(w.word)} style={{ color: fav ? "var(--coral)" : "var(--ink3)" }}>
                    <Heart size={20} fill={fav ? "var(--coral)" : "none"} />
                  </button>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button className="f-tiny" onClick={() => speak(w.example)}><Volume2 size={13} /> Frase</button>
                  <button className="f-tiny" style={done ? { background: "#EFFaf0", color: "var(--ok)", borderColor: "#cdebd6" } : {}}
                    onClick={() => { if (!done) { markLearned(w.word); bump("wordsLearned", 1); addXp(10); } }}>
                    {done ? <><Check size={13} /> Aprendida</> : <><Plus size={13} /> Aprendi</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {words.length > 0 && (
          <button className="f-btn ghost block" style={{ marginTop: 14 }} onClick={() => load(cat, true)} disabled={busy}>
            {busy ? <><Loader2 size={16} className="spin" /> Gerando…</> : <><RefreshCw size={16} /> Gerar mais palavras</>}
          </button>
        )}
        {favorites.size > 0 && <p className="f-faint" style={{ textAlign: "center", fontSize: 12.5, marginTop: 16 }}><Heart size={12} fill="var(--coral)" color="var(--coral)" style={{ verticalAlign: "-1px" }} /> {favorites.size} no(s) favorito(s)</p>}
      </div>
    </div>
  );
}

/* ============================ GRAMMAR ============================ */
const GRAMMAR_TOPICS = [
  "Present Simple", "Present Continuous", "Past Simple", "Past Continuous", "Present Perfect",
  "Future (will / going to)", "Conditionals", "Passive Voice", "Phrasal Verbs", "Modal Verbs",
  "Comparatives & Superlatives", "Articles (a / an / the)",
];

function GrammarScreen() {
  const { profile, addXp, bump } = useApp();
  const [topic, setTopic] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);

  const open = async (t) => {
    setTopic(t); setLesson(null); setErr(false); setBusy(true);
    try {
      const data = await grammarLesson(t, profile);
      setLesson(data);
      addXp(8); bump("lessons", 1);
    } catch (e) { setErr(true); }
    setBusy(false);
  };

  return (
    <div className="f-scroll">
      <div className="f-pad">
        <div className="f-eyebrow">Gramática</div>
        <h2 className="f-h1" style={{ marginTop: 4, marginBottom: 6 }}>Aulas com IA</h2>
        <p className="f-muted" style={{ fontSize: 14, marginBottom: 14 }}>Escolha um tópico e a IA cria uma aula com explicação, exemplos e dicas.</p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {GRAMMAR_TOPICS.map((t) => (
            <button key={t} className={"f-tiny" + (topic === t ? " on" : "")} style={{ padding: "8px 12px", fontSize: 12.5 }} onClick={() => open(t)}>{t}</button>
          ))}
        </div>

        {busy && (<div style={{ textAlign: "center", padding: 30 }}><Loader2 size={26} className="spin" style={{ color: "var(--coral)" }} /><p className="f-faint" style={{ marginTop: 10, fontSize: 13 }}>Preparando a aula de {topic}…</p></div>)}
        {err && (<div className="f-card f-pad" style={{ padding: 14, textAlign: "center" }}><p className="f-muted" style={{ fontSize: 14 }}>Não consegui gerar a aula. <button className="f-link" onClick={() => open(topic)}>Tentar de novo</button></p></div>)}

        {lesson && !busy && (
          <div className="f-card f-pad" style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--coral)", color: "#fff", display: "grid", placeItems: "center", flex: "none" }}><GraduationCap size={18} /></div>
              <span className="f-h2">{lesson.title || topic}</span>
            </div>
            {lesson.explanation && <p style={{ fontSize: 14.5, lineHeight: 1.5, color: "var(--ink2)" }}>{lesson.explanation}</p>}

            {Array.isArray(lesson.rules) && lesson.rules.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <p className="f-faint" style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 8 }}>Regras</p>
                {lesson.rules.map((r, i) => (<div className="f-feat" key={i}><span className="ck"><Check size={11} /></span><span>{r}</span></div>))}
              </div>
            )}

            {Array.isArray(lesson.examples) && lesson.examples.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p className="f-faint" style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 8 }}>Exemplos</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {lesson.examples.map((ex, i) => (
                    <div key={i} style={{ background: "#F7F4FB", border: "1px solid var(--line2)", borderRadius: 12, padding: "10px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{ex.en}</span>
                        <button onClick={() => speak(ex.en)} style={{ color: "var(--sky)", flex: "none" }}><Volume2 size={15} /></button>
                      </div>
                      {ex.pt && <span className="f-faint" style={{ fontSize: 12.5 }}>{ex.pt}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lesson.tip && (
              <div style={{ marginTop: 16, background: "#FFFCF4", border: "1px solid #F0E6C9", borderRadius: 12, padding: "11px 12px", display: "flex", gap: 9 }}>
                <Lightbulb size={17} color="#B98900" style={{ flex: "none", marginTop: 1 }} />
                <span style={{ fontSize: 13, color: "var(--ink2)" }}><strong>Dica:</strong> {lesson.tip}</span>
              </div>
            )}
          </div>
        )}

        {!lesson && !busy && !err && (
          <div style={{ textAlign: "center", padding: "20px 10px", color: "var(--ink3)" }}>
            <BookOpen size={30} style={{ opacity: .5 }} />
            <p style={{ marginTop: 8, fontSize: 13.5 }}>Toque em um tópico acima para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================ SIMULATIONS ============================ */
function SimScreen() {
  const { profile, bump, addXp } = useApp();
  const [active, setActive] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [api, setApi] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const speech = useSpeech();
  const endRef = useRef(null);
  useEffect(() => { endRef.current && endRef.current.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const open = (sc) => { setActive(sc); setMsgs([{ role: "ai", text: sc.opener }]); setApi([]); speak(sc.opener); };
  const finish = () => { if (msgs.filter((m) => m.role === "me").length >= 1) { bump("sims", 1); bump("lessons", 1); addXp(25); } setActive(null); setMsgs([]); setApi([]); };
  const send = async () => {
    const text = input.trim(); if (!text || busy) return;
    setInput(""); setBusy(true);
    setMsgs((m) => [...m, { role: "me", text }]);
    const nextApi = [...api, { role: "user", content: text }];
    try { const r = await roleReply(nextApi, active, profile); setMsgs((m) => [...m, { role: "ai", text: r }]); setApi([...nextApi, { role: "assistant", content: r }]); }
    catch (e) { setMsgs((m) => [...m, { role: "ai", text: "(Sorry, I didn't catch that — could you repeat?)" }]); }
    setBusy(false);
  };
  const mic = () => speech.listening ? speech.stop() : speech.start((t) => t && setInput(t));
  const toggleTrans = async (i) => {
    const msg = msgs[i];
    if (msg.translation) { setMsgs((mm) => mm.map((x, k) => k === i ? { ...x, showT: !x.showT } : x)); return; }
    setMsgs((mm) => mm.map((x, k) => k === i ? { ...x, tLoading: true } : x));
    try { const t = await translateText(msg.text); setMsgs((mm) => mm.map((x, k) => k === i ? { ...x, translation: t, showT: true, tLoading: false } : x)); }
    catch (e) { setMsgs((mm) => mm.map((x, k) => k === i ? { ...x, tLoading: false } : x)); }
  };

  if (!active) return (
    <div className="f-scroll">
      <div className="f-pad">
        <div className="f-eyebrow">Simulações reais</div>
        <h2 className="f-h1" style={{ marginTop: 4, marginBottom: 6 }}>Pratique situações de verdade</h2>
        <p className="f-muted" style={{ fontSize: 14, marginBottom: 16 }}>O Delagassa vira o personagem. Você só responde — como seria na vida real.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {SCENARIOS.map((s) => (
            <button key={s.id} className="f-chip" onClick={() => open(s)} style={{ padding: 14 }}>
              <span className="ic" style={{ width: 40, height: 40 }}><s.icon size={20} /></span>
              <span style={{ flex: 1 }}>{s.label}<div className="f-faint" style={{ fontSize: 12.5, fontWeight: 600 }}>{s.sub}</div></span>
              <ChevronRight size={18} color="var(--ink3)" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="f-top">
        <button className="f-avatar-btn" onClick={finish}><ArrowLeft size={17} /></button>
        <div style={{ textAlign: "center" }}><div className="f-h2" style={{ fontSize: 15 }}>{active.label}</div><div className="f-faint" style={{ fontSize: 11, fontWeight: 700 }}>Simulação em andamento</div></div>
        <button className="f-tiny" onClick={finish}><Check size={13} /> Encerrar</button>
      </div>
      <div className="f-scroll" style={{ background: "linear-gradient(180deg,#F4F0FB,#F8F5FC)" }}>
        <div className="f-chat">
          {msgs.map((m, i) => m.role === "me" ? (
            <div className="f-row me" key={i}><div className="f-bubble me" style={{ maxWidth: "80%" }}>{m.text}</div></div>
          ) : (
            <div className="f-row" key={i}>
              <div className="f-av" style={{ background: "linear-gradient(135deg,#5C7CFA,#8AA2FF)" }}><active.icon size={14} /></div>
              <div className="f-bubblewrap">
                <div className="f-bubble ai">{m.text}</div>
                <div className="f-bubactions">
                  <button className="f-tiny" onClick={() => speak(m.text)}><Volume2 size={13} /> Ouvir</button>
                  <button className={"f-tiny" + (m.showT ? " on" : "")} onClick={() => toggleTrans(i)} disabled={m.tLoading}><Languages size={13} /> {m.tLoading ? "..." : m.showT ? "Ocultar" : "Traduzir"}</button>
                </div>
                {m.showT && m.translation && <div className="f-trans">{m.translation}</div>}
              </div>
            </div>
          ))}
          {busy && <div className="f-row"><div className="f-av" style={{ background: "linear-gradient(135deg,#5C7CFA,#8AA2FF)" }}><active.icon size={14} /></div><div className="f-bubble ai"><div className="f-dots"><span /><span /><span /></div></div></div>}
          <div ref={endRef} />
        </div>
      </div>
      <div className="f-inputbar">
        {speech.listening && <div className="f-faint" style={{ fontSize: 12, fontWeight: 700, marginBottom: 7 }}>Ouvindo… {speech.transcript}</div>}
        <div className="f-inputrow">
          {speech.supported && <button className={"f-iconbtn" + (speech.listening ? " live" : "")} onClick={mic}><Mic size={19} /></button>}
          <textarea className="f-input" rows={1} placeholder="Responda em inglês…" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <button className="f-iconbtn send" onClick={send} disabled={busy || !input.trim()}>{busy ? <Loader2 size={19} className="spin" /> : <Send size={18} />}</button>
        </div>
      </div>
    </>
  );
}

/* ============================ UK TRACK (Reino Unido) ============================ */
function WordCard({ w }) {
  const { favorites, toggleFav, bump, addXp, learned, markLearned } = useApp();
  const fav = favorites.has(w.word), done = learned.has(w.word);
  const syn = Array.isArray(w.synonyms) ? w.synonyms : [];
  const ant = Array.isArray(w.antonyms) ? w.antonyms : [];
  return (
    <div className="f-card f-pad" style={{ padding: 14 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="f-h2" style={{ fontSize: 17 }}>{w.word}</span>
            <button onClick={() => speak(w.word)} style={{ color: "var(--sky)" }}><Volume2 size={16} /></button>
          </div>
          <p className="f-muted" style={{ fontSize: 13.5, fontWeight: 700, marginTop: 1 }}>{w.translation}</p>
          <p className="f-faint" style={{ fontSize: 13, fontStyle: "italic", marginTop: 6 }}>“{w.example}”</p>
          {(syn.length > 0 || ant.length > 0) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
              {syn.slice(0, 3).map((s, i) => (<span key={"s" + i} style={{ fontSize: 11.5, fontWeight: 700, background: "#EEF7EE", color: "var(--ok)", padding: "3px 8px", borderRadius: 999 }}>≈ {s}</span>))}
              {ant.slice(0, 2).map((a, i) => (<span key={"a" + i} style={{ fontSize: 11.5, fontWeight: 700, background: "#FDEEEE", color: "var(--err)", padding: "3px 8px", borderRadius: 999 }}>≠ {a}</span>))}
            </div>
          )}
        </div>
        <button onClick={() => toggleFav(w.word)} style={{ color: fav ? "var(--coral)" : "var(--ink3)" }}>
          <Heart size={20} fill={fav ? "var(--coral)" : "none"} />
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="f-tiny" onClick={() => speak(w.example)}><Volume2 size={13} /> Frase</button>
        <button className="f-tiny" style={done ? { background: "#EFFaf0", color: "var(--ok)", borderColor: "#cdebd6" } : {}}
          onClick={() => { if (!done) { markLearned(w.word); bump("wordsLearned", 1); addXp(10); } }}>
          {done ? <><Check size={13} /> Aprendida</> : <><Plus size={13} /> Aprendi</>}
        </button>
      </div>
    </div>
  );
}

const UK_MODULES = [
  { id: "jobs", label: "Empregos", icon: Briefcase, desc: "CV, entrevistas, payslip", long: "Tudo pra conseguir e manter um emprego no Reino Unido: CV, entrevistas, payslip, National Insurance e conversas com o supervisor.", vocabSeed: "UK employment terms for immigrants: CV, cover letter, interview, shift, payslip, overtime, National Insurance Number, reference, contract, self-employed", scenarios: [
    { label: "Entrevista de emprego", opener: "Hello, lovely to meet you! Shall we start — can you tell me a bit about yourself?", role: "a UK hiring manager interviewing the user for a job in Britain; be polite and use British English" },
    { label: "Primeiro dia de trabalho", opener: "Welcome to the team! Let me show you around. Any questions before we get started?", role: "a friendly British supervisor on the user's first day at work" },
    { label: "Pedir uma folga", opener: "Hiya! You wanted a quick word? What can I do for you?", role: "the user's British line manager; the user wants to request a day off (annual leave)" },
  ] },
  { id: "nhs", label: "Saúde (NHS)", icon: Stethoscope, desc: "GP, prescription, pharmacy", long: "O inglês do sistema de saúde britânico (NHS): marcar consulta no GP, explicar sintomas, farmácia e emergências.", vocabSeed: "UK NHS healthcare terms: GP appointment, prescription, emergency, NHS number, pharmacy, symptoms, pain, medication, surgery, referral", scenarios: [
    { label: "Marcar consulta no GP", opener: "Good morning, this is the surgery. How can I help you today?", role: "a GP surgery receptionist on the phone; help the user book a GP appointment" },
    { label: "Explicar sintomas ao médico", opener: "Hello, come in and take a seat. So, what seems to be the problem today?", role: "a British GP (doctor) asking the user about their symptoms" },
    { label: "Na farmácia", opener: "Hi there! How can I help you today?", role: "a pharmacist at a UK pharmacy helping the user collect a prescription" },
  ] },
  { id: "housing", label: "Moradia", icon: Home, desc: "Rent, deposit, landlord", long: "Alugar e morar no Reino Unido: rent, deposit, landlord, council tax e como reportar problemas no imóvel.", vocabSeed: "UK housing and renting terms: rent, deposit, landlord, tenant, council tax, utility bills, tenancy contract, viewing, estate agent, mould", scenarios: [
    { label: "Visitar um imóvel pra alugar", opener: "Hi, you must be here for the viewing! Come on in. What do you think so far?", role: "a UK letting agent showing the user a flat to rent" },
    { label: "Reportar um problema ao landlord", opener: "Hello, this is your landlord. I got your message — what's the issue?", role: "the user's British landlord; the user needs to report a problem in the flat" },
  ] },
  { id: "bank", label: "Banco", icon: Landmark, desc: "Account, direct debit", long: "Abrir e usar conta bancária no Reino Unido: current account, direct debit, standing order e credit score.", vocabSeed: "UK banking terms: current account, savings account, credit score, debit card, direct debit, standing order, overdraft, sort code", scenarios: [
    { label: "Abrir uma conta bancária", opener: "Good afternoon! Welcome to the bank. How can I help you today?", role: "a UK bank clerk helping the user open a current account" },
  ] },
  { id: "shopping", label: "Compras", icon: ShoppingBag, desc: "Refund, exchange, receipt", long: "Supermercado e lojas no Reino Unido: Tesco, Asda, Lidl, refund, exchange e self-checkout.", vocabSeed: "UK supermarket and shopping terms: Tesco, Asda, Lidl, Aldi, receipt, refund, exchange, self-checkout, trolley, loyalty card", scenarios: [
    { label: "Trocar ou devolver um produto", opener: "Hiya! How can I help you?", role: "a customer service assistant at a UK shop; the user wants to return an item for a refund" },
  ] },
  { id: "transport", label: "Transporte", icon: Bus, desc: "Oyster, railcard, platform", long: "Se locomover no Reino Unido: train station, Oyster card, Railcard, platform e atrasos.", vocabSeed: "UK public transport terms: train station, bus stop, Oyster card, Railcard, platform, delay, return ticket, top up, off-peak", scenarios: [
    { label: "Comprar passagem de trem", opener: "Hello! Where are you travelling to today?", role: "a ticket office clerk at a UK train station helping the user buy a ticket" },
    { label: "Resolver um trem atrasado", opener: "Morning! You alright? You look a bit lost.", role: "a railway station staff member helping the user with a delayed or cancelled train" },
  ] },
  { id: "school", label: "Escola e filhos", icon: GraduationCap, desc: "Primary, parent meeting", long: "A escola britânica para os filhos: primary/secondary school, matrícula, attendance e reuniões com professores.", vocabSeed: "UK schooling terms for parents: primary school, secondary school, parent meeting, attendance, homework, head teacher, term, uniform", scenarios: [
    { label: "Conversa na reunião escolar", opener: "Thanks for coming in! Lovely to meet you. Shall we talk about how things are going?", role: "a British primary school teacher talking to the user (a parent) at a parents' evening" },
    { label: "Matricular o filho na escola", opener: "Good morning! How can I help you today?", role: "a UK school office receptionist helping the user enrol their child" },
  ] },
  { id: "business", label: "Empreender", icon: Building2, desc: "Sole trader, VAT, invoice", long: "Abrir e tocar um negócio no Reino Unido: limited company, sole trader, VAT, invoice e atendimento ao cliente.", vocabSeed: "UK business and self-employment terms: limited company, sole trader, VAT, invoice, corporation tax, business bank account, HMRC, self-assessment", scenarios: [
    { label: "Registrar-se como sole trader", opener: "Hello! You've reached HMRC business support. How can I help you today?", role: "an HMRC business advisor helping the user register as a sole trader in the UK" },
    { label: "Atender um cliente insatisfeito", opener: "Hi, I bought something from you last week and I'm not happy with it.", role: "an unhappy British customer complaining; the user is the business owner handling the complaint" },
  ] },
];

// Trilha principal: 5 módulos em ordem. Cada lição tem "title" (PT) e "focus" (tema em inglês pra IA gerar a aula + quiz).
const MODULES = [
  {
    key: "everyday", title: "Everyday English", subtitle: "O inglês do dia a dia", color: "#1F9D55", icon: MessageCircle,
    lessons: [
      { title: "Família e relacionamentos", focus: "everyday English for talking about your family and relationships (family members, marital status, describing people you know)" },
      { title: "Compras e dinheiro", focus: "everyday English for shopping and money (prices, paying by card or cash, sizes, asking for help in a shop)" },
      { title: "Transporte e direções", focus: "everyday English for getting around (bus, train, taxi, asking for and understanding directions)" },
      { title: "Restaurantes e pedidos", focus: "everyday English for restaurants and cafés (ordering food and drinks, asking for the bill, dietary requests)" },
      { title: "Tempo livre e hobbies", focus: "everyday English for free time and hobbies (weekend plans, sports, films, making and accepting invitations)" },
    ],
  },
  {
    key: "uklife", title: "UK Life English", subtitle: "Viver no Reino Unido", color: "#E0245E", icon: Flag,
    lessons: [
      { title: "NHS e saúde", focus: "UK English for health and the NHS (booking a GP appointment, prescriptions, pharmacy/chemist, describing symptoms)" },
      { title: "Banco e contas", focus: "UK English for banking and bills (opening a current account, direct debit, standing order, paying bills)" },
      { title: "Moradia e Council Tax", focus: "UK English for housing (renting, deposit, landlord, tenant, council tax, utilities and bills)" },
      { title: "Empregos e benefícios", focus: "UK English for work and benefits (National Insurance number, payslip, Universal Credit, applying for jobs)" },
      { title: "Escola e burocracia", focus: "UK English for schools and official paperwork (enrolling a child in school, parents' evening, filling in forms)" },
    ],
  },
  {
    key: "career", title: "Career English", subtitle: "Crescimento profissional", color: "#2F80ED", icon: Briefcase,
    lessons: [
      { title: "Currículo (CV)", focus: "English for writing a strong CV/resume (action verbs, describing experience and achievements with measurable impact)" },
      { title: "LinkedIn e marca pessoal", focus: "English for LinkedIn and personal branding (headline, summary, describing what you do, professional tone)" },
      { title: "Entrevista de emprego", focus: "English for job interviews (tell me about yourself, strengths and weaknesses, answering common interview questions)" },
      { title: "Apresentações", focus: "English for giving presentations at work (opening, structuring points, signposting, handling questions)" },
      { title: "Reuniões e networking", focus: "English for meetings and professional networking (giving opinions, agreeing, introducing yourself, small talk)" },
    ],
  },
  {
    key: "business", title: "Business English", subtitle: "Comunicação empresarial", color: "#7C5CFA", icon: BarChart3,
    lessons: [
      { title: "Marketing e vendas", focus: "business English for marketing and sales (describing products, benefits, persuading customers, closing a sale)" },
      { title: "Negociação", focus: "business English for negotiating (making and responding to offers, polite pushback, reaching an agreement)" },
      { title: "Finanças e números", focus: "business English for finance and numbers (talking about revenue, costs, profit, reading charts and reports)" },
      { title: "Gestão de equipe", focus: "business English for managing a team (delegating, giving feedback, setting goals, one-to-one meetings)" },
      { title: "Liderança e comunicação", focus: "business English for leadership communication (motivating people, clear messaging, formal vs informal register)" },
    ],
  },
  {
    key: "entrepreneur", title: "Entrepreneur English", subtitle: "Empreender no mundo", color: "#FF7A18", icon: Crown,
    lessons: [
      { title: "Pitch e startups", focus: "startup English for pitching (explaining your idea, the problem and the solution, your value proposition clearly)" },
      { title: "Investimento e valuation", focus: "startup English for fundraising (investment, valuation, equity, talking to investors about your business)" },
      { title: "Aquisição de clientes", focus: "startup English for growth and customer acquisition (marketing channels, conversion, retention, key metrics)" },
      { title: "Escalar o negócio", focus: "startup English for scaling a business (hiring, operations, processes, growing into new markets)" },
      { title: "Negociar com investidores", focus: "startup English for negotiating with investors (term sheets, valuation, equity, persuading and holding your ground)" },
    ],
  },
];

// Ferramentas de prática livre (aba "Praticar"). id casa com o roteamento de telas existente.
const PRACTICE_TOOLS = [
  { id: "chat", label: "Conversar com o Delagassa", desc: "Bate-papo com correção em tempo real", icon: MessageCircle, color: "#FF7A18" },
  { id: "pron", label: "Pronúncia", desc: "Treine sua fala e receba nota", icon: Mic, color: "#2F80ED" },
  { id: "vocab", label: "Vocabulário", desc: "Aprenda palavras novas por tema", icon: BookOpen, color: "#7C5CFA" },
  { id: "grammar", label: "Gramática", desc: "Aulas de gramática geradas pela IA", icon: GraduationCap, color: "#1F9D55" },
  { id: "sim", label: "Simulações", desc: "Pratique situações reais por voz", icon: Wand2, color: "#F2994A" },
  { id: "uk", label: "Inglês do Reino Unido", desc: "NHS, moradia, banco, transporte e gírias 🇬🇧", icon: Flag, color: "#E0245E" },
];

function MiniRoleplay({ scenario, onBack }) {
  const { profile, bump, addXp } = useApp();
  const [msgs, setMsgs] = useState([{ role: "ai", text: scenario.opener }]);
  const [api, setApi] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [counted, setCounted] = useState(false);
  const speech = useSpeech();
  const endRef = useRef(null);
  useEffect(() => { speak(scenario.opener); }, []);
  useEffect(() => { endRef.current && endRef.current.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);
  const Icon = scenario.icon || Wand2;
  const send = async () => {
    const text = input.trim(); if (!text || busy) return;
    setInput(""); setBusy(true);
    setMsgs((m) => [...m, { role: "me", text }]);
    if (!counted) { setCounted(true); bump("sims", 1); bump("lessons", 1); addXp(25); }
    const nextApi = [...api, { role: "user", content: text }];
    try { const r = await roleReply(nextApi, scenario, profile); setMsgs((m) => [...m, { role: "ai", text: r }]); setApi([...nextApi, { role: "assistant", content: r }]); }
    catch (e) { setMsgs((m) => [...m, { role: "ai", text: "(Sorry, I didn't catch that — could you repeat?)" }]); }
    setBusy(false);
  };
  const mic = () => speech.listening ? speech.stop() : speech.start((t) => t && setInput(t));
  const toggleTrans = async (i) => {
    const msg = msgs[i];
    if (msg.translation) { setMsgs((mm) => mm.map((x, k) => k === i ? { ...x, showT: !x.showT } : x)); return; }
    setMsgs((mm) => mm.map((x, k) => k === i ? { ...x, tLoading: true } : x));
    try { const t = await translateText(msg.text); setMsgs((mm) => mm.map((x, k) => k === i ? { ...x, translation: t, showT: true, tLoading: false } : x)); }
    catch (e) { setMsgs((mm) => mm.map((x, k) => k === i ? { ...x, tLoading: false } : x)); }
  };
  return (
    <>
      <div className="f-top">
        <button className="f-avatar-btn" onClick={onBack}><ArrowLeft size={17} /></button>
        <div style={{ textAlign: "center" }}><div className="f-h2" style={{ fontSize: 15 }}>{scenario.label}</div><div className="f-faint" style={{ fontSize: 11, fontWeight: 700 }}>Simulação · Reino Unido</div></div>
        <button className="f-tiny" onClick={onBack}><Check size={13} /> Sair</button>
      </div>
      <div className="f-scroll" style={{ background: "linear-gradient(180deg,#F4F0FB,#F8F5FC)" }}>
        <div className="f-chat">
          {msgs.map((m, i) => m.role === "me" ? (
            <div className="f-row me" key={i}><div className="f-bubble me" style={{ maxWidth: "80%" }}>{m.text}</div></div>
          ) : (
            <div className="f-row" key={i}>
              <div className="f-av" style={{ background: "linear-gradient(135deg,#5C7CFA,#8AA2FF)" }}><Icon size={14} /></div>
              <div className="f-bubblewrap">
                <div className="f-bubble ai">{m.text}</div>
                <div className="f-bubactions">
                  <button className="f-tiny" onClick={() => speak(m.text)}><Volume2 size={13} /> Ouvir</button>
                  <button className={"f-tiny" + (m.showT ? " on" : "")} onClick={() => toggleTrans(i)} disabled={m.tLoading}><Languages size={13} /> {m.tLoading ? "..." : m.showT ? "Ocultar" : "Traduzir"}</button>
                </div>
                {m.showT && m.translation && <div className="f-trans">{m.translation}</div>}
              </div>
            </div>
          ))}
          {busy && <div className="f-row"><div className="f-av" style={{ background: "linear-gradient(135deg,#5C7CFA,#8AA2FF)" }}><Icon size={14} /></div><div className="f-bubble ai"><div className="f-dots"><span /><span /><span /></div></div></div>}
          <div ref={endRef} />
        </div>
      </div>
      <div className="f-inputbar">
        {speech.listening && <div className="f-faint" style={{ fontSize: 12, fontWeight: 700, marginBottom: 7 }}>Ouvindo… {speech.transcript}</div>}
        <div className="f-inputrow">
          {speech.supported && <button className={"f-iconbtn" + (speech.listening ? " live" : "")} onClick={mic}><Mic size={19} /></button>}
          <textarea className="f-input" rows={1} placeholder="Responda em inglês…" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <button className="f-iconbtn send" onClick={send} disabled={busy || !input.trim()}>{busy ? <Loader2 size={19} className="spin" /> : <Send size={18} />}</button>
        </div>
      </div>
    </>
  );
}

function UKModule({ mod, onBack, onPlay }) {
  const { profile } = useApp();
  const [words, setWords] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const load = async (append) => {
    setBusy(true); setErr(false);
    try {
      const exclude = append ? words.map((w) => w.word) : [];
      const data = await generateVocab(mod.vocabSeed, profile, exclude, 8);
      const fresh = (data.words || []).filter((w) => w && w.word);
      setWords(append ? [...words, ...fresh] : fresh);
    } catch (e) { setErr(true); }
    setBusy(false);
  };
  return (
    <div className="f-scroll">
      <div className="f-top">
        <button className="f-avatar-btn" onClick={onBack}><ArrowLeft size={17} /></button>
        <div style={{ textAlign: "center" }}><div className="f-h2" style={{ fontSize: 15 }}>{mod.label}</div><div className="f-faint" style={{ fontSize: 11, fontWeight: 700 }}>Reino Unido</div></div>
        <div style={{ width: 34 }} />
      </div>
      <div className="f-pad">
        <p className="f-muted" style={{ fontSize: 14, marginBottom: 18 }}>{mod.long}</p>

        <p className="f-faint" style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 10 }}>Pratique conversando</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 22 }}>
          {mod.scenarios.map((sc, i) => (
            <button key={i} className="f-chip" onClick={() => onPlay({ ...sc, icon: mod.icon })} style={{ padding: 13 }}>
              <span className="ic" style={{ width: 36, height: 36 }}><Wand2 size={17} /></span>
              <span style={{ flex: 1 }}>{sc.label}</span>
              <ChevronRight size={18} color="var(--ink3)" />
            </button>
          ))}
        </div>

        <p className="f-faint" style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 10 }}>Vocabulário britânico</p>
        {words.length === 0 && !busy && !err && (
          <button className="f-btn primary block" onClick={() => load(false)}><Sparkles size={18} /> Gerar palavras</button>
        )}
        {busy && words.length === 0 && (<div style={{ textAlign: "center", padding: 26 }}><Loader2 size={24} className="spin" style={{ color: "var(--coral)" }} /><p className="f-faint" style={{ marginTop: 10, fontSize: 13 }}>Gerando vocabulário…</p></div>)}
        {err && (<div className="f-card f-pad" style={{ padding: 14, textAlign: "center" }}><p className="f-muted" style={{ fontSize: 14 }}>Não consegui gerar agora. <button className="f-link" onClick={() => load(false)}>Tentar de novo</button></p></div>)}
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {words.map((w, idx) => <WordCard key={w.word + idx} w={w} />)}
        </div>
        {words.length > 0 && (
          <button className="f-btn ghost block" style={{ marginTop: 14 }} onClick={() => load(true)} disabled={busy}>
            {busy ? <><Loader2 size={16} className="spin" /> Gerando…</> : <><RefreshCw size={16} /> Gerar mais palavras</>}
          </button>
        )}
      </div>
    </div>
  );
}

function LessonView({ lesson, lessonId, subtitle, isLastInModule, onBack }) {
  const { profile, completeLesson } = useApp();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState(false);
  const [phase, setPhase] = useState("intro"); // intro | quiz | result
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [showQT, setShowQT] = useState(false);

  const load = async () => {
    setBusy(true); setErr(false); setPhase("intro"); setQi(0); setPicked(null); setCorrect(0); setData(null); setShowQT(false);
    try {
      const d = await lessonContent(lesson.focus, profile);
      if (!d || !Array.isArray(d.questions) || d.questions.length === 0) setErr(true);
      else setData(d);
    } catch (e) { setErr(true); }
    setBusy(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [lessonId]);

  const qs = data?.questions || [];
  const q = qs[qi];
  // Índice correto robusto: cruza o texto da resposta (confiável) com as opções; cai pro índice se não bater.
  const correctIdx = (() => {
    if (!q) return -1;
    const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim().toLowerCase();
    if (q.answer_text != null && Array.isArray(q.options)) {
      const i = q.options.findIndex((o) => norm(o) === norm(q.answer_text));
      if (i >= 0) return i;
    }
    return typeof q.answer === "number" ? q.answer : 0;
  })();
  const pass = qs.length > 0 && correct >= Math.ceil(qs.length / 2);

  const pick = (idx) => {
    if (picked !== null) return;
    setPicked(idx);
    if (q && idx === correctIdx) setCorrect((c) => c + 1);
  };
  const next = () => {
    if (qi + 1 < qs.length) { setQi(qi + 1); setPicked(null); setShowQT(false); }
    else setPhase("result");
  };
  useEffect(() => { if (phase === "result" && pass) completeLesson(lessonId); /* eslint-disable-next-line */ }, [phase]);

  return (
    <>
      <div className="f-top">
        <button className="f-avatar-btn" onClick={onBack}><ArrowLeft size={17} /></button>
        <div style={{ textAlign: "center", flex: 1, minWidth: 0 }}>
          <div className="f-h2" style={{ fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lesson.title}</div>
          <div className="f-faint" style={{ fontSize: 11, fontWeight: 700 }}>{subtitle}</div>
        </div>
        <div style={{ width: 34, flex: "none" }} />
      </div>
      <div className="f-scroll">
        <div className="f-pad">
          {busy && (
            <div style={{ textAlign: "center", padding: "46px 0" }}>
              <Loader2 size={28} className="spin" style={{ color: "var(--coral)" }} />
              <p className="f-faint" style={{ marginTop: 12, fontSize: 13 }}>Preparando sua lição…</p>
            </div>
          )}
          {err && !busy && (
            <div className="f-card f-pad" style={{ padding: 16, textAlign: "center" }}>
              <p className="f-muted" style={{ fontSize: 14 }}>Não consegui carregar a lição. <button className="f-link" onClick={load}>Tentar de novo</button></p>
            </div>
          )}

          {!busy && !err && data && phase === "intro" && (
            <>
              <div className="f-card f-pad" style={{ padding: 16, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 11, background: "var(--coral)", color: "#fff", display: "grid", placeItems: "center", flex: "none" }}><Lightbulb size={19} /></div>
                  <span className="f-h2">{data.title || lesson.title}</span>
                </div>
                <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--ink2)" }}>{data.intro}</p>
              </div>
              <button className="f-btn primary block" onClick={() => setPhase("quiz")}>Começar · {qs.length} perguntas <ArrowRight size={18} /></button>
            </>
          )}

          {!busy && !err && data && phase === "quiz" && q && (
            <>
              <div className="f-xpbar" style={{ marginBottom: 16 }}><div className="f-xpfill" style={{ width: `${(qi / qs.length) * 100}%`, background: "linear-gradient(90deg,#FFA040,var(--coral))" }} /></div>
              <p className="f-faint" style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 8 }}>Pergunta {qi + 1} de {qs.length}</p>
              <div className="f-card f-pad" style={{ padding: 16, marginBottom: 10, fontSize: 16, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1.4 }}>{q.q}</div>
              <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
                <button className="f-tiny" onClick={() => speak(q.q)}><Volume2 size={14} /> Ouvir</button>
                {(q.q_pt || q.options_pt) && <button className={"f-tiny" + (showQT ? " on" : "")} onClick={() => setShowQT((v) => !v)}><Languages size={14} /> {showQT ? "Ocultar tradução" : "Traduzir"}</button>}
              </div>
              {showQT && q.q_pt && <p className="f-muted" style={{ fontSize: 13.5, marginTop: -4, marginBottom: 14, fontStyle: "italic" }}>{q.q_pt}</p>}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(q.options || []).map((o, idx) => {
                  const isPick = picked === idx, isAns = idx === correctIdx;
                  let st = {};
                  if (picked !== null) {
                    if (isAns) st = { borderColor: "var(--ok)", background: "#EFFBF1" };
                    else if (isPick) st = { borderColor: "var(--err)", background: "#FFF1F1" };
                  }
                  return (
                    <button key={idx} className="f-chip" style={{ ...st, justifyContent: "space-between", height: "auto", minHeight: 46, padding: "11px 14px", textAlign: "left", lineHeight: 1.35 }} onClick={() => pick(idx)}>
                      <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <span>{o}</span>
                        {showQT && q.options_pt && q.options_pt[idx] && <span style={{ fontSize: 12.5, color: "var(--ink3)", fontWeight: 500, fontStyle: "italic" }}>{q.options_pt[idx]}</span>}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 10, flex: "none", marginLeft: 8 }}>
                        {picked !== null && isAns && <Check size={18} color="var(--ok)" />}
                        {picked !== null && isPick && !isAns && <X size={18} color="var(--err)" />}
                        <span role="button" aria-label="Ouvir" onClick={(e) => { e.stopPropagation(); speak(o); }} style={{ display: "grid", placeItems: "center", padding: 3, cursor: "pointer", opacity: .65 }}><Volume2 size={16} /></span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {picked !== null && (() => {
                // A IA costuma mandar explicações APENAS das opções ERRADAS (distratores),
                // na ordem das opções, sem uma entrada para a resposta certa. Antes o app
                // lia essa lista como se houvesse 1 explicação por opção, o que deslocava
                // tudo em uma posição. Aqui mapeamos cada explicação à opção correta.
                const explains = Array.isArray(q.option_explains) ? q.option_explains : [];
                const opts = q.options || [];
                const alignedToAll = explains.length === opts.length;        // 1 explicação por opção
                const distractorsOnly = explains.length === opts.length - 1;  // só as erradas
                const explainFor = (i) => {
                  if (alignedToAll) return explains[i] || null;
                  if (distractorsOnly) {
                    if (i === correctIdx) return null;
                    const d = i < correctIdx ? i : i - 1; // posição entre os distratores
                    return explains[d] || null;
                  }
                  return null;
                };
                const isRight = picked === correctIdx;
                const whyWrong = isRight ? null : explainFor(picked);
                const whyRight = isRight ? explainFor(correctIdx) : null; // só existe se vier 1 por opção
                const correctText = opts[correctIdx] || "";
                return (
                  <>
                    <div className="f-card" style={{ marginTop: 12, padding: "12px 14px", background: isRight ? "#EFFBF1" : "#FFF7ED", border: "none" }}>
                      {whyWrong && (
                        <p style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--ink2)", marginBottom: 8 }}><b style={{ color: "var(--err)" }}>❌ Por que está errada: </b>{whyWrong}</p>
                      )}
                      <p style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--ink2)" }}>
                        <b style={{ color: "var(--ok)" }}>{isRight ? "✅ Certo!" : "✅ Resposta certa: "}</b>
                        {isRight ? (whyRight ? " " + whyRight : "") : ("“" + correctText + "”")}
                      </p>
                    </div>
                    <button className="f-btn primary block" style={{ marginTop: 14 }} onClick={next}>{qi + 1 < qs.length ? "Próxima" : "Ver resultado"} <ArrowRight size={18} /></button>
                  </>
                );
              })()}
            </>
          )}

          {!busy && !err && phase === "result" && (
            <div style={{ textAlign: "center", paddingTop: 12 }}>
              <div style={{ display: "inline-grid", placeItems: "center", width: 66, height: 66, borderRadius: 20, background: pass ? "var(--lime)" : "#FFE9E4", color: pass ? "#243a00" : "var(--coral-d)", marginBottom: 14 }}>{pass ? <PartyPopper size={32} /> : <RotateCcw size={30} />}</div>
              <div className="f-display" style={{ fontSize: 42 }}>{correct}/{qs.length}</div>
              <p className="f-h2" style={{ marginTop: 4 }}>{pass ? (isLastInModule ? "Módulo concluído! 🏆" : "Lição concluída! 🎉") : "Quase lá!"}</p>
              <p className="f-muted" style={{ fontSize: 14, marginTop: 6, maxWidth: 300, marginLeft: "auto", marginRight: "auto" }}>{pass ? (isLastInModule ? "Você terminou este módulo e desbloqueou o próximo na trilha. +20 XP!" : "Você desbloqueou a próxima lição. +20 XP!") : "Acerte pelo menos metade para concluir. Bora tentar de novo?"}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
                {pass ? (
                  <button className="f-btn primary block" onClick={onBack}>Voltar ao módulo <ArrowRight size={18} /></button>
                ) : (
                  <>
                    <button className="f-btn primary block" onClick={load}><RotateCcw size={16} /> Tentar de novo</button>
                    <button className="f-btn ghost block" onClick={onBack}>Voltar ao módulo</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ModuleView({ mod, moduleIndex, onBack }) {
  const { doneLessons } = useApp();
  const [openIdx, setOpenIdx] = useState(null);
  const total = mod.lessons.length;
  const done = mod.lessons.filter((_, i) => doneLessons.has(mod.key + "-" + i)).length;
  const isUnlocked = (i) => true; // todas as lições liberadas

  if (openIdx !== null) {
    const i = openIdx;
    return (
      <LessonView
        lesson={mod.lessons[i]}
        lessonId={mod.key + "-" + i}
        subtitle={`${mod.title} · Lição ${i + 1}`}
        isLastInModule={i === total - 1}
        onBack={() => setOpenIdx(null)}
      />
    );
  }

  return (
    <div className="f-scroll">
      <div className="f-top">
        <button className="f-avatar-btn" onClick={onBack}><ArrowLeft size={17} /></button>
        <div style={{ textAlign: "center" }}><div className="f-h2" style={{ fontSize: 15 }}>{mod.title}</div><div className="f-faint" style={{ fontSize: 11, fontWeight: 700 }}>{done}/{total} lições</div></div>
        <div style={{ width: 34 }} />
      </div>
      <div className="f-pad">
        <div className="f-card f-pad" style={{ padding: 16, marginBottom: 16, background: `linear-gradient(135deg, ${mod.color}, ${mod.color}bb)`, border: "none", color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(255,255,255,.22)", display: "grid", placeItems: "center", flex: "none" }}><mod.icon size={22} /></div>
            <div style={{ flex: 1, minWidth: 0 }}><div className="f-h2" style={{ color: "#fff" }}>{mod.title}</div><div style={{ fontSize: 12.5, opacity: .9, fontWeight: 600 }}>{mod.subtitle}</div></div>
          </div>
          <div className="f-xpbar" style={{ background: "rgba(255,255,255,.2)", marginTop: 13 }}><div className="f-xpfill" style={{ width: `${total ? (done / total) * 100 : 0}%`, background: "#fff" }} /></div>
        </div>

        {mod.lessons.map((ls, i) => {
          const ok = doneLessons.has(mod.key + "-" + i);
          const open = isUnlocked(i);
          return (
            <button key={i} onClick={() => open && setOpenIdx(i)} disabled={!open} className="f-card"
              style={{ width: "100%", padding: 13, marginBottom: 9, display: "flex", alignItems: "center", gap: 12, textAlign: "left", opacity: open ? 1 : .5, cursor: open ? "pointer" : "default" }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, flex: "none", display: "grid", placeItems: "center", background: ok ? "var(--ok)" : open ? mod.color : "#E8E1F0", color: ok || open ? "#fff" : "var(--ink3)" }}>
                {ok ? <Check size={19} /> : open ? <span style={{ fontWeight: 800, fontSize: 15, fontFamily: "'Space Grotesk',sans-serif" }}>{i + 1}</span> : <Lock size={15} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 14.5 }}>{ls.title}</div>
                <div className="f-faint" style={{ fontSize: 12, fontWeight: 600, marginTop: 1 }}>{ok ? "Concluída · toque para revisar" : open ? "4 perguntas · toque para começar" : "Conclua a anterior"}</div>
              </div>
              {open && <ChevronRight size={18} color="var(--ink3)" style={{ flex: "none" }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BrandTop() {
  const { stats, xp, openProfile } = useApp();
  return (
    <div className="f-top">
      <div className="f-brand"><div className="f-logo"><Sparkles size={17} /></div><span className="f-brandname" style={{ fontSize: 15 }}>English for Success</span></div>
      <div className="f-pillrow">
        <span className="f-pill flame"><Flame size={13} /> {stats.streak}</span>
        <span className="f-pill xp"><Zap size={13} /> {xp}</span>
        <button className="f-avatar-btn" onClick={openProfile}><User size={17} /></button>
      </div>
    </div>
  );
}

function TrilhaScreen() {
  const { doneLessons } = useApp();
  const [openMod, setOpenMod] = useState(null);

  const lessonsDoneIn = (m) => MODULES[m].lessons.filter((_, i) => doneLessons.has(MODULES[m].key + "-" + i)).length;
  const moduleComplete = (m) => lessonsDoneIn(m) === MODULES[m].lessons.length;
  const moduleUnlocked = (m) => true; // tudo desbloqueado (até a Fase 3 com progresso salvo)
  const totalDone = MODULES.reduce((n, _, m) => n + lessonsDoneIn(m), 0);
  const totalLessons = MODULES.reduce((n, mod) => n + mod.lessons.length, 0);

  if (openMod !== null) return <ModuleView mod={MODULES[openMod]} moduleIndex={openMod} onBack={() => setOpenMod(null)} />;

  return (
    <>
      <BrandTop />
      <div className="f-scroll">
      <div className="f-pad">
        <div className="f-eyebrow">Sua jornada</div>
        <h2 className="f-h1" style={{ marginTop: 4, marginBottom: 6 }}>Suas trilhas</h2>
        <p className="f-muted" style={{ fontSize: 14, marginBottom: 14 }}>Do dia a dia ao mundo dos negócios. Conclua uma trilha para desbloquear a próxima.</p>

        <div className="f-card f-pad" style={{ padding: 15, marginBottom: 18, background: "linear-gradient(135deg,#2A1E45,#3a2a5e)", border: "none", color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11 }}>
            <Map size={20} /><div><div className="f-display" style={{ fontSize: 21 }}>{totalDone}/{totalLessons}</div><div style={{ fontSize: 12, opacity: .82, fontWeight: 700 }}>lições concluídas</div></div>
          </div>
          <div className="f-xpbar" style={{ background: "rgba(255,255,255,.18)" }}><div className="f-xpfill" style={{ width: `${totalLessons ? (totalDone / totalLessons) * 100 : 0}%` }} /></div>
        </div>

        <div style={{ position: "relative" }}>
          {MODULES.map((mod, m) => {
            const d = lessonsDoneIn(m), tot = mod.lessons.length;
            const unlocked = moduleUnlocked(m);
            const complete = moduleComplete(m);
            const last = m === MODULES.length - 1;
            return (
              <div key={m} style={{ display: "flex", gap: 13, alignItems: "stretch" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 44, flex: "none" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, display: "grid", placeItems: "center", flex: "none", background: complete ? "var(--ok)" : unlocked ? mod.color : "#E8E1F0", color: complete || unlocked ? "#fff" : "var(--ink3)", boxShadow: unlocked ? "0 5px 14px rgba(0,0,0,.13)" : "none" }}>
                    {complete ? <Check size={22} /> : unlocked ? <mod.icon size={21} /> : <Lock size={18} />}
                  </div>
                  {!last && <div style={{ flex: 1, width: 3, background: complete ? "var(--ok)" : "var(--line)", marginTop: 3, marginBottom: 3, borderRadius: 2, minHeight: 20 }} />}
                </div>
                <button onClick={() => unlocked && setOpenMod(m)} disabled={!unlocked} className="f-card"
                  style={{ flex: 1, minWidth: 0, textAlign: "left", padding: 14, marginBottom: 14, opacity: unlocked ? 1 : .6, cursor: unlocked ? "pointer" : "default", borderLeft: `3px solid ${unlocked ? mod.color : "transparent"}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, fontFamily: "'Space Grotesk',sans-serif" }}>{mod.title}</div>
                    {unlocked && <ChevronRight size={18} color="var(--ink3)" style={{ flex: "none" }} />}
                  </div>
                  <div className="f-faint" style={{ fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>{mod.subtitle}</div>
                  {unlocked ? (
                    <div style={{ marginTop: 10 }}>
                      <div className="f-xpbar"><div className="f-xpfill" style={{ width: `${(d / tot) * 100}%`, background: mod.color }} /></div>
                      <div className="f-faint" style={{ fontSize: 11.5, fontWeight: 700, marginTop: 5 }}>{d}/{tot} lições{complete ? " · concluído ✓" : ""}</div>
                    </div>
                  ) : (
                    <div className="f-faint" style={{ fontSize: 12, fontWeight: 600, marginTop: 8 }}>🔒 Conclua o módulo anterior</div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </>
  );
}

function PraticarScreen({ onOpen }) {
  return (
    <>
      <BrandTop />
      <div className="f-scroll">
      <div className="f-pad">
        <div className="f-eyebrow">Prática livre</div>
        <h2 className="f-h1" style={{ marginTop: 4, marginBottom: 6 }}>Praticar</h2>
        <p className="f-muted" style={{ fontSize: 14, marginBottom: 16 }}>Ferramentas pra treinar do seu jeito, quando quiser.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {PRACTICE_TOOLS.map((t) => (
            <button key={t.id} onClick={() => onOpen(t.id)} className="f-card" style={{ width: "100%", padding: 15, display: "flex", alignItems: "center", gap: 13, textAlign: "left" }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, flex: "none", display: "grid", placeItems: "center", background: t.color, color: "#fff" }}><t.icon size={22} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{t.label}</div>
                <div className="f-faint" style={{ fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>{t.desc}</div>
              </div>
              <ChevronRight size={19} color="var(--ink3)" style={{ flex: "none" }} />
            </button>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}

function UKScreen() {
  const [view, setView] = useState("hub");
  const [mod, setMod] = useState(null);
  const [roleSc, setRoleSc] = useState(null);

  if (roleSc) return <MiniRoleplay scenario={roleSc} onBack={() => setRoleSc(null)} />;
  if (view === "module" && mod) return <UKModule mod={mod} onBack={() => setView("hub")} onPlay={(sc) => setRoleSc(sc)} />;

  return (
    <div className="f-scroll">
      <div className="f-pad">
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 2 }}>
          <Flag size={17} color="var(--coral)" /><div className="f-eyebrow">Reino Unido</div>
        </div>
        <h2 className="f-h1" style={{ marginTop: 4, marginBottom: 6 }}>Inglês pra viver no UK</h2>
        <p className="f-muted" style={{ fontSize: 14, marginBottom: 16 }}>Situações reais do dia a dia britânico: trabalho, NHS, moradia, banco e muito mais.</p>

        <p className="f-faint" style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 10 }}>Módulos</p>
        <div className="f-grid2">
          {UK_MODULES.map((m) => (
            <button key={m.id} onClick={() => { setMod(m); setView("module"); }} className="f-card" style={{ padding: 14, textAlign: "left", display: "flex", flexDirection: "column", gap: 9, alignItems: "flex-start" }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: "#F4EEFB", color: "var(--ink)", display: "grid", placeItems: "center" }}><m.icon size={19} /></div>
              <div><div style={{ fontWeight: 800, fontSize: 14 }}>{m.label}</div><div className="f-faint" style={{ fontSize: 11.5, fontWeight: 600, marginTop: 2 }}>{m.desc}</div></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================ DASHBOARD ============================ */
function DashScreen({ openPlans }) {
  const { profile, xp, stats, unlocked } = useApp();
  const [tab, setTab] = useState("week");
  const medal = medalFor(xp);
  const lo = tierMin(xp), hi = tierMax(xp);
  const week = [12, 20, 8, 25, 16, stats.minutes, 0];
  const month = [60, 85, 70, 40 + stats.minutes];
  const data = tab === "week" ? week : month;
  const labels = tab === "week" ? ["S", "T", "Q", "Q", "S", "S", "D"] : ["Sem 1", "Sem 2", "Sem 3", "Sem 4"];
  const max = Math.max(...data, 10);

  return (
    <div className="f-scroll">
      <div className="f-pad">
        <div className="f-eyebrow">Seu progresso</div>
        <h2 className="f-h1" style={{ marginTop: 4, marginBottom: 16 }}>Olá, {profile.name} 👋</h2>

        <div className="f-card f-pad" style={{ padding: 16, marginBottom: 14, background: "linear-gradient(135deg,#2A1E45,#3a2a5e)", border: "none", color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="f-medal" style={{ background: medal.c, color: "#2a1e45" }}><Trophy size={22} /></div>
              <div><div style={{ fontSize: 12, opacity: .8, fontWeight: 700 }}>Liga {medal.n}</div><div className="f-display" style={{ fontSize: 26 }}>{xp} XP</div></div>
            </div>
            <button className="f-pill" style={{ background: "rgba(255,255,255,.14)", color: "#fff" }} onClick={openPlans}><Crown size={14} /> Planos</button>
          </div>
          <div className="f-xpbar" style={{ marginTop: 14, background: "rgba(255,255,255,.18)" }}><div className="f-xpfill" style={{ width: `${Math.min(100, ((xp - lo) / (hi - lo)) * 100)}%` }} /></div>
          <p style={{ fontSize: 11.5, opacity: .8, marginTop: 7, fontWeight: 600 }}>Faltam {Math.max(0, hi - xp)} XP para a próxima liga</p>
        </div>

        <div className="f-grid2" style={{ marginBottom: 11 }}>
          <div className="f-stat"><div style={{ display: "flex", alignItems: "center", gap: 6 }}><Flame size={16} color="var(--coral)" /><span className="f-statnum">{stats.streak}</span></div><div className="f-statlab">Dias seguidos</div></div>
          <div className="f-stat"><div style={{ display: "flex", alignItems: "center", gap: 6 }}><MessageCircle size={16} color="var(--sky)" /><span className="f-statnum">{stats.messages}</span></div><div className="f-statlab">Mensagens</div></div>
          <div className="f-stat"><div style={{ display: "flex", alignItems: "center", gap: 6 }}><BookOpen size={16} color="var(--lime-d)" /><span className="f-statnum">{stats.wordsLearned}</span></div><div className="f-statlab">Palavras aprendidas</div></div>
          <div className="f-stat"><div style={{ display: "flex", alignItems: "center", gap: 6 }}><GraduationCap size={16} color="var(--coral)" /><span className="f-statnum">{stats.lessons}</span></div><div className="f-statlab">Lições concluídas</div></div>
        </div>

        <div className="f-card f-pad" style={{ padding: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span className="f-h2" style={{ fontSize: 16 }}>Tempo de estudo</span>
            <div className="f-seg" style={{ width: 150 }}>
              <button className={tab === "week" ? "on" : ""} onClick={() => setTab("week")}>Semana</button>
              <button className={tab === "month" ? "on" : ""} onClick={() => setTab("month")}>Mês</button>
            </div>
          </div>
          <div className="f-bars">
            {data.map((v, i) => (
              <div className="f-bar" key={i}>
                <div className="f-barfill" style={{ height: `${(v / max) * 100}%` }} />
                <span className="f-barlab">{labels[i]}</span>
              </div>
            ))}
          </div>
          <p className="f-faint" style={{ fontSize: 11.5, textAlign: "center", marginTop: 4 }}>minutos · exemplo de acompanhamento</p>
        </div>

        <span className="f-h2" style={{ fontSize: 16 }}>Conquistas</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 11 }}>
          {ACHIEVEMENTS.map((a) => {
            const on = unlocked.has(a.id);
            return (
              <div className={"f-badge" + (on ? "" : " locked")} key={a.id}>
                <div className="bic" style={{ background: on ? a.color : "#E8E1F0", color: on ? "#fff" : "var(--ink3)" }}>{on ? <a.icon size={20} /> : <Lock size={17} />}</div>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 14 }}>{a.label}</div><div className="f-faint" style={{ fontSize: 12.5, fontWeight: 600 }}>{a.desc}</div></div>
                {on && <Check size={18} color="var(--ok)" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================ SHEETS ============================ */
function PlansSheet({ onClose, plan, onChoose }) {
  const brl = isInBrazil();
  return (
    <div className="f-overlay" onClick={onClose}>
      <div className="f-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="f-handle" />
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div className="f-eyebrow">Escolha seu plano</div>
          <h2 className="f-h1" style={{ marginTop: 4 }}>Aprenda sem limites</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {PLANS.map((p) => (
            <div className={"f-plan" + (p.feat_flag ? " feat" : "")} key={p.id}>
              {p.feat_flag && <div className="f-pill" style={{ background: "var(--coral)", color: "#fff", marginBottom: 8 }}><Star size={12} fill="#fff" /> Mais popular</div>}
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span className="f-h2">{p.name}</span>
                <div style={{ textAlign: "right" }}><span className="f-price">{brl ? p.brl : p.gbp}</span><span className="f-faint" style={{ fontSize: 13, fontWeight: 700 }}> {p.per}</span></div>
              </div>
              <div style={{ margin: "6px 0 12px" }}>{p.feat.map((f, i) => <div className="f-feat" key={i}><span className="ck"><Check size={11} /></span>{f}</div>)}</div>
              <button className={"f-btn block " + (plan === p.id ? "ghost" : p.feat_flag ? "primary" : "dark")} disabled={plan === p.id}
                onClick={() => onChoose(p.id)}>{plan === p.id ? "Plano atual" : p.cta}</button>
            </div>
          ))}
        </div>
        <p className="f-faint" style={{ fontSize: 11.5, textAlign: "center", marginTop: 14 }}>No app real, o pagamento é processado com segurança via Stripe Checkout.</p>
      </div>
    </div>
  );
}

function ProfileSheet({ onClose, onPlans, onReset }) {
  const { profile, xp, plan, stats } = useApp();
  const medal = medalFor(xp);
  return (
    <div className="f-overlay" onClick={onClose}>
      <div className="f-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="f-handle" />
        <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 18 }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: "linear-gradient(135deg,var(--coral),#FFA040)", color: "#fff", display: "grid", placeItems: "center" }}><User size={26} /></div>
          <div><div className="f-h2">{profile.name}</div><div className="f-faint" style={{ fontSize: 13, fontWeight: 700 }}>Nível {profile.level} · {profile.goalLabel}</div></div>
        </div>
        <div className="f-grid2" style={{ marginBottom: 14 }}>
          <div className="f-stat"><div className="f-statnum">{xp}</div><div className="f-statlab">XP · Liga {medal.n}</div></div>
          <div className="f-stat"><div className="f-statnum">{stats.wordsLearned}</div><div className="f-statlab">Palavras</div></div>
        </div>
        <div className="f-card" style={{ overflow: "hidden", marginBottom: 14 }}>
          <button onClick={onPlans} style={{ width: "100%", padding: 15, display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--line)" }}>
            <Crown size={19} color="var(--coral)" /><span style={{ flex: 1, textAlign: "left", fontWeight: 700, fontSize: 14.5 }}>Plano: {PLANS.find((p) => p.id === plan)?.name}</span><ChevronRight size={17} color="var(--ink3)" />
          </button>
          <button onClick={onReset} style={{ width: "100%", padding: 15, display: "flex", alignItems: "center", gap: 12 }}>
            <RotateCcw size={18} color="var(--ink2)" /><span style={{ flex: 1, textAlign: "left", fontWeight: 700, fontSize: 14.5 }}>Recomeçar do início</span><ChevronRight size={17} color="var(--ink3)" />
          </button>
        </div>
        <button className="f-btn ghost block" onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}

/* ============================ APP ============================ */
const TABS = [
  { id: "trilha", label: "Trilha", icon: Map },
  { id: "praticar", label: "Praticar", icon: Dumbbell },
  { id: "dash", label: "Progresso", icon: BarChart3 },
];

// Telas que vivem "dentro" da aba Praticar (mantêm a aba Praticar destacada).
const PRACTICE_TABS = ["chat", "pron", "vocab", "grammar", "sim", "uk"];

export default function App() {
  const [stage, setStage] = useState("welcome");
  const [profile, setProfile] = useState({ name: "", goal: null, goalLabel: "", level: "A1" });
  const [testData, setTestData] = useState(null);
  const [tab, setTab] = useState("trilha");

  const [xp, setXp] = useState(0);
  const [stats, setStats] = useState({ messages: 0, wordsLearned: 0, pron: 0, sims: 0, lessons: 0, minutes: 0, streak: 1, days: 1 });
  const [favorites, setFavorites] = useState(new Set());
  const [learned, setLearnedSet] = useState(new Set());
  const [unlocked, setUnlocked] = useState(new Set());
  const [doneLessons, setDoneLessons] = useState(new Set());
  const [plan, setPlan] = useState("free");
  const [toasts, setToasts] = useState([]);
  const [sheet, setSheet] = useState(null); // 'profile' | 'plans'
  const prevUnlocked = useRef(new Set());

  const [hydrated, setHydrated] = useState(false);

  // Carrega o progresso salvo uma vez, ao abrir o app.
  useEffect(() => {
    const s = loadSnapshot();
    if (s) {
      if (s.stage) setStage(s.stage);
      if (s.tab) setTab(s.tab);
      if (s.plan) setPlan(s.plan);
      if (typeof s.xp === "number") setXp(s.xp);
      if (s.profile) setProfile(s.profile);
      if (s.testData) setTestData(s.testData);
      if (s.stats) setStats(s.stats);
      if (s.favorites) setFavorites(new Set(s.favorites));
      if (s.learned) setLearnedSet(new Set(s.learned));
      if (s.doneLessons) setDoneLessons(new Set(s.doneLessons));
      if (s.unlocked) {
        const u = new Set(s.unlocked);
        setUnlocked(u);
        prevUnlocked.current = u; // evita re-disparar conquistas ao recarregar
      }
    }
    setHydrated(true);
  }, []);

  // Salva o snapshot sempre que algo relevante muda (só depois de hidratar).
  useEffect(() => {
    if (!hydrated) return;
    saveSnapshot({
      stage, tab, plan, xp, profile, testData, stats,
      favorites: [...favorites],
      learned: [...learned],
      unlocked: [...unlocked],
      doneLessons: [...doneLessons],
    });
  }, [hydrated, stage, tab, plan, xp, profile, testData, stats, favorites, learned, unlocked, doneLessons]);

  // session timer -> minutes studied
  useEffect(() => {
    if (stage !== "app") return;
    const t = setInterval(() => setStats((s) => ({ ...s, minutes: s.minutes + 1 })), 60000);
    return () => clearInterval(t);
  }, [stage]);

  const pushToast = useCallback((node) => {
    const id = Math.random();
    setToasts((t) => [...t, { id, node }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  // achievement checks
  useEffect(() => {
    const next = new Set(unlocked);
    ACHIEVEMENTS.forEach((a) => { if (!next.has(a.id) && a.test(stats)) next.add(a.id); });
    if (next.size !== unlocked.size) {
      next.forEach((id) => {
        if (!prevUnlocked.current.has(id)) {
          const a = ACHIEVEMENTS.find((x) => x.id === id);
          pushToast(<><span className="ti" style={{ background: a.color, color: "#fff" }}><a.icon size={15} /></span>Conquista: {a.label}!</>);
        }
      });
      prevUnlocked.current = next;
      setUnlocked(next);
    }
  }, [stats, unlocked, pushToast]);

  const addXp = useCallback((n) => { setXp((x) => x + n); pushToast(<><span className="ti" style={{ background: "var(--lime)", color: "#243a00" }}><Zap size={15} /></span>+{n} XP</>); }, [pushToast]);
  const bump = useCallback((key, by = 1) => setStats((s) => ({ ...s, [key]: (s[key] || 0) + by })), []);
  const toggleFav = useCallback((w) => setFavorites((f) => { const n = new Set(f); n.has(w) ? n.delete(w) : n.add(w); return n; }), []);
  const markLearned = useCallback((w) => setLearnedSet((l) => new Set(l).add(w)), []);
  const completeLesson = useCallback((id) => {
    if (!doneLessons.has(id)) addXp(20);
    setDoneLessons((s) => { const n = new Set(s); n.add(id); return n; });
  }, [doneLessons, addXp]);

  const ctx = { profile, xp, addXp, stats, bump, favorites, toggleFav, learned, markLearned, unlocked, plan, doneLessons, completeLesson, openPlans: () => setSheet("plans"), openProfile: () => setSheet("profile") };

  const resetAll = () => {
    clearSnapshot();
    setStage("welcome"); setProfile({ name: "", goal: null, goalLabel: "", level: "A1" });
    setXp(0); setStats({ messages: 0, wordsLearned: 0, pron: 0, sims: 0, lessons: 0, minutes: 0, streak: 1, days: 1 });
    setFavorites(new Set()); setLearnedSet(new Set()); setUnlocked(new Set()); setDoneLessons(new Set()); prevUnlocked.current = new Set();
    setPlan("free"); setTab("trilha"); setSheet(null);
  };

  if (!hydrated) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0E16", display: "grid", placeItems: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#FF7A18,#FFA040)", display: "grid", placeItems: "center", color: "#fff" }}>
          <Sparkles size={22} />
        </div>
      </div>
    );
  }

  return (
    <div className="falo">
      <style dangerouslySetInnerHTML={{ __html: CSS + ".spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}" }} />
      <div className="f-backdrop">
        <div className="f-canvas">
          <div className="f-toasts">{toasts.map((t) => <div className="f-toast" key={t.id}>{t.node}</div>)}</div>

          {stage === "welcome" && <Welcome onNext={() => setStage("profile")} />}
          {stage === "profile" && <ProfileSetup onNext={(p) => { setProfile((pr) => ({ ...pr, ...p })); setStage("test"); }} />}
          {stage === "test" && <PlacementTest onNext={(d) => { setTestData(d); setProfile((pr) => ({ ...pr, level: d.level })); setStage("result"); }} />}
          {stage === "result" && <Result data={testData} profile={profile} onDone={() => { setStage("app"); }} />}

          {stage === "app" && (
            <Ctx.Provider value={ctx}>
              {tab !== "chat" && tab !== "sim" && tab !== "uk" && tab !== "trilha" && tab !== "praticar" && (
                <div className="f-top">
                  <div className="f-brand"><div className="f-logo"><Sparkles size={17} /></div><span className="f-brandname" style={{ fontSize: 15 }}>English for Success</span></div>
                  <div className="f-pillrow">
                    <span className="f-pill flame"><Flame size={13} /> {stats.streak}</span>
                    <span className="f-pill xp"><Zap size={13} /> {xp}</span>
                    <button className="f-avatar-btn" onClick={() => setSheet("profile")}><User size={17} /></button>
                  </div>
                </div>
              )}

              {tab === "trilha" && <TrilhaScreen />}
              {tab === "praticar" && <PraticarScreen onOpen={setTab} />}
              {tab === "chat" && <ChatScreen />}
              {tab === "pron" && <PronScreen />}
              {tab === "vocab" && <VocabScreen />}
              {tab === "grammar" && <GrammarScreen />}
              {tab === "sim" && <SimScreen />}
              {tab === "uk" && <UKScreen />}
              {tab === "dash" && <DashScreen openPlans={() => setSheet("plans")} />}

              <div className="f-tabbar">
                {TABS.map((t) => {
                  const active = tab === t.id || (t.id === "praticar" && PRACTICE_TABS.includes(tab));
                  return (
                    <button key={t.id} className={"f-tab" + (active ? " on" : "")} onClick={() => setTab(t.id)}>
                      <t.icon size={22} /><span className="lab">{t.label}</span><span className="dot" />
                    </button>
                  );
                })}
              </div>

              {sheet === "plans" && <PlansSheet onClose={() => setSheet(null)} plan={plan} onChoose={(id) => { setPlan(id); setSheet(null); pushToast(<><span className="ti" style={{ background: "var(--coral)", color: "#fff" }}><Crown size={15} /></span>Plano {PLANS.find((p) => p.id === id)?.name} ativado (demo)</>); }} />}
              {sheet === "profile" && <ProfileSheet onClose={() => setSheet(null)} onPlans={() => setSheet("plans")} onReset={resetAll} />}
            </Ctx.Provider>
          )}
        </div>
      </div>
    </div>
  );
}
