import { useEffect, useRef, useState, useCallback } from "react";
import { GameClient } from "../game/GameClient";
import type { WebSocketResponse, CharacterStateSnapshot, GameStateItem } from "../game/types";

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

    // Core State: structured turn data instead of chat list
    const [currentTurnData, setCurrentTurnData] = useState<{
        turnNumber: number;
        narrative: string;
        sceneImageKey?: string;
        agentThought?: string;
    } | null>(null);

    const [characterState, setCharacterState] = useState<CharacterStateSnapshot | null>(null);
    const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
    const [allStates, setAllStates] = useState<GameStateItem[]>([]);

    // History handling
    const [history, setHistory] = useState<{ turnNumber: number; summary: string }[]>([]);

    // Track which turns have images loading
    const [imageLoadingTurns, setImageLoadingTurns] = useState<Set<number>>(new Set());

    // Credit tracking
    const [turnCost, setTurnCost] = useState<number | null>(null);
    const [currentBalance, setCurrentBalance] = useState<number | null>(null);

    // Use refs for callbacks to avoid re-connecting when they change
    const callbacksRef = useRef({ onConnect, onDisconnect, onError });
    useEffect(() => {
        callbacksRef.current = { onConnect, onDisconnect, onError };
    }, [onConnect, onDisconnect, onError]);

    // Store state in ref for reliable access in unstable callbacks without triggering reconnections
    const stateRef = useRef({ currentTurnData });
    useEffect(() => {
        stateRef.current = { currentTurnData };
    }, [currentTurnData]);

    const handleMessage = useCallback((response: WebSocketResponse) => {
        switch (response.type) {
            case "response":
                setIsTyping(false);
                setCurrentTurnData({
                    turnNumber: response.turnNumber,
                    narrative: response.text,
                    sceneImageKey: response.sceneImageKey,
                    // @ts-ignore
                    agentThought: response.agentThought
                });
                setSuggestedActions(response.suggestedActions);
                setCharacterState(response.characterState);
                setTurnCost(response.turnCost);
                setCurrentBalance(response.newBalance);
                if (response.allStates) {
                    setAllStates(response.allStates);
                }

                // Add *previous* turn to history if we just advanced
                const prevTurn = stateRef.current.currentTurnData;
                if (prevTurn && prevTurn.turnNumber < response.turnNumber) {
                    setHistory(prev => [...prev, { turnNumber: prevTurn.turnNumber, summary: "Turn completed" }]);
                }
                break;

            case "state":
                setCurrentTurnData({
                    turnNumber: response.currentTurn,
                    narrative: response.recentTurns?.[response.recentTurns.length - 1]?.assistantResponse || "",
                    sceneImageKey: response.recentTurns?.[response.recentTurns.length - 1]?.sceneImageKey,
                });
                setCharacterState(response.characterState || null);
                if (response.allStates) {
                    setAllStates(response.allStates);
                }
                if (response.recentTurns && response.recentTurns.length > 0) {
                    const lastTurn = response.recentTurns[response.recentTurns.length - 1];
                    setSuggestedActions(lastTurn.suggestedActions || []);

                    setHistory(response.recentTurns.slice(0, -1).map(t => ({ turnNumber: t.turnNumber, summary: "Turn completed" })));
                } else {
                    setSuggestedActions([]);
                }
                break;

            case "turns":
                // Full history load if needed
                break;

            case "error":
                setIsTyping(false);
                console.error("Game Session Error:", response.message);
                callbacksRef.current.onError?.(response.message);
                break;

            case "turn_image_generating":
                // Mark this turn as loading an image
                setImageLoadingTurns(prev => new Set(prev).add(response.turnNumber));
                break;

            case "turn_image_ready":
                // Update the scene image and remove from loading set
                setImageLoadingTurns(prev => {
                    const next = new Set(prev);
                    next.delete(response.turnNumber);
                    return next;
                });
                // Update current turn data if this is the current turn
                setCurrentTurnData(prev => {
                    if (prev && prev.turnNumber === response.turnNumber) {
                        return { ...prev, sceneImageKey: response.sceneImageKey };
                    }
                    return prev;
                });
                break;

            case "turn_image_error":
                // Remove from loading set on error
                setImageLoadingTurns(prev => {
                    const next = new Set(prev);
                    next.delete(response.turnNumber);
                    return next;
                });
                console.warn("Image generation failed for turn", response.turnNumber, response.error);
                break;
        }
    }, []);

    useEffect(() => {
        if (!url) return;

        const client = new GameClient({
            url,
            onOpen: () => {
                setIsConnected(true);
                callbacksRef.current.onConnect?.();
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

        setIsTyping(true);
        // We don't optimistically update the immersive view, we wait for the result
        // But we could show the user's action in a "Pending" UI state if we wanted

        setSuggestedActions([]);
        clientRef.current.sendTurn(message);
    }, [isConnected]);

    const rewindToTurn = useCallback((turnNumber: number) => {
        // Logic to call API endpoint for rewind (since WS might not have it yet or we prefer REST for this atomic op)
        // For now, we assume using client.api or similar if available, or just fetch:
        const gameId = url.split("/games/")[1]?.split("/")[0];
        const sessionId = url.split("/play/")[1]?.split("/")[0];

        if (gameId && sessionId) {
            fetch(`/api/games/${gameId}/play/${sessionId}/rewind`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ turnNumber })
            }).then(res => res.json()).then(data => {
                const result = data as { success?: boolean };
                if (result.success && clientRef.current) {
                    // Refresh state
                    clientRef.current.send("get_state");
                }
            });
        }
    }, [url]);

    return {
        isConnected,
        isTyping,
        currentTurnData,
        characterState,
        suggestedActions,
        history,
        sendTurn,
        rewindToTurn,
        isImageLoading: currentTurnData ? imageLoadingTurns.has(currentTurnData.turnNumber) : false,
        turnCost,
        currentBalance,
        allStates,
    };
}
