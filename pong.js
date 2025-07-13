$(document).ready(function () {
    const canvas = document.getElementById('pongCanvas');
    const context = canvas.getContext('2d');

    // Game constants
    let paddleWidth = 15;
    let paddleHeight = 100;
    let ballRadius = 8;
    const winningScore = 10;

    let playerY = canvas.height / 2 - paddleHeight / 2;
    let computerY = canvas.height / 2 - paddleHeight / 2;
    let ballX = canvas.width / 2;
    let ballY = canvas.height / 2;
    let ballSpeedX = 5;
    let ballSpeedY = 5;

    let playerScore = 0;
    let computerScore = 0;

    let gameRunning = true;

    // Paddle speed
    const paddleSpeed = 10;
    const computerPaddleSpeed = 4; // Slower for basic AI

    // Key states
    let keys = {};

    // Event listeners for keyboard input
    $(document).keydown(function (e) {
        keys[e.key.toLowerCase()] = true;
        keys[e.keyCode] = true; // For arrow keys
    });

    $(document).keyup(function (e) {
        keys[e.key.toLowerCase()] = false;
        keys[e.keyCode] = false; // For arrow keys
    });

    // Restart button listener
    $('#restart-btn').click(function () {
        resetGame();
    });

    function resizeCanvas() {
        const aspectRatio = 800 / 600;
        let newWidth = window.innerWidth;
        let newHeight = window.innerHeight;
        const newAspectRatio = newWidth / newHeight;

        if (newAspectRatio > aspectRatio) {
            newWidth = newHeight * aspectRatio;
        } else {
            newHeight = newWidth / aspectRatio;
        }

        canvas.width = newWidth;
        canvas.height = newHeight;

        const container = document.querySelector('.container');
        container.style.height = `${window.innerHeight}px`;

        // Scale game elements
        const scale = canvas.width / 800;
        paddleWidth = 15 * scale;
        paddleHeight = 100 * scale;
        ballRadius = 8 * scale;

        resetGame();
    }

    function resetGame() {
        playerScore = 0;
        computerScore = 0;
        $('#player-score').text(playerScore);
        $('#computer-score').text(computerScore);

        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        // Randomize initial ball direction
        ballSpeedX = Math.random() > 0.5 ? 5 : -5;
        ballSpeedY = Math.random() > 0.5 ? 5 : -5;

        playerY = canvas.height / 2 - paddleHeight / 2;
        computerY = canvas.height / 2 - paddleHeight / 2;

        gameRunning = true;
        if ($('#gameOverModal').length) { // Check if modal exists
          $('#gameOverModal').remove(); // Remove modal if it exists
        }
        gameLoop(); // Restart game loop if it was stopped
    }

    function drawRect(x, y, w, h, color) {
        context.fillStyle = color;
        context.fillRect(x, y, w, h);
    }

    function drawCircle(x, y, r, color) {
        context.fillStyle = color;
        context.beginPath();
        context.arc(x, y, r, 0, Math.PI * 2, false);
        context.fill();
    }

    function updateScoreboard() {
        $('#player-score').text(playerScore);
        $('#computer-score').text(computerScore);
    }

    function showGameOver(winner) {
        gameRunning = false;

        // Simple game over message using a Bootstrap alert dynamically added
        let gameOverMessage = `
            <div id="gameOverModal" class="alert alert-info mt-3" role="alert">
                Game Over! ${winner} wins!
                <button class="btn btn-sm btn-warning ms-3" onclick="document.getElementById('restart-btn').click()">Play Again?</button>
            </div>
        `;
        // Insert after canvas, before the restart button div
        $(gameOverMessage).insertAfter('#pongCanvas');
    }


    function gameLoop() {
        if (!gameRunning) {
            return;
        }

        // Player paddle movement
        if ((keys['w'] || keys[38]) && playerY > 0) { // W or Up Arrow
            playerY -= paddleSpeed;
        }
        if ((keys['s'] || keys[40]) && playerY < canvas.height - paddleHeight) { // S or Down Arrow
            playerY += paddleSpeed;
        }
        if (keys['r']) { // R key for restart
            resetGame();
            return; // Exit loop to prevent issues after reset
        }


        // AI paddle movement (simple)
        let computerPaddleCenter = computerY + paddleHeight / 2;
        if (computerPaddleCenter < ballY - 35 && computerY < canvas.height - paddleHeight) {
            computerY += computerPaddleSpeed;
        } else if (computerPaddleCenter > ballY + 35 && computerY > 0) {
            computerY -= computerPaddleSpeed;
        }
        // Ensure computer paddle stays within bounds
        if (computerY < 0) computerY = 0;
        if (computerY > canvas.height - paddleHeight) computerY = canvas.height - paddleHeight;


        // Ball movement
        ballX += ballSpeedX;
        ballY += ballSpeedY;

        // Collision with top/bottom walls
        if (ballY - ballRadius < 0 || ballY + ballRadius > canvas.height) {
            ballSpeedY = -ballSpeedY;
        }

        // Collision with paddles
        // Player paddle (left)
        if (ballX - ballRadius < paddleWidth && // Left of paddle's right edge
            ballX + ballRadius > 0 &&           // Right of paddle's left edge (which is 0)
            ballY > playerY &&
            ballY < playerY + paddleHeight) {
            ballSpeedX = -ballSpeedX;
            // Optional: Add slight angle change based on where it hits the paddle
            let deltaY = ballY - (playerY + paddleHeight / 2);
            ballSpeedY = deltaY * 0.2; // Adjust this factor for more/less effect
        }

        // Computer paddle (right)
        if (ballX + ballRadius > canvas.width - paddleWidth && // Right of paddle's left edge
            ballX - ballRadius < canvas.width &&                // Left of paddle's right edge (which is canvas.width)
            ballY > computerY &&
            ballY < computerY + paddleHeight) {
            ballSpeedX = -ballSpeedX;
            let deltaY = ballY - (computerY + paddleHeight / 2);
            ballSpeedY = deltaY * 0.2;
        }


        // Scoring
        if (ballX - ballRadius < 0) { // Computer scores
            computerScore++;
            updateScoreboard();
            if (computerScore >= winningScore) {
                showGameOver("Computer");
            } else {
                resetBall();
            }
        } else if (ballX + ballRadius > canvas.width) { // Player scores
            playerScore++;
            updateScoreboard();
            if (playerScore >= winningScore) {
                showGameOver("Player");
            } else {
                resetBall();
            }
        }

        // Helper to reset ball to center after a score
        function resetBall() {
            ballX = canvas.width / 2;
            ballY = canvas.height / 2;
            // Keep previous X speed direction but randomize Y a bit
            ballSpeedX = -ballSpeedX; // Change direction towards other player
            ballSpeedY = (Math.random() * 10 - 5); // Random Y speed between -5 and 5
        }


        // Clear canvas
        drawRect(0, 0, canvas.width, canvas.height, '#000'); // Black background

        // Draw paddles
        drawRect(0, playerY, paddleWidth, paddleHeight, '#FFF'); // Player paddle
        drawRect(canvas.width - paddleWidth, computerY, paddleWidth, paddleHeight, '#FFF'); // Computer paddle

        // Draw ball
        drawCircle(ballX, ballY, ballRadius, '#FFF'); // Ball

        // Draw middle line (optional decorative element)
        for(let i = 0; i < canvas.height; i += 40) {
            drawRect(canvas.width/2 - 1, i, 2, 20, '#555');
        }

        if (gameRunning) {
            requestAnimationFrame(gameLoop);
        }
    }

    // Initial setup
    $(window).resize(resizeCanvas);
    resizeCanvas(); // Initial resize
});
