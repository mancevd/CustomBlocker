// Manifest V3 Service Worker Background Script
// Import required scripts
importScripts(
    'db/DbObj.js',
    'db/Rule.js',
    'db/Word.js'
);

var initDone = false;
var existingTabs = new Array();
var tabBadgeMap = new Array();
var ruleList = [];

// Storage management - using chrome.storage.sync instead of WebSQL
var cbStorage = {
    sync: function(changes, namespace, callback) {
        console.log("Storage sync");
        if (callback) callback();
    },
    loadAll: function(callback) {
        chrome.storage.sync.get(null, (allObj) => {
            console.log("Loading all rules from storage", allObj);
            var rules = [];
            for (var key in allObj) {
                if (key.indexOf("R-") == 0) {
                    try {
                        var rule = JSON.parse(allObj[key]);
                        rules.push(rule);
                    } catch(e) {
                        console.error("Error parsing rule", e);
                    }
                }
            }
            callback(rules, []);
        });
    }
};

function onStartBackground() {
    loadLists();
}

function loadLists() {
    cbStorage.loadAll(function(rules, groups) {
        ruleList = rules;
        console.log("Loaded rules:", ruleList.length);
    });
}

function removeFromExistingTabList(tabIdToRemove) {
    for (var id in existingTabs) {
        if (tabIdToRemove == id)
            existingTabs[id] = null;
    }
}

function addToExistingTabList(tabIdToAdd) {
    existingTabs[tabIdToAdd] = true;
}

function reloadLists() {
    console.log("reloadLists");
    loadLists();
}

function openRulePicker(selectedRule) {
    var status = (selectedRule) ? 'edit' : 'create';
    try {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            if (!tabs || tabs.length === 0) return;
            var tab = tabs[0];
            var tabInfo = tabMap[tab.id];
            if (!tabInfo) {
                return;
            }
            var appliedRules = (tabInfo) ? tabInfo.appliedRules : [];
            tabInfo.postMessage({
                command: 'ruleEditor',
                rule: selectedRule,
                appliedRuleList: appliedRules
            });
        });
    }
    catch (ex) {
        console.log(ex);
    }
}

// Update from chrome.extension.onRequest to chrome.runtime.onMessage
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.command == "requestRules") {
        tabOnUpdate(sender.tab.id, null, sender.tab);
    }
    return false;
});

var CustomBlockerTab = (function () {
    function CustomBlockerTab(tabId, tab) {
        this.tabId = tab.id;
        this.url = tab.url;
        this.appliedRules = [];
        this.port = chrome.tabs.connect(tabId, {});
        var self = this;
        this.port.onMessage.addListener(function (msg) {
            self.onMessage(msg);
        });
    }
    CustomBlockerTab.prototype.execCallbackDb = function (param) {
        console.log("TODO execCallbackDb");
    };
    CustomBlockerTab.prototype.execCallbackSetApplied = function (param) {
        this.appliedRules = param.list;
        var iconPath = "icon/" + ((this.appliedRules.length > 0) ? 'icon.png' : 'icon_disabled.png');
        try {
            chrome.action.setIcon({
                path: iconPath,
                tabId: this.tabId
            });
        }
        catch (ex) {
            console.log(ex);
        }
    };
    CustomBlockerTab.prototype.execCallbackBadge = function (param) {
        var count = param.count;
        try {
            var badgeText = '' + count;
            tabBadgeMap[this.tabId] = badgeText;

            // Check if badge is disabled using chrome.storage instead of localStorage
            chrome.storage.local.get(['badgeDisabled'], function(result) {
                if (result.badgeDisabled != "true") {
                    chrome.action.setBadgeText({
                        text: badgeText,
                        tabId: param.tabId
                    });
                }
            });

            chrome.action.setTitle({
                title: getBadgeTooltipString(count),
                tabId: this.tabId
            });
            this.appliedRules = param.rules;
        }
        catch (ex) {
            console.log(ex);
        }
    };
    CustomBlockerTab.prototype.postMessage = function (message) {
        try {
            this.port.postMessage(message);
        }
        catch (e) {
            console.log(e);
        }
    };
    CustomBlockerTab.prototype.onMessage = function (message) {
        console.log("onMessage");
        console.log(message);
        switch (message.command) {
            case 'badge':
                this.execCallbackBadge(message.param);
                break;
            case 'setApplied':
                this.execCallbackSetApplied(message.param);
                break;
            case 'notifyUpdate':
                this.execCallbackDb(message.param);
                break;
        }
    };
    CustomBlockerTab.postMessage = function (tabId, message) {
        var tabInfo = tabMap[tabId];
        if (!tabInfo) {
            console.log("CustomBlockerTab.postMessage tab not found.");
            return;
        }
        tabInfo.postMessage(message);
    };
    CustomBlockerTab.postMessageToAllTabs = function (message) {
        for (var tabId in tabMap) {
            CustomBlockerTab.postMessage(tabId, message);
        }
    };
    return CustomBlockerTab;
}());

