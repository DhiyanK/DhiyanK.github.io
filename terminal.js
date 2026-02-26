"use strict";

const THEME_KEY = "theme";
const THEMES = Object.freeze({
    HACKER: "hacker",
    PROFESSIONAL: "professional",
    LEGACY_LIGHT: "light"
});

const NAV_TARGETS = Object.freeze(["home", "about", "projects", "certs", "contact"]);
const PAGE_MAP = Object.freeze({
    home: "index.html",
    about: "about.html",
    projects: "projects.html",
    certs: "certs.html",
    contact: "contact.html"
});

const COMMANDS = Object.freeze(["help", "ls", "cd", "whoami", "date", "clear"]);
const CD_ALIASES = Object.freeze(["~", "/", ".."]);
const MAX_COMMAND_LENGTH = 200;

document.addEventListener("DOMContentLoaded", () => {
    initializeThemeToggle();
    initializeTerminal();
});

function initializeThemeToggle() {
    const button = document.getElementById("themeToggle");
    const storedTheme = getStoredTheme();
    const initialTheme = resolveInitialTheme(storedTheme);

    applyTheme(initialTheme, button);

    if (!button) {
        return;
    }

    button.addEventListener("click", () => {
        const isProfessional = document.body.classList.contains("professional-theme");
        const nextTheme = isProfessional ? THEMES.HACKER : THEMES.PROFESSIONAL;
        applyTheme(nextTheme, button);
        setStoredTheme(nextTheme);
    });
}

function resolveInitialTheme(rawTheme) {
    if (rawTheme === THEMES.PROFESSIONAL || rawTheme === THEMES.LEGACY_LIGHT) {
        return THEMES.PROFESSIONAL;
    }

    if (rawTheme === THEMES.HACKER) {
        return THEMES.HACKER;
    }

    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
        return THEMES.PROFESSIONAL;
    }

    return THEMES.HACKER;
}

function applyTheme(theme, button) {
    const isProfessional = theme === THEMES.PROFESSIONAL;
    document.body.classList.toggle("professional-theme", isProfessional);
    document.body.classList.remove("light-theme");

    if (!button) {
        return;
    }

    button.textContent = isProfessional ? "Dark Mode" : "Light Mode";
    button.setAttribute(
        "aria-label",
        isProfessional ? "Switch to dark mode" : "Switch to light mode"
    );
    button.setAttribute("aria-pressed", String(isProfessional));
}

function getStoredTheme() {
    try {
        return localStorage.getItem(THEME_KEY);
    } catch (error) {
        return null;
    }
}

function setStoredTheme(theme) {
    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
        // Storage can fail in private contexts; no action required.
    }
}

