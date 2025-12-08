require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// =============================
// MIDDLEWARE
// =============================
app.use(cors());
app.use(express.json());

app.get("/api/*", (req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    next();
});

// Serve static frontend


const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// =============================
// FRONTEND ROUTES
// =============================
// STATIC FILES but disable auto index.html
app.use(express.static(path.join(__dirname, "public"), { index: false }));

// Landing Page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "landing.html"));
});

// Login Page
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Signup Page
app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "signup.html"));
});
// =============================
// DB CONNECTION
// =============================
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
});

// TEST DB
app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT NOW() as time");
        res.json({ message: "DB OK", time: rows[0].time });
    } catch (err) {
        res.status(500).json({ message: "DB FAIL", error: err.message });
    }
});

// =============================
// AUTH MIDDLEWARE
// =============================
const authenticateToken = (req, res, next) => {
    const header = req.headers["authorization"];
    const token = header && header.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Missing token" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = user;
        next();
    });
};

// =============================
// AUTH ROUTES
// =============================
app.post("/api/auth/signup", async (req, res) => {
    try {
        const { username, password, email, role } = req.body;
        const hash = await bcrypt.hash(password, 10);

        await pool.query(
            "INSERT INTO users (username, password_hash, email, role, active) VALUES (?, ?, ?, ?, 1)",
            [username, hash, email, role || "User"]
        );

        res.json({ message: "Signup success" });
    } catch (err) {
        res.status(500).json({ error: "Signup failed" });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Missing username or password" });
        }

        const [rows] = await pool.query(
            "SELECT * FROM users WHERE username=? AND active=1",
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = rows[0];

        if (!user.password_hash) {
            return res.status(500).json({ error: "User password not set" });
        }

        const valid = await bcrypt.compare(password, user.password_hash);

        if (!valid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        res.status(500).json({ error: "Login failed" });
    }
});


app.get("/api/auth/validate", authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT id, username, email, role FROM users WHERE id=?",
            [req.user.id]
        );
        res.json({ user: rows[0] });
    } catch (err) {
        res.status(500).json({ error: "Validation failed" });
    }
});


//==============================
// COMPILANCE 
//==============================
// ==============================
// COMPLIANCE OVERVIEW DASHBOARD API
// ==============================
app.get("/api/compliance/overview", authenticateToken, async (req, res) => {
    try {
        // 1️⃣ OVERALL COMPLIANCE (average of all scores)
        const [overall] = await pool.query(`
            SELECT AVG(score) AS avgScore
            FROM compliance_metrics
        `);

        const overallScore = overall[0].avgScore
            ? Math.round(overall[0].avgScore)
            : 0;

        // 2️⃣ SUMMARY — calculate based on rules
        // Example Rule:
        // 85–100 = compliant
        // 70–84 = partial
        // 0–69  = noncompliant

        const [scores] = await pool.query(`
            SELECT score FROM compliance_metrics
        `);

        let summary = { compliant: 0, partial: 0, noncompliant: 0 };

        scores.forEach(row => {
            if (row.score >= 85) summary.compliant++;
            else if (row.score >= 70) summary.partial++;
            else summary.noncompliant++;
        });

        // 3️⃣ HIQA THEMES
        const [hiqaRows] = await pool.query(`
        SELECT category AS theme, score
        FROM compliance_metrics
        WHERE category IN ('Safe','Effective','Person-Centred','Responsive','Well-Led')
        `);
        

        // 4️⃣ POLICY REVIEWS
        const [policyRows] = await pool.query(`
            SELECT 
                title AS name,
                DATE_FORMAT(review_date, '%Y-%m-%d') AS due
            FROM policies
            ORDER BY review_date ASC
        `);

        // SEND TO FRONTEND
        res.json({
            success: true,
            overallScore,
            summary,
            hiqa: hiqaRows,
            reviews: policyRows
        });

    } catch (err) {
        console.error("COMPLIANCE API ERROR:", err);
        res.status(500).json({ message: "Failed to load compliance data" });
    }
});

// =============================
// INCIDENTS CRUD
// =============================
app.get("/api/incidents", authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT 
                e.*, 
                u.username AS reported_by_name,
                su.name AS resident_name
            FROM events e
            LEFT JOIN users u ON e.reported_by = u.id
            LEFT JOIN service_user su ON e.service_user_id = su.id
            ORDER BY e.created_at DESC`
        );

        res.json(rows);

    } catch (err) {
        console.error("INCIDENTS LOAD ERROR:", err);
        res.status(500).json({ error: "Failed to load incidents" });
    }
});
    

app.post("/api/incidents", authenticateToken, async (req, res) => {
    try {
        const {
            title,
            description,
            event_type,
            classification,
            severity,
            location,
            service_user_id,
            staff_id,
            notes,
            status
        } = req.body;

        await pool.query(
            `INSERT INTO events
            (title, description, event_type, classification, severity, location, 
             service_user_id, staff_id, notes, status, reported_by, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                title,
                description,
                event_type,
                classification,
                severity,
                location || "",
                service_user_id || null,
                staff_id || null,
                notes || "",
                status || "open",
                req.user.id   // reporter
            ]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("INCIDENT CREATE ERROR:", err);
        res.status(500).json({ error: "Failed to create incident" });
    }
});


