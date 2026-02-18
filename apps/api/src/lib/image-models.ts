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
 * - Lucid: Leonardo.AI premium models
 */
export const IMAGE_MODELS: Record<string, ImageModel> = {
	'prism-flash': {
		id: 'prism-flash',
		name: 'Prism Flash',
		displayName: 'Prism Flash ⚡',
		description: 'Ultra-fast distilled model for instant scene generation.',
		actualModel: '@cf/black-forest-labs/flux-2-klein-4b',
		isDefault: true,
		speed: 'instant',
		pros: [
			"Ultra-fast generation",
			"Great for action scenes",
			"Lowest cost per image",
			"Interactive workflows"
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
	'prism-hd': {
		id: 'prism-hd',
		name: 'Prism HD',
		displayName: 'Prism HD ✨',
		description: 'Enhanced quality distilled model with fast generation.',
		actualModel: '@cf/black-forest-labs/flux-2-klein-9b',
		speed: 'fast',
		pros: [
			"Enhanced quality output",
			"Fast generation",
			"State-of-the-art clarity",
			"Great balance"
		],
		cons: [
			"Slower than Flash",
			"Uses more compute"
		],
		costLevel: 2,
		costDescription: "$$ Balanced",
		bestFor: ["Balanced quality", "Story moments", "Character scenes", "Environmental shots"],
		width: 1024,
		height: 576,
		steps: 8,
	},
	'canvas-pro': {
		id: 'canvas-pro',
		name: 'Canvas Pro',
		displayName: 'Canvas Pro 🎨',
		description: 'Highly realistic images with multi-reference support.',
		actualModel: '@cf/black-forest-labs/flux-2-dev',
		speed: 'balanced',
		pros: [
			"Highly realistic output",
			"Multi-reference support",
			"Excellent detail",
			"Professional quality"
		],
		cons: [
			"Longer generation time",
			"Higher cost per image"
		],
		costLevel: 3,
		costDescription: "$$$ Premium",
		bestFor: ["Cinematic scenes", "Detailed environments", "Key story moments", "Portraits"],
		width: 1024,
		height: 576,
		steps: 20,
	},
	'lucid-origin': {
		id: 'lucid-origin',
		name: 'Lucid Origin',
		displayName: 'Lucid Origin 💎',
		description: 'Leonardo.AI\'s most adaptable and prompt-responsive model.',
		actualModel: '@cf/leonardo/lucid-origin',
		speed: 'balanced',
		pros: [
			"Exceptional prompt adherence",
			"Sharp graphic design",
			"Accurate text rendering",
			"Versatile style range"
		],
		cons: [
			"Partner model pricing",
			"May vary by style"
		],
		costLevel: 4,
		costDescription: "$$$$ Leonardo",
		bestFor: ["Concept art", "Product visuals", "Stylized scenes", "Creative direction"],
		width: 1024,
		height: 576,
		steps: 20,
	},
	'sdxl-lightning': {
		id: 'sdxl-lightning',
		name: 'SDXL Lightning',
		displayName: 'SDXL Lightning ⚡',
		description: 'Lightning-fast SDXL for high-quality 1024px images.',
		actualModel: '@cf/bytedance/stable-diffusion-xl-lightning',
		speed: 'fast',
		pros: [
			"SDXL quality at speed",
			"High resolution output",
			"Few steps needed",
			"Consistent results"
		],
		cons: [
			"Less artistic variety",
			"Standard SDXL look"
		],
		costLevel: 2,
		costDescription: "$$ Fast SDXL",
		bestFor: ["High-res scenes", "Fast quality", "Standard visuals", "Quick iterations"],
		width: 1024,
		height: 576,
		steps: 4,
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
