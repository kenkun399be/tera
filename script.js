const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const timerElement = document.querySelector('.timer');
const scoreElement = document.querySelector('.score');
const highScoreElement = document.querySelector('.high-score');
const easyButton = document.getElementById('easyButton');
const hardButton = document.getElementById('hardButton');
const skinButton = document.getElementById('skinButton');
const skinUploadContainer = document.getElementById('skinUploadContainer');
const skinUploadInput = document.getElementById('skinUploadInput');
const skinPreview = document.getElementById('skinPreview');
const closeButton = document.getElementById('closeButton');
const resetSkinButton = document.createElement('button'); // スキングリセットボタンを作成
const decideSkinButton = document.createElement('button'); // スキン決定ボタンを作成

resetSkinButton.textContent = 'リセット'; // ボタンのテキストを設定
resetSkinButton.classList.add('close-button'); // ボタンにスタイルクラスを追加
skinUploadContainer.appendChild(resetSkinButton); // ボタンをスキンアップロードコンテナに追加

decideSkinButton.textContent = '決定'; // ボタンのテキストを設定
decideSkinButton.classList.add('close-button'); // ボタンにスタイルクラスを追加
skinUploadContainer.appendChild(decideSkinButton); // ボタンをスキンアップロードコンテナに追加

let player = {
  x: 50,
  y: canvas.height / 2,
  radius: 10,
  speed: 5,
  color: 'white', // プレイヤーの色を追加
  image: null // プレイヤーの画像を追加
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
const invulnerabilityDuration = 3600000; // 1時間 (ミリ秒)

let inputCode = '';

let hasDestroyedObstacle = true; // 障害物を破壊したかどうか

let innerCircleColor = 'black'; // 内側の円の初期色

// ローカルストレージからスキンの画像データを取得してプレビューに表示
function updateSkinPreview() {
  const savedSkin = localStorage.getItem('playerSkin');
  if (savedSkin) {
    const img = new Image();
    img.onload = () => {
      skinPreview.innerHTML = `<img src="${savedSkin}">`;
    };
    img.src = savedSkin;
  } else {
    skinPreview.innerHTML = ''; // 画像がない場合はプレビューをクリア
  }
}

easyButton.addEventListener('click', () => {
  difficulty = 'easy';
  startGame();
});

hardButton.addEventListener('click', () => {
  difficulty = 'hard';
  startGame();
});

skinButton.addEventListener('click', () => {
  skinUploadContainer.style.display = 'flex';
  // ローカルストレージからスキンの画像データを取得してプレビューに表示
  updateSkinPreview();
});

closeButton.addEventListener('click', () => {
  skinUploadContainer.style.display = 'none';
});

skinUploadInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target.result;
      // 画像データをローカルストレージに保存 (Base64 エンコード)
      localStorage.setItem('playerSkin', imageData);
      // 画像を表示
      skinPreview.innerHTML = `<img src="${imageData}">`;
    };
    reader.readAsDataURL(file);
  }
});

resetSkinButton.addEventListener('click', () => {
  // ローカルストレージからスキンの画像データを削除
  localStorage.removeItem('playerSkin');
  // プレビューを更新
  updateSkinPreview();
});

decideSkinButton.addEventListener('click', () => {
  // スキン選択画面を閉じる
  skinUploadContainer.style.display = 'none';
  // ローカルストレージからスキンの画像データを取得してプレイヤーに適用
  const savedSkin = localStorage.getItem('playerSkin');
  if (savedSkin) {
    player.image = new Image();
    player.image.src = savedSkin;
  }
});

