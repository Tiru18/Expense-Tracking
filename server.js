const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Tiru@143',
    database: 'expense_tracker'
});

db.connect(err => {
    if (err) throw err;
    console.log('MySQL Connected...');
});

// User Registration
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], 
        (err, result) => {
            if (err) return res.status(500).send(err);
            res.status(201).send({ message: 'User Registered' });
        });
});

// User Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err || results.length === 0) return res.status(401).send({ message: 'User not found' });

        const isValid = await bcrypt.compare(password, results[0].password);
        if (!isValid) return res.status(401).send({ message: 'Invalid Credentials' });

        const token = jwt.sign({ userId: results[0].id }, 'secretkey', { expiresIn: '1h' });
        res.json({ token, userId: results[0].id });
    });
});

// Set Budget
app.post('/budget', (req, res) => {
    const { userId, budget, budgetType } = req.body;

    db.query('INSERT INTO budgets (user_id, budget_amount, budget_type) VALUES (?, ?, ?)', 
        [userId, budget, budgetType], 
        (err, result) => {
            if (err) return res.status(500).send(err);
            res.send({ message: 'Budget Set' });
        });
});

// Add Expense
app.post('/expense', (req, res) => {
    const { userId, amount, category, date } = req.body;

    // Ensure all fields are provided
    if (!userId || !amount || !category || !date) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Corrected SQL query
    db.query('INSERT INTO expenses (user_id, amount, category, date) VALUES (?, ?, ?, ?)', 
        [userId, amount, category, date], 
        (err, result) => {
            if (err) {
                console.error('Database Error:', err);
                return res.status(500).send(err);
            }
            res.send({ message: 'Expense Added', id: result.insertId });
        });
});

// Get Expenses for User
app.get('/expenses/:userId', (req, res) => {
    db.query('SELECT * FROM expenses WHERE user_id = ?', [req.params.userId], (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});
app.get('/budget/:userId', (req, res) => {
    db.query('SELECT budget_amount FROM budgets WHERE user_id = ?', [req.params.userId], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result[0] || { budget_amount: 0 });
    });
});


app.listen(5000, () => console.log('Server running on port 5000'));
