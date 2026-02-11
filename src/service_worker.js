import * as fuzzysort from './fuzzysort.js';
import * as jvr from "./json_var_resolver.js";
import defaultCfg from './config.json';

let cfg = jvr.resolve(defaultCfg)
const storageModeKey = 'storageMode';

async function getStorageMode() {
    const result = await chrome.storage.local.get([storageModeKey]);
    return result[storageModeKey] || 'sync';
}

function getStorageArea(mode) {
    return mode === 'local' ? chrome.storage.local : chrome.storage.sync;
}

async function loadConfig() {
    try {
        // jest-chrome not support storage session API
        if (!inTest()) {
            chrome.storage.session.set({defaultCfg: JSON.stringify(defaultCfg, null, 4)})
            const mode = await getStorageMode();
            const area = getStorageArea(mode);
            const result = await area.get(['userConfig']);
            let userConfig = null;
            if (result.userConfig) {
                try {
                    userConfig = JSON.parse(result.userConfig);
                } catch (e) {
                    console.error("Failed to parse userConfig:", e);
                }
            }
            cfg = jvr.resolve(userConfig || defaultCfg);
            console.log("Configuration loaded:", cfg);
        }
    } catch (error) {
        console.error("Failed to load configuration:", error);
        try {
            cfg = jvr.resolve(defaultCfg);
        } catch (error) {
            console.error("Failed to load default configuration:", error);
        }
    }
}

chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area === 'local' && changes.storageMode) {
        await loadConfig();
        return;
    }
    const mode = await getStorageMode();
    const targetArea = mode === 'local' ? 'local' : 'sync';
    if (area === targetArea && changes.userConfig) {
        let userConfig = null;
        if (changes.userConfig.newValue) {
            try {
                userConfig = JSON.parse(changes.userConfig.newValue);
            } catch (e) {
                console.error("Failed to parse userConfig:", e);
            }
        }
        cfg = jvr.resolve(userConfig || defaultCfg);
        console.log("Configuration updated:", cfg);
    }
});

loadConfig();

function escapeXml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

function highlightMatch(keyword, match) {
    if (!match || !match.indexes) return escapeXml(keyword);
    let highlighted = '';
    let lastIndex = 0;
    match.indexes.forEach(index => {
        highlighted += escapeXml(keyword.slice(lastIndex, index)) + `<match>${escapeXml(keyword[index])}</match>`;
        lastIndex = index + 1;
    });
    highlighted += escapeXml(keyword.slice(lastIndex));
    return highlighted;
}

function sort(input, list) {
    let matchedResults = [];
    let unmatchedResults = [];

    list.forEach(item => {
        let match = fuzzysort.single(input, item.keyword);
        if (match) {
            matchedResults.push({
                score: match.score,
                highlight: highlightMatch(item.keyword, match),
                ...item
            });
        } else {
            unmatchedResults.push({
                highlight: escapeXml(item.keyword),
                ...item
            });
        }
    });

    matchedResults.sort((a, b) => b.score - a.score);
    return [...matchedResults, ...unmatchedResults];
}

function handleInput(text) {
    let parts = text.trim().split(' ');
    if (text.endsWith(' ')) parts.push('');

    const patternList = cfg.pattern.map(p => ({keyword: p.keyword, value: p}));
    const sortedPatterns = sort(parts[0], patternList);
    const matchedPattern = sortedPatterns[0].value;

    const params = matchedPattern.params;
    const paramInputs = parts.slice(1);
    while (paramInputs.length < params.length) paramInputs.push('');

    const sortedParams = params.map((param, index) => {
        var input = paramInputs[index];
        if (param.type === "select") {
            return {
                ...param,
                sortedValues: sort(input, param.values)
            };
        }
        // for input type
        return {
            ...param,
            sortedValues: [{highlight: `<match>${escapeXml(input || "please input any string")}</match>`, keyword: input, value: input}]
        };
    });

    return {
        sortedPatterns,
        sortedParams,
        currentParamIndex: Math.min(parts.length - 2, params.length - 1)
    };
}

export function handleInputChanged(text, suggest) {
    console.log("User input: ", text);

    const {sortedPatterns, sortedParams, currentParamIndex} = handleInput(text);
    const matchedPattern = sortedPatterns[0]
    const defaultSuggestion = [
        `pattern: ${escapeXml(matchedPattern.keyword)}`,
        ...sortedParams.map((param) =>
            `${escapeXml(param.name)}: ${escapeXml(param.sortedValues[0]?.value || '')}`
        )
    ].join(' | ');

    chrome.omnibox.setDefaultSuggestion({description: defaultSuggestion});

    let suggestions;
    if (currentParamIndex === -1) {
        suggestions = sortedPatterns.map(p => ({
            content: p.keyword + " ",
            description: `pattern: ${p.highlight} - ${escapeXml(p.value.desc)}`
        }));
        suggest(suggestions)
        return
    }
    const currentParam = sortedParams[currentParamIndex];
    if (currentParam.type === "select") {
        suggestions = currentParam.sortedValues.map(v => {
            const val = Array.isArray(v.value) ? v.value.join(', ') : v.value;
            return {
                content: `${text.split(' ').slice(0, currentParamIndex + 1).join(' ')} ${v.keyword}`,
                description: `${escapeXml(currentParam.name)}: ${v.highlight} - ${escapeXml(val)}`
            };
        });
        suggest(suggestions)
        return
    }

    // for input type
    suggestions = currentParam.sortedValues.map(v => ({
        content: `${text.split(' ').slice(0, currentParamIndex + 1).join(' ')} ${v.keyword}`,
        description: `${escapeXml(currentParam.name)}: ${v.highlight} - input`
    }));
    suggest(suggestions)
}

export function handleInputEntered(text, disposition) {
    const {sortedPatterns, sortedParams} = handleInput(text);
    let url = sortedPatterns[0].value.url;
    sortedParams.forEach(param => {
        const value = param.sortedValues[0]?.value || "";
        (Array.isArray(value) ? value : [value]).forEach(v => url = url.replace(`\${${param.name}}`, v));
    });

    console.log("Final URL: ", url);
    if (disposition === "currentTab") {
        chrome.tabs.update(undefined, {url: url});
    } else {
        chrome.tabs.create({url: url});
    }
}

function inTest() {
    return typeof process != 'undefined' && process.env.JEST_WORKER_ID !== undefined;
}

chrome.omnibox.onInputChanged.addListener(handleInputChanged);
chrome.omnibox.onInputEntered.addListener(handleInputEntered);
if (!inTest()) {
    chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());
}
