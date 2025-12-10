

// ===============================
// GLOBAL CONFIG
// ===============================
const API_BASE_URL = "https://zencomply.onrender.com/api";
let currentUser = null;

// INCIDENTS
let currentIncidents = [];
let editingIncidentId = null;

// AUDITS//
let currentAudits = [];
let editingAuditId = null;

// STAFF
let currentStaff = [];
let editingStaffId = null;

// TASKS
let currentTasks = [];
let editingTaskId = null;

// RISK REGISTER
let currentRisks = [];
let editingRiskId = null;


// ===============================
// AUTH HEADER
// ===============================
function authHeader() {
    return {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
    };
}

// ===============================
// DOM READY
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    cacheDOM();
    setupListeners();
    checkAuth();
});

// ===============================
// CACHE DOM ELEMENTS
// ===============================
let loginScreen, mainDashboard, loginForm, logoutBtn;
let newIncidentBtn, saveIncidentBtn, closeIncidentBtn, incidentModal;
let newStaffBtn, saveStaffBtn, closeStaffBtn, staffModal;
let newTaskBtn, saveTaskBtn, closeTaskBtn, taskModal;
let newSafetyAlertBtn, saveSafetyAlertBtn, closeSafetyAlertBtn;
let safetyAlertModal;

let reviewSafetyModal, saveReviewBtn, closeReviewModalBtn;

let lessonsModal, saveLessonBtn, closeLessonsBtn;

let currentSafetyId = null;
let toastBox, navItems;

function cacheDOM() {
    loginScreen = document.getElementById("loginScreen");
    mainDashboard = document.getElementById("mainDashboard");

    loginForm = document.getElementById("loginForm");
    logoutBtn = document.getElementById("logoutBtn");
    navItems = document.querySelectorAll(".nav-item");

    toastBox = document.getElementById("toast");

    // INCIDENTS
    newIncidentBtn = document.getElementById("newIncidentBtn");
    saveIncidentBtn = document.getElementById("saveIncidentBtn");
    closeIncidentBtn = document.getElementById("closeIncidentBtn");
    incidentModal = document.getElementById("incidentModal");

    // AUDITS
    newAuditBtn = document.getElementById("newAuditBtn");
    saveAuditBtn = document.getElementById("saveAuditBtn");
    closeAuditBtn = document.getElementById("closeAuditBtn");
    auditModal = document.getElementById("auditModal");

    // Audit input fields
    audit_title = document.getElementById("audit_title");
    audit_category = document.getElementById("audit_category");
    audit_desc = document.getElementById("audit_desc");
    audit_date = document.getElementById("audit_date");
    audit_status = document.getElementById("audit_status");
    audit_assigned = document.getElementById("audit_assigned");

    // STAFF
    newStaffBtn = document.getElementById("newStaffBtn");
    saveStaffBtn = document.getElementById("saveStaffBtn");
    closeStaffBtn = document.getElementById("closeStaffBtn");
    staffModal = document.getElementById("staffModal");

    // TASKS
    newTaskBtn = document.getElementById("newTaskBtn");
    saveTaskBtn = document.getElementById("saveTaskBtn");
    closeTaskBtn = document.getElementById("closeTaskBtn");
    taskModal = document.getElementById("taskModal");

    // RISKS
    saveRiskBtn = document.getElementById("saveRiskBtn");
    closeRiskBtn = document.getElementById("closeRiskBtn");
    riskModal = document.getElementById("riskModal");

    // SAFETY & ALERTS
    newSafetyAlertBtn = document.getElementById("newSafetyAlertBtn");
    saveSafetyAlertBtn = document.getElementById("saveSafetyAlertBtn");
    closeSafetyAlertBtn = document.getElementById("closeSafetyAlertBtn");
    safetyAlertModal = document.getElementById("safetyAlertModal");

    reviewSafetyModal = document.getElementById("reviewSafetyModal");
    saveReviewBtn = document.getElementById("saveReviewBtn");
    closeReviewModalBtn = document.getElementById("closeReviewModalBtn");

    lessonsModal = document.getElementById("lessonsModal");
    saveLessonBtn = document.getElementById("saveLessonBtn");
    closeLessonsBtn = document.getElementById("closeLessonsBtn");
}

// ===============================
// TOAST MESSAGE
// ===============================
function showToast(msg) {
    toastBox.textContent = msg;
    toastBox.classList.add("show");
    setTimeout(() => toastBox.classList.remove("show"), 2000);
}

// ===============================
// AUTH CHECK
// ===============================
function checkAuth() {
    const token = localStorage.getItem("authToken");
    validateToken();
    if (token) validateToken();
}