app.put("/api/incidents/:id", authenticateToken, async (req, res) => {
    try {
        let {
            title,
            description,
            event_type,
            classification,
            severity,
            location,
            service_user_id,
            staff_id,
            notes,
            status
        } = req.body;

        const safeStatus = status

        const sql = `
            UPDATE events SET 
                title=?,
                description=?,
                event_type=?,
                classification=?,
                severity=?,
                location=?,
                service_user_id=?,
                staff_id=?,
                notes=?,
                status=?,
                updated_at=NOW()
            WHERE id=?`;

        const [result] = await pool.query(sql, [
            title,
            description,
            event_type,
            classification,
            severity,
            location,
            service_user_id || null,
            staff_id || null,
            notes || null,
            safeStatus,
            req.params.id
        ]);

        res.json({ success: true });

    } catch (err) {
        console.error("UPDATE INCIDENT ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/incidents/:id", authenticateToken, async (req, res) => {
    try {
        await pool.query("DELETE FROM events WHERE id=?", [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete incident" });
    }
});

// =============================
// STAFF CRUD
// =============================
app.get("/api/staff", authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM staff ORDER BY id DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to load staff" });
    }
});

app.post("/api/staff", authenticateToken, async (req, res) => {
    try {
        const { name, email, role, department, phone, hire_date, status } = req.body;

        await pool.query(
            `INSERT INTO staff 
            (name, email, role, department, phone, hire_date, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [name, email, role, department, phone, hire_date, status]
        );

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Staff save failed" });
    }
});


app.delete("/api/staff/:id", authenticateToken, async (req, res) => {
    try {
        await pool.query("DELETE FROM staff WHERE id=?", [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Staff delete failed" });
    }
});

// =============================
// TASKS CRUD
// =============================
app.get("/api/tasks", authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM tasks ORDER BY id DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to load tasks" });
    }
});

app.post("/api/tasks", authenticateToken, async (req, res) => {
    try {
        const {
            event_id, title, description, assigned_to,
            status, priority, due_date, completion_date, notes
        } = req.body;

        await pool.query(
            `INSERT INTO tasks 
            (event_id, title, description, assigned_to, status, priority, due_date, completion_date, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                event_id || null, title, description, assigned_to,
                status, priority, due_date, completion_date, notes
            ]
        );

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to create task" });
    }
});

app.put("/api/tasks/:id", authenticateToken, async (req, res) => {
    try {
        const {
            event_id, title, description, assigned_to,
            status, priority, due_date, completion_date, notes
        } = req.body;

        await pool.query(
            `UPDATE tasks SET
                event_id=?, title=?, description=?, assigned_to=?, status=?, priority=?,
                due_date=?, completion_date=?, notes=?, updated_at=NOW()
             WHERE id=?`,
            [
                event_id || null, title, description, assigned_to,
                status, priority, due_date, completion_date, notes, req.params.id
            ]
        );

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to update task" });
    }
});

app.delete("/api/tasks/:id", authenticateToken, async (req, res) => {
    try {
        await pool.query("DELETE FROM tasks WHERE id=?", [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete task" });
    }
});

// =============================
// AUDITS
// =============================
// =============================
// AUDITS DASHBOARD (NEXT 5 UPCOMING)
// =============================


app.get("/api/audits-dashboard", authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                id,
                title,
                scheduled_date AS date,
                status
            FROM audits
            WHERE scheduled_date IS NOT NULL
            ORDER BY scheduled_date ASC
            LIMIT 5;
        `);

        res.json({ success: true, audits: rows });

    } catch (err) {
        console.error("AUDIT DASHBOARD LOAD ERROR:", err);
        res.status(500).json({ error: "Failed to load audit dashboard" });
    }
});

app.get("/api/audits", authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                a.id,
                a.title,
                a.audit_type,
                a.findings,
                DATE_FORMAT(a.scheduled_date, '%Y-%m-%d') AS scheduled_date,
                a.status,
                a.assigned_to,
                s.name AS assigned_name
            FROM audits a
            LEFT JOIN staff s ON a.assigned_to = s.id
            ORDER BY a.scheduled_date ASC;
        `);

        res.json(rows);

    } catch (err) {
        console.error("LOAD AUDITS ERROR:", err);
        res.status(500).json({ error: "Failed to load audits" });
    }
});

app.post("/api/audits", authenticateToken, async (req, res) => {
    try {
        const { title, audit_type, findings, scheduled_date, status, assigned_to } = req.body;

        await pool.query(
            `INSERT INTO audits (title, audit_type, findings, scheduled_date, status, assigned_to, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [title, audit_type, findings, scheduled_date, status, assigned_to || null]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("AUDIT CREATE ERROR:", err);
        res.status(500).json({ error: "Failed to create audit" });
    }
});

app.put("/api/audits/:id", authenticateToken, async (req, res) => {
    try {
        const { title, audit_type, findings, scheduled_date, status, assigned_to } = req.body;

        await pool.query(
            `UPDATE audits SET
                title = ?,
                audit_type = ?, 
                findings = ?, 
                scheduled_date = ?, 
                status = ?, 
                assigned_to = ?
             WHERE id = ?`,
            [title, audit_type, findings, scheduled_date, status, assigned_to || null, req.params.id]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("AUDIT UPDATE ERROR:", err);
        res.status(500).json({ error: "Failed to update audit" });
    }
});

app.delete("/api/audits/:id", authenticateToken, async (req, res) => {
    try {
        await pool.query("DELETE FROM audits WHERE id=?", [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete audit" });
    }
});

// =============================
// POLICIES
// =============================

app.get("/api/policies/library", authenticateToken, async (req, res) => {
    const [rows] = await pool.query(`
        SELECT 
            id,
            title,
            category AS domain,
            version,
            DATE_FORMAT(review_date, '%Y-%m') AS last_review,
            DATE_FORMAT(next_review, '%Y-%m') AS next_review,
            file_url
        FROM policies
        WHERE status = 'active'
        ORDER BY next_review ASC
    `);
    res.json(rows);
});

// =============================
// ARCHIVED POLICIES (FIX)
// =============================
app.get("/api/policies/archived", authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                id,
                title,
                category AS domain,
                version,
                DATE_FORMAT(review_date, '%Y-%m') AS last_review,
                DATE_FORMAT(next_review, '%Y-%m') AS next_review,
                file_url
            FROM policies
            WHERE status = 'archived'
            ORDER BY next_review ASC
        `);

        res.json(rows);

    } catch (err) {
        console.error("ARCHIVED POLICIES ERROR:", err);
        res.status(500).json({ error: "Failed to load archived policies" });
    }
});

app.get("/api/policies/:id", authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                id,
                title,
                category AS domain,
                version,
                DATE_FORMAT(review_date, '%Y-%m') AS last_review,
                DATE_FORMAT(next_review, '%Y-%m') AS next_review,
                file_url
            FROM policies
            WHERE id = ?
        `, [req.params.id]);

        if (!rows.length) return res.status(404).json({ error: "Policy not found" });

        res.json(rows[0]);

    } catch (err) {
        console.error("POLICY PREVIEW ERROR:", err);
        res.status(500).json({ error: "Failed to load policy" });
    }
});


// =============================
// REPORTS
// =============================
app.get("/api/reports", authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM reports ORDER BY created_at DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Reports error" });
    }
});

// =============================
// RISK REGISTER API
// =============================
app.get("/api/risks", authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                id,
                title,
                description,
                likelihood,
                impact,
                (likelihood * impact) AS score,
                status,
                created_at
            FROM risks
            ORDER BY created_at DESC
        `);

        res.json(rows);

    } catch (err) {
        console.error("LOAD RISKS ERROR:", err);
        res.status(500).json({ error: "Failed to load risks" });
    }
});

