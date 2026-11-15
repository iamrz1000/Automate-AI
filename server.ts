import express, { Request, Response } from 'express';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Initialize GoogleGenAI with server-side GEMINI_API_KEY from environment
const AUTOMATE_GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({
  apiKey: AUTOMATE_GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

// Mock in-memory persistence database (with realistic initial seed data)
const db = {
  conversations: [
    {
      id: 'conv-1',
      title: 'Architecting high-concurrency microservices',
      modelId: 'gemini-4-hydrogen',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
      messages: [
        {
          id: 'm1',
          role: 'user',
          content: 'What are the core trade-offs between event-driven architecture and synchronous REST for a real-time analytics pipeline?',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: 'm2',
          role: 'assistant',
          content: `### Event-Driven vs. Synchronous REST for Real-Time Analytics

When designing a low-latency, scalable analytics ingestion pipeline, here are the principal trade-offs:

1. **Throughput & Backpressure Handling**
   - **Event-Driven (Kafka / Redpanda / Pulsar)**: Producers can burst without overwhelming downstream analytical consumers. Consumers poll at their own sustainable cadence.
   - **Synchronous REST**: Heavy ingress spikes cause 429/503 errors, socket timeouts, and cascading failures under peak load.

2. **Decoupling & Temporal Independence**
   - With event streams, storage/analytics sinks (e.g. ClickHouse, Snowflake, DuckDB) can undergo maintenance or reprocessing without interrupting active client data ingestion.
   - REST tightly couples consumer availability to producer success.

3. **Ordering & Idempotency**
   - Partition-based event routing guarantees strict FIFO per partition key (e.g., \`user_id\` or \`device_id\`).
   - REST requires explicit distributed locking or transaction coordinators to maintain ordering across concurrent worker nodes.

#### Recommendation
Adopt **hybrid ingestion**: Expose a high-performance HTTP edge gateway (Envoy / Go reverse proxy) that immediately validates incoming telemetry payloads and produces them to an append-only event stream for asynchronous parallel fan-out.`,
          timestamp: new Date(Date.now() - 3600000 * 2 + 2000).toISOString(),
          model: 'gemini-4-hydrogen',
        },
      ],
    },
  ],
  agents: [
    {
      id: 'agent-1',
      name: 'Full-Stack Software Architect',
      description: 'Designs resilient system architectures, conducts comprehensive code reviews, and drafts production-grade implementation plans.',
      category: 'Coding & Dev',
      model: 'gemini-4-hydrogen',
      icon: 'Cpu',
      color: 'from-blue-600 to-indigo-600',
      badge: 'PRO',
      verified: true,
      creator: 'Automate Team',
      systemPrompt: 'You are a veteran Principal Software Architect. Provide robust, idiomatic TypeScript, Go, and Python system designs with precise trade-off matrices, security audits, and concrete code blueprints.',
      tools: ['Web Search', 'Code Execution', 'File Reader'],
      shared: true,
      uses: 14200,
    },
    {
      id: 'agent-2',
      name: 'Deep Research Synthesizer',
      description: 'Conducts multi-source technical investigations, cross-validates empirical claims, and drafts citation-backed whitepapers.',
      category: 'Research & Data',
      model: 'gemini-4-hydrogen',
      icon: 'BookOpen',
      color: 'from-purple-600 to-pink-600',
      badge: 'VERIFIED',
      verified: true,
      creator: 'Automate Team',
      systemPrompt: 'You are an elite research analyst. Cross-examine claims, synthesize peer-reviewed and primary source findings, and format reports with executive summaries, methodology notes, and structured tabular comparisons.',
      tools: ['Web Search', 'Data Analyzer'],
      shared: true,
      uses: 9800,
    },
    {
      id: 'agent-3',
      name: 'Financial Modeling & Valuation Agent',
      description: 'Parses SEC 10-K filings, creates DCF valuation matrices, and tracks liquidity dynamics across global capital markets.',
      category: 'Finance & Legal',
      model: 'gemini-4-hydrogen',
      icon: 'TrendingUp',
      color: 'from-emerald-600 to-teal-600',
      badge: 'PRO',
      verified: true,
      creator: 'Automate Team',
      systemPrompt: 'You are a Senior Quantitative Financial Analyst. Provide rigorous financial calculations, sensitivity matrices, unit economics breakdowns, and DCF models with clear margin-of-safety assumptions.',
      tools: ['Web Search', 'Spreadsheet Tool'],
      shared: true,
      uses: 6150,
    },
    {
      id: 'agent-4',
      name: 'Creative Story & Script Director',
      description: 'Generates compelling episodic storylines, cinematic scripts, nuanced character dialogue, and storyboards.',
      category: 'Creative & Design',
      model: 'gemini-4-hydrogen',
      icon: 'Palette',
      color: 'from-amber-500 to-orange-600',
      badge: 'COMMUNITY',
      verified: false,
      creator: 'Elena Vance',
      systemPrompt: 'You are an acclaimed creative director and showrunner. Develop evocative prose, high-tension narrative arcs, rhythmic character voices, and visual cinematic descriptions.',
      tools: ['Creative Brainstorming'],
      shared: true,
      uses: 4320,
    },
    {
      id: 'agent-5',
      name: 'Growth & SEO Content Engine',
      description: 'Optimizes search intent, drafts high-converting technical copy, and builds automated distribution playbooks.',
      category: 'Marketing',
      model: 'gemini-4-hydrogen',
      icon: 'Sparkles',
      color: 'from-violet-600 to-purple-800',
      badge: 'VERIFIED',
      verified: true,
      creator: 'Automate Team',
      systemPrompt: 'You are a growth marketing and SEO specialist. Focus on search intent, informational depth, compelling hooks, and conversion copywriting with zero fluff.',
      tools: ['Web Search', 'Keyword Analyzer'],
      shared: true,
      uses: 8900,
    },
    {
      id: 'agent-6',
      name: 'DevOps & Kubernetes SRE Specialist',
      description: 'Diagnoses pod crash loops, formulates Terraform modules, and hardens CI/CD pipelines against container CVEs.',
      category: 'Coding & Dev',
      model: 'gemini-4-hydrogen',
      icon: 'Terminal',
      color: 'from-cyan-600 to-blue-700',
      badge: 'PRO',
      verified: true,
      creator: 'Automate Team',
      systemPrompt: 'You are a Principal Site Reliability Engineer. Provide bulletproof Helm charts, Dockerfiles, Kubernetes manifests, and Linux diagnostic commands with root-cause analysis.',
      tools: ['Code Execution', 'Terminal Emulator'],
      shared: true,
      uses: 11200,
    },
  ],
  tasks: [
    {
      id: 'task-1',
      name: 'Daily Morning Market & AI Research Briefing',
      description: 'Scrapes AI research breakthroughs from arXiv and summarizes impact for the engineering team.',
      targetModel: 'gemini-4-hydrogen',
      targetAgent: 'Deep Research Synthesizer',
      schedule: 'Daily at 07:00 AM UTC',
      frequency: 'Daily',
      timezone: 'UTC',
      status: 'Active',
      lastRun: 'Today, 07:00 AM',
      nextRun: 'Tomorrow, 07:00 AM',
      requiresApproval: false,
      runsCount: 42,
    },
    {
      id: 'task-2',
      name: 'Weekly Infrastructure Security & CVE Scan Review',
      description: 'Audits container image reports and flags high-severity vulnerabilities requiring immediate remediation.',
      targetModel: 'gemini-4-hydrogen',
      targetAgent: 'DevOps & Kubernetes SRE Specialist',
      schedule: 'Every Monday at 09:00 AM UTC',
      frequency: 'Weekly',
      timezone: 'UTC',
      status: 'Needs approval',
      lastRun: 'Oct 27, 2026, 09:00 AM',
      nextRun: 'Nov 03, 2026, 09:00 AM',
      requiresApproval: true,
      runsCount: 16,
    },
    {
      id: 'task-3',
      name: 'Bi-Weekly Competitor Feature Changelog Digest',
      description: 'Summarizes key updates across major AI developer platforms and publishes structured briefing.',
      targetModel: 'gemini-4-hydrogen',
      targetAgent: 'Growth & SEO Content Engine',
      schedule: 'Every 2 weeks on Friday',
      frequency: 'Bi-Weekly',
      timezone: 'America/New_York',
      status: 'Paused',
      lastRun: 'Oct 17, 2026, 05:00 PM',
      nextRun: 'Paused',
      requiresApproval: false,
      runsCount: 8,
    },
  ],
  library: [
    {
      id: 'lib-1',
      title: 'Distributed System Ingestion Flowchart',
      category: 'Infographics',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
      description: 'High-level multi-region event bus architectural infographic with Kafka and ClickHouse sinks.',
      tags: ['Architecture', 'Kafka', 'System Design'],
      createdAt: '2026-10-28T14:22:00Z',
      size: '1.4 MB',
      resolution: '2400 x 1400',
    },
    {
      id: 'lib-2',
      title: 'Autonomous Multi-Agent Workflow Concept',
      category: 'Designs',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      description: 'Glassmorphic 3D visualization of collaborative AI model nodes interacting through semantic memory.',
      tags: ['UI Concept', '3D', 'Agents'],
      createdAt: '2026-10-26T11:15:00Z',
      size: '2.8 MB',
      resolution: '3840 x 2160',
    },
    {
      id: 'lib-3',
      title: 'Production LLM Evaluation Prompt Template',
      category: 'Prompts',
      type: 'prompt',
      url: '',
      description: 'Exhaustive prompt template with few-shot chain-of-thought grounding and structured JSON extraction.',
      tags: ['Prompt Engineering', 'Evaluation', 'JSON'],
      createdAt: '2026-10-24T09:30:00Z',
      size: '4.2 KB',
      promptText: 'System: You are an objective rubric evaluator. Score responses across Factuality, Instruction Following, and Safety on 1-10 scales with detailed justifications.',
    },
    {
      id: 'lib-4',
      title: 'Deep Research Synthesis on Quantum ML',
      category: 'Infographics',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
      description: 'Summary graphic contrasting classical tensor networks with parameterized quantum circuits.',
      tags: ['Quantum', 'Machine Learning', 'Research'],
      createdAt: '2026-10-20T16:45:00Z',
      size: '3.1 MB',
      resolution: '2800 x 1800',
    },
  ],
  integrations: [
    {
      id: 'google-workspace',
      name: 'Google Workspace',
      description: 'Directly search Google Drive, read Docs, analyze Sheets, and schedule Calendar events from your conversations.',
      category: 'Connectors',
      icon: 'FileText',
      status: 'Connected',
      configured: true,
      popular: true,
      scopes: ['Drive Read-Only', 'Docs API', 'Sheets API', 'Calendar Access'],
    },
    {
      id: 'github',
      name: 'GitHub',
      description: 'Review Pull Requests, inspect repositories, generate unit tests, and automate code discussions.',
      category: 'Connectors',
      icon: 'GitBranch',
      status: 'Connected',
      configured: true,
      popular: true,
      scopes: ['Repo Read/Write', 'PR Reviews', 'Issue Management'],
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Publish notifications, trigger automated workflows, and dispatch daily executive digests to team channels.',
      category: 'Connectors',
      icon: 'MessageSquare',
      status: 'Not connected',
      configured: false,
      popular: true,
      scopes: ['Chat Write', 'Channel Read', 'Incoming Webhooks'],
    },
    {
      id: 'notion',
      name: 'Notion',
      description: 'Sync workspace notes, update team task boards, and ingest documentation into your model context.',
      category: 'Connectors',
      icon: 'Database',
      status: 'Not connected',
      configured: false,
      popular: false,
      scopes: ['Pages Read/Write', 'Database Query'],
    },
    {
      id: 'linear',
      name: 'Linear',
      description: 'Automatically file bug reports from chat, update issue states, and organize sprint cycles.',
      category: 'Connectors',
      icon: 'CheckSquare',
      status: 'Not connected',
      configured: false,
      popular: false,
      scopes: ['Issues Read/Write', 'Projects API'],
    },
    {
      id: 'supabase',
      name: 'Supabase / Postgres',
      description: 'Query database schemas, inspect table records with natural language, and generate migrations safely.',
      category: 'Connectors',
      icon: 'Layers',
      status: 'Coming soon',
      configured: false,
      popular: false,
      scopes: ['Postgres SQL Explorer'],
    },
  ],
  users: [
    {
      id: 'usr-admin-01',
      name: 'Ahmad Raza',
      email: 'iamrz100@gmail.com',
      password: '10feb2011',
      role: 'admin',
      plan: 'Enterprise SuperAdmin',
      dailyLimit: 999999,
      messagesToday: 0,
      imagesToday: 0,
      status: 'active',
      joinedAt: '2025-01-01T00:00:00Z',
      lastLogin: new Date().toISOString(),
      conversationsCount: 8,
    },
    {
      id: 'usr-001',
      name: 'Alex Turner',
      email: 'alex.turner@example.com',
      password: 'password123',
      role: 'user',
      plan: 'Free Member',
      dailyLimit: 15,
      messagesToday: 6,
      imagesToday: 1,
      status: 'active',
      joinedAt: '2025-02-08T10:15:00Z',
      lastLogin: new Date(Date.now() - 3600000 * 4).toISOString(),
      conversationsCount: 5,
    },
    {
      id: 'usr-002',
      name: 'Sophia Chen',
      email: 'sophia.chen@innovate.org',
      password: 'password123',
      role: 'user',
      plan: 'Free Member',
      dailyLimit: 15,
      messagesToday: 12,
      imagesToday: 3,
      status: 'active',
      joinedAt: '2025-02-09T14:22:00Z',
      lastLogin: new Date(Date.now() - 3600000 * 8).toISOString(),
      conversationsCount: 8,
    },
    {
      id: 'usr-003',
      name: 'Marcus Vance',
      email: 'marcus.vance@techcorp.io',
      password: 'password123',
      role: 'user',
      plan: 'Free Member',
      dailyLimit: 15,
      messagesToday: 15,
      imagesToday: 2,
      status: 'active',
      joinedAt: '2025-02-10T09:40:00Z',
      lastLogin: new Date(Date.now() - 3600000 * 1).toISOString(),
      conversationsCount: 11,
    },
    {
      id: 'usr-004',
      name: 'Elena Vance',
      email: 'elena.vance@designlab.co',
      password: 'password123',
      role: 'user',
      plan: 'Free Member',
      dailyLimit: 20,
      messagesToday: 3,
      imagesToday: 4,
      status: 'active',
      joinedAt: '2025-02-11T16:05:00Z',
      lastLogin: new Date(Date.now() - 3600000 * 18).toISOString(),
      conversationsCount: 4,
    },
  ] as any[],
  userConversations: {
    'usr-001': [
      {
        id: 'c-alex-1',
        title: 'Designing high-throughput message brokers',
        messages: [
          { role: 'user', content: 'What are the main architectural considerations when choosing Kafka vs RabbitMQ for IoT ingest?' },
          { role: 'assistant', content: 'For IoT telemetry with millions of continuous writes, Kafka excels due to its append-only log architecture, sequential disk I/O, and partitioned consumer groups.' },
        ],
      },
      {
        id: 'c-alex-2',
        title: 'Kubernetes horizontal pod autoscaling',
        messages: [
          { role: 'user', content: 'How do I configure custom Prometheus metrics for HPA v2 in Kubernetes?' },
          { role: 'assistant', content: 'You configure prometheus-adapter or KEDA to register custom.metrics.k8s.io APIs with your cluster.' },
        ],
      },
    ],
    'usr-002': [
      {
        id: 'c-sophia-1',
        title: 'Deep learning prompt optimization',
        messages: [
          { role: 'user', content: 'Can you generate an executive summary on multimodal transformer models for biomedical imaging?' },
          { role: 'assistant', content: 'Multimodal vision-language models combine patch embeddings with cross-attention to interpret chest X-rays and MRI scans with high diagnostic accuracy.' },
        ],
      },
    ],
    'usr-003': [
      {
        id: 'c-marcus-1',
        title: 'Database connection pooling in Node.js',
        messages: [
          { role: 'user', content: 'Why does my PostgreSQL pool time out under 500 concurrent connections in Express?' },
          { role: 'assistant', content: 'PostgreSQL uses process-per-connection architecture. Exceeding max_connections causes memory exhaustion; deploy PgBouncer in transaction pooling mode.' },
        ],
      },
    ],
    'usr-admin-01': [
      {
        id: 'c-admin-1',
        title: 'Automate AI System Governance',
        messages: [
          { role: 'user', content: 'Review system capacity and model token distributions for enterprise tenant tier.' },
          { role: 'assistant', content: 'All neural clusters operating at optimal latency. Token distribution balanced across Automate-X1 (Gemini 4 Hydrogen XHigh) and FLUX Realism engine.' },
        ],
      },
    ],
  } as Record<string, any[]>,
  authLogs: [
    {
      id: 'log-1',
      email: 'iamrz100@gmail.com',
      name: 'Ahmad Raza',
      action: 'SIGN_IN',
      timestamp: new Date().toISOString(),
      ip: '104.28.192.14',
      userAgent: 'Chrome 130.0 / macOS',
      status: 'SUCCESS',
      role: 'admin',
    },
    {
      id: 'log-2',
      email: 'alex.turner@example.com',
      name: 'Alex Turner',
      action: 'SIGN_IN',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      ip: '72.14.201.88',
      userAgent: 'Chrome 129.0 / Windows 11',
      status: 'SUCCESS',
      role: 'user',
    },
    {
      id: 'log-3',
      email: 'marcus.vance@techcorp.io',
      name: 'Marcus Vance',
      action: 'SIGN_IN',
      timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
      ip: '198.51.100.42',
      userAgent: 'Firefox 131.0 / Linux',
      status: 'SUCCESS',
      role: 'user',
    },
    {
      id: 'log-4',
      email: 'sophia.chen@innovate.org',
      name: 'Sophia Chen',
      action: 'SIGN_UP',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      ip: '172.56.21.90',
      userAgent: 'Safari 17.4 / iOS',
      status: 'SUCCESS',
      role: 'user',
    },
  ],
  user: {
    id: 'usr-guest-00',
    name: 'User',
    email: '',
    role: 'user',
    isAdmin: false,
    organization: '',
    timezone: 'UTC',
    plan: 'Free Member',
    theme: 'dark',
    dailyLimit: 15,
    messagesToday: 0,
    imagesToday: 0,
    referralCode: 'REF1000',
    referralCount: 0,
    referralCredits: 0,
    areasOfInterest: ['AI Chat', 'Automation'],
    status: 'active',
  } as any,
};

// ----------------------
// Helper: Generate High-Resolution Image with FLUX.1 Realism & Neural Engines
async function generateFluxImage(
  prompt: string,
  aspectRatio: string = '1:1',
  style: string = '',
  customSeed?: number
) {
  const cleanPrompt = prompt.replace(/^\/image\s*/i, '').trim();

  // Detect style intent to route to optimal neural engine
  const isAnime = /anime|manga|chibi|ghibli|waifu|illustration/i.test(cleanPrompt) || /anime/i.test(style);
  const is3D = /3d|cgi|render|pixar|unreal engine|octane/i.test(cleanPrompt) || /3d/i.test(style);
  const isFast = /quick|fast|turbo|draft/i.test(style);

  let model = 'flux-realism';
  let qualityBooster = 'ultra-detailed, photorealistic, 8k resolution, professional photography, cinematic lighting, sharp focus, masterpiece, highly intricate, realistic textures';

  if (isAnime) {
    model = 'flux-anime';
    qualityBooster = 'high quality anime art style, stunning visual, vibrant rich colors, clean line art, masterpiece, 8k';
  } else if (is3D) {
    model = 'flux-3d';
    qualityBooster = '3d digital art, octane render, unreal engine 5, volumetric cinematic lighting, 8k, highly intricate details, masterpiece';
  } else if (isFast) {
    model = 'turbo';
    qualityBooster = 'high quality, sharp focus, 8k';
  }

  if (style && !isAnime && !is3D && !isFast) {
    qualityBooster = `${style} style aesthetic, ${qualityBooster}`;
  }

  // Preserve the user's prompt 100% as the primary subject
  const finalPrompt = `${cleanPrompt}, ${qualityBooster}`;

  let width = 1024;
  let height = 1024;
  if (aspectRatio === '16:9') {
    width = 1280;
    height = 720;
  } else if (aspectRatio === '9:16') {
    width = 720;
    height = 1280;
  } else if (aspectRatio === '4:3') {
    width = 1024;
    height = 768;
  } else if (aspectRatio === '3:2') {
    width = 1080;
    height = 720;
  }

  const seed = customSeed || Math.floor(Math.random() * 9999999);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&private=true&model=${model}`;

  // Auto-save to user library
  const libItem = {
    id: `lib-gen-${Date.now()}`,
    title: cleanPrompt.slice(0, 50) || 'Automate AI Generated Image',
    category: 'Designs',
    type: 'image',
    url: imageUrl,
    description: `Generated via Automate AI: "${cleanPrompt}"`,
    tags: ['AI Generated', model === 'flux-realism' ? 'FLUX Realism HD' : 'FLUX.1 Pro', 'Automate AI'],
    createdAt: new Date().toISOString(),
    size: '2.4 MB',
    resolution: `${width} x ${height}`,
  };
  db.library.unshift(libItem);

  return { imageUrl, refinedPrompt: finalPrompt, originalPrompt: cleanPrompt, width, height, seed, libItem, model };
}

// Check if message is requesting image generation
function isImagePrompt(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.startsWith('/image')) return true;
  return (
    /^(generate|create|draw|make|render|paint|design|produce|show me)\s+(an?\s+)?(image|picture|photo|illustration|art|graphic|wallpaper|drawing|visual|portrait)\b/i.test(trimmed) ||
    /^(image|picture|photo|illustration|drawing)\s+of\b/i.test(trimmed) ||
    /^(can you|please)?\s*(generate|create|make|draw|render|paint)\s+(an?\s+)?(image|picture|photo|illustration|art)\b/i.test(trimmed) ||
    /^(draw|paint)\s+(me\s+)?(a|an)?\b/i.test(trimmed)
  );
}

// ----------------------
// API ROUTES
// ----------------------

// 0. DEDICATED IMAGE GENERATION ENDPOINT
app.post('/api/generate-image', async (req: Request, res: Response): Promise<void> => {
  const { prompt, aspectRatio = '1:1', style = '', seed } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Prompt is required for image generation.' });
    return;
  }

  try {
    const result = await generateFluxImage(prompt, aspectRatio, style, seed);
    res.json({
      success: true,
      imageUrl: result.imageUrl,
      refinedPrompt: result.refinedPrompt,
      originalPrompt: prompt,
      dimensions: `${result.width}x${result.height}`,
      seed: result.seed,
      aspectRatio,
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image.' });
  }
});

// 1. CHAT COMPLETION (with fast Gemini 2.5 Flash streaming, image generation & multimodal support)
app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
  const {
    messages,
    model = 'gemini-4-hydrogen',
    systemInstruction,
    stream = true,
    files = [],
    isImageRequest = false,
    aspectRatio = '1:1',
    reasoningActive = false,
    conciseMode = false,
  } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required.' });
    return;
  }

  const latestMessage = messages[messages.length - 1];
  const userContent = latestMessage.content || '';

  // Check Daily Limit for normal users
  const isSuperAdmin = db.user.role === 'admin' || db.user.isAdmin;
  const userLimit = db.user.dailyLimit ?? (isSuperAdmin ? 999999 : 15);
  const currentMessagesCount = db.user.messagesToday || 0;

  if (!isSuperAdmin && currentMessagesCount >= userLimit) {
    const limitMessage = `⚠️ **Daily Quota Reached (${currentMessagesCount}/${userLimit} messages)**\n\nYou have used all free message credits for today. Daily allowances refresh at 00:00 UTC.\n\n✨ **Need more?** Upgrade to Pro for **unlimited messaging**, priority high-res image generation, and full model access, or sign in to your authorized administrator account.`;

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();
      res.write(`data: ${JSON.stringify({ text: limitMessage, quotaExceeded: true })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
      return;
    } else {
      res.json({ content: limitMessage, quotaExceeded: true });
      return;
    }
  }

  // Increment usage counters
  db.user.messagesToday = currentMessagesCount + 1;
  const matchedDbUser = db.users.find((u) => u.id === db.user.id || u.email === db.user.email);
  if (matchedDbUser) {
    matchedDbUser.messagesToday = db.user.messagesToday;
  }

  // Record user conversation snippet for Admin panel inspection
  const activeUserId = db.user.id || 'usr-admin-01';
  if (!db.userConversations[activeUserId]) {
    db.userConversations[activeUserId] = [];
  }
  const existingConv = db.userConversations[activeUserId].find((c) => c.id === 'current-session');
  if (existingConv) {
    existingConv.messages.push({ role: 'user', content: userContent });
  } else {
    db.userConversations[activeUserId].unshift({
      id: 'current-session',
      title: userContent.slice(0, 48) + (userContent.length > 48 ? '...' : ''),
      timestamp: new Date().toISOString(),
      messages: [{ role: 'user', content: userContent }],
    });
  }

  // Check if this request is for image generation
  const shouldGenerateImage = isImageRequest || isImagePrompt(userContent);
  if (shouldGenerateImage) {
    db.user.imagesToday = (db.user.imagesToday || 0) + 1;
    if (matchedDbUser) matchedDbUser.imagesToday = db.user.imagesToday;
  }

  if (shouldGenerateImage) {
    try {
      const cleanPrompt = userContent.replace(/^\/image\s*/i, '').trim();
      const { style = '', seed: reqSeed } = req.body;
      const { imageUrl, refinedPrompt, width, height, seed } = await generateFluxImage(
        cleanPrompt,
        aspectRatio,
        style,
        reqSeed
      );

      const markdownResponse = `Here is your generated image:

![${cleanPrompt}](${imageUrl})

**Enhanced Prompt:** *${refinedPrompt}*

*Generated with Automate AI Image Engine & Gemini Intelligence*`;

      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        // Stream intro text swiftly
        const intro = `🎨 *Generating high-resolution image for:* **"${cleanPrompt}"** *using FLUX.1 Realism Engine...*\n\n`;
        res.write(`data: ${JSON.stringify({ text: intro })}\n\n`);

        // Send finalized markdown with image URL
        res.write(
          `data: ${JSON.stringify({
            text: `![${cleanPrompt}](${imageUrl})\n\n**Visual Prompt:** *${refinedPrompt}*\n\n✨ *Generated with Automate AI · FLUX.1 Realism Engine (Ultra-High Resolution)*`,
            generatedImage: {
              url: imageUrl,
              prompt: cleanPrompt,
              revisedPrompt: refinedPrompt,
              aspectRatio,
              dimensions: `${width}x${height}`,
              seed,
            },
          })}\n\n`
        );
        res.write(`data: [DONE]\n\n`);
        res.end();
        return;
      } else {
        res.json({
          content: markdownResponse,
          model: 'Automate Image Gen (FLUX.1 Realism)',
          generatedImage: {
            url: imageUrl,
            prompt: cleanPrompt,
            revisedPrompt: refinedPrompt,
            aspectRatio,
            dimensions: `${width}x${height}`,
            seed,
          },
        });
        return;
      }
    } catch (imgError: any) {
      console.error('In-chat image generation failed:', imgError);
      // Fall through to regular text chat if image generation throws
    }
  }

  try {
    // Build multi-turn context for Gemini
    const contents: any[] = [];
    const historySlice = messages.slice(-10);

    for (const msg of historySlice) {
      const role = msg.role === 'user' ? 'user' : 'model';
      const partsList: any[] = [];

      if (msg.attachments && Array.isArray(msg.attachments)) {
        for (const att of msg.attachments) {
          const b64 = att.dataUrl || att.base64;
          if (b64) {
            partsList.push({
              inlineData: {
                mimeType: att.type || att.mimeType || 'image/jpeg',
                data: b64.replace(/^data:[^;]+;base64,/, ''),
              },
            });
          }
        }
      }

      if (msg.content) {
        partsList.push({ text: msg.content });
      }

      if (partsList.length > 0) {
        contents.push({ role, parts: partsList });
      }
    }

    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: userContent || 'Hello' }] });
    }

    // Route Automate AI natively through Gemini 4 Hydrogen XHigh (ThinkingLevel.XHIGH)
    const requestedId = String(model || 'automate-x1').toLowerCase();
    const isAutomateOrGemini =
      requestedId === 'automate-x1' ||
      requestedId === 'gemini-4-hydrogen' ||
      requestedId === 'gemini-4-hydrogen-xhigh' ||
      !requestedId;

    type ModelTarget = { apiModel: string; label: string; thinkingLevel?: ThinkingLevel };

    const primaryLabel =
      requestedId === 'gemini-4-hydrogen' || requestedId === 'gemini-4-hydrogen-xhigh'
        ? reasoningActive
          ? 'Gemini 4 Hydrogen XHigh'
          : 'Gemini 4 Hydrogen'
        : reasoningActive
          ? 'Automate-X1 · Gemini 4 Hydrogen XHigh'
          : 'Automate-X1 · Gemini 4 Hydrogen';

    // Use LOW by default for instant (<1s) first-token streaming; engage XHIGH when user enables Reasoning mode
    const primaryThinkingLevel = reasoningActive ? ThinkingLevel.XHIGH : ThinkingLevel.LOW;

    const modelTargets: ModelTarget[] = isAutomateOrGemini
      ? [
          {
            apiModel: 'gemini-4-hydrogen',
            label: primaryLabel,
            thinkingLevel: primaryThinkingLevel,
          },
          {
            apiModel: 'gemini-4-hydrogen',
            label: `${primaryLabel} (Fast)`,
            thinkingLevel: ThinkingLevel.LOW,
          },
          { apiModel: 'gemini-2.5-flash', label: `${primaryLabel} (Fallback)` },
          {
            apiModel: 'gemini-3.1-flash-lite',
            label: `${primaryLabel} (Lite)`,
            thinkingLevel: ThinkingLevel.MINIMAL,
          },
        ]
      : [
          {
            apiModel: 'gemini-4-hydrogen',
            label: requestedId,
            thinkingLevel: primaryThinkingLevel,
          },
          {
            apiModel: 'gemini-4-hydrogen',
            label: primaryLabel,
            thinkingLevel: ThinkingLevel.HIGH,
          },
          { apiModel: 'gemini-2.5-flash', label: primaryLabel },
          {
            apiModel: 'gemini-3.1-flash-lite',
            label: primaryLabel,
            thinkingLevel: ThinkingLevel.MINIMAL,
          },
        ];

    const coreRules =
      'You are Automate-X1, the AI assistant of Automate AI powered by Gemini 4 Hydrogen XHigh, founded and developed by Ahmadraza. ' +
      'STRICT RULES: ' +
      '1) Answer strictly and concisely—give only what the user asked for without filler intros, rambling, or unrequested long essays. For straightforward questions, answer in 1–3 crisp sentences or brief bullets. Expand with details or full code only when the user asks for depth. ' +
      '2) If the user asks in Hindi or Hinglish, reply naturally in the same language and keep it brief. ' +
      '3) If asked who created, founded, or developed Automate AI or this chatbot, state clearly that the founder and developer is Ahmadraza. Never disclose private emails, phone numbers, passwords, or personal contact details.';

    const reasoningDirective = reasoningActive
      ? ' REASONING MODE: Think deeply step by step internally and provide a clear, well-structured, accurate answer.'
      : '';

    const conciseDirective = conciseMode
      ? ' PRIORITY OVERRIDE — CONCISE SUMMARY MODE: Keep every answer ultra-short, direct, and scannable. Respond in at most 1–3 brief sentences or a few tight bullet points with zero preamble, zero filler, and zero unsolicited elaboration.'
      : '';

    const systemPromptText = systemInstruction
      ? `${systemInstruction}\n\n${coreRules}${reasoningDirective}${conciseDirective}`
      : `${coreRules}${reasoningDirective}${conciseDirective}`;

    const buildConfigForTarget = (target: ModelTarget): Record<string, any> => {
      if (target.apiModel === 'gemini-4-hydrogen') {
        // Per Gemini 4 SDK rules: do NOT pass temperature, topP, topK, candidateCount, or thinkingBudget
        return {
          systemInstruction: systemPromptText,
          thinkingConfig: { thinkingLevel: target.thinkingLevel || ThinkingLevel.XHIGH },
        };
      }
      if (target.apiModel === 'gemini-3.1-flash-lite') {
        return {
          systemInstruction: systemPromptText,
          temperature: conciseMode ? 0.45 : 0.6,
          maxOutputTokens: conciseMode ? 450 : 1200,
          thinkingConfig: { thinkingLevel: target.thinkingLevel || ThinkingLevel.MINIMAL },
        };
      }
      return {
        systemInstruction: systemPromptText,
        temperature: conciseMode ? 0.45 : 0.6,
        ...(conciseMode ? { maxOutputTokens: 512 } : {}),
      };
    };

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      let streamedAny = false;

      for (const target of modelTargets) {
        if (streamedAny) break;
        const attemptTimeout = target.thinkingLevel === ThinkingLevel.XHIGH ? 25000 : 12000;
        try {
          const responseStream = await withTimeout(
            ai.models.generateContentStream({
              model: target.apiModel,
              contents,
              config: buildConfigForTarget(target),
            }),
            attemptTimeout,
            target.apiModel
          );

          for await (const chunk of responseStream) {
            const textChunk = chunk.text || '';
            if (textChunk) {
              streamedAny = true;
              res.write(`data: ${JSON.stringify({ text: textChunk, model: target.label })}\n\n`);
              if ((res as any).flush) {
                (res as any).flush();
              }
            }
          }
        } catch (err: any) {
          console.warn(`Streaming model ${target.apiModel} (${target.thinkingLevel || 'default'}) failed:`, err?.message || err);
        }
      }

      if (!streamedAny) {
        res.write(
          `data: ${JSON.stringify({
            text: 'Automate AI is momentarily busy. Please try again in a second.',
          })}\n\n`
        );
      }

      res.write(`data: [DONE]\n\n`);
      res.end();
    } else {
      let response: any = null;
      let lastError: any = null;
      let usedModel = modelTargets[0].label;

      for (const target of modelTargets) {
        const attemptTimeout = target.thinkingLevel === ThinkingLevel.XHIGH ? 25000 : 12000;
        try {
          response = await withTimeout(
            ai.models.generateContent({
              model: target.apiModel,
              contents,
              config: buildConfigForTarget(target),
            }),
            attemptTimeout,
            target.apiModel
          );
          if (response && response.text) {
            usedModel = target.label;
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`generateContent ${target.apiModel} (${target.thinkingLevel || 'default'}) failed:`, err?.message || err);
        }
      }

      if (!response) {
        res.status(500).json({ error: `AI generation error: ${lastError?.message || lastError}` });
        return;
      }

      res.json({
        content: response.text || 'No response generated.',
        model: usedModel,
      });
    }
  } catch (error: any) {
    console.error('Gemini API Error in /api/chat:', error);
    const errorMessage = error?.message || 'Failed to generate response from AI provider.';
    if (!res.headersSent) {
      res.status(500).json({ error: errorMessage });
    } else {
      res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
      res.end();
    }
  }
});