async function validateToken() {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/validate`, authHeader());

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            return handleLogout();
        }

        if (!res.ok) return handleLogout();

        const data = await res.json();
        currentUser = data.user;

        showDashboard();
        loadDashboard();
        loadIncidents();
        loadStaff();
        loadTasks();

    } catch (err) {
        console.error("Token validation error:", err);
        handleLogout();
    }
}


// ===============================
// LISTENERS
// ===============================
function setupListeners() {
    if (loginForm) loginForm.addEventListener("submit", handleLogin);
    if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);

    const userMenu = document.querySelector(".user-menu");
    const dropdown = document.getElementById("userDropdown");
    const logoutMenuBtn = document.getElementById("logoutMenuBtn");

    if (userMenu && dropdown) {
        userMenu.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdown.classList.toggle("hidden");
        });

        document.addEventListener("click", () => {
            dropdown.classList.add("hidden");
        });
    }

    if (logoutMenuBtn) {
        logoutMenuBtn.addEventListener("click", handleLogout);
    }


            // INCIDENTS
        if (newIncidentBtn) {
            newIncidentBtn.addEventListener("click", openIncidentModal);
        }

        if (closeIncidentBtn) {
            closeIncidentBtn.addEventListener("click", () => {
                incidentModal.style.display = "none";
            });
        }

        if (saveIncidentBtn) {
            saveIncidentBtn.addEventListener("click", saveIncident);
        }
                const exportBtn = document.getElementById("exportCsvBtn");
        if (exportBtn) exportBtn.addEventListener("click", exportIncidentsToCSV);

        // AUDITS
        if (newAuditBtn) {
            newAuditBtn.addEventListener("click", () => {
                openAuditModal();
                loadStaffForAudit();
            });
        }

        if (closeAuditBtn) {
            closeAuditBtn.addEventListener("click", () => {
                auditModal.style.display = "none";
            });
        }

        if (saveAuditBtn) {
            saveAuditBtn.addEventListener("click", saveAudit);
        }

            // STAFF
        if (newStaffBtn)
            newStaffBtn.addEventListener("click", openStaffModal);

        if (closeStaffBtn)
            closeStaffBtn.addEventListener("click", () => (staffModal.style.display = "none"));

        if (saveStaffBtn)
            saveStaffBtn.addEventListener("click", saveStaff);

        // TASKS
        if (newTaskBtn)
            newTaskBtn.addEventListener("click", openTaskModal);

        if (closeTaskBtn)
            closeTaskBtn.addEventListener("click", () => (taskModal.style.display = "none"));

        if (saveTaskBtn)
            saveTaskBtn.addEventListener("click", saveTask);
    
        document.querySelectorAll(".task-tab").forEach(tab => {
            tab.addEventListener("click", () => {
                document.querySelectorAll(".task-tab").forEach(t => t.classList.remove("active"));
                tab.classList.add("active");

                filterTasks(tab.dataset.filter);
            });
        });
    document.querySelectorAll(".policy-tab").forEach(tab => {
    tab.addEventListener("click", () => switchPolicyTab(tab));
    });

    //*RISK PAGE*//
    // ============================
// RISK REGISTER TAB SWITCHER
// ============================

document.querySelectorAll(".risk-tab").forEach(tab => {
    tab.addEventListener("click", () => {

        // Remove active class from all tabs
        document.querySelectorAll(".risk-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        // Hide all risk panels
        document.querySelectorAll(".risk-panel").forEach(panel => panel.classList.add("hidden"));

        // Show the selected panel
        const selected = tab.getAttribute("data-tab");
        const panel = document.getElementById(`riskPanel-${selected}`);

        if (panel) {
            panel.classList.remove("hidden");
        } else {
            console.error("Panel not found:", `riskPanel-${selected}`);
        }
            });
        });

                // RISKS
        if (saveRiskBtn)
            saveRiskBtn.addEventListener("click", saveRisk);

        if (closeRiskBtn)
            closeRiskBtn.addEventListener("click", () => {
                riskModal.style.display = "none";
            });



        // SAFETY & ALERTS


        if (newSafetyAlertBtn) newSafetyAlertBtn.addEventListener("click", () => {
        safetyAlertModal.style.display = "block";
        });

        if (closeSafetyAlertBtn) closeSafetyAlertBtn.addEventListener("click", () => {
            safetyAlertModal.style.display = "none";
        });

        if (saveSafetyAlertBtn) saveSafetyAlertBtn.addEventListener("click", saveSafetyAlert);

        // review modal
        if (closeReviewModalBtn) closeReviewModalBtn.addEventListener("click", () => {
            reviewSafetyModal.style.display = "none";
        });

        if (saveReviewBtn) saveReviewBtn.addEventListener("click", saveSafetyReview);

        // lessons learned modal
        if (closeLessonsBtn) closeLessonsBtn.addEventListener("click", () => {
            lessonsModal.style.display = "none";
        });

        if (saveLessonBtn) saveLessonBtn.addEventListener("click", saveLessonLearned);
    // NAV
    navItems.forEach((item) => item.addEventListener("click", switchPage));
}

// ===============================
// LOGIN
// ===============================
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (!res.ok) {
            alert("Invalid username or password");
            return;
        }

        const data = await res.json();

        // Save token + user
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        currentUser = data.user;

        // ✅ Redirect to dashboard page (index.html)
        window.location.href = "index.html";

    } catch (err) {
        console.error("Login error:", err);
        alert("Login error");
    }
}

// ===============================
// LOGOUT
// ===============================
function handleLogout() {
    localStorage.removeItem("authToken");
    loginScreen.style.display = "flex";
    mainDashboard.style.display = "none";
}

// ===============================
// DASHBOARD DISPLAY
// ===============================
function showDashboard() {
   
    console.log("→ showDashboard called");
    console.log("loginScreen:", loginScreen);
    console.log("mainDashboard:", mainDashboard);

    loginScreen.style.display = "none";
    mainDashboard.style.display = "flex";


    const userNameEl = document.getElementById("userNameDisplay");
    if (userNameEl) userNameEl.textContent = currentUser.username || "User";
    

    const avatarEl = document.getElementById("userAvatar");
    if (avatarEl)avatarEl.src = currentUser.avatar_url 
    || "https://cdn-icons-png.flaticon.com/512/847/847969.png";
    // Update Profile Dropdown UI
        const dropName = document.getElementById("dropdownName");
        const dropEmail = document.getElementById("dropdownEmail");
        const dropAvatar = document.getElementById("dropdownAvatar");

        if (dropName) dropName.textContent = currentUser.username || "User";
        if (dropEmail) dropEmail.textContent = currentUser.email || "";
        if (dropAvatar)
            dropAvatar.src = currentUser.avatar_url 
            || "https://cdn-icons-png.flaticon.com/512/847/847969.png";

    document.querySelectorAll(".content-area").forEach((a) => (a.style.display = "none"));
    document.getElementById("dashboardContent").style.display = "block";
}

// ===============================
// PAGE SWITCHING
// ===============================
function switchPage(e) {
    e.preventDefault();

    // NAV highlight
    navItems.forEach((i) => i.classList.remove("active"));
    this.classList.add("active");

    // Hide all content
    document.querySelectorAll(".content-area").forEach(p => p.style.display = "none");

    // HIDE ALL MODALS (IMPORTANT FIX)
    closeAllModals();

    const pageId = this.dataset.page;
    document.getElementById("currentPage").textContent = this.textContent.trim();
    document.getElementById(pageId).style.display = "block";

    // LOADERS
    if (pageId === "incidentsContent") loadIncidents();
    if (pageId === "staffContent") loadStaff();
    if (pageId === "tasksContent") loadTasks();
    if (pageId === "dashboardContent") loadDashboard();
    if (pageId === "complianceContent") loadComplianceDashboard();
    if (pageId === "auditsContent") loadAudits();
    if (pageId === "riskContent") loadRisks();
    if (pageId === "safetyContent") {
    setTimeout(() => {
        loadSafetyAlerts();
    }, 150); // Small delay ensures DOM is rendered
    }
}

function closeAllModals() {
    document.querySelectorAll(".modal").forEach(modal => {
        modal.style.display = "none";
    });
}
/* ============================================================
                    DASHBOARD METRICS
============================================================ */
async function loadDashboard() {
    try {
        const incRes = await fetch(`${API_BASE_URL}/incidents`, authHeader());
        const incidents = await incRes.json();
        document.getElementById("cardIncidents").textContent = incidents.length;

        const taskRes = await fetch(`${API_BASE_URL}/tasks`, authHeader());
        const tasks = await taskRes.json();
        document.getElementById("cardTasks").textContent = tasks.filter(t => t.status !== "completed").length;

        const staffRes = await fetch(`${API_BASE_URL}/staff`, authHeader());
        const staff = await staffRes.json();
        document.getElementById("cardStaff").textContent = staff.filter(s => s.status === "active").length;

    } catch (err) {
        console.error("Dashboard load error", err);
    }
    loadUpcomingAudits();
}

async function loadUpcomingAudits() {
    try {
        const res = await fetch(`${API_BASE_URL}/audits-dashboard`, authHeader());
        const data = await res.json();

        const container = document.getElementById("upcomingAuditsList");
        container.innerHTML = "";

        if (!data.audits || data.audits.length === 0) {
            container.innerHTML = `<p>No upcoming audits.</p>`;
            return;
        }

        data.audits.forEach(audit => {
            container.innerHTML += `
                <div class="list-item">
                    <div>
                        ${audit.title}<br>
                        <small>${audit.date} • ${audit.status}</small>
                    </div>
                </div>
            `;
        });

    } catch (err) {
        console.error("Error loading audits:", err);
    }
}
/* ============================================================
                    COMPILANCE 
============================================================ */
// =====================================
// COMPLIANCE DASHBOARD LOADER FUNCTION
// =====================================
async function loadComplianceDashboard() {
    console.log("→ Loading Compliance Dashboard...");

    try {
        const res = await fetch(`${API_BASE_URL}/compliance/overview`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
        });

        const data = await res.json();
        console.log("Compliance Data:", data);

        document.getElementById("overallComplianceValue").innerText = data.overallScore + "%";

        document.getElementById("summaryCompliant").innerText = data.summary.compliant;
        document.getElementById("summaryPartial").innerText = data.summary.partial;
        document.getElementById("summaryNoncompliant").innerText = data.summary.noncompliant;

        // HIQA THEMES (Colorful Cards)
        let hiqaHTML = "";

data.hiqa.forEach(h => {
    hiqaHTML += `
        <div class="hiqa-item">
            <div class="hiqa-title">${h.theme}</div>
            <div class="hiqa-bar">
                <div class="hiqa-fill" style="width:${h.score}%"></div>
            </div>
            <div class="hiqa-score">${h.score}%</div>
        </div>
    `;
});

document.getElementById("hiqaContainer").innerHTML = hiqaHTML;

        // Reviews
        document.getElementById("reviewsList").innerHTML = data.reviews
            .map(r => {
        const dueDate = new Date(r.due);
        const today = new Date();

        const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        let colorClass = "";

        if (diffDays < 0) {
            colorClass = "expired";          // red
        } else if (diffDays <= 30) {
            colorClass = "warning";          // yellow
        } else {
            colorClass = "normal";           // white
        }

        return `
            <li class="${colorClass}">
                ${r.name} — Due: ${r.due}
            </li>
        `;
    })
    .join("");
    } catch (err) {
        console.error("❌ loadComplianceDashboard ERROR:", err);
    }
}

/* ============================================================
                    INCIDENTS CRUD
============================================================ */


function exportIncidentsToCSV() {
    const rows = [];
    const table = document.querySelector(".incidents-table");
    const trArray = table.querySelectorAll("tr");

    trArray.forEach(tr => {
        const cells = tr.querySelectorAll("th, td");
        const row = [];

        cells.forEach(cell => {
            row.push(cell.innerText.replace(/,/g, " ")); // remove commas
        });

        rows.push(row.join(","));
    });

    const csvContent = rows.join("\n");

    // Create downloadable CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "incidents_export.csv"; // File name
    link.click();

    URL.revokeObjectURL(url);
}

function openIncidentModal() {
    editingIncidentId = null;
    saveIncidentBtn.textContent = "Save";
    incidentModal.style.display = "flex";
}

async function saveIncident() {
    const payload = {
        title: document.getElementById("inc_title").value,
        description: document.getElementById("inc_desc").value,
        event_type: document.getElementById("inc_type").value,
        classification: document.getElementById("inc_class").value,
        severity: document.getElementById("inc_severity").value,
        status: document.getElementById("inc_status").value,
        location: "",
        service_user_id: null,
        staff_id: null,
        notes: ""
    };
    console.log("STATUS VALUE:", document.getElementById("inc_status").value);
    console.log("SENDING PAYLOAD:", payload);
    let url = `${API_BASE_URL}/incidents`;
    let method = "POST";

    if (editingIncidentId) {
        url = `${API_BASE_URL}/incidents/${editingIncidentId}`;
        method = "PUT";
    }

    const res = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        alert("Failed to save incident");
        return;
    }

    incidentModal.style.display = "none";
    loadIncidents();
    loadDashboard();
}

async function loadIncidents() {
    const res = await fetch(`${API_BASE_URL}/incidents`, authHeader());
    const contentType = res.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
        console.error("❌ Server returned HTML instead of JSON");
        return;
    }

    const data = await res.json();
    currentIncidents = data;
    renderIncidents();
}

function renderIncidents() {
    const tableBody = document.getElementById("incidentsTableBody");
    if (!tableBody) {
        console.error("❌ incidentsTableBody NOT found");
        return;
    }

    tableBody.innerHTML = "";

    currentIncidents.forEach(inc => {
        tableBody.innerHTML += `
            <tr>
                <td>${formatDate(inc.created_at)}</td>
                <td>${inc.title || ""}</td>
                <td>${inc.event_type || ""}</td>
                <td>${inc.severity || ""}</td>
                <td>${inc.status || ""}</td>
                <td>${inc.reported_by_name || "Unknown"}</td>
                

                <td>
                    <button class="btn-edit" onclick="editIncident(${inc.id})">Edit</button>
                    <button class="btn-delete" onclick="deleteIncident(${inc.id})">Delete</button>
                </td>
            </tr>
        `;
    });
}

function editIncident(id) {
    const inc = currentIncidents.find(i => i.id == id);
    if (!inc) return;

    editingIncidentId = id;

    document.getElementById("inc_title").value = inc.title;
    document.getElementById("inc_desc").value = inc.description;
    document.getElementById("inc_type").value = inc.event_type;
    document.getElementById("inc_class").value = inc.classification;
    document.getElementById("inc_severity").value = inc.severity;
    document.getElementById("inc_status").value = inc.status || "pending";
    saveIncidentBtn.textContent = "Update";
    incidentModal.style.display = "flex";
}

async function deleteIncident(id) {
    if (!confirm("Delete this incident?")) return;

    const res = await fetch(`${API_BASE_URL}/incidents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
    });

    if (!res.ok) {
        alert("Delete failed");
        return;
    }

    loadIncidents();
    loadDashboard();
}

