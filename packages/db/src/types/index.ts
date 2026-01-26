import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

// D1 Schema Types
import {
    games,
    gameSkills,
    keywordInstructions,
} from "../schema/d1/games";
import {
    characters,
    characterSkills,
} from "../schema/d1/characters";
import { npcs } from "../schema/d1/npcs";
import { lorebookEntries } from "../schema/d1/assets";
import { states, characterInitialStates } from "../schema/d1/states";
import { triggers } from "../schema/d1/triggers";
import { gamePermissions } from "../schema/d1/permissions";

// Agent Schema Types
import { messages, summary } from "../schema/agent/messages";
import { imageRefs } from "../schema/agent/images";
import { agentRuns } from "../schema/agent/runs";

// ============================================
// D1 Types (Central Database)
// ============================================

// Games
export type Game = InferSelectModel<typeof games>;
export type NewGame = InferInsertModel<typeof games>;
export type GameSkill = InferSelectModel<typeof gameSkills>;
export type NewGameSkill = InferInsertModel<typeof gameSkills>;
export type KeywordInstruction = InferSelectModel<typeof keywordInstructions>;
export type NewKeywordInstruction = InferInsertModel<typeof keywordInstructions>;

// Characters
export type Character = InferSelectModel<typeof characters>;
export type NewCharacter = InferInsertModel<typeof characters>;
export type CharacterSkill = InferSelectModel<typeof characterSkills>;
export type NewCharacterSkill = InferInsertModel<typeof characterSkills>;

// NPCs
export type NPC = InferSelectModel<typeof npcs>;
export type NewNPC = InferInsertModel<typeof npcs>;

// Assets
export type LorebookEntry = InferSelectModel<typeof lorebookEntries>;
export type NewLorebookEntry = InferInsertModel<typeof lorebookEntries>;

// States
export type State = InferSelectModel<typeof states>;
export type NewState = InferInsertModel<typeof states>;
export type CharacterInitialState = InferSelectModel<typeof characterInitialStates>;
export type NewCharacterInitialState = InferInsertModel<typeof characterInitialStates>;

// Triggers
export type Trigger = InferSelectModel<typeof triggers>;
export type NewTrigger = InferInsertModel<typeof triggers>;

// Permissions
export type GamePermission = InferSelectModel<typeof gamePermissions>;
export type NewGamePermission = InferInsertModel<typeof gamePermissions>;

// ============================================
// Agent Types (Per-Session Database)
// ============================================

export type Message = InferSelectModel<typeof messages>;
export type NewMessage = InferInsertModel<typeof messages>;
export type Summary = InferSelectModel<typeof summary>;
export type NewSummary = InferInsertModel<typeof summary>;
export type ImageRef = InferSelectModel<typeof imageRefs>;
export type NewImageRef = InferInsertModel<typeof imageRefs>;
export type AgentRun = InferSelectModel<typeof agentRuns>;
export type NewAgentRun = InferInsertModel<typeof agentRuns>;

// ============================================
// Agent State Type
// ============================================

export interface GameSessionState {
    gameId: string;
    userId: string;
    characterId: string;
    currentTurn: number;
    status: "active" | "victory" | "defeat";
    /** Dynamic states (e.g., health, gold) */
    states: Record<string, string | number | boolean>;
}
