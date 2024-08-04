// 引入 fuzzysort 库
import * as fuzzysort from './fuzzysort.js';

// 新建的cfg对象
const cfg = {
    pattern: [
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
                            "keyword": ["hk", "hongkong"]
                        },
                        {
                            "value": ["google.com.jp", "jp"],
                            "keyword": ["jp", "japan"]
                        }
                    ]
                },
                {
                    "name": "ie",
                    "type": "select",
                    "values": [
                        {
                            "value": "UTF-8",
                            "keyword": ["UTF-8"]
                        },
                        {
                            "value": "UTF-16",
                            "keyword": ["UTF-16"]
                        }
                    ]
                },
                {
                    "name": "search",
                    "type": "input"
                }
            ]
        },
        {
            "desc": "open",
            "keyword": "o",
            "url": "https://${domain}/",
            "params": [
                {
                    "name": "domain",
                    "type": "select",
                    "values": [
                        {
                            "value": ["bing.com"],
                            "keyword": ["bing"]
                        }
                    ]
                }
            ]
        }
    ]
};

// Helper function: Highlight matching characters in suggestion
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

// 设置Default Suggestion，展示当前参数的状态
function setDefaultSuggestions(parts, config) {
    let description = '';

    config.params.forEach((param, index) => {
        let inputValue = parts[index + 1] || '';
        let displayValue = '';

        if (inputValue) {
            if (param.type === 'select') {
                // 尝试模糊匹配当前输入
                let bestMatch = null;
                param.values.forEach(valueObj => {
                    valueObj.keyword.forEach(keyword => {
                        let match = fuzzysort.single(inputValue, keyword);
                        if (match && (!bestMatch || match.score > bestMatch.score)) {
                            bestMatch = match;
                            displayValue = Array.isArray(valueObj.value) ? valueObj.value.join(', ') : valueObj.value;
                        }
                    });
                });
                if (bestMatch) {
                    inputValue = highlightMatch(inputValue, bestMatch);
                } else {
                    displayValue = Array.isArray(param.values[0].value) ? param.values[0].value.join(', ') : param.values[0].value;
                }
            } else {
                displayValue = inputValue;
            }
        } else {
            // 如果未输入，使用默认值
            if (param.type === 'select') {
                displayValue = Array.isArray(param.values[0].value) ? param.values[0].value.join(', ') : param.values[0].value;
            } else {
                displayValue = '';
            }
        }

        description += `${param.name}: ${inputValue || displayValue} | `;
    });

    // 去掉最后一个' | '符号
    description = description.slice(0, -3);

    chrome.omnibox.setDefaultSuggestion({
        description
    });
}

// Listener方法: 处理omnibox输入
export function handleInputChanged(text, suggest) {
    console.log("User input: ", text);

    let parts = text.split(' ');
    let command = parts[0];
    let config = cfg.pattern.find(c => c.keyword === command);

    // Action阶段提示
    if (!config) {
        let suggestions = cfg.pattern.map(c => ({
            content: c.keyword,
            description: c.desc
        }));
        suggest(suggestions);
        return;
    }

    let params = config.params;
    let currentParamIndex = parts.length - 2;
    let currentParam = params[currentParamIndex];
    let suggestions = [];

    // 当前参数模糊匹配
    if (currentParam && currentParam.type === "select") {
        let input = parts[currentParamIndex + 1] || '';
        let matchedResults = [];
        let unmatchedResults = [];

        currentParam.values.forEach(valueObj => {
            valueObj.keyword.forEach(keyword => {
                let match = fuzzysort.single(input, keyword);
                if (match) {
                    matchedResults.push({
                        content: `${parts.slice(0, currentParamIndex + 1).join(' ')} ${keyword}`,
                        description: `${currentParam.name}: ${highlightMatch(keyword, match)} - ${Array.isArray(valueObj.value) ? valueObj.value.join(', ') : valueObj.value}`
                    });
                } else {
                    unmatchedResults.push({
                        content: `${parts.slice(0, currentParamIndex + 1).join(' ')} ${keyword}`,
                        description: `${currentParam.name}: ${keyword} - ${Array.isArray(valueObj.value) ? valueObj.value.join(', ') : valueObj.value}`
                    });
                }
            });
        });

        matchedResults.sort((a, b) => b.score - a.score);

        suggestions = matchedResults.concat(unmatchedResults).slice(0, 10);
    }

    setDefaultSuggestions(parts, config);
    suggest(suggestions);
}

// Listener方法: 处理omnibox提交
export function handleInputEntered(text) {
    console.log("User submitted: ", text);

    let parts = text.split(' ');
    let command = parts[0];
    let config = cfg.pattern.find(c => c.keyword === command);

    if (!config) return;

    let params = config.params;
    let paramValues = {};

    parts.slice(1).forEach((input, index) => {
        let param = params[index];
        if (param.type === "select") {
            let valueObj = param.values.find(v => v.keyword.includes(input));
            paramValues[param.name] = valueObj ? valueObj.value : param.values[0].value;
        } else if (param.type === "input") {
            paramValues[param.name] = input;
        }
    });

    let url = config.url;
    for (let key in paramValues) {
        let value = Array.isArray(paramValues[key]) ? paramValues[key][0] : paramValues[key];
        url = url.replace(`\${${key}}`, value);
    }

    chrome.tabs.create({ url: url });
}

// 注册事件
chrome.omnibox.onInputChanged.addListener(handleInputChanged);
chrome.omnibox.onInputEntered.addListener(handleInputEntered);
