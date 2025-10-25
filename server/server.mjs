import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { randomUUID } from 'node:crypto';
import { recoverTypedDataAddress } from 'viem';

// Paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'server');
const UPLOADS_DIR = path.join(ROOT, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure directories exist
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Init DB
const adapter = new JSONFile(DB_FILE);
const db = new Low(adapter, { impacts: [], verifications: [], referrals: [], challenges: [], attestations: [], pools: [], nftMetadata: [] });
await db.read();
// Ensure all top-level collections exist even if an older db.json is present
db.data ||= {};
db.data.impacts ||= [];
db.data.verifications ||= [];
db.data.referrals ||= [];
db.data.challenges ||= [];
db.data.attestations ||= [];
db.data.pools ||= [];
db.data.nftMetadata ||= [];
await db.write();

// --- Demo seeding utilities ---
const demoWallets = [
  '0x12A3456789aBCdEf0123456789abCDef01234567',
  '0x89bCDEF0123456789abCDef0123456789AbcDef0',
  '0xFEdCBA9876543210fEdcBa9876543210FEDcBa98',
  '0x00112233445566778899AaBbCcDdeEfF00112233',
  '0x77aa88BB99cc00DDEe11223344556677889900aa',
];

const demoActions = [
  'Tree Planting',
  'Beach Cleanup',
  'Recycling',
  'Teaching',
  'Solar Installation',
];

const formatTimestamp = (ts) => new Date(ts).toISOString().replace('T', ' ').slice(0, 16);

async function seedDemoData({ reset = false, impacts = 24 } = {}) {
  await db.read();

  if (reset) {
    db.data.impacts = [];
    db.data.verifications = [];
    db.data.referrals = [];
    db.data.challenges = [];
    db.data.attestations = [];
    db.data.pools = [];
    db.data.nftMetadata = [];
  }

  const isEmpty = !db.data.impacts?.length && !db.data.verifications?.length;
  if (!isEmpty && !reset) return; // don't overwrite existing data unless reset

  // Seed referrals (owner codes)
  if (!db.data.referrals?.length) {
    for (const w of demoWallets.slice(0, 3)) {
      db.data.referrals.push({ code: Math.random().toString(36).slice(2, 8).toUpperCase(), ownerWallet: w, createdAt: Date.now(), uses: 0 });
    }
  }

  // Seed impacts across the last 6 weeks with varied actions and scores
  const now = Date.now();
  for (let i = 0; i < impacts; i++) {
    const walletAddress = demoWallets[i % demoWallets.length];
    const actionType = demoActions[i % demoActions.length];
    const createdAt = now - (i * 36 + (i % 7) * 6) * 60 * 60 * 1000; // spread over ~6 weeks
    const id = randomUUID();
    const score = Math.floor(75 + Math.random() * 25); // 75-99
    const reward = Number((10 + Math.random() * 25).toFixed(2));
    const verified = i % 6 !== 0; // roughly ~5/6 verified
    const image = `https://picsum.photos/seed/impact-${i}/640/360`;

    db.data.impacts.push({
      id,
      walletAddress,
      actionType,
      description: `${actionType} demo impact #${i + 1}`,
      image,
      status: verified ? 'verified' : 'pending',
      aiScore: verified ? score : null,
      reward: verified ? reward : null,
      nftMinted: verified,
      createdAt,
      referralCode: db.data.referrals[0]?.code || null,
    });
    db.data.verifications.push({
      id: `VR-${Math.floor(1000 + Math.random() * 9000)}`,
      wallet: `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`,
      action: actionType,
      status: verified ? 'verified' : 'pending',
      aiScore: verified ? score : null,
      timestamp: formatTimestamp(createdAt + 60 * 60 * 1000),
      ipfsHash: 'QmPlaceholder',
      impactId: id,
    });
  }

  // Seed one sponsor pool covering last 30 days with a basic distribution
  if (!db.data.pools?.length) {
    const startAt = now - 30 * 24 * 60 * 60 * 1000;
    const endAt = now;
    const pool = {
      id: randomUUID(),
      name: 'Earth Month Pool',
      startAt,
      endAt,
      budget: 1000,
      contributions: [
        { sponsor: demoWallets[0], amount: 250 },
        { sponsor: demoWallets[1], amount: 150 },
      ],
      distributions: [],
      createdAt: now,
    };
    db.data.pools.push(pool);

    // Auto compute one distribution if there are verified impacts in the window
    const impactsInWindow = db.data.impacts.filter((i) => i.status === 'verified' && i.createdAt >= startAt && i.createdAt <= endAt);
    if (impactsInWindow.length) {
      const totalWeight = impactsInWindow.reduce((s, i) => s + Number(i.aiScore || 0), 0) || impactsInWindow.length;
      const budget = pool.budget + pool.contributions.reduce((s, c) => s + Number(c.amount || 0), 0);
      const allocations = impactsInWindow.map((i) => {
        const w = Number(i.aiScore || 0) || 1;
        const amount = (w / totalWeight) * budget;
        return { walletAddress: i.walletAddress, impactId: i.id, amount: Number(amount.toFixed(2)) };
      });
      const totalDistributed = Number(allocations.reduce((s, a) => s + a.amount, 0).toFixed(2));
      pool.distributions.push({ at: now, totalDistributed, allocations });
    }
  }

  // A few NFT metadata samples
  if (!db.data.nftMetadata?.length) {
    for (let i = 0; i < 3; i++) {
      db.data.nftMetadata.push({
        id: randomUUID(),
        name: `ImpactX PoI #${i + 1}`,
        description: 'Proof of Impact demo metadata',
        image: `https://picsum.photos/seed/meta-${i}/512/512`,
        attributes: [
          { trait_type: 'app', value: 'ImpactX' },
          { trait_type: 'network', value: 'Celo Sepolia' },
        ],
        createdAt: now - i * 1000,
      });
    }
  }

  // Persist
  await db.write();
}

// Auto-seed on first run (no data)
await seedDemoData({ reset: false });

// Multer storage
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOADS_DIR),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage });

// Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// List impacts by wallet
app.get('/api/impacts', async (req, res) => {
  const walletAddress = String(req.query.walletAddress || '').toLowerCase();
  await db.read();
  let list = db.data.impacts;
  if (walletAddress) list = list.filter(i => i.walletAddress.toLowerCase() === walletAddress);
  res.json({ impacts: list.sort((a, b) => b.createdAt - a.createdAt) });
});

// Submit impact (multipart form: photo, walletAddress, actionType, description)
app.post('/api/impacts', upload.single('photo'), async (req, res) => {
  const { walletAddress = '', actionType = '', description = '', referralCode = '' } = req.body ?? {};
  if (!req.file || !actionType) {
    return res.status(400).json({ error: 'Missing file or actionType' });
  }
  const record = {
    id: randomUUID(),
    walletAddress,
    actionType,
    description,
    image: `/uploads/${req.file.filename}`,
    status: 'pending',
    aiScore: null,
    reward: null,
    nftMinted: false,
    createdAt: Date.now(),
    referralCode: referralCode || null,
  };
  await db.read();
  db.data.impacts.unshift(record);
  db.data.verifications.unshift({
    id: `VR-${Math.floor(1000 + Math.random() * 9000)}`,
    wallet: `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`,
    action: actionType,
    status: 'pending',
    aiScore: null,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    ipfsHash: 'QmPlaceholder',
    impactId: record.id,
  });
  await db.write();

  // Simulate async AI verification
  setTimeout(async () => {
    await db.read();
    const score = Math.floor(Math.random() * 15) + 85; // 85-99
    const reward = (Math.random() * 20 + 10).toFixed(2);
    const impact = db.data.impacts.find(i => i.id === record.id);
    if (impact) {
      impact.status = 'verified';
      impact.aiScore = score;
      impact.reward = reward;
      impact.nftMinted = true;
    }
    const ver = db.data.verifications.find(v => v.impactId === record.id);
    if (ver) {
      ver.status = 'verified';
      ver.aiScore = score;
      ver.timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
    }
    // Count referral usage
    if (record.referralCode) {
      const ref = db.data.referrals.find(r => r.code === record.referralCode);
      if (ref) {
        ref.uses = (ref.uses || 0) + 1;
      }
    }
    await db.write();
  }, 2000);

  res.status(201).json({ impact: record });
});

