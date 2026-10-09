"use strict";

// Configuration
const DISCORD_USER_ID = "1008057534067773470";
const REFRESH_INTERVAL = 30000;

const API_URL =
    `https://api.lanyard.rest/v1/users/${encodeURIComponent(DISCORD_USER_ID)}`;

const $ = id => document.getElementById(id);

let isFetching = false;
let lastData = null;
let lastUpdatedAt = 0;
let spotifyTimer = null;
let spotifyTrackKey = "";

const statusNames = {
    online: "Online",
    idle: "Idle",
    dnd: "Do Not Disturb",
    offline: "Offline"
};

const badgeDefinitions = [
    [1 << 0, "Discord Staff"],
    [1 << 1, "Partner"],
    [1 << 2, "HypeSquad Events"],
    [1 << 3, "Bug Hunter"],
    [1 << 6, "House of Bravery"],
    [1 << 7, "House of Brilliance"],
    [1 << 8, "House of Balance"],
    [1 << 9, "Early Supporter"],
    [1 << 14, "Bug Hunter Level 2"],
    [1 << 16, "Verified Bot"],
    [1 << 17, "Early Verified Bot Developer"],
    [1 << 18, "Discord Moderator"],
    [1 << 22, "Active Developer"]
];

function makeElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) element.className = className;
    if (text !== undefined && text !== null) {
        element.textContent = String(text);
    }

    return element;
}

function safeImageUrl(value) {
    if (typeof value !== "string" || !value.trim()) return "";

    try {
        const url = new URL(value, location.href);

        if (url.protocol !== "https:" && url.protocol !== "http:") {
            return "";
        }

        return url.href;
    } catch {
        return "";
    }
}

function setImage(img, url) {
    const safeUrl = safeImageUrl(url);

    img.onerror = () => {
        img.onerror = null;
        img.removeAttribute("src");

        if (img.id === "decoration") {
            img.hidden = true;
        }
    };

    if (safeUrl) {
        img.src = safeUrl;
    } else {
        img.removeAttribute("src");

        if (img.id === "decoration") {
            img.hidden = true;
        }
    }
}

function avatarUrl(user) {
    if (!user?.id || !user?.avatar) return "";

    const extension = user.avatar.startsWith("a_") ? "gif" : "png";

    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=256`;
}

// Dynamically reads the decoration asset from Lanyard.
function getDecorationUrl(user) {
    const asset = user?.avatar_decoration_data?.asset;

    if (!asset || typeof asset !== "string") return "";

    return `https://cdn.discordapp.com/avatar-decoration-presets/${encodeURIComponent(asset)}.png?size=256`;
}