// 1.5. LIVE CONVERSATION & VISION ENDPOINT (ChatGPT Voice & Gemini Live Camera)
app.post('/api/live-analyze', async (req: Request, res: Response): Promise<void> => {
  const { prompt = '', imageBase64, history = [] } = req.body;

  try {
    const parts: any[] = [];

    // Add camera frame if provided
    if (imageBase64 && typeof imageBase64 === 'string') {
      const cleanData = imageBase64.replace(/^data:image\/[a-zA-Z0-9]+;base64,/, '');
      const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      parts.push({
        inlineData: {
          mimeType,
          data: cleanData,
        },
      });
    }

    // Add recent context history if available (last 3 turns to keep latency tiny)
    let contextPrompt = '';
    if (Array.isArray(history) && history.length > 0) {
      const recent = history.slice(-3);
      contextPrompt = 'Recent live conversation context:\n' +
        recent.map(h => `${h.role === 'user' ? 'User' : 'Automate AI'}: ${h.content}`).join('\n') + '\n\n';
    }

    const userSpokenText = prompt?.trim() || (imageBase64 ? 'What do you see in front of my camera right now?' : 'Hello Automate AI');
    parts.push({
      text: `${contextPrompt}User says: "${userSpokenText}"`,
    });

    const liveSystemPrompt =
      'You are Automate AI in Live Voice & Vision Mode, founded and developed by Ahmadraza. You are having an instant, natural voice conversation with the user. You can see through their camera and hear them speaking. Speak naturally, warmly, and very concisely—1 to 2 sentences max, answering only what is asked. If asked who founded or developed you, say Ahmadraza. Do NOT use markdown symbols, bullet points, asterisks, hashtags, or code blocks, as your text will be read aloud immediately.';

    let response: any = null;
    let usedModel = 'Automate-X1 · Gemini 4 Hydrogen Live';
    try {
      response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: parts,
          config: {
            systemInstruction: liveSystemPrompt,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        }),
        10000,
        'gemini-4-hydrogen live'
      );
    } catch (err: any) {
      console.warn('Live analyze primary model failed, falling back to gemini-2.5-flash:', err?.message || err);
      usedModel = 'Automate-X1 · Gemini 2.5 Flash Live';
      try {
        response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: parts,
            config: {
              systemInstruction: liveSystemPrompt,
              temperature: 0.6,
            },
          }),
          9000,
          'gemini-2.5-flash live'
        );
      } catch (fbErr: any) {
        console.warn('Live analyze fallback to gemini-3.1-flash-lite:', fbErr?.message || fbErr);
        usedModel = 'Automate-X1 · Gemini 3.1 Flash Lite Live';
        response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: parts,
            config: {
              systemInstruction: liveSystemPrompt,
              thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
            },
          }),
          9000,
          'gemini-3.1-flash-lite live'
        );
      }
    }

    const replyText = response.text?.trim() || "I'm listening and seeing your feed clearly. What would you like to explore?";
    res.json({
      success: true,
      text: replyText,
      model: usedModel,
      hasVisualInput: Boolean(imageBase64),
    });
  } catch (error: any) {
    console.error('Live analyze error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to process live conversation.',
      text: "I'm here, but had trouble processing that moment. Please say that again!",
    });
  }
});


