// 配置数组
var cfg = [
    {
        "desc": "google",
        "id": "g",
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
        "id": "o",
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

// 处理omnibox输入
chrome.omnibox.onInputChanged.addListener((text, suggest) => {
    console.log("User input: ", text);

    let parts = text.split(' ');
    let command = parts[0];

    let config = cfg.find(c => c.id === command);
    if (!config) {
        return;
    }

    let suggestions = [];
    let params = config.params;

    parts.slice(1).forEach((input, index) => {
        if (params[index] && params[index].type === "select") {
            let valueObj = params[index].values.find(v => v.keyword.some(k => k.includes(input)));
            if (valueObj) {
                suggestions.push({
                    content: valueObj.value.join(', '),
                    description: `${params[index].name}: ${valueObj.value.join(', ')}`
                });
            }
        }
    });

    suggest(suggestions);
});

// 处理omnibox提交
chrome.omnibox.onInputEntered.addListener((text) => {
    console.log("User submitted: ", text);

    let parts = text.split(' ');
    let command = parts[0];

    let config = cfg.find(c => c.id === command);
    if (!config) {
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
                paramValues[params[index].name] = params[index].values[0].value;
            }
        } else if (params[index].type === "input") {
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