// ADD RISK
app.post("/api/risks", authenticateToken, async (req, res) => {
    try {
        const { title, description, likelihood, impact, status } = req.body;

        await pool.query(
            `INSERT INTO risks (title, description, likelihood, impact, status, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [title, description, likelihood, impact, status || "open"]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("ADD RISK ERROR:", err);
        res.status(500).json({ error: "Failed to add risk" });
    }
});

// UPDATE RISK
app.put("/api/risks/:id", authenticateToken, async (req, res) => {
    try {
        const { title, description, likelihood, impact, status } = req.body;

        await pool.query(
            `UPDATE risks SET 
                title=?, 
                description=?, 
                likelihood=?, 
                impact=?, 
                status=?,
                updated_at = NOW()
             WHERE id=?`,
            [title, description, likelihood, impact, status, req.params.id]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("UPDATE RISK ERROR:", err);
        res.status(500).json({ error: "Failed to update risk" });
    }
});

// DELETE RISK
app.delete("/api/risks/:id", authenticateToken, async (req, res) => {
    try {
        await pool.query("DELETE FROM risks WHERE id=?", [req.params.id]);

        res.json({ success: true });

    } catch (err) {
        console.error("DELETE RISK ERROR:", err);
        res.status(500).json({ error: "Failed to delete risk" });
    }
});

// Load categories
app.get("/api/risk-categories", authenticateToken, async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM risk_categories ORDER BY id DESC");
    res.json(rows);
});

// Add category
app.post("/api/risk-categories", authenticateToken, async (req, res) => {
    await pool.query(
        "INSERT INTO risk_categories (name) VALUES (?)",
        [req.body.name]
    );
    res.json({ success: true });
});


// =============================
// START SERVER
// =============================
app.listen(PORT, () => {
    console.log(`ZeNKComply server running on port ${PORT}`);
    console.log(`Frontend at http://localhost:${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
});
