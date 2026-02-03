import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
	useUserSettings,
	useUpdateUserSettings,
	useAvailableModels,
	type AIModel,
} from "@packages/ui-logic";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
	ArrowLeft,
	Check,
	Clock,
	Coins,
	Cpu,
	Info,
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

	// Redirect to login if not authenticated
	useEffect(() => {
		if (!settingsLoading && !settings) {
			navigate({ to: "/" });
		}
	}, [settings, settingsLoading, navigate]);

	// Track local selection state for immediate UI feedback
	useEffect(() => {
		if (settings?.modelPreference) {
			setSelectedModel(settings.modelPreference);
		}
	}, [settings?.modelPreference]);

	if (settingsLoading || modelsLoading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<Spinner size="lg" />
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

	return (
		<div className="min-h-screen bg-background">
			{/* Compact Header */}
			<header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
				<div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
					<button 
						onClick={() => navigate({ to: "/" })}
						className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
					>
						<ArrowLeft size={16} weight="bold" className="group-hover:-translate-x-0.5 transition-transform" />
						<span className="text-sm font-medium">Back</span>
					</button>

					<h1 className="text-sm font-semibold text-foreground">Settings</h1>

					<div className="w-16" />
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-3xl mx-auto px-6 py-12">
				<div className="space-y-8">
					{/* AI Model Section */}
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<Cpu size={18} className="text-muted-foreground" />
							<h2 className="text-lg font-semibold">AI Model</h2>
						</div>
						
						<p className="text-sm text-muted-foreground">
							Choose which AI powers your game sessions. This affects response quality, speed, and cost.
						</p>

						{/* Current Selection */}
						{currentModel && (
							<div className="flex items-center gap-2 text-sm">
								<span className="text-muted-foreground">Currently active:</span>
								<span className="font-medium text-foreground">{currentModel.name}</span>
								<span className="text-xs px-2 py-0.5 rounded-full bg-[var(--pastel-blue)] text-[var(--pastel-blue-fg)]">
									active
								</span>
							</div>
						)}

						{/* Model List */}
						<div className="space-y-3">
							{modelsData.models.map((model: AIModel) => (
								<ModelCard
									key={model.id}
									model={model}
									isSelected={model.id === currentModelId}
									isUpdating={updateSettings.isPending && selectedModel === model.id}
									onSelect={() => handleModelSelect(model.id)}
								/>
							))}
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}

interface ModelCardProps {
	model: AIModel;
	isSelected: boolean;
	isUpdating: boolean;
	onSelect: () => void;
}

function ModelCard({ model, isSelected, isUpdating, onSelect }: ModelCardProps) {
	const [showDetails, setShowDetails] = useState(false);

	// Cost indicator dots
	const costDots = Array(5).fill(0).map((_, i) => (
		<div
			key={i}
			className={cn(
				"w-1.5 h-1.5 rounded-full",
				i < model.costLevel ? "bg-foreground/60" : "bg-border"
			)}
		/>
	));

	return (
		<Card
			className={cn(
				"border transition-all duration-200 cursor-pointer",
				isSelected
					? "border-foreground/40 bg-secondary/50"
					: "border-border/60 hover:border-foreground/20 hover:bg-secondary/30"
			)}
			onClick={isUpdating ? undefined : onSelect}
		>
			<CardContent className="p-4">
				<div className="flex items-start gap-4">
					{/* Selection indicator */}
					<div className="mt-0.5">
						{isUpdating ? (
							<Spinner size="sm" />
						) : isSelected ? (
							<div className="w-4 h-4 rounded-full bg-foreground flex items-center justify-center">
								<Check size={10} weight="bold" className="text-background" />
							</div>
						) : (
							<div className="w-4 h-4 rounded-full border-2 border-border hover:border-foreground/30 transition-colors" />
						)}
					</div>

					{/* Main content */}
					<div className="flex-1 min-w-0">
						<div className="flex items-start justify-between gap-3">
							<div>
								<h3 className="font-medium text-foreground">{model.name}</h3>
								<p className="text-sm text-muted-foreground mt-0.5">{model.description}</p>
							</div>
							
							{/* Info toggle */}
							<Button
								variant="ghost"
								size="sm"
								className="h-7 w-7 p-0 shrink-0"
								onClick={(e) => {
									e.stopPropagation();
									setShowDetails(!showDetails);
								}}
							>
								<Info size={14} className="text-muted-foreground" />
							</Button>
						</div>

						{/* Quick stats */}
						<div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
							<div className="flex items-center gap-1.5">
								<Clock size={12} />
								<span className="capitalize">{model.speed}</span>
							</div>
							<div className="flex items-center gap-1.5">
								<Coins size={12} />
								<div className="flex gap-0.5">{costDots}</div>
							</div>
						</div>

						{/* Expanded details */}
						{showDetails && (
							<div className="mt-4 pt-4 border-t border-border/40 space-y-3">
								<p className="text-sm text-muted-foreground">{model.whenToUse}</p>
								
								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-xs font-medium text-foreground mb-2">Strengths</p>
										<ul className="space-y-1">
											{model.pros.slice(0, 2).map((pro, i) => (
												<li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
													<span className="text-emerald-600">+</span>
													{pro}
												</li>
											))}
										</ul>
									</div>
									<div>
										<p className="text-xs font-medium text-foreground mb-2">Considerations</p>
										<ul className="space-y-1">
											{model.cons.slice(0, 2).map((con, i) => (
												<li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
													<span className="text-rose-500">-</span>
													{con}
												</li>
											))}
										</ul>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
