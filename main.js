const CONFIG = {
    vidaInicial: 100,
    velocidadBase: 0.08,
    velocidadSprint: 0.18,
    danioPorEsfera: 10,
    velEsferas: 0.04,
    spawnInterval: 60,
    maxEsferas: 25,
    rangoMovimientoX: 6,
    rangoMovimientoY: 4,
    tamanoMundo: 15,
};

// ============================================
// 2. ESTADO DEL JUEGO
// ============================================
const gameState = {
    vida: CONFIG.vidaInicial,
    velocidad: CONFIG.velocidadBase,
    puntos: 0,
    gameOver: false,
    esferas: [],
    triangulosConsumidos: 0,
    frameCount: 0,
};

// ============================================
// 3. ESCENA, CÁMARA Y RENDERIZADOR
// ============================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);
scene.fog = new THREE.Fog(0x1a1a2e, 20, 40);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// ============================================
// 4. LUCES
// ============================================
const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);

const fillLight = new THREE.DirectionalLight(0x4466ff, 0.3);
fillLight.position.set(-10, 5, -10);
scene.add(fillLight);

// ============================================
// 5. SUELO
// ============================================
const groundGeometry = new THREE.PlaneGeometry(30, 20);
const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a4a,
    roughness: 0.7,
    metalness: 0.1,
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.5;
ground.receiveShadow = true;
scene.add(ground);

const gridHelper = new THREE.GridHelper(30, 20, 0x4466ff, 0x3344aa);
gridHelper.position.y = -0.49;
scene.add(gridHelper);

// ============================================
// 6. JUGADOR
// ============================================
const playerGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
const playerMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ff88,
    emissive: 0x00ff88,
    emissiveIntensity: 0.2,
    metalness: 0.3,
    roughness: 0.4,
});
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.castShadow = true;
player.position.y = 0.5;
scene.add(player);

const edges = new THREE.EdgesGeometry(playerGeometry);
const lineMaterial = new THREE.LineBasicMaterial({ color: 0x88ffcc });
const wireframe = new THREE.LineSegments(edges, lineMaterial);
player.add(wireframe);

// ============================================
// 7. TRIÁNGULOS
// ============================================
const trianguloGeometry = new THREE.BufferGeometry();
const trianguloCount = 80;
const trianguloPositions = new Float32Array(trianguloCount * 3);
const trianguloColors = new Float32Array(trianguloCount * 3);

for (let i = 0; i < trianguloCount; i++) {
    trianguloPositions[i * 3] = (Math.random() - 0.5) * 25;
    trianguloPositions[i * 3 + 1] = (Math.random() - 0.5) * 8 + 2;
    trianguloPositions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    
    const color = new THREE.Color().setHSL(Math.random(), 0.8, 0.6);
    trianguloColors[i * 3] = color.r;
    trianguloColors[i * 3 + 1] = color.g;
    trianguloColors[i * 3 + 2] = color.b;
}

trianguloGeometry.setAttribute('position', new THREE.BufferAttribute(trianguloPositions, 3));
trianguloGeometry.setAttribute('color', new THREE.BufferAttribute(trianguloColors, 3));

const trianguloMaterial = new THREE.PointsMaterial({
    size: 0.3,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
});
const triangulos = new THREE.Points(trianguloGeometry, trianguloMaterial);
scene.add(triangulos);

