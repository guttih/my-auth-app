/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        // Add any Steam image hosts you use
        remotePatterns: [
            { protocol: "https", hostname: "avatars.steamstatic.com" },        // profile avatars
            { protocol: "https", hostname: "media.steampowered.com" },         // app icons/art
            { protocol: "https", hostname: "shared.akamai.steamstatic.com" },  // fallback capsules
        ],
    },
};

module.exports = nextConfig;
