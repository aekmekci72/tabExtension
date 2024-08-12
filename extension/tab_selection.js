document.addEventListener('DOMContentLoaded', function () {
    const tabList = document.getElementById('tabList');
    const startSessionButton = document.getElementById('startSession');

    if (!tabList || !startSessionButton) {
        console.error('Required elements not found in tab_selection.html');
        return;
    }

    chrome.tabs.query({}, function (tabs) {
        tabs.forEach(function (tab) {
            const tabDiv = document.createElement('div');
            tabDiv.innerHTML = `
                <input type="checkbox" id="tab-${tab.id}" value="${tab.id}">
                <label for="tab-${tab.id}">${tab.title}</label>
            `;
            tabList.appendChild(tabDiv);
        });
    });

    startSessionButton.addEventListener('click', function () {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
        const allowedTabs = Array.from(checkboxes).map(cb => {
            const tabId = parseInt(cb.value);
            const tabTitle = cb.nextElementSibling.textContent;
            return { id: tabId, title: tabTitle };
        });

        if (allowedTabs.length > 0) {
            chrome.runtime.sendMessage({ type: 'START_SESSION', tabs: allowedTabs }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error starting session:", chrome.runtime.lastError);
                }
            });
        } else {
            console.error('No tabs selected for the session.');
        }

        window.close();
    });
});