import * as fuzzysort from './fuzzysort.js';
import * as jvr from "./json_var_resolver.js";

const defaultCfg = {
    "var": {
        "so_tag": [
            {value: "python", keyword: "python"},
            {value: "golang", keyword: "golang"},
            {value: "java", keyword: "java"},
            {value: "javascript", keyword: "javascript"},
        ]
    },
    pattern: [
        {
            desc: "stackoverflow by tag",
            keyword: "st",
            url: "https://stackoverflow.com/questions/tagged/${tag}",
            params: [
                {
                    name: "tag",
                    type: "select",
                    values: "${.var.so_tag}"
                }
            ]
        },
        {
            "desc": "google",
            "keyword": "g",
            "url": "https://${location}/search?ie=${ie}&q=${search}&hl=${location}",
            "params": [
                {
                    "name": "location",
                    "type": "select",
                    "values": [
                        {
                            "value": ["google.com.hk", "zh-cn"],
                            "keyword": "hk"
                        },
                        {
                            "value": ["google.com.jp", "jp"],
                            "keyword": "jp"
                        }
                    ]
                },
                {
                    "name": "ie",
                    "type": "select",
                    "values": [
                        {
                            "value": "UTF-8",
                            "keyword": "UTF-8"
                        },
                        {
                            "value": "UTF-16",
                            "keyword": "UTF-16"
                        }
                    ]
                },
                {
                    "name": "search",
                    "type": "input"
                }
            ]
        }
    ]
};

let cfg = jvr.resolve(defaultCfg)

async function loadConfig() {
    try {
        // jest-chrome not support storage session API
        if (!inTest()) {
            chrome.storage.session.set({defaultCfg: JSON.stringify(defaultCfg, null, 4)})
            const result = await chrome.storage.sync.get(['userConfig']);
            cfg = jvr.resolve(JSON.parse(result.userConfig) || defaultCfg);
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

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.userConfig) {
        cfg = jvr.resolve(changes.userConfig.newValue || defaultConfig);
        console.log("Configuration updated:", cfg);
    }
});

loadConfig();

function highlightMatch(keyword, match) {
    if (!match || !match.indexes) return keyword;
    let highlighted = '';
    let lastIndex = 0;
    match.indexes.forEach(index => {
        highlighted += keyword.slice(lastIndex, index) + `<match>${keyword[index]}</match>`;
        lastIndex = index + 1;
    });
    highlighted += keyword.slice(lastIndex);
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
                highlight: item.keyword,
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
            sortedValues: [{highlight: `<match>${input || "please input any string"}</match>`, keyword: input, value: input}]
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
        `pattern: ${matchedPattern.keyword}`,
        ...sortedParams.map((param) =>
            `${param.name}: ${param.sortedValues[0]?.value || ''}`
        )
    ].join(' | ');

    chrome.omnibox.setDefaultSuggestion({description: defaultSuggestion});

    let suggestions;
    if (currentParamIndex === -1) {
        suggestions = sortedPatterns.map(p => ({
            content: p.keyword + " ",
            description: `pattern: ${p.highlight} - ${p.value.desc}`
        }));
        suggest(suggestions)
        return
    }
    const currentParam = sortedParams[currentParamIndex];
    if (currentParam.type === "select") {
        suggestions = currentParam.sortedValues.map(v => ({
            content: `${text.split(' ').slice(0, currentParamIndex + 1).join(' ')} ${v.keyword}`,
            description: `${currentParam.name}: ${v.highlight} - ${Array.isArray(v.value) ? v.value.join(', ') : v.value}`
        }));
        suggest(suggestions)
        return
    }

    // for input type
    suggestions = currentParam.sortedValues.map(v => ({
        content: `${text.split(' ').slice(0, currentParamIndex + 1).join(' ')} ${v.keyword}`,
        description: `${currentParam.name}: ${v.highlight} - input`
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
