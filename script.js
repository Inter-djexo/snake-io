// Replace with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'https://pjwvfguikaecpolcxupt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqd3ZmZ3Vpa2FlY3BvbGN4dXB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MDM2MzIsImV4cCI6MjA2MDE3OTYzMn0.vXTqem8rcHZH9tvyB_UdsPipynjKcCMTWgOekGMJz0A';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const googleSignInBtn = document.getElementById('google-sign-in');
const signOutBtn = document.getElementById('sign-out');
const userStatusElement = document.getElementById('user-status');

// Function to handle signing in with Google
async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
    });
    if (error) {
        console.error('Error signing in with Google:', error.message);
        userStatusElement.textContent = 'Sign-in failed!';
    }
    // On successful sign-in, Google will redirect the user back to your site
}

// Function to handle signing out
async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error signing out:', error.message);
    } else {
        console.log('Signed out successfully');
    }
}

// Listen for auth state changes (like sign-in, sign-out, token refresh)
supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event, session);
    if (session) {
        // User is signed in
        userStatusElement.textContent = `Signed in as: ${session.user.email}`;
        googleSignInBtn.style.display = 'none';
        signOutBtn.style.display = 'block';

        // Check if profile exists, create if not
        const profile = await fetchProfile(session.user.id);
        if (!profile) {
            await createProfile(session.user);
        }

        init(); // Initialize game when user signs in
        fetchLeaderboard(); // Fetch and display leaderboard

    } else {
        // User is signed out
        userStatusElement.textContent = 'Please sign in';
        googleSignInBtn.style.display = 'block';
        signOutBtn.style.display = 'none';
        console.log('User is signed out.');
    }
});

async function fetchProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching profile:', error.message);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error fetching profile:', error.message);
        return null;
    }
}

async function createProfile(user) {
    const username = prompt('Please enter a username:');
    if (username) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .insert([{ id: user.id, username: username }]);

            if (error) {
                console.error('Error creating profile:', error.message);
                alert('Failed to create profile. Please try again.');
            } else {
                console.log('Profile created successfully:', data);
                alert('Profile created successfully!');
            }
        } catch (error) {
            console.error('Error creating profile:', error.message);
            alert('An unexpected error occurred while creating your profile.');
        }
    } else {
        alert('Username cannot be empty.');
    }
}


// Add event listeners to buttons
googleSignInBtn.addEventListener('click', signInWithGoogle);
signOutBtn.addEventListener('click', signOut);

// --- Leaderboard Logic ---

async function fetchLeaderboard() {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('username, total_score')
            .order('total_score', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Error fetching leaderboard:', error.message);
            alert('Failed to fetch leaderboard. Please try again.');
        } else {
            console.log('Leaderboard fetched successfully:', data);
            displayLeaderboard(data);
        }
    } catch (error) {
        console.error('Error fetching leaderboard:', error.message);
        alert('An unexpected error occurred while fetching the leaderboard.');
    }
}

function displayLeaderboard(leaderboardData) {
    const leaderboardContainer = document.getElementById('leaderboard');
    if (!leaderboardContainer) {
        console.error('Leaderboard container not found in index.html');
        return;
    }

    // Clear any existing leaderboard data
    leaderboardContainer.innerHTML = '';

    // Create leaderboard header
    const header = document.createElement('h2');
    header.textContent = 'Leaderboard';
    leaderboardContainer.appendChild(header);

    // Create leaderboard list
    const list = document.createElement('ol');
    leaderboardData.forEach(player => {
        const listItem = document.createElement('li');
        listItem.textContent = `${player.username}: ${player.total_score}`;
        list.appendChild(listItem);
    });
    leaderboardContainer.appendChild(list);
}

// --- Game Logic ---

// Basic setup for the canvas
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Resize canvas to fit viewport
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - document.getElementById('auth').offsetHeight - 20; // Adjust based on layout
}

// Game variables
let snake = [{ x: 200, y: 200 }];
let food = {};
let score = 0;
let dx = 10; // Change in x
let dy = 0;  // Change in y

// Generate initial food
function generateFood() {
    food = {
        x: Math.floor(Math.random() * (canvas.width / 10)) * 10,
        y: Math.floor(Math.random() * (canvas.height / 10)) * 10
    };
}

// Initialize game
function init() {
    resizeCanvas();
    generateFood();
    document.addEventListener('keydown', changeDirection);
    gameLoop();
}

// Change direction function
function changeDirection(event) {
    const keyPressed = event.keyCode;
    const LEFT = 37;
    const UP = 38;
    const RIGHT = 39;
    const DOWN = 40;

    const goingUp = dy === -10;
    const goingDown = dy === 10;
    const goingRight = dx === 10;
    const goingLeft = dx === -10;

    if (keyPressed === LEFT && !goingRight) { dx = -10; dy = 0; }
    if (keyPressed === UP && !goingDown) { dx = 0; dy = -10; }
    if (keyPressed === RIGHT && !goingLeft) { dx = 10; dy = 0; }
    if (keyPressed === DOWN && !goingUp) { dx = 0; dy = 10; }
}

// Check collision function
function checkCollision() {
    for (let i = 4; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) return true;
    }

    const hitLeftWall = snake[0].x < 0;
    const hitRightWall = snake[0].x > canvas.width - 10;
    const hitToptWall = snake[0].y < 0;
    const hitBottomWall = snake[0].y > canvas.height - 10;

    return hitLeftWall || hitRightWall || hitToptWall || hitBottomWall
}

// Update game function
function update() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    const didEatFood = snake[0].x === food.x && snake[0].y === food.y;
    if (didEatFood) {
        score += 10;
        generateFood();
    } else {
        snake.pop();
    }
}

// Draw function
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw snake
    ctx.fillStyle = 'green';
    snake.forEach(part => ctx.fillRect(part.x, part.y, 10, 10));

    // Draw food
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x, food.y, 10, 10);

    // Display score
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 30);
}

// Main game loop
function gameLoop() {
    if (checkCollision()) {
        const gameDuration = 0; // Calculate actual game duration
        saveScore(score, gameDuration);
        alert('Game Over! Score: ' + score);
        snake = [{ x: 200, y: 200 }];
        score = 0;
        dx = 10;
        dy = 0;
        generateFood();
        return;
    }

    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Initial resize
resizeCanvas();
async function saveScore(score, gameDuration) {
    if (!supabase.auth.currentUser) {
        console.warn('User not signed in, score not saved.');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('scores')
            .insert([
                { user_id: supabase.auth.currentUser.id, score: score, game_duration_seconds: gameDuration },
            ]);

        if (error) {
            console.error('Error saving score:', error.message);
            alert('Failed to save score. Please try again.');
        } else {
            console.log('Score saved successfully:', data);
        }
    } catch (error) {
        console.error('Error saving score:', error.message);
        alert('An unexpected error occurred while saving your score.');
    }
}

window.addEventListener('resize', resizeCanvas);