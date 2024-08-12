import * as jvr from "./json_var_resolver.js";

// Utility function to merge default config with user config
function mergeConfig(userConfig, defaultConfig) {
    return userConfig || defaultConfig;
}

// Load the configuration from Chrome's storage or fallback to the default configuration
async function loadConfig() {
    try {
        const userConfig = await chrome.storage.sync.get(['userConfig']);
        const defaultCfg = await chrome.storage.session.get(['defaultCfg']);
        document.getElementById('config-input').value = userConfig.userConfig || defaultCfg.defaultCfg;
    } catch (error) {
        console.error("Failed to load configuration:", error);
    }
}

// Save the user configuration to Chrome's storage
async function saveConfig() {
    try {
        var userConfig = document.getElementById('config-input').value;
        const userConfigObj = JSON.parse(userConfig);
        jvr.resolve(userConfigObj);
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
            const defaultCfg = await chrome.storage.session.get(['defaultCfg']);
            await chrome.storage.sync.set({ userConfig: defaultCfg.defaultCfg });
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
