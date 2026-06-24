import './style.css';
import * as THREE from 'three';

// ESCENA
const scene = new THREE.Scene();

// CÁMARA
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.z = 5;

// RENDER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ESFERA
const geometry = new THREE.SphereGeometry(1, 32, 32);
const material = new THREE.MeshBasicMaterial({
  color: 0x00ff00
});

const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// TECLADO
const keys = {
  arrowleft: false,
  arrowright: false,
  arrowup: false,
  arrowdown: false
};

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();

  if (key in keys) {
    keys[key] = true;
  }
});

window.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();

  if (key in keys) {
    keys[key] = false;
  }
});

// LOOP
function animate() {
  requestAnimationFrame(animate);

  const speed = 0.05;

  if (keys.arrowleft) sphere.position.x -= speed;
  if (keys.arrowright) sphere.position.x += speed;
  if (keys.arrowup) sphere.position.y += speed;
  if (keys.arrowdown) sphere.position.y -= speed;

  renderer.render(scene, camera);
}

animate();

// RESIZE
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});