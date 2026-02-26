document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("matrix");
    if (!canvas) {
        return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
        return;
    }

    const prefersReducedMotion = window.matchMedia
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
        return;
    }

    const characters = "01010100110101ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"'&_(),.;:?!\\|{}<>[]^~";
    const fontSize = 16;
    let columns = 0;
    let drops = [];

    const resizeCanvas = () => {
        canvas.height = window.innerHeight;
        canvas.width = window.innerWidth;
        columns = Math.ceil(canvas.width / fontSize);
        drops = Array.from({ length: columns }, () => 1);
    };

    const draw = () => {
        if (document.body.classList.contains("professional-theme")) {
            return;
        }

        context.fillStyle = "rgba(2, 6, 23, 0.08)";
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = "#16a34a";
        context.font = `${fontSize}px monospace`;

        for (let index = 0; index < drops.length; index += 1) {
            const glyph = characters[Math.floor(Math.random() * characters.length)];
            context.fillText(glyph, index * fontSize, drops[index] * fontSize);

            if (drops[index] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[index] = 0;
            }

            drops[index] += 1;
        }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.setInterval(draw, 35);
});
