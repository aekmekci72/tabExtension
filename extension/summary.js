document.addEventListener('DOMContentLoaded', function () {
    chrome.storage.local.get(['tabTimes', 'sessionDuration'], ({ tabTimes, sessionDuration }) => {
        const summaryContent = document.getElementById('summaryContent');
        let summaryHtml = `<p>Total Session Duration: ${sessionDuration / 1000} seconds</p><ul>`;
        
        for (const tabId in tabTimes) {
            const { title, time } = tabTimes[tabId];
            summaryHtml += `<li>${title}: ${time / 1000} seconds</li>`;
        }
        
        summaryHtml += '</ul>';
        summaryContent.innerHTML = summaryHtml;
    });
});