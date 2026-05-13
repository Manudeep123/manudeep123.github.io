const scene = document.querySelector('.scene');
const hero = document.querySelector('.hero');

window.addEventListener('mousemove', (event) => {
  const x = (event.clientX / window.innerWidth - 0.5) * 16;
  const y = (event.clientY / window.innerHeight - 0.5) * 16;

  if (scene) {
    scene.style.transform = `perspective(1200px) rotateX(${y * 0.25}deg) rotateY(${x * 0.35}deg)`;
  }

  if (hero) {
    hero.style.transform = `translate3d(${x * 0.8}px, ${y * 0.5}px, 0)`;
  }
});

window.addEventListener('mouseout', () => {
  if (scene) scene.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
  if (hero) hero.style.transform = 'translate3d(0, 0, 0)';
});

console.log('Welcome to Manudeep.com animation ready');