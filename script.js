const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const timerElement = document.querySelector('.timer');
const scoreElement = document.querySelector('.score');
const highScoreElement = document.querySelector('.high-score');
const easyButton = document.getElementById('easyButton');
const hardButton = document.getElementById('hardButton');


let player = {
  x: 50,
  y: canvas.height / 2,
  radius: 10,
  speed: 5,
  color: 'white',
  image: null 
};

let obstacleWidth = 20;
let obstacleHeight = 20;
const obstacleColor = 'red';

const averageObstacleSpeed = 2;
let obstacles = [];

let isUpPressed = false;
let isDownPressed = false;

let startTime = null;

let isGameOver = false;

let gameOverFontSize = 10;
let gameOverScale = 1;

let score = 0;

let avoidedObstacles = 0;

let difficulty = 'easy';

const easyObstacleInterval = 1000;
const hardObstacleInterval = 350;

let obstacleTimer = null;

let highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;

let isInvulnerable = false;
let invulnerabilityStartTime = null;
const invulnerabilityDuration = 3600000; 

let inputCode = '';

let hasDestroyedObstacle = false; 

let innerCircleColor = 'black'; 


easyButton.addEventListener('click', () => {
  difficulty = 'easy';
  startGame();
});

hardButton.addEventListener('click', () => {
  difficulty = 'hard';
  startGame();
});


function startGame() {
  easyButton.style.display = 'none';
  hardButton.style.display = 'none';

  timerElement.style.display = 'block'; 
  scoreElement.style.display = 'block';
  highScoreElement.style.display = 'block';

  highScoreElement.textContent = `最高記録: ${highScore}`;

  player.image = new Image();
  player.image.src = 'tera.png'; 

  obstacleTimer = setInterval(() => {
    generateObstacle();
  }, difficulty === 'easy' ? easyObstacleInterval : hardObstacleInterval);

  gameLoop();
}

function generateObstacle() {
  if (difficulty === 'hard') {
    obstacleWidth = 30;
    obstacleHeight = 30;
  } else {
    obstacleWidth = 20;
    obstacleHeight = 20;
  }

  let newObstacleX = canvas.width;
  let newObstacleY = Math.random() * (canvas.height - obstacleHeight);
  while (
    newObstacleX < player.x + player.radius &&
    newObstacleX + obstacleWidth > player.x - player.radius &&
    newObstacleY < player.y + player.radius &&
    newObstacleY + obstacleHeight > player.y - player.radius
  ) {
    newObstacleX = canvas.width;
    newObstacleY = Math.random() * (canvas.height - obstacleHeight);
  }
  obstacles.push({
    x: newObstacleX,
    y: newObstacleY,
    speed: averageObstacleSpeed + (Math.random() * 0.2 - 0.1),
    rotation: 0,
    rotationSpeed: Math.random() * 0.05 + 0.02,
    verticalSpeed: Math.random() * 2 - 1
  });
}

