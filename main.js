import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

console.log('Iniciando Temple Run 3D con Modelos...');

const CONFIG = {
    velocidadBase: 0.15,
    rangoMovimientoX: 2.5,
    rangoMovimientoY: 2.0,
    spawnInterval: 45,
    maxEsferas: 15,
    tamanoMundo: 12,
    velocidadTriangulos: 0.10,
    carriles: [-2, -1, 0, 1, 2],
    alturaMinima: 0.3,
    alturaMaxima: 3.5,
    probabilidadPar: 0.2,
};

const gameState = {
    puntos: 0,
    gameOver: false,
    esferas: [],
    triangulos: [],
    frameCount: 0,
    velocidad: CONFIG.velocidadBase,
    ultimoCarril: 0,
    modelosCargados: false,
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 3.5, 7);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(10, 15, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);

const fillLight = new THREE.DirectionalLight(0x4488ff, 0.3);
fillLight.position.set(-10, 5, -10);
scene.add(fillLight);

const backLight = new THREE.DirectionalLight(0xff8844, 0.2);
backLight.position.set(0, 5, -10);
scene.add(backLight);

const groundGeometry = new THREE.PlaneGeometry(12, 30);
const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a4a,
    roughness: 0.7,
    metalness: 0.1,
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, -0.5, -5);
ground.receiveShadow = true;
scene.add(ground);

const lineas = [];
for (let i = 0; i < 25; i++) {
    const lineGeo = new THREE.PlaneGeometry(0.1, 0.5);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x4466ff, transparent: true, opacity: 0.3 });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set((Math.random() - 0.5) * 10, -0.49, -i * 1.2 + 5);
    scene.add(line);
    lineas.push(line);
}

const loader = new GLTFLoader();
let modeloJugador = null;
let modeloEsfera = null;
let modeloTriangulo = null;

function crearModeloPorDefecto(tipo) {
    switch(tipo) {
        case 'jugador':
            const boxGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
            const boxMat = new THREE.MeshStandardMaterial({
                color: 0x4488ff,
                emissive: 0x4488ff,
                emissiveIntensity: 0.15,
                metalness: 0.3,
                roughness: 0.4,
            });
            const mesh = new THREE.Mesh(boxGeo, boxMat);
            mesh.castShadow = true;
            return mesh;
        case 'esfera':
            const sphereGeo = new THREE.SphereGeometry(0.4, 16, 16);
            const sphereMat = new THREE.MeshStandardMaterial({
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 0.3,
                metalness: 0.3,
                roughness: 0.5,
            });
            const sphere = new THREE.Mesh(sphereGeo, sphereMat);
            sphere.castShadow = true;
            return sphere;
        case 'triangulo':
            const triShape = new THREE.Shape();
            triShape.moveTo(0, 0.3);
            triShape.lineTo(0.3, -0.3);
            triShape.lineTo(-0.3, -0.3);
            triShape.closePath();
            
            const extrudeSettings = {
                steps: 1,
                depth: 0.1,
                bevelEnabled: true,
                bevelThickness: 0.05,
                bevelSize: 0.05,
                bevelSegments: 3,
            };
            const triGeo = new THREE.ExtrudeGeometry(triShape, extrudeSettings);
            const triMat = new THREE.MeshStandardMaterial({
                color: 0xffaa00,
                emissive: 0xffaa00,
                emissiveIntensity: 0.2,
                metalness: 0.3,
                roughness: 0.4,
            });
            const triMesh = new THREE.Mesh(triGeo, triMat);
            triMesh.castShadow = true;
            return triMesh;
    }
}

