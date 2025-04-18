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
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session);
    if (session) {
        // User is signed in
        userStatusElement.textContent = `Signed in as: ${session.user.email}`; // Or display username/ID
        googleSignInBtn.style.display = 'none';
        signOutBtn.style.display = 'block';
        // TODO: Initialize/show game when user is signed in
        console.log('User is signed in. Session:', session);

        init(); // Initialize game when user signs in

    } else {
        // User is signed out
        userStatusElement.textContent = 'Please sign in';
        googleSignInBtn.style.display = 'block';
        signOutBtn.style.display = 'none';
        // TODO: Hide/reset game when user is signed out
        console.log('User is signed out.');
    }
});

// Add event listeners to buttons
googleSignInBtn.addEventListener('click', signInWithGoogle);
signOutBtn.addEventListener('click', signOut);

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
window.addEventListener('resize', resizeCanvas);