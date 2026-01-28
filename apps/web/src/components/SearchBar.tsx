import { useState, useEffect, useCallback } from 'react'
import { MagnifyingGlass, TerminalWindow } from '@phosphor-icons/react'
import { Input } from './ui/8bit/input'

interface SearchBarProps {
    onSearch: (query: string) => void
    placeholder?: string
    debounceMs?: number
}

export function SearchBar({
    onSearch,
    placeholder = "Search...",
    debounceMs = 300
}: SearchBarProps) {
    const [value, setValue] = useState('')

    const debouncedSearch = useCallback(() => {
        onSearch(value)
    }, [value, onSearch])

    useEffect(() => {
        const timeout = setTimeout(debouncedSearch, debounceMs)
        return () => clearTimeout(timeout)
    }, [value, debounceMs, debouncedSearch])

    return (
        <div className="relative w-full max-w-xl mx-auto">
            <div className="relative flex items-center group">
                <div className="absolute left-5 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <MagnifyingGlass size={20} weight="bold" />
                </div>

                <input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full h-14 pl-14 pr-4 rounded-xl bg-background border border-dashed border-border hover:border-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary/10 text-lg font-serif placeholder:font-sans placeholder:text-muted-foreground/50 transition-all outline-none shadow-sm"
                />

                {/* Optional: Add a subtle shortcut hint if desired, or keep it clean */}
            </div>
        </div>
    )
}
