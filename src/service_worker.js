import * as fuzzysort from './fuzzysort.js';
import * as jvr from "./json_var_resolver.js";
const defaultCfg = {
    "var": {
        "srvs": [
            {"psm": "bytedance.videoarch.diting", "keyword": "diting"},
            {"psm": "bytedance.videoarch.soter_api", "keyword": "st"},
            {"psm": "bytedance.videoarch.object_data_access", "keyword": "oda"},
            {"psm": "toutiao.videoarch.video_data_access", "keyword": "vda"},
            {"psm": "toutiao.videoarch.vda_sync", "keyword": "sync"},
            {"psm": "bytedance.videoarch.compound", "keyword": "cpd"}
        ],
        "regions": [
            {
                "keyword": "boe",
                "domain": "cloud-boe.bytedance.net",
                "argos_args": ["boe"],
                "tcc_args": ["China-BOE"],
                "bytedoc_args": ["cloud_native", "BOE"],
                "bytedoc_home_args": ["?x-bc-region-id=bytedance&x-bc-vregion=China-BOE"],
                "fuxi_domain": ["vpaas-storage.sre-ttp-us.bytedance.net"],
                "fuxi_args": ["?_idc=useast8&_clu=default"],
                "grafana_domain": ["grafana.byted.org"],
                "grafana_args": ["&var-idc=Bytetsd-China-BOE&var-bosun=Bosun-China-BOE"]
            },
            {
                "keyword": "boei18n",
                "domain": "cloud-boe.tiktok-row.net",
                "argos_args": ["boei18n"],
                "tcc_args": ["BOEi18n"],
                "bytedoc_args": ["cloud_native", "BOEi18n"],
                "bytedoc_home_args": ["?x-bc-region-id=bytedance&x-bc-vregion=BOEi18n"],
                "fuxi_domain": ["vpaas-storage.sre-i18n.bytedance.net"],
                "fuxi_args": ["?_idc=useast8&_clu=default"],
                "grafana_domain": ["grafana-i18n.byted.org"],
                "grafana_args": ["&refresh=1m&var-idc=Bytetsd-BOEi18n&var-bosun=Bosun-BOEi18n"]
            },
            {
                "keyword": "cn",
                "domain": "cloud.bytedance.net",
                "argos_args": ["cn"],
                "tcc_args": ["China-North"],
                "bytedoc_args": ["CN"],
                "bytedoc_home_args": ["?x-bc-region-id=bytedance&x-bc-vregion=China-North"],
                "fuxi_domain": ["vpaas-storage.sre.bytedance.net"],
                "fuxi_args": ["?_idc=cn&_clu=default"],
                "grafana_domain": ["grafana.byted.org"],
                "grafana_args": [""]
            },
            {
                "keyword": "ce",
                "domain": "cloud.bytedance.net",
                "argos_args": ["ce"],
                "tcc_args": ["China-East"],
                "bytedoc_args": ["classic", "CN_EAST"],
                "bytedoc_home_args": ["?x-bc-region-id=bytedance&x-bc-vregion=China-East"],
                "fuxi_domain": ["vpaas-storage.sre.bytedance.net"],
                "fuxi_args": ["?_idc=ce&_clu=default"],
                "grafana_domain": ["grafana.byted.org"],
                "grafana_args": ["&var-idc=Bytetsd-China-East&var-bosun=Bosun-China-East"]
            },
            {
                "keyword": "sg",
                "domain": "cloud.tiktok-row.net",
                "argos_args": ["Singapore-Central"],
                "tcc_args": ["Singapore-Central"],
                "bytedoc_args": ["classic", "SG"],
                "bytedoc_home_args": ["?x-bc-region-id=bytedance&x-bc-vregion=Singapore-Central"],
                "fuxi_domain": ["vpaas-storage.sre-sg.bytedance.net"],
                "fuxi_args": ["?_idc=sg&_clu=default"],
                "grafana_domain": ["grafana-i18n.byted.org"],
                "grafana_args": ["&refresh=1m&var-idc=Bytetsd-Singapore-Central&var-bosun=Bosun-Singapore-Central"]
            },
            {
                "keyword": "va",
                "domain": "cloud.tiktok-row.net",
                "argos_args": ["US-East"],
                "tcc_args": ["US-East"],
                "bytedoc_args": ["classic", "MVAALI"],
                "bytedoc_home_args": ["?x-bc-region-id=bytedance&x-bc-vregion=US-East"],
                "fuxi_domain": ["vpaas-storage.sre-us.bytedance.net"],
                "fuxi_args": ["?_idc=maliva&_clu=default"],
                "grafana_domain": ["grafana-i18n.byted.org"],
                "grafana_args": ["&refresh=1m&var-idc=Bytetsd-US-East&var-bosun=Bosun-US-East"]
            },
            {
                "keyword": "gcp",
                "domain": "cloud-eu.tiktok-row.net",
                "argos_args": ["useast-red"],
                "tcc_args": ["US-EastRed"],
                "bytedoc_args": ["classic", "GCP"],
                "bytedoc_home_args": ["?x-bc-region-id=bytedance&x-bc-vregion=US-EastRed"],
                "fuxi_domain": ["vpaas-storage.sre-i18n.bytedance.net"],
                "fuxi_args": ["?_idc=useast2b&_clu=default"],
                "grafana_domain": ["grafana-i18n.byted.org"],
                "grafana_args": ["&refresh=1m&var-idc=Bytetsd-US-EastRed&var-bosun=Bosun-US-EastRed"]
            },
            {
                "keyword": "eu2",
                "domain": "cloud-eu.tiktok-row.net",
                "argos_args": ["EU-TTP2"],
                "tcc_args": ["EU-TTP2"],
                "bytedoc_args": ["classic", "EU-TTP2"],
                "bytedoc_home_args": ["?x-bc-region-id=bytedance&x-bc-vregion=EU-TTP2"],
                "fuxi_domain": ["vpaas-storage.sre-i18n.bytedance.net"],
                "fuxi_args": ["?_idc=euttp2&_clu=default"],
                "grafana_domain": ["grafana-i18n.byted.org"],
                "grafana_args": ["&refresh=1m&var-idc=Bytetsd-EU-TTP2&var-bosun=Bosun-EU-TTP2"]
            },
            {
                "keyword": "ttp1",
                "domain": "cloud-ttp-us.bytedance.net",
                "argos_args": ["US-TTP"],
                "tcc_args": ["US-TTP"],
                "bytedoc_args": ["classic", "OVA"],
                "bytedoc_home_args": ["?x-bc-region-id=bytedance&x-bc-vregion=US-TTP"],
                "fuxi_domain": ["vpaas-storage.sre-ttp-us.bytedance.net"],
                "fuxi_args": ["?_idc=useast5&_clu=default"],
                "grafana_domain": ["grafana-i18n.byted.org"],
                "grafana_args": ["&refresh=1m&var-idc=Bytetsd-US-TTP&var-bosun=Bosun-US-TTP"]
            },
            {
                "keyword": "ttp2",
                "domain": "cloud-ttp-us.bytedance.net",
                "argos_args": ["US-TTP2"],
                "tcc_args": ["US-TTP2"],
                "bytedoc_args": ["classic", "US-TTP2"],
                "bytedoc_home_args": ["?x-bc-region-id=bytedance&x-bc-vregion=US-TTP2"],
                "fuxi_domain": ["vpaas-storage.sre-ttp-us.bytedance.net"],
                "fuxi_args": ["?_idc=useast5&_clu=default"],
                "grafana_domain": ["grafana-i18n.byted.org"],
                "grafana_args": ["&refresh=1m&var-idc=Bytetsd-US-TTP2&var-bosun=Bosun-US-TTP2"]
            },
            {
                "keyword": "sinf",
                "domain": "cloud.sinf.net",
                "argos_args": ["ChinaSinf-North"],
                "tcc_args": ["SINFONLINE"],
                "bytedoc_args": ["EMPTY", "EMPTY"],
                "bytedoc_home_args": ["?x-bc-region-id=bytedance&x-bc-vregion=SINFONLINE"],
                "fuxi_domain": ["vpaas-storage.sre.sinf.net"],
                "fuxi_args": ["?_idc=sinfonline&_clu=default"],
                "grafana_domain": ["grafana.byted.org"],
                "grafana_args": ["&var-idc=Bytetsd-SINFONLINE&var-bosun=Bosun-SINFONLINE"]
            },
            {
                "keyword": "sinfi18n",
                "domain": "cloud-i18n.sinf.net",
                "argos_args": ["Asia-SouthEastBD"],
                "tcc_args": ["Asia-SouthEastBD"],
                "bytedoc_args": ["classic", "EMPTY"],
                "bytedoc_home_args": ["?x-bc-region-id=bytedance&x-bc-vregion=Asia-SouthEastBD"],
                "fuxi_domain": ["vpaas-storage.sre-i18n.sinf.net"],
                "fuxi_args": ["?_idc=mya&_clu=default"],
                "grafana_domain": ["grafana-i18n.byted.org"],
                "grafana_args": ["&refresh=1m&var-idc=Bytetsd-Asia-SouthEastBD&var-bosun=Bosun-Asia-SouthEastBD"]
            }
        ]
    },
    "pattern": [
        {
            "desc": "bytedoc home",
            "keyword": "bd",
            "params": [
                {
                    "name": "location",
                    "type": "select",
                    "values": "${[.var.regions[] | {keyword: .keyword, value: ([.domain, .bytedoc_args[0], .bytedoc_home_args])}]}"
                }
            ],
            "url": "https://${location}/bytedoc/${location}/home${location}"
        },
        {
            "desc": "bytedoc",
            "keyword": "bd",
            "params": [
                {
                    "name": "location",
                    "type": "select",
                    "values": "${[.var.regions[] | {keyword: .keyword, value: ([.domain] + .bytedoc_args)}]}"
                },
                {
                    "name": "db",
                    "type": "select",
                    "values": [
                        {"keyword": "vd","value": ["video_delete"]},
                        {"keyword": "rt","value": ["oda_route_table"]},
                        {"keyword": "oda","value": ["object_data_access"]},
                        {"keyword": "oda0","value": ["object_data_access_0"]},
                        {"keyword": "oda1","value": ["object_data_access_1"]},
                        {"keyword": "oda2","value": ["object_data_access_2"]},
                        {"keyword": "oda3","value": ["object_data_access_3"]},
                        {"keyword": "oda4","value": ["object_data_access_4"]},
                        {"keyword": "oda5","value": ["object_data_access_5"]},
                        {"keyword": "oda6","value": ["object_data_access_6"]},
                        {"keyword": "oda7","value": ["object_data_access_7"]},
                        {"keyword": "oda8","value": ["object_data_access_8"]},
                        {"keyword": "oda9","value": ["object_data_access_9"]},
                        {"keyword": "odat","value": ["object_data_access_tob"]},
                        {"keyword": "odat0","value": ["object_data_access_tob_0"]},
                        {"keyword": "odat1","value": ["object_data_access_tob_1"]},
                        {"keyword": "odat2","value": ["object_data_access_tob_2"]},
                        {"keyword": "odat3","value": ["object_data_access_tob_3"]},
                        {"keyword": "odat4","value": ["object_data_access_tob_4"]},
                        {"keyword": "odat5","value": ["object_data_access_tob_5"]},
                        {"keyword": "odat6","value": ["object_data_access_tob_6"]},
                        {"keyword": "odat7","value": ["object_data_access_tob_7"]},
                        {"keyword": "odat8","value": ["object_data_access_tob_8"]},
                        {"keyword": "odat9","value": ["object_data_access_tob_9"]}
                    ]
                }
            ],
            "url": "https://${location}/bytedoc/${location}/database/${db}/overview?region=${location}"
        },
        {
            "desc": "argos",
            "keyword": "a",
            "params": [
                {
                    "name": "location",
                    "type": "select",
                    "values": "${[.var.regions[] | {keyword: .keyword, value: ([.domain] + .argos_args)}]}"
                },
                {
                    "name": "psm",
                    "type": "select",
                    "values": "${[.var.srvs[] | {keyword: .keyword, value: [.psm]}]}"
                }
            ],
            "url": "https://${location}/argos/overview/server_overview?from=now-6h&psm=${psm}&region=${location}"
        },
        {
            "desc": "tcc",
            "keyword": "tcc",
            "params": [
                {
                    "name": "location",
                    "type": "select",
                    "values": "${[.var.regions[] | {keyword: .keyword, value: ([.domain] + .tcc_args)}]}"
                },
                {
                    "name": "psm",
                    "type": "select",
                    "values": "${[.var.srvs[] | {keyword: .keyword, value: [.psm]}]}"
                }
            ],
            "url": "https://${location}/tcc/namespace/${psm}?dir_path=%2Fdefault&region=${location}&rn=100&scope=all"
        },
        {
            "desc": "trace log",
            "keyword": "tid",
            "params": [
                {
                    "name": "location",
                    "type": "select",
                    "values": "${[.var.regions[] | {keyword: .keyword, value: ([.domain] + .argos_args)}]}"
                },
                {
                    "name": "trace_id",
                    "type": "input"
                }
            ],
            "url": "https://${location}/argos/trace/retrieve/logIdRetrieve?curTimeShift=600&logId=${trace_id}&log_search=true&page=log&region=${location}"
        },
        {
            "desc": "argos log",
            "keyword": "log",
            "params": [
                {
                    "name": "location",
                    "type": "select",
                    "values": "${[.var.regions[] | {keyword: .keyword, value: ([.domain] + .argos_args)}]}"
                },
                {
                    "name": "psm",
                    "type": "select",
                    "values": "${[.var.srvs[] | {keyword: .keyword, value: [.psm]}]}"
                },
                {
                    "name": "query",
                    "type": "input"
                }
            ],
            "url": "https://${location}/argos/streamlog/info_overview/keyword_search?end_time=now&psm=${psm}&region=${location}&start_time=now-1h&patterns=${query}"
        },
        {
            "desc": "fuxi schema",
            "keyword": "fuxi",
            "params": [
                {
                    "name": "location",
                    "type": "select",
                    "values": "${[.var.regions[] | {keyword: .keyword, value: ([.fuxi_domain] + .fuxi_args)}]}"
                }
            ],
            "url": "${location}/serviceArch/vdaSync/fuxiAdmin/schemas"
        },
        {
            "desc": "grafana monitor",
            "keyword": "grafana",
            "params": [
                {
                    "name": "location",
                    "type": "select",
                    "values": "${[.var.regions[] | {keyword: .keyword, value: ([.grafana_domain] + .grafana_args)}]}"
                },
                {
                    "name": "dashboard",
                    "type": "select",
                    "values": [
                        {
                            "keyword": "vda",
                            "value": ["000003219", "shi-pin-jia-gou-video_data_accessshu-ju-ceng-fu-wu"]
                        },
                        {
                            "keyword": "oda",
                            "value": ["8BcAdr27k", "oda-odm-jian-kong-da-pan"]
                        },
                        {
                            "keyword": "fuxi",
                            "value": ["Sz9J7uCHk", "fuxi-odada-pan-jian-kong"]
                        }
                    ]
                }
            ],
            "url": "https://${location}/d/${dashboard}/${dashboard}?orgId=1${location}"
        }
    ]
};

let cfg = jvr.resolve(defaultCfg)

async function loadConfig() {
    try {
        // jest-chrome not support storage session API
        if (!inTest()) {
            chrome.storage.session.set({defaultCfg: JSON.stringify(defaultCfg, null, 4)})
            const result = await chrome.storage.local.get(['userConfig']);
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

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.userConfig) {
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