function cargarModelos() {
    console.log('Cargando modelos 3D...');
    let modelosCargados = 0;
    const totalModelos = 3;

    function verificarCarga() {
        modelosCargados++;
        if (modelosCargados === totalModelos) {
            gameState.modelosCargados = true;
            console.log('Todos los modelos cargados!');
            iniciarJuego();
        }
    }

    loader.load(
        'models/jugador.glb',
        (gltf) => {
            modeloJugador = gltf.scene;
            modeloJugador.scale.set(0.8, 0.8, 0.8);
            modeloJugador.castShadow = true;
            console.log('Modelo jugador cargado');
            verificarCarga();
        },
        undefined,
        (error) => {
            console.warn('No se pudo cargar modelo jugador, usando modelo por defecto');
            modeloJugador = crearModeloPorDefecto('jugador');
            verificarCarga();
        }
    );

    loader.load(
        'models/esfera.glb',
        (gltf) => {
            modeloEsfera = gltf.scene;
            modeloEsfera.scale.set(0.6, 0.6, 0.6);
            modeloEsfera.castShadow = true;
            console.log('Modelo esfera cargado');
            verificarCarga();
        },
        undefined,
        (error) => {
            console.warn('No se pudo cargar modelo esfera, usando modelo por defecto');
            modeloEsfera = crearModeloPorDefecto('esfera');
            verificarCarga();
        }
    );

    loader.load(
        'models/triangulo.glb',
        (gltf) => {
            modeloTriangulo = gltf.scene;
            modeloTriangulo.scale.set(0.5, 0.5, 0.5);
            modeloTriangulo.castShadow = true;
            console.log('Modelo triangulo cargado');
            verificarCarga();
        },
        undefined,
        (error) => {
            console.warn('No se pudo cargar modelo triangulo, usando modelo por defecto');
            modeloTriangulo = crearModeloPorDefecto('triangulo');
            verificarCarga();
        }
    );

    setTimeout(() => {
        if (!gameState.modelosCargados) {
            console.warn('Timeout cargando modelos, usando modelos por defecto');
            if (!modeloJugador) modeloJugador = crearModeloPorDefecto('jugador');
            if (!modeloEsfera) modeloEsfera = crearModeloPorDefecto('esfera');
            if (!modeloTriangulo) modeloTriangulo = crearModeloPorDefecto('triangulo');
            gameState.modelosCargados = true;
            iniciarJuego();
        }
    }, 5000);
}

let player = null;
let triangulos = null;

function iniciarJuego() {
    console.log('Iniciando juego con modelos 3D...');
    
    if (modeloJugador) {
        player = modeloJugador.clone();
        player.position.set(0, CONFIG.alturaMinima, 0);
        scene.add(player);
    }
    
    if (modeloTriangulo) {
        const count = 30;
        triangulos = [];
        
        for (let i = 0; i < count; i++) {
            const tri = modeloTriangulo.clone();
            const x = (Math.random() - 0.5) * 10;
            const y = (Math.random() - 0.5) * 5 + 1.5;
            const z = (Math.random() - 0.5) * 20 - 10;
            
            tri.position.set(x, y, z);
            tri.scale.set(0.5 + Math.random() * 0.3, 0.5 + Math.random() * 0.3, 0.5 + Math.random() * 0.3);
            
            const colores = [0xffaa00, 0x00ff88, 0xff66ff, 0xffff00, 0x00ffff, 0xaa66ff, 0xff8800];
            const color = colores[Math.floor(Math.random() * colores.length)];
            
            tri.traverse((child) => {
                if (child.isMesh) {
                    child.material = child.material.clone();
                    child.material.color.setHex(color);
                    child.material.emissive.setHex(color);
                    child.material.emissiveIntensity = 0.2;
                }
            });
            
            tri.castShadow = true;
            scene.add(tri);
            triangulos.push(tri);
        }
    }
    
    for (let i = 0; i < 3; i++) {
        setTimeout(() => crearEsfera(), i * 500);
    }
    
    actualizarHUD();
    console.log('Juego listo!');
}

function crearEsfera() {
    if (gameState.gameOver) return;
    if (gameState.esferas.length >= CONFIG.maxEsferas) return;
    if (!modeloEsfera) return;

    const esfera = modeloEsfera.clone();
    
    let carril;
    const carrilesDisponibles = CONFIG.carriles.filter(c => c !== gameState.ultimoCarril);
    carril = carrilesDisponibles[Math.floor(Math.random() * carrilesDisponibles.length)];
    gameState.ultimoCarril = carril;
    
    const yPos = CONFIG.alturaMinima + Math.random() * (CONFIG.alturaMaxima - CONFIG.alturaMinima);
    
    esfera.position.set(
        carril,
        yPos,
        -10 - Math.random() * 3
    );
    
    const scale = 0.5 + Math.random() * 0.3;
    esfera.scale.set(scale, scale, scale);
    
    esfera.castShadow = true;
    esfera.userData = {
        velocidad: CONFIG.velocidadBase * (0.9 + Math.random() * 0.2),
        carril: carril,
    };
    
    scene.add(esfera);
    gameState.esferas.push(esfera);
    
    if (Math.random() < CONFIG.probabilidadPar && gameState.esferas.length < CONFIG.maxEsferas - 1) {
        setTimeout(() => {
            const esfera2 = esfera.clone();
            const carril2 = carril + (Math.random() > 0.5 ? 1 : -1);
            if (carril2 >= -2 && carril2 <= 2) {
                const yPos2 = CONFIG.alturaMinima + Math.random() * (CONFIG.alturaMaxima - CONFIG.alturaMinima);
                esfera2.position.x = carril2;
                esfera2.position.y = yPos2;
                esfera2.position.z = -10 - Math.random() * 3;
                esfera2.userData = {
                    velocidad: CONFIG.velocidadBase * (0.9 + Math.random() * 0.2),
                    carril: carril2,
                };
                scene.add(esfera2);
                gameState.esferas.push(esfera2);
            }
        }, 200);
    }
}