function initializeTerminal() {
    const mainTerminal = document.querySelector("main .terminal-window");
    if (!mainTerminal || mainTerminal.querySelector(".interactive-terminal")) {
        return;
    }

    cleanupLegacyCursors(mainTerminal);

    const terminalUI = buildTerminalUI();
    mainTerminal.appendChild(terminalUI.container);

    const currentPage = getCurrentPage();
    const history = [];
    let historyIndex = -1;

    mainTerminal.addEventListener("click", () => {
        if (window.getSelection().toString() === "") {
            terminalUI.input.focus();
        }
    });

    terminalUI.input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            handleEnter();
            return;
        }

        if (event.key === "Tab") {
            event.preventDefault();
            handleAutocomplete(terminalUI.input, terminalUI.historyContainer);
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            if (history.length === 0) {
                return;
            }
            if (historyIndex < history.length - 1) {
                historyIndex += 1;
            }
            terminalUI.input.value = history[historyIndex];
            placeCursorAtEnd(terminalUI.input);
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            if (historyIndex <= 0) {
                historyIndex = -1;
                terminalUI.input.value = "";
                return;
            }

            historyIndex -= 1;
            terminalUI.input.value = history[historyIndex] || "";
            placeCursorAtEnd(terminalUI.input);
        }
    });

    function handleEnter() {
        const rawInput = terminalUI.input.value;
        const commandText = rawInput.trim();
        terminalUI.input.value = "";

        if (commandText === "") {
            return;
        }

        appendCommandEcho(terminalUI.historyContainer, commandText);
        history.unshift(commandText);
        if (history.length > 100) {
            history.pop();
        }
        historyIndex = -1;

        if (commandText.length > MAX_COMMAND_LENGTH) {
            appendOutput(
                terminalUI.historyContainer,
                ["Input too long. Keep commands below 200 characters."],
                true
            );
            return;
        }

        if (/[^\x20-\x7E]/.test(commandText)) {
            appendOutput(
                terminalUI.historyContainer,
                ["Unsupported control characters detected in input."],
                true
            );
            return;
        }

        const args = commandText.split(/\s+/).filter(Boolean);
        const command = (args[0] || "").toLowerCase();

        switch (command) {
            case "help":
                appendOutput(terminalUI.historyContainer, [
                    "Available commands:",
                    "  help           Show command list",
                    "  ls             List site directories",
                    "  cd <dir>       Navigate to page (home/about/projects/certs/contact)",
                    "  whoami         Show current user",
                    "  date           Show local date and time",
                    "  clear          Clear terminal output",
                    "Tips: Use TAB for autocomplete and arrows for command history."
                ]);
                break;
            case "ls":
                appendOutput(terminalUI.historyContainer, [
                    "home/  about/  projects/  certs/  contact/",
                    "Use: cd <dir>"
                ]);
                break;
            case "whoami":
                appendOutput(terminalUI.historyContainer, ["root (Administrator Access)"]);
                break;
            case "date":
                appendOutput(terminalUI.historyContainer, [new Date().toString()]);
                break;
            case "clear":
                terminalUI.historyContainer.textContent = "";
                break;
            case "cd":
                handleCd(args[1] || "");
                break;
            default:
                appendOutput(
                    terminalUI.historyContainer,
                    [`bash: ${command}: command not found. Type 'help'.`],
                    true
                );
                break;
        }
    }

    function handleCd(rawTarget) {
        const normalized = normalizeTarget(rawTarget);

        if (normalized === "" || normalized === "~" || normalized === "/" || normalized === "..") {
            if (currentPage === "home") {
                appendOutput(terminalUI.historyContainer, ["Already at /home"]);
                return;
            }
            appendOutput(terminalUI.historyContainer, ["Navigating to /home..."]);
            document.body.classList.add("fade-out");
            window.setTimeout(() => window.location.assign(PAGE_MAP.home), 280);
            return;
        }

        if (!NAV_TARGETS.includes(normalized)) {
            appendOutput(terminalUI.historyContainer, [`cd: ${rawTarget}: No such directory`], true);
            return;
        }

        if (normalized === currentPage) {
            appendOutput(terminalUI.historyContainer, [`Already at /${normalized}`]);
            return;
        }

        appendOutput(terminalUI.historyContainer, [`Navigating to /${normalized}...`]);
        document.body.classList.add("fade-out");
        window.setTimeout(() => window.location.assign(PAGE_MAP[normalized]), 280);
    }
}

function cleanupLegacyCursors(mainTerminal) {
    const cursorElements = mainTerminal.querySelectorAll(".cursor");
    cursorElements.forEach((element) => {
        const parent = element.closest("p");
        if (!parent) {
            element.remove();
            return;
        }

        if (parent.textContent.trim() === "") {
            parent.remove();
            return;
        }

        element.remove();
    });
}

function buildTerminalUI() {
    const container = document.createElement("div");
    container.className = "interactive-terminal";

    const historyContainer = document.createElement("div");
    historyContainer.id = "terminal-history";
    historyContainer.setAttribute("aria-live", "polite");

    const commandLine = document.createElement("div");
    commandLine.className = "command-line";

    const prompt = document.createElement("span");
    prompt.className = "prompt";

    const input = document.createElement("input");
    input.type = "text";
    input.id = "terminal-input";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.placeholder = "Type 'help'. Press TAB for autocomplete.";
    input.maxLength = MAX_COMMAND_LENGTH;

    const cursor = document.createElement("span");
    cursor.className = "cursor active-cursor";

    const helper = document.createElement("div");
    helper.className = "helper-text";
    helper.textContent = "[Hint: Type commands or use the navigation menu above]";

    commandLine.appendChild(prompt);
    commandLine.appendChild(input);
    commandLine.appendChild(cursor);

    container.appendChild(historyContainer);
    container.appendChild(commandLine);
    container.appendChild(helper);

    return {
        container,
        historyContainer,
        input
    };
}

