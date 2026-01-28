/**
 * Credits Service
 * 
 * Handles all credit operations with atomic transactions to prevent race conditions.
 * Uses D1 SQL for atomic balance updates.
 */

import { eq, sql, desc } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { userCredits, creditTransactions } from "@packages/db/schema/d1";
import {
    getBillingConfig,
    calculateCreditsFromCost,
    type BillingConfig
} from "../lib/billing-config";
import type { TurnCost } from "../lib/turn-cost";
import type * as schema from "@packages/db/schema/d1";

/**
 * Metadata for credit transactions
 */
export interface CreditMetadata {
    type: "purchase" | "usage" | "refund" | "bonus";
    operationType?: "turn" | "game_generation" | "image" | "summary";
    costBreakdown?: {
        aiCostUSD?: number;
        aiCredits?: number;
        imageCredits?: number;
        imageType?: string;
    };
    polarEventId?: string;
    sessionId?: string;
    gameId?: string;
    turnNumber?: number;
    description?: string;
}

export class CreditsService {
    private config: BillingConfig;

    constructor(
        private db: DrizzleD1Database<typeof schema>,
        env?: Partial<{
            CREDIT_RATE?: string;
            CREDIT_MARGIN?: string;
            MIN_CREDITS?: string;
            IMAGE_COST_PREVIEW?: string;
            IMAGE_COST_PORTRAIT?: string;
            IMAGE_COST_SCENE?: string;
            MIN_BALANCE_PLAY?: string;
            MIN_BALANCE_GENERATE?: string;
        }>
    ) {
        this.config = getBillingConfig(env);
    }

    /**
     * Get billing configuration
     */
    getConfig(): BillingConfig {
        return this.config;
    }

    /**
     * Calculate credits from OpenRouter cost
     */
    calculateCredits(costUSD: number): number {
        return calculateCreditsFromCost(costUSD, this.config);
    }

    /**
     * Get image cost by type
     */
    getImageCost(imageType: keyof BillingConfig["imageCosts"]): number {
        return this.config.imageCosts[imageType];
    }

    /**
     * Get user's current credit balance
     */
    async getBalance(userId: string): Promise<number> {
        const result = await this.db
            .select({ balance: userCredits.balance })
            .from(userCredits)
            .where(eq(userCredits.userId, userId))
            .get();

        return result?.balance ?? 0;
    }

    /**
     * Check if user has sufficient credits
     */
    async hasSufficientCredits(userId: string, required: number): Promise<boolean> {
        const balance = await this.getBalance(userId);
        return balance >= required;
    }

    /**
     * Atomic credit deduction for a turn
     * Returns false if insufficient credits
     */
    async deductForTurn(
        userId: string,
        turnCost: TurnCost,
        metadata?: Partial<CreditMetadata>
    ): Promise<boolean> {
        return this.deductCredits(userId, turnCost.totalCredits, {
            type: "usage",
            operationType: "turn",
            costBreakdown: {
                aiCostUSD: turnCost.breakdown.aiCostUSD,
                aiCredits: turnCost.aiCredits,
                imageCredits: turnCost.imageCredits,
                imageType: turnCost.breakdown.imageType,
            },
            ...metadata,
        });
    }

    /**
     * Atomic credit deduction
     * 
     * Uses UPDATE ... WHERE balance >= amount to prevent race conditions.
     * If two requests try to spend the same credits, only one succeeds.
     * 
     * @returns true if deduction succeeded, false if insufficient credits
     */
    async deductCredits(
        userId: string,
        amount: number,
        metadata: CreditMetadata
    ): Promise<boolean> {
        if (amount <= 0) return true;

        // Atomic update: only succeeds if balance >= amount
        const result = await this.db.run(sql`
            UPDATE user_credits 
            SET 
                balance = balance - ${amount},
                lifetime_spent = lifetime_spent + ${amount},
                updated_at = ${Date.now()}
            WHERE user_id = ${userId} AND balance >= ${amount}
        `);

        // If no rows affected, insufficient credits
        // D1 uses meta.rows_written for update counts
        const rowsWritten = (result as { rowsAffected?: number }).rowsAffected ?? 0;
        if (rowsWritten === 0) {
            return false;
        }

        // Get new balance for transaction log
        const newBalance = await this.getBalance(userId);

        // Log transaction
        await this.db.insert(creditTransactions).values({
            userId,
            amount: -amount,
            balanceAfter: newBalance,
            type: metadata.type,
            operationType: metadata.operationType,
            costBreakdown: metadata.costBreakdown,
            metadata: {
                polarEventId: metadata.polarEventId,
                sessionId: metadata.sessionId,
                gameId: metadata.gameId,
                turnNumber: metadata.turnNumber,
                description: metadata.description,
            },
        });

        return true;
    }

    /**
     * Add credits to user account (from purchase or bonus)
     * 
     * Uses upsert to create record if it doesn't exist.
     */
    async addCredits(
        userId: string,
        amount: number,
        metadata: Pick<CreditMetadata, "type" | "polarEventId" | "description">
    ): Promise<void> {
        if (amount <= 0) return;

        // Upsert: create or update user credits
        await this.db.run(sql`
            INSERT INTO user_credits (user_id, balance, lifetime_spent, updated_at)
            VALUES (${userId}, ${amount}, 0, ${Date.now()})
            ON CONFLICT(user_id) DO UPDATE SET
                balance = balance + ${amount},
                updated_at = ${Date.now()}
        `);

        const newBalance = await this.getBalance(userId);

        await this.db.insert(creditTransactions).values({
            userId,
            amount,
            balanceAfter: newBalance,
            type: metadata.type,
            metadata: {
                polarEventId: metadata.polarEventId,
                description: metadata.description,
            },
        });
    }

    /**
     * Get recent transactions for a user
     */
    async getTransactions(
        userId: string,
        limit: number = 20
    ): Promise<typeof creditTransactions.$inferSelect[]> {
        return this.db
            .select()
            .from(creditTransactions)
            .where(eq(creditTransactions.userId, userId))
            .orderBy(desc(creditTransactions.createdAt))
            .limit(limit);
    }

    /**
     * Get credit usage summary
     */
    async getUsageSummary(userId: string): Promise<{
        balance: number;
        lifetimeSpent: number;
        recentTransactions: number;
    }> {
        const credits = await this.db
            .select()
            .from(userCredits)
            .where(eq(userCredits.userId, userId))
            .get();

        const recentCount = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(creditTransactions)
            .where(eq(creditTransactions.userId, userId))
            .get();

        return {
            balance: credits?.balance ?? 0,
            lifetimeSpent: credits?.lifetimeSpent ?? 0,
            recentTransactions: recentCount?.count ?? 0,
        };
    }
}
