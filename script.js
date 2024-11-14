const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const timerElement = document.querySelector('.timer');
const scoreElement = document.querySelector('.score');
const highScoreElement = document.querySelector('.high-score');
const easyButton = document.getElementById('easyButton');
const hardButton = document.getElementById('hardButton');
const oniButton = document.getElementById('oniButton');
const laserElements = [
  document.getElementById('laser1'),
  document.getElementById('laser2'),
  document.getElementById('laser3'),
  document.getElementById('laser4'),
  document.getElementById('laser5'),
  document.getElementById('laser6'),
  document.getElementById('laser7'),
  document.getElementById('laser8'),
  document.getElementById('laser9'),
  document.getElementById('laser10')
];
const redLaserElements = [
  document.getElementById('redLaser1'),
  document.getElementById('redLaser2'),
  document.getElementById('redLaser3')
];

let player = {
  x: 50,
  y: canvas.height / 2,
  radius: 10,
  speed: 5
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
const oniObstacleInterval = 100; // 鬼畜モードの障害物出現間隔

let obstacleTimer = null;

let highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;

let lasers = []; // レーザーの配列
const maxLasers = 10; // 最大レーザー数
const laserSpeed = 10;
const redLaserSpeed = 5; // 赤いレーザーの速度

let redLasers = []; // 赤いレーザーの配列
const maxRedLasers = 3; // 最大赤いレーザー数

easyButton.addEventListener('click', () => {
  difficulty = 'easy';
  startGame();
});

hardButton.addEventListener('click', () => {
  difficulty = 'hard';
  startGame();
});

oniButton.addEventListener('click', () => {
  difficulty = 'oni';
  startGame();
});

function startGame() {
  easyButton.style.display = 'none';
  hardButton.style.display = 'none';
  oniButton.style.display = 'none';

  timerElement.style.display = 'block';
  scoreElement.style.display = 'block';
  highScoreElement.style.display = 'block';

  highScoreElement.textContent = `最高記録: ${highScore}`;

  // 障害物タイマーをクリア
  clearInterval(obstacleTimer);

  // 新しい障害物タイマーを設定
  obstacleTimer = setInterval(() => {
    generateObstacle();
  }, difficulty === 'easy' ? easyObstacleInterval : difficulty === 'hard' ? hardObstacleInterval : oniObstacleInterval);

  // ゲームオーバーフラグをリセット
  isGameOver = false;

  // スコアをリセット
  score = 0;
  avoidedObstacles = 0;

  // プレイヤーの位置をリセット
  player.x = 50;
  player.y = canvas.height / 2;

  // ゲームループを開始
  gameLoop();
}

function generateObstacle() {
  if (difficulty === 'hard' || difficulty === 'oni') {
    obstacleWidth = 30; // HARDと同じ大きさ
    obstacleHeight = 30;

    if (difficulty === 'oni' && Math.random() < 0.1) { // 鬼畜モードのみ10%の確率で巨大障害物
      obstacleWidth = 100;
      obstacleHeight = 100;
      obstacleColor = 'yellow'; // 巨大障害物の色は黄色
    }
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
    verticalSpeed: Math.random() * 2 - 1,
    width: obstacleWidth,
    height: obstacleHeight,
    color: obstacleColor
  });
}

