// Using gist json data instead of local json data (easily editable)
const siteDataPath = "./assets/data.json"; // ./assets/data.json

document.addEventListener("DOMContentLoaded", async () => {
    // Background Audio
    bgAudio()
    
    // Animated Title
    AnimatedTitle()

    // Getting Site JSON data
    const tempNotify = document.getElementById("temp-notify");
    tempNotify.innerText = "Loading...";

    const siteData = await fetchSiteData();
    if (siteData) {
        tempNotify.style.display = "none";
    } else {
        tempNotify.innerText = "Error: Site data wasn't loaded, please try again!!";
        return;
    }

    const personalInfo = siteData.personalInfo;
    const buttonsData = siteData.buttonsData;

    // Setting favicon
    const favicon = document.createElement("link");
    favicon.rel = "shortcut icon";
    favicon.href = personalInfo.profilePhoto;
    document.head.append(favicon);

    // Setting Main UI
    const contentDiv = document.getElementById("content");

    // Profile Photo
    const profileContainer = document.createElement("div");
    profileContainer.classList.add("profileContainer");

    const profilePic = document.createElement("img");
    profilePic.classList.add("profilePic");
    profilePic.src = personalInfo.profilePhoto;

    const decoration = document.createElement("img");
    decoration.classList.add("profileDecoration");
    decoration.src = personalInfo.profileDecoration;

    profileContainer.append(profilePic, decoration);
    contentDiv.append(profileContainer);

    // Name
    const name = document.createElement("h1");
    name.innerHTML = personalInfo.name;
    contentDiv.append(name);

    // Bio
    const bio = document.createElement("p");
    bio.classList = "bio";
    bio.innerHTML = personalInfo.bio;
    contentDiv.append(bio);

    // Setting Buttons
    const linksDiv = document.createElement("div");
    linksDiv.classList = "linksDiv";

    for (const buttonInfo of Object.values(buttonsData)) {
        linksDiv.innerHTML += `
        <a href="${buttonInfo.url}" class="link">
            <div class="link-icon">
                <img class="social-icon" src="${buttonInfo.icon}" alt="">
            </div>
            <div class="link-text">${buttonInfo.title}</div>
        </a>
        `;
    }

    contentDiv.append(linksDiv);
    
    // Buttons Animation
    const buttons = document.querySelectorAll(".link");
    buttons.forEach((btn, i) => {
        btn.style.opacity = "0";
        btn.style.transform = "translateY(10px)";
        btn.style.animation = `fadeIn 0.3s ease forwards ${i * 0.1}s`;
    });

    // Setting Email
    const emailDiv = document.createElement("div");
    emailDiv.classList = "emailDiv";
    emailDiv.innerHTML = `<a href="mailto:${personalInfo.email}" class="email">${personalInfo.email}</a>`;
    contentDiv.append(emailDiv);
});

function AnimatedTitle() {
    const titles = [
        document.title,
        "Profile"
    ];
    let titleIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function typeTitle() {
        const current = titles[titleIndex];

        document.title = deleting
            ? current.substring(0, charIndex--) + "‫"
            : current.substring(0, charIndex++)+ "‫";

        if (!deleting && charIndex > current.length) {
            deleting = true;
            setTimeout(typeTitle, 1200);
            return;
        }

        if (deleting && charIndex < 0) {
            deleting = false;
            titleIndex = (titleIndex + 1) % titles.length;
            charIndex = 0;
        }

        setTimeout(typeTitle, deleting ? 60 : 120);
    }

    typeTitle();
}


function bgAudio() {
    const audio = document.getElementById("bg_audio");
    const canvas = document.getElementById("audio_visualizer");
    const ctx = canvas.getContext("2d");
    const enterScreen = document.getElementById("enter_screen");
    const toggle = document.getElementById("bg_audio_toggle");
    const icon = document.getElementById("audio_icon");

    let audioContext;
    let analyser;
    let source;
    let dataArray;
    let entered = false;
    let animationId;

    const speakerIcon = `
        <path d="M11 5 6 9H2v6h4l5 4V5Z"/>
        <path d="M15.5 8.5a5 5 0 0 1 0 7"/>
        <path d="M19 5a10 10 0 0 1 0 14"/>
    `;

    const mutedIcon = `
        <path d="M11 5 6 9H2v6h4l5 4V5Z"/>
        <path d="m17 9 5 6"/>
        <path d="m22 9-5 6"/>
    `;

    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;

        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;

        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    function setupAudioVisualizer() {
        if (audioContext) {
            if (audioContext.state === "suspended") {
                return audioContext.resume();
            }
            return Promise.resolve();
        }

        audioContext = new (window.AudioContext ||
            window.webkitAudioContext)();

        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.82;

        source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        dataArray = new Uint8Array(analyser.frequencyBinCount);

        drawVisualizer();

        return Promise.resolve();
    }

    function drawVisualizer() {
        animationId = requestAnimationFrame(drawVisualizer);

        const width = window.innerWidth;
        const height = window.innerHeight;

        ctx.clearRect(0, 0, width, height);

        if (!analyser || audio.paused || audio.muted) {
            return;
        }

        analyser.getByteFrequencyData(dataArray);

        const barCount = 64;
        const gap = 5;
        const slotWidth = width / barCount;
        const barWidth = Math.max(1, slotWidth - gap);

        ctx.shadowBlur = 12;
        ctx.shadowColor = "rgba(170, 40, 255, 0.5)";

        for (let i = 0; i < barCount; i++) {
            const index = Math.floor(
                i * dataArray.length / barCount
            );

            const value = dataArray[index] / 255;
            const barHeight = value * height * 0.22;
            const x = i * slotWidth;
            const y = height - barHeight;

            const gradient = ctx.createLinearGradient(
                0, y, 0, height
            );

            gradient.addColorStop(0, "rgba(190, 80, 255, 0.9)");
            gradient.addColorStop(1, "rgba(100, 0, 180, 0.08)");

            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth, barHeight);
        }

        ctx.shadowBlur = 0;
    }

    function updateAudioIcon() {
        icon.innerHTML = audio.muted ? mutedIcon : speakerIcon;

        toggle.setAttribute(
            "aria-label",
            audio.muted ? "Unmute audio" : "Mute audio"
        );

        toggle.setAttribute(
            "aria-pressed",
            String(audio.muted)
        );
    }

    enterScreen.addEventListener("click", async () => {
        if (entered) return;

        try {
            await setupAudioVisualizer();

            if (audioContext.state === "suspended") {
                await audioContext.resume();
            }

            await audio.play();

            entered = true;
            enterScreen.classList.add("hidden");

            updateAudioIcon();
        } catch (error) {
            console.error("Audio playback failed:", error);
        }
    });

    toggle.addEventListener("click", async () => {
        if (!entered) return;

        audio.muted = !audio.muted;

        if (!audio.muted && audioContext?.state === "suspended") {
            try {
                await audioContext.resume();
            } catch (error) {
                console.error("Audio resume failed:", error);
            }
        }

        updateAudioIcon();
    });

    audio.addEventListener("play", () => {
        if (audioContext?.state === "suspended") {
            audioContext.resume();
        }
    });

    audio.addEventListener("ended", () => {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    });

    updateAudioIcon();
}

async function fetchSiteData() {
    try {
        const response = await fetch(siteDataPath);
        const siteData = await response.json();
        return siteData;
    } catch (error) {
        alert(error);
        return;
    }
}
