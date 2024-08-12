console.log('Content script loaded');

let isRequestingSessionStatus = false;

function requestSessionStatus() {
    if (document.readyState === 'complete') {
        if (!isRequestingSessionStatus) {
            isRequestingSessionStatus = true;
            chrome.runtime.sendMessage({ type: 'GET_SESSION_STATUS' }, (response) => {
                isRequestingSessionStatus = false;
                if (chrome.runtime.lastError) {
                    console.error("Error in response:", chrome.runtime.lastError);
                    handleInvalidExtensionContext();
                } else {
                    console.log("Received response from background script:", response);
                }
            });
        }
    } else {
        console.warn("Document is not ready. Skipping requestSessionStatus.");
        setTimeout(requestSessionStatus, 1000);
    }
}

window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data.type) return;
    if (event.data.type === 'END_SESSION') {
        chrome.runtime.sendMessage({type: 'END_SESSION'}, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error ending session:', chrome.runtime.lastError);
            } else {
                console.log('Session ended:', response);
                window.postMessage({
                    type: 'SESSION_ENDED',
                    tabTimes: response.tabTimes,
                    sessionDuration: response.sessionDuration
                }, '*');
            }
        });
    }
    else{
    chrome.runtime.sendMessage(event.data, (response) => {
        if (chrome.runtime.lastError) {
            console.error(`Error sending ${event.data.type} message:`, chrome.runtime.lastError);
        } else {
            console.log(`${event.data.type} message sent successfully`);
        }
    });
    }
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received from background:', message);
    switch (message.type) {
        case 'ALLOWED_TABS':
            window.postMessage({ type: 'ALLOWED_TABS', tabs: message.tabs }, '*');
            break;
        case 'SHOW_CONFIRMATION':
            const confirmed = confirm("You are trying to switch to a tab that is not allowed. Do you want to proceed?");
            sendResponse({ confirmed: confirmed });
            return true;
        case 'SESSION_ENDED':
            window.postMessage({ 
                type: 'SESSION_ENDED', 
                tabTimes: message.tabTimes, 
                sessionDuration: message.sessionDuration 
            }, '*');
            break;
        default:
            console.warn('Unknown message type received:', message.type);
    }
});

document.addEventListener('readystatechange', () => {
    if (document.readyState === 'complete') {
        requestSessionStatus();
    }
});

let debounceTimeout;
document.addEventListener('visibilitychange', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        if (!document.hidden && document.readyState === 'complete') {
            requestSessionStatus();
        }
    }, 100);
});

function handleInvalidExtensionContext() {
    console.warn('Extension context invalidated. Retrying...');
    setTimeout(requestSessionStatus, 1000);
}

try {
    requestSessionStatus();
} catch (error) {
    console.error("Error calling requestSessionStatus:", error);
    handleInvalidExtensionContext();
}