// Verifier feed
app.get('/api/verifications', async (_req, res) => {
  await db.read();
  res.json({ requests: db.data.verifications.slice(0, 100) });
});

// Leaderboard (aggregate by wallet)
app.get('/api/leaderboard', async (_req, res) => {
  await db.read();
  const totals = new Map();
  for (const i of db.data.impacts) {
    if (i.status !== 'verified') continue;
    const cur = totals.get(i.walletAddress) || { points: 0, actions: 0, rewards: 0 };
    cur.points += i.aiScore || 0;
    cur.actions += 1;
    cur.rewards += Number(i.reward || 0);
    totals.set(i.walletAddress, cur);
  }
  const rows = Array.from(totals.entries())
    .map(([wallet, v]) => ({ wallet, impactPoints: v.points, actionsVerified: v.actions, rewardsEarned: v.rewards.toFixed(2) }))
    .sort((a, b) => b.impactPoints - a.impactPoints)
    .map((r, idx) => ({ rank: idx + 1, username: `${r.wallet.slice(0, 6)}...${r.wallet.slice(-4)}`, ...r }));
  res.json({ leaderboard: rows });
});

// ----- Attestations (EAS-like, off-chain MVP) -----
// EIP-712 domain & types for ImpactClaim
const EIP712_DOMAIN = {
  name: 'ImpactX',
  version: '1',
};
const EIP712_TYPES = {
  ImpactClaim: [
    { name: 'wallet', type: 'address' },
    { name: 'impactId', type: 'string' },
    { name: 'actionType', type: 'string' },
    { name: 'aiScore', type: 'uint256' },
    { name: 'createdAt', type: 'uint256' },
    { name: 'imageHash', type: 'bytes32' },
    { name: 'locationHash', type: 'bytes32' },
    { name: 'descriptionHash', type: 'bytes32' },
    { name: 'chainId', type: 'uint256' },
  ],
};

