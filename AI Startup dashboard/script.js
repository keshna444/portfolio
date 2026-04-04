let healthChartInstance = null;
let challengesChartInstance = null;

// =========================================================================
// 1. GUARANTEED DATA (Hardcoded directly into the file to bypass blocks)
// =========================================================================
const startups = [
    { name: "startup 1", health: "Growth", risk: "Medium", challenge: "Talent Acq", update: "Successfully onboarded 3 new enterprise clients." },
    { name: "startup 2", health: "Needs Attention", risk: "High", challenge: "Funding/Capital", update: "Expanded core engineering team, but extending runway." },
    { name: "ABC", health: "Stable", risk: "Low", challenge: "Scaling Infrastructure", update: "Steady month-over-month usage growth." },
    { name: "Aqualand", health: "Stable", risk: "Medium", challenge: "Data Acquisition", update: "Secured new local data partnership." }
];

// =========================================================================
// 2. RENDER THE DASHBOARD
// =========================================================================
function buildDashboard(startups) {
    
    // --- A. Sync Summary Cards ---
    let total = startups.length;
    let growthCount = startups.filter(s => s.health === "Growth").length;
    let stableCount = startups.filter(s => s.health === "Stable").length;
    let attentionCount = startups.filter(s => s.health === "Needs Attention").length;

    document.getElementById('total-alumni').innerText = total;
    document.getElementById('growth-count').innerText = growthCount;
    document.getElementById('stable-count').innerText = stableCount;
    document.getElementById('attention-count').innerText = attentionCount;

    // --- B. Populate Table ---
    const tableBody = document.getElementById('startupTableBody');
    if(tableBody) {
        tableBody.innerHTML = ""; 
        startups.forEach(startup => {
            const healthClass = startup.health === 'Growth' ? 'badge-growth' : 
                               startup.health === 'Stable' ? 'badge-stable' : 'badge-attention';
            const riskClass = startup.risk === 'High' ? 'badge-risk-high' : 'badge-risk-low';
    
            tableBody.innerHTML += `<tr>
                <td style="font-weight: 600;">${startup.name}</td>
                <td><span class="badge ${healthClass}">${startup.health}</span></td>
                <td><span class="badge ${riskClass}">${startup.risk}</span></td>
                <td style="font-weight: 500;">${startup.challenge}</td>
                <td style="color: #64748b;">${startup.update}</td>
            </tr>`;
        });
    }

    // --- C. Configure Charts ---
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    Chart.defaults.color = '#475569';

    // 1. Doughnut Chart
    const canvasHealth = document.getElementById('healthChart');
    if (canvasHealth) {
        const ctxHealth = canvasHealth.getContext('2d');
        if(healthChartInstance) healthChartInstance.destroy();
        healthChartInstance = new Chart(ctxHealth, {
            type: 'doughnut',
            data: {
                labels: ['Growth', 'Stable', 'Needs Attention'],
                datasets: [{
                    data: [growthCount, stableCount, attentionCount],
                    backgroundColor: ['#4ade80', '#2563eb', '#6d28d9'], 
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: { legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } } }
            }
        });
    }

    // 2. Bar Chart
    let challengeCounts = {};
    startups.forEach(s => {
        let cleanChallenge = s.challenge; 
        if (cleanChallenge !== "" && cleanChallenge !== "None Reported") {
            if (challengeCounts[cleanChallenge] !== undefined) {
                challengeCounts[cleanChallenge]++;
            } else {
                challengeCounts[cleanChallenge] = 1;
            }
        }
    });

    const dynamicLabels = Object.keys(challengeCounts);
    const dynamicData = Object.values(challengeCounts);

    const canvasChallenges = document.getElementById('challengesChart');
    if (canvasChallenges) {
        const ctxChallenges = canvasChallenges.getContext('2d');
        if(challengesChartInstance) challengesChartInstance.destroy();
        challengesChartInstance = new Chart(ctxChallenges, {
            type: 'bar',
            data: {
                labels: dynamicLabels.length > 0 ? dynamicLabels : ['Waiting for data...'],
                datasets: [{
                    label: 'Entities Reporting',
                    data: dynamicData.length > 0 ? dynamicData : [],
                    backgroundColor: '#6d28d9', 
                    borderRadius: 4,
                    barThickness: 45
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1 } },
                    x: { grid: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
}

// =========================================================================
// 3. START THE DASHBOARD
// =========================================================================
// Because the data is inside the file, we can just run it instantly!
buildDashboard(startups);