import { useEffect, useRef, useState, useCallback } from "react";
import { GameClient } from "../game/GameClient";
import type { WebSocketResponse, CharacterStateSnapshot } from "../game/types";

export interface UseGameSessionProps {
    url: string;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: unknown) => void;
}

export function useGameSession({ url, onConnect, onDisconnect, onError }: UseGameSessionProps) {
    const clientRef = useRef<GameClient | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string; id: string; sceneImageKey?: string }[]>([]);
    const [characterState, setCharacterState] = useState<CharacterStateSnapshot | null>(null);
    const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
    const [currentTurn, setCurrentTurn] = useState(0);

    const handleMessage = useCallback((response: WebSocketResponse) => {
        switch (response.type) {
            case "response":
                setIsTyping(false);
                setMessages(prev => [
                    ...prev,
                    {
                        role: "assistant",
                        content: response.text,
                        id: `turn-${response.turnNumber}-assistant`,
                        sceneImageKey: response.sceneImageKey
                    }
                ]);
                setSuggestedActions(response.suggestedActions);
                setCharacterState(response.characterState);
                setCurrentTurn(response.turnNumber);
                break;

            case "state":
                setCurrentTurn(response.currentTurn);
                setCharacterState(response.characterState || null);
                if (response.recentTurns) {
                    const history = response.recentTurns.flatMap((turn): { role: "user" | "assistant"; content: string; id: string; sceneImageKey?: string }[] => [
                        { role: "user", content: turn.userMessage, id: `turn-${turn.turnNumber}-user` },
                        { role: "assistant", content: turn.assistantResponse, id: `turn-${turn.turnNumber}-assistant`, sceneImageKey: turn.sceneImageKey }
                    ]);
                    setMessages(history);
                    // If we have recent turns, set the suggestions from the last one if available? 
                    // The API state doesn't return suggestions for past turns explicitly in the generic list, 
                    // but we might want to grabbing them if we are resuming. 
                    // For now, let's leave suggestions empty on resume until the user acts or we add it to the state API.
                    if (response.recentTurns.length > 0) {
                        const lastTurn = response.recentTurns[response.recentTurns.length - 1];
                        setSuggestedActions(lastTurn.suggestedActions || []);
                    }
                }
                break;

            case "turns":
                // Handle full history if needed
                break;

            case "error":
                setIsTyping(false);
                console.error("Game Session Error:", response.message);
                onError?.(response.message);
                break;
        }
    }, [onError]);

    useEffect(() => {
        if (!url) return;

        const client = new GameClient({
            url,
            onOpen: () => {
                setIsConnected(true);
                onConnect?.();
                // Request initial state
                client.send("get_state");
            },
            onClose: () => {
                setIsConnected(false);
                onDisconnect?.();
            },
            onError: (e) => {
                // WebSocket errors are often generic events, not much detail
                onError?.(e);
            },
            onMessage: handleMessage
        });

        client.connect();
        clientRef.current = client;

        return () => {
            client.cleanup();
            clientRef.current = null;
        };
    }, [url, handleMessage, onConnect, onDisconnect, onError]);

    const sendTurn = useCallback((message: string) => {
        if (!clientRef.current || !isConnected) return;

        // Optimistic update
        setMessages(prev => [...prev, { role: "user", content: message, id: `temp-${Date.now()}` }]);
        setIsTyping(true);
        setSuggestedActions([]); // Clear suggestions while waiting

        clientRef.current.sendTurn(message);
    }, [isConnected]);

    return {
        isConnected,
        isTyping,
        messages,
        characterState,
        suggestedActions,
        currentTurn,
        sendTurn
    };
}