// 2. WORKFLOW GENERATION (for Build page)
app.post('/api/workflows/generate', async (req: Request, res: Response): Promise<void> => {
  const { prompt } = req.body;
  if (!prompt) {
    res.status(400).json({ error: 'Prompt is required.' });
    return;
  }

  try {
    const workflowPrompt = `You are an AI workflow architect. Based on the user's request: "${prompt}", generate a structured multi-step automation workflow.
Return a valid JSON object matching this schema:
{
  "workflowTitle": "Title of the workflow",
  "workflowSummary": "Short 2-sentence summary of what this workflow accomplishes",
  "category": "Data / DevOps / Creative / Productivity / Analytics",
  "estimatedExecutionTime": "e.g. 15s",
  "steps": [
    {
      "id": "step-1",
      "stepNumber": 1,
      "title": "Short title",
      "type": "trigger" | "model" | "condition" | "tool" | "output",
      "description": "What happens in this step",
      "engine": "e.g. Webhook / Automate-X1 (Gemini 4 Hydrogen XHigh) / Slack API / Python Runtime",
      "inputs": ["list of inputs"],
      "outputs": ["list of outputs"]
    }
  ]
}
Return only pure JSON. Do not wrap in markdown or backticks.`;

    let aiResponse: any = null;
    try {
      aiResponse = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: workflowPrompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.XHIGH },
          },
        }),
        20000,
        'gemini-4-hydrogen xhigh workflow'
      );
    } catch {
      try {
        aiResponse = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: workflowPrompt,
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          }),
          10000,
          'gemini-4-hydrogen low workflow'
        );
      } catch {
        try {
          aiResponse = await withTimeout(
            ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: workflowPrompt,
            }),
            9000,
            'gemini-2.5-flash workflow'
          );
        } catch {
          aiResponse = await withTimeout(
            ai.models.generateContent({
              model: 'gemini-3.1-flash-lite',
              contents: workflowPrompt,
              config: {
                thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
              },
            }),
            9000,
            'gemini-3.1-flash-lite workflow'
          );
        }
      }
    }

    const raw = (aiResponse?.text || '{}').trim().replace(/^```json/, '').replace(/```$/, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        workflowTitle: 'Automated Insight Pipeline',
        workflowSummary: 'Pulls data from connected inputs, processes semantic reasoning, and routes validated output.',
        category: 'Productivity',
        estimatedExecutionTime: '12s',
        steps: [
          { id: 'step-1', stepNumber: 1, title: 'Data Ingestion Trigger', type: 'trigger', description: 'Watches webhook endpoint for incoming event payloads', engine: 'Webhook Listener', inputs: ['Event payload'], outputs: ['Raw JSON payload'] },
          { id: 'step-2', stepNumber: 2, title: 'Semantic Extraction & Reasoning', type: 'model', description: 'Applies Automate-X1 (Gemini 4 Hydrogen XHigh) to categorize and structure key entities', engine: 'Automate-X1 · Gemini 4 Hydrogen XHigh', inputs: ['Raw JSON payload'], outputs: ['Structured Entities'] },
          { id: 'step-3', stepNumber: 3, title: 'Confidence Threshold Filter', type: 'condition', description: 'Verifies entity validation score >= 0.85', engine: 'Rules Engine', inputs: ['Structured Entities'], outputs: ['Verified Dataset'] },
          { id: 'step-4', stepNumber: 4, title: 'Multi-Channel Dispatch', type: 'output', description: 'Sends formatted executive briefing to Slack and Google Sheets', engine: 'Integration Connectors', inputs: ['Verified Dataset'], outputs: ['Notification ID', 'Row Append'] },
        ],
      };
    }

    res.json(parsed);
  } catch (error: any) {
    console.error('Workflow generation error:', error);
    res.json({
      workflowTitle: 'Custom Orchestration Workflow',
      workflowSummary: `Generated workflow based on: "${prompt}"`,
      category: 'General',
      estimatedExecutionTime: '10s',
      steps: [
        { id: 'step-1', stepNumber: 1, title: 'Input Trigger', type: 'trigger', description: 'Ingests input parameters and validates payload', engine: 'Webhook API', inputs: ['User Request'], outputs: ['Validated Parameters'] },
        { id: 'step-2', stepNumber: 2, title: 'AI Model Processing', type: 'model', description: 'Synthesizes insights using Automate-X1 (Gemini 4 Hydrogen XHigh)', engine: 'Automate-X1 · Gemini 4 Hydrogen XHigh', inputs: ['Validated Parameters'], outputs: ['Model Output'] },
        { id: 'step-3', stepNumber: 3, title: 'Destination Delivery', type: 'output', description: 'Dispatches finalized results to downstream systems', engine: 'Webhook & Library', inputs: ['Model Output'], outputs: ['Confirmation'] },
      ],
    });
  }
});