function formatDate(dateString) {
    if (!dateString) return "";
    const d = new Date(dateString);

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
}
/* ============================================================
                    AUDITS
============================================================ */
// ===============================
// LOAD STAFF DROPDOWN FOR AUDIT
// ===============================

async function loadStaffForAudit() {
    try {
        const res = await fetch(`${API_BASE_URL}/staff`, authHeader());
        const staff = await res.json();

        const select = document.getElementById("audit_assigned");
        select.innerHTML = `<option value="">Select staff</option>`;

        staff.forEach(s => {
            select.innerHTML += `<option value="${s.id}">${s.name}</option>`;
        });

    } catch (err) {
        console.error("Failed to load staff for audit:", err);
    }
}

async function loadAudits() {
    const res = await fetch(`${API_BASE_URL}/audits`, authHeader());
    currentAudits = await res.json();
    console.log("Loaded audits:", currentAudits);  
    renderAudits();
}

function renderAudits() {
    const container = document.getElementById("auditsList");

    container.innerHTML = `
        <table class="audit-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Audit Title</th>
                    <th>Category</th>
                    <th>Assigned To</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${currentAudits.map(a => `
                    <tr>
                        <td>${formatDateReadable(a.scheduled_date)}</td>
                        <td>${a.title || "-"}</td>
                        
                        <!-- FIXED FIELDS -->
                        <td>${a.audit_type || "-"}</td>
                        <td>${a.assigned_name || "—"}</td>

                        <td>${a.status || "-"}</td>

                        <td>
                            <button class="btn-edit" onclick="editAudit(${a.id})">Edit</button>
                            <button class="btn-delete" onclick="deleteAudit(${a.id})">Delete</button>
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}


