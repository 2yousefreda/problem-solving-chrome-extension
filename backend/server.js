const express = require('express');
const cors = require('cors');
const db = require("./database.js");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const getUserId = (req, res, next) => {
    const { username } = req.query;
    if (!username) {
        return res.status(400).json({ error: "Username is required" });
    }
    db.get("SELECT id FROM users WHERE username = ?", [username], (err, user) => {
        if (err) {
            console.error("Error in getUserId:", err.message);
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        req.userId = user.id;
        next();
    });
};

app.post("/api/users/login", (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ error: "Username is required" });
    }
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err) {
            console.error("Error in login (SELECT):", err.message);
            return res.status(500).json({ error: err.message });
        }
        if (user) {
            res.json({ message: "Login successful", user });
        } else {
            db.run("INSERT INTO users (username) VALUES (?)", [username], function(err) {
                if (err) {
                    console.error("Error in login (INSERT):", err.message);
                    return res.status(500).json({ error: err.message });
                }
                res.json({ message: "User created and logged in", user: { id: this.lastID, username } });
            });
        }
    });
});




app.get("/api/challenge", getUserId, (req, res) => {
    
    
    const lastCompletionSql = `SELECT completed_at FROM user_progress WHERE user_id = ? ORDER BY completed_at DESC LIMIT 1`;

    db.get(lastCompletionSql, [req.userId], (err, lastCompletion) => {
        if (err) {
            console.error("Error getting last completion:", err.message);
            return res.status(500).json({ error: err.message });
        }

        const today = new Date().toISOString().slice(0, 10);
        
        
        if (lastCompletion && lastCompletion.completed_at === today) {
            return res.json({ data: null, status: 'completed_today' });
        }

        
        const nextProblemSql = `
            SELECT p.*
            FROM problems p
            LEFT JOIN user_progress up ON p.id = up.problem_id AND up.user_id = ?
            WHERE up.problem_id IS NULL
            ORDER BY p."order" ASC
            LIMIT 1
        `;

        db.get(nextProblemSql, [req.userId], (err, nextProblem) => {
            if (err) {
                console.error("Error getting next problem:", err.message);
                return res.status(500).json({ error: err.message });
            }

            
            if (!nextProblem) {
                return res.json({ data: null, status: 'all_completed' });
            }

            
            res.json({ data: nextProblem, status: 'incomplete' });
        });
    });
});

app.post("/api/challenge/complete", getUserId, (req, res) => {
    const { problemId } = req.body;
    if (!problemId) {
        return res.status(400).json({ error: "problemId is required" });
    }

    const today = new Date().toISOString().slice(0, 10);

    
    const checkTodaySql = `
        SELECT COUNT(*) as count FROM user_progress 
        WHERE user_id = ? AND completed_at = ?
    `;
    db.get(checkTodaySql, [req.userId, today], (err, row) => {
        if (err) {
            console.error("Error checking today's progress:", err.message);
            return res.status(500).json({ error: err.message });
        }

        
        if (row.count > 0) {
            return res.status(403).json({ error: "You can only complete one problem per day." });
        }

        
        
        const insertSql = `INSERT INTO user_progress (user_id, problem_id, completed_at) VALUES (?, ?, ?)`;
        db.run(insertSql, [req.userId, problemId, today], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: "This problem has already been completed." });
                }
                console.error("Error completing challenge:", err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: "Success", completedId: this.lastID });
        });
    });
});




app.get("/api/stats", getUserId, (req, res) => {
    
    const totalProblemsSql = "SELECT COUNT(*) as count FROM problems";
    db.get(totalProblemsSql, [], (err, totalRow) => {
        if (err) {
            console.error("Error in stats (total):", err.message);
            return res.status(500).json({ "error": err.message });
        }

        
        
        const progressSql = "SELECT completed_at FROM user_progress WHERE user_id = ? ORDER BY completed_at DESC";
        
        
        db.all(progressSql, [req.userId], (err, completions) => {
            if (err) {
                console.error("Error in stats (progress):", err.message);
                return res.status(500).json({ "error": err.message });
            }
            
            let streak = 0;
            if (completions.length > 0) {
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                const todayStr = today.toISOString().slice(0, 10);
                const yesterdayStr = yesterday.toISOString().slice(0, 10);
                
                const lastCompletionDate = completions[0].completed_at;

                if (lastCompletionDate === todayStr || lastCompletionDate === yesterdayStr) {
                    streak = 1;
                    let lastDate = new Date(lastCompletionDate);
                    for (let i = 1; i < completions.length; i++) {
                        const prevDate = new Date(completions[i].completed_at);
                        const diffTime = lastDate - prevDate;
                        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays === 1) {
                            streak++;
                            lastDate = prevDate;
                        } else {
                            break;
                        }
                    }
                }
            }
            
            
            res.json({
                "data": {
                    "solved": completions.length,
                    "total": totalRow.count,
                    "streak": streak
                }
            });
        });
    });
});

