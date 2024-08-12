document.addEventListener('DOMContentLoaded', function () {
    const startSessionButton = document.getElementById('startSession');
    const endSessionButton = document.getElementById('endSession');
    const aboutButton = document.getElementById('about');

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
            } else {
            }
        });
    });
    
    aboutButton.addEventListener('click', function () {
        alert('FocusWeb helps you manage your browsing sessions efficiently.');
    });
});