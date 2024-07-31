importScripts('fuzzysort.min.js');
// 引入fuzzysort库
// 确保在项目中正确引入fuzzysort库。如果在浏览器环境中，使用以下脚本标签引入：
// <script src="https://cdn.jsdelivr.net/npm/fuzzysort@latest/fuzzysort.min.js"></script>
// 如果在Node.js环境中，请通过npm安装：npm install fuzzysort

// 配置数组
var cfg = [
    {
        "desc": "google",
        "keyword": "g",
        "url": "https://${location}/search?q=${search}&hl=${location}",
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
];

// 设置默认提示
function setDefaultSuggestions() {
    let descriptions = cfg.map(config => `<match>${config.keyword}</match> - <dim>${config.desc}</dim>`);
    let description = descriptions.join(' | ');
    chrome.omnibox.setDefaultSuggestion({
        description: `Available commands: ${description}`
    });
}

// 高亮匹配字符函数
function highlightMatch(input, keyword) {
    let result = fuzzysort.single(input, keyword);
    console.log(`Highlighting match: input=${input}, keyword=${keyword}`);
    console.log(`Fuzzysort result:`, result);

    if (result && result.indexes) {
        let highlighted = '';
        for (let i = 0; i < keyword.length; i++) {
            highlighted += result.indexes.includes(i) ? `<match>${keyword[i]}</match>` : keyword[i];
        }
        return highlighted;
    }
    return keyword; // 如果没有匹配结果，则返回原始关键字
}

// 当用户进入Omnibar时显示默认提示
chrome.omnibox.onInputStarted.addListener(() => {
    console.log("Omnibox input started");
    setDefaultSuggestions();
});

// 处理Omnibar输入变化时的提示
chrome.omnibox.onInputChanged.addListener((text, suggest) => {
    console.log("User input: ", text);

    let parts = text.split(' ');
    let command = parts[0];
    let input = parts.slice(1).join(' ');

    let config = cfg.find(c => c.keyword === command);
    if (!config) {
        console.log("No configuration found for command:", command);
        return;
    }

    let suggestions = [];
    let params = config.params;
    let currentParamIndex = parts.length - 2; // 当前正在输入的参数索引
    console.log(`Current parameter index: ${currentParamIndex}`);

    if (currentParamIndex >= 0 && currentParamIndex < params.length) {
        let param = params[currentParamIndex];
        console.log(`Current parameter: ${param.name}, Input: ${input}`);
        
        if (param.type === "select") {
            let matchedResults = [];
            let unmatchedResults = [];

            param.values.forEach(valueObj => {
                valueObj.keyword.forEach(keyword => {
                    let result = fuzzysort.single(input, keyword);
                    console.log(`Fuzzysort result for keyword "${keyword}":`, result);
                    
                    // 检查是否有匹配
                    if (result && result.score > -10000) {
                        matchedResults.push({
                            content: `${parts.slice(0, currentParamIndex + 1).join(' ')} ${keyword}`,
                            description: `${param.name}: ${highlightMatch(input, keyword)} - ${valueObj.value.join(', ')}`
                        });
                    } else {
                        // 如果没有匹配，将未匹配项添加到unmatchedResults中
                        unmatchedResults.push({
                            content: `${parts.slice(0, currentParamIndex + 1).join(' ')} ${keyword}`,
                            description: `${param.name}: ${highlightMatch(input, keyword)} - ${valueObj.value.join(', ')}`
                        });
                    }
                });
            });

            // 按匹配度排序，优先显示匹配度高的结果
            matchedResults.sort((a, b) => b.score - a.score);
            // 合并匹配结果和未匹配结果
            suggestions = matchedResults.concat(unmatchedResults).slice(0, 10);
            console.log("Suggestions:", suggestions);
        }
    }

    suggest(suggestions);
});

// 处理Omnibar提交
chrome.omnibox.onInputEntered.addListener((text) => {
    console.log("User submitted: ", text);

    let parts = text.split(' ');
    let command = parts[0];

    let config = cfg.find(c => c.keyword === command);
    if (!config) {
        console.log("No configuration found for command:", command);
        return;
    }

    let params = config.params;
    let paramValues = {};

    parts.slice(1).forEach((input, index) => {
        if (params[index] && params[index].type === "select") {
            let valueObj = params[index].values.find(v => v.keyword.some(k => k.includes(input)));
            if (valueObj) {
                paramValues[params[index].name] = valueObj.value;
            } else {
                paramValues[params[index].name] = params[index].values[0].value;
            }
        } else if (params[index] && params[index].type === "input") {
            paramValues[params[index].name] = [input];
        }
    });

    let url = config.url;

    // 根据每个参数的数组值，依次替换URL中的占位符
    for (let key in paramValues) {
        let valuesArray = paramValues[key];
        valuesArray.forEach((value, i) => {
            url = url.replace(`\${${key}}`, value);
        });
    }

    console.log("Generated URL: ", url);
    chrome.tabs.create({ url: url });
});