async function editAudit(id) {
    const audit = currentAudits.find(a => a.id == id);

    editingAuditId = id;

    await loadStaffForAudit();

    audit_title.value = audit.title || "";
    audit_category.value = audit.audit_type || "";
    audit_desc.value = audit.findings || "";

    audit_date.value = audit.scheduled_date
        ? audit.scheduled_date.split("T")[0]
        : "";

    audit_status.value = audit.status || "planned";
    audit_assigned.value = audit.assigned_to || "";

    auditModal.style.display = "flex";
}

function formatDateReadable(dateStr) {
    if (!dateStr) return "-";
    
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;  
    // → "30-11-2025"
}

function openAuditModal() {
    editingAuditId = null;
    saveAuditBtn.textContent = "Save";

    // Clear fields
    audit_title.value = "";
    audit_category.value = "";
    audit_desc.value = "";
    audit_date.value = "";
    audit_status.value = "planned";
    audit_assigned.value = "";

    loadStaffForAudit();   // <-- ADD THIS

    auditModal.style.display = "flex";
}

async function saveAudit() {
    const payload = {
    title: audit_title.value,
    audit_type: audit_category.value,
    findings: audit_desc.value,
    scheduled_date: audit_date.value || null,
    status: audit_status.value,
    assigned_to: audit_assigned.value
};

    let url = `${API_BASE_URL}/audits`;
    let method = "POST";

    if (editingAuditId) {
        url = `${API_BASE_URL}/audits/${editingAuditId}`;
        method = "PUT";
    }

    const res = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...authHeader().headers
        },
        body: JSON.stringify(payload)
    });

    auditModal.style.display = "none";
    loadAudits();
}

