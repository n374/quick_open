// 引入 fuzzysort 库
importScripts('fuzzysort.min.js');

// 配置对象，将原来的 cfg 结构作为 pattern 的值
var cfg = {
    "pattern": [
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

// 设置默认建议，用于用户刚进入 Omnibox 或输入无效的命令时
function setDefaultSuggestions() {
    const defaultSuggestions = cfg.pattern.map(item => {
        return {
            content: item.keyword,  // 用户选择时会填入这个内容
            description: `${item.keyword} - ${item.desc}`  // 显示在下拉列表中的描述
        };
    });

    // 设置默认建议，显示所有可用的 actions
    chrome.omnibox.setDefaultSuggestion({
        description: "Available actions: " + defaultSuggestions.map(s => s.description).join(", ")
    });

    console.log("Default suggestions set: ", defaultSuggestions);
}

// 高亮匹配字符的函数
function highlightMatch(input, keyword, indexes) {
    let highlighted = '';
    let lastIndex = 0;
    indexes.forEach(index => {
        highlighted += keyword.substring(lastIndex, index) + '<match>' + keyword[index] + '</match>';
        lastIndex = index + 1;
    });
    highlighted += keyword.substring(lastIndex);
    return highlighted;
}

// 处理 Omnibox 输入变化时的提示
chrome.omnibox.onInputChanged.addListener((text, suggest) => {
    console.log("User input: ", text);

    if (text.trim() === "") {
        // 用户没有输入内容时，显示默认建议
        setDefaultSuggestions();
        return;
    }

    let parts = text.split(' ');
    let command = parts[0];

    // 查找匹配的配置
    let config = cfg.pattern.find(c => c.keyword === command);
    if (!config) {
        console.log("No configuration found for command:", command);
        // 如果没有匹配的 command，返回默认建议
        setDefaultSuggestions();
        return;
    }

    // 用户开始输入参数阶段
    let params = config.params;
    let currentParamIndex = parts.length - 2; // 减去 command 和当前参数
    let input = parts[currentParamIndex + 1] || ""; // 当前输入的部分

    let suggestions = [];
    let matchedResults = [];
    let unmatchedResults = [];

    if (currentParamIndex < params.length) {
        let param = params[currentParamIndex];

        // 如果是 select 类型的参数，使用模糊匹配
        if (param.type === "select") {
            param.values.forEach(valueObj => {
                valueObj.keyword.forEach(keyword => {
                    let result = fuzzysort.single(input, keyword);

                    if (result) {
                        // 匹配结果
                        matchedResults.push({
                            content: `${parts.slice(0, currentParamIndex + 1).join(' ')} ${keyword}`,
                            description: `${param.name}: ${highlightMatch(input, keyword, result.indexes)} - ${Array.isArray(valueObj.value) ? valueObj.value.join(', ') : valueObj.value}`,
                            score: result.score
                        });
                    } else {
                        // 未匹配结果
                        unmatchedResults.push({
                            content: `${parts.slice(0, currentParamIndex + 1).join(' ')} ${keyword}`,
                            description: `${param.name}: ${keyword} - ${Array.isArray(valueObj.value) ? valueObj.value.join(', ') : valueObj.value}`
                        });
                    }
                });
            });

            // 根据匹配度对匹配结果进行排序
            matchedResults.sort((a, b) => b.score - a.score);
            suggestions = matchedResults.concat(unmatchedResults).slice(0, 10); // 限制最多显示10个结果
        }

        suggest(suggestions);
        console.log("Suggestions: ", suggestions);
    }

    // 设置 Default Suggestion 显示当前已输入的和默认值
    let defaultSuggestion = config.params.map((param, index) => {
        let paramInput = parts[index + 1];
        if (paramInput) {
            if (param.type === "select") {
                let valueObj = param.values.find(valueObj => fuzzysort.single(paramInput, valueObj.keyword));
                let match = fuzzysort.single(paramInput, valueObj.keyword);
                return `${param.name}: ${match ? highlightMatch(paramInput, valueObj.keyword, match.indexes) : paramInput}`;
            } else {
                return `${param.name}: ${paramInput}`;
            }
        } else {
            // 显示默认值
            if (param.type === "select") {
                let defaultValue = param.values[0].value;
                return `${param.name}: ${Array.isArray(defaultValue) ? defaultValue.join(', ') : defaultValue}`;
            } else {
                return `${param.name}: `;
            }
        }
    }).join(' | ');

    chrome.omnibox.setDefaultSuggestion({
        description: defaultSuggestion
    });
    console.log("Default suggestion: ", defaultSuggestion);
});

// 处理 Omnibox 提交
chrome.omnibox.onInputEntered.addListener((text) => {
    console.log("User submitted: ", text);

    let parts = text.split(' ');
    let command = parts[0];

    // 查找匹配的配置
    let config = cfg.pattern.find(c => c.keyword === command);
    if (!config) {
        console.log("No configuration found for command:", command);
        return;
    }

    let params = config.params;
    let paramValues = {};

    parts.slice(1).forEach((input, index) => {
        if (params[index].type === "select") {
            let valueObj = params[index].values.find(v => v.keyword.some(k => k.includes(input)));
            if (valueObj) {
                paramValues[params[index].name] = valueObj.value;
            } else {
                paramValues[params[index].name] = Array.isArray(params[index].values[0].value) ? params[index].values[0].value[0] : params[index].values[0].value;
            }
        } else if (params[index].type === "input") {
            paramValues[params[index].name] = input;
        }
    });

    let url = config.url;
    for (let key in paramValues) {
        url = url.replace(new RegExp(`\\\${${key}}`, 'g'), paramValues[key]);
    }

    console.log("Generated URL: ", url);
    chrome.tabs.create({ url: url });
});
