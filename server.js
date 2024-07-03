const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// MongoDB Atlas Connection
const dbUri = 'mongodb+srv://adityadeb:eCunNWFwpyZpHdul@testid.hyqwjw5.mongodb.net/?retryWrites=true&w=majority&appName=testid';
mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('Could not connect to MongoDB Atlas', err));

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

const User = mongoose.model('User', userSchema);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

// Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

app.get('/signup', (req, res) => {
    res.sendFile(__dirname + '/public/signup.html');
});

app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
        return res.redirect('/signup?message=User already exists.');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    try {
        await newUser.save();
        res.redirect('/?message=User signed up successfully.');
    } catch (err) {
        res.redirect('/signup?message=Error signing up user.');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username });
    if (!user) {
        return res.redirect('/?message=User not found.');
    }
    const match = await bcrypt.compare(password, user.password);
    if (match) {
        req.session.userId = user._id;
        req.session.username = user.username; // Store username in session
        res.redirect(`/chat`);
    } else {
        res.redirect('/?message=Invalid password.');
    }
});


app.get('/chat', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/?message=Please log in first.');
    }
    res.sendFile(__dirname + '/public/chat.html');
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/chat');
        }
        res.redirect('/');
    });
});

// Socket.io Connection Handling
io.on('connection', socket => {
    console.log('User connected:', socket.id);

    socket.on('message', msg => {
        io.emit('message', msg);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
