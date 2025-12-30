export function getImageUrl(key: string | null | undefined, baseUrl: string = import.meta.env.VITE_API_URL || "http://localhost:8787"): string | undefined {
    if (!key) return undefined;
    if (key.startsWith("http")) return key;

    // Clean leading slash if present in key
    const cleanKey = key.startsWith("/") ? key.slice(1) : key;

    // Construct proxy URL
    return `${baseUrl}/api/images/${cleanKey}`;
}
