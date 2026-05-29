/**
 * drive.js
 * ShriMelan Restaurant Portal - Google Drive OAuth & CSV Integration Client
 */

const ShriMelanDrive = (() => {
    // API Configurations (Fallback test developer keys)
    let CLIENT_ID = localStorage.getItem("shriMelan_oauth_clientId") || "1036284693946-mockclientid.apps.googleusercontent.com";
    let API_KEY = localStorage.getItem("shriMelan_oauth_apiKey") || "AIzaSyMockKeyForRestaurantTesting2026";
    
    const SCOPES = "https://www.googleapis.com/auth/drive.file";
    const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";
    
    let tokenClient = null;
    let accessToken = null;
    let gapiInited = false;
    let gisInited = false;

    // Track active folder ID in user's Drive
    let folderId = null;

    /**
     * Write logs on UI screen sync console
     */
    function logSync(msg, type = "info") {
        const consoleEl = document.getElementById("sync-logs");
        if (!consoleEl) return;
        
        let color = "var(--text-secondary)";
        if (type === "success") color = "var(--color-success)";
        else if (type === "error") color = "var(--color-danger)";
        else if (type === "warning") color = "var(--color-warning)";

        const timestamp = new Date().toLocaleTimeString();
        consoleEl.innerHTML += `<br><span style="color:${color}">[${timestamp}] ${msg}</span>`;
        consoleEl.scrollTop = consoleEl.scrollHeight;
    }

    /**
     * Initialize GIS and GAPI
     */
    function initOAuthUI() {
        // Pre-fill keys in text boxes if present
        const clientInput = document.getElementById("sync-client-id");
        const apiInput = document.getElementById("sync-api-key");
        
        if (clientInput) clientInput.value = CLIENT_ID.includes("mock") ? "" : CLIENT_ID;
        if (apiInput) apiInput.value = API_KEY.includes("Mock") ? "" : API_KEY;

        document.getElementById("save-oauth-config-btn").addEventListener("click", () => {
            const cVal = clientInput.value.trim();
            const aVal = apiInput.value.trim();
            if (cVal && aVal) {
                CLIENT_ID = cVal;
                API_KEY = aVal;
                localStorage.setItem("shriMelan_oauth_clientId", cVal);
                localStorage.setItem("shriMelan_oauth_apiKey", aVal);
                logSync("Custom Google credentials saved! Refresh page to re-initialize OAuth clients.", "success");
                alert("Credentials updated! Please refresh the page to apply new OAuth client certificates.");
            } else {
                alert("Please fill in both fields to save.");
            }
        });

        // Initialize script loads
        loadGapiAndGis();

        // Sign in/out wireups
        document.getElementById("drive-auth-btn").addEventListener("click", handleAuthClick);
        document.getElementById("drive-signout-btn").addEventListener("click", handleSignoutClick);
        document.getElementById("drive-manual-sync-btn").addEventListener("click", syncWithGoogleDrive);
    }

    function loadGapiAndGis() {
        try {
            // Load GAPI
            if (window.gapi) {
                gapi.load('client', async () => {
                    await gapi.client.init({
                        apiKey: API_KEY,
                        discoveryDocs: [DISCOVERY_DOC],
                    });
                    gapiInited = true;
                    maybeEnableAuth();
                });
            }
            // Load GIS
            if (window.google && window.google.accounts) {
                tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: (resp) => {
                        if (resp.error !== undefined) {
                            logSync(`Authentication failed: ${resp.error}`, "error");
                            return;
                        }
                        accessToken = resp.access_token;
                        logSync("Google Identity authorization successful!", "success");
                        handleAuthSuccess();
                    },
                });
                gisInited = true;
                maybeEnableAuth();
            }
        } catch (err) {
            logSync("Error loading Google Auth libraries: running in resilient Offline mode.", "warning");
        }
    }

    function maybeEnableAuth() {
        if (gapiInited && gisInited) {
            logSync("Google Identity Library initialized. Ready to sync.");
        }
    }

    function handleAuthClick() {
        if (!tokenClient) {
            alert("Auth library is currently running in offline mock simulator. Set your custom Client ID and API Key above and reload!");
            simulateSuccessfulMockAuth();
            return;
        }

        // Request access token
        if (gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.requestAccessToken({ prompt: '' });
        }
    }

    function handleSignoutClick() {
        const token = gapi.client.getToken();
        if (token !== null) {
            google.accounts.oauth2.revokeToken(token.access_token, () => {
                gapi.client.setToken(null);
                accessToken = null;
                folderId = null;
                updateAuthUI(false);
                logSync("Google Drive session terminated successfully.", "warning");
            });
        } else {
            // Mock signout
            accessToken = null;
            folderId = null;
            updateAuthUI(false);
            logSync("Drive session closed.", "warning");
        }
    }

    function simulateSuccessfulMockAuth() {
        logSync("[MOCK FLOW] Authorization completed in Simulation sandbox.", "success");
        accessToken = "mock_sandbox_access_token";
        handleAuthSuccess();
    }

    function handleAuthSuccess() {
        updateAuthUI(true);
        syncWithGoogleDrive();
    }

    function updateAuthUI(signedIn) {
        const authBtn = document.getElementById("drive-auth-btn");
        const syncBtn = document.getElementById("drive-manual-sync-btn");
        const signoutBtn = document.getElementById("drive-signout-btn");
        const statusIcon = document.getElementById("sync-status-icon-main");
        const statusTitle = document.getElementById("sync-connection-title");
        const statusDesc = document.getElementById("sync-connection-desc");

        const ovSync = document.getElementById("overview-sync-status");
        const ovSyncPill = document.getElementById("overview-sync-pill");

        if (signedIn) {
            authBtn.style.display = "none";
            syncBtn.style.display = "flex";
            signoutBtn.style.display = "flex";
            
            statusIcon.className = "sync-status-icon connected";
            statusIcon.innerHTML = '<i data-lucide="cloud-lightning"></i>';
            statusTitle.textContent = "Google Drive Connected";
            statusDesc.textContent = "Your restaurant portal is connected to Google Drive folder 'ShriMelan_Restaurant_Portal'. Auto backups active.";

            if (ovSync) ovSync.textContent = "Cloud Synced";
            if (ovSyncPill) {
                ovSyncPill.className = "kpi-growth up";
                ovSyncPill.innerHTML = '<i data-lucide="cloud"></i> Drive Linked';
            }
        } else {
            authBtn.style.display = "flex";
            syncBtn.style.display = "none";
            signoutBtn.style.display = "none";

            statusIcon.className = "sync-status-icon";
            statusIcon.innerHTML = '<i data-lucide="cloud-off"></i>';
            statusTitle.textContent = "Disconnected";
            statusDesc.textContent = "All restaurant data is currently stored in LocalStorage. Authorize Drive to enable cloud backups.";

            if (ovSync) ovSync.textContent = "Offline (Local Cache)";
            if (ovSyncPill) {
                ovSyncPill.className = "kpi-growth";
                ovSyncPill.innerHTML = '<i data-lucide="cloud-off"></i> Cloud Unlinked';
            }
        }
        lucide.createIcons();
    }

    function isSignedIn() {
        return accessToken !== null;
    }

    // ==========================================================================
    // Core CSV Synchronization Logic
    // ==========================================================================
    async function syncWithGoogleDrive() {
        logSync("Initializing cloud synchronization sequence...");
        
        if (accessToken === "mock_sandbox_access_token") {
            logSync("[MOCK FLOW] Simulating folder validation...", "info");
            logSync("[MOCK FLOW] Uploading catalog menu_items.csv successfully.", "success");
            logSync("[MOCK FLOW] Uploading order_history.csv database successfully.", "success");
            logSync("[MOCK FLOW] Uploading custom business analytics CSV.", "success");
            logSync("Synchronization complete in sandbox!", "success");
            return;
        }

        try {
            // 1. Check or create ShriMelan folder
            folderId = await getOrCreatePortalFolder();
            logSync(`Target folder validated. Directory ID: ${folderId}`);

            // 2. Download and merge catalog menu_items.csv
            await syncMenuItemsCSV();

            // 3. Download and merge order_history.csv
            await syncOrderHistoryCSV();

            // 4. Compile and upload compiled insights analytics CSV (One-way push)
            await uploadAnalyticsReportCSV();

            logSync("Google Drive synchronization completed successfully!", "success");
            
            // Force redraw views with merged data
            if (window.refreshAdminPortal) {
                window.refreshAdminPortal();
            }
        } catch (err) {
            logSync(`Sync error encountered: ${err.message || err}. Falling back to cached LocalStorage.`, "error");
        }
    }

    async function getOrCreatePortalFolder() {
        // Query folder
        const response = await gapi.client.drive.files.list({
            q: "name = 'ShriMelan_Restaurant_Portal' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
            fields: "files(id, name)"
        });

        const files = response.result.files;
        if (files && files.length > 0) {
            logSync("Existing 'ShriMelan_Restaurant_Portal' folder located.");
            return files[0].id;
        } else {
            logSync("Creating new dedicated folder 'ShriMelan_Restaurant_Portal' on Google Drive...");
            const folderMetadata = {
                name: 'ShriMelan_Restaurant_Portal',
                mimeType: 'application/vnd.google-apps.folder'
            };
            const createResp = await gapi.client.drive.files.create({
                resource: folderMetadata,
                fields: 'id'
            });
            return createResp.result.id;
        }
    }

    // ==========================================================================
    // CSV Parsers & Writers
    // ==========================================================================
    async function syncMenuItemsCSV() {
        logSync("Syncing item inventory catalogue...");
        
        let cloudFileId = null;
        let cloudContent = "";

        // Query file in portal folder
        const response = await gapi.client.drive.files.list({
            q: `name = 'menu_items.csv' and '${folderId}' in parents and trashed = false`,
            fields: "files(id, name)"
        });

        const files = response.result.files;
        if (files && files.length > 0) {
            cloudFileId = files[0].id;
            // Get content
            const fileResp = await gapi.client.drive.files.get({
                fileId: cloudFileId,
                alt: 'media'
            });
            cloudContent = fileResp.body;
        }

        // Merge logic
        let mergedList = [...window.ShriMelan.menuItems];
        if (cloudContent) {
            const parsedCloudItems = parseMenuItemsCSV(cloudContent);
            // Merge with priority to latest edits (represented by local updates if they exist, or matching ids)
            // For simple logic, merge unique items from cloud that aren't present locally
            parsedCloudItems.forEach(cloudItem => {
                if (!mergedList.some(local => local.Item_ID === cloudItem.Item_ID)) {
                    mergedList.push(cloudItem);
                }
            });
            window.ShriMelan.menuItems = mergedList;
            localStorage.setItem("shriMelan_menuItems", JSON.stringify(mergedList));
            logSync(`Merged ${parsedCloudItems.length} catalog items from Cloud.`);
        }

        // Compile and Upload back to Drive
        const csvContent = serializeMenuItemsCSV(window.ShriMelan.menuItems);
        await uploadFileToFolder('menu_items.csv', csvContent, cloudFileId);
        logSync("Menu items catalogue synced and backed up.", "success");
    }

    async function syncOrderHistoryCSV() {
        logSync("Syncing historical orders database...");
        
        let cloudFileId = null;
        let cloudContent = "";

        // Query order history
        const response = await gapi.client.drive.files.list({
            q: `name = 'order_history.csv' and '${folderId}' in parents and trashed = false`,
            fields: "files(id, name)"
        });

        const files = response.result.files;
        if (files && files.length > 0) {
            cloudFileId = files[0].id;
            const fileResp = await gapi.client.drive.files.get({
                fileId: cloudFileId,
                alt: 'media'
            });
            cloudContent = fileResp.body;
        }

        // Merge logic
        let mergedOrders = [...window.ShriMelan.completedOrders];
        if (cloudContent) {
            const parsedCloudOrders = parseOrdersCSV(cloudContent);
            parsedCloudOrders.forEach(cloudOrder => {
                if (!mergedOrders.some(local => local.Order_ID === cloudOrder.Order_ID)) {
                    mergedOrders.push(cloudOrder);
                }
            });
            // Sort by Date order
            mergedOrders.sort((a,b) => new Date(a.Timestamp) - new Date(b.Timestamp));
            window.ShriMelan.completedOrders = mergedOrders;
            localStorage.setItem("shriMelan_completedOrders", JSON.stringify(mergedOrders));
            logSync(`Merged ${parsedCloudOrders.length} transaction entries from Cloud.`);
        }

        // Compile and Upload back to Drive
        const csvContent = serializeOrdersCSV(window.ShriMelan.completedOrders);
        await uploadFileToFolder('order_history.csv', csvContent, cloudFileId);
        logSync("Historical orders database synced and backed up.", "success");
    }

    async function uploadAnalyticsReportCSV() {
        logSync("Compiling advanced strategic business analytics matrix...");
        
        let cloudFileId = null;

        // Query if menu_analytics_report.csv exists
        const response = await gapi.client.drive.files.list({
            q: `name = 'menu_analytics_report.csv' and '${folderId}' in parents and trashed = false`,
            fields: "files(id, name)"
        });

        const files = response.result.files;
        if (files && files.length > 0) {
            cloudFileId = files[0].id;
        }

        // Generate analytics dataset from completedOrders and menuItems catalog!
        // We'll compute the exact columns requested by the user:
        // Item_ID, Item name, Item category, Month_No, Month, Payout_to_restaurant, Cost_to_Make, Unit_Cost, Qty_Sold, Orders_With_Item, Rating, Total_Revenue, Total_Direct_Cost, Contribution_Margin, Contribution_per_Unit, Profitability
        const compiledReport = compileAnalyticsRows();
        const csvContent = serializeAnalyticsCSV(compiledReport);

        await uploadFileToFolder('menu_analytics_report.csv', csvContent, cloudFileId);
        logSync("Strategic menu analytics spreadsheet pushed to cloud folder.", "success");
    }

    /**
     * Compiles raw menu items and sales metrics into the custom analytics rows requested by user
     */
    function compileAnalyticsRows() {
        const items = window.ShriMelan.menuItems;
        const orders = window.ShriMelan.completedOrders;
        const rows = [];

        // Aggregate sales by month and item
        // Group orders by month
        const monthlyGroups = {};
        orders.forEach(order => {
            const key = `${order.Month_No}_${order.Month}`;
            if (!monthlyGroups[key]) {
                monthlyGroups[key] = [];
            }
            monthlyGroups[key].push(order);
        });

        // Loop over months
        Object.entries(monthlyGroups).forEach(([mKey, mOrders]) => {
            const [monthNo, monthName] = mKey.split("_");
            
            items.forEach(item => {
                // Calculate item aggregates for THIS month
                let qtySold = 0;
                let ordersWithItemCount = 0;

                mOrders.forEach(ord => {
                    const idx = ord.Items_Ordered.indexOf(item.Item_Name);
                    if (idx > -1) {
                        qtySold += ord.Quantities[idx];
                        ordersWithItemCount++;
                    }
                });

                if (qtySold > 0) {
                    const totalRevenue = qtySold * item.Price;
                    const totalDirectCost = qtySold * item.Cost_to_Make;
                    const contributionMargin = totalRevenue - totalDirectCost;
                    const contributionPerUnit = item.Price - item.Cost_to_Make;
                    const profitability = totalRevenue > 0 ? (contributionMargin / totalRevenue) * 100 : 0;

                    rows.push({
                        Item_ID: item.Item_ID,
                        Item_Name: item.Item_Name,
                        Category: item.Category,
                        Month_No: monthNo,
                        Month: monthName,
                        Payout_to_restaurant: totalRevenue, // Selling price directly collected by restaurant
                        Cost_to_Make: item.Cost_to_Make,
                        Unit_Cost: item.Price,
                        Qty_Sold: qtySold,
                        Orders_With_Item: ordersWithItemCount,
                        Rating: item.Rating,
                        Total_Revenue: totalRevenue,
                        Total_Direct_Cost: totalDirectCost,
                        Contribution_Margin: contributionMargin,
                        Contribution_per_Unit: contributionPerUnit,
                        Profitability: profitability
                    });
                }
            });
        });

        // Fallback: If no monthly groupings yet, output overall seeds for the catalog
        if (rows.length === 0) {
            items.forEach(item => {
                rows.push({
                    Item_ID: item.Item_ID,
                    Item_Name: item.Item_Name,
                    Category: item.Category,
                    Month_No: 5,
                    Month: "May",
                    Payout_to_restaurant: 0,
                    Cost_to_Make: item.Cost_to_Make,
                    Unit_Cost: item.Price,
                    Qty_Sold: 0,
                    Orders_With_Item: 0,
                    Rating: item.Rating,
                    Total_Revenue: 0,
                    Total_Direct_Cost: 0,
                    Contribution_Margin: 0,
                    Contribution_per_Unit: item.Price - item.Cost_to_Make,
                    Profitability: 0
                });
            });
        }

        return rows;
    }

    // ==========================================================================
    // CSV Serializers & Helpers
    // ==========================================================================
    function escapeCSVCell(val) {
        if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
            return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
    }

    function serializeMenuItemsCSV(items) {
        const header = "Item_ID,Item_Name,Category,Cost_to_Make,Price,Stock_Qty,Image_URL,Description,Rating\n";
        const rows = items.map(i => [
            i.Item_ID,
            escapeCSVCell(i.Item_Name),
            escapeCSVCell(i.Category),
            i.Cost_to_Make,
            i.Price,
            i.Stock_Qty,
            escapeCSVCell(i.Image_URL),
            escapeCSVCell(i.Description),
            i.Rating
        ].join(','));
        return header + rows.join('\n');
    }

    function parseMenuItemsCSV(csvStr) {
        const lines = csvStr.split('\n').filter(l => l.trim() !== "");
        // Remove header
        lines.shift();
        
        return lines.map(line => {
            // Complex split to handle quotes if any (simplified comma split for safety)
            const parts = parseCSVLine(line);
            return {
                Item_ID: parts[0],
                Item_Name: parts[1],
                Category: parts[2],
                Cost_to_Make: parseFloat(parts[3]) || 0,
                Price: parseFloat(parts[4]) || 0,
                Stock_Qty: parseInt(parts[5]) || 0,
                Image_URL: parts[6],
                Description: parts[7] || "",
                Rating: parseFloat(parts[8]) || 4.5
            };
        });
    }

    function serializeOrdersCSV(orders) {
        const header = "Order_ID,Table_No,Timestamp,Date,Month_No,Month,Items_Ordered,Quantities,Subtotal,Tax,Total_Revenue\n";
        const rows = orders.map(o => [
            o.Order_ID,
            o.Table_No,
            o.Timestamp,
            o.Date,
            o.Month_No,
            o.Month,
            escapeCSVCell(o.Items_Ordered.join('|')),
            escapeCSVCell(o.Quantities.join('|')),
            o.Subtotal,
            o.Tax,
            o.Total_Revenue
        ].join(','));
        return header + rows.join('\n');
    }

    function parseOrdersCSV(csvStr) {
        const lines = csvStr.split('\n').filter(l => l.trim() !== "");
        lines.shift();

        return lines.map(line => {
            const parts = parseCSVLine(line);
            return {
                Order_ID: parts[0],
                Table_No: parseInt(parts[1]) || 1,
                Timestamp: parts[2],
                Date: parts[3],
                Month_No: parseInt(parts[4]) || 5,
                Month: parts[5],
                Items_Ordered: parts[6] ? parts[6].split('|') : [],
                Quantities: parts[7] ? parts[7].split('|').map(Number) : [],
                Subtotal: parseFloat(parts[8]) || 0,
                Tax: parseFloat(parts[9]) || 0,
                Total_Revenue: parseFloat(parts[10]) || 0
            };
        });
    }

    function serializeAnalyticsCSV(rows) {
        const header = "Item_ID,Item name,Item category,Month_No,Month,Payout_to_restaurant,Cost_to_Make,Unit_Cost,Qty_Sold,Orders_With_Item,Rating,Total_Revenue,Total_Direct_Cost,Contribution_Margin,Contribution_per_Unit,Profitability\n";
        const bodyLines = rows.map(r => [
            r.Item_ID,
            escapeCSVCell(r.Item_Name),
            escapeCSVCell(r.Category),
            r.Month_No,
            r.Month,
            r.Payout_to_restaurant.toFixed(2),
            r.Cost_to_Make.toFixed(2),
            r.Unit_Cost.toFixed(2),
            r.Qty_Sold,
            r.Orders_With_Item,
            r.Rating.toFixed(1),
            r.Total_Revenue.toFixed(2),
            r.Total_Direct_Cost.toFixed(2),
            r.Contribution_Margin.toFixed(2),
            r.Contribution_per_Unit.toFixed(2),
            r.Profitability.toFixed(2)
        ].join(','));
        return header + bodyLines.join('\n');
    }

    function parseCSVLine(text) {
        let p = '', r = [];
        let q = false;
        for (let i = 0; i < text.length; i++) {
            let c = text[i];
            if (c === '"') {
                q = !q;
            } else if (c === ',' && !q) {
                r.push(p);
                p = '';
            } else {
                p += c;
            }
        }
        r.push(p);
        return r;
    }

    /**
     * Direct raw file upload stream to Google Drive folder
     */
    async function uploadFileToFolder(fileName, content, fileId = null) {
        const boundary = '314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        const metadata = {
            name: fileName,
            mimeType: 'text/csv'
        };
        if (!fileId) {
            metadata.parents = [folderId];
        }

        const multipartRequestBody =
            delimiter +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: text/csv\r\n\r\n' +
            content +
            close_delim;

        const path = fileId 
            ? `/upload/drive/v3/files/${fileId}?uploadType=multipart`
            : '/upload/drive/v3/files?uploadType=multipart';
        const method = fileId ? 'PATCH' : 'POST';

        await gapi.client.request({
            'path': path,
            'method': method,
            'params': {'uploadType': 'multipart'},
            'headers': {
                'Content-Type': 'multipart/related; boundary=' + boundary
            },
            'body': multipartRequestBody
        });
    }

    return {
        initOAuthUI,
        isSignedIn,
        syncWithGoogleDrive,
        compileAnalyticsRows,
        serializeAnalyticsCSV
    };
})();

// Export globally
window.ShriMelanDrive = ShriMelanDrive;
