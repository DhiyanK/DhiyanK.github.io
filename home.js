document.addEventListener("DOMContentLoaded", () => {
    const timeElement = document.getElementById("time");
    if (timeElement) {
        const updateClock = () => {
            const now = new Date();
            timeElement.textContent = now.toISOString();
        };

        updateClock();
        window.setInterval(updateClock, 1000);
    }

    const profileImage = document.getElementById("profileImage");
    if (profileImage) {
        profileImage.addEventListener(
            "animationend",
            () => {
                profileImage.classList.add("loaded");
            },
            { once: true }
        );
    }
});