// 3. AGENTS API
app.get('/api/agents', (_req: Request, res: Response) => {
  res.json(db.agents);
});

app.post('/api/agents', (req: Request, res: Response) => {
  const { name, description, category, model, systemPrompt, tools } = req.body;
  if (!name || !description) {
    res.status(400).json({ error: 'Name and description are required.' });
    return;
  }

  const newAgent = {
    id: `agent-custom-${Date.now()}`,
    name,
    description,
    category: category || 'Productivity',
    model: model || 'gemini-4-hydrogen',
    icon: 'Bot',
    color: 'from-purple-600 to-indigo-600',
    badge: 'CUSTOM',
    verified: false,
    creator: 'You',
    systemPrompt: systemPrompt || 'You are a tailored AI agent assisting with specialized workflows.',
    tools: Array.isArray(tools) ? tools : ['Web Search'],
    shared: false,
    uses: 0,
  };

  db.agents.unshift(newAgent);
  res.status(201).json(newAgent);
});

// 4. TASKS API
app.get('/api/tasks', (_req: Request, res: Response) => {
  res.json(db.tasks);
});

app.post('/api/tasks', (req: Request, res: Response) => {
  const { name, description, targetModel, targetAgent, frequency, timezone, requiresApproval } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Task name is required.' });
    return;
  }

  const newTask = {
    id: `task-${Date.now()}`,
    name,
    description: description || 'Scheduled automated pipeline task.',
    targetModel: targetModel || 'gemini-4-hydrogen',
    targetAgent: targetAgent || 'Deep Research Synthesizer',
    schedule: `${frequency || 'Daily'} at 09:00 AM ${timezone || 'UTC'}`,
    frequency: frequency || 'Daily',
    timezone: timezone || 'UTC',
    status: 'Active',
    lastRun: 'Pending initial run',
    nextRun: 'Today, 09:00 AM',
    requiresApproval: !!requiresApproval,
    runsCount: 0,
  };

  db.tasks.unshift(newTask);
  res.status(201).json(newTask);
});

