import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

// D1 Schema Types
import {
    games,
    gameSkills,
    gameConditions
} from "../schema/d1/games";
import {
    characters,
    characterSkills,
    characterInitialItems
} from "../schema/d1/characters";
import { npcs } from "../schema/d1/npcs";
import {
    lorebookEntries,
    trackedItems,
    triggerEvents
} from "../schema/d1/assets";

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
export type GameCondition = InferSelectModel<typeof gameConditions>;
export type NewGameCondition = InferInsertModel<typeof gameConditions>;

// Characters
export type Character = InferSelectModel<typeof characters>;
export type NewCharacter = InferInsertModel<typeof characters>;
export type CharacterSkill = InferSelectModel<typeof characterSkills>;
export type NewCharacterSkill = InferInsertModel<typeof characterSkills>;
export type CharacterInitialItem = InferSelectModel<typeof characterInitialItems>;
export type NewCharacterInitialItem = InferInsertModel<typeof characterInitialItems>;

// NPCs
export type NPC = InferSelectModel<typeof npcs>;
export type NewNPC = InferInsertModel<typeof npcs>;

// Assets
export type LorebookEntry = InferSelectModel<typeof lorebookEntries>;
export type NewLorebookEntry = InferInsertModel<typeof lorebookEntries>;
export type TrackedItem = InferSelectModel<typeof trackedItems>;
export type NewTrackedItem = InferInsertModel<typeof trackedItems>;
export type TriggerEvent = InferSelectModel<typeof triggerEvents>;
export type NewTriggerEvent = InferInsertModel<typeof triggerEvents>;

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
    /** Dynamic traits from tracked items (e.g., health, gold) */
    traits: Record<string, string | number | boolean>;
}
