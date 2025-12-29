import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useGenerateGame, useGenerationStatus } from '@packages/ui-logic'
import { Button } from '../../components/ui/8bit/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/8bit/card'
import { GenerationProgress } from '../../components/GenerationProgress'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/games/new')({
    component: CreateGame,
})

function CreateGame() {
    const navigate = useNavigate()
    const [prompt, setPrompt] = useState('')
    const [instanceId, setInstanceId] = useState<string | null>(null)

    const generateMutation = useGenerateGame()
    const statusQuery = useGenerationStatus(instanceId, {
        onComplete: (gameId) => {
            // Navigate to the new game
            setTimeout(() => {
                navigate({ to: '/games/$id', params: { id: gameId } })
            }, 1500)
        },
    })

    const handleGenerate = async () => {
        if (!prompt.trim()) return

        try {
            const result = await generateMutation.mutateAsync({
                prompt: prompt.trim(),
                characterCount: 2,
                npcCount: 3,
                generatePreviewImage: true,
                generateCharacterPortraits: true,
                imageStyle: 'pixel art, 8-bit retro game style',
            })
            setInstanceId(result.instanceId)
        } catch (err) {
            console.error('Generation failed:', err)
        }
    }

    const isGenerating = !!instanceId && statusQuery.data?.status !== 'complete'

    return (
        <div className="min-h-screen p-4 md:p-8">
            {/* Header */}
            <header className="max-w-2xl mx-auto mb-8">
                <Link to="/" className="inline-flex items-center gap-2 text-xs text-[var(--8bit-muted-foreground)] hover:text-[var(--8bit-foreground)] mb-4">
                    <ArrowLeft className="h-4 w-4" />
                    BACK TO CATALOG
                </Link>
                <h1 className="text-xl md:text-2xl text-[var(--8bit-primary)]">
                    CREATE NEW GAME
                </h1>
            </header>

            <main className="max-w-2xl mx-auto space-y-6">
                {!isGenerating ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                DESCRIBE YOUR ADVENTURE
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="A medieval fantasy where a young blacksmith discovers they can forge magical weapons..."
                                className="w-full h-40 p-4 text-xs bg-[var(--8bit-background)] border-4 border-[var(--8bit-border)] resize-none focus:outline-none focus:border-[var(--8bit-primary)]"
                                disabled={generateMutation.isPending}
                            />
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-[var(--8bit-muted-foreground)]">
                                    {prompt.length} / 500 characters
                                </span>
                                <Button
                                    onClick={handleGenerate}
                                    disabled={!prompt.trim() || generateMutation.isPending}
                                >
                                    <Sparkles className="h-4 w-4" />
                                    <span className="text-xs">
                                        {generateMutation.isPending ? 'STARTING...' : 'GENERATE'}
                                    </span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <GenerationProgress
                        status={statusQuery.data}
                        isLoading={statusQuery.isLoading}
                    />
                )}

                {generateMutation.error && (
                    <p className="text-center text-xs text-[var(--8bit-destructive)]">
                        Failed to start generation. Please try again.
                    </p>
                )}
            </main>
        </div>
    )
}