app.patch('/api/tasks/:id/toggle', (req: Request, res: Response) => {
  const task = db.tasks.find((t) => t.id === req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }
  task.status = task.status === 'Active' ? 'Paused' : 'Active';
  res.json(task);
});

app.delete('/api/tasks/:id', (req: Request, res: Response) => {
  const idx = db.tasks.findIndex((t) => t.id === req.params.id);
  if (idx !== -1) {
    db.tasks.splice(idx, 1);
  }
  res.json({ success: true });
});

// 5. LIBRARY API
app.get('/api/library', (_req: Request, res: Response) => {
  res.json(db.library);
});

app.post('/api/library', (req: Request, res: Response) => {
  const { title, category, description, tags, promptText, url } = req.body;
  const newItem = {
    id: `lib-${Date.now()}`,
    title: title || 'Generated AI Asset',
    category: category || 'Prompts',
    type: category === 'Prompts' ? 'prompt' : 'image',
    url: url || '',
    description: description || 'Asset created in Automate AI workspace',
    tags: Array.isArray(tags) ? tags : ['Workspace'],
    createdAt: new Date().toISOString(),
    size: '1.2 MB',
    resolution: '1920 x 1080',
    promptText: promptText || '',
  };
  db.library.unshift(newItem);
  res.status(201).json(newItem);
});

