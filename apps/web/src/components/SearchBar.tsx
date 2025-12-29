import { useState, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'
import { Input } from './ui/8bit/input'

interface SearchBarProps {
    onSearch: (query: string) => void
    placeholder?: string
    debounceMs?: number
}

export function SearchBar({
    onSearch,
    placeholder = "Search games...",
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
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--8bit-muted-foreground)]" />
            <Input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="pl-10 text-xs"
            />
        </div>
    )
}
