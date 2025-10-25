import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'node:fs';
import path from 'node:path';

// Moderation configuration via env
const AI_THRESHOLD = (() => {
  const v = Number(process.env.MODERATION_AI_THRESHOLD);
  return Number.isFinite(v) && v > 0 && v < 1 ? v : 0.5;
})();

function extractJson(text) {
  if (!text) return null;
  // Strip code fences if present
  const stripped = text.replace(/^```[a-z]*\n|\n```$/g, '').trim();
  // Find the first JSON object
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export async function scoreImpactWithGemini({ actionType, description = '', image = '' }) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are an expert verifier for environmental impact claims.
Given an action type, short description, and optional image URL, estimate a confidence score (0-100) that the claim is likely genuine and meaningful.
Consider clarity, specificity, plausibility, and presence of verifiable details. Do NOT hallucinate facts.
Output STRICT JSON only in the shape: {"score": number (0-100), "reasoning": string (max 280 chars)}.

Data:
- actionType: ${actionType}
- description: ${description}
- imageUrl: ${image || 'n/a'}
`;

  const result = await model.generateContent(prompt);
  const text = result?.response?.text?.() || '';
  const parsed = extractJson(text);
  let score = 0;
  let reasoning = 'No reasoning';
  if (parsed && typeof parsed.score !== 'undefined') {
    const n = Number(parsed.score);
    if (!Number.isNaN(n)) score = Math.max(0, Math.min(100, Math.round(n)));
    if (typeof parsed.reasoning === 'string') reasoning = parsed.reasoning.slice(0, 280);
  }
  return { score, reasoning, raw: text };
}

export function heuristicScore({ actionType = '', description = '' }) {
  const text = `${actionType} ${description}`.toLowerCase();
  let score = 50;
  if (text.includes('tree')) score += 10;
  if (text.includes('beach') || text.includes('cleanup')) score += 8;
  if (text.length > 120) score += 10;
  if (/[0-9]{2,}/.test(text)) score += 5; // contains numbers (counts/quantities)
  score = Math.max(0, Math.min(95, score));
  const reasoning = 'Heuristic estimate based on keywords, length, and specificity.';
  return { score, reasoning };
}

async function readImageAsBase64(imageUrl) {
  try {
    if (!imageUrl) return null;
    // Local uploads (served from /uploads/*)
    if (imageUrl.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), imageUrl.replace(/^\//, ''));
      try {
        const buf = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
        return { b64: buf.toString('base64'), mime };
      } catch {
        // Fallback to HTTP fetch from local server if file path is not accessible
        const port = process.env.PORT || 8787;
        const url = `http://localhost:${port}${imageUrl}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const buf = Buffer.from(await res.arrayBuffer());
        const ct = res.headers.get('content-type') || '';
        const mime = ct.includes('png') ? 'image/png' : 'image/jpeg';
        return { b64: buf.toString('base64'), mime };
      }
    }
    // Remote URL
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get('content-type') || '';
    const mime = ct.includes('png') ? 'image/png' : 'image/jpeg';
    return { b64: buf.toString('base64'), mime };
  } catch {
    return null;
  }
}

export async function analyzeImageAuthenticity({ image }) {
  if (!image) return { aiGeneratedProbability: 0.2, label: 'unknown', reasoning: 'No image provided' };
  const apiKey = process.env.GOOGLE_API_KEY;
  // Quick heuristic if no key
  if (!apiKey) {
    const lower = String(image).toLowerCase();
    const looksAi = /stable|midjourney|generated|ai|synthetic/.test(lower);
    return {
      aiGeneratedProbability: looksAi ? 0.95 : 0.3,
      label: looksAi ? 'ai' : 'unknown',
      reasoning: looksAi ? 'Filename or URL suggests AI generation' : 'Heuristic (no model)'
    };
  }

  const data = await readImageAsBase64(image);
  if (!data) return { aiGeneratedProbability: 0.4, label: 'unknown', reasoning: 'Could not fetch image' };

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const instructions = `You are a forensic image analyst.
Assess whether this photo is likely AI-generated (synthetic) versus a real-world capture.
Consider common artifacts (unnatural textures, inconsistent lighting, deformed hands/text, metadata absence) but avoid overconfidence.
Respond with STRICT JSON: {"aiGeneratedProbability": number (0-1), "label": "ai"|"real"|"unknown", "reasoning": string (<=200 chars)}.`;

  const result = await model.generateContent([
    { text: instructions },
    { inlineData: { data: data.b64, mimeType: data.mime } },
  ]);
  const text = result?.response?.text?.() || '';
  const parsed = extractJson(text);
  if (parsed && typeof parsed.aiGeneratedProbability === 'number') {
    const p = Math.max(0, Math.min(1, Number(parsed.aiGeneratedProbability)));
    const label = typeof parsed.label === 'string' ? parsed.label : (p > 0.5 ? 'ai' : 'real');
    const reasoning = typeof parsed.reasoning === 'string' ? parsed.reasoning.slice(0, 200) : 'Model output';
    return { aiGeneratedProbability: p, label, reasoning, raw: text };
  }
  return { aiGeneratedProbability: 0.7, label: 'unknown', reasoning: 'Unparseable model output', raw: text };
}

