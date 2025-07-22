const siteDataPath = "./assets/data.json";

document.addEventListener("DOMContentLoaded", async () => {
    // Getting Site JSON data
    const siteData = await fetchSiteData();
    if (!siteData) {
        alert("Error: Site Data wasn't found!!");
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
    const profilePic = document.createElement("img");
    profilePic.classList = "profilePic";
    profilePic.src = personalInfo.profilePhoto;
    contentDiv.append(profilePic);

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
