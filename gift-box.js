const scene = document.querySelector('.scene');
const gift = scene.querySelector('.gift');
const hint = document.querySelector('.hint');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
let dragPointer = null;

function resetTilt() {
  gift.style.removeProperty('--tilt');
  gift.style.removeProperty('--turn');
}

function tilt(event) {
  const bounds = scene.getBoundingClientRect();
  const x = Math.max(-0.5, Math.min(0.5, (event.clientX - bounds.left) / bounds.width - 0.5));
  const y = Math.max(-0.5, Math.min(0.5, (event.clientY - bounds.top) / bounds.height - 0.5));

  gift.style.setProperty('--tilt', `${48 - y * 14}deg`);
  gift.style.setProperty('--turn', `${-3 + x * 12}deg`);
}

scene.addEventListener('pointerdown', (event) => {
  if (reducedMotion.matches || event.pointerType === 'mouse' || dragPointer !== null) return;

  dragPointer = event.pointerId;
  scene.setPointerCapture(dragPointer);
  tilt(event);
});

scene.addEventListener('pointermove', (event) => {
  if (reducedMotion.matches) return;
  if (event.pointerType === 'mouse' || event.pointerId === dragPointer) tilt(event);
});

scene.addEventListener('pointerleave', (event) => {
  if (event.pointerType === 'mouse') resetTilt();
});

scene.addEventListener('lostpointercapture', (event) => {
  if (event.pointerId !== dragPointer) return;

  dragPointer = null;
  resetTilt();
});

function updateHint() {
  hint.textContent = finePointer.matches ? 'Move your pointer to tilt the gift' : 'Drag the gift to tilt it';
}

finePointer.addEventListener('change', updateHint);
reducedMotion.addEventListener('change', resetTilt);
updateHint();
