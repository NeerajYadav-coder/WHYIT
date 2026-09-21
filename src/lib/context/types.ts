/**
 * Context Engine Types
 *
 * Defines the strongly-typed context structure for Whyit.
 * Section structures are designed to be expanded by future engines.
 * Never use loosely typed structures or 'any'.
 */

export interface ProjectContextInfo {
  id: string;
  name: string;
  context?: string | null;
}

export interface GoalContextInfo {
  goal: string;
  motivation: string;
}

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ConversationContextInfo {
  conversationId: string;
  messages: ConversationMessage[];
}

// Future placeholder types (strongly typed but empty for now)
export interface MemoryContextInfo {
  // Reserved for Sprint 5 memory facts/associations
  _brand?: "memory";
}

export interface RegisteredKnowledgeSource {
  id: string;
  title: string;
  type: string;
  status: string;
  wordCount: number;
  tokenEstimate: number;
  content?: string;
}

export interface ResourceContextInfo {
  sources: RegisteredKnowledgeSource[];
}

export interface ProgressContextInfo {
  // Reserved for learning path completion metrics
  _brand?: "progress";
}

export interface RetrievedChunk {
  id: string;
  sourceId: string;
  sourceTitle: string;
  sourceType: string;
  sectionTitle?: string | null;
  content: string;
  tokenEstimate: number;
  relevanceScore: number;
}

export interface KnowledgeContextInfo {
  chunks: RetrievedChunk[];
}

export interface CuriosityThread {
  title: string;
  selectedText: string;
  messages: {
    role: "user" | "assistant";
    content: string;
  }[];
}

export interface CuriosityContextInfo {
  threads: CuriosityThread[];
}

/** The complete context shape constructed by the engine */
export interface WhyitContext {
  project?: ProjectContextInfo;
  goal?: GoalContextInfo;
  conversation?: ConversationContextInfo;
  memory?: MemoryContextInfo;
  resources?: ResourceContextInfo;
  progress?: ProgressContextInfo;
  knowledge?: KnowledgeContextInfo;
  curiosity?: CuriosityContextInfo;
}

/** Request parameters passed to all providers */
export interface ContextRequestParams {
  projectId: string;
  conversationId?: string;
  userMessage?: string;
  curiosities?: {
    title: string;
    selectedText: string;
    messages: { role: "user" | "assistant"; content: string }[];
  }[];
}

/** Represents a single provider of context data */
export interface ContextProvider {
  readonly key: keyof WhyitContext;
  provide(params: ContextRequestParams): Promise<WhyitContext[keyof WhyitContext]>;
}

/** Metrics for token budgeting */
export interface TokenBudget {
  maxContextTokens: number;
  maxCompletionTokens: number;
}

export interface TokenMetrics {
  budget: TokenBudget;
  estimatedPromptTokens: number;
  estimatedResponseTokens: number;
}
