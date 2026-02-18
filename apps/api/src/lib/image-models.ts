/**
 * Image Model Registry Service
 * 
 * Centralized registry for all image generation models with gamified names.
 * Uses Cloudflare Workers AI for image generation.
 */

export type ImageModelSpeed = 'instant' | 'fast' | 'balanced' | 'slow';

export interface ImageModel {
	id: string;
	name: string;
	displayName: string;
	description: string;
	actualModel: string;
	isDefault?: boolean;
	speed: ImageModelSpeed;
	pros: string[];
	cons: string[];
	costLevel: 1 | 2 | 3 | 4 | 5;
	costDescription: string;
	bestFor: string[];
	width: number;
	height: number;
	steps?: number;
}

/**
 * Available image models with gamified names
 * 
 * Naming conventions:
 * - Prism: Fast, efficient models (light refraction)
 * - Canvas: Detailed, artistic models
 * - Palette: Creative, varied styles
 */
export const IMAGE_MODELS: Record<string, ImageModel> = {
	'prism-flash': {
		id: 'prism-flash',
		name: 'Prism Flash',
		displayName: 'Prism Flash ⚡',
		description: 'Lightning-fast image generation for dynamic scenes.',
		actualModel: '@cf/black-forest-labs/flux-1-schnell',
		isDefault: true,
		speed: 'instant',
		pros: [
			"Extremely fast generation",
			"Great for action scenes",
			"Low cost per image",
			"Consistent quality"
		],
		cons: [
			"Less detail than premium models",
			"May miss subtle visual nuances"
		],
		costLevel: 1,
		costDescription: "$ Most affordable",
		bestFor: ["Action scenes", "Quick visuals", "Combat encounters", "Fast-paced moments"],
		width: 1024,
		height: 576,
		steps: 4,
	},
	'canvas-pro': {
		id: 'canvas-pro',
		name: 'Canvas Pro',
		displayName: 'Canvas Pro 🎨',
		description: 'High-quality artistic generation with rich details.',
		actualModel: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
		speed: 'slow',
		pros: [
			"Excellent detail and quality",
			"Great for atmospheric scenes",
			"Rich color reproduction",
			"Artistic style variety"
		],
		cons: [
			"Slower generation time",
			"Higher cost per image",
			"May need more steps for quality"
		],
		costLevel: 3,
		costDescription: "$$ Moderate cost",
		bestFor: ["Atmospheric scenes", "Detailed environments", "Portraits", "Key moments"],
		width: 1024,
		height: 576,
		steps: 20,
	},
	'prism-hd': {
		id: 'prism-hd',
		name: 'Prism HD',
		displayName: 'Prism HD ✨',
		description: 'Enhanced quality with fast generation.',
		actualModel: '@cf/black-forest-labs/flux-1-schnell',
		speed: 'fast',
		pros: [
			"Good balance of speed and quality",
			"Higher step count for detail",
			"Consistent style",
			"Reliable output"
		],
		cons: [
			"Slightly slower than Flash",
			"Uses more compute"
		],
		costLevel: 2,
		costDescription: "$$ Balanced",
		bestFor: ["Balanced quality", "Story moments", "Character scenes", "Environmental shots"],
		width: 1024,
		height: 576,
		steps: 8,
	},
} as const;

export function getImageModel(id: string): ImageModel {
	const model = IMAGE_MODELS[id];
	if (!model) {
		throw new Error(`Unknown image model: ${id}. Available models: ${Object.keys(IMAGE_MODELS).join(', ')}`);
	}
	return model;
}

export function getDefaultImageModel(): ImageModel {
	const defaultModel = Object.values(IMAGE_MODELS).find(m => m.isDefault);
	return defaultModel ?? IMAGE_MODELS['prism-flash']!;
}

export function getAllImageModels(): ImageModel[] {
	return Object.values(IMAGE_MODELS);
}

export function getImageModelIds(): string[] {
	return Object.keys(IMAGE_MODELS);
}

export function isValidImageModelId(id: string): boolean {
	return id in IMAGE_MODELS;
}

export function resolveImageModelToActual(id: string | null | undefined): string {
	if (!id || !isValidImageModelId(id)) {
		return getDefaultImageModel().actualModel;
	}
	return IMAGE_MODELS[id].actualModel;
}

export function getImageModelConfig(id: string | null | undefined): { 
    width: number; 
    height: number; 
    steps: number;
    actualModel: string;
} {
    const defaultModel = getDefaultImageModel();
    
    if (!id || !isValidImageModelId(id)) {
        return { 
            width: defaultModel.width, 
            height: defaultModel.height, 
            steps: defaultModel.steps ?? 4,
            actualModel: defaultModel.actualModel,
        };
    }
    const model = IMAGE_MODELS[id]!;
    return { 
        width: model.width, 
        height: model.height, 
        steps: model.steps ?? 4,
        actualModel: model.actualModel,
    };
}