export async function generateImageCaption({ image }) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey || !image) return null;
  const data = await readImageAsBase64(image);
  if (!data) return null;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent([
    { text: 'Provide a short, literal caption for this image in one sentence.' },
    { inlineData: { data: data.b64, mimeType: data.mime } },
  ]);
  const text = result?.response?.text?.() || '';
  return text.replace(/\n/g, ' ').slice(0, 240);
}

export async function moderatePost({ text = '', image = '' }) {
  const apiKey = process.env.GOOGLE_API_KEY;
  const caption = await generateImageCaption({ image });
  const instructions = `You are an AI verifier for an impact-tracking dApp.
Evaluate the uploaded post for authenticity and relevance.
Inputs:\n\nText: ${text}\n\nImage description (from vision model): ${caption || 'n/a'}\nDetermine:\n\nIs the image likely real (not AI-generated)?\n\nDoes the text match the image?\n\nShould this post be approved?\nRespond in JSON:\n{ "authenticity": "real | ai_generated", "relevance": "high | low", "decision": "approve | reject", "explanation": "..." }`;

  let llmJson = null;
  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const parts = [{ text: instructions }];
      const img = await readImageAsBase64(image);
      if (img) parts.push({ inlineData: { data: img.b64, mimeType: img.mime } });
      const result = await model.generateContent(parts);
      const raw = result?.response?.text?.() || '';
      llmJson = extractJson(raw);
    } catch {
      llmJson = null;
    }
  }

  // Image authenticity via our analyzer (Gemini multimodal), optional external hook later
  let photo = null;
  try { photo = await analyzeImageAuthenticity({ image }); } catch { photo = null; }

  // Build initial output leaning on the model when available
  const out = {
    authenticity: llmJson?.authenticity || 'unknown',
    relevance: llmJson?.relevance || 'high',
    decision: llmJson?.decision || 'pending',
    explanation: llmJson?.explanation || 'Model-assisted moderation',
    image: photo,
    model: apiKey ? 'gemini-1.5-pro+flash' : 'heuristic',
  };
  // Hard override: if photo is likely AI, reject
  if (photo && typeof photo.aiGeneratedProbability === 'number' && photo.aiGeneratedProbability >= AI_THRESHOLD) {
    out.authenticity = 'ai_generated';
    out.decision = 'reject';
    out.explanation = (out.explanation ? out.explanation + ' ' : '') + `Image flagged as AI-generated ~${Math.round(photo.aiGeneratedProbability*100)}%.`;
    return out;
  }
  // If model approves and photo not flagged, approve
  const dec = String(out.decision || '').toLowerCase();
  const auth = String(out.authenticity || '').toLowerCase();
  const rel = String(out.relevance || '').toLowerCase();
  if (dec === 'approve' && (auth === 'real' || auth === 'unknown') && rel !== 'low') {
    out.decision = 'approve';
    return out;
  }
  // If no model decision but signals look okay, approve conservatively
  if ((!llmJson || dec === 'pending') && text && text.length > 20 && (photo?.aiGeneratedProbability ?? 0) < Math.max(0, AI_THRESHOLD - 0.1)) {
    out.decision = 'approve';
    out.explanation = (out.explanation ? out.explanation + ' ' : '') + 'Heuristic approve (model uncertain, image not flagged).';
    return out;
  }
  // Otherwise mark as pending review rather than blanket reject
  out.decision = 'pending';
  out.explanation = (out.explanation ? out.explanation + ' ' : '') + 'Requires human review.';
  return out;
}