var tabMap = {};

var tabOnUpdate = function (tabId, changeInfo, tab) {
    addToExistingTabList(tabId);

    chrome.storage.local.get(['blockDisabled'], function(result) {
        var isDisabled = ('true' == result.blockDisabled);
        _setIconDisabled(isDisabled, tabId);

        if (isDisabled) {
            return;
        }

        var url = tab.url;
        if (isValidURL(url)) {
            tabMap[tabId] = new CustomBlockerTab(tabId, tab);
            tabMap[tabId].postMessage({
                command: 'init',
                rules: ruleList,
                tabId: tabId
            });
        }
    });
};

var VALID_URL_REGEX = new RegExp('^https?:');
function isValidURL(url) {
    return url != null && VALID_URL_REGEX.test(url);
}

function getForegroundCallback(tabId) {
    return function (param) {
    };
}

function handleForegroundMessage(tabId, param) {
    console.log("Foreground message received.");
    console.log(param);
    if (!param)
        return;
    var useCallback = false;
    switch (param.command) {
        case 'badge':
            break;
        case 'setApplied':
            break;
        case 'notifyUpdate':
            break;
    }
}

function getAppliedRules(callback) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        try {
            if (!tabs || tabs.length === 0) {
                callback([]);
                return;
            }
            var tab = tabs[0];
            var appliedRules = (tabMap[tab.id]) ? tabMap[tab.id].appliedRules : [];
            callback(appliedRules);
        }
        catch (ex) {
            console.log(ex);
        }
    });
}

var smartRuleEditorSrc = '';
function loadSmartRuleEditorSrc() {
    // Use fetch instead of XMLHttpRequest (not available in service workers)
    var locale = chrome.i18n.getMessage("extLocale");
    fetch(chrome.runtime.getURL('/smart_rule_editor_' + locale + '.html'))
        .then(response => response.text())
        .then(text => {
            smartRuleEditorSrc = text;
        })
        .catch(error => {
            console.error("Error loading smart rule editor:", error);
        });
}

// Tab event listeners
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    removeFromExistingTabList(tabId);
    tabMap[tabId] = null;
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
    var tabId = activeInfo.tabId;
    for (var _index in existingTabs) {
        var tabIdToDisable = parseInt(_index);
        if (tabIdToDisable && tabIdToDisable != tabId) {
            CustomBlockerTab.postMessage(tabIdToDisable, { command: 'stop' });
        }
    }

    chrome.storage.local.get(['blockDisabled', 'badgeDisabled'], function(result) {
        try {
            if ('true' == result.blockDisabled) {
            }
            else {
                var appliedRules = (tabMap[tabId]) ? tabMap[tabId].appliedRules : [];
                var applied = appliedRules.length > 0;
                var iconPath = "icon/" + ((applied) ? 'icon.png' : 'icon_disabled.png');
                chrome.action.setIcon({
                    path: iconPath,
                    tabId: tabId
                });
            }
            CustomBlockerTab.postMessage(tabId, { command: 'resume' });
            if (tabBadgeMap[tabId]) {
                if (result.badgeDisabled != "true") {
                    chrome.action.setBadgeText({
                        text: tabBadgeMap[tabId],
                        tabId: tabId
                    });
                }
            }
        }
        catch (ex) {
            console.log(ex);
        }
    });
});

