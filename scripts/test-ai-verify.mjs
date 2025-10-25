import { setTimeout as sleep } from 'node:timers/promises';

const url = 'http://localhost:8787/api/ai/verify';
const payload = {
  actionType: 'Tree Planting',
  description: 'We planted 10 saplings near the river.',
  image: 'https://example.com/midjourney-tree.jpg'
};

async function main() {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const ct = res.headers.get('content-type') || '';
    const raw = await (ct.includes('application/json') ? res.json() : res.text());
    console.log(JSON.stringify({ status: res.status, bodyType: ct, data: raw }, null, 2));
  } catch (e) {
    console.error('AI verify request failed:', e);
    process.exitCode = 1;
  }
}

main();