async function deleteAudit(id) {
    if (!confirm("Are you sure you want to delete this audit?")) return;

    await fetch(`${API_BASE_URL}/audits/${id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            ...authHeader().headers   // ✔ FIXED
        }
    });

    loadAudits();
}

// Make functions global (needed for inline onclick)

/* ============================================================
                    STAFF CRUD
============================================================ */
function openStaffModal() {
    editingStaffId = null;
    saveStaffBtn.textContent = "Save";
    staffModal.style.display = "flex";

    document.getElementById("staff_name").value = "";
    document.getElementById("staff_email").value = "";
    document.getElementById("staff_role").value = "";
    document.getElementById("staff_phone").value = "";
    document.getElementById("staff_status").value = "active";
}

async function saveStaff() {
    const payload = {
        name: document.getElementById("staff_name").value,
        email: document.getElementById("staff_email").value,
        role: document.getElementById("staff_role").value,
        phone: document.getElementById("staff_phone").value,
        department: "",
        hire_date: "",
        status: document.getElementById("staff_status").value
    };

    let url = `${API_BASE_URL}/staff`;
    let method = "POST";

    if (editingStaffId) {
        url = `${API_BASE_URL}/staff/${editingStaffId}`;
        method = "PUT";
    }

    const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        body: JSON.stringify(payload)
    });

    if (!res.ok) return alert("Staff save failed");

    staffModal.style.display = "none";
    loadStaff();
    loadDashboard();
}

async function loadStaff() {
    const res = await fetch(`${API_BASE_URL}/staff`, authHeader());
    currentStaff = await res.json();
    renderStaff();
}

function renderStaff() {
    const list = document.getElementById("staffList");
    list.innerHTML = "";

    currentStaff.forEach((s) => {
        list.innerHTML += `
            <div class="action-item">
                <div>
                    <b>${s.name}</b><br>
                    <small>${s.email}</small><br>
                    <span class="badge-status ${s.status === "active" ? "green" : "red"}">${s.status}</span>
                </div>

                    <div class="action-buttons">
                    <button onclick="editStaff(${s.id})" class="btn-edit">Edit</button>
                    <button onclick="deleteStaff(${s.id})" class="btn-delete">Delete</button>
                </div>
            </div>
        `;
    });
}

function editStaff(id) {
    const s = currentStaff.find((st) => st.id === id);

    editingStaffId = id;

    document.getElementById("staff_name").value = s.name;
    document.getElementById("staff_email").value = s.email;
    document.getElementById("staff_role").value = s.role;
    document.getElementById("staff_phone").value = s.phone;
    document.getElementById("staff_status").value = s.status;

    saveStaffBtn.textContent = "Update";
    staffModal.style.display = "flex";
}

async function deleteStaff(id) {
    if (!confirm("Delete staff member?")) return;

    await fetch(`${API_BASE_URL}/staff/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
    });

    loadStaff();
    loadDashboard();
}

/* ============================================================
                    TASKS CRUD
============================================================ */
function toDateInputFormat(dateStr) {
    if (!dateStr) return "";
    return dateStr.split("T")[0];   // Converts "2024-01-01T00:00:00.000Z" → "2024-01-01"
}

function filterTasks(filter) {
    let filtered = [...currentTasks];

    if (filter === "my") {
        filtered = filtered.filter(t => t.assigned_to === currentUser.id);
    }

    if (filter === "upcoming") {
        filtered = filtered.filter(t => t.status !== "completed");
    }

    if (filter === "closed") {
        filtered = filtered.filter(t => t.status === "completed");
    }

    if (filter === "new") {
        openTaskModal();
        return;
    }

    if (filter === "analytics") {
        tasksList.innerHTML = "<p>Analytics coming soon…</p>";
        return;
    }

    renderTasks(filtered);
}

function openTaskModal() {
    editingTaskId = null;
    saveTaskBtn.textContent = "Save";

    taskModal.style.display = "flex";
}

async function saveTask() {
    const payload = {
        title: document.getElementById("task_title").value,
        description: document.getElementById("task_desc").value,
        status: document.getElementById("task_status").value,
        priority: document.getElementById("task_priority").value,
        due_date: document.getElementById("task_due").value,
        completion_date: document.getElementById("task_complete").value,
        notes: document.getElementById("task_notes").value
    };

    let url = `${API_BASE_URL}/tasks`;
    let method = "POST";

    if (editingTaskId) {
        url = `${API_BASE_URL}/tasks/${editingTaskId}`;
        method = "PUT";
    }

    const res = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) return alert("Failed to save task");

    taskModal.style.display = "none";
    loadTasks();
    loadDashboard();
}

async function loadTasks() {
    const res = await fetch(`${API_BASE_URL}/tasks`, authHeader());
    currentTasks = await res.json();
    renderTasks();
}

function renderTasks(listOverride = null) {
    const list = document.getElementById("tasksList");
    const tasksToRender = listOverride || currentTasks;

    list.innerHTML = "";

    tasksToRender.forEach(t => {
        list.innerHTML += `
            <div class="action-item">
                <div>
                    <b>${t.title}</b><br>
                    <small>Status: ${t.status}</small>
                </div>

                <div class="action-buttons">
                    <button onclick="editTask(${t.id})" class="btn-edit">Edit</button>
                    <button onclick="deleteTask(${t.id})" class="btn-delete">Delete</button>
                </div>
            </div>
        `;
    });
}