function gameLoop(timestamp) {
  if (!startTime) {
    startTime = timestamp;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ゲームオーバーでない場合のみ、プレイヤーや障害物、レーザーを動かす
  if (!isGameOver) {
    // プレイヤーの移動
    if (isUpPressed && player.y - player.radius > 0) {
      player.y -= player.speed;
    } else if (isDownPressed && player.y + player.radius < canvas.height) {
      player.y += player.speed;
    }

    // レーザーの更新
    lasers.forEach((laser, index) => {
      laser.x += laserSpeed;
      laser.y += laser.verticalSpeed; // 縦方向に移動

      // 天井と床にぶつかったら跳ね返る
      if (laser.y < 0 || laser.y > canvas.height) {
        laser.verticalSpeed *= -1;
      }

      // レーザー要素の更新
      if (index < laserElements.length) {
        laserElements[index].style.left = laser.x + 'px';
        laserElements[index].style.top = laser.y + 'px';
        laserElements[index].style.display = 'block';
      }

      // レーザーが画面外に出たら削除
      if (laser.x > canvas.width) {
        lasers.splice(index, 1);
      }

      // レーザーと障害物の衝突判定
      obstacles.forEach((obstacle, obstacleIndex) => {
        if (
          laser.x < obstacle.x + obstacle.width &&
          laser.x + 5 > obstacle.x &&
          laser.y < obstacle.y + obstacle.height &&
          laser.y + 20 > obstacle.y
        ) {
          // 衝突したら障害物を消す
          obstacles.splice(obstacleIndex, 1);
          avoidedObstacles++;
          lasers.splice(index, 1); // 衝突したレーザーも削除

          // 赤いレーザーを発射
          if (redLasers.length < maxRedLasers) {
            redLasers.push({
              x: obstacle.x + obstacle.width / 2, // 障害物の真ん中から発射
              y: obstacle.y + obstacle.height / 2,
              targetX: player.x,
              targetY: player.y
            });
          }
        }
      });
    });

    // 赤いレーザーの更新
    redLasers.forEach((redLaser, index) => {
      // プレイヤーの方向に移動
      const angle = Math.atan2(redLaser.targetY - redLaser.y, redLaser.targetX - redLaser.x);
      redLaser.x += redLaserSpeed * Math.cos(angle);
      redLaser.y += redLaserSpeed * Math.sin(angle);

      // 赤いレーザー要素の更新
      if (index < redLaserElements.length) {
        redLaserElements[index].style.left = redLaser.x + 'px';
        redLaserElements[index].style.top = redLaser.y + 'px';
        redLaserElements[index].style.display = 'block';
      }

      // 赤いレーザーが画面外に出たら削除
      if (redLaser.x > canvas.width || redLaser.x < 0 || redLaser.y < 0 || redLaser.y > canvas.height) {
        redLasers.splice(index, 1);
      }

      // 赤いレーザーとプレイヤーの衝突判定
      if (
        redLaser.x < player.x + player.radius &&
        redLaser.x + 5 > player.x - player.radius &&
        redLaser.y < player.y + player.radius &&
        redLaser.y + 20 > player.y - player.radius
      ) {
        isGameOver = true;
        cancelAnimationFrame(gameLoop.animationFrame);
        clearInterval(obstacleTimer);
        redLasers.splice(index, 1); // 衝突した赤いレーザーも削除
      }
    });

    obstacles.forEach(obstacle => {
      let elapsedTime = timestamp - startTime;
      let obstacleSpeed = obstacle.speed * Math.pow(elapsedTime / 1000, 0.1); // 速度を秒単位で計算
      obstacle.x -= obstacleSpeed; 

      if (difficulty === 'hard' || difficulty === 'oni') {
        obstacle.y += obstacle.verticalSpeed;
        if (obstacle.y < 0 || obstacle.y + obstacle.height > canvas.height) {
          obstacle.verticalSpeed *= -1;
        }
      }

      if (obstacle.x < -obstacle.width) {
        obstacles.splice(obstacles.indexOf(obstacle), 1);
        avoidedObstacles++;
      }
      obstacle.rotation += obstacle.rotationSpeed;
    });

    // プレイヤーと障害物の衝突判定
    obstacles.forEach(obstacle => {
      if (
        player.x - player.radius < obstacle.x + obstacle.width &&
        player.x + player.radius > obstacle.x &&
        player.y - player.radius < obstacle.y + obstacle.height &&
        player.y + player.radius > obstacle.y
      ) {
        isGameOver = true;
        cancelAnimationFrame(gameLoop.animationFrame);
        clearInterval(obstacleTimer);
      }
    });
  }

  // プレイヤーを描画
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, 2 * Math.PI);
  ctx.fillStyle = 'black';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius - 1, 0, 2 * Math.PI);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 障害物を描画
  obstacles.forEach(obstacle => {
    ctx.save();
    ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
    ctx.rotate(obstacle.rotation);
    ctx.fillStyle = obstacle.color;
   
    ctx.beginPath();
    const sideLength = obstacle.width * Math.sqrt(3) / 2;
    const height = sideLength * Math.sqrt(3) / 2;
    ctx.moveTo(0, -height);
    ctx.lineTo(-sideLength / 2, height / 2);
    ctx.lineTo(sideLength / 2, height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  // 画面の枠を描画
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, 'rgba(0, 255, 255, 1)');
  gradient.addColorStop(1, 'rgba(255, 0, 255, 1)');
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  // ゲームオーバーでない場合、スコアと時間を更新して表示
  if (!isGameOver) {
    let elapsedTime = (timestamp - startTime) / 1000;
    let minutes = Math.floor(elapsedTime / 60);
    let seconds = Math.floor(elapsedTime % 60);

    timerElement.textContent = `タイム: ${minutes}:${seconds.toString().padStart(2, '0')}`;

    score = avoidedObstacles * 10 + Math.floor((timestamp - startTime) / 1000);
    scoreElement.textContent = `現在のスコア: ${score}`;
  }

  // ゲームオーバーの場合、ゲームオーバーメッセージを表示
  if (isGameOver) {
    gameOverScale += 0.01;
    gameOverFontSize = gameOverScale * 50;

    ctx.font = `${gameOverFontSize}px Arial`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);

    ctx.font = `${gameOverFontSize * 0.7}px Arial`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE: ${score}`, canvas.width / 2, canvas.height / 2 + 30);

    // 最高記録の更新
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('highScore', highScore);
    }
    highScoreElement.textContent = `最高記録: ${highScore}`;

    // 3秒後にページをリロード
    setTimeout(() => {
      location.reload();
    }, 3000);
  }

  // ゲームループを継続
  gameLoop.animationFrame = requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp' || event.key === 'w') {
    isUpPressed = true;
  } else if (event.key === 'ArrowDown' || event.key === 's') {
    isDownPressed = true;
  } else if (event.key === ' ') {
    // スペースキーを押すとレーザーを発射
    if (lasers.length < maxLasers) {
      lasers.push({
        x: player.x + player.radius, // プレイヤーの位置から発射
        y: player.y,
        verticalSpeed: (Math.random() - 0.5) * 15 // 縦方向の速度をさらに大きくする
      });
    }
  }
});

document.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowUp' || event.key === 'w') {
    isUpPressed = false;
  } else if (event.key === 'ArrowDown' || event.key === 's') {
    isDownPressed = false;
  }
});
