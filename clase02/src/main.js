import './style.css';
import * as THREE from 'three';

// =====================
// 1. ESCENA
// =====================
const scene = new THREE.Scene();

// =====================
// 2. CÁMARA
// =====================
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(0, 3, 8);

// =====================
// 3. RENDER
// =====================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// =====================
// 4. JUGADOR
// =====================
const playerGeo = new THREE.OctahedronGeometry(0.8, 1);

const playerMat = new THREE.MeshStandardMaterial({
  color: 0x66ccff
});

const player = new THREE.Mesh(playerGeo, playerMat);

let lane = 0;
player.position.set(0, 0, 0);
scene.add(player);

// 🦘 SALTO
let velocityY = 0;
let isJumping = false;

const gravity = -0.01;
const jumpPower = 0.25;

// 💀 GAME STATE
let gameOver = false;

// =====================
// RESET GAME
// =====================
function resetGame() {
  gameOver = false;

  lane = 0;
  player.position.set(0, 0, 0);
  velocityY = 0;
  isJumping = false;

  obstacles.forEach((obs, i) => {
    obs.position.z = -10 - i * 6;
    const lanes = [-2, 0, 2];
    obs.position.x = lanes[Math.floor(Math.random() * 3)];
  });

  coins.forEach((coin, i) => {
    coin.position.z = -5 - i * 4;
    const lanes = [-2, 0, 2];
    coin.position.x = lanes[Math.floor(Math.random() * 3)];
  });
}

// =====================
// 5. OBSTÁCULOS
// =====================
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const boxMat = new THREE.MeshStandardMaterial({ color: 0xffcc66 });

const obstacles = [];

function createObstacle(z) {
  const box = new THREE.Mesh(boxGeo, boxMat);

  const lanes = [-2, 0, 2];
  const randLane = lanes[Math.floor(Math.random() * 3)];

  box.position.set(randLane, 0, z);
  scene.add(box);
  obstacles.push(box);
}

for (let i = 0; i < 10; i++) {
  createObstacle(-10 - i * 6);
}

// =====================
// 🪙 MONEDAS
// =====================
const coinGeo = new THREE.SphereGeometry(0.3, 16, 16);

const coinMat = new THREE.MeshStandardMaterial({
  color: 0xffd700,
  emissive: 0xaa8800
});

const coins = [];

function createCoin(z) {
  const coin = new THREE.Mesh(coinGeo, coinMat);

  const lanes = [-2, 0, 2];
  const randLane = lanes[Math.floor(Math.random() * 3)];

  coin.position.set(randLane, 0.5, z);

  scene.add(coin);
  coins.push(coin);
}

for (let i = 0; i < 20; i++) {
  createCoin(-5 - i * 4);
}

// =====================
// 6. LUCES
// =====================
const light1 = new THREE.DirectionalLight(0xffffff, 1);
light1.position.set(5, 10, 5);
scene.add(light1);

const light2 = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(light2);

// =====================
// 7. TECLADO
// =====================
const keys = {
  arrowleft: false,
  arrowright: false
};

// movimiento carriles + salto
window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();

  if (key in keys) keys[key] = true;

  // 🦘 SALTO CON SPACE
  if (key === ' ') {
    if (!isJumping) {
      velocityY = jumpPower;
      isJumping = true;
    }
  }
});

window.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  if (key in keys) keys[key] = false;
});

// =====================
// 8. LOOP
// =====================
function animate() {
  requestAnimationFrame(animate);

  if (gameOver) {
    resetGame();
    return;
  }

  // -------- CAMBIO DE CARRIL --------
  if (keys.arrowleft) {
    lane = Math.max(-1, lane - 1);
    keys.arrowleft = false;
  }

  if (keys.arrowright) {
    lane = Math.min(1, lane + 1);
    keys.arrowright = false;
  }

  player.position.x += (lane * 2 - player.position.x) * 0.2;

  // 🦘 SALTO (FÍSICA)
  player.position.y += velocityY;
  velocityY += gravity;

  if (player.position.y <= 0) {
    player.position.y = 0;
    velocityY = 0;
    isJumping = false;
  }

  // -------- OBSTÁCULOS --------
  for (let obs of obstacles) {
    obs.position.z += 0.15;

    if (obs.position.z > 8) {
      obs.position.z = -60;

      const lanes = [-2, 0, 2];
      obs.position.x = lanes[Math.floor(Math.random() * 3)];
    }

    // 💀 COLISIÓN (solo si está en el piso)
    const dx = player.position.x - obs.position.x;
    const dz = player.position.z - obs.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.8 && player.position.y < 0.5) {
      gameOver = true;
    }
  }

  // -------- MONEDAS --------
  for (let i = 0; i < coins.length; i++) {
    const coin = coins[i];

    coin.position.z += 0.15;

    if (coin.position.z > 8) {
      coin.position.z = -80;

      const lanes = [-2, 0, 2];
      coin.position.x = lanes[Math.floor(Math.random() * 3)];
    }

    const dx = player.position.x - coin.position.x;
    const dz = player.position.z - coin.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.8) {
      scene.remove(coin);
      coins.splice(i, 1);
      i--;
    }
  }

  camera.position.x = player.position.x;
  camera.lookAt(player.position);

  renderer.render(scene, camera);
}

animate();

// =====================
// 9. RESIZE
// =====================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});