app.post('/api/attestations', async (req, res) => {
  try {
    const { message, signature, chainId } = req.body || {};
    if (!message || !signature || !chainId) return res.status(400).json({ error: 'missing fields' });
    // Recover address
    const recovered = await recoverTypedDataAddress({
      domain: { ...EIP712_DOMAIN, chainId: Number(chainId) },
      types: EIP712_TYPES,
      primaryType: 'ImpactClaim',
      message,
      signature,
    });
    if (recovered.toLowerCase() !== String(message.wallet).toLowerCase()) {
      return res.status(400).json({ error: 'signature does not match wallet' });
    }
    const att = {
      id: randomUUID(),
      schema: 'ImpactClaim@1',
      message,
      signature,
      recovered,
      createdAt: Date.now(),
    };
    await db.read();
    db.data.attestations.unshift(att);
    await db.write();
    res.status(201).json({ attestation: att });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/attestations', async (req, res) => {
  const wallet = String(req.query.wallet || '').toLowerCase();
  await db.read();
  let list = db.data.attestations;
  if (wallet) list = list.filter((a) => String(a.message?.wallet || '').toLowerCase() === wallet);
  res.json({ attestations: list.slice(0, 200) });
});

app.get('/api/attestations/:id', async (req, res) => {
  await db.read();
  const att = db.data.attestations.find((a) => a.id === req.params.id);
  if (!att) return res.status(404).json({ error: 'not found' });
  res.json({ attestation: att });
});

// ----- NFT Metadata (for ImpactNFT tokenURI) -----
app.post('/api/nft/metadata', async (req, res) => {
  const { name = 'ImpactX PoI', description = '', image = '' } = req.body || {};
  const id = randomUUID();
  const meta = {
    id,
    name,
    description,
    image,
    attributes: [
      { trait_type: 'app', value: 'ImpactX' },
      { trait_type: 'network', value: 'Celo Sepolia' },
    ],
    createdAt: Date.now(),
  };
  await db.read();
  db.data.nftMetadata.unshift(meta);
  await db.write();
  res.status(201).json({ id, url: `/api/nft/metadata/${id}` });
});

app.get('/api/nft/metadata/:id', async (req, res) => {
  await db.read();
  const meta = db.data.nftMetadata.find((m) => m.id === req.params.id);
  if (!meta) return res.status(404).json({ error: 'not found' });
  res.setHeader('Content-Type', 'application/json');
  // Return standard ERC721 metadata JSON
  res.send(JSON.stringify({ name: meta.name, description: meta.description, image: meta.image, attributes: meta.attributes }));
});

// ----- Sponsor Pools (off-chain MVP) -----
app.post('/api/pools', async (req, res) => {
  const { name, startAt, endAt, budget } = req.body || {};
  if (!name || !startAt || !endAt || !budget) return res.status(400).json({ error: 'missing fields' });
  const pool = {
    id: randomUUID(),
    name,
    startAt: Number(startAt),
    endAt: Number(endAt),
    budget: Number(budget),
    contributions: [], // { sponsor, amount }
    distributions: [], // { at, totalDistributed, allocations: [{ walletAddress, impactId, amount }] }
    createdAt: Date.now(),
  };
  await db.read();
  db.data.pools.unshift(pool);
  await db.write();
  res.status(201).json({ pool });
});

app.get('/api/pools', async (_req, res) => {
  await db.read();
  res.json({ pools: db.data.pools });
});

app.get('/api/pools/:id', async (req, res) => {
  await db.read();
  const pool = db.data.pools.find((p) => p.id === req.params.id);
  if (!pool) return res.status(404).json({ error: 'not found' });
  res.json({ pool });
});

app.post('/api/pools/:id/contribute', async (req, res) => {
  const { sponsor, amount } = req.body || {};
  if (!sponsor || !amount) return res.status(400).json({ error: 'missing fields' });
  await db.read();
  const pool = db.data.pools.find((p) => p.id === req.params.id);
  if (!pool) return res.status(404).json({ error: 'not found' });
  pool.contributions.push({ sponsor, amount: Number(amount) });
  await db.write();
  res.json({ pool });
});

app.post('/api/pools/:id/distribute', async (req, res) => {
  await db.read();
  const pool = db.data.pools.find((p) => p.id === req.params.id);
  if (!pool) return res.status(404).json({ error: 'not found' });
  const impactsInWindow = db.data.impacts.filter((i) => i.status === 'verified' && i.createdAt >= pool.startAt && i.createdAt <= pool.endAt);
  if (!impactsInWindow.length) return res.status(400).json({ error: 'no verified impacts in window' });
  const totalWeight = impactsInWindow.reduce((s, i) => s + Number(i.aiScore || 0), 0) || impactsInWindow.length;
  const budget = pool.budget + pool.contributions.reduce((s, c) => s + Number(c.amount || 0), 0);
  const allocations = impactsInWindow.map((i) => {
    const w = Number(i.aiScore || 0) || 1;
    const amount = (w / totalWeight) * budget;
    return { walletAddress: i.walletAddress, impactId: i.id, amount: Number(amount.toFixed(2)) };
  });
  const totalDistributed = Number(allocations.reduce((s, a) => s + a.amount, 0).toFixed(2));
  pool.distributions.push({ at: Date.now(), totalDistributed, allocations });
  await db.write();
  res.json({ pool });
});

// ----- Public Metrics -----
app.get('/api/public/metrics', async (_req, res) => {
  await db.read();
  const verified = db.data.impacts.filter((i) => i.status === 'verified');
  const uniqueWallets = new Set(verified.map((i) => i.walletAddress.toLowerCase())).size;
  const rewards = verified.reduce((s, i) => s + Number(i.reward || 0), 0);

  // weekly series (YYYY-WW)
  const weekOf = (ts) => {
    const d = new Date(ts);
    const onejan = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d - onejan) / 86400000) + onejan.getDay() + 1;
    const week = Math.ceil(days / 7);
    return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
  };
  const weekly = {};
  for (const i of verified) {
    const w = weekOf(i.createdAt);
    weekly[w] = (weekly[w] || 0) + 1;
  }
  const weeklyTimeSeries = Object.entries(weekly).sort(([a], [b]) => (a > b ? 1 : -1)).map(([week, count]) => ({ week, count }));

  const byAction = Object.entries(
    verified.reduce((m, i) => {
      const k = i.actionType || 'Unknown';
      m[k] = (m[k] || 0) + 1;
      return m;
    }, {})
  )
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topWallets = Object.entries(
    verified.reduce((m, i) => {
      const w = i.walletAddress.toLowerCase();
      m[w] = (m[w] || 0) + Number(i.aiScore || 0);
      return m;
    }, {})
  )
    .map(([wallet, points]) => ({ wallet, points }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);

  res.json({
    totals: { verifiedActions: verified.length, uniqueWallets, totalRewards: Number(rewards.toFixed(2)) },
    weeklyTimeSeries,
    byAction,
    topWallets,
  });
});

