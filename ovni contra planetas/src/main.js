import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const CONFIG = {
    velocidadBase: 0.15,
    spawnInterval: 45,
    maxEsferas: 15,
    carriles: [-2, -1, 0, 1, 2],
    alturaMinima: 0.3,
    alturaMaxima: 3.5,
};

const game = {
    puntos: 0,
    gameOver: false,
    esferas: [],
    estrellas: [],
    frameCount: 0,
    velocidad: CONFIG.velocidadBase,
    ultimoCarril: 0,
    modelosListos: false,
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);

const luzAmbiente = new THREE.AmbientLight(0x4466aa, 0.6);
scene.add(luzAmbiente);

const luzPrincipal = new THREE.DirectionalLight(0xffffff, 1.2);
luzPrincipal.position.set(10, 15, 10);
luzPrincipal.castShadow = true;
scene.add(luzPrincipal);

const luzRelleno = new THREE.DirectionalLight(0x4488ff, 0.5);
luzRelleno.position.set(-10, 5, -10);
scene.add(luzRelleno);

const luzTrasera = new THREE.DirectionalLight(0x8866ff, 0.3);
luzTrasera.position.set(0, 5, -10);
scene.add(luzTrasera);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 3.5, 7);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

const suelo = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 30),
    new THREE.MeshStandardMaterial({ 
        color: 0x0a0a2a, 
        roughness: 0.9, 
        metalness: 0.1 
    })
);
suelo.rotation.x = -Math.PI / 2;
suelo.position.set(0, -0.5, -5);
suelo.receiveShadow = true;
scene.add(suelo);

const lineas = [];
for (let i = 0; i < 25; i++) {
    const linea = new THREE.Mesh(
        new THREE.PlaneGeometry(0.1, 0.5),
        new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.3 })
    );
    linea.rotation.x = -Math.PI / 2;
    linea.position.set((Math.random() - 0.5) * 10, -0.49, -i * 1.2 + 5);
    scene.add(linea);
    lineas.push(linea);
}

const estrellasFondo = new THREE.Points(
    new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 1500 }, () => new THREE.Vector3(
            (Math.random() - 0.5) * 200,
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 200 - 50
        ))
    ),
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.25, transparent: true, opacity: 0.9 })
);
scene.add(estrellasFondo);

const loader = new GLTFLoader();
let jugador = null;
let modelosPlanetas = [];
let modeloEstrella = null;

const planetasArchivos = [
    'planeta1.glb',
    'planeta2.glb', 
    'planeta3.glb',
    'planeta4.glb',
    'planeta5.glb'
];

let modelosCargados = 0;
const totalModelos = 1 + planetasArchivos.length + 1;

function verificarModelosCargados() {
    modelosCargados++;
    if (modelosCargados >= totalModelos) {
        console.log('Modelos 3D cargados');
        game.modelosListos = true;
        iniciarJuego();
    }
}

function cargarModelos() {
    console.log('Cargando modelos 3D...');
    
    loader.load('models/jugador.glb', (gltf) => {
        jugador = gltf.scene;
        jugador.scale.set(0.8, 0.8, 0.8);
        jugador.position.set(0, CONFIG.alturaMinima, 0);
        jugador.castShadow = true;
        scene.add(jugador);
        console.log('Jugador cargado');
        verificarModelosCargados();
    }, undefined, () => {
        console.log('Jugador no encontrado, usando cubo');
        verificarModelosCargados();
    });
    
    planetasArchivos.forEach((archivo, index) => {
        loader.load(`models/${archivo}`, (gltf) => {
            const planeta = gltf.scene;
            planeta.scale.set(0.5, 0.5, 0.5);
            planeta.castShadow = true;
            modelosPlanetas.push(planeta);
            console.log(`Planeta ${index + 1} cargado`);
            verificarModelosCargados();
        }, undefined, () => {
            console.log(`Planeta ${index + 1} no encontrado`);
            verificarModelosCargados();
        });
    });
    
    loader.load('models/estrella.glb', (gltf) => {
        modeloEstrella = gltf.scene;
        modeloEstrella.scale.set(0.5, 0.5, 0.5);
        modeloEstrella.castShadow = true;
        console.log('Estrella cargada');
        verificarModelosCargados();
    }, undefined, () => {
        console.log('Estrella no encontrada');
        verificarModelosCargados();
    });
}

