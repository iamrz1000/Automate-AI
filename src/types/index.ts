export type NavTab = 'chat' | 'agents' | 'tasks' | 'build' | 'library' | 'integrations' | 'models' | 'settings' | 'upgrade' | 'admin';

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  providerId: 'automate' | 'google' | 'anthropic' | 'openai' | 'meta' | 'deepseek' | 'mistral';
  badge?: string;
  description: string;
  pricing: {
    inputPer1M: string;
    outputPer1M: string;
  };
  contextWindow: string;
  maxOutput: string;
  inputModalities: ('text' | 'image' | 'file' | 'audio' | 'video' | 'embedding')[];
  capabilities: ('reasoning' | 'tool_calling' | 'vision' | 'voice' | 'code')[];
  recommended?: boolean;
  benchmarkScore: number; // e.g. 88.5
  latency: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  model?: string;
  isStreaming?: boolean;
  thoughtProcess?: string;
  generatedImage?: {
    url: string;
    prompt: string;
    revisedPrompt?: string;
    aspectRatio?: string;
    dimensions?: string;
    seed?: number;
    variations?: string[];
  };
  attachments?: {
    name: string;
    type: string;
    size?: string;
    dataUrl?: string;
    base64?: string;
    mimeType?: string;
  }[];
}

export interface Conversation {
  id: string;
  title: string;
  modelId: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  model: string;
  icon: string;
  color: string;
  badge: string;
  verified: boolean;
  creator: string;
  systemPrompt: string;
  tools: string[];
  shared: boolean;
  uses: number;
}

export interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  targetModel: string;
  targetAgent: string;
  schedule: string;
  frequency: string;
  timezone: string;
  status: 'Active' | 'Needs approval' | 'Paused' | 'Failed provisioning' | 'Completed one-time';
  lastRun: string;
  nextRun: string;
  requiresApproval: boolean;
  runsCount: number;
}

export interface WorkflowStep {
  id: string;
  stepNumber: number;
  title: string;
  type: 'trigger' | 'model' | 'condition' | 'tool' | 'output';
  description: string;
  engine: string;
  inputs: string[];
  outputs: string[];
  status?: 'pending' | 'running' | 'completed' | 'ready' | string;
}

export interface WorkflowDefinition {
  workflowTitle: string;
  workflowSummary: string;
  category: string;
  estimatedExecutionTime: string;
  steps: WorkflowStep[];
}

export interface LibraryAsset {
  id: string;
  title: string;
  category: 'Infographics' | 'Designs' | 'Images' | 'Videos' | 'Prompts';
  type: 'image' | 'prompt' | 'video' | 'design';
  url: string;
  description: string;
  tags: string[];
  createdAt: string;
  size: string;
  resolution?: string;
  promptText?: string;
}

export interface IntegrationConnector {
  id: string;
  name: string;
  description: string;
  category: 'Connectors' | 'MCP (Beta)' | 'API Keys' | 'Custom Tools';
  icon: string;
  status: 'Connected' | 'Not connected' | 'Coming soon' | 'Configuration required' | 'Connection error';
  configured: boolean;
  popular?: boolean;
  scopes?: string[];
  docsUrl?: string;
}

export interface UserProfile {
  id?: string;
  uid?: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  role: string; // 'admin' | 'user'
  jobTitle?: string; // e.g. 'Software Engineer' | 'Student' | 'Member'
  organization: string;
  phone?: string;
  dob?: string;
  avatarUrl?: string;
  timezone: string;
  plan: string;
  theme: 'light' | 'system' | 'dark';
  referralCode: string;
  referralCount: number;
  referralCredits: number;
  areasOfInterest: string[];
  isAdmin?: boolean;
  dailyLimit?: number; // 15 for normal user, 999999 for admin
  messagesToday?: number;
  imagesToday?: number;
  status?: 'active' | 'suspended';
  joinedAt?: string;
  lastLogin?: string;
}

export interface AuthAuditLog {
  id: string;
  email: string;
  name?: string;
  action: 'SIGN_IN' | 'SIGN_UP' | 'LOGOUT' | 'ROLE_CHANGED' | 'LIMIT_UPDATED';
  timestamp: string;
  ip: string;
  userAgent: string;
  status: 'SUCCESS' | 'FAILED';
  role: string;
}

export interface AdminUserData {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  plan: string;
  dailyLimit: number;
  messagesToday: number;
  imagesToday: number;
  status: 'active' | 'suspended';
  joinedAt: string;
  lastLogin: string;
  conversationsCount: number;
  conversations: Conversation[];
}