// Profile aggregates
app.get('/api/profile/:wallet', async (req, res) => {
  const wallet = String(req.params.wallet || '').toLowerCase();
  await db.read();
  const items = db.data.impacts.filter(i => i.walletAddress.toLowerCase() === wallet);
  const verified = items.filter(i => i.status === 'verified');
  const totalRewards = verified.reduce((s, i) => s + Number(i.reward || 0), 0);
  const avgScore = verified.length ? Math.round(verified.reduce((s, i) => s + (i.aiScore || 0), 0) / verified.length) : 0;
  const byDay = new Set(verified.map(i => new Date(i.createdAt).toDateString()));
  // Simple streak: consecutive days up to today
  let streak = 0; const today = new Date();
  for (let d = 0; d < 365; d++) {
    const dt = new Date(today); dt.setDate(today.getDate() - d);
    if (byDay.has(dt.toDateString())) streak++; else break;
  }
  // Achievements
  const achievements = [];
  if (verified.length >= 1) achievements.push({ key: 'first-impact', label: 'First Impact' });
  if (verified.length >= 5) achievements.push({ key: 'five-impacts', label: '5 Impacts' });
  if (verified.length >= 10) achievements.push({ key: 'ten-impacts', label: '10 Impacts' });
  const treeCount = verified.filter(i => i.actionType?.toLowerCase().includes('tree')).length;
  if (treeCount >= 3) achievements.push({ key: 'tree-planter', label: 'Tree Planter' });
  const topActions = Object.entries(verified.reduce((m, i) => { m[i.actionType] = (m[i.actionType] || 0) + 1; return m; }, {})).
    map(([action, count]) => ({ action, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  res.json({
    wallet,
    totals: { totalImpacts: verified.length, totalRewards: totalRewards.toFixed(2), avgScore },
    streakDays: streak,
    achievements,
    topActions,
  });
});

// Weekly challenges (static seed with progress computed client-side)
app.get('/api/challenges', async (_req, res) => {
  await db.read();
  if (!db.data.challenges?.length) {
    db.data.challenges = [
      { id: 'ch1', title: 'Plant 3 Trees', actionType: 'Tree Planting', target: 3, week: '2025-W43' },
      { id: 'ch2', title: 'Beach Cleanup Duo', actionType: 'Beach Cleanup', target: 2, week: '2025-W43' },
      { id: 'ch3', title: 'Teach & Inspire', actionType: 'Teaching', target: 1, week: '2025-W43' },
    ];
    await db.write();
  }
  res.json({ challenges: db.data.challenges });
});

// Referral system
app.post('/api/referral/new', async (req, res) => {
  const { wallet } = req.body || {};
  if (!wallet) return res.status(400).json({ error: 'wallet required' });
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  await db.read();
  db.data.referrals.push({ code, ownerWallet: wallet, createdAt: Date.now(), uses: 0 });
  await db.write();
  res.status(201).json({ code });
});

app.get('/api/referral/:code', async (req, res) => {
  const { code } = req.params;
  await db.read();
  const ref = db.data.referrals.find(r => r.code === code);
  if (!ref) return res.status(404).json({ error: 'not found' });
  res.json({ referral: ref });
});

// Dev: reseed demo data (use carefully; resets data when reset=true)
app.post('/api/dev/seed', async (req, res) => {
  const { reset = false, impacts = 24 } = req.body || {};
  try {
    await seedDemoData({ reset, impacts: Number(impacts) || 24 });
    await db.read();
    res.json({
      ok: true,
      counts: {
        impacts: db.data.impacts.length,
        verifications: db.data.verifications.length,
        referrals: db.data.referrals.length,
        pools: db.data.pools.length,
        nftMetadata: db.data.nftMetadata.length,
      },
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