function gameLoop(timestamp) {
  if (!startTime) {
    startTime = timestamp;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (isUpPressed && isDownPressed) {
    player.color = 'red'; 
    player.y -= 0; 
    innerCircleColor = 'red'; 
  } else {
    player.color = 'white'; 
    if (isUpPressed && player.y - player.radius > 0) {
      player.y -= player.speed;
    } else if (isDownPressed && player.y + player.radius < canvas.height) {
      player.y += player.speed;
    }
    innerCircleColor = 'black'; 
  }

  obstacles.forEach(obstacle => {
    let elapsedTime = timestamp - startTime;
    let obstacleSpeed = obstacle.speed * Math.pow(elapsedTime / 1000, 0.1); 
    obstacle.x -= obstacleSpeed; 

    if (difficulty === 'hard') {
      obstacle.y += obstacle.verticalSpeed;
      if (obstacle.y < 0 || obstacle.y + obstacleHeight > canvas.height) {
        obstacle.verticalSpeed *= -1;
      }
    }

    if (obstacle.x < -obstacleWidth) {
      obstacles.splice(obstacles.indexOf(obstacle), 1);
      avoidedObstacles++;
    }
    obstacle.rotation += obstacle.rotationSpeed;
  });

  obstacles.forEach((obstacle, index) => {
    if (
      player.x - player.radius < obstacle.x + obstacleWidth &&
      player.x + player.radius > obstacle.x &&
      player.y - player.radius < obstacle.y + obstacleHeight &&
      player.y + player.radius > obstacle.y
    ) {
      if (isUpPressed && isDownPressed) {
        if (!hasDestroyedObstacle) { 
          hasDestroyedObstacle = true; 
          return; 
        }
      }

      isGameOver = true;
      cancelAnimationFrame(gameLoop.animationFrame);
      clearInterval(obstacleTimer);
    }
  });

  if (player.image) {
    ctx.imageSmoothingEnabled = true;
    ctx.save();
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(player.image, player.x - player.radius * 2, player.y - player.radius * 2, player.radius * 4, player.radius * 4);
    ctx.filter = 'blur(1000px)';
    ctx.drawImage(player.image, player.x - player.radius * 2, player.y - player.radius * 2, player.radius * 4, player.radius * 4);
    ctx.filter = 'none'; 
    ctx.restore();
  } else {
    if (isUpPressed && isDownPressed) {
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius * 0.8, 0, 2 * Math.PI); 
      ctx.fillStyle = innerCircleColor; 
      ctx.fill();

      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius - 1, 0, 2 * Math.PI);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, 2 * Math.PI);
      ctx.fillStyle = player.color; 
      ctx.fill();

      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius * 0.8, 0, 2 * Math.PI); 
      ctx.fillStyle = innerCircleColor; 
      ctx.fill();

      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius - 1, 0, 2 * Math.PI);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  obstacles.forEach(obstacle => {
    ctx.save();
    ctx.translate(obstacle.x + obstacleWidth / 2, obstacle.y + obstacleHeight / 2);
    ctx.rotate(obstacle.rotation);
  
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('非リア', 0, 0);
  
    ctx.restore();
  });

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, 'rgba(0, 255, 255, 1)');
  gradient.addColorStop(1, 'rgba(255, 0, 255, 1)');
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  if (!isGameOver) {
    let elapsedTime = (timestamp - startTime) / 1000;
    let minutes = Math.floor(elapsedTime / 60);
    let seconds = Math.floor(elapsedTime % 60);

    timerElement.textContent = `タイム: ${minutes}:${seconds.toString().padStart(2, '0')}`;

    score = avoidedObstacles * 10 + Math.floor((timestamp - startTime) / 1000);
    scoreElement.textContent = `スコア: ${score}`;
  }

  if (isGameOver) {
    gameOverScale += 0.01;
    gameOverFontSize = gameOverScale * 50;

    ctx.font = `${gameOverFontSize}px Arial`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);

    score = avoidedObstacles * 10 + Math.floor((timestamp - startTime) / 1000);

    ctx.font = `${gameOverFontSize * 0.7}px Arial`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE: ${score}`, canvas.width / 2, canvas.height / 2 + 30);

    if (score > highScore) {
      highScore = score;
      localStorage.setItem('highScore', highScore);
    }
    highScoreElement.textContent = `最高記録: ${highScore}`;

    setTimeout(() => {
      location.reload(); 
    }, 3000);

  } else {
    gameLoop.animationFrame = requestAnimationFrame(gameLoop);
  }
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'w' || event.key === 'ArrowUp') {
    isUpPressed = true;
  } else if (event.key === 's' || event.key === 'ArrowDown') {
    isDownPressed = true;
  } else if (event.key === 'm') {
    inputCode += 'm';
  } else if (event.key === 'u') {
    inputCode += 'u';
  } else if (event.key === 't') {
    inputCode += 't';
  } else if (event.key === 'e') {
    inputCode += 'e';
  } else if (event.key === 'k') {
    inputCode += 'k';
  } else if (event.key === 'i') {
    inputCode += 'i';
    if (inputCode === 'muteki') {
      isInvulnerable = true;
      inputCode = ''; 
    }
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'w' || event.key === 'ArrowUp') {
    isUpPressed = false;
    hasDestroyedObstacle = false; 
    player.color = 'white'; 
    innerCircleColor = 'black'; 
  } else if (event.key === 's' || event.key === 'ArrowDown') {
    isDownPressed = false;
    hasDestroyedObstacle = false; 
    player.color = 'white'; 
    innerCircleColor = 'black'; 
  }
});