function crearModeloPorDefecto(tipo) {
    if (tipo === 'jugador') {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.6, 0.6),
            new THREE.MeshStandardMaterial({ color: 0x4488ff })
        );
        mesh.castShadow = true;
        return mesh;
    }
    if (tipo === 'estrella') {
        const shape = new THREE.Shape();
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const radius = i % 2 === 0 ? 0.2 : 0.08;
            if (i === 0) shape.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            else shape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
        shape.closePath();
        const mesh = new THREE.Mesh(
            new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false }),
            new THREE.MeshStandardMaterial({ color: 0xffdd44 })
        );
        mesh.castShadow = true;
        return mesh;
    }
    if (tipo === 'planeta') {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xff4444 })
        );
        mesh.castShadow = true;
        return mesh;
    }
}

function iniciarJuego() {
    console.log('Iniciando juego...');
    
    if (!game.modelosListos) {
        setTimeout(iniciarJuego, 500);
        return;
    }
    
    if (!jugador) {
        jugador = crearModeloPorDefecto('jugador');
        jugador.position.set(0, CONFIG.alturaMinima, 0);
        scene.add(jugador);
    }
    
    if (modelosPlanetas.length === 0) {
        for (let i = 0; i < 5; i++) {
            const planeta = crearModeloPorDefecto('planeta');
            modelosPlanetas.push(planeta);
        }
    }
    
    if (!modeloEstrella) {
        modeloEstrella = crearModeloPorDefecto('estrella');
    }
    
    for (let i = 0; i < 30; i++) {
        const estrella = modeloEstrella.clone();
        estrella.position.set(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 5 + 1.5,
            (Math.random() - 0.5) * 20 - 10
        );
        const scale = 0.5 + Math.random() * 0.5;
        estrella.scale.set(scale, scale, scale);
        estrella.rotation.y = Math.random() * Math.PI * 2;
        scene.add(estrella);
        game.estrellas.push(estrella);
    }
    
    for (let i = 0; i < 3; i++) {
        setTimeout(crearPlaneta, i * 500);
    }
    
    actualizarHUD();
    console.log('Juego listo');
}

function crearPlaneta() {
    if (game.gameOver || game.esferas.length >= CONFIG.maxEsferas) return;
    if (modelosPlanetas.length === 0) return;
    
    const indice = Math.floor(Math.random() * modelosPlanetas.length);
    const planeta = modelosPlanetas[indice].clone();
    
    let carril;
    do {
        carril = CONFIG.carriles[Math.floor(Math.random() * CONFIG.carriles.length)];
    } while (carril === game.ultimoCarril);
    game.ultimoCarril = carril;
    
    const yPos = CONFIG.alturaMinima + Math.random() * (CONFIG.alturaMaxima - CONFIG.alturaMinima);
    planeta.position.set(carril, yPos, -10 - Math.random() * 3);
    
    const scale = 0.4 + Math.random() * 0.4;
    planeta.scale.set(scale, scale, scale);
    
    planeta.userData.velocidad = CONFIG.velocidadBase * (0.9 + Math.random() * 0.2);
    planeta.castShadow = true;
    scene.add(planeta);
    game.esferas.push(planeta);
}

function actualizarHUD() {
    document.getElementById('puntos').textContent = 'Puntos: ' + game.puntos;
    document.getElementById('velocidad').textContent = 'Velocidad: ' + game.velocidad.toFixed(2);
    document.getElementById('esferas').textContent = 'Planetas: ' + game.esferas.length;
}