app.delete('/api/library/:id', (req: Request, res: Response) => {
  const idx = db.library.findIndex((item) => item.id === req.params.id);
  if (idx !== -1) {
    db.library.splice(idx, 1);
  }
  res.json({ success: true });
});

// 6. INTEGRATIONS API
app.get('/api/integrations', (_req: Request, res: Response) => {
  res.json(db.integrations);
});

app.post('/api/integrations/:id/toggle', (req: Request, res: Response) => {
  const integ = db.integrations.find((i) => i.id === req.params.id);
  if (!integ) {
    res.status(404).json({ error: 'Integration not found.' });
    return;
  }
  if (integ.status === 'Connected') {
    integ.status = 'Not connected';
    integ.configured = false;
  } else {
    integ.status = 'Connected';
    integ.configured = true;
  }
  res.json(integ);
});

// 7. USER PROFILE & AUTH API
app.get('/api/user', (_req: Request, res: Response) => {
  res.json(db.user);
});

app.patch('/api/user', (req: Request, res: Response) => {
  db.user = { ...db.user, ...req.body };
  // Keep db.users in sync if matching user exists
  const u = db.users.find((x) => x.id === db.user.id || x.email === db.user.email);
  if (u) {
    if (req.body.name) u.name = req.body.name;
    if (req.body.role) u.role = req.body.role;
    if (req.body.plan) u.plan = req.body.plan;
  }
  res.json(db.user);
});

app.delete('/api/user', (_req: Request, res: Response) => {
  db.user = {
    id: 'usr-guest-01',
    name: 'Guest User',
    email: 'guest@automate.ai',
    role: 'user',
    isAdmin: false,
    organization: 'Automate AI Community',
    timezone: 'UTC',
    plan: 'Free Member',
    theme: db.user.theme || 'dark',
    dailyLimit: 15,
    messagesToday: 0,
    imagesToday: 0,
    referralCode: 'GUEST100',
    referralCount: 0,
    referralCredits: 0,
    areasOfInterest: ['AI Chat', 'Creative Studio'],
    status: 'active',
  };
  res.json({ success: true, message: 'Account reset successfully.' });
});

