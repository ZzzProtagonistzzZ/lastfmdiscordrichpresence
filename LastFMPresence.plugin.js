
/**
 * @name LastFMPresence
 * @version 1.1.0
 * @description Shows your current Last.fm track as Discord Rich Presence with album art and time elapsed.
 * @author exodus
 * @authorLink https://github.com/ZzzProtagonistzzZ
 * @updateUrl https://github.com/ZzzProtagonistzzZ/lastfmdiscordrichpresence/tree/main
 * @source https://github.com/ZzzProtagonistzzZ/lastfmdiscordrichpresence
 */

const config = {
    info: {
        name: "LastFMPresence",
        authors: [{ name: "exodus" }],
        version: "1.1.0",
        description: "Shows your current Last.fm track in Rich Presence with album art and time."
    }
};

module.exports = !global.ZeresPluginLibrary ? class {
    constructor() { this._config = config; }
    load() {
        BdApi.showConfirmationModal("Missing Plugin Library", 
            `The plugin "${config.info.name}" requires ZeresPluginLibrary. Click "Download Now" to install it.`, {
            confirmText: "Download Now",
            cancelText: "Cancel",
            onConfirm: () => {
                require("request").get("https://betterdiscord.app/gh-redirect?id=rezystech/BDPluginLibrary", async (e, r, b) => {
                    if (!e && r.statusCode === 200) {
                        require("fs").writeFileSync(BdApi.Plugins.folder + "/0PluginLibrary.plugin.js", b);
                    }
                });
            }
        });
    }
    start() {}
    stop() {}
} : (([Plugin, Api]) => {
    const {PluginUtilities} = Api;
    return class LastFMPresence extends Plugin {
        constructor() {
            super();
            this.apiKey = "ENTER_YOUR_APT_KEY";
            this.username = "ENTER_YOUR_USERNAME";
            this.interval = null;
            this.lastTrackName = null;
        }

        async updateStatus() {
            try {
                const res = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${this.username}&api_key=${this.apiKey}&format=json&limit=1&extended=1`);
                const data = await res.json();
                const track = data.recenttracks.track?.[0];

                if (!track || !track["@attr"]?.nowplaying) return;

                const song = `${track.name} - ${track.artist.name}`;
                const albumArt = track.image?.pop()?.["#text"] || "";
                const durationMs = parseInt(track.duration) || 180000; // fallback 3 minutes
                const startTimestamp = Math.floor(Date.now() / 1000);
                const endTimestamp = startTimestamp + Math.floor(durationMs / 1000);

                if (this.lastTrackName === track.name) return;
                this.lastTrackName = track.name;

                BdApi.findModuleByProps("updateLocalPresence")?.updateLocalPresence({
                    status: "online",
                    activities: [{
                        name: track.name,
                        type: 2,
                        details: track.name,
                        state: `by ${track.artist.name}`,
                        assets: {
                            large_image: albumArt || "mp:external",
                            large_text: track.album?.title || "Album Art"
                        },
                        timestamps: {
                            start: startTimestamp,
                            end: endTimestamp
                        }
                    }]
                });

            } catch (e) {
                console.error("[LastFMPresence] Error updating status:", e);
            }
        }

        onStart() {
            this.updateStatus();
            this.interval = setInterval(() => this.updateStatus(), 15000);
        }

        onStop() {
            clearInterval(this.interval);
            BdApi.findModuleByProps("updateLocalPresence")?.updateLocalPresence({
                activities: []
            });
        }
    };
})(global.ZeresPluginLibrary.buildPlugin(config));