function startGame() {
  easyButton.style.display = 'none';
  hardButton.style.display = 'none';
  skinButton.style.display = 'none'; // ゲーム開始時にスキンのボタンを隠す

  timerElement.style.display = 'block'; 
  scoreElement.style.display = 'block';
  highScoreElement.style.display = 'block';

  highScoreElement.textContent = `最高記録: ${highScore}`;

  // ローカルストレージからスキンの画像データを取得
  const savedSkin = localStorage.getItem('playerSkin');
  if (savedSkin) {
    player.image = new Image();
    player.image.src = savedSkin;
  }

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
    player.color = 'red'; // 上下キー同時押しで赤色
    player.y -= 0; // プレイヤーを動かさない
    innerCircleColor = 'red'; // 内側の円を赤色に
  } else {
    player.color = 'white'; // 上下キー同時押し以外で白色
    if (isUpPressed && player.y - player.radius > 0) {
      player.y -= player.speed;
    } else if (isDownPressed && player.y + player.radius < canvas.height) {
      player.y += player.speed;
    }
    innerCircleColor = 'black'; // 内側の円を黒色に戻す
  }

  obstacles.forEach(obstacle => {
    let elapsedTime = timestamp - startTime;
    let obstacleSpeed = obstacle.speed * Math.pow(elapsedTime / 1000, 0.1); // 速度を秒単位で計算
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

  // 障害物との衝突判定 (障害物を破壊)
  obstacles.forEach((obstacle, index) => {
    if (
      player.x - player.radius < obstacle.x + obstacleWidth &&
      player.x + player.radius > obstacle.x &&
      player.y - player.radius < obstacle.y + obstacleHeight &&
      player.y + player.radius > obstacle.y
    ) {
      // 上下キー同時押しで障害物を破壊
      if (isUpPressed && isDownPressed) {
        innerCircleColor = 'black'; // 内側の円を黒色に戻す
        }
      }

      // その他の場合、ゲームオーバー
      isGameOver = true;
      cancelAnimationFrame(gameLoop.animationFrame);
      clearInterval(obstacleTimer);
    }
  });

  // プレイヤーを描画
  if (player.image) {
    // 円形にクリッピング
    ctx.save();
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * 2, 0, Math.PI * 2);
    ctx.clip();
    
    // 画像を拡大して描画
    ctx.drawImage(player.image, player.x - player.radius * 2, player.y - player.radius * 2, player.radius * 4, player.radius * 4);
    // 画像をぼかして描画
    ctx.filter = 'blur(4px)';
    ctx.drawImage(player.image, player.x - player.radius * 2, player.y - player.radius * 2, player.radius * 4, player.radius * 4);
    ctx.filter = 'none'; // フィルタを解除
    
    ctx.restore();
  } else {
    if (isUpPressed && isDownPressed) {
      // 上下キー同時押しで赤の部分を非表示にする
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius * 0.8, 0, 2 * Math.PI); // 半径を調整
      ctx.fillStyle = innerCircleColor; // 内側の円の色を使用
      ctx.fill();

      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius - 1, 0, 2 * Math.PI);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // 上下キー同時押し以外で通常通り表示する
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, 2 * Math.PI);
      ctx.fillStyle = player.color; // プレイヤーの色を使用
      ctx.fill();

      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius * 0.8, 0, 2 * Math.PI); // 半径を調整
      ctx.fillStyle = innerCircleColor; // 内側の円の色を使用
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
    ctx.fillStyle = obstacleColor;
   
    ctx.beginPath();
    const sideLength = obstacleWidth * Math.sqrt(3) / 2;
    const height = sideLength * Math.sqrt(3) / 2;
    ctx.moveTo(0, -height);
    ctx.lineTo(-sideLength / 2, height / 2);
    ctx.lineTo(sideLength / 2, height / 2);
    ctx.closePath();
    ctx.fill();
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
      location.reload(); // 3秒後にページを再読み込み
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
      inputCode = ''; // 入力コードをリセット
    }
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'w' || event.key === 'ArrowUp') {
    isUpPressed = false;
    hasDestroyedObstacle = false; // 上キーを離すと破壊可能状態に戻す
    player.color = 'white'; // 上キーを離すとプレイヤーの色を白に戻す
    innerCircleColor = 'black'; // 内側の円を黒色に戻す
  } else if (event.key === 's' || event.key === 'ArrowDown') {
    isDownPressed = false;
    hasDestroyedObstacle = false; // 下キーを離すと破壊可能状態に戻す
    player.color = 'white'; // 下キーを離すとプレイヤーの色を白に戻す
    innerCircleColor = 'black'; // 内側の円を黒色に戻す
  }
});
