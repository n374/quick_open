import * as jvr from "./json_var_resolver.js";

const storageModeKey = 'storageMode';

async function getStorageMode() {
    const result = await chrome.storage.local.get([storageModeKey]);
    return result[storageModeKey] || 'sync';
}

function getStorageArea(mode) {
    return mode === 'local' ? chrome.storage.local : chrome.storage.sync;
}

async function setStorageMode(mode) {
    await chrome.storage.local.set({[storageModeKey]: mode});
}

function getStorageButtonLabel(mode) {
    return mode === 'local' ? 'Use Sync Mode' : 'Use Local Mode';
}

async function updateStorageButton() {
    const mode = await getStorageMode();
    const button = document.getElementById('toggle-storage');
    button.textContent = getStorageButtonLabel(mode);
}

async function loadConfig() {
    try {
        const mode = await getStorageMode();
        const area = getStorageArea(mode);
        const userConfig = await area.get(['userConfig']);
        const defaultCfg = await chrome.storage.session.get(['defaultCfg']);
        const userConfigValue = userConfig.userConfig;
        const defaultCfgValue = defaultCfg.defaultCfg;
        document.getElementById('config-input').value = userConfigValue || defaultCfgValue || "";
        await updateStorageButton();
    } catch (error) {
        console.error("Failed to load configuration:", error);
    }
}

async function saveConfig() {
    try {
        const userConfig = document.getElementById('config-input').value;
        const userConfigObj = JSON.parse(userConfig);
        jvr.resolve(userConfigObj);
        const mode = await getStorageMode();
        const area = getStorageArea(mode);
        await area.set({userConfig});
        alert('Configuration saved successfully!');
    } catch (e) {
        const message = e && e.message ? `Failed to save configuration: ${e.message}` : 'Failed to save configuration.';
        alert(message);
    }
}

async function resetConfig() {
    if (confirm('Are you sure you want to reset to the default configuration?')) {
        try {
            const defaultCfg = await chrome.storage.session.get(['defaultCfg']);
            const mode = await getStorageMode();
            const area = getStorageArea(mode);
            await area.set({userConfig: defaultCfg.defaultCfg});
            await loadConfig();
            alert('Configuration reset to default.');
        } catch (error) {
            console.error("Failed to reset configuration:", error);
        }
    }
}

async function toggleStorageMode() {
    const currentMode = await getStorageMode();
    const nextMode = currentMode === 'local' ? 'sync' : 'local';
    const fromArea = getStorageArea(currentMode);
    const toArea = getStorageArea(nextMode);
    const userConfig = await fromArea.get(['userConfig']);
    if (userConfig.userConfig) {
        await toArea.set({userConfig: userConfig.userConfig});
        await fromArea.remove(['userConfig']);
    }
    await setStorageMode(nextMode);
    await loadConfig();
}

document.getElementById('save-config').addEventListener('click', saveConfig);
document.getElementById('reset-config').addEventListener('click', resetConfig);
document.getElementById('toggle-storage').addEventListener('click', toggleStorageMode);

window.onload = loadConfig;
