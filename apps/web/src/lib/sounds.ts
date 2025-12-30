export const sounds = {
    open: 'https://res.cloudinary.com/dzvygdpmu/video/upload/v1767097304/loreland/audio/mixkit-technology-transition-slide-3120_faslfe.wav', // Sci-fi opening
    close: 'https://res.cloudinary.com/dzvygdpmu/video/upload/v1767097304/loreland/audio/mixkit-pot-lid-close-1802_sxuqry.wav', // Sci-fi closing
    hover: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // UI beep
    click: 'https://res.cloudinary.com/dzvygdpmu/video/upload/v1767096968/loreland/audio/mixkit-sci-fi-click-900_no63l2.wav', // Tech click
    glitch: 'https://assets.mixkit.co/active_storage/sfx/2567/2567-preview.mp3', // Glitch effect
    initializing: "https://res.cloudinary.com/dzvygdpmu/video/upload/v1767097322/loreland/audio/mixkit-cinematic-mystery-heartbeat-transition-492_qequtm.wav"
};

class SoundService {
    private audioContext: AudioContext | null = null;
    private buffers: Map<string, AudioBuffer> = new Map();

    private async init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    async play(soundName: keyof typeof sounds, options?: { loop?: boolean }) {
        try {
            await this.init();
            if (!this.audioContext) return { stop: () => { } };

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
            source.loop = options?.loop || false;
            source.connect(this.audioContext.destination);
            source.start(0);

            return {
                stop: () => {
                    try {
                        source.stop();
                    } catch (e) {
                        // Ignore if already stopped
                    }
                }
            };
        } catch (error) {
            console.warn('Failed to play sound:', error);
            return { stop: () => { } };
        }
    }
}

export const soundService = new SoundService();
