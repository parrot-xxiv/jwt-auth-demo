const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

const SECRET_KEY = 'your_secret_key';
const REFRESH_TOKEN_SECRET = 'your_refresh_secret';
const users = []; // In-memory "database" for user accounts
let refreshTokens = []; // Store refresh tokens

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes

// Home/Login route
app.get('/', (req, res) => {
    res.render('index', { title: 'Home Page' });
});

app.get('/register-page', (req, res) => {
    res.render('register');
});

// Register route
app.post('/register', (req, res) => {
    const { username } = req.body;

    // Check if the user already exists
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ status: 400, message: 'Username already exists' });
    }

    const id = Math.floor(1000 + Math.random() * 9000);
    users.push({ id, username });
    console.table(users);
    res.status(201).json({ status: 201, message: 'User registered' });
});

// Login route
app.post('/login', (req, res) => {
    const { username } = req.body;
    const user = users.find(u => u.username === username);

    if (!user) {
        return res.status(403).json({ message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.username);

    // Save refresh token to "database"
    refreshTokens.push(refreshToken);

    // Set the tokens in HTTP-only cookies
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    console.table(refreshTokens);
    res.status(200).json({ message: 'Logged in successfully' });
});

// Logout route
app.get('/logout', authenticateToken, (req, res) => {
    // Remove refreshToken
    refreshTokens = refreshTokens.filter(token => token !== req.cookies.refreshToken);

    console.log(req.user.username, 'logged out');
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.redirect('/');
});

// Protected route
app.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'This is a protected resource', user: req.user });
});

app.get('/profile-page', authenticateToken, (req, res) => {
    res.render('profile', { user: req.user });
});

// 404 Not Found Middleware
app.use((req, res, next) => {
    res.status(404);
    res.render('404'); // Render the 404.ejs template
});

// Middleware to authenticate tokens
function authenticateToken(req, res, next) {
    const accessToken = req.cookies.accessToken;
    
    if (!accessToken) return res.render('403');

    jwt.verify(accessToken, SECRET_KEY, (err, user) => {
        if (err) {
            console.log('access token expired...')
            // If access token is invalid, try to refresh it
            return handleRefreshToken(req, res, next);
        }
        req.user = user;
        console.log('token valid');
        next();
    });
}

function handleRefreshToken(req, res, next) {
    const { refreshToken } = req.cookies;

    if (!refreshToken || !refreshTokens.includes(refreshToken)) {
        console.log('invalid refresh token!');
        return res.render('403');
    }

    console.log('generating new access token...')

    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.render('403');
        
        const newAccessToken = generateTokens(user.id, user.username).accessToken;
        console.log('new access token successfully generated!')
        req.user = user; // Add user data to request for later use
        
        // Set new access token in cookies
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        next(); // Continue to the requested route
    });
}

function generateTokens(userId, username) {
    const accessToken = jwt.sign({ id: userId, username }, SECRET_KEY, { expiresIn: '10s' });
    const refreshToken = jwt.sign({ id: userId, username }, REFRESH_TOKEN_SECRET);

    return { accessToken, refreshToken };
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
