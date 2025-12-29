import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useGame, useUpdateGame } from '@packages/ui-logic'
import { Button } from '@/components/ui/8bit/button'
import { Card, CardHeader, CardContent } from '@/components/ui/8bit/card'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Save, Plus, Trash } from 'lucide-react'

export const Route = createFileRoute('/games/$id/edit')({
    component: EditGame,
})

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

            // Load nested data if available (must be typed as any if not in Game interface yet, but backend sends it)
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
            alert('Game saved!')
        } catch (e) {
            console.error(e)
            alert('Failed to save game')
        }
    }

    if (isLoading) return <div className="p-8 font-retro text-center">LOADING...</div>
    if (!game) return <div className="p-8 font-retro text-center">GAME NOT FOUND</div>

    // Ownership check could be here but API handles it

    return (
        <div className="min-h-screen p-4 md:p-8 pb-20">
            <header className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/games/mine">
                        <Button variant="outline" size="icon">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-2xl font-retro text-[var(--8bit-primary)]">
                            EDIT: {game.title}
                        </h1>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={updateGame.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    <span className="text-xs">{updateGame.isPending ? 'SAVING...' : 'SAVE GAME'}</span>
                </Button>
            </header>

            {/* Tabs */}
            <div className="flex overflow-x-auto gap-2 mb-6 border-b-4 border-[var(--8bit-border)] pb-2 no-scrollbar">
                {['general', 'characters', 'npcs', 'lore', 'items', 'triggers'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 font-retro text-xs whitespace-nowrap transition-colors ${activeTab === tab
                            ? 'bg-[var(--8bit-primary)] text-[var(--8bit-primary-foreground)]'
                            : 'bg-[var(--8bit-muted)] hover:bg-[var(--8bit-border)]'
                            }`}
                    >
                        {tab.toUpperCase()}
                    </button>
                ))}
            </div>

            <div className="max-w-4xl mx-auto">
                {activeTab === 'general' && (
                    <div className="space-y-4">
                        <FormGroup label="TITLE">
                            <Input value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                        </FormGroup>
                        <FormGroup label="DESCRIPTION">
                            <Textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} />
                        </FormGroup>
                        <FormGroup label="BACKGROUND / WORLD SETTING">
                            <Textarea value={formData.background || ''} onChange={e => setFormData({ ...formData, background: e.target.value })} rows={5} />
                        </FormGroup>
                        <FormGroup label="OBJECTIVE">
                            <Textarea value={formData.objective || ''} onChange={e => setFormData({ ...formData, objective: e.target.value })} rows={2} />
                        </FormGroup>
                        <FormGroup label="INSTRUCTIONS">
                            <Textarea value={formData.instructions || ''} onChange={e => setFormData({ ...formData, instructions: e.target.value })} rows={4} />
                        </FormGroup>
                        <FormGroup label="IMAGE STYLE">
                            <Input value={formData.imageStyle || ''} onChange={e => setFormData({ ...formData, imageStyle: e.target.value })} placeholder="e.g. pixel art, fantasy painting" />
                        </FormGroup>
                    </div>
                )}

                {/* Generic List Editor for other tabs */}
                {activeTab === 'characters' && (
                    <ListEditor
                        items={characters}
                        setItems={setCharacters}
                        title="CHARACTERS"
                        itemName="Character"
                        fields={[
                            { key: 'name', label: 'NAME', type: 'text' },
                            { key: 'description', label: 'DESCRIPTION', type: 'textarea' },
                            { key: 'appearance', label: 'APPEARANCE (Visuals)', type: 'textarea' }
                        ]}
                        newItem={{ name: 'New Character', description: '', appearance: '', position: 0 }}
                    />
                )}

                {activeTab === 'npcs' && (
                    <ListEditor
                        items={npcs}
                        setItems={setNpcs}
                        title="NPCs"
                        itemName="NPC"
                        fields={[
                            { key: 'name', label: 'NAME', type: 'text' },
                            { key: 'detail', label: 'DETAIL', type: 'textarea' },
                            { key: 'oneLiner', label: 'ONE LINER', type: 'text' },
                            { key: 'location', label: 'LOCATION', type: 'text' }
                        ]}
                        newItem={{ name: 'New NPC', detail: '', oneLiner: '', location: '', position: 0 }}
                    />
                )}

                {activeTab === 'lore' && (
                    <ListEditor
                        items={lore}
                        setItems={setLore}
                        title="LOREBOOK ENTRIES"
                        itemName="Entry"
                        fields={[
                            { key: 'name', label: 'KEY (Term)', type: 'text' },
                            { key: 'content', label: 'CONTENT', type: 'textarea' }
                        ]}
                        newItem={{ name: 'New Lore', content: '', position: 0 }}
                    />
                )}

                {activeTab === 'items' && (
                    <ListEditor
                        items={items}
                        setItems={setItems}
                        title="TRACKED ITEMS"
                        itemName="Item"
                        fields={[
                            { key: 'name', label: 'NAME', type: 'text' },
                            { key: 'initialValue', label: 'INITIAL VALUE', type: 'text' },
                            { key: 'description', label: 'DESCRIPTION', type: 'text' }
                        ]}
                        newItem={{ name: 'HP', initialValue: '100', description: 'Health Points', position: 0 }}
                    />
                )}

                {activeTab === 'triggers' && (
                    <ListEditor
                        items={triggers}
                        setItems={setTriggers}
                        title="TRIGGER EVENTS"
                        itemName="Event"
                        fields={[
                            { key: 'name', label: 'NAME', type: 'text' },
                            { key: 'triggerOnTurn', label: 'TURN #', type: 'number' },
                            { key: 'effect', label: 'EFFECT (Instruction)', type: 'textarea' },
                            { key: 'condition', label: 'CONDITION (Optimization)', type: 'text' }
                        ]}
                        newItem={{ name: 'Event', triggerOnTurn: 1, effect: '', condition: '', position: 0 }}
                    />
                )}
            </div>
        </div>
    )
}

// Helper Components

function FormGroup({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] font-retro uppercase text-[var(--8bit-muted-foreground)]">{label}</label>
            {children}
        </div>
    )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return <input {...props} className="w-full bg-[var(--8bit-background)] border-2 border-[var(--8bit-border)] p-2 font-retro text-xs focus:outline-none focus:border-[var(--8bit-primary)]" />
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea {...props} className="w-full bg-[var(--8bit-background)] border-2 border-[var(--8bit-border)] p-2 font-retro text-xs focus:outline-none focus:border-[var(--8bit-primary)]" />
}

function ListEditor({ items, setItems, title, itemName, fields, newItem }: any) {
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
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="font-retro text-sm">{title}</h2>
                <Button size="sm" onClick={add}>
                    <Plus className="h-3 w-3 mr-1" /> ADD {itemName.toUpperCase()}
                </Button>
            </div>

            <div className="space-y-4">
                {items.length === 0 && <div className="text-center py-8 text-[var(--8bit-muted-foreground)] font-retro text-xs">No items yet</div>}

                {items.map((item: any, index: number) => (
                    <Card key={index} className="border-2 border-[var(--8bit-border)] bg-[var(--8bit-card)]">
                        <CardHeader className="p-3 flex flex-row justify-between items-start bg-[var(--8bit-muted)]/50">
                            <span className="font-retro text-xs">#{index + 1} {item.name || 'Untitled'}</span>
                            <button onClick={() => remove(index)} className="text-[var(--8bit-destructive)] hover:text-red-600">
                                <Trash className="h-4 w-4" />
                            </button>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {fields.map((field: any) => (
                                <FormGroup key={field.key} label={field.label}>
                                    {field.type === 'textarea' ? (
                                        <Textarea value={item[field.key] || ''} onChange={e => update(index, field.key, e.target.value)} rows={3} />
                                    ) : (
                                        <Input type={field.type} value={item[field.key] || ''} onChange={e => update(index, field.key, e.target.value)} />
                                    )}
                                </FormGroup>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