function setIconDisabled(isDisabled) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        if (tabs && tabs.length > 0) {
            _setIconDisabled(isDisabled, tabs[0].id);
        }
    });
}

function _setIconDisabled(isDisabled, tabId) {
    chrome.storage.local.get(['badgeDisabled'], function(result) {
        if (result.badgeDisabled != "true") {
            chrome.action.setBadgeText({
                text: (isDisabled) ? 'OFF' : '',
                tabId: tabId
            });
        }

        var iconPath = "icon/" + ((isDisabled) ? 'icon_disabled.png' : 'icon.png');
        chrome.action.setIcon({
            path: iconPath,
            tabId: tabId
        });
    });
}

function highlightRuleElements(rule) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        if (tabs && tabs.length > 0) {
            CustomBlockerTab.postMessage(tabs[0].id, {
                command: 'highlight',
                rule: rule
            });
        }
    });
}

function getBadgeTooltipString(count) {
    if (count > 1)
        return chrome.i18n.getMessage("tooltipCount").replace("__count__", count);
    else
        return chrome.i18n.getMessage("tooltipCountSingle");
}

function menuCreateOnRightClick(info, tab) {
    sendQuickRuleCreationRequest(info, tab, true);
}

function menuAddOnRightClick(info, tab) {
    sendQuickRuleCreationRequest(info, tab, false);
}

function sendQuickRuleCreationRequest(info, tab, needSuggestion) {
    var appliedRules = (tabMap[tab.id]) ? tabMap[tab.id].appliedRules : [];
    CustomBlockerTab.postMessage(tab.id, {
        command: 'quickRuleCreation',
        src: smartRuleEditorSrc,
        appliedRuleList: appliedRules,
        selectionText: info.selectionText,
        needSuggestion: needSuggestion
    });
}

// Create context menus (without onclick, use onClicked instead)
chrome.contextMenus.create({
    id: "createRule",
    title: chrome.i18n.getMessage('menuCreateRule'),
    contexts: ["selection"]
});

chrome.contextMenus.create({
    id: "addToExistingRule",
    title: chrome.i18n.getMessage('menuAddToExistingRule'),
    contexts: ["selection"]
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId === "createRule") {
        menuCreateOnRightClick(info, tab);
    } else if (info.menuItemId === "addToExistingRule") {
        menuAddOnRightClick(info, tab);
    }
});

chrome.runtime.onInstalled.addListener(function (details) {
    console.log("reason=" + details.reason);
    console.log("previousVersion=" + details.previousVersion);

    var locale = chrome.i18n.getMessage("extLocale");

    if ("install" == details.reason) {
        console.log("New install.");
        chrome.tabs.create({
            url: chrome.runtime.getURL('/welcome_install_' + locale + '.html?install')
        });
    }
    else if (details.reason == "update" && details.previousVersion && details.previousVersion.match(/^[2-4]\./)) {
        chrome.tabs.create({
            url: chrome.runtime.getURL('/welcome_' + locale + '.html')
        });
    }

    // Initialize on install
    onStartBackground();
    loadSmartRuleEditorSrc();
});

// Tab update listener
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        tabOnUpdate(tabId, changeInfo, tab);
    }
});

// Storage change listener
chrome.storage.onChanged.addListener(function (changes, namespace) {
    cbStorage.sync(changes, namespace, function () {
        cbStorage.loadAll(function (rules, groups) {
            CustomBlockerTab.postMessageToAllTabs({ command: 'reload', rules: rules });
        });
    });
});

// Initialize on service worker startup
onStartBackground();
loadSmartRuleEditorSrc();
