const container = document.getElementById('three-container');
const heroFrame = document.querySelector('.hero-frame');

let scene, camera, renderer, stars, glowStars, hazeMesh, starGeometry, glowGeometry;
const pointer = { normX: 0, normY: 0 };
const starCount = 9200;
const glowCount = 1800;
const positions = new Float32Array(starCount * 3);
const velocities = new Float32Array(starCount * 3);

function initScene() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#020107', 0.008);

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 180);
  camera.position.set(0, 0, 16);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setClearColor(0x020107, 0);
  renderer.domElement.style.touchAction = 'none';
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xb3b8ff, 0.32);
  scene.add(ambient);

  const pointLight = new THREE.PointLight(0x9f8bff, 0.55, 90);
  pointLight.position.set(0, 10, 18);
  scene.add(pointLight);

  createStarField();
  createGlowStars();
  createGalaxyHaze();

  animateUI();
  window.addEventListener('resize', onResize);
  window.addEventListener('pointermove', onPointerMove);
}

function createStarField() {
  for (let i = 0; i < starCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 48;
    positions[i * 3 + 1] = (Math.random() - 0.45) * 30;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 70;
    velocities[i * 3] = (Math.random() - 0.5) * 0.0008;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.0008;
    velocities[i * 3 + 2] = 0;
  }

  starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const starMaterial = new THREE.PointsMaterial({
    color: 0xf5f6ff,
    size: 0.12,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
}

function createGlowStars() {
  const glowPositions = new Float32Array(glowCount * 3);
  for (let i = 0; i < glowCount; i++) {
    glowPositions[i * 3] = (Math.random() - 0.5) * 46;
    glowPositions[i * 3 + 1] = (Math.random() - 0.5) * 28;
    glowPositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
  }

  glowGeometry = new THREE.BufferGeometry();
  glowGeometry.setAttribute('position', new THREE.BufferAttribute(glowPositions, 3));

  const glowMaterial = new THREE.PointsMaterial({
    color: 0xc3c7ff,
    size: 0.22,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  glowStars = new THREE.Points(glowGeometry, glowMaterial);
  scene.add(glowStars);
}

function createGalaxyHaze() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);

  gradient.addColorStop(0, 'rgba(255,255,255,0.22)');
  gradient.addColorStop(0.25, 'rgba(180, 135, 255, 0.10)');
  gradient.addColorStop(0.56, 'rgba(120, 80, 255, 0.04)');
  gradient.addColorStop(1, 'rgba(5,5,18,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const hazeMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.23,
    depthWrite: false,
  });

  hazeMesh = new THREE.Mesh(new THREE.PlaneGeometry(36, 24), hazeMaterial);
  hazeMesh.position.set(0, 0, -22);
  hazeMesh.rotation.set(0, 0, 0);
  scene.add(hazeMesh);
}

function updateStars() {
  const influence = 4.4;
  const pointerPos = new THREE.Vector3(pointer.normX * 26, pointer.normY * 18, 0);

  for (let i = 0; i < starCount; i++) {
    const idx = i * 3;
    const dx = positions[idx] - pointerPos.x;
    const dy = positions[idx + 1] - pointerPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < influence) {
      const force = (1 - dist / influence) * 0.02;
      velocities[idx] += (dx / (dist || 1)) * force;
      velocities[idx + 1] += (dy / (dist || 1)) * force;
    }

    velocities[idx] *= 0.94;
    velocities[idx + 1] *= 0.94;

    positions[idx] += velocities[idx];
    positions[idx + 1] += velocities[idx + 1];

    if (positions[idx] < -24 || positions[idx] > 24) {
      positions[idx] = THREE.MathUtils.randFloatSpread(48);
      velocities[idx] *= 0.3;
    }
    if (positions[idx + 1] < -16 || positions[idx + 1] > 16) {
      positions[idx + 1] = THREE.MathUtils.randFloatSpread(32);
      velocities[idx + 1] *= 0.3;
    }
  }

  starGeometry.attributes.position.needsUpdate = true;
}

function animate() {
  const time = performance.now() * 0.00008;

  camera.position.x += (pointer.normX * 3 - camera.position.x) * 0.04;
  camera.position.y += (-pointer.normY * 2 - camera.position.y) * 0.04;
  camera.lookAt(0, 0, 0);

  stars.rotation.y = time * 0.08;
  stars.rotation.x = Math.sin(time * 0.75) * 0.02;
  glowStars.rotation.y = time * 0.045;
  hazeMesh.rotation.z = Math.sin(time * 0.03) * 0.02;

  updateStars();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function animateUI() {
  if (heroFrame) {
    gsap.from(heroFrame, { duration: 1.4, opacity: 0, y: 44, ease: 'power3.out', delay: 0.16 });
    gsap.to(heroFrame, { y: 3.4, duration: 6, ease: 'sine.inOut', repeat: -1, yoyo: true });
  }
  gsap.from('h1', { duration: 1.5, opacity: 0, y: 32, scale: 0.94, ease: 'expo.out', delay: 0.3 });
}

function onPointerMove(event) {
  pointer.normX = (event.clientX / window.innerWidth - 0.5) * 2;
  pointer.normY = -(event.clientY / window.innerHeight - 0.5) * 2;
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

initScene();
animate();
