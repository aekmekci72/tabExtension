// popup.js
document.addEventListener('DOMContentLoaded', function () {
    const startSessionButton = document.getElementById('startSession');
    const endSessionButton = document.getElementById('endSession');
    const aboutButton = document.getElementById('about');

    function updateButtonVisibility(isSessionActive) {
        startSessionButton.style.display = isSessionActive ? 'none' : 'inline-block';
        endSessionButton.style.display = isSessionActive ? 'inline-block' : 'none';
    }

    chrome.runtime.sendMessage({ type: 'GET_SESSION_STATUS' }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Error getting session status:", chrome.runtime.lastError);
        } else {
            updateButtonVisibility(response.isSessionActive);
        }
    });

    startSessionButton.addEventListener('click', function () {
        chrome.runtime.sendMessage({ type: 'OPEN_TAB_SELECTION' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Error opening tab selection:", chrome.runtime.lastError);
            }
        });
    });

    endSessionButton.addEventListener('click', function () {
        chrome.runtime.sendMessage({ type: 'END_SESSION' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Error ending session:", chrome.runtime.lastError);
            }
        });
    });

    aboutButton.addEventListener('click', function () {
        chrome.windows.create({
            url: chrome.runtime.getURL('about.html'),
            type: 'popup',
            width: 400,
            height: 500
        });
    });
});