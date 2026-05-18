// --- Scene Setup ---
const container = document.getElementById('three-container');
const scene = new THREE.Scene();

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 1;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// --- Shader Material for Animated Gradient ---
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_color1;
  uniform vec3 u_color2;
  uniform vec3 u_color3;
  uniform vec3 u_color4;
  
  varying vec2 vUv;

  // Simplex 3D Noise 
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute( permute( permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    float n_ = 0.142857142857; // 1.0/7.0
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 105.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                  dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    // Normalize coordinates
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    
    // Create base positions for noise
    vec2 pos = st * 1.2; 

    // Warp domain with multiple layers of noise
    float n1 = snoise(vec3(pos * 1.0, u_time * 0.08));
    float n2 = snoise(vec3(pos * 1.8 + vec2(n1 * 1.5), u_time * 0.12));
    float n3 = snoise(vec3(pos * 0.6 + vec2(n2 * 2.0), u_time * 0.05));

    // Mix colors fluidly - lots of dark space for smoke
    vec3 color = u_color1;
    color = mix(color, u_color2, smoothstep(0.1, 0.9, n1));
    color = mix(color, u_color3, smoothstep(0.4, 1.0, n2));
    color = mix(color, u_color4, smoothstep(0.3, 0.9, n3));

    gl_FragColor = vec4(color, 1.0);
  }
`;

// Orange and yellow smoky fluid colors
const uniforms = {
  u_time: { value: 0.0 },
  u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  u_color1: { value: new THREE.Color('#020107') }, // Very dark background base
  u_color2: { value: new THREE.Color('#993300') }, // Burnt orange, subtle
  u_color3: { value: new THREE.Color('#ddaa00') }, // Slight yellow highlight
  u_color4: { value: new THREE.Color('#1a0500') }  // Deep smoky shadow
};

const geometry = new THREE.PlaneGeometry(2, 2);
const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms,
  depthWrite: false,
  depthTest: false
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// --- Interactions ---
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
});

// --- Animation Loop ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  uniforms.u_time.value = clock.getElapsedTime();
  renderer.render(scene, camera);
}
animate();

// --- GSAP UI Animations ---
const tl = gsap.timeline();

tl.to('.hero-content', {
  y: 0,
  opacity: 1,
  duration: 1.2,
  ease: 'power3.out',
  delay: 0.2
})
.from('.scroll-indicator', {
  opacity: 0,
  y: 20,
  duration: 1,
  ease: 'power2.out'
}, '-=0.5');

// --- Audio Engine ---
let isPlaying = false;
const soundBtn = document.getElementById('sound-toggle');
const soundText = soundBtn.querySelector('.sound-text');

// Create audio element dynamically
const audio = new Audio('https://upload.wikimedia.org/wikipedia/commons/6/66/Ambient_Space_Music.ogg'); // High quality space ambient
audio.loop = true;
audio.volume = 0.4;

soundBtn.addEventListener('click', () => {
  isPlaying = !isPlaying;
  
  if (isPlaying) {
    audio.play().catch(() => {
      // Handle autoplay block
      console.log('Audio blocked');
    });
    soundBtn.classList.add('playing');
    soundText.textContent = 'SOUND ON';
  } else {
    audio.pause();
    soundBtn.classList.remove('playing');
    soundText.textContent = 'SOUND OFF';
  }
});
