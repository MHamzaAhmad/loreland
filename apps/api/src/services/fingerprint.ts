/**
 * Device Fingerprint Service
 * 
 * Tracks device fingerprints to prevent welcome credit abuse.
 * Users can only claim welcome credits once per device.
 * Also manages anonymous user persistence per device.
 */

import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { deviceFingerprints, userCredits, users } from "@packages/db/schema/d1";
import type * as schema from "@packages/db/schema/d1";

export class FingerprintService {
    constructor(private db: DrizzleD1Database<typeof schema>) { }

    /**
     * Check if a fingerprint has already claimed welcome credits
     */
    async hasClaimedCredits(fingerprint: string): Promise<boolean> {
        const existing = await this.db
            .select()
            .from(deviceFingerprints)
            .where(eq(deviceFingerprints.fingerprint, fingerprint))
            .get();

        return existing?.claimedCredits === true;
    }

    /**
     * Record that a fingerprint has claimed credits
     */
    async recordCreditClaim(fingerprint: string, userId: string, ipAddress?: string): Promise<void> {
        await this.db.insert(deviceFingerprints).values({
            fingerprint,
            userId,
            ipAddress,
            claimedCredits: true,
        });
    }

    /**
     * Get user's credit balance
     */
    async getBalance(userId: string): Promise<number> {
        const result = await this.db
            .select()
            .from(userCredits)
            .where(eq(userCredits.userId, userId))
            .get();
        return result?.balance ?? 0;
    }

    /**
     * Transfer fingerprint ownership when user links account
     */
    async transferFingerprint(fromUserId: string, toUserId: string): Promise<void> {
        await this.db
            .update(deviceFingerprints)
            .set({ userId: toUserId })
            .where(eq(deviceFingerprints.userId, fromUserId));
    }

    /**
     * Find the active anonymous user for a fingerprint
     * Returns the user ID if one exists and is still anonymous
     */
    async getActiveAnonymousUser(fingerprint: string): Promise<string | null> {
        const record = await this.db
            .select()
            .from(deviceFingerprints)
            .where(eq(deviceFingerprints.fingerprint, fingerprint))
            .get();

        if (record?.isActiveAnonymous && record.userId) {
            // Verify user still exists and is anonymous
            const user = await this.db
                .select()
                .from(users)
                .where(eq(users.id, record.userId))
                .get();

            if (user?.isAnonymous) {
                return record.userId;
            }
        }
        return null;
    }

    /**
     * Set fingerprint's active anonymous user
     */
    async setActiveAnonymousUser(fingerprint: string, userId: string, ipAddress?: string): Promise<void> {
        await this.db.insert(deviceFingerprints)
            .values({
                fingerprint,
                userId,
                ipAddress,
                isActiveAnonymous: true,
                claimedCredits: true,
            })
            .onConflictDoUpdate({
                target: deviceFingerprints.fingerprint,
                set: { userId, isActiveAnonymous: true },
            });
    }

    /**
     * Clear active anonymous flag (called when user links account)
     */
    async clearActiveAnonymous(fingerprint: string): Promise<void> {
        await this.db
            .update(deviceFingerprints)
            .set({ isActiveAnonymous: false })
            .where(eq(deviceFingerprints.fingerprint, fingerprint));
    }
}