function consumirTriangulos() {
    if (gameState.gameOver) return;
    if (!triangulos) return;
    
    const playerPos = player.position;
    const consumoDistancia = 1.5;
    let consumidos = 0;
    
    for (let i = triangulos.length - 1; i >= 0; i--) {
        const tri = triangulos[i];
        const dist = playerPos.distanceTo(tri.position);
        
        if (dist < consumoDistancia) {
            tri.position.set(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 5 + 1.5,
                -10 - Math.random() * 8
            );
            
            const colores = [0xffaa00, 0x00ff88, 0xff66ff, 0xffff00, 0x00ffff, 0xaa66ff, 0xff8800];
            const color = colores[Math.floor(Math.random() * colores.length)];
            
            tri.traverse((child) => {
                if (child.isMesh) {
                    child.material.color.setHex(color);
                    child.material.emissive.setHex(color);
                }
            });
            
            consumidos++;
        }
    }
    
    if (consumidos > 0) {
        gameState.puntos += consumidos * 5;
        gameState.velocidad = CONFIG.velocidadBase + gameState.puntos * 0.002;
        CONFIG.spawnInterval = Math.max(30, 45 - Math.floor(gameState.puntos / 30));
        actualizarHUD();
    }
}

function verificarColisiones() {
    if (!player) return;
    const playerPos = player.position;
    const playerSize = 0.35;
    
    for (let i = gameState.esferas.length - 1; i >= 0; i--) {
        const esfera = gameState.esferas[i];
        const distancia = playerPos.distanceTo(esfera.position);
        const radioEsfera = 0.4;
        
        if (distancia < playerSize + radioEsfera) {
            gameOver();
            return;
        }
    }
}

const hudDiv = document.createElement('div');
hudDiv.id = 'hud';
hudDiv.innerHTML = `
    <div id="puntos">Puntos: 0</div>
    <div id="velocidad">Velocidad: ${CONFIG.velocidadBase.toFixed(2)}</div>
    <div id="esferas">Esferas: 0</div>
    <div id="game-over" style="display: none">
        GAME OVER<br>
        <span>Puntuacion: 0</span>
        <span style="font-size: 20px; margin-top: 10px;">Presiona R para reiniciar</span>
    </div>
`;
document.body.appendChild(hudDiv);

function actualizarHUD() {
    const puntosEl = document.getElementById('puntos');
    const velEl = document.getElementById('velocidad');
    const esferasEl = document.getElementById('esferas');
    const gameOverEl = document.getElementById('game-over');
    
    if (puntosEl) puntosEl.textContent = `Puntos: ${gameState.puntos}`;
    if (velEl) velEl.textContent = `Velocidad: ${gameState.velocidad.toFixed(2)}`;
    if (esferasEl) esferasEl.textContent = `Esferas: ${gameState.esferas.length}`;
    if (gameOverEl && gameState.gameOver) {
        gameOverEl.innerHTML = `
            GAME OVER<br>
            <span>Puntuacion: ${gameState.puntos}</span>
            <span style="font-size: 20px; margin-top: 10px;">Presiona R para reiniciar</span>
        `;
    }
}

function gameOver() {
    gameState.gameOver = true;
    const gameOverEl = document.getElementById('game-over');
    if (gameOverEl) gameOverEl.style.display = 'block';
    if (player) {
        player.traverse((child) => {
            if (child.isMesh) {
                child.material.color.setHex(0xff0000);
                child.material.emissive.setHex(0xff0000);
            }
        });
    }
    actualizarHUD();
}

