import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useGame, useUpdateGame } from '@packages/ui-logic'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Save, Plus, Trash, Globe, Users, Box, Zap, Settings } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const Route = createFileRoute('/games/$id/edit')({
    component: EditGame,
})

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs))
}

function EditGame() {
    const { id } = Route.useParams()
    const { data: gameResponse, isLoading } = useGame(id)
    const game = gameResponse?.game
    const updateGame = useUpdateGame()
    const queryClient = useQueryClient()

    // Tabs
    const [activeTab, setActiveTab] = useState('general')

    // Form State
    const [formData, setFormData] = useState<any>({})
    const [characters, setCharacters] = useState<any[]>([])
    const [npcs, setNpcs] = useState<any[]>([])
    const [lore, setLore] = useState<any[]>([])
    const [items, setItems] = useState<any[]>([])
    const [triggers, setTriggers] = useState<any[]>([])

    useEffect(() => {
        if (game) {
            setFormData({
                title: game.title,
                description: game.description,
                background: game.background,
                instructions: game.instructions,
                objective: game.objective,
                imageStyle: game.imageStyle,
            })

            if ((game as any).characters) setCharacters((game as any).characters)
            if ((game as any).npcs) setNpcs((game as any).npcs)
            if ((game as any).lorebookEntries) setLore((game as any).lorebookEntries)
            if ((game as any).trackedItems) setItems((game as any).trackedItems)
            if ((game as any).triggerEvents) setTriggers((game as any).triggerEvents)
        }
    }, [game])

    const handleSave = async () => {
        try {
            await updateGame.mutateAsync({
                id,
                data: {
                    ...formData,
                    characters,
                    npcs,
                    lorebookEntries: lore,
                    trackedItems: items,
                    triggerEvents: triggers,
                },
            })
            queryClient.invalidateQueries({ queryKey: ['games', id] })
            alert('SYSTEM UPDATE SUCCESSFUL')
        } catch (e) {
            console.error(e)
            alert('SYSTEM UPDATE FAILED')
        }
    }

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-black text-primary font-mono gap-2">
                <Loader2 className="animate-spin" />
                <span>ACCESSING_MAINFRAME...</span>
            </div>
        )
    }

    if (!game) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4 font-mono bg-black">
                <div className="text-destructive">[DATA_CORRUPTION_DETECTED]</div>
                <div className="text-muted-foreground text-sm">Target simulation not found in archives.</div>
                <Link to="/games/mine" className="text-primary hover:underline text-sm flex items-center gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    <span>RETURN_TO_BASE</span>
                </Link>
            </div>
        )
    }

    const tabs = [
        { id: 'general', label: 'CORE_DATA', icon: Settings },
        { id: 'characters', label: 'ROSTER', icon: Users },
        { id: 'npcs', label: 'ENTITIES', icon: Users },
        { id: 'lore', label: 'DATABASE', icon: Globe },
        { id: 'items', label: 'INVENTORY', icon: Box },
        { id: 'triggers', label: 'EVENTS', icon: Zap },
    ]

    return (
        <div className="min-h-screen bg-background relative selection:bg-primary/30 font-mono text-sm pb-20">
            {/* Background elements */}
            <div className="scanline-overlay pointer-events-none fixed inset-0 z-50 opacity-50" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background z-0 pointer-events-none" />

            <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-8">
                <header className="mb-8 flex items-center justify-between border-b border-primary/20 pb-6">
                    <div className="flex items-center gap-4">
                        <Link to="/games/mine" className="group flex items-center gap-2 text-primary/60 hover:text-primary transition-colors text-xs font-mono uppercase tracking-widest">
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span>Return</span>
                        </Link>
                        <div className="h-8 w-px bg-primary/20" />
                        <div>
                            <div className="text-[10px] text-primary/40 font-mono mb-1">EDIT_MODE</div>
                            <h1 className="text-xl md:text-2xl font-orbitron text-primary tracking-wide">
                                {game.title.toUpperCase()}
                            </h1>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={updateGame.isPending}
                        className="hud-button-primary flex items-center gap-2 px-6 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/50 hover:border-primary transition-all text-primary font-bold tracking-wider disabled:opacity-50"
                    >
                        {updateGame.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        <span>{updateGame.isPending ? 'UPLOADING...' : 'SAVE_CHANGES'}</span>
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Tabs */}
                    <div className="lg:col-span-1 space-y-2">
                        {tabs.map(tab => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 text-xs font-mono tracking-wider transition-all border-l-2 text-left group",
                                        isActive
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-transparent text-primary/40 hover:text-primary/70 hover:bg-primary/5"
                                    )}
                                >
                                    <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-primary/40 group-hover:text-primary/70")} />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-3">
                        <div className="bg-black/40 border border-primary/20 p-6 backdrop-blur-sm min-h-[500px] relative">
                            {/* Content Decorators */}
                            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/50" />
                            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary/50" />
                            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary/50" />
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/50" />

                            {activeTab === 'general' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center gap-2 text-primary/50 border-b border-primary/10 pb-2 mb-6">
                                        <Settings className="w-4 h-4" />
                                        <span className="text-xs font-mono uppercase tracking-widest">Core_Parameters</span>
                                    </div>

                                    <FormGroup label="SIMULATION_TITLE">
                                        <Input value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                    </FormGroup>

                                    <FormGroup label="MISSION_BRIEF (Description)">
                                        <Textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} />
                                    </FormGroup>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormGroup label="WORLD_CONTEXT">
                                            <Textarea value={formData.background || ''} onChange={e => setFormData({ ...formData, background: e.target.value })} rows={8} />
                                        </FormGroup>
                                        <div className="space-y-6">
                                            <FormGroup label="PRIMARY_OBJECTIVE">
                                                <Textarea value={formData.objective || ''} onChange={e => setFormData({ ...formData, objective: e.target.value })} rows={3} />
                                            </FormGroup>
                                            <FormGroup label="OPERATIONAL_GUIDELINES">
                                                <Textarea value={formData.instructions || ''} onChange={e => setFormData({ ...formData, instructions: e.target.value })} rows={3} />
                                            </FormGroup>
                                        </div>
                                    </div>

                                    <FormGroup label="VISUAL_STYLE_PROMPT">
                                        <Input value={formData.imageStyle || ''} onChange={e => setFormData({ ...formData, imageStyle: e.target.value })} placeholder="e.g. moody cyberpunk, neon lights, rain" />
                                    </FormGroup>
                                </div>
                            )}

                            {activeTab === 'characters' && (
                                <ListEditor
                                    items={characters}
                                    setItems={setCharacters}
                                    title="ACTIVE_ROSTER"
                                    itemName="Unit"
                                    icon={Users}
                                    fields={[
                                        { key: 'name', label: 'UNIT_ID (Name)', type: 'text' },
                                        { key: 'description', label: 'PROFILE', type: 'textarea' },
                                        { key: 'appearance', label: 'VISUAL_DATA', type: 'textarea' }
                                    ]}
                                    newItem={{ name: 'New Unit', description: '', appearance: '', position: 0 }}
                                />
                            )}

                            {activeTab === 'npcs' && (
                                <ListEditor
                                    items={npcs}
                                    setItems={setNpcs}
                                    title="KNOWN_ENTITIES"
                                    itemName="Entity"
                                    icon={Users}
                                    fields={[
                                        { key: 'name', label: 'DESIGNATION', type: 'text' },
                                        { key: 'detail', label: 'INTEL', type: 'textarea' },
                                        { key: 'oneLiner', label: 'VOICE_SAMPLE', type: 'text' },
                                        { key: 'location', label: 'LAST_KNOWN_LOCATION', type: 'text' }
                                    ]}
                                    newItem={{ name: 'New Entity', detail: '', oneLiner: '', location: '', position: 0 }}
                                />
                            )}

                            {activeTab === 'lore' && (
                                <ListEditor
                                    items={lore}
                                    setItems={setLore}
                                    title="DATA_ARCHIVES"
                                    itemName="Entry"
                                    icon={Globe}
                                    fields={[
                                        { key: 'name', label: 'KEYWORD', type: 'text' },
                                        { key: 'content', label: 'DATA_CONTENT', type: 'textarea' }
                                    ]}
                                    newItem={{ name: 'New Keyword', content: '', position: 0 }}
                                />
                            )}

                            {activeTab === 'items' && (
                                <ListEditor
                                    items={items}
                                    setItems={setItems}
                                    title="ASSET_MANIFEST"
                                    itemName="Item"
                                    icon={Box}
                                    fields={[
                                        { key: 'name', label: 'ITEM_ID', type: 'text' },
                                        { key: 'initialValue', label: 'INITIAL_STATE', type: 'text' },
                                        { key: 'description', label: 'SPECIFICATIONS', type: 'text' }
                                    ]}
                                    newItem={{ name: 'Item', initialValue: '1', description: '', position: 0 }}
                                />
                            )}

                            {activeTab === 'triggers' && (
                                <ListEditor
                                    items={triggers}
                                    setItems={setTriggers}
                                    title="EVENT_TRIGGERS"
                                    itemName="Trigger"
                                    icon={Zap}
                                    fields={[
                                        { key: 'name', label: 'EVENT_ID', type: 'text' },
                                        { key: 'triggerOnTurn', label: 'SEQUENCE_STEP', type: 'number' },
                                        { key: 'effect', label: 'EXECUTION_INSTRUCTION', type: 'textarea' },
                                        { key: 'condition', label: 'CONDITION_LOGIC', type: 'text' }
                                    ]}
                                    newItem={{ name: 'Event', triggerOnTurn: 1, effect: '', condition: '', position: 0 }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Helper Components

function FormGroup({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase text-primary/60 tracking-wider flex items-center gap-2">
                <span className="w-1 h-1 bg-primary/40 rounded-full" />
                {label}
            </label>
            {children}
        </div>
    )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            className="w-full bg-black/50 border border-primary/20 text-primary placeholder:text-primary/20 p-3 font-mono text-sm focus:outline-none focus:border-primary/60 focus:bg-primary/5 transition-all"
        />
    )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea
            {...props}
            className="w-full bg-black/50 border border-primary/20 text-primary placeholder:text-primary/20 p-3 font-mono text-sm focus:outline-none focus:border-primary/60 focus:bg-primary/5 transition-all resize-y min-h-[100px]"
        />
    )
}

function ListEditor({ items, setItems, title, itemName, icon: Icon, fields, newItem }: any) {
    const add = () => {
        setItems([...items, { ...newItem, id: undefined }]) // No ID means new
    }

    const remove = (index: number) => {
        const newItems = [...items]
        newItems.splice(index, 1)
        setItems(newItems)
    }

    const update = (index: number, key: string, value: any) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [key]: value }
        setItems(newItems)
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center border-b border-primary/10 pb-2 mb-6">
                <div className="flex items-center gap-2 text-primary/50">
                    {Icon && <Icon className="w-4 h-4" />}
                    <span className="text-xs font-mono uppercase tracking-widest">{title}</span>
                </div>
                <button
                    onClick={add}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-mono uppercase tracking-wider transition-colors"
                >
                    <Plus className="h-3 w-3" /> ADD_{itemName.toUpperCase()}
                </button>
            </div>

            <div className="space-y-4">
                {items.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 border border-dashed border-primary/20 bg-primary/5 text-primary/30 gap-4">
                        <Box className="w-8 h-8 opacity-50" />
                        <div className="text-xs font-mono uppercase tracking-widest">No_Data_Found</div>
                    </div>
                )}

                {items.map((item: any, index: number) => (
                    <div key={index} className="border border-primary/20 bg-black/20 hover:border-primary/40 transition-colors relative group">
                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => remove(index)} className="text-red-500/50 hover:text-red-500 transition-colors p-1">
                                <Trash className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="p-2 border-b border-primary/10 bg-primary/5 flex items-center gap-2">
                            <span className="text-[10px] font-mono text-primary/40">#{String(index + 1).padStart(2, '0')}</span>
                            <span className="font-orbitron text-xs text-primary/80">{item.name || 'UNTITLED_UNIT'}</span>
                        </div>

                        <div className="p-4 space-y-4">
                            {fields.map((field: any) => (
                                <FormGroup key={field.key} label={field.label}>
                                    {field.type === 'textarea' ? (
                                        <Textarea value={item[field.key] || ''} onChange={e => update(index, field.key, e.target.value)} rows={3} />
                                    ) : (
                                        <Input type={field.type} value={item[field.key] || ''} onChange={e => update(index, field.key, e.target.value)} />
                                    )}
                                </FormGroup>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
