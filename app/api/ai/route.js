// Um único endpoint que faz tudo: conversa + correção, falar (TTS) e transcrever voz (Whisper).
// A chave da OpenAI fica só aqui no servidor — o navegador nunca a vê.

export const runtime = "nodejs";

export async function POST(req) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return Response.json(
      { error: "OPENAI_API_KEY ausente. Adicione nas Environment Variables da Vercel." },
      { status: 500 }
    );
  }

  const contentType = req.headers.get("content-type") || "";

  // ---- 1) Áudio gravado no navegador -> Whisper (transcrição) ----
  if (contentType.includes("multipart/form-data")) {
    let form;
    try { form = await req.formData(); } catch { return Response.json({ error: "bad_request" }, { status: 400 }); }
    const file = form.get("audio");
    if (!file) return Response.json({ error: "missing_audio" }, { status: 400 });
    try {
      const fd = new FormData();
      fd.append("file", file, "speech.webm");
      fd.append("model", "whisper-1");
      fd.append("language", "en"); // prática de inglês; remova para detectar automaticamente
      const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
        body: fd,
      });
      if (!r.ok) return Response.json({ error: "whisper_error", detail: await r.text() }, { status: 502 });
      const data = await r.json();
      return Response.json({ text: data.text || "" });
    } catch (e) {
      return Response.json({ error: "network_error" }, { status: 502 });
    }
  }

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "bad_request" }, { status: 400 }); }

  // ---- 2) Falar -> OpenAI TTS (áudio MP3, funciona em qualquer navegador) ----
  if (body.action === "tts") {
    if (!body.text) return new Response("missing_text", { status: 400 });
    try {
      const r = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: "tts-1", voice: body.voice || "nova", input: body.text, response_format: "mp3" }),
      });
      if (!r.ok) return new Response(await r.text(), { status: 502 });
      const buf = await r.arrayBuffer();
      return new Response(buf, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
    } catch (e) {
      return new Response("network_error", { status: 502 });
    }
  }

  // ---- 3) Aula de gramática gerada pela IA ----
  if (body.mode === "grammar") {
    const topic = body.topic || "Present Simple";
    const lvl = body.level || "B1";
    const sys =
      `You are an English grammar teacher for Brazilian learners (CEFR ${lvl}). ` +
      `Create a short, clear lesson about "${topic}". Reply with ONLY a JSON object: ` +
      `{"title":"<topic in English>","explanation":"<2 to 4 sentence explanation in Brazilian Portuguese>",` +
      `"rules":["<rule 1 in PT>","<rule 2 in PT>","<rule 3 in PT>"],` +
      `"examples":[{"en":"<English example>","pt":"<PT translation>"}],` +
      `"tip":"<one common mistake Brazilians make with this topic, in PT>"}. ` +
      `Give exactly 4 examples. Keep it concise and beginner-friendly.`;
    try {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [{ role: "system", content: sys }, { role: "user", content: `Crie a aula sobre: ${topic}` }],
          temperature: 0.5,
          max_tokens: 800,
        }),
      });
      if (!r.ok) return Response.json({ error: "openai_error", detail: await r.text() }, { status: 502 });
      const data = await r.json();
      try { return Response.json(JSON.parse(data?.choices?.[0]?.message?.content || "{}")); }
      catch { return Response.json({ title: topic, explanation: "", rules: [], examples: [], tip: "" }); }
    } catch (e) {
      return Response.json({ error: "network_error" }, { status: 502 });
    }
  }

  // ---- 4) Vocabulário gerado pela IA ----
  if (body.mode === "vocab") {
    const category = body.category || "Conversação cotidiana";
    const lvl = body.level || "B1";
    const count = Math.min(Math.max(parseInt(body.count) || 8, 1), 12);
    const exclude = Array.isArray(body.exclude) ? body.exclude : [];
    const sys =
      `You generate English vocabulary for Brazilian learners (CEFR ${lvl}). ` +
      `Produce ${count} useful words or short phrases for the category "${category}". ` +
      `Reply with ONLY a JSON object: {"words":[{"word":"<English word>","translation":"<Brazilian Portuguese>",` +
      `"example":"<natural English sentence>","synonyms":["<syn1>","<syn2>"],"antonyms":["<ant1>"]}]}. ` +
      (exclude.length ? `Do NOT include these words: ${exclude.join(", ")}. ` : "") +
      `Antonyms may be an empty array when none apply. Keep words relevant to the category and level.`;
    try {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [{ role: "system", content: sys }, { role: "user", content: `Categoria: ${category}` }],
          temperature: 0.6,
          max_tokens: 900,
        }),
      });
      if (!r.ok) return Response.json({ error: "openai_error", detail: await r.text() }, { status: 502 });
      const data = await r.json();
      try { return Response.json(JSON.parse(data?.choices?.[0]?.message?.content || "{}")); }
      catch { return Response.json({ words: [] }); }
    } catch (e) {
      return Response.json({ error: "network_error" }, { status: 502 });
    }
  }

  // ---- 4b) Mini-lição interativa (explicação + perguntas de múltipla escolha) ----
  if (body.mode === "lesson") {
    const focus = body.topic || "everyday English";
    const lvl = body.level || "B1";
    const sys =
      `You are an English teacher for Brazilian learners (CEFR ${lvl}). ` +
      `Create a short interactive mini-lesson about: ${focus}. ` +
      `Reply with ONLY a JSON object: {"title":"<short English title>",` +
      `"intro":"<2 to 3 sentence explanation in Brazilian Portuguese that teaches the key English for this topic>",` +
      `"questions":[{"q":"<a clear multiple-choice question testing this English>","q_pt":"<the question above translated to natural Brazilian Portuguese>","options":["A","B","C","D"],` +
      `"answer":0,"explain":"<one short sentence in Brazilian Portuguese explaining the correct answer>"}]}. ` +
      `Give exactly 4 questions, each with exactly 4 options and one correct answer ("answer" is the 0-based index). ` +
      `Make the questions practical and matched to level ${lvl}, and vary them each time.`;
    try {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [{ role: "system", content: sys }, { role: "user", content: `Tema: ${focus}` }],
          temperature: 0.8,
          max_tokens: 1000,
        }),
      });
      if (!r.ok) return Response.json({ error: "openai_error", detail: await r.text() }, { status: 502 });
      const data = await r.json();
      try { return Response.json(JSON.parse(data?.choices?.[0]?.message?.content || "{}")); }
      catch { return Response.json({ title: "Lesson", intro: "", questions: [] }); }
    } catch (e) {
      return Response.json({ error: "network_error" }, { status: 502 });
    }
  }

  // ---- 4b) Tradução sob demanda (qualquer texto EN -> PT) ----
  if (body.mode === "translate") {
    const text = (body.text || "").slice(0, 1200);
    if (!text) return Response.json({ translation: "" });
    try {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Translate the user's English text into natural Brazilian Portuguese. Reply with ONLY the translation — no quotes, no notes, no extra text." },
            { role: "user", content: text },
          ],
          temperature: 0.3,
          max_tokens: 400,
        }),
      });
      if (!r.ok) return Response.json({ translation: "" }, { status: 502 });
      const data = await r.json();
      return Response.json({ translation: (data?.choices?.[0]?.message?.content || "").trim() });
    } catch (e) {
      return Response.json({ translation: "" }, { status: 502 });
    }
  }

  // ---- 5) Padrão: chat (tutor) ou role-play (simulações) ----
  const { mode = "tutor", chatMode = "free", messages = [], level = "B1", goal = "Conversação", scenarioRole = "", opener = "" } = body;

  const FOCUS = {
    free: "Have a relaxed, friendly everyday conversation about daily life, hobbies and interests.",
    teacher: "Act as a patient teacher: explain clearly and, when you correct, briefly teach the rule.",
    interview: "Act as a job interviewer: ask realistic interview questions one at a time and give brief encouragement.",
    business: "Focus on business English: meetings, emails, negotiations and presentations; professional but clear.",
    travel: "Focus on travel situations: airports, hotels, restaurants, directions and small talk with locals.",
  };

  let system;
  let useJson = false;
  if (mode === "role") {
    system =
      `You are role-playing as ${scenarioRole}. Stay fully in character and never break character or mention being an AI. ` +
      `The user is a Brazilian practicing conversational English (CEFR level ${level}), so speak naturally but keep it understandable. ` +
      `You already greeted them with: "${opener}". Reply in English only, 1-3 sentences, and always move the scene forward with a question or prompt that invites the user to respond.`;
  } else {
    useJson = true;
    system =
      `You are Delagassa, a warm but motivating personal English mentor for Brazilian learners who want to grow their career, move abroad, or build a business. If the student asks your name, you are Delagassa, their mentor. ` +
      `The student's CEFR level is ${level} and their goal is "${goal}". Adapt your English to their level. ` +
      `Keep replies short (1-3 sentences), natural, and always end with a friendly follow-up question.\n` +
      `Reply with ONLY a JSON object with this exact shape:\n` +
      `{"reply":"your English reply","translation":"a natural Brazilian Portuguese translation of reply",` +
      `"correction":{"hasError":true or false,"original":"the student's sentence if it had an error else empty",` +
      `"corrected":"the corrected sentence else empty",` +
      `"explanation":"a short, friendly explanation in Brazilian Portuguese of the mistake else empty"}}\n` +
      `Only flag real, meaningful errors (grammar, word choice, verb tense). Ignore capitalization and punctuation. ` +
      `If the message is fine, set hasError to false. ` +
      `Conversation focus: ${FOCUS[chatMode] || FOCUS.free}`;
  }

  const payload = {
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: system }, ...messages],
    temperature: 0.7,
    max_tokens: 600,
  };
  if (useJson) payload.response_format = { type: "json_object" };

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(payload),
    });
    if (!r.ok) return Response.json({ error: "openai_error", detail: await r.text() }, { status: 502 });
    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content || "";
    if (mode === "role") return Response.json({ reply: content.trim() });
    try { return Response.json(JSON.parse(content)); }
    catch { return Response.json({ reply: content.trim(), translation: "", correction: { hasError: false } }); }
  } catch (e) {
    return Response.json({ error: "network_error" }, { status: 502 });
  }
}
