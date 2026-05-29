/**
 * analytics.js
 * ShriMelan Restaurant Portal - Data Science, Apriori Basket Analysis & BCG Menu Engineering
 */

const ShriMelanAnalytics = (() => {
    // References to Chart.js instances to prevent canvas redraw overlapping errors
    let bcgChartInstance = null;
    let categoryChartInstance = null;
    let trendChartInstance = null;

    // Config thresholds
    const MIN_SUPPORT = 0.10; // 10%
    const MIN_CONFIDENCE = 0.40; // 40%

    /**
     * Entry Point: Recalculates metrics and updates all dashboard components
     */
    function updateAnalytics() {
        const menuItems = window.ShriMelan.menuItems;
        const orders = window.ShriMelan.completedOrders;

        if (!menuItems || menuItems.length === 0) return;

        // A. Calculate Core Financial KPIs
        calculateFinancialKPIs(orders, menuItems);

        // B. Run Apriori Algorithm for Market Basket analysis
        const basketRules = runAprioriAlgorithm(orders, MIN_SUPPORT, MIN_CONFIDENCE);
        renderAprioriRules(basketRules);

        // C. Calculate BCG Quadrants & Compile Smart Suggestions
        const bcgData = calculateBCGQuadrants(menuItems, orders);
        renderStrategicRecommendations(bcgData, basketRules);

        // D. Draw Chart.js Visualizations
        drawBCGScatterChart(bcgData);
        drawCategoryPieChart(orders, menuItems);
        drawFinancialTrendChart(orders);

        // E. Bind Analytics CSV Export Button
        setupExportCSVButton();
    }

    // ==========================================================================
    // 1. Financial KPIs Aggregator
    // ==========================================================================
    function calculateFinancialKPIs(orders, menuItems) {
        let totalRevenue = 0;
        let totalDirectCosts = 0;

        orders.forEach(order => {
            totalRevenue += order.Total_Revenue;
            
            // Loop through each item in the order to multiply Qty by Cost_to_Make
            order.Items_Ordered.forEach((itemName, idx) => {
                const qty = order.Quantities[idx];
                const item = menuItems.find(m => m.Item_Name === itemName);
                if (item) {
                    totalDirectCosts += item.Cost_to_Make * qty;
                } else {
                    // Fallback approximation (30% raw food cost)
                    totalDirectCosts += (order.Subtotal / order.Items_Ordered.length) * 0.3 * qty;
                }
            });
        });

        const netProfit = Math.max(0, totalRevenue - totalDirectCosts);
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const aov = orders.length > 0 ? totalRevenue / orders.length : 0;

        // Render on UI
        document.getElementById("stats-total-revenue").textContent = `$${totalRevenue.toFixed(2)}`;
        document.getElementById("stats-net-profit").textContent = `$${netProfit.toFixed(2)}`;
        document.getElementById("stats-total-costs").textContent = `$${totalDirectCosts.toFixed(2)}`;
        document.getElementById("stats-total-orders").textContent = orders.length;
        document.getElementById("stats-profit-margin").textContent = `${profitMargin.toFixed(1)}% Margin`;
        document.getElementById("stats-aov").textContent = `$${aov.toFixed(2)} Avg Ticket`;
    }

    // ==========================================================================
    // 2. Apriori Association Rules Mining Algorithm (Pure JS)
    // ==========================================================================
    function runAprioriAlgorithm(orders, minSupport, minConfidence) {
        if (orders.length === 0) return [];

        const totalTransactions = orders.length;

        // Transaction database represented as arrays of item names
        const transactions = orders.map(o => o.Items_Ordered);

        // --- Step A: Count supports of 1-Itemsets ---
        const itemCounts = {};
        transactions.forEach(t => {
            t.forEach(item => {
                itemCounts[item] = (itemCounts[item] || 0) + 1;
            });
        });

        // Filter frequent 1-itemsets
        const frequent1 = {};
        Object.entries(itemCounts).forEach(([item, count]) => {
            const support = count / totalTransactions;
            if (support >= minSupport) {
                frequent1[item] = support;
            }
        });

        // --- Step B: Generate Candidate 2-Itemsets ---
        const frequent1List = Object.keys(frequent1);
        const candidate2 = [];
        for (let i = 0; i < frequent1List.length; i++) {
            for (let j = i + 1; j < frequent1List.length; j++) {
                candidate2.push([frequent1List[i], frequent1List[j]]);
            }
        }

        // Count supports of 2-itemsets
        const candidate2Counts = {};
        transactions.forEach(t => {
            candidate2.forEach(pair => {
                if (t.includes(pair[0]) && t.includes(pair[1])) {
                    const key = pair.join('||');
                    candidate2Counts[key] = (candidate2Counts[key] || 0) + 1;
                }
            });
        });

        // Filter frequent 2-itemsets
        const frequent2 = [];
        Object.entries(candidate2Counts).forEach(([key, count]) => {
            const support = count / totalTransactions;
            if (support >= minSupport) {
                const pair = key.split('||');
                frequent2.push({
                    itemset: pair,
                    support: support
                });
            }
        });

        // --- Step C: Generate Association Rules ---
        // For each frequent 2-itemset {A, B}, we generate:
        // Rule 1: A => B  (Confidence = Supp(A U B) / Supp(A))
        // Rule 2: B => A  (Confidence = Supp(A U B) / Supp(B))
        const rules = [];
        frequent2.forEach(freq => {
            const [itemA, itemB] = freq.itemset;
            const suppAB = freq.support;

            const suppA = itemCounts[itemA] / totalTransactions;
            const suppB = itemCounts[itemB] / totalTransactions;

            // Rule A => B
            const confAtoB = suppAB / suppA;
            const liftAtoB = confAtoB / suppB;
            if (confAtoB >= minConfidence) {
                rules.push({
                    antecedent: itemA,
                    consequent: itemB,
                    support: suppAB,
                    confidence: confAtoB,
                    lift: liftAtoB
                });
            }

            // Rule B => A
            const confBtoA = suppAB / suppB;
            const liftBtoA = confBtoA / suppA;
            if (confBtoA >= minConfidence) {
                rules.push({
                    antecedent: itemB,
                    consequent: itemA,
                    support: suppAB,
                    confidence: confBtoA,
                    lift: liftBtoA
                });
            }
        });

        // Sort rules by Confidence descending
        rules.sort((a,b) => b.confidence - a.confidence);

        return rules;
    }

    function renderAprioriRules(rules) {
        const container = document.getElementById("apriori-rules-list");
        container.innerHTML = "";

        if (rules.length === 0) {
            container.innerHTML = `<li style="padding:20px; text-align:center; color:var(--text-secondary);">
                <i data-lucide="info" style="width:32px; height:32px; margin: 0 auto 10px;"></i>
                <p>Not enough sales baskets recorded to compile affinity rules. Place table orders to discover baskets!</p>
            </li>`;
            lucide.createIcons();
            return;
        }

        rules.slice(0, 5).forEach(rule => {
            const li = document.createElement("li");
            li.className = "rule-item";

            li.innerHTML = `
                <div class="rule-formula">
                    <span class="item">${rule.antecedent}</span>
                    <i data-lucide="arrow-right" style="width:14px; height:14px;"></i>
                    <span class="item">${rule.consequent}</span>
                </div>
                <div class="rule-metrics">
                    <span>Support: <strong>${(rule.support * 100).toFixed(0)}%</strong></span>
                    <span>Confidence: <strong>${(rule.confidence * 100).toFixed(0)}%</strong></span>
                    <span>Lift Score: <strong style="color:${rule.lift > 1.2 ? 'var(--color-success)' : 'var(--text-primary)'}">${rule.lift.toFixed(2)}</strong></span>
                </div>
            `;
            container.appendChild(li);
        });
        lucide.createIcons();
    }

    // ==========================================================================
    // 3. BCG Menu Engineering profit Matrix
    // ==========================================================================
    function calculateBCGQuadrants(menuItems, orders) {
        // Find quantity sold per item
        const salesVolume = {};
        orders.forEach(order => {
            order.Items_Ordered.forEach((itemName, idx) => {
                const qty = order.Quantities[idx];
                salesVolume[itemName] = (salesVolume[itemName] || 0) + qty;
            });
        });

        const dataPoints = menuItems.map(item => {
            const vol = salesVolume[item.Item_Name] || 0;
            const margin = item.Price - item.Cost_to_Make;
            
            return {
                id: item.Item_ID,
                name: item.Item_Name,
                category: item.Category,
                volume: vol,
                margin: margin,
                totalRevenue: vol * item.Price
            };
        });

        // Determine median dividers
        const volumes = dataPoints.map(d => d.volume);
        const margins = dataPoints.map(d => d.margin);
        
        const medianVolume = getMedian(volumes) || 2;
        const medianMargin = getMedian(margins) || 5;

        // Categorize into Quadrants:
        // Q1: Star (High Volume, High Margin)
        // Q2: Plowhorse (High Volume, Low Margin)
        // Q3: Puzzle (Low Volume, High Margin)
        // Q4: Dog (Low Volume, Low Margin)
        dataPoints.forEach(pt => {
            if (pt.volume >= medianVolume && pt.margin >= medianMargin) {
                pt.quadrant = "Star";
            } else if (pt.volume >= medianVolume && pt.margin < medianMargin) {
                pt.quadrant = "Plowhorse";
            } else if (pt.volume < medianVolume && pt.margin >= medianMargin) {
                pt.quadrant = "Puzzle";
            } else {
                pt.quadrant = "Dog";
            }
        });

        return {
            points: dataPoints,
            medianVolume,
            medianMargin
        };
    }

    function getMedian(arr) {
        if (arr.length === 0) return 0;
        const sorted = [...arr].sort((a,b) => a - b);
        const half = Math.floor(sorted.length / 2);
        if (sorted.length % 2 !== 0) {
            return sorted[half];
        }
        return (sorted[half - 1] + sorted[half]) / 2;
    }

    // ==========================================================================
    // 4. Actionable Strategic Promotion engine
    // ==========================================================================
    function renderStrategicRecommendations(bcgData, basketRules) {
        const recList = document.getElementById("strategic-recs-list");
        recList.innerHTML = "";

        const stars = bcgData.points.filter(p => p.quadrant === "Star");
        const horses = bcgData.points.filter(p => p.quadrant === "Plowhorse");
        const puzzles = bcgData.points.filter(p => p.quadrant === "Puzzle");
        const dogs = bcgData.points.filter(p => p.quadrant === "Dog");

        let recsCount = 0;

        // Recommendation A: Raise Plowhorse pricing slightly
        if (horses.length > 0) {
            const horse = horses[0];
            const div = document.createElement("div");
            div.className = "rec-item";
            div.innerHTML = `
                <div class="rec-badge"><i data-lucide="dollar-sign"></i></div>
                <div class="rec-info">
                    <h5>Optimize Price for ${horse.name}</h5>
                    <p>${horse.name} is a high-volume popular choice but has a low unit margin ($${horse.margin.toFixed(2)}). Consider raising price by 8% or negotiating cheaper ingredient costs to boost profitability.</p>
                </div>
            `;
            recList.appendChild(div);
            recsCount++;
        }

        // Recommendation B: Bundle Puzzle with popular items using Apriori rules!
        if (puzzles.length > 0) {
            const puzzle = puzzles[0];
            // Find a rule showing what items buy together
            const matchingRule = basketRules.find(r => r.consequent === puzzle.name || r.antecedent === puzzle.name);
            const partnerItem = matchingRule 
                ? (matchingRule.antecedent === puzzle.name ? matchingRule.consequent : matchingRule.antecedent)
                : (stars.length > 0 ? stars[0].name : "a highly popular main dish");

            const div = document.createElement("div");
            div.className = "rec-item";
            div.innerHTML = `
                <div class="rec-badge" style="background-color:rgba(139, 92, 246, 0.1); color:var(--color-purple);"><i data-lucide="gift"></i></div>
                <div class="rec-info">
                    <h5>Bundle High-Margin ${puzzle.name}</h5>
                    <p>This dish yields a highly profitable margin ($${puzzle.margin.toFixed(2)}) but suffers from low sales. Build a promotional combo pairing it with <strong>${partnerItem}</strong> to drive customer awareness!</p>
                </div>
            `;
            recList.appendChild(div);
            recsCount++;
        }

        // Recommendation C: Bundle Deal from Apriori basket rule
        const strongRule = basketRules.find(r => r.lift > 1.1 && r.confidence > 0.45);
        if (strongRule) {
            const div = document.createElement("div");
            div.className = "rec-item";
            div.innerHTML = `
                <div class="rec-badge" style="background-color:rgba(255, 125, 51, 0.1); color:var(--accent-orange);"><i data-lucide="percent"></i></div>
                <div class="rec-info">
                    <h5>Deploy Combo Package Deal</h5>
                    <p>Market basket analysis confirms customers ordering <strong>${strongRule.antecedent}</strong> buy <strong>${strongRule.consequent}</strong> together (Confidence: ${(strongRule.confidence*100).toFixed(0)}%). Offer a 12% combo discount to instantly grow transaction values.</p>
                </div>
            `;
            recList.appendChild(div);
            recsCount++;
        }

        // Recommendation D: Prune Dogs
        if (dogs.length > 0 && recsCount < 3) {
            const dog = dogs[0];
            const div = document.createElement("div");
            div.className = "rec-item";
            div.innerHTML = `
                <div class="rec-badge" style="background-color:rgba(239, 68, 68, 0.1); color:var(--color-danger);"><i data-lucide="scissors"></i></div>
                <div class="rec-info">
                    <h5>Redesign or Prune ${dog.name}</h5>
                    <p>Sells poorly and yields sub-optimal margins. Consider replacing this dish or rebranding it in next month's menu to save inventory space.</p>
                </div>
            `;
            recList.appendChild(div);
            recsCount++;
        }

        if (recsCount === 0) {
            recList.innerHTML = `<p style="color:var(--text-secondary); text-align:center; padding: 20px;">Place table transactions to feed the strategic promotion engine.</p>`;
        }
        lucide.createIcons();
    }

    // ==========================================================================
    // 5. Chart.js Drawing Functions
    // ==========================================================================
    
    function drawBCGScatterChart(bcgData) {
        const ctx = document.getElementById("bcgScatterChart").getContext("2d");
        
        if (bcgChartInstance) {
            bcgChartInstance.destroy();
        }

        const isLight = document.body.classList.contains("light-theme");
        const gridColor = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";
        const labelColor = isLight ? "#475569" : "#94a3b8";

        const starPoints = bcgData.points.filter(p => p.quadrant === "Star").map(p => ({ x: p.margin, y: p.volume, name: p.name }));
        const horsePoints = bcgData.points.filter(p => p.quadrant === "Plowhorse").map(p => ({ x: p.margin, y: p.volume, name: p.name }));
        const puzzlePoints = bcgData.points.filter(p => p.quadrant === "Puzzle").map(p => ({ x: p.margin, y: p.volume, name: p.name }));
        const dogPoints = bcgData.points.filter(p => p.quadrant === "Dog").map(p => ({ x: p.margin, y: p.volume, name: p.name }));

        bcgChartInstance = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Stars (High vol, High margin)',
                        data: starPoints,
                        backgroundColor: '#10b981',
                        pointRadius: 8,
                        pointHoverRadius: 10
                    },
                    {
                        label: 'Plowhorses (High vol, Low margin)',
                        data: horsePoints,
                        backgroundColor: '#ff7d33',
                        pointRadius: 8,
                        pointHoverRadius: 10
                    },
                    {
                        label: 'Puzzles (Low vol, High margin)',
                        data: puzzlePoints,
                        backgroundColor: '#8b5cf6',
                        pointRadius: 8,
                        pointHoverRadius: 10
                    },
                    {
                        label: 'Dogs (Low vol, Low margin)',
                        data: dogPoints,
                        backgroundColor: '#ef4444',
                        pointRadius: 8,
                        pointHoverRadius: 10
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: labelColor, boxWidth: 12, font: { family: 'Plus Jakarta Sans', size: 10 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const pt = context.raw;
                                return `${pt.name}: Margin: $${pt.x.toFixed(2)}, Qty Sold: ${pt.y}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Unit Contribution Margin ($)', color: labelColor, font: { weight: 'bold' } },
                        grid: { color: gridColor },
                        ticks: { color: labelColor }
                    },
                    y: {
                        title: { display: true, text: 'Sales Quantity Sold (Units)', color: labelColor, font: { weight: 'bold' } },
                        grid: { color: gridColor },
                        ticks: { color: labelColor }
                    }
                }
            }
        });
    }

    function drawCategoryPieChart(orders, menuItems) {
        const ctx = document.getElementById("categoryPieChart").getContext("2d");

        if (categoryChartInstance) {
            categoryChartInstance.destroy();
        }

        // Aggregate revenue by category
        const revenueByCat = {};
        orders.forEach(order => {
            order.Items_Ordered.forEach((itemName, idx) => {
                const qty = order.Quantities[idx];
                const item = menuItems.find(m => m.Item_Name === itemName);
                if (item) {
                    revenueByCat[item.Category] = (revenueByCat[item.Category] || 0) + (item.Price * qty);
                }
            });
        });

        const labels = Object.keys(revenueByCat);
        const data = Object.values(revenueByCat);

        if (labels.length === 0) {
            // Render mock dataset if no sales recorded yet
            labels.push("Burgers", "Pizza", "Salads", "Desserts", "Drinks");
            data.push(120, 180, 75, 45, 95);
        }

        const isLight = document.body.classList.contains("light-theme");
        const labelColor = isLight ? "#475569" : "#94a3b8";

        categoryChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#ff7d33', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4'],
                    borderWidth: 2,
                    borderColor: isLight ? '#ffffff' : '#0e1116'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: labelColor, boxWidth: 10, font: { family: 'Plus Jakarta Sans', size: 10 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const val = context.raw;
                                return ` Revenue: $${val.toFixed(2)}`;
                            }
                        }
                    }
                },
                cutout: '65%'
            }
        });
    }

    function drawFinancialTrendChart(orders) {
        const ctx = document.getElementById("financialTrendChart").getContext("2d");

        if (trendChartInstance) {
            trendChartInstance.destroy();
        }

        // Group by Date
        const dailyFinances = {};
        orders.forEach(order => {
            const date = order.Date;
            if (!dailyFinances[date]) {
                dailyFinances[date] = { revenue: 0, cost: 0 };
            }
            dailyFinances[date].revenue += order.Total_Revenue;

            // Direct Costs
            order.Items_Ordered.forEach((itemName, idx) => {
                const qty = order.Quantities[idx];
                const item = window.ShriMelan.menuItems.find(m => m.Item_Name === itemName);
                if (item) {
                    dailyFinances[date].cost += item.Cost_to_Make * qty;
                } else {
                    dailyFinances[date].cost += (order.Subtotal / order.Items_Ordered.length) * 0.3 * qty;
                }
            });
        });

        let labels = Object.keys(dailyFinances).sort();
        let revenues = labels.map(d => dailyFinances[d].revenue);
        let profits = labels.map(d => Math.max(0, dailyFinances[d].revenue - dailyFinances[d].cost));

        if (labels.length === 0) {
            // Seeder mockup trend
            labels = ["25 May", "26 May", "27 May", "28 May", "29 May"];
            revenues = [80, 110, 95, 140, 165];
            profits = [48, 70, 58, 92, 112];
        }

        const isLight = document.body.classList.contains("light-theme");
        const gridColor = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";
        const labelColor = isLight ? "#475569" : "#94a3b8";

        trendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Gross Sales Revenue',
                        data: revenues,
                        borderColor: '#ff7d33',
                        backgroundColor: 'rgba(255, 125, 51, 0.1)',
                        fill: true,
                        tension: 0.35,
                        borderWidth: 3
                    },
                    {
                        label: 'Net Profits',
                        data: profits,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.35,
                        borderWidth: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: labelColor, font: { family: 'Plus Jakarta Sans' } }
                    }
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: labelColor }
                    },
                    y: {
                        title: { display: true, text: 'Financial Amount ($)', color: labelColor },
                        grid: { color: gridColor },
                        ticks: { color: labelColor }
                    }
                }
            }
        });
    }

    // ==========================================================================
    // 6. Analytics Local CSV Download Trigger
    // ==========================================================================
    function setupExportCSVButton() {
        const btn = document.getElementById("analytics-export-csv-btn");
        
        // Remove existing listener to prevent duplicate stack allocations
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener("click", () => {
            if (!window.ShriMelanDrive) return;
            
            const rows = window.ShriMelanDrive.compileAnalyticsRows();
            const csvContent = window.ShriMelanDrive.serializeAnalyticsCSV(rows);

            // Initiate client download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `ShriMelan_Menu_Analytics_Report_${new Date().toISOString().slice(0,10)}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Notify user
            alert("Success! Aggregated Menu Analytics Report CSV generated and downloaded locally.");
            
            // Push to Drive if connected
            if (window.ShriMelanDrive.isSignedIn()) {
                window.ShriMelanDrive.syncWithGoogleDrive();
            }
        });
    }

    return {
        updateAnalytics
    };
})();

// Export globally
window.ShriMelanAnalytics = ShriMelanAnalytics;
