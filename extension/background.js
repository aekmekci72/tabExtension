let allowedTabs = [];
let isSessionActive = false;
let previousTabId = null;
let tabTimes = {};
let sessionStartTime;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received in background:', message);

    switch (message.type) {
        case 'START_SESSION':
            isSessionActive = true;
            allowedTabs = message.tabs || [];
            sessionStartTime = Date.now();
            tabTimes = {};
            monitorTabs();
            sendResponse({ status: 'Session started' });
            break;
        case 'END_SESSION':
            endSession(sendResponse);
            break;
        case 'OPEN_TAB_SELECTION':
            chrome.windows.create({
                url: chrome.runtime.getURL('tab_selection.html'),
                type: 'popup',
                width: 300,
                height: 400
            }, (window) => {
                if (chrome.runtime.lastError) {
                    console.error("Error opening popup:", chrome.runtime.lastError);
                    sendResponse({ status: 'Error opening popup' });
                } else {
                    sendResponse({ status: 'Popup opened', windowId: window.id });
                }
            });
            break;
        case 'GET_SESSION_STATUS':
            sendResponse({ isSessionActive });
            break;
        default:
            sendResponse({ status: 'Unknown message type' });
            break;
    }

    return true;
});

function monitorTabs() {
    chrome.tabs.onActivated.addListener(checkActiveTab);
    chrome.tabs.onUpdated.addListener(checkUpdatedTab);
}

function checkActiveTab(activeInfo) {
    console.log("Tab activated:", activeInfo.tabId);
    if (!isSessionActive) return;

    const now = Date.now();
    if (previousTabId && tabTimes[previousTabId]) {
        tabTimes[previousTabId].time += now - tabTimes[previousTabId].startTime;
        tabTimes[previousTabId].startTime = now;
    }

    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (chrome.runtime.lastError || !tab) {
            console.error("Error retrieving tab:", chrome.runtime.lastError);
            return;
        }

        if (!tabTimes[tab.id]) {
            tabTimes[tab.id] = {
                title: tab.title,
                time: 0,
                allowed: allowedTabs.some(allowedTab => allowedTab.id === tab.id),
                startTime: now
            };
        } else {
            tabTimes[tab.id].time += now - tabTimes[tab.id].startTime;
            tabTimes[tab.id].startTime = now;
        }
        previousTabId = tab.id;

        if (!tabTimes[tab.id].allowed) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: showConfirmation
            }, (results) => {
                if (chrome.runtime.lastError) {
                    console.error("Error sending message to content script:", chrome.runtime.lastError);
                    return;
                }

                if (results && results[0] && results[0].result) {
                    if (results[0].result.confirmed) {
                        previousTabId = tab.id;
                    } else {
                        if (previousTabId) {
                            chrome.tabs.update(previousTabId, { active: true }, () => {
                                if (chrome.runtime.lastError) {
                                    console.error("Error updating tab:", chrome.runtime.lastError);
                                }
                            });
                        } else {
                            chrome.tabs.update(allowedTabs[0].id, { active: true }, () => {
                                if (chrome.runtime.lastError) {
                                    console.error("Error updating tab:", chrome.runtime.lastError);
                                }
                            });
                        }
                    }
                }
            });
        }
    });
}

function checkUpdatedTab(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        checkActiveTab({ tabId });
    }
}

function showConfirmation() {
    const confirmed = confirm("You are trying to switch to a tab that is not allowed. Do you want to proceed?");
    return { confirmed: confirmed };
}

function endSession(sendResponse) {
    isSessionActive = false;
    chrome.tabs.onActivated.removeListener(checkActiveTab);
    chrome.tabs.onUpdated.removeListener(checkUpdatedTab);

    const sessionDuration = Date.now() - sessionStartTime;

    // Add time for the last tab if needed
    if (previousTabId && tabTimes[previousTabId]) {
        tabTimes[previousTabId].time += Date.now() - tabTimes[previousTabId].startTime;
    }

    // Verify that time is being tracked correctly
    console.log('Tab Times:', tabTimes);
    console.log('Session Duration:', sessionDuration);

    openSummaryPopup(tabTimes, sessionDuration);
    sendResponse({ status: 'Session ended', tabTimes, sessionDuration });
}



function openSummaryPopup(tabTimes, sessionDuration) {
    const summaryUrl = chrome.runtime.getURL('summary.html');
    chrome.windows.create({
        url: summaryUrl,
        type: 'popup',
        width: 400,
        height: 500
    }, (window) => {
        if (chrome.runtime.lastError) {
            console.error("Error opening summary popup:", chrome.runtime.lastError);
        } else {
            chrome.storage.local.set({ tabTimes, sessionDuration });
        }
    });
}