app.get("/api/roadmap", getUserId, (req, res) => {
    const roadmapSql = `
        SELECT p.id, p.title, p.difficulty, p.hint, p.url,p."order",
               CASE WHEN up.completed_at IS NOT NULL THEN 1 ELSE 0 END AS completed
        FROM problems p
        LEFT JOIN user_progress up ON p.id = up.problem_id AND up.user_id  = ?
        ORDER BY p."order"
    `;
    db.all(roadmapSql, [req.userId], (err, roadmap) => {
        if (err) {
            console.error("Error in roadmap:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ data: roadmap });
    });
});


app.post("/api/challenge/reset", getUserId, (req, res) => {
    const resetSql = `DELETE FROM user_progress WHERE user_id = ?`;

    
    
    db.run(resetSql, [req.userId], function(err) {
        if (err) {
            console.error("Error during progress reset:", err.message);
            return res.status(500).json({ error: err.message });
        }

        
        
        console.log(`Reset requested for user_id: ${req.userId}. Rows deleted: ${this.changes}`);

        
        
        if (this.changes === 0) {
            console.warn(`Warning: A progress reset for user_id: ${req.userId} was requested, but they had no progress to clear.`);
        }

        res.json({ message: "Progress reset successfully", rowsDeleted: this.changes });
    });
});


app.get("/api/admin/problems", (req, res) => {
 const sql = `SELECT * FROM problems ORDER BY "order"`;
 db.all(sql, [], (err, rows) => {
 if (err) {
 return res.status(500).json({ error: err.message });
 }
 res.json({ data: rows });
 });
}); 


app.post("/api/admin/problems", (req, res) => {
 const { title, difficulty, hint, url } = req.body;
 if (!title || !difficulty || !hint || !url) {
 return res.status(400).json({ error: "All fields are required" });
 } 

 const getMaxOrderSql = `SELECT MAX("order") as maxOrder FROM problems`;
 db.get(getMaxOrderSql, [], (err, row) => {
 if (err) {
 return res.status(500).json({ error: err.message });
 }
 const newOrder = (row.maxOrder || 0) + 1;
 const insertSql = `INSERT INTO problems (title, difficulty, hint, url, "order") VALUES (?, ?, ?, ?, ?)`;
 db.run(insertSql, [title, difficulty, hint, url, newOrder], function(err) {
 if (err) {
 return res.status(500).json({ error: err.message });
 }
 res.json({ message: "Problem added successfully", id: this.lastID });
 });
 });
}); 


app.put("/api/admin/problems/:id", (req, res) => {
 const { id } = req.params;
 const { title, difficulty, hint, url } = req.body;
 if (!title || !difficulty || !hint || !url) {
 return res.status(400).json({ error: "All fields are required" });
 }
 const sql = `UPDATE problems SET title = ?, difficulty = ?, hint = ?, url = ? WHERE id = ?`;
 db.run(sql, [title, difficulty, hint, url, id], function(err) {
 if (err) {
 return res.status(500).json({ error: err.message });
 }
 res.json({ message: "Problem updated successfully" });
 });
}); 


app.delete("/api/admin/problems/:id", (req, res) => {
 const { id } = req.params;
 const sql = `DELETE FROM problems WHERE id = ?`;
 db.run(sql, id, function(err) {
 if (err) {
 return res.status(500).json({ error: err.message });
 }
 res.json({ message: "Problem deleted successfully" });
 });
}); 


app.post("/api/admin/problems/reorder", (req, res) => {
 const { problems } = req.body; 
 if (!Array.isArray(problems)) {
 return res.status(400).json({ error: "Request body must be an array of problems" });
 } 

 db.serialize(() => {
 db.run("BEGIN TRANSACTION");
 problems.forEach(p => {
 const sql = `UPDATE problems SET "order" = ? WHERE id = ?`;
 db.run(sql, [p.order, p.id]);
 });
 db.run("COMMIT", (err) => {
 if (err) {
 db.run("ROLLBACK");
 return res.status(500).json({ error: err.message });
 }
 res.json({ message: "Problems reordered successfully" });
 });
 });
});

app.get("/admin", (req, res) => {
res.sendFile(__dirname + "/admin.html");
});