// ============================================
// 8. CREAR ESFERAS
// ============================================
function crearEsfera() {
    if (gameState.gameOver) return;
    if (gameState.esferas.length >= CONFIG.maxEsferas) return;

    const radio = 0.4 + Math.random() * 0.3;
    const geometry = new THREE.SphereGeometry(radio, 16, 16);
    const color = new THREE.Color().setHSL(Math.random() * 0.2 + 0.5, 0.9, 0.5);
    const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.2,
        metalness: 0.5,
        roughness: 0.3,
    });
    const esfera = new THREE.Mesh(geometry, material);
    
    const lado = Math.floor(Math.random() * 4);
    const posX = (Math.random() - 0.5) * 20;
    const posZ = (Math.random() - 0.5) * 15;
    
    switch(lado) {
        case 0: esfera.position.set(posX, radio, -CONFIG.tamanoMundo); break;
        case 1: esfera.position.set(CONFIG.tamanoMundo, radio, posZ); break;
        case 2: esfera.position.set(posX, radio, CONFIG.tamanoMundo); break;
        case 3: esfera.position.set(-CONFIG.tamanoMundo, radio, posZ); break;
    }
    
    esfera.castShadow = true;
    esfera.userData = {
        velocidad: CONFIG.velEsferas * (0.8 + Math.random() * 0.4),
        direccion: new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            0,
            (Math.random() - 0.5) * 2
        ).normalize(),
    };
    
    const haciaCentro = new THREE.Vector3(0, 0, 0).sub(esfera.position);
    esfera.userData.direccion.lerp(haciaCentro.normalize(), 0.3);
    esfera.userData.direccion.normalize();
    
    scene.add(esfera);
    gameState.esferas.push(esfera);
}

// ============================================
// 9. COLISIONES
// ============================================
function verificarColisiones() {
    const playerPos = player.position;
    const playerSize = 0.5;
    
    for (let i = gameState.esferas.length - 1; i >= 0; i--) {
        const esfera = gameState.esferas[i];
        const distancia = playerPos.distanceTo(esfera.position);
        const radioEsfera = esfera.geometry.parameters.radius || 0.4;
        
        if (distancia < playerSize + radioEsfera) {
            gameState.vida -= CONFIG.danioPorEsfera;
            scene.remove(esfera);
            gameState.esferas.splice(i, 1);
            
            if (gameState.vida <= 0) {
                gameState.vida = 0;
                gameOver();
            }
            actualizarHUD();
        }
    }
}

// ============================================
// 10. CONSUMIR TRIÁNGULOS
// ============================================
function consumirTriangulos() {
    if (gameState.gameOver) return;
    
    const positions = triangulos.geometry.attributes.position.array;
    const playerPos = player.position;
    const consumoDistancia = 2.5;
    let consumidos = 0;
    
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];
        const dist = Math.sqrt(
            Math.pow(x - playerPos.x, 2) + 
            Math.pow(y - playerPos.y, 2) + 
            Math.pow(z - playerPos.z, 2)
        );
        
        if (dist < consumoDistancia) {
            positions[i] = (Math.random() - 0.5) * 25;
            positions[i + 1] = (Math.random() - 0.5) * 8 + 2;
            positions[i + 2] = (Math.random() - 0.5) * 20;
            consumidos++;
        }
    }
    
    if (consumidos > 0) {
        triangulos.geometry.attributes.position.needsUpdate = true;
        gameState.triangulosConsumidos += consumidos;
        gameState.velocidad = CONFIG.velocidadBase + gameState.triangulosConsumidos * 0.003;
        gameState.puntos += consumidos * 3;
        actualizarHUD();
    }
}

// ============================================
// 11. HUD
// ============================================
const hudDiv = document.createElement('div');
hudDiv.id = 'hud';
hudDiv.innerHTML = `
    <div id="vida">❤️ Vida: 100</div>
    <div id="velocidad">⚡ Velocidad: ${CONFIG.velocidadBase.toFixed(2)}</div>
    <div id="puntos">⭐ Puntos: 0</div>
    <div id="triangulos">🔺 Triángulos: 0</div>
    <div id="game-over" style="display: none">💀 GAME OVER<br><span>Presiona R para reiniciar</span></div>
`;
document.body.appendChild(hudDiv);

function actualizarHUD() {
    const vidaEl = document.getElementById('vida');
    const velEl = document.getElementById('velocidad');
    const puntosEl = document.getElementById('puntos');
    const triEl = document.getElementById('triangulos');
    
    if (vidaEl) vidaEl.textContent = `❤️ Vida: ${Math.round(gameState.vida)}`;
    if (velEl) velEl.textContent = `⚡ Velocidad: ${gameState.velocidad.toFixed(2)}`;
    if (puntosEl) puntosEl.textContent = `⭐ Puntos: ${gameState.puntos}`;
    if (triEl) triEl.textContent = `🔺 Triángulos: ${gameState.triangulosConsumidos}`;
}

