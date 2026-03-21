const APP_STORE_URL = "https://apps.apple.com/us/app/ftf-food-truck-finder/id6742719545";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.innoryzen.foodtruckfinder";
const PRIVACY_POLICY_URL = "https://www.ftf-foodtruckfinder.com/";
const SUPPORT_EMAIL = "Foodtruckfinderinfo@gmail.com";
const SUPPORT_SUBJECT = "Owner Referral Code Request";

const hasUsableUrl = (value) =>
    Boolean(value) && !value.includes("REPLACE_ME");

const bindLinkGroup = (selector, url, fallbackLabel) => {
    document.querySelectorAll(selector).forEach((link) => {
        if (hasUsableUrl(url)) {
            link.href = url;
            link.target = "_blank";
            link.rel = "noreferrer";
            return;
        }

        link.href = "#download";
        link.classList.add("is-disabled");
        if (fallbackLabel) {
            link.textContent = fallbackLabel;
        }
    });
};

bindLinkGroup("[data-app-store]", APP_STORE_URL, "App Store link coming soon");
bindLinkGroup("[data-play-store]", PLAY_STORE_URL);

const iosNote = document.querySelector("[data-ios-note]");
if (iosNote && !hasUsableUrl(APP_STORE_URL)) {
    iosNote.hidden = false;
}

document.querySelectorAll("[data-privacy-policy]").forEach((link) => {
    link.href = PRIVACY_POLICY_URL;
    link.target = "_blank";
    link.rel = "noreferrer";
});

document.querySelectorAll("[data-support-email]").forEach((link) => {
    link.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(SUPPORT_SUBJECT)}`;
});
