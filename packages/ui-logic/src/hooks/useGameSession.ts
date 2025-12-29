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

    // Use refs for callbacks to avoid re-connecting when they change
    const callbacksRef = useRef({ onConnect, onDisconnect, onError });
    useEffect(() => {
        callbacksRef.current = { onConnect, onDisconnect, onError };
    }, [onConnect, onDisconnect, onError]);

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
                callbacksRef.current.onError?.(response.message);
                break;
        }
    }, []); // Check: handleMessage depends on state setters which are stable. Callbacks are via ref.

    useEffect(() => {
        if (!url) return;

        const client = new GameClient({
            url,
            onOpen: () => {
                setIsConnected(true);
                callbacksRef.current.onConnect?.();
                // Request initial state
                client.send("get_state");
            },
            onClose: () => {
                setIsConnected(false);
                callbacksRef.current.onDisconnect?.();
            },
            onError: (e) => {
                callbacksRef.current.onError?.(e);
            },
            onMessage: handleMessage
        });

        client.connect();
        clientRef.current = client;

        return () => {
            client.cleanup();
            clientRef.current = null;
        };
    }, [url, handleMessage]);

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