app.post('/api/auth/login', (req: Request, res: Response): void => {
  const { email, password, name } = req.body;
  const ip = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Web Browser';

  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Admin account authentication
  if (normalizedEmail === 'iamrz100@gmail.com') {
    if (password && password !== '10feb2011') {
      db.authLogs.unshift({
        id: `log-${Date.now()}`,
        email: normalizedEmail,
        name: 'Ahmad Raza',
        action: 'SIGN_IN',
        timestamp: new Date().toISOString(),
        ip,
        userAgent,
        status: 'FAILED',
        role: 'admin',
      });
      res.status(401).json({ error: 'Incorrect password for Admin account.' });
      return;
    }

    // Successful admin sign-in
    db.user = {
      id: 'usr-admin-01',
      name: 'Ahmad Raza',
      email: 'iamrz100@gmail.com',
      role: 'admin',
      isAdmin: true,
      organization: 'Automate AI Global',
      timezone: 'Asia/Kolkata (IST)',
      plan: 'Enterprise SuperAdmin',
      theme: db.user.theme || 'dark',
      dailyLimit: 999999,
      messagesToday: 0,
      imagesToday: 0,
      referralCode: 'ADMIN790',
      referralCount: 42,
      referralCredits: 12500,
      areasOfInterest: ['System Governance', 'Model Architecture', 'Admin Operations'],
      status: 'active',
      joinedAt: '2025-01-01T00:00:00Z',
      lastLogin: new Date().toISOString(),
    };

    db.authLogs.unshift({
      id: `log-${Date.now()}`,
      email: normalizedEmail,
      name: 'Ahmad Raza',
      action: 'SIGN_IN',
      timestamp: new Date().toISOString(),
      ip,
      userAgent,
      status: 'SUCCESS',
      role: 'admin',
    });

    res.json({ success: true, user: db.user });
    return;
  }

  // Normal user sign-in
  let existingUser: any = db.users.find((u: any) => u.email.toLowerCase() === normalizedEmail);
  if (!existingUser) {
    existingUser = {
      id: `usr-${Date.now()}`,
      name: name || email.split('@')[0],
      email: normalizedEmail,
      password: password || 'password123',
      role: 'user',
      plan: 'Free Member',
      dailyLimit: 15,
      messagesToday: 0,
      imagesToday: 0,
      status: 'active',
      joinedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      conversationsCount: 0,
    };
    db.users.push(existingUser);
  } else {
    existingUser.lastLogin = new Date().toISOString();
  }

  db.user = {
    id: existingUser.id,
    name: existingUser.name,
    email: existingUser.email,
    role: existingUser.role,
    isAdmin: existingUser.role === 'admin',
    organization: 'Community Member',
    timezone: 'UTC',
    plan: existingUser.plan || (existingUser.role === 'admin' ? 'Enterprise SuperAdmin' : 'Free Member'),
    theme: db.user.theme || 'dark',
    dailyLimit: existingUser.dailyLimit ?? (existingUser.role === 'admin' ? 999999 : 15),
    messagesToday: existingUser.messagesToday || 0,
    imagesToday: existingUser.imagesToday || 0,
    referralCode: 'MEM' + Math.floor(1000 + Math.random() * 9000),
    referralCount: 0,
    referralCredits: 50,
    areasOfInterest: ['AI Chat', 'Creative Studio', 'Automation'],
    status: existingUser.status || 'active',
    joinedAt: existingUser.joinedAt,
    lastLogin: existingUser.lastLogin,
  };

  db.authLogs.unshift({
    id: `log-${Date.now()}`,
    email: existingUser.email,
    name: existingUser.name,
    action: 'SIGN_IN',
    timestamp: new Date().toISOString(),
    ip,
    userAgent,
    status: 'SUCCESS',
    role: existingUser.role,
  });

  res.json({ success: true, user: db.user });
});

app.post('/api/auth/signup', (req: Request, res: Response): void => {
  const { name, email, role, organization, password } = req.body;
  const ip = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Web Browser';

  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = db.users.find((u: any) => u.email.toLowerCase() === normalizedEmail);
  if (existingUser) {
    res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
    return;
  }

  const newUser: any = {
    id: `usr-${Date.now()}`,
    name: name?.trim() || email.split('@')[0],
    email: normalizedEmail,
    password: password || 'password123',
    role: 'user',
    plan: 'Free Member',
    dailyLimit: 15,
    messagesToday: 0,
    imagesToday: 0,
    status: 'active',
    joinedAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    conversationsCount: 0,
  };

  db.users.push(newUser);

  db.user = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: 'user',
    isAdmin: false,
    organization: organization || 'Personal',
    timezone: 'UTC',
    plan: 'Free Member',
    theme: db.user.theme || 'dark',
    dailyLimit: 15,
    messagesToday: 0,
    imagesToday: 0,
    referralCode: 'REF' + Math.floor(1000 + Math.random() * 9000),
    referralCount: 0,
    referralCredits: 50,
    areasOfInterest: [role || 'AI Enthusiast'],
    status: 'active',
    joinedAt: newUser.joinedAt,
    lastLogin: newUser.lastLogin,
  };

  db.authLogs.unshift({
    id: `log-${Date.now()}`,
    email: newUser.email,
    name: newUser.name,
    action: 'SIGN_UP',
    timestamp: new Date().toISOString(),
    ip,
    userAgent,
    status: 'SUCCESS',
    role: 'user',
  });

  res.status(201).json({ success: true, user: db.user });
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  db.authLogs.unshift({
    id: `log-${Date.now()}`,
    email: db.user.email,
    name: db.user.name,
    action: 'LOGOUT',
    timestamp: new Date().toISOString(),
    ip: '127.0.0.1',
    userAgent: 'Web Browser',
    status: 'SUCCESS',
    role: db.user.role,
  });
  res.json({ success: true, message: 'Logged out successfully.' });
});

// 8. ADMIN MANAGEMENT ENDPOINTS
app.get('/api/admin/stats', (_req: Request, res: Response) => {
  const totalUsers = db.users.length;
  const adminCount = db.users.filter((u) => u.role === 'admin').length;
  const activeToday = db.users.filter((u) => {
    if (!u.lastLogin) return false;
    const diff = Date.now() - new Date(u.lastLogin).getTime();
    return diff < 86400000;
  }).length;

  let totalConversations = 0;
  let totalUserMessages = 0;
  Object.values(db.userConversations).forEach((convs) => {
    if (Array.isArray(convs)) {
      totalConversations += convs.length;
      convs.forEach((c) => {
        if (Array.isArray(c.messages)) totalUserMessages += c.messages.length;
      });
    }
  });

  res.json({
    totalUsers,
    adminCount,
    activeToday,
    totalConversations,
    totalUserMessages,
    systemUptime: '99.98%',
    modelStatus: 'Operational (Automate-X1 · Gemini 4 Hydrogen XHigh)',
    currentAdmin: 'iamrz100@gmail.com',
  });
});

app.get('/api/admin/users', (_req: Request, res: Response) => {
  // Return user list with conversationsCount
  const sanitized = db.users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    plan: u.plan,
    dailyLimit: u.dailyLimit ?? (u.role === 'admin' ? 999999 : 15),
    messagesToday: u.messagesToday || 0,
    imagesToday: u.imagesToday || 0,
    status: u.status || 'active',
    joinedAt: u.joinedAt || new Date().toISOString(),
    lastLogin: u.lastLogin || new Date().toISOString(),
    conversationsCount: (db.userConversations[u.id] || []).length,
  }));
  res.json(sanitized);
});