const hud = document.createElement('div');
hud.id = 'hud';
hud.innerHTML = `
    <div id="puntos">Puntos: 0</div>
    <div id="velocidad">Velocidad: ${CONFIG.velocidadBase.toFixed(2)}</div>
    <div id="esferas">Planetas: 0</div>
    <div id="game-over" style="display:none">
        GAME OVER<br>
        <span>Puntuacion: 0</span>
        <span>Presiona R para reiniciar</span>
    </div>
`;
document.body.appendChild(hud);

const keys = { w: false, a: false, s: false, d: false };

document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'r' && game.gameOver) reiniciar();
    if (key in keys) keys[key] = true;
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = false;
});

function reiniciar() {
    game.puntos = 0;
    game.gameOver = false;
    game.velocidad = CONFIG.velocidadBase;
    game.frameCount = 0;
    game.esferas.forEach(e => scene.remove(e));
    game.esferas = [];
    if (jugador) jugador.position.set(0, CONFIG.alturaMinima, 0);
    document.getElementById('game-over').style.display = 'none';
    actualizarHUD();
}

function gameOver() {
    game.gameOver = true;
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('game-over').innerHTML = `
        GAME OVER<br>
        <span>Puntuacion: ${game.puntos}</span>
        <span>Presiona R para reiniciar</span>
    `;
}

function animate() {
    requestAnimationFrame(animate);
    
    if (!game.gameOver && jugador && game.modelosListos) {
        game.frameCount++;
        
        const speed = 0.07;
        if (keys.a) jugador.position.x -= speed;
        if (keys.d) jugador.position.x += speed;
        if (keys.w) jugador.position.y += speed;
        if (keys.s) jugador.position.y -= speed;
        
        jugador.position.x = Math.max(-2.5, Math.min(2.5, jugador.position.x));
        jugador.position.y = Math.max(CONFIG.alturaMinima, Math.min(CONFIG.alturaMaxima, jugador.position.y));
        
        jugador.rotation.x += 0.005;
        jugador.rotation.y += 0.01;
        
        for (let i = game.esferas.length - 1; i >= 0; i--) {
            const e = game.esferas[i];
            e.position.z += e.userData.velocidad;
            e.rotation.x += 0.02;
            e.rotation.y += 0.03;
            if (e.position.z > 5) {
                scene.remove(e);
                game.esferas.splice(i, 1);
            }
        }
        
        for (let i = game.estrellas.length - 1; i >= 0; i--) {
            const estrella = game.estrellas[i];
            estrella.position.z += 0.1;
            estrella.rotation.y += 0.02;
            if (estrella.position.z > 5) {
                estrella.position.set(
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 5 + 1.5,
                    -10 - Math.random() * 8
                );
            }
        }
        
        for (let i = game.esferas.length - 1; i >= 0; i--) {
            const e = game.esferas[i];
            if (jugador.position.distanceTo(e.position) < 0.7) {
                gameOver();
                return;
            }
        }
        
        for (let i = game.estrellas.length - 1; i >= 0; i--) {
            const estrella = game.estrellas[i];
            if (jugador.position.distanceTo(estrella.position) < 1.2) {
                estrella.position.set(
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 5 + 1.5,
                    -10 - Math.random() * 8
                );
                game.puntos += 5;
                game.velocidad = CONFIG.velocidadBase + game.puntos * 0.002;
                actualizarHUD();
            }
        }
        
        if (game.frameCount % CONFIG.spawnInterval === 0) {
            crearPlaneta();
        }
        
        lineas.forEach(line => {
            line.position.z += 0.15;
            if (line.position.z > 6) {
                line.position.z = -10 - Math.random() * 5;
                line.position.x = (Math.random() - 0.5) * 10;
            }
        });
        
        estrellasFondo.rotation.y += 0.0002;
    }
    
    if (jugador) {
        camera.position.x = jugador.position.x * 0.4;
        camera.position.y = jugador.position.y * 0.2 + 3.5;
        camera.lookAt(jugador.position.x, jugador.position.y * 0.2, 0);
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

console.log('Temple Run 3D');
console.log('Controles: A/D mover, W/S arriba/abajo');
console.log('Presiona R para reiniciar');