const container = document.getElementById('three-container');
const hero = document.querySelector('.hero');
const heroFrame = document.querySelector('.hero-frame');

let scene, camera, renderer, birdMesh, particleSystem;
const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
const birdCount = 48;
const birds = [];
const tmpObject = new THREE.Object3D();

function initScene() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#020107', 0.01);

  camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 180);
  camera.position.set(0, 1.8, 14);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.style.touchAction = 'none';
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0x98a6ff, 0.45);
  scene.add(ambient);

  const pointLight = new THREE.PointLight(0xf5f0ff, 1.1, 120);
  pointLight.position.set(8, 10, 10);
  scene.add(pointLight);

  const fillLight = new THREE.PointLight(0x7f8fff, 0.55, 120);
  fillLight.position.set(-8, 8, -12);
  scene.add(fillLight);

  createEnvironment();
  createBirdFlock();
  createParticleField();
  animateUI();
  window.addEventListener('resize', onResize);
  window.addEventListener('pointermove', onPointerMove);
}

function createEnvironment() {
  const base = new THREE.IcosahedronGeometry(5.4, 3);
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x5d6cff,
    metalness: 0.4,
    roughness: 0.15,
    emissive: 0x1d2eff,
    emissiveIntensity: 0.22,
    transparent: true,
    opacity: 0.94,
    side: THREE.DoubleSide,
  });

  const core = new THREE.Mesh(base, baseMaterial);
  core.position.set(-1.5, 0, -8);
  core.rotation.set(0.18, -0.45, 0);
  scene.add(core);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(10.2, 0.08, 16, 120),
    new THREE.MeshBasicMaterial({
      color: 0xa59bff,
      transparent: true,
      opacity: 0.14,
    })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.7;
  scene.add(ring);

  const accentRing = new THREE.Mesh(
    new THREE.TorusGeometry(8.6, 0.055, 12, 100),
    new THREE.MeshBasicMaterial({
      color: 0xff92d7,
      transparent: true,
      opacity: 0.12,
    })
  );
  accentRing.rotation.x = Math.PI / 2;
  accentRing.position.y = 1.1;
  scene.add(accentRing);

  gsap.to(core.rotation, { y: Math.PI * 2, duration: 56, repeat: -1, ease: 'none' });
  gsap.to(ring.rotation, { z: Math.PI * 2, duration: 48, repeat: -1, ease: 'none' });
  gsap.to(accentRing.rotation, { z: -Math.PI * 2, duration: 34, repeat: -1, ease: 'none' });
}

function createParticleField() {
  const particleCount = 260;
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 1] = (Math.random() - 0.2) * 18;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 32;
    sizes[i] = Math.random() * 2.1 + 0.8;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    color: 0xd0d5ff,
    size: 0.15,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });

  particleSystem = new THREE.Points(geometry, material);
  scene.add(particleSystem);
}

function createBirdFlock() {
  const birdGeometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([0, 0.14, 0, -0.16, -0.1, 0, 0.16, -0.1, 0]);
  birdGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  birdGeometry.computeVertexNormals();

  const birdMaterial = new THREE.MeshBasicMaterial({
    color: 0xf8f2ff,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
  });

  birdMesh = new THREE.InstancedMesh(birdGeometry, birdMaterial, birdCount);
  birdMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  for (let i = 0; i < birdCount; i++) {
    const bird = {
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 22,
        (Math.random() - 0.2) * 8 + 2,
        (Math.random() - 0.5) * 24
      ),
      velocity: new THREE.Vector3((Math.random() - 0.5) * 0.04, (Math.random() - 0.25) * 0.02, (Math.random() - 0.5) * 0.04),
      speed: 0.03 + Math.random() * 0.06,
      wiggle: Math.random() * Math.PI * 2,
      scale: 0.8 + Math.random() * 0.7,
    };
    birds.push(bird);
    updateBirdInstance(i, bird);
  }

  scene.add(birdMesh);
}

function updateBirdInstance(index, bird) {
  tmpObject.position.copy(bird.position);
  tmpObject.scale.setScalar(bird.scale);
  tmpObject.lookAt(bird.position.clone().add(bird.velocity));
  tmpObject.updateMatrix();
  birdMesh.setMatrixAt(index, tmpObject.matrix);
}

function updateFlock() {
  const mouse = new THREE.Vector3(pointer.targetX * 12, pointer.targetY * 8, -6);

  for (let i = 0; i < birdCount; i++) {
    const bird = birds[i];
    const avoid = bird.position.clone().sub(mouse);
    const distance = avoid.length();

    if (distance < 4.5) {
      avoid.normalize().multiplyScalar((4.5 - distance) * 0.03);
      bird.velocity.add(avoid);
    }

    const center = new THREE.Vector3((Math.sin(i + clock.elapsedTime * 0.3) * 7), 1.8 + Math.cos(i * 0.6) * 2.2, Math.sin(i * 0.7) * 4);
    bird.velocity.lerp(center.sub(bird.position).multiplyScalar(0.008), 0.02);

    bird.velocity.add(new THREE.Vector3((Math.random() - 0.5) * 0.002, (Math.random() - 0.5) * 0.0015, (Math.random() - 0.5) * 0.002));
    bird.velocity.clampLength(0.01, 0.12);
    bird.position.add(bird.velocity);
    bird.position.x = THREE.MathUtils.euclideanModulo(bird.position.x + 24, 48) - 24;
    bird.position.y = THREE.MathUtils.clamp(bird.position.y, -1.2, 5.5);
    bird.position.z = THREE.MathUtils.euclideanModulo(bird.position.z + 36, 72) - 36;
    const wing = 0.15 + Math.sin(clock.elapsedTime * 18 + i) * 0.06;
    bird.scale = 0.9 + wing * 0.8;
    updateBirdInstance(i, bird);
  }
  birdMesh.instanceMatrix.needsUpdate = true;
}

const clock = new THREE.Clock();

function animate() {
  const delta = clock.getDelta();
  const elapsed = clock.elapsedTime;

  pointer.x += (pointer.targetX - pointer.x) * 0.08;
  pointer.y += (pointer.targetY - pointer.y) * 0.08;

  camera.position.x = pointer.x * 2.1;
  camera.position.y = 1.8 + pointer.y * 0.9;
  camera.lookAt(0, 0.8, -8);

  if (particleSystem) {
    particleSystem.rotation.y = elapsed * 0.01;
  }

  updateFlock();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function animateUI() {
  if (heroFrame) {
    gsap.from(heroFrame, { duration: 1.2, opacity: 0, y: 40, ease: 'power3.out', delay: 0.1 });
    gsap.to(heroFrame, { y: 4, duration: 6, ease: 'sine.inOut', repeat: -1, yoyo: true });
  }
  gsap.from('.eyebrow', { duration: 1, opacity: 0, y: -18, ease: 'power3.out', delay: 0.25 });
  gsap.from('h1', { duration: 1.4, opacity: 0, y: 28, ease: 'power4.out', delay: 0.35 });
  gsap.from('p', { duration: 1.4, opacity: 0, y: 26, ease: 'power4.out', delay: 0.55 });
  gsap.from('.hero-footnote', { duration: 1.2, opacity: 0, y: 20, ease: 'power3.out', delay: 0.75 });
}

function onPointerMove(event) {
  pointer.targetX = (event.clientX / window.innerWidth - 0.5) * 2;
  pointer.targetY = -(event.clientY / window.innerHeight - 0.5) * 2;
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

initScene();
animate();