app.patch('/api/admin/users/:id/role', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { role } = req.body;
  if (!role || (role !== 'admin' && role !== 'user')) {
    res.status(400).json({ error: 'Valid role (admin | user) is required.' });
    return;
  }

  const target = db.users.find((u) => u.id === id);
  if (!target) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  target.role = role;
  if (role === 'admin') {
    target.plan = 'Enterprise SuperAdmin';
    target.dailyLimit = 999999;
  } else {
    target.plan = 'Free Member';
    target.dailyLimit = 15;
  }

  // If this target is currently active user, sync db.user
  if (db.user.id === target.id) {
    db.user.role = role;
    db.user.isAdmin = role === 'admin';
    db.user.plan = target.plan;
    db.user.dailyLimit = target.dailyLimit;
  }

  db.authLogs.unshift({
    id: `log-${Date.now()}`,
    email: target.email,
    name: target.name,
    action: 'ROLE_CHANGED',
    timestamp: new Date().toISOString(),
    ip: 'Admin Panel',
    userAgent: 'Admin Action',
    status: 'SUCCESS',
    role,
  });

  res.json({ success: true, user: target });
});

app.patch('/api/admin/users/:id/limit', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { dailyLimit } = req.body;
  if (typeof dailyLimit !== 'number' || dailyLimit < 0) {
    res.status(400).json({ error: 'Valid dailyLimit number is required.' });
    return;
  }

  const target = db.users.find((u) => u.id === id);
  if (!target) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  target.dailyLimit = dailyLimit;
  if (db.user.id === target.id) {
    db.user.dailyLimit = dailyLimit;
  }

  db.authLogs.unshift({
    id: `log-${Date.now()}`,
    email: target.email,
    name: target.name,
    action: 'LIMIT_UPDATED',
    timestamp: new Date().toISOString(),
    ip: 'Admin Panel',
    userAgent: `Limit updated to ${dailyLimit}/day`,
    status: 'SUCCESS',
    role: target.role,
  });

  res.json({ success: true, user: target });
});

app.patch('/api/admin/users/:id/status', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { status } = req.body;
  const target = db.users.find((u) => u.id === id);
  if (!target) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  target.status = status === 'suspended' ? 'suspended' : 'active';
  res.json({ success: true, user: target });
});

app.delete('/api/admin/users/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const target = db.users.find((u) => u.id === id);
  if (target?.email === 'iamrz100@gmail.com') {
    res.status(403).json({ error: 'Cannot delete primary root Admin account.' });
    return;
  }

  const idx = db.users.findIndex((u) => u.id === id);
  if (idx !== -1) {
    db.users.splice(idx, 1);
  }
  delete db.userConversations[id];
  res.json({ success: true, message: 'User deleted from platform.' });
});

app.get('/api/admin/users/:id/conversations', (req: Request, res: Response) => {
  const { id } = req.params;
  const convs = db.userConversations[id] || [];
  res.json(convs);
});

app.get('/api/admin/audit-logs', (_req: Request, res: Response) => {
  res.json(db.authLogs);
});

// 9. GITHUB RELEASES DISCOVERY ENDPOINT (Live Release Assets Only - Zero Fake Links)
const releaseCache: { data: any; timestamp: number; repo: string } = {
  data: null,
  timestamp: 0,
  repo: '',
};

app.get('/api/releases/latest', async (req: Request, res: Response): Promise<void> => {
  const repoParam = typeof req.query.repo === 'string' && /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(req.query.repo)
    ? req.query.repo
    : (process.env.GITHUB_REPOSITORY || 'iamrz1000/Automate-AI');

  const now = Date.now();
  if (releaseCache.data && releaseCache.repo === repoParam && now - releaseCache.timestamp < 60000) {
    res.json(releaseCache.data);
    return;
  }

  const releasesPageUrl = `https://github.com/${repoParam}/releases`;
  const actionsPageUrl = `https://github.com/${repoParam}/actions`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Automate-AI-Release-Client',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    let releaseObj: any = null;
    const latestResp = await fetch(`https://api.github.com/repos/${repoParam}/releases/latest`, { headers });
    if (latestResp.ok) {
      releaseObj = await latestResp.json();
    } else if (latestResp.status === 404) {
      const listResp = await fetch(`https://api.github.com/repos/${repoParam}/releases?per_page=1`, { headers });
      if (listResp.ok) {
        const listData = await listResp.json();
        if (Array.isArray(listData) && listData.length > 0) {
          releaseObj = listData[0];
        }
      }
    }

    const rawAssets: any[] = Array.isArray(releaseObj?.assets) ? releaseObj.assets : [];
    const pickAsset = (ext: string) => {
      const found = rawAssets.find(
        (a) => typeof a?.name === 'string' && a.name.toLowerCase().endsWith(ext.toLowerCase())
      );
      if (!found) return null;
      return {
        name: found.name,
        size: found.size,
        downloadCount: found.download_count || 0,
        downloadUrl: found.browser_download_url,
        updatedAt: found.updated_at,
      };
    };

    const payload = {
      repo: repoParam,
      releasesPageUrl,
      actionsPageUrl,
      hasRelease: Boolean(releaseObj),
      release: releaseObj
        ? {
            tagName: releaseObj.tag_name,
            name: releaseObj.name || releaseObj.tag_name,
            publishedAt: releaseObj.published_at || releaseObj.created_at,
            htmlUrl: releaseObj.html_url || releasesPageUrl,
            prerelease: Boolean(releaseObj.prerelease),
            body: releaseObj.body || '',
          }
        : null,
      platforms: {
        androidApk: pickAsset('.apk'),
        androidAab: pickAsset('.aab'),
        windowsExe: pickAsset('.exe'),
        windowsMsi: pickAsset('.msi'),
        iosIpa: pickAsset('.ipa'),
        macosDmg: pickAsset('.dmg'),
        macosPkg: pickAsset('.pkg'),
        linuxAppImage: pickAsset('.AppImage'),
        linuxDeb: pickAsset('.deb'),
        linuxRpm: pickAsset('.rpm'),
        checksums: pickAsset('SHA256SUMS.txt'),
      },
    };

    releaseCache.data = payload;
    releaseCache.timestamp = now;
    releaseCache.repo = repoParam;
    res.json(payload);
  } catch (err: any) {
    res.json({
      repo: repoParam,
      releasesPageUrl,
      actionsPageUrl,
      hasRelease: false,
      release: null,
      error: err?.message || 'Unable to query GitHub Releases right now.',
      platforms: {},
    });
  }
});

// 10. PROJECT ZIP EXPORT (built cleanly in /tmp so workspace stays clean for GitHub)
app.get('/api/export-zip', (_req: Request, res: Response): void => {
  const zipPath = '/tmp/automate-ai-chatbot.zip';
  try {
    const pyScript = `
import os, zipfile
root = ${JSON.stringify(__dirname)}
zip_path = ${JSON.stringify(zipPath)}
if os.path.exists(zip_path):
    os.remove(zip_path)
include_files = ["package.json","index.html","vite.config.ts","tsconfig.json","metadata.json",".env.example",".gitignore","server.ts","capacitor.config.ts","electron-builder.yml","CROSS_PLATFORM_BUILD.md"]
include_dirs = ["src","public","dist","electron","scripts",".github"]
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for f in include_files:
        fp = os.path.join(root, f)
        if os.path.isfile(fp):
            zf.write(fp, f)
    for d in include_dirs:
        dp = os.path.join(root, d)
        if not os.path.isdir(dp): continue
        for dirpath, dirnames, filenames in os.walk(dp):
            dirnames[:] = [x for x in dirnames if x not in ("node_modules",".git",".aistudio","release")]
            for fn in filenames:
                if fn.endswith((".zip",".mp4",".mov",".keystore",".jks")): continue
                full = os.path.join(dirpath, fn)
                zf.write(full, os.path.relpath(full, root))
`;
    execFileSync('python3', ['-c', pyScript], { stdio: 'pipe' });
    if (!fs.existsSync(zipPath)) {
      res.status(500).json({ error: 'Failed to build ZIP archive.' });
      return;
    }
    res.download(zipPath, 'automate-ai-chatbot.zip');
  } catch (err: any) {
    console.error('Export ZIP error:', err);
    res.status(500).json({ error: err?.message || 'Could not generate project ZIP.' });
  }
});

// ----------------------
// Dev & Production Serving
// ----------------------
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Vite Dev Server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Automate AI Server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
