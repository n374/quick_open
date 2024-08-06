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
                            "value": "bing.com",
                            "keyword": "bing"
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


// Helper function: Generate suggestions based on input
function getSuggestions(input, items, itemType) {
    let matchedResults = [];
    let unmatchedResults = [];

    items.forEach(item => {
        let match = fuzzysort.single(input, item.keyword);
        if (match) {
            matchedResults.push({
                score: match._score,
                content: itemType === 'pattern' ? item.keyword : item.keyword,
                description: itemType === 'pattern'
                    ? highlightMatch(item.keyword, match)
                    : `${itemType}: ${highlightMatch(item.keyword, match)} - ${Array.isArray(item.value) ? item.value.join(', ') : item.value}`
            });
        } else {
            unmatchedResults.push({
                content: itemType === 'pattern' ? item.keyword : item.keyword,
                description: itemType === 'pattern'
                    ? item.keyword
                    : `${itemType}: ${item.keyword} - ${Array.isArray(item.value) ? item.value.join(', ') : item.value}`
            });
        }
    });

    // Sort matched results by score (higher score first)
    matchedResults.sort((a, b) => b.score - a.score);

    // Strip out the score before returning
    let finalMatchedResults = matchedResults.map(result => {
        const { score, ...rest } = result; // Remove score property
        return rest;
    });

    return finalMatchedResults.concat(unmatchedResults).slice(0, 15);
}

// 处理输入并生成补全数组
function processInput(text) {
    let parts = text.trim().split(' ');
    if (text.endsWith(' ')) parts.push(''); // 如果最后是空格，表示已经开始输入下一个元素

    let command = parts[0];
    let config = cfg.pattern.find(c => c.keyword === command);
    let completionArray = [];

    if (config) {
        let params = config.params;
        parts.slice(1).forEach((input, index) => {
            let param = params[index];
            if (param.type === "select") {
                let bestMatch = param.values.find(valueObj =>
                    fuzzysort.single(input, valueObj.keyword)
                );
                completionArray.push(bestMatch ? bestMatch.value : param.values[0].value);
            } else if (param.type === "input") {
                completionArray.push(input);
            }
        });

        // 对于尚未输入的参数，使用默认值补全
        for (let i = completionArray.length; i < params.length; i++) {
            completionArray.push(params[i].type === 'select' ? params[i].values[0].value : '');
        }
    }

    return { parts, completionArray };
}

// Listener方法: 处理omnibox输入
export function handleInputChanged(text, suggest) {
    console.log("User input: ", text);

    let { parts, completionArray } = processInput(text);

    if (parts.length === 0) {
        // 未输入时，提示所有pattern
        let suggestions = getSuggestions('', cfg.pattern, 'pattern');
        suggest(suggestions);
    } else if (parts.length === 1) {
        // 输入了第一个部分时，提示匹配的pattern
        let suggestions = getSuggestions(parts[0], cfg.pattern, 'pattern');
        suggest(suggestions);
    } else {
        // 输入了pattern和参数，提供参数的suggestion
        let command = parts[0];
        let config = cfg.pattern.find(c => c.keyword === command);
        if (!config) return;

        let currentParamIndex = parts.length - 2;
        let currentParam = config.params[currentParamIndex];
        let suggestions = [];

        if (currentParam && currentParam.type === "select") {
            let input = parts[currentParamIndex + 1] || '';
            suggestions = getSuggestions(input, currentParam.values, currentParam.name);
        } else if (currentParam && currentParam.type === "input") {
            suggestions.push({
                content: text,
                description: "Please input any string"
            });
        }

        // 显示默认suggestion
        chrome.omnibox.setDefaultSuggestion({
            description: completionArray.join(' | ')
        });
        suggest(suggestions);
    }
}


// Listener方法: 处理omnibox提交
export function handleInputEntered(text) {
    console.log("User submitted: ", text);

    // 将用户输入拆分为数组
    let parts = text.trim().split(' ');
    if (text.endsWith(' ')) {
        parts.push(''); // 如果输入以空格结尾，增加一个空字符串
    }

    let command = parts[0];
    let config = cfg.pattern.find(c => c.keyword === command);

    if (!config) {
        console.log('No matching pattern found');
        return;
    }

    let params = config.params;
    let paramValues = {};

    // 遍历用户输入的参数，匹配对应的配置
    parts.slice(1).forEach((input, index) => {
        let param = params[index];
        if (param.type === "select") {
            let valueObj = param.values.find(v => v.keyword.includes(input));
            if (valueObj) {
                paramValues[param.name] = valueObj.value;
            } else {
                console.log(`No matching value for parameter: ${param.name}`);
                paramValues[param.name] = param.values[0].value;
            }
        } else if (param.type === "input") {
            paramValues[param.name] = [input];
        }
    });

    // 对于用户未提供的参数，设置为默认值（即配置的第一个值）
    params.forEach(param => {
        if (!paramValues.hasOwnProperty(param.name)) {
            paramValues[param.name] = param.type === "select" ? param.values[0].value : [''];
        }
    });

    // 构造最终URL
    let url = config.url;

    for (let key in paramValues) {
        let valuesArray = Array.isArray(paramValues[key]) ? paramValues[key] : [paramValues[key]];
        
        // 遍历数组中的每个值并替换对应的占位符
        valuesArray.forEach(value => {
            url = url.replace(`\${${key}}`, value);
        });
    }

    console.log("Final URL: ", url);

    // 打开新标签页
    chrome.tabs.create({ url: url });
    console.log("created URL: ", url);
}

// 注册事件
chrome.omnibox.onInputChanged.addListener(handleInputChanged);
chrome.omnibox.onInputEntered.addListener(handleInputEntered);
