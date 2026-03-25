document.addEventListener("DOMContentLoaded", () => {
    initializeClock();
    initializeProfileImage();
    initializeTypedRole();
});

function initializeClock() {
    const timeElement = document.getElementById("time");
    if (!timeElement) {
        return;
    }

    const updateClock = () => {
        const now = new Date();
        timeElement.textContent = now.toISOString();
    };

    updateClock();
    window.setInterval(updateClock, 1000);
}

function initializeProfileImage() {
    const profileImage = document.getElementById("profileImage");
    if (!profileImage) {
        return;
    }

    profileImage.addEventListener(
        "animationend",
        () => {
            profileImage.classList.add("loaded");
        },
        { once: true }
    );
}

function initializeTypedRole() {
    const typedRole = document.getElementById("typedRole");
    if (!typedRole) {
        return;
    }

    const fullText = typedRole.dataset.role || "";
    if (fullText === "") {
        return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
        typedRole.textContent = fullText;
        return;
    }

    let index = 0;

    const typeNextCharacter = () => {
        typedRole.textContent = fullText.slice(0, index);

        if (index >= fullText.length) {
            return;
        }

        index += 1;
        window.setTimeout(typeNextCharacter, index < 10 ? 60 : 42);
    };

    window.setTimeout(typeNextCharacter, 180);
}