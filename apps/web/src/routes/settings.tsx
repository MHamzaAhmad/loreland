import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
	useUserSettings,
	useUpdateUserSettings,
	useAvailableModels,
	type AIModel,
} from "@packages/ui-logic";
import { cn } from "@/lib/utils";
import {
	ArrowLeft,
	Check,
	Clock,
	Info,
	BookOpen,
	Sparkle,
	Lightning,
	Brain,
} from "@phosphor-icons/react";

export const Route = createFileRoute("/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	const navigate = useNavigate();
	const { data: settings, isLoading: settingsLoading } = useUserSettings();
	const { data: modelsData, isLoading: modelsLoading } = useAvailableModels();
	const updateSettings = useUpdateUserSettings();
	const [selectedModel, setSelectedModel] = useState<string | null>(null);
	const [expandedModel, setExpandedModel] = useState<string | null>(null);

	useEffect(() => {
		if (!settingsLoading && !settings) {
			navigate({ to: "/" });
		}
	}, [settings, settingsLoading, navigate]);

	useEffect(() => {
		if (settings?.modelPreference) {
			setSelectedModel(settings.modelPreference);
		}
	}, [settings?.modelPreference]);

	if (settingsLoading || modelsLoading) {
		return (
			<div className="min-h-screen bg-[#fcfbf9] flex items-center justify-center">
				<div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
			</div>
		);
	}

	if (!settings || !modelsData) {
		return null;
	}

	const currentModelId = selectedModel || settings.modelPreference || "nova-flash";
	const currentModel = modelsData.models.find((m: AIModel) => m.id === currentModelId);

	const handleModelSelect = (modelId: string) => {
		if (modelId === currentModelId) return;
		setSelectedModel(modelId);
		updateSettings.mutate({ modelPreference: modelId });
	};

	const handleStorytellingToggle = () => {
		const newValue = !settings.storytellingMode;
		updateSettings.mutate({ storytellingMode: newValue });
	};

	const toggleModelDetails = (modelId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setExpandedModel(expandedModel === modelId ? null : modelId);
	};

	return (
		<div className="min-h-screen bg-[#fcfbf9]">
			{/* Header */}
			<header className="border-b border-dashed border-primary/20 bg-white/50 backdrop-blur-sm sticky top-0 z-50">
				<div className="max-w-xl mx-auto px-4 h-12 flex items-center justify-between">
					<button 
						onClick={() => navigate({ to: "/" })}
						className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors group"
					>
						<ArrowLeft size={14} weight="bold" className="group-hover:-translate-x-0.5 transition-transform" />
						<span className="text-xs font-medium">Back</span>
					</button>
					<h1 className="text-xs font-semibold text-foreground">Settings</h1>
					<div className="w-10" />
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-xl mx-auto px-4 py-8">
				<div className="space-y-8">
					{/* Page Title */}
					<div className="text-center">
						<h1 className="text-lg font-semibold text-foreground">Preferences</h1>
					</div>

					{/* AI Model Section */}
					<section className="space-y-3">
						<div className="flex items-center gap-2">
							<Brain className="w-4 h-4 text-primary" weight="fill" />
							<h2 className="text-sm font-semibold text-foreground">AI Model</h2>
						</div>

						{/* Current Selection */}
						{currentModel && (
							<div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-border/40 text-xs">
								<div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
								<span className="text-muted-foreground">Active:</span>
								<span className="font-medium">{currentModel.name}</span>
								<span className="text-muted-foreground ml-auto flex items-center gap-1">
									<Clock size={10} />
									{currentModel.speed}
								</span>
							</div>
						)}

						{/* Model List */}
						<div className="space-y-1.5">
							{modelsData.models.map((model: AIModel) => (
								<ModelRow
									key={model.id}
									model={model}
									isSelected={model.id === currentModelId}
									isUpdating={updateSettings.isPending && selectedModel === model.id}
									isExpanded={expandedModel === model.id}
									onSelect={() => handleModelSelect(model.id)}
									onToggleDetails={(e) => toggleModelDetails(model.id, e)}
								/>
							))}
						</div>
					</section>

					{/* Divider */}
					<div className="border-t border-dashed border-primary/20" />

					{/* Storytelling Mode Section */}
					<section className="space-y-3">
						<div className="flex items-center gap-2">
							<BookOpen className="w-4 h-4 text-amber-600" weight="fill" />
							<h2 className="text-sm font-semibold text-foreground">Storytelling Mode</h2>
						</div>

						{/* Toggle Row */}
						<div
							onClick={handleStorytellingToggle}
							className={cn(
								"flex items-center justify-between px-3 py-2.5 rounded-lg border cursor-pointer transition-colors",
								settings.storytellingMode
									? "border-amber-500/30 bg-amber-50/30"
									: "border-border/60 hover:border-foreground/20 bg-white"
							)}
						>
							<div className="flex items-center gap-2">
								<div className={cn(
									"w-8 h-4 rounded-full transition-colors relative",
									settings.storytellingMode ? "bg-amber-500" : "bg-muted"
								)}>
									<div className={cn(
										"absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
										settings.storytellingMode ? "left-4.5" : "left-0.5"
									)} />
								</div>
								<span className="text-xs font-medium">
									{settings.storytellingMode ? "On" : "Off"}
								</span>
							</div>
							{updateSettings.isPending && (
								<div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin" />
							)}
						</div>

						{settings.storytellingMode && (
							<p className="text-[10px] text-amber-600 flex items-center gap-1 px-1">
								<Sparkle size={10} weight="fill" />
								See all game states during play
							</p>
						)}
					</section>
				</div>
			</main>
		</div>
	);
}