// ============================================
// 12. GAME OVER Y REINICIO
// ============================================
function gameOver() {
    gameState.gameOver = true;
    const gameOverEl = document.getElementById('game-over');
    if (gameOverEl) gameOverEl.style.display = 'block';
    player.material.color.setHex(0xff0000);
    player.material.emissive.setHex(0xff0000);
}

function reiniciarJuego() {
    gameState.vida = CONFIG.vidaInicial;
    gameState.velocidad = CONFIG.velocidadBase;
    gameState.puntos = 0;
    gameState.gameOver = false;
    gameState.triangulosConsumidos = 0;
    gameState.frameCount = 0;
    
    gameState.esferas.forEach(e => scene.remove(e));
    gameState.esferas = [];
    
    player.position.set(0, 0.5, 0);
    player.material.color.setHex(0x00ff88);
    player.material.emissive.setHex(0x00ff88);
    
    const gameOverEl = document.getElementById('game-over');
    if (gameOverEl) gameOverEl.style.display = 'none';
    actualizarHUD();
}

// ============================================
// 13. CONTROLES
// ============================================
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false
};

document.addEventListener('keydown', (event) => {
    let key = event.key.toLowerCase();
    if (key === 'shift') key = 'shift';
    
    if (key === 'r' && gameState.gameOver) {
        reiniciarJuego();
        return;
    }
    
    if (key in keys) {
        keys[key] = true;
    }
});

document.addEventListener('keyup', (event) => {
    let key = event.key.toLowerCase();
    if (key === 'shift') key = 'shift';
    if (key in keys) {
        keys[key] = false;
    }
});

// ============================================
// 14. GAME LOOP
// ============================================
function animate() {
    requestAnimationFrame(animate);
    
    if (!gameState.gameOver) {
        gameState.frameCount++;
        
        let currentSpeed = gameState.velocidad;
        if (keys.shift) {
            currentSpeed = CONFIG.velocidadSprint;
        }
        
        if (keys.w) player.position.z -= currentSpeed;
        if (keys.s) player.position.z += currentSpeed;
        if (keys.a) player.position.x -= currentSpeed;
        if (keys.d) player.position.x += currentSpeed;
        
        player.position.x = Math.max(-CONFIG.rangoMovimientoX, Math.min(CONFIG.rangoMovimientoX, player.position.x));
        player.position.z = Math.max(-CONFIG.rangoMovimientoY, Math.min(CONFIG.rangoMovimientoY, player.position.z));
        
        player.rotation.x += 0.01;
        player.rotation.y += 0.01;
        
        for (let i = gameState.esferas.length - 1; i >= 0; i--) {
            const esfera = gameState.esferas[i];
            esfera.position.x += esfera.userData.direccion.x * esfera.userData.velocidad;
            esfera.position.z += esfera.userData.direccion.z * esfera.userData.velocidad;
            
            esfera.rotation.x += 0.02;
            esfera.rotation.y += 0.03;
            
            const dist = Math.sqrt(esfera.position.x ** 2 + esfera.position.z ** 2);
            if (dist > CONFIG.tamanoMundo * 1.5) {
                scene.remove(esfera);
                gameState.esferas.splice(i, 1);
            }
        }
        
        verificarColisiones();
        consumirTriangulos();
        
        if (gameState.frameCount % CONFIG.spawnInterval === 0) {
            crearEsfera();
        }
        
        triangulos.rotation.y += 0.002;
        triangulos.rotation.x += 0.001;
    }
    
    camera.position.x = player.position.x * 0.3;
    camera.position.z = player.position.z * 0.3 + 10;
    camera.lookAt(player.position.x, 0, player.position.z);
    
    renderer.render(scene, camera);
}

// ============================================
// 15. RESPONSIVE
// ============================================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================
// 16. INICIO
// ============================================
actualizarHUD();
animate();

console.log('🎮 ¡Juego Iniciado!');
console.log('🕹️ Controles: WASD para mover, SHIFT para correr');
console.log('🔺 Consume triángulos para ganar velocidad');
console.log('💀 Esquiva las esferas');
console.log('🔄 Presiona R para reiniciar');