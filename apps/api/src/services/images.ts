/**
 * Image generation and storage service using Workers AI and R2
 */
export class ImagesService {
    constructor(
        private ai: Ai,
        private r2: R2Bucket
    ) { }

    /**
     * Generate an image using Flux 1 schnell model (available on Workers AI)
     */
    async generateImage(prompt: string, options?: {
        width?: number;
        height?: number;
        steps?: number;
    }): Promise<ArrayBuffer> {
        // Use the AI binding's text-to-image capability
        const response = await this.ai.run(
            "@cf/black-forest-labs/flux-1-schnell",
            {
                prompt,
                width: options?.width ?? 1024,
                height: options?.height ?? 1024,
                steps: options?.steps ?? 4,
            }
        );

        // Response is a ReadableStream, convert to ArrayBuffer
        if (response instanceof ReadableStream) {
            const reader = response.getReader();
            const chunks: Uint8Array[] = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
            }

            const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
            const result = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) {
                result.set(chunk, offset);
                offset += chunk.length;
            }

            return result.buffer;
        }

        // Handle base64 response (common for newer models)
        if (typeof response === "object" && response !== null && "image" in response) {
            const base64String = (response as { image: string }).image;
            const binaryString = atob(base64String);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
        }

        console.error("Unexpected AI response format:", response);
        throw new Error("Unexpected AI response format");
    }

    /**
     * Upload image to R2 bucket
     */
    async uploadToR2(
        imageData: ArrayBuffer,
        key: string,
        contentType = "image/png"
    ): Promise<string> {
        await this.r2.put(key, imageData, {
            httpMetadata: { contentType },
        });

        return key;
    }

    /**
     * Generate and upload game preview image
     */
    async generateGamePreview(
        gameId: string,
        title: string,
        description: string,
        style: string
    ): Promise<{ key: string; fullSizeKey: string }> {
        const prompt = `${style}, game preview art for "${title}": ${description.slice(0, 200)}`;

        // Generate full size image
        const fullSizeImage = await this.generateImage(prompt, {
            width: 1024,
            height: 1024,
        });

        const fullSizeKey = `games/${gameId}/preview-full.png`;
        await this.uploadToR2(fullSizeImage, fullSizeKey);

        // For now, use same image for thumbnail (could resize in future)
        const thumbKey = `games/${gameId}/preview-thumb.png`;
        await this.uploadToR2(fullSizeImage, thumbKey);

        return { key: thumbKey, fullSizeKey };
    }

    /**
     * Generate and upload character portrait
     */
    async generateCharacterPortrait(
        gameId: string,
        characterId: string,
        name: string,
        description: string,
        style: string
    ): Promise<{ key: string; fullSizeKey: string }> {
        const prompt = `${style}, character portrait of ${name}: ${description.slice(0, 200)}`;

        const image = await this.generateImage(prompt, {
            width: 512,
            height: 512,
        });

        const key = `games/${gameId}/characters/${characterId}/portrait.png`;
        await this.uploadToR2(image, key);

        const fullSizeKey = `games/${gameId}/characters/${characterId}/portrait-full.png`;
        await this.uploadToR2(image, fullSizeKey);

        return { key, fullSizeKey };
    }

    /**
     * Generate and upload a scene image for a gameplay turn
     */
    async generateSceneImage(
        sessionId: string,
        turnNumber: number,
        scenePrompt: string,
        style: string = "cinematic fantasy illustration, dramatic lighting, detailed environment"
    ): Promise<string> {
        const prompt = `${style}, ${scenePrompt}`;

        const image = await this.generateImage(prompt, {
            width: 1024,
            height: 576, // 16:9 aspect ratio for cinematic feel
            steps: 4,
        });

        const key = `sessions/${sessionId}/turns/${turnNumber}/scene.png`;
        await this.uploadToR2(image, key);

        return key;
    }

    /**
     * Get public URL for R2 object (requires R2 bucket to be public or custom domain)
     */
    getPublicUrl(key: string, bucketDomain?: string): string {
        if (bucketDomain) {
            return `https://${bucketDomain}/${key}`;
        }
        // Return the key for now, actual URL depends on R2 configuration
        return key;
    }
}
