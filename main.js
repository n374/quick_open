// 配置对象
var cfg = {
    "google": {
        "id": "g",
        "url": "https://${domain}/search?q=${search}",
        "params": [
            {
                "name": "domain",
                "type": "select",
                "values": [
                    {
                        "value": "google.com.hk",
                        "keyword": ["hk", "hongkong"]
                    },
                    {
                        "value": "google.com.jp",
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
    "open": {
        "id": "o",
        "url": "https://${domain}/",
        "params": [
            {
                "name": "domain",
                "type": "select",
                "values": [
                    {
                        "value": "bing.com",
                        "keyword": ["bing"]
                    }
                ]
            }
        ]
    }
};

// 处理omnibox输入
chrome.omnibox.onInputChanged.addListener((text, suggest) => {
    console.log("User input: ", text);

    let parts = text.split(' ');
    let command = parts[0];

    let config = Object.values(cfg).find(c => c.id === command);
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
                    content: valueObj.value,
                    description: `${params[index].name}: ${valueObj.value}`
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

    let config = Object.values(cfg).find(c => c.id === command);
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
            paramValues[params[index].name] = input;
        }
    });

    let url = config.url;
    for (let key in paramValues) {
        url = url.replace(`\${${key}}`, paramValues[key]);
    }

    console.log("Generated URL: ", url);
    chrome.tabs.create({ url: url });
});
