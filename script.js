const enterPremiumButton = document.getElementById('enterPremium');

if (enterPremiumButton) {
  enterPremiumButton.addEventListener('click', () => {
    enterPremiumButton.textContent = 'Loading premium...';
    enterPremiumButton.disabled = true;
    enterPremiumButton.style.opacity = '0.85';

    setTimeout(() => {
      window.location.hash = 'features';
      enterPremiumButton.textContent = 'Launched';
      enterPremiumButton.style.opacity = '1';
      enterPremiumButton.disabled = false;
    }, 800);
  });
}

console.log('Premium welcome page ready');