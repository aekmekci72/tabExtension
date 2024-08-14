document.addEventListener('DOMContentLoaded', function () {
    chrome.storage.local.get(['tabTimes', 'sessionDuration'], ({ tabTimes, sessionDuration }) => {
        const summaryContent = document.getElementById('summaryContent');
        let summaryHtml = `<p>Total Session Duration: ${sessionDuration / 1000} seconds</p><ul>`;

        let allowedTime = 0;
        let unallowedTime = 0;

        for (const tabId in tabTimes) {
            const { title, time, allowed } = tabTimes[tabId];
            summaryHtml += `<li>${title} (${allowed ? 'Allowed' : 'Not Allowed'}): ${time / 1000} seconds</li>`;
            if (allowed) {
                allowedTime += time;
            } else {
                unallowedTime += time;
            }
        }

        summaryHtml += '</ul>';
        summaryContent.innerHTML = summaryHtml;

        drawPieChart(allowedTime, unallowedTime);
    });
});

function drawPieChart(allowedTime, unallowedTime) {
    const canvas = document.getElementById('piechart');
    const ctx = canvas.getContext('2d');
    const total = allowedTime + unallowedTime;
    const allowedPercentage = allowedTime / total;
    const unallowedPercentage = unallowedTime / total;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.moveTo(150, 150);
    ctx.arc(150, 150, 150, 0, 2 * Math.PI * allowedPercentage);
    ctx.fillStyle = '#4caf50';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(150, 150); 
    ctx.arc(150, 150, 150, 2 * Math.PI * allowedPercentage, 2 * Math.PI);
    ctx.fillStyle = '#f44336';
    ctx.fill();

    drawLegend(allowedTime, unallowedTime);
}

function drawLegend(allowedTime, unallowedTime) {
    const legend = document.getElementById('legend');
    legend.innerHTML = `
        <div style="display: flex; align-items: center;">
            <div style="width: 20px; height: 20px; background-color: #4caf50; margin-right: 8px;"></div>
            <span>Allowed Tabs: ${allowedTime / 1000} seconds</span>
        </div>
        <div style="display: flex; align-items: center;">
            <div style="width: 20px; height: 20px; background-color: #f44336; margin-right: 8px;"></div>
            <span>Unallowed Tabs: ${unallowedTime / 1000} seconds</span>
        </div>
    `;
}