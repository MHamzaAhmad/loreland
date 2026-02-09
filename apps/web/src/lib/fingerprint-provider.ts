/**
 * Fingerprint Provider Abstraction
 * 
 * Current: ThumbmarkJS (open source)
 * Future: ThumbmarkJS Enhanced or FingerprintJS Pro
 * 
 * To migrate, swap the implementation in getFingerprint()
 */

export interface FingerprintResult {
    visitorId: string;
    confidence?: number;  // Available in paid versions
}

// Lazy-load ThumbmarkJS for performance
let fpPromise: Promise<FingerprintResult> | null = null;

export async function getFingerprint(): Promise<FingerprintResult> {
    if (!fpPromise) {
        fpPromise = import('@thumbmarkjs/thumbmarkjs')
            .then(({ getFingerprint }) => getFingerprint())
            .then((hash) => ({ visitorId: hash }));
    }
    return fpPromise;
}

// Reset fingerprint cache (useful for testing)
export function resetFingerprintCache(): void {
    fpPromise = null;
}

// --- Alternative implementations for future migration ---
// 
// ThumbmarkJS Enhanced:
// fpPromise = import('@thumbmarkjs/thumbmarkjs-enhanced')
//     .then(({ getFingerprint }) => getFingerprint())
//     .then((result) => ({ 
//         visitorId: result.hash,
//         confidence: result.confidence 
//     }));
//
// FingerprintJS Pro:
// import FingerprintJS from '@fingerprintjs/fingerprintjs-pro';
// fpPromise = FingerprintJS.load({ apiKey: 'your-key' })
//     .then(fp => fp.get())
//     .then(result => ({ 
//         visitorId: result.visitorId, 
//         confidence: result.confidence.score 
//     }));
