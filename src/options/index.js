
// Default configuration
const defaultConfig = {
    pattern: [
        {
            desc: "stackoverflow",
            keyword: "s",
            url: "https://stackoverflow.com/questions/tagged/${tag}",
            params: [
                {
                    name: "tag",
                    type: "select",
                    values: [
                        { value: "python", keyword: "python" },
                        { value: "golang", keyword: "golang" },
                        { value: "java", keyword: "java" },
                        { value: "javascript", keyword: "javascript" },
                    ]
                }
            ]
        },
        {
            desc: "google",
            keyword: "g",
            url: "https://${location}/search?ie=${ie}&q=${search}&hl=${location}",
            params: [
                {
                    name: "location",
                    type: "select",
                    values: [
                        { value: ["google.com.hk", "zh-cn"], keyword: "hk" },
                        { value: ["google.com.jp", "jp"], keyword: "jp" }
                    ]
                },
                {
                    name: "ie",
                    type: "select",
                    values: [
                        { value: "UTF-8", keyword: "UTF-8" },
                        { value: "UTF-16", keyword: "UTF-16" }
                    ]
                },
                { name: "search", type: "input" }
            ]
        }
    ]
};

// Utility function to merge default config with user config
function mergeConfig(userConfig, defaultConfig) {
    return userConfig || defaultConfig;
}

// Load the configuration from Chrome's storage or fallback to the default configuration
async function loadConfig() {
    try {
        const result = await chrome.storage.sync.get(['userConfig']);
        const config = mergeConfig(result.userConfig, defaultConfig);
        document.getElementById('config-input').value = JSON.stringify(config, null, 4);
    } catch (error) {
        console.error("Failed to load configuration:", error);
    }
}

// Save the user configuration to Chrome's storage
async function saveConfig() {
    try {
        const userConfig = JSON.parse(document.getElementById('config-input').value);
        await chrome.storage.sync.set({ userConfig });
        alert('Configuration saved successfully!');
    } catch (e) {
        alert('Invalid JSON format. Please check your configuration.');
    }
}

// Reset the configuration to the default value
async function resetConfig() {
    if (confirm('Are you sure you want to reset to the default configuration?')) {
        try {
            await chrome.storage.sync.set({ userConfig: defaultConfig });
            loadConfig();  // Ensure the default config is loaded after reset
            alert('Configuration reset to default.');
        } catch (error) {
            console.error("Failed to reset configuration:", error);
        }
    }
}

// Event listeners for buttons
document.getElementById('save-config').addEventListener('click', saveConfig);
document.getElementById('reset-config').addEventListener('click', resetConfig);

// Load the config when the page loads
window.onload = loadConfig;
