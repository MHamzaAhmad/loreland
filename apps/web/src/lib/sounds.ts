export const sounds = {
    open: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Sci-fi opening
    close: 'https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3', // Sci-fi closing
    hover: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // UI beep
    click: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3', // Tech click
    glitch: 'https://assets.mixkit.co/active_storage/sfx/2567/2567-preview.mp3', // Glitch effect
};

class SoundService {
    private audioContext: AudioContext | null = null;
    private buffers: Map<string, AudioBuffer> = new Map();

    private async init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    async play(soundName: keyof typeof sounds) {
        try {
            await this.init();
            if (!this.audioContext) return;

            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            let buffer = this.buffers.get(soundName);
            if (!buffer) {
                const response = await fetch(sounds[soundName]);
                const arrayBuffer = await response.arrayBuffer();
                buffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.buffers.set(soundName, buffer);
            }

            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(this.audioContext.destination);
            source.start(0);
        } catch (error) {
            console.warn('Failed to play sound:', error);
        }
    }
}

export const soundService = new SoundService();
