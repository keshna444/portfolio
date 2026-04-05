let healthChartInstance = null;
let challengesChartInstance = null;

// =========================================================================
// 1. DATA SOURCE: Your Exact Google Sheets Link
// =========================================================================
const sheetCsvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSzLxNeCo73TOl3Es1ThkQhJesfYRON-YxjUwsDe3oupXXp6TMSL6jr4qNOwmyAZrZwhLA54CIzv5cV/pub?output=csv";

// =========================================================================
// 2. THE CACHE BUSTER & FETCH LOGIC
// =========================================================================
// This adds a random timestamp to the end of your link so the browser CANNOT cache it
const bypassCacheUrl = sheetCsvUrl + "&ignoreCache=" + new Date().getTime();

// Use the browser's native fetch tool for a stronger connection
fetch(bypassCacheUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error("Google Sheets rejected the connection. Status: " + response.status);
        }
        return response.text(); // Get the raw CSV text
    })
    .then(csvText => {
        // Hand the raw text over to PapaParse to organize it
        Papa.parse(csvText, {
            header: true,
            complete: function(results) {
                try {
                    // Filter out empty rows
                    const validData = results.data.filter(row => Object.values(row).join("").trim() !== "");
                    
                    const startups = validData.map(row => {
                        const keys = Object.keys(row);
                        
                        // Fuzzy Match Columns
                        const nameKey      = keys.find(k => k.toLowerCase().includes("startup name"));
                        const statusKey    = keys.find(k => k.toLowerCase().includes("status index"));
                        const riskKey      = keys.find(k => k.toLowerCase().includes("venture risk"));
                        const challengeKey = keys.find(k => k.toLowerCase().includes("roadblock") || k.toLowerCase().includes("challenge"));
                        const updateKey    = keys.find(k => k.toLowerCase().includes("details") || k.toLowerCase().includes("update"));
                        
                        let startupNameField = nameKey && row[nameKey] ? row[nameKey].trim() : "Unknown Startup"; 
                        let statusField      = statusKey && row[statusKey] ? row[statusKey].trim() : "Stable";
                        let riskField        = riskKey && row[riskKey] ? row[riskKey].trim() : "Low";
                        let challengeField   = challengeKey && row[challengeKey] ? row[challengeKey].trim() : "None Reported";
                        let updateField      = updateKey && row[updateKey] ? row[updateKey].trim() : "No recent updates provided.";

                        // Normalize for charts
                        let formattedHealth = "Stable";
                        if (statusField.toLowerCase().includes("growth")) formattedHealth = "Growth";
                        if (statusField.toLowerCase().includes("attention")) formattedHealth = "Needs Attention";

                        let formattedRisk = "Low";
                        if (riskField.toLowerCase().includes("high")) formattedRisk = "High";
                        if (riskField.toLowerCase().includes("medium")) formattedRisk = "Medium";

                        return {
                            name: startupNameField,
                            health: formattedHealth,
                            risk: formattedRisk,
                            challenge: challengeField,
                            update: updateField
                        };
                    });

                    buildDashboard(startups);

                } catch (error) {
                    console.error("Data formatting error:", error);
                    document.getElementById('startupTableBody').innerHTML = `<tr><td colspan="5" style="text-align: center; color: red; font-weight: bold;">Error formatting data. Check console.</td></tr>`;
                }
            }
        });
    })
    .catch(err => {
        // If it STILL fails, it will print the EXACT reason on your screen
        console.error("Fetch error:", err);
        document.getElementById('startupTableBody').innerHTML = `<tr><td colspan="5" style="text-align: center; color: red; font-weight: bold;">Connection Failed: ${err.message}</td></tr>`;
    });

// =========================================================================
// 3. RENDER THE DASHBOARD ELEMENTS
// =========================================================================
function buildDashboard(startups) {
    
    // --- Summary Cards ---
    let total = startups.length;
    let growthCount = startups.filter(s => s.health === "Growth").length;
    let stableCount = startups.filter(s => s.health === "Stable").length;
    let attentionCount = startups.filter(s => s.health === "Needs Attention").length;

    document.getElementById('total-alumni').innerText = total;
    document.getElementById('growth-count').innerText = growthCount;
    document.getElementById('stable-count').innerText = stableCount;
    document.getElementById('attention-count').innerText = attentionCount;

    // --- Populate Table ---
    const tableBody = document.getElementById('startupTableBody');
    if(tableBody) {
        tableBody.innerHTML = ""; 
        
        if (startups.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748b;">No responses recorded yet.</td></tr>`;
        } else {
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
    }

    // --- Configure Charts ---
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    Chart.defaults.color = '#475569';

    // Doughnut Chart
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

    // Bar Chart
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

    let chartLabels = Object.keys(challengeCounts);
    let chartDataValues = Object.values(challengeCounts);

    if (chartLabels.length === 0) {
        chartLabels = ['Waiting for data...'];
        chartDataValues = [];
    }

    const canvasChallenges = document.getElementById('challengesChart');
    if (canvasChallenges) {
        const ctxChallenges = canvasChallenges.getContext('2d');
        if(challengesChartInstance) challengesChartInstance.destroy();
        challengesChartInstance = new Chart(ctxChallenges, {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Entities Reporting',
                    data: chartDataValues,
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