function handleAutocomplete(input, historyContainer) {
    const value = input.value;
    const caret = input.selectionStart ?? value.length;
    const leftOfCaret = value.slice(0, caret);
    const rightOfCaret = value.slice(caret);

    if (/\s/.test(rightOfCaret)) {
        return;
    }

    const cdMatch = leftOfCaret.match(/^(\s*cd\s+)([^\s]*)$/i);
    if (cdMatch) {
        const prefix = cdMatch[1];
        const partial = cdMatch[2].toLowerCase();
        const candidates = [...NAV_TARGETS, ...CD_ALIASES].filter((item) => item.startsWith(partial));
        applyCompletion(input, historyContainer, prefix, partial, candidates);
        return;
    }

    const commandMatch = leftOfCaret.match(/^(\s*)([^\s]*)$/);
    if (!commandMatch) {
        return;
    }

    const prefix = commandMatch[1];
    const partial = commandMatch[2].toLowerCase();
    const candidates = COMMANDS.filter((item) => item.startsWith(partial));
    applyCompletion(input, historyContainer, prefix, partial, candidates);
}

function applyCompletion(input, historyContainer, prefix, partial, candidates) {
    if (candidates.length === 0) {
        return;
    }

    if (candidates.length === 1) {
        input.value = `${prefix}${candidates[0]} `;
        placeCursorAtEnd(input);
        return;
    }

    const prefixMatch = commonPrefix(candidates);
    if (prefixMatch.length > partial.length) {
        input.value = `${prefix}${prefixMatch}`;
        placeCursorAtEnd(input);
        return;
    }

    appendOutput(historyContainer, [`Suggestions: ${candidates.join("  ")}`]);
}

function appendCommandEcho(historyContainer, commandText) {
    const line = document.createElement("p");
    const prompt = document.createElement("span");
    prompt.className = "prompt";

    const command = document.createElement("span");
    command.className = "cmd";
    command.textContent = commandText;

    line.appendChild(prompt);
    line.appendChild(command);
    historyContainer.appendChild(line);
}

function appendOutput(historyContainer, lines, isError = false) {
    const wrapper = document.createElement("div");
    wrapper.className = isError ? "cmd-output cmd-output-error" : "cmd-output";

    lines.forEach((lineText) => {
        const row = document.createElement("div");
        row.textContent = lineText;
        wrapper.appendChild(row);
    });

    historyContainer.appendChild(wrapper);
    window.scrollTo(0, document.body.scrollHeight);
}

function getCurrentPage() {
    const path = window.location.pathname || "";
    const file = path.split("/").pop() || PAGE_MAP.home;
    const cleanFile = file.split("?")[0].split("#")[0].toLowerCase();

    if (cleanFile === PAGE_MAP.home) {
        return "home";
    }

    const page = cleanFile.replace(".html", "");
    return NAV_TARGETS.includes(page) ? page : "home";
}

function normalizeTarget(target) {
    return String(target || "")
        .trim()
        .toLowerCase()
        .replace(/^\.?\//, "")
        .replace(/\/+$/, "");
}

function commonPrefix(values) {
    if (values.length === 0) {
        return "";
    }

    let prefix = values[0];
    for (let index = 1; index < values.length; index += 1) {
        while (!values[index].startsWith(prefix) && prefix.length > 0) {
            prefix = prefix.slice(0, -1);
        }
    }
    return prefix;
}

function placeCursorAtEnd(input) {
    const end = input.value.length;
    input.setSelectionRange(end, end);
}
