import { type WebSocketMessage, type WebSocketResponse, type GameClientConfig } from "./types";

export class GameClient {
    private ws: WebSocket | null = null;
    private config: GameClientConfig;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private shouldReconnect = true;

    constructor(config: GameClientConfig) {
        this.config = config;
    }

    public connect() {
        if (this.ws?.readyState === WebSocket.OPEN) return;

        this.shouldReconnect = true;
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
            console.log("Connected to Game Session");
            this.reconnectAttempts = 0;
            this.config.onOpen?.();
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as WebSocketResponse;
                this.config.onMessage?.(data);
            } catch (error) {
                console.error("Failed to parse WebSocket message:", error);
            }
        };

        this.ws.onerror = (event) => {
            console.error("WebSocket error:", event);
            this.config.onError?.(event);
        };

        this.ws.onclose = () => {
            console.log("WebSocket connection closed");
            this.config.onClose?.();
            this.handleReconnect();
        };
    }

    public disconnect() {
        this.shouldReconnect = false;
        this.ws?.close();
        this.ws = null;
    }

    public send(type: WebSocketMessage["type"], message?: string) {
        if (this.ws?.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket is not open. Cannot send message.");
            return;
        }

        const payload = JSON.stringify({ type, message });
        this.ws.send(payload);
    }

    public sendTurn(message: string) {
        this.send("turn", message);
    }

    public cleanup() {
        this.disconnect();
        // Remove all listeners/references if needed
    }

    private handleReconnect() {
        if (!this.shouldReconnect || this.reconnectAttempts >= this.maxReconnectAttempts) return;

        const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts);
        this.reconnectAttempts++;

        console.log(`Attempting to reconnect in ${delay}ms... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            this.connect();
        }, delay);
    }
}
