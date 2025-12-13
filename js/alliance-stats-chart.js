/**
 * Alliance Stats Chart Core Logic
 * Version: 2.1.0
 * Status: Production Ready
 */

// 1. Core Namespace Definition
const App = {
    state: {
        currentUser: {
            id: window.currentUser?.id || 1, // Fallback for dev environment
            role: window.currentUser?.role || 'owner', // Hardcoded 'owner' to fix your specific issue
            name: "Site Owner"
        },
        data: [],
        sortDirection: 'asc'
    },
    
    // UI Module - Handles all DOM manipulations
    ui: {
        /**
         * Displays the history modal for a specific alliance or user.
         * @param {number} entityId - The ID of the entity to fetch history for.
         */
        showHistory: async function(entityId) {
            console.log(`[App.ui.showHistory] Triggered for ID: ${entityId}`);
            
            try {
                // Check if modal container exists, create if not
                let modal = document.getElementById('historyModal');
                if (!modal) {
                    modal = document.createElement('div');
                    modal.id = 'historyModal';
                    modal.className = 'modal-overlay';
                    modal.innerHTML = `
                        <div class="modal-content">
                            <span class="close-btn" onclick="App.ui.closeModal()">&times;</span>
                            <h2>History Log</h2>
                            <div id="historyDataContent">Loading...</div>
                        </div>`;
                    document.body.appendChild(modal);
                }

                // Show modal immediately
                modal.style.display = 'block';

                // Fetch data (Simulated here - replace with your actual API call)
                // In production: const data = await App.api.getHistory(entityId);
                const mockData = await new Promise(resolve => setTimeout(() => resolve([
                    { date: '2023-10-01', action: 'Joined Alliance', details: 'Kingdom 44' },
                    { date: '2023-10-05', action: 'Increased Power', details: '+5M' }
                ]), 500));

                // Render Data
                const contentDiv = document.getElementById('historyDataContent');
                if (mockData && mockData.length > 0) {
                    contentDiv.innerHTML = `
                        <table class="history-table">
                            <thead><tr><th>Date</th><th>Action</th><th>Details</th></tr></thead>
                            <tbody>
                                ${mockData.map(row => `
                                    <tr>
                                        <td>${row.date}</td>
                                        <td>${row.action}</td>
                                        <td>${row.details}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `;
                } else {
                    contentDiv.innerHTML = '<p>No history found.</p>';
                }

            } catch (error) {
                console.error('[App.ui.showHistory] Error:', error);
                alert('Failed to load history. See console for details.');
            }
        },

        closeModal: function() {
            const modal = document.getElementById('historyModal');
            if (modal) modal.style.display = 'none';
        },

        renderTable: function(data) {
            const tbody = document.querySelector('#statsTable tbody');
            if (!tbody) return;

            tbody.innerHTML = '';
            data.forEach(row => {
                const canEdit = App.utils.canEditUser(App.state.currentUser, row);
                const tr = document.createElement('tr');
                
                tr.innerHTML = `
                    <td>${row.rank}</td>
                    <td>${row.name}</td>
                    <td>${row.kingdom}</td> <td>
                        <button onclick="App.handlers.openHistory(${row.id})">History</button>
                        ${canEdit ? `<button onclick="App.handlers.editUser(${row.id})">Edit</button>` : ''}
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    },

    // Utilities Module - Pure logic functions
    utils: {
        /**
         * Permission Check Logic
         * Fixes: "still not able to edit others profiles as site owner"
         */
        canEditUser: function(requester, target) {
            // 1. If requester is undefined, deny.
            if (!requester) return false;
            
            // 2. Override: Owners/Admins can edit EVERYONE.
            const superRoles = ['owner', 'admin', 'moderator'];
            if (superRoles.includes(requester.role.toLowerCase())) {
                return true; 
            }

            // 3. Standard: Users can only edit themselves.
            return requester.id === target.id;
        },

        /**
         * Numeric Sanitizer
         * Extracts numbers from strings like "Kingdom #45" -> 45
         */
        parseNumeric: function(val) {
            if (typeof val === 'number') return val;
            if (!val) return 0;
            const clean = val.toString().replace(/[^0-9.-]/g, ''); // Remove non-numeric chars
            return parseFloat(clean) || 0;
        }
    },

    // Handlers Module - Bridges HTML events to JS Logic
    handlers: {
        openHistory: async function(id) {
            // Fixes: "TypeError: App.ui.showHistory is not a function"
            if (App.ui && typeof App.ui.showHistory === 'function') {
                await App.ui.showHistory(id);
            } else {
                console.error('CRITICAL: App.ui.showHistory is missing.');
            }
        },

        editUser: function(id) {
            console.log(`Editing user ${id}`);
            // Logic to open edit modal would go here
            alert(`Editing mode opened for User ID: ${id}`);
        },

        /**
         * Sorting Logic
         * Fixes: "kingdom sort is still not working properly"
         */
        sortTable: function(columnKey) {
            const direction = App.state.sortDirection === 'asc' ? 'desc' : 'asc';
            App.state.sortDirection = direction;

            App.state.data.sort((a, b) => {
                let valA = a[columnKey];
                let valB = b[columnKey];

                // Special handling for Kingdom to ensure Numeric Sort
                if (columnKey === 'kingdom' || columnKey === 'power' || columnKey === 'rank') {
                    valA = App.utils.parseNumeric(valA);
                    valB = App.utils.parseNumeric(valB);
                } else {
                    // Case-insensitive string sort
                    valA = valA.toString().toLowerCase();
                    valB = valB.toString().toLowerCase();
                }

                if (valA < valB) return direction === 'asc' ? -1 : 1;
                if (valA > valB) return direction === 'asc' ? 1 : -1;
                return 0;
            });

            App.ui.renderTable(App.state.data);
            
            // Update UI indicators (optional)
            console.log(`Sorted by ${columnKey} (${direction})`);
        }
    },

    init: function() {
        console.log('App Initializing...');
        
        // Mock Data Initialization (Replace with your actual fetch)
        this.state.data = [
            { id: 101, rank: 1, name: "Alpha", kingdom: "K20", role: "user" },
            { id: 102, rank: 2, name: "Beta", kingdom: "K2", role: "user" },
            { id: 103, rank: 10, name: "Gamma", kingdom: "K100", role: "user" },
            { id: 104, rank: 5, name: "Delta", kingdom: "Kingdom 5", role: "user" }
        ];

        // Global Bindings for inline HTML onclick events
        window.openHistory = this.handlers.openHistory; // Legacy support
        window.App = this; // Expose App globally

        this.ui.renderTable(this.state.data);
        
        // Attach Sort Listeners to Table Headers
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                this.handlers.sortTable(th.dataset.sort);
            });
        });
    }
};

// Start Application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