function reiniciarJuego() {
    gameState.puntos = 0;
    gameState.gameOver = false;
    gameState.velocidad = CONFIG.velocidadBase;
    gameState.frameCount = 0;
    gameState.ultimoCarril = 0;
    CONFIG.spawnInterval = 45;
    
    gameState.esferas.forEach(e => scene.remove(e));
    gameState.esferas = [];
    
    if (player) {
        player.position.set(0, CONFIG.alturaMinima, 0);
        player.traverse((child) => {
            if (child.isMesh) {
                child.material.color.setHex(0x4488ff);
                child.material.emissive.setHex(0x4488ff);
            }
        });
    }
    
    if (triangulos) {
        const colores = [0xffaa00, 0x00ff88, 0xff66ff, 0xffff00, 0x00ffff, 0xaa66ff, 0xff8800];
        triangulos.forEach((tri, index) => {
            tri.position.set(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 5 + 1.5,
                (Math.random() - 0.5) * 20 - 10
            );
            const color = colores[index % colores.length];
            tri.traverse((child) => {
                if (child.isMesh) {
                    child.material.color.setHex(color);
                    child.material.emissive.setHex(color);
                }
            });
        });
    }
    
    const gameOverEl = document.getElementById('game-over');
    if (gameOverEl) gameOverEl.style.display = 'none';
    
    actualizarHUD();
}

const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
};

document.addEventListener('keydown', (event) => {
    let key = event.key.toLowerCase();
    
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
    if (key in keys) {
        keys[key] = false;
    }
});

function animate() {
    requestAnimationFrame(animate);
    
    if (!gameState.gameOver && player) {
        gameState.frameCount++;
        
        const speed = 0.07;
        let movX = 0;
        let movY = 0;
        
        if (keys.a) movX = -speed;
        if (keys.d) movX = speed;
        if (keys.w) movY = speed;
        if (keys.s) movY = -speed;
        
        player.position.x += movX;
        player.position.y += movY;
        
        if (player.position.x > CONFIG.rangoMovimientoX) {
            player.position.x = CONFIG.rangoMovimientoX;
        } else if (player.position.x < -CONFIG.rangoMovimientoX) {
            player.position.x = -CONFIG.rangoMovimientoX;
        }
        
        if (player.position.y > CONFIG.alturaMaxima) {
            player.position.y = CONFIG.alturaMaxima;
        } else if (player.position.y < CONFIG.alturaMinima) {
            player.position.y = CONFIG.alturaMinima;
        }
        
        player.rotation.x += 0.005;
        player.rotation.y += 0.01;
        
        for (let i = gameState.esferas.length - 1; i >= 0; i--) {
            const esfera = gameState.esferas[i];
            esfera.position.z += esfera.userData.velocidad;
            
            esfera.rotation.x += 0.03;
            esfera.rotation.y += 0.04;
            
            if (esfera.position.z > 5) {
                scene.remove(esfera);
                gameState.esferas.splice(i, 1);
            }
        }
        
        if (triangulos) {
            triangulos.forEach(tri => {
                tri.position.z += CONFIG.velocidadTriangulos;
                
                if (tri.position.z > 5) {
                    tri.position.set(
                        (Math.random() - 0.5) * 10,
                        (Math.random() - 0.5) * 5 + 1.5,
                        -10 - Math.random() * 8
                    );
                }
            });
        }
        
        verificarColisiones();
        consumirTriangulos();
        
        if (gameState.frameCount % Math.floor(CONFIG.spawnInterval) === 0) {
            crearEsfera();
        }
        
        lineas.forEach(line => {
            line.position.z += 0.15;
            if (line.position.z > 6) {
                line.position.z = -10 - Math.random() * 5;
                line.position.x = (Math.random() - 0.5) * 10;
            }
        });
        
        actualizarHUD();
    }
    
    if (player) {
        camera.position.x = player.position.x * 0.4;
        camera.position.y = player.position.y * 0.2 + 3.5;
        camera.lookAt(player.position.x, player.position.y * 0.2, 0);
    }
    
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

cargarModelos();
animate();

console.log('Temple Run 3D con Modelos');
console.log('Cargando modelos 3D...');
console.log('Controles: A/D mover izquierda/derecha, W/S mover arriba/abajo');
console.log('Presiona R para reiniciar');