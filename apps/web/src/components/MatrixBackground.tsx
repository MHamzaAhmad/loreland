import { useEffect, useRef } from 'react';

export default function MatrixBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const columns = Math.floor(width / 20);
        const drops: number[] = new Array(columns).fill(0);

        // Matrix characters (bits and hex for a high-tech look)
        const charset = '01ABCDEF<>[]{}$%&';

        const draw = () => {
            // Semi-transparent black background to create a fading trail effect
            ctx.fillStyle = 'rgba(2, 2, 5, 0.1)';
            ctx.fillRect(0, 0, width, height);

            // Set text style
            ctx.font = '12px "Fira Code", monospace';

            for (let i = 0; i < drops.length; i++) {
                // Randomly pick a character
                const char = charset[Math.floor(Math.random() * charset.length)];

                // Intensity of the "glow"
                const opacity = Math.random() * 0.5 + 0.1;
                ctx.fillStyle = `rgba(0, 243, 255, ${opacity})`;

                // Draw character
                ctx.fillText(char, i * 20, drops[i] * 20);

                // Reset drop to top if it goes off screen, with random delay
                if (drops[i] * 20 > height && Math.random() > 0.98) {
                    drops[i] = 0;
                }

                // Increment Y position
                drops[i]++;
            }
        };

        const interval = setInterval(draw, 50);

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            const newColumns = Math.floor(width / 20);
            if (newColumns !== drops.length) {
                drops.length = newColumns;
                drops.fill(0);
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-[-1] pointer-events-none opacity-40"
        />
    );
}
