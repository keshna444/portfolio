// Sample Data representing the NPCC cohorts
const startups = [
    { name: "MauriBot", health: "Growth", risk: "Low", challenge: "Scaling Infrastructure", update: "Successfully onboarded 3 new enterprise clients this operating month." },
    { name: "EcoAI Analytics", health: "Stable", risk: "Low", challenge: "Data Acquisition", update: "Finalizing commercial terms for pilot program with local municipality." },
    { name: "SmartAgri", health: "Needs Attention", risk: "High", challenge: "Funding Runaway", update: "Product launch delayed due to bridge funding constraints. Burn rate elevated." },
    { name: "FinTech Innovate", health: "Growth", risk: "Low", challenge: "Regulatory Compliance", update: "Achieved Q3 target revenue. Currently filing for regional compliance licenses." },
    { name: "EduLearn AI", health: "Stable", risk: "Medium", challenge: "Hiring Talent", update: "Expanded core engineering team, but experiencing delays in sourcing Lead AI Researcher." },
    { name: "HealthScan", health: "Needs Attention", risk: "High", challenge: "User Engagement", update: "Active daily user retention dropped by 15% over the trailing 30 days." }
];

// Populate the Table
const tableBody = document.getElementById('startupTableBody');
startups.forEach(startup => {
    const healthClass = startup.health === 'Growth' ? 'badge-growth' : 
                       startup.health === 'Stable' ? 'badge-stable' : 'badge-attention';
    
    const riskClass = startup.risk === 'High' ? 'badge-risk-high' : 'badge-risk-low';

    const row = `<tr>
        <td style="font-weight: 600;">${startup.name}</td>
        <td><span class="badge ${healthClass}">${startup.health}</span></td>
        <td><span class="badge ${riskClass}">${startup.risk}</span></td>
        <td style="font-weight: 500;">${startup.challenge}</td>
        <td style="color: #64748b;">${startup.update}</td>
    </tr>`;
    tableBody.innerHTML += row;
});

// Chart.js Default styling adjustments
Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
Chart.defaults.color = '#475569';

// Initialize Health Status Doughnut Chart
const ctxHealth = document.getElementById('healthChart').getContext('2d');
new Chart(ctxHealth, {
    type: 'doughnut',
    data: {
        labels: ['Growth', 'Stable', 'Needs Attention'],
        datasets: [{
            data: [12, 8, 4],
            // Updated to Light Green, Blue, and Purple
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
        plugins: {
            legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } }
        }
    }
});

// Initialize Challenges Bar Chart
const ctxChallenges = document.getElementById('challengesChart').getContext('2d');
new Chart(ctxChallenges, {
    type: 'bar',
    data: {
        labels: ['Funding/Capital', 'Scaling Tech', 'Talent Acq.', 'User Engagement', 'Regulatory'],
        datasets: [{
            label: 'Entities Reporting',
            data: [8, 5, 4, 4, 3],
            backgroundColor: '#6d28d9', // Updated to Purple
            borderRadius: 4,
            barThickness: 45
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { 
                beginAtZero: true, 
                grid: { color: '#f1f5f9' }
            },
            x: { 
                grid: { display: false }
            }
        },
        plugins: {
            legend: { display: false }
        }
    }
});