function editTask(id) {
    const t = currentTasks.find((x) => x.id === id);

    editingTaskId = id;

    document.getElementById("task_title").value = t.title;
    document.getElementById("task_desc").value = t.description;
    document.getElementById("task_status").value = t.status;
    document.getElementById("task_priority").value = t.priority;
    document.getElementById("task_due").value = toDateInputFormat(t.due_date);
    document.getElementById("task_complete").value = toDateInputFormat(t.completion_date);
    document.getElementById("task_notes").value = t.notes;

    saveTaskBtn.textContent = "Update";
    taskModal.style.display = "flex";
}

async function deleteTask(id) {
    if (!confirm("Delete this task?")) return;

    await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
    });

    loadTasks();
    loadDashboard();
}


// POLICY //


function switchPolicyTab(tab) {
    document.querySelectorAll(".policy-tab")
        .forEach(t => t.classList.remove("active"));

    tab.classList.add("active");

    const selected = tab.dataset.tab;

    document.querySelectorAll("[id^='policyPanel']")
        .forEach(panel => panel.classList.add("hidden"));

    document.getElementById(`policyPanel-${selected}`).classList.remove("hidden");

    // Load data dynamically
    if (selected === "library") loadPolicyLibrary();
    if (selected === "upload") showUploadPanel();
    if (selected === "review") loadPolicyReviewTracker();
    if (selected === "versions") loadPolicyVersions();
    if (selected === "staff") loadPolicyAcknowledgements();
    if (selected === "archived") loadArchivedPolicies();
    if (selected === "reports") loadPolicyReports();
}
async function loadPolicyLibrary() {
    const res = await fetch(`${API_BASE_URL}/policies/library`, authHeader());
    const data = await res.json();

    const panel = document.getElementById("policyPanel-library");

    panel.innerHTML = `
        <table class="policy-table">
            <thead>
                <tr>
                    <th>Policy Title</th>
                    <th>Domain</th>
                    <th>Version</th>
                    <th>Last Review</th>
                    <th>Next Review</th>
                    <th>File</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(p => `
                    <tr class="policy-row" onclick="openPolicyPreview(${p.id})">
                        <td class="policy-title">${p.title}</td>
                        <td>${p.domain || "—"}</td>
                        <td>${p.version || "—"}</td>

                        <td>${p.last_review || "<span class='text-muted'>—</span>"}</td>

                        <td style="color:${getReviewColor(p.next_review)}">
                            ${p.next_review || "<span class='text-muted'>—</span>"}
                        </td>

                        <td>
                            ${
                                p.file_url 
                                ? `<a href="${p.file_url}" target="_blank" class="file-icon">📄</a>`
                                : `<span class="no-file">No File</span>`
                            }
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}
                            



function showUploadPanel() {
    document.getElementById("policyPanel-upload").innerHTML = `
        <h3>Upload New / Update Version</h3>

        <input id="p_title" placeholder="Policy Title">
        <input id="p_domain" placeholder="Domain">
        <input id="p_version" placeholder="Version (v1.0)">
        <input id="p_last" type="month">
        <input id="p_next" type="month">
        <input id="p_file" placeholder="File URL">

        <button class="btn-primary" onclick="saveNewPolicy()">Save Policy</button>
    `;
}

async function saveNewPolicy() {
    const payload = {
        title: p_title.value,
        domain: p_domain.value,
        version: p_version.value,
        review_date: p_last.value + "-01",
        next_review: p_next.value + "-01",
        file_url: p_file.value,
        status: "active"
    };

    await fetch(`${API_BASE_URL}/policies`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader().headers },
        body: JSON.stringify(payload)
    });

    showToast("Policy saved!");
    loadPolicyLibrary();
}

async function loadPolicyReviewTracker() {
    const res = await fetch(`${API_BASE_URL}/policies/library`, authHeader());
    const data = await res.json();

    const panel = document.getElementById("policyPanel-review");

    const overdue = data.filter(p => new Date(p.next_review) < new Date());
    const dueSoon = data.filter(p => {
        const diff = (new Date(p.next_review) - new Date()) / (1000 * 60 * 60 * 24);
        return diff > 0 && diff <= 30;
    });

    panel.innerHTML = `
        <h3>Review Tracker</h3>

        <div class="review-section">
            <h4 class="section-title red">
                ⚠ Overdue (${overdue.length})
            </h4>

            <div class="review-list">
                ${
                    overdue.length 
                    ? overdue.map(p => `
                        <div class="review-card red-border">
                            <div class="review-title">${p.title}</div>
                            <div class="review-date">Due: ${p.next_review || "—"}</div>
                        </div>
                    `).join("")
                    : `<p class="empty-state">No overdue policies.</p>`
                }
            </div>
        </div>

        <div class="review-section">
            <h4 class="section-title yellow">
                🟡 Due Soon (${dueSoon.length})
            </h4>

            <div class="review-list">
                ${
                    dueSoon.length 
                    ? dueSoon.map(p => `
                        <div class="review-card yellow-border">
                            <div class="review-title">${p.title}</div>
                            <div class="review-date">Due: ${p.next_review || "—"}</div>
                        </div>
                    `).join("")
                    : `<p class="empty-state">No upcoming reviews.</p>`
                }
            </div>
        </div>
    `;
}