function formatTime(milliseconds) {
    const seconds = Math.max(0, Math.floor(milliseconds / 1000));
    const minutes = Math.floor(seconds / 60);

    return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function addBadge(text) {
    $("badges").append(makeElement("span", "badge", text));
}

function renderBadges(user) {
    const container = $("badges");
    container.replaceChildren();

    const flags = Number(user.public_flags) || 0;

    for (const [bit, name] of badgeDefinitions) {
        if ((flags & bit) !== 0) addBadge(name);
    }

    if (user.bot) addBadge("Bot");

    container.hidden = container.childElementCount === 0;
}

function snowflakeDate(id) {
    try {
        const timestamp = (BigInt(id) >> 22n) + 1420070400000n;
        return new Date(Number(timestamp)).toLocaleDateString();
    } catch {
        return "";
    }
}

function renderProfile(data) {
    const user = data.discord_user || {};

    $("username").textContent =
        user.global_name || user.display_name || user.username || "Unknown user";

    const username = user.username || "Unknown";
    const discriminator = user.discriminator;

    $("handle").textContent =
        discriminator && discriminator !== "0"
            ? `@${username} · ${discriminator}`
            : `@${username}`;

    const avatar = avatarUrl(user);

    setImage(
        $("avatar"),
        avatar || "https://cdn.discordapp.com/embed/avatars/0.png"
    );

    $("avatar").alt = `${username}'s Discord avatar`;

    // Decoration is refreshed whenever the profile data is refreshed.
    const decoration = getDecorationUrl(user);
    const decorationImage = $("decoration");

    if (decoration) {
        decorationImage.hidden = false;
        setImage(decorationImage, decoration);
    } else {
        decorationImage.hidden = true;
        decorationImage.removeAttribute("src");
    }

    renderBadges(user);
    renderStatus(data);

    if (user.id && user.banner) {
        const extension = user.banner.startsWith("a_") ? "gif" : "png";

        $("banner").style.backgroundImage =
            `url("https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${extension}?size=600")`;
    } else {
        $("banner").style.backgroundImage = "";
    }

    const rows = [
        ["User ID", user.id],
        ["Account created", user.id ? snowflakeDate(user.id) : ""],
        ["Public flags", user.public_flags],
        ["Premium type", user.premium_type]
    ];

    const info = $("infoList");
    info.replaceChildren();

    for (const [label, value] of rows) {
        if (value === undefined || value === null || value === "") continue;

        const row = makeElement("div", "info-row");
        row.append(
            makeElement("span", "info-label", label),
            makeElement("span", "info-value", value)
        );
        info.append(row);
    }
}

function renderStatus(data) {
    const status = Object.hasOwn(statusNames, data.discord_status)
        ? data.discord_status
        : "offline";

    $("statusText").textContent = statusNames[status];
    $("statusDot").className = `status-dot ${status}`;
    $("statusMiniDot").className = `mini-dot ${status}`;

    $("devices").hidden = false;

    const desktop = data.active_on_discord_desktop === true;
    const mobile = data.active_on_discord_mobile === true;

    $("desktopDevice").className = `device${desktop ? " active" : ""}`;
    $("mobileDevice").className = `device${mobile ? " active" : ""}`;

    $("desktopDevice").textContent = `${desktop ? "●" : "○"} Desktop`;
    $("mobileDevice").textContent = `${mobile ? "●" : "○"} Mobile`;
}

function renderKV(kv) {
    const section = $("kvSection");
    const container = $("kvList");

    container.replaceChildren();

    if (!kv || typeof kv !== "object" || Array.isArray(kv)) {
        section.hidden = true;
        return;
    }

    const entries = Object.entries(kv);
    section.hidden = entries.length === 0;

    for (const [key, value] of entries) {
        const displayValue =
            typeof value === "object" && value !== null
                ? JSON.stringify(value)
                : String(value ?? "");

        const row = makeElement("div", "info-row");

        row.append(
            makeElement("span", "info-label", key),
            makeElement("span", "info-value", displayValue)
        );

        container.append(row);
    }
}

function activityTypeName(activity) {
    switch (activity.type) {
        case 0: return "Playing";
        case 1: return "Streaming";
        case 2: return "Listening to";
        case 3: return "Watching";
        case 4: return "Custom status";
        case 5: return "Competing in";
        default: return "Activity";
    }
}

function activityAssetUrl(activity, asset) {
    if (!asset || typeof asset !== "string") return "";

    if (/^https?:\/\//i.test(asset)) {
        return safeImageUrl(asset);
    }

    if (asset.startsWith("mp:external/")) {
        const external = asset.slice("mp:external/".length);
        const slash = external.indexOf("/");

        if (slash >= 0) {
            try {
                return safeImageUrl(
                    decodeURIComponent(external.slice(slash + 1))
                );
            } catch {
                return "";
            }
        }
    }

    if (activity.application_id) {
        return `https://cdn.discordapp.com/app-assets/${encodeURIComponent(activity.application_id)}/${encodeURIComponent(asset)}.png`;
    }

    return "";
}

function renderActivities(activities) {
    const list = $("activityList");
    list.replaceChildren();

    const visible = Array.isArray(activities)
        ? activities.filter(activity =>
            activity &&
            typeof activity === "object" &&
            activity.type !== 4 &&
            activity.name !== "Spotify"
        )
        : [];

    if (!visible.length) {
        list.append(makeElement(
            "div",
            "empty",
            "Not doing anything right now."
        ));
        return;
    }

    for (const activity of visible) {
        const card = makeElement("article", "activity");
        const art = makeElement("div", "activity-art");
        const info = makeElement("div", "activity-info");

        const imageUrl = activityAssetUrl(
            activity,
            activity.assets?.large_image
        );

        if (imageUrl) {
            const image = document.createElement("img");
            image.alt = "";
            setImage(image, imageUrl);
            art.append(image);
        } else {
            art.textContent = activity.name?.charAt(0) || "◈";
        }

        info.append(makeElement(
            "div",
            "activity-name",
            `${activityTypeName(activity)} ${activity.name || "Unknown activity"}`
        ));

        if (activity.details) {
            info.append(makeElement(
                "div",
                "activity-detail",
                activity.details
            ));
        }

        if (activity.state) {
            info.append(makeElement(
                "div",
                "activity-state",
                activity.state
            ));
        }

        if (activity.timestamps?.start) {
            const time = makeElement("div", "activity-time");
            time.dataset.start = String(activity.timestamps.start);
            updateActivityTime(time);
            info.append(time);
        }

        const smallUrl = activityAssetUrl(
            activity,
            activity.assets?.small_image
        );

        if (smallUrl) {
            const small = document.createElement("img");
            small.alt = "";
            small.style.cssText =
                "width:20px;height:20px;object-fit:cover;border-radius:5px;margin-top:7px";
            setImage(small, smallUrl);
            info.append(small);
        }

        card.append(art, info);
        list.append(card);
    }
}

function updateActivityTime(element) {
    const start = Number(element.dataset.start);

    if (!Number.isFinite(start)) return;

    element.textContent =
        `Elapsed · ${formatTime(Math.max(0, Date.now() - start))}`;
}

function renderSpotify(spotify, listening) {
    const section = $("spotifySection");

    if (!listening || !spotify || !spotify.song) {
        section.hidden = true;
        spotifyTrackKey = "";

        if (spotifyTimer) {
            clearInterval(spotifyTimer);
            spotifyTimer = null;
        }

        return;
    }

    section.hidden = false;

    $("songArtist").textContent = spotify.artist || "Unknown artist";
    $("songAlbum").textContent = spotify.album || "";

    setImage($("albumArt"), spotify.album_art_url);
    $("albumArt").alt = `${spotify.album || spotify.song} album artwork`;

    const title = $("songTitle");
    title.replaceChildren();

    if (spotify.track_id) {
        const link = document.createElement("a");

        link.className = "spotify-link";
        link.href =
            `https://open.spotify.com/track/${encodeURIComponent(spotify.track_id)}`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = spotify.song;

        title.append(link);
    } else {
        title.textContent = spotify.song;
    }

    const start = Number(spotify.timestamps?.start);
    const end = Number(spotify.timestamps?.end);

    const validTimes =
        Number.isFinite(start) &&
        Number.isFinite(end) &&
        end > start;

    const key = [
        spotify.track_id || spotify.song,
        start,
        end
    ].join(":");

    if (key !== spotifyTrackKey) {
        spotifyTrackKey = key;

        if (spotifyTimer) clearInterval(spotifyTimer);

        spotifyTimer = setInterval(() => {
            if (lastData?.spotify) {
                updateSpotifyProgress(lastData.spotify);
            }
        }, 1000);
    }

    if (validTimes) {
        updateSpotifyProgress(spotify);
    } else {
        $("elapsed").textContent = "—";
        $("duration").textContent = "—";
        $("progressBar").style.width = "0%";
    }
}

function updateSpotifyProgress(spotify) {
    const start = Number(spotify?.timestamps?.start);
    const end = Number(spotify?.timestamps?.end);

    if (!Number.isFinite(start) ||
        !Number.isFinite(end) ||
        end <= start) {
        return;
    }

    const now = Math.min(Date.now(), end);
    const elapsed = Math.max(0, now - start);
    const duration = end - start;
    const progress = Math.min(100, elapsed / duration * 100);

    $("progressBar").style.width = `${progress}%`;
    $("elapsed").textContent = formatTime(elapsed);
    $("duration").textContent = formatTime(duration);
}

function setConnection(message, state = "") {
    $("connection").className = `connection ${state}`;
    $("connection").textContent = message;
}

function showError(message) {
    $("errorBox").hidden = false;
    $("errorBox").textContent = message;
    setConnection("Connection error", "error");
}

function clearError() {
    $("errorBox").hidden = true;
    $("errorBox").textContent = "";
}

function renderData(data) {
    renderProfile(data);
    renderSpotify(data.spotify, data.listening_to_spotify === true);
    renderActivities(data.activities);
    renderKV(data.kv);

    $("lastUpdated").textContent =
        `Updated ${new Date().toLocaleTimeString()}`;

    setConnection("Live · Lanyard");
}

async function fetchProfile() {
    if (isFetching) return;

    if (
        !/^\d{17,20}$/.test(DISCORD_USER_ID) ||
        DISCORD_USER_ID === "YOUR_DISCORD_USER_ID"
    ) {
        showError(
            "Enter your Discord User ID in DISCORD_USER_ID at the top of this script."
        );

        $("statusText").textContent = "Configuration required";

        $("activityList").replaceChildren(
            makeElement(
                "div",
                "empty",
                "Add your Discord User ID to load your profile."
            )
        );

        return;
    }

    isFetching = true;
    $("refreshButton").disabled = true;

    if (!lastData) {
        setConnection("Loading", "loading");
        $("statusText").textContent = "Connecting to Lanyard...";

        $("activityList").replaceChildren(
            makeElement("div", "empty", "Loading your Discord activities...")
        );
    }

    try {
        const response = await fetch(API_URL, {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store"
        });

        if (response.status === 429) {
            throw new Error(
                "Lanyard rate limit reached. Please wait before refreshing."
            );
        }

        if (!response.ok) {
            throw new Error(`The API returned HTTP ${response.status}.`);
        }

        const result = await response.json();

        if (!result || result.success !== true || !result.data) {
            throw new Error(
                result?.error?.message ||
                "Lanyard could not find this user. Check the ID and confirm the user is sharing data through Lanyard."
            );
        }

        if (!result.data.discord_user) {
            throw new Error(
                "The API response did not include Discord user information."
            );
        }

        lastData = result.data;
        lastUpdatedAt = Date.now();

        clearError();
        renderData(lastData);
    } catch (error) {
        showError(
            error instanceof Error
                ? error.message
                : "An unexpected error occurred while loading the profile."
        );

        if (!lastData) {
            $("statusText").textContent = "Unable to load profile";

            $("activityList").replaceChildren(
                makeElement(
                    "div",
                    "empty",
                    "Profile data is currently unavailable."
                )
            );
        }
    } finally {
        isFetching = false;
        $("refreshButton").disabled = false;
    }
}

$("refreshButton").addEventListener("click", fetchProfile);

setInterval(() => {
    if (!document.hidden && !isFetching) {
        fetchProfile();
    }
}, REFRESH_INTERVAL);

setInterval(() => {
    document.querySelectorAll(".activity-time").forEach(updateActivityTime);
}, 1000);

document.addEventListener("visibilitychange", () => {
    if (
        !document.hidden &&
        Date.now() - lastUpdatedAt >= REFRESH_INTERVAL
    ) {
        fetchProfile();
    }
});

fetchProfile();