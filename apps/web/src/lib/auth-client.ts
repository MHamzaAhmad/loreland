import { createAuthClient } from "better-auth/react";
import { anonymousClient } from "better-auth/client/plugins";

/**
 * Better Auth client for web
 * 
 * Includes anonymous plugin for guest login
 */
export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8787",
    plugins: [
        anonymousClient(),
    ],
});

/**
 * Sign in anonymously
 * Creates a guest session without requiring any credentials
 */
export async function signInAnonymously() {
    return authClient.signIn.anonymous();
}

/**
 * Sign up with email and password
 * Links to anonymous account if currently logged in as guest
 */
export async function signUpWithEmail(email: string, password: string, name: string) {
    return authClient.signUp.email({
        email,
        password,
        name,
    });
}

/**
 * Sign in with email and password
 * Links to anonymous account if currently logged in as guest
 */
export async function signInWithEmail(email: string, password: string) {
    return authClient.signIn.email({
        email,
        password,
    });
}

/**
 * Sign out current user
 */
export async function signOut() {
    return authClient.signOut();
}

/**
 * Get current session
 */
export async function getSession() {
    return authClient.getSession();
}