async function loadPolicyVersions() {
    const res = await fetch(`${API_BASE_URL}/policies/versions`, authHeader());
    const versions = await res.json();

    const panel = document.getElementById("policyPanel-versions");

    panel.innerHTML = `
        <h3>Version History</h3>
        <ul class="version-timeline">
            ${
                versions.map(v => `
                    <li>
                        <div class="version-badge">v${v.version}</div>
                        <div class="version-info">
                            <strong>${v.title}</strong><br>
                            <small>Reviewed: ${v.review_date}</small><br>
                            <a class="file-link" href="${v.file_url}" target="_blank">View File</a>
                        </div>
                    </li>
                `).join("")
            }
        </ul>
    `;
}

function loadPolicyAcknowledgements() {
    document.getElementById("policyPanel-staff").innerHTML =
        "<p>Staff acknowledgement tracking will be added.</p>";
}

async function loadArchivedPolicies() {
    const res = await fetch(`${API_BASE_URL}/policies/archived`, authHeader());
    const data = await res.json();

    const panel = document.getElementById("policyPanel-archived");

    panel.innerHTML = data.length
        ? data.map(p => `<p>${p.title} (Archived)</p>`).join("")
        : "<p>No archived policies.</p>";
}

function loadPolicyReports() {
    document.getElementById("policyPanel-reports").innerHTML =
        "<p>Reports module will be added later.</p>";
}

function getReviewColor(date) {
    if (!date) return "#9ca3af"; // grey

    const due = new Date(date);
    const now = new Date();
    const diff = (due - now) / (1000 * 60 * 60 * 24);

    if (diff < 0) return "red";
    if (diff <= 30) return "orange";
    return "black";
}

async function openPolicyPreview(id) {
    const res = await fetch(`${API_BASE_URL}/policies/${id}`, authHeader());
    const p = await res.json();

    policyPreviewTitle.textContent = p.title;
    policyPreviewDomain.textContent = p.domain || "—";
    policyPreviewVersion.textContent = p.version || "—";
    policyPreviewReview.textContent = p.last_review || "—";
    policyPreviewNext.textContent = p.next_review || "—";

    if (p.file_url) {
        policyPreviewFrame.src = p.file_url;
        policyDownloadBtn.onclick = () => window.open(p.file_url, "_blank");
    } else {
        policyPreviewFrame.src = "";
        policyDownloadBtn.onclick = null;
    }

    document.getElementById("policyPreviewModal").style.display = "flex";
}

function closePolicyPreview() {
    document.getElementById("policyPreviewModal").style.display = "none";
}

//*RISK REGISTER*?//
async function authFetch(url, options = {}) {
    const token = localStorage.getItem("authToken");

    const defaultHeaders = {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
    };

    options.headers = { ...defaultHeaders, ...(options.headers || {}) };

    return fetch(url, options);
}

async function loadRisks() {
    const res = await fetch(`${API_BASE_URL}/risks`, {
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("authToken")
        }
    });

    if (!res.ok) {
        console.error("Failed to load risks:", await res.text());
        return;
    }

    currentRisks = await res.json();
    renderRisks();
    renderClosedRisks();
    loadRiskReviews();
    generateHeatmap();
}

function calculateRiskScore(likelihood, impact) {
    return likelihood * impact;
}

function getRiskColor(score) {
    if (score >= 15) return "red";
    if (score >= 8) return "orange";
    return "green";
}

function renderRisks() {
    const container = document.getElementById("riskList");

    if (!currentRisks.length) {
        container.innerHTML = "<p>No risks added yet.</p>";
        return;
    }

    container.innerHTML = `
        <table class="risk-table">
            <thead>
                <tr>
                    <th>Risk</th>
                    <th>Likelihood</th>
                    <th>Impact</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${currentRisks.map(r => {
                    const score = calculateRiskScore(r.likelihood, r.impact);
                    const color = getRiskColor(score);

                    return `
                        <tr>
                            <td>${r.title}</td>
                            <td>${r.likelihood}</td>
                            <td>${r.impact}</td>
                            <td>
                                <span class="risk-badge ${color}">${score}</span>
                            </td>
                            <td>${r.status}</td>
                            <td>
                                <button class="btn-edit" onclick="editRisk(${r.id})">Edit</button>
                                <button class="btn-delete" onclick="deleteRisk(${r.id})">Delete</button>
                            </td>
                        </tr>
                    `;
                }).join("")}
            </tbody>
        </table>
    `;
}

function openRiskModal(edit = false, risk = null) {
    const modal = document.getElementById("riskModal");
    const titleField = document.getElementById("risk_title");
    const descField = document.getElementById("risk_desc");
    const likeField = document.getElementById("risk_likelihood");
    const impactField = document.getElementById("risk_impact");
    const statusField = document.getElementById("risk_status");
    editingRiskId = null;

    // SAFETY CHECK
    if (!modal || !titleField) {
        console.error("Risk Modal elements missing in DOM");
        return;
    }

    modal.style.display = "flex";

    if (edit && risk) {
        document.getElementById("riskModalTitle").innerText = "Edit Risk";

        titleField.value = risk.title || "";
        descField.value = risk.description || "";
        likeField.value = risk.likelihood || 1;
        impactField.value = risk.impact || 1;
        statusField.value = risk.status || "open";
    } else {
        document.getElementById("riskModalTitle").innerText = "Add Risk";

        titleField.value = "";
        descField.value = "";
        likeField.value = 1;
        impactField.value = 1;
        statusField.value = "open";
    }
}

async function saveRisk() {

    const payload = {
        title: document.getElementById("risk_title").value.trim(),
        description: document.getElementById("risk_desc").value.trim(),
        likelihood: Number(document.getElementById("risk_likelihood").value),
        impact: Number(document.getElementById("risk_impact").value),
        status: document.getElementById("risk_status").value
    };

    console.log("Saving risk → payload:", payload);

    let url = `${API_BASE_URL}/risks`;
    let method = "POST";

    if (editingRiskId !== null) {
        url = `${API_BASE_URL}/risks/${editingRiskId}`;
        method = "PUT";
    }

    const res = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        console.error("❌ Risk save failed:", await res.text());
        alert("Failed to save risk");
        return;
    }

    console.log("✔ Risk saved successfully");
    document.getElementById("riskModal").style.display = "none";
    loadRisks();
}