interface ModelRowProps {
	model: AIModel;
	isSelected: boolean;
	isUpdating: boolean;
	isExpanded: boolean;
	onSelect: () => void;
	onToggleDetails: (e: React.MouseEvent) => void;
}

function ModelRow({ model, isSelected, isUpdating, isExpanded, onSelect, onToggleDetails }: ModelRowProps) {
	const getModelIcon = () => {
		if (model.speed === "instant" || model.speed === "fast") {
			return <Lightning size={14} weight="fill" className="text-amber-500" />;
		}
		if (model.tier === "premium") {
			return <Sparkle size={14} weight="fill" className="text-purple-500" />;
		}
		return <Brain size={14} weight="fill" className="text-blue-500" />;
	};

	const getCostDot = () => {
		if (model.costLevel <= 2) return <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />;
		if (model.costLevel <= 3) return <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />;
		return <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />;
	};

	return (
		<div
			className={cn(
				"border rounded-lg overflow-hidden transition-colors",
				isSelected
					? "border-primary/40 bg-primary/5"
					: "border-border/60 hover:border-foreground/20 bg-white",
				isUpdating && "opacity-60"
			)}
		>
			{/* Main Row */}
			<div 
				className="px-3 py-2 flex items-center gap-2 cursor-pointer"
				onClick={isUpdating ? undefined : onSelect}
			>
				{/* Selection */}
				<div className="shrink-0">
					{isUpdating ? (
						<div className="w-4 h-4 border border-primary/30 border-t-primary rounded-full animate-spin" />
					) : isSelected ? (
						<div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
							<Check size={8} weight="bold" className="text-primary-foreground" />
						</div>
					) : (
						<div className="w-4 h-4 rounded-full border border-border" />
					)}
				</div>

				{/* Icon */}
				<div className="shrink-0 w-6 h-6 rounded-md bg-secondary flex items-center justify-center">
					{getModelIcon()}
				</div>

				{/* Name */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-1.5">
						<span className="text-xs font-medium truncate">{model.name}</span>
						{model.isDefault && (
							<span className="text-[9px] px-1 py-0 rounded bg-primary/10 text-primary">Def</span>
						)}
					</div>
				</div>

				{/* Stats */}
				<div className="hidden sm:flex items-center gap-2 shrink-0">
					<span className="text-[10px] text-muted-foreground capitalize">{model.speed}</span>
					{getCostDot()}
				</div>

				{/* Info */}
				<button
					className="shrink-0 p-1 hover:bg-secondary rounded transition-colors"
					onClick={onToggleDetails}
				>
					<Info size={12} className={cn(isExpanded ? "text-primary" : "text-muted-foreground")} />
				</button>
			</div>

			{/* Expanded */}
			{isExpanded && (
				<div className="px-3 pb-2 pt-0 border-t border-border/30">
					<div className="pt-2 pl-6 space-y-2">
						<p className="text-[10px] text-muted-foreground leading-relaxed">{model.whenToUse}</p>
						
						<div className="flex sm:hidden items-center gap-2 text-[10px] text-muted-foreground">
							<span className="capitalize">{model.speed}</span>
							{getCostDot()}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
