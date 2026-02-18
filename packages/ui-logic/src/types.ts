/**
 * Shared types for API responses
 * These mirror the backend schemas
 */

export interface Game {
    id: string;
    userId: string;
    title: string;
    description: string;
    // World & Narrative
    worldDescription: string;
    authorStyle: string | null;
    turnInstructions: string | null;
    summarizationInstructions: string | null;
    firstPrompt: string;
    // End Conditions
    objective: string;
    victoryCondition: string | null;
    defeatCondition: string | null;
    // Image Generation
    imageModel: string | null;
    imageStyle: string | null;
    imageInstructions: string | null;
    previewImage: string | null;
    fullSizePreviewImage: string | null;
    // Metadata
    version: string | null;
    designNotes: string | null;
    sourceGameId: string | null;
    public: boolean;
    favorite: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface GameFull extends Game {
    skills: GameSkill[];
    characters: Character[];
    npcs: Npc[];
    lorebookEntries: LorebookEntry[];
    states: State[];
    triggers: Trigger[];
}

export interface GameSkill {
    id: string;
    gameId: string;
    name: string;
    position: number;
}

export interface Character {
    id: string;
    gameId: string;
    characterId: string;
    name: string;
    description: string;
    portrait: string | null;
    fullSizePortrait: string | null;
    portraitOptions: string[];
    fullSizePortraitOptions: string[];
    currentPortraitIndex: number;
    portraitPromptDetails: Record<string, unknown> | null;
    position: number;
}

export interface Npc {
    id: string;
    gameId: string;
    name: string;
    detail: string | null;
    oneLiner: string | null;
    appearance: string | null;
    location: string | null;
    secretInfo: string | null;
    names: string[];
    imgAppearance: string | null;
    imgClothing: string | null;
    position: number;
}

export interface LorebookEntry {
    id: string;
    gameId: string;
    name: string;
    content: string;
    keywords: string[];
    position: number;
}

export interface State {
    id: string;
    gameId: string;
    name: string;
    description: string | null;
    dataType: "text" | "number" | "boolean";
    initialValue: string | null;
    visibility: "visible" | "hidden" | "conditional";
    displayCondition: string | null;
    position: number;
}

export interface Trigger {
    id: string;
    gameId: string;
    name: string;
    condition: string;
    effect: string;
    triggerOnTurn: number | null;
    oneShot: boolean;
    position: number;
}

export interface CreateGameInput {
    title: string;
    description: string;
    worldDescription: string;
    objective: string;
    firstPrompt: string;
    // Optional
    authorStyle?: string;
    turnInstructions?: string;
    summarizationInstructions?: string;
    victoryCondition?: string;
    defeatCondition?: string;
    imageInstructions?: string;
    imageStyle?: string;
    designNotes?: string;
}

export interface UpdateGameInput {
    title?: string;
    description?: string;
    worldDescription?: string;
    objective?: string;
    firstPrompt?: string;
    // Narrative
    authorStyle?: string;
    turnInstructions?: string;
    summarizationInstructions?: string;
    // End Conditions
    victoryCondition?: string;
    defeatCondition?: string;
    // Image settings
    imageModel?: string;
    imageStyle?: string;
    imageInstructions?: string;
    previewImage?: string;
    fullSizePreviewImage?: string;
    // Settings
    public?: boolean;
    favorite?: boolean;
    designNotes?: string;
    // Nested updates
    characters?: (Partial<Character> & { id?: string })[];
    npcs?: (Partial<Npc> & { id?: string })[];
    lorebookEntries?: (Partial<LorebookEntry> & { id?: string })[];
    states?: (Partial<State> & { id?: string })[];
    triggers?: (Partial<Trigger> & { id?: string })[];
}

export interface GenerateGameInput {
    prompt: string;
    options?: {
        characterCount?: number;
        npcCount?: number;
        generatePreviewImage?: boolean;
        generateCharacterPortraits?: boolean;
        imageStyle?: string;
    };
}

export interface GenerationStatus {
    instanceId: string;
    status: "queued" | "running" | "complete" | "errored" | "terminated" | "waiting";
    currentStep?: string;
    stepsCompleted?: number;
    totalSteps?: number;
    progress?: {
        percentage: number;
        message: string;
        gameId?: string;
    };
    error?: string;
}

export interface GamesListResponse {
    games: Game[];
    pagination: {
        limit: number;
        offset: number;
        count: number;
    };
    cached?: boolean;
}

export interface SearchResult extends Game {
    score: number;
}

export interface SearchResponse {
    query: string;
    results: SearchResult[];
    count: number;
}

export interface User {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    isAnonymous: boolean;
}

export interface AuthState {
    authenticated: boolean;
    user: User | null;
}

export interface SessionSummary {
    id: string;
    gameId: string;
    characterId: string;
    characterName: string | null;
    currentTurn: number;
    model: string;
    lastPlayedAt: string;
    createdAt: string;
}

// Credit System Types

export interface CreditBalance {
    balance: number;
    lifetimeSpent: number;
    lifetimeEarned: number;
    recentTransactionCount: number;
    minimums: {
        toPlay: number;
        toGenerate: number;
    };
}

export interface CreditPackage {
    id: string;
    name: string;
    description?: string;
    credits: number;
    price: number;
    currency: string;
    discount: number;
    pricePerCredit: number;
    imageUrl?: string;
}

export interface CreditTransaction {
    id: string;
    amount: number;
    balanceAfter: number;
    type: "purchase" | "usage" | "refund" | "bonus" | "earnings";
    operationType?: "turn" | "game_generation" | "image" | "summary";
    costBreakdown?: {
        aiCostUSD?: number;
        aiCredits?: number;
        imageCredits?: number;
        imageType?: string;
        creatorShare?: number;
    };
    createdAt: string;
}

export interface PurchaseResponse {
    checkout_url: string;
    checkout_id: string;
    product_id: string;
    credits: number;
    price: number;
    currency: string;
}

export interface BillingConfig {
    creditRate: number;
    imageCosts: {
        preview1024: number;
        portrait512: number;
        scene1024x576: number;
    };
    minBalance: {
        toPlay: number;
        toGenerate: number;
    };
}

/**
 * User settings and preferences
 */
export interface UserSettings {
    modelPreference: string | null;
    storytellingMode: boolean;
}

/**
 * AI Model with detailed information for UI display
 */
export interface AIModel {
    id: string;
    name: string;
    displayName: string;
    description: string;
    provider: string;
    tier: "standard" | "premium";
    isDefault: boolean;
    whenToUse: string;
    pros: string[];
    cons: string[];
    costLevel: 1 | 2 | 3 | 4 | 5;
    costDescription: string;
    speed: "instant" | "fast" | "balanced" | "slow" | "thorough";
    bestFor: string[];
}

export interface ImageModel {
    id: string;
    name: string;
    displayName: string;
    description: string;
    isDefault?: boolean;
    speed: "instant" | "fast" | "balanced" | "slow";
    pros: string[];
    cons: string[];
    costLevel: 1 | 2 | 3 | 4 | 5;
    costDescription: string;
    bestFor: string[];
}