function editRisk(id) {
    const r = currentRisks.find(x => x.id == id);
    editingRiskId = id;

    document.getElementById("risk_title").value = r.title;
    document.getElementById("risk_desc").value = r.description;
    document.getElementById("risk_likelihood").value = r.likelihood;
    document.getElementById("risk_impact").value = r.impact;
    document.getElementById("risk_status").value = r.status;

    document.getElementById("riskModalTitle").textContent = "Edit Risk";
    document.getElementById("riskModal").style.display = "flex";
}

async function deleteRisk(id) {
    if (!confirm("Delete this risk?")) return;

    await fetch(`${API_BASE_URL}/risks/${id}`, {
        method: "DELETE",
        headers: authHeader().headers
    });

    loadRisks();
}

function generateHeatmap() {
    const heatmap = document.getElementById("heatmapGrid");
    heatmap.innerHTML = "";

    for (let likelihood = 5; likelihood >= 1; likelihood--) {
        for (let impact = 1; impact <= 5; impact++) {

            let score = likelihood * impact;
            let color = score >= 15 ? "hm-high" : score >= 8 ? "hm-medium" : "hm-low";

            heatmap.innerHTML += `
                <div class="heatmap-cell ${color}">
                    ${score}
                </div>
            `;
        }
    }
}

function renderClosedRisks() {
    const container = document.getElementById("closedRiskList");
    const closed = currentRisks.filter(r => r.status === "closed");

    container.innerHTML = closed.length
        ? closed.map(r => `<p>${r.title} — Score: ${r.likelihood * r.impact}</p>`).join("")
        : "<p>No closed risks.</p>";
}

function loadRiskReviews() {
    const list = document.getElementById("reviewList");

    list.innerHTML = currentRisks.map(r => `
        <div class="review-item">
            <b>${r.title}</b>  
            <br>
            Score: ${r.likelihood * r.impact}
            <br>
            Last Updated: ${r.updated_at || "Never"}
        </div>
    `).join("");
}

function renderRiskChart() {
    const ctx = document.getElementById("riskChart");

    const labels = currentRisks.map(r => r.title);
    const scores = currentRisks.map(r => r.likelihood * r.impact);

    new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Risk Scores",
                data: scores,
                backgroundColor: "rgba(37, 99, 235, 0.6)"
            }]
        }
    });
}

// SAFETY & ALERTS

async function loadSafetyAlerts() {
    const tbody = document.getElementById("safetyAlertsBody");
    if (!tbody) {
        console.warn("⚠️ safetyAlertsBody not found in DOM.");
        return;
    }

    tbody.innerHTML = "";

    try {
        const res = await fetch(`${API_BASE_URL}/safety-alerts`, authHeader());

        if (!res.ok) {
            console.error("Failed to load safety alerts:", res.status);
            if (res.status === 401 || res.status === 403) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align:center;">
                            You are not authorized to view safety alerts.
                        </td>
                    </tr>`;
            } else {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align:center;">
                            Error loading safety alerts (${res.status}).
                        </td>
                    </tr>`;
            }
            return;
        }

        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center;">
                        No safety alerts found.
                    </td>
                </tr>`;
            return;
        }

        data.forEach(alert => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${alert.id}</td>
                <td>${alert.title}</td>
                <td>${alert.category}</td>
                <td>${alert.severity}</td>
                <td>${alert.status}</td>
                <td>${alert.reported_by}</td>
                <td>${alert.created_at}</td>
                <td>
                    <button class="btn-small" onclick="openReviewModal(${alert.id})">Review</button>
                    <button class="btn-small" onclick="openLessonsModal(${alert.id})">Lessons</button>
                </td>
            `;
            tbody.appendChild(row);
        });

    } catch (err) {
        console.error("Error loading safety alerts:", err);
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;">
                    Error loading safety alerts.
                </td>
            </tr>`;
    }
}

async function saveSafetyAlert() {
    const body = {
        title: sa_title.value,
        description: sa_description.value,
        category: sa_category.value,
        severity: sa_severity.value
    };

    await fetch(`${API_BASE_URL}/safety-alerts`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...authHeader().headers
        },
        body: JSON.stringify(body)
    });

    safetyAlertModal.style.display = "none";
    loadSafetyAlerts();
    showToast("Safety alert created!");
}

function openReviewModal(id) {
    currentSafetyId = id;
    reviewSafetyModal.style.display = "block";
}

async function saveSafetyReview() {
    const body = {
        notes: review_notes.value,
        improvement: review_improvement.value,
        status: review_status.value
    };

    await fetch(`${API_BASE_URL}/safety-alerts/${currentSafetyId}/review`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...authHeader().headers
        },
        body: JSON.stringify(body)
    });

    reviewSafetyModal.style.display = "none";
    loadSafetyAlerts();
    showToast("Review updated!");
}

function openLessonsModal(id) {
    currentSafetyId = id;
    lessonsModal.style.display = "block";
}

async function saveLessonLearned() {
    const body = {
        root: ll_root.value,
        learned: ll_learned.value,
        addToLibrary: ll_add.value
    };

    await fetch(`${API_BASE_URL}/safety-alerts/${currentSafetyId}/lessons`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...authHeader().headers
        },
        body: JSON.stringify(body)
    });

    lessonsModal.style.display = "none";
    showToast("Lessons learned saved!");
}
