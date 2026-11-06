const scene = document.querySelector('#scene');
const monitor = scene.closest('.monitor');
const viewfinder = monitor.querySelector('.viewfinder');
const cameraReset = monitor.querySelector('#camera-reset');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const box = scene.querySelector('.box');
const note = box.querySelector('.note-front');
const message = document.querySelector('#message');
const hint = document.querySelector('.hint');
const signal = document.querySelector('#signal');
const reasons = message.querySelector('.reasons');
const cards = [...reasons.children];
const reasonCount = message.querySelector('#reason-count');
const reasonProgress = message.querySelector('.reason-progress');
const timerFields = [...message.querySelectorAll('[data-time]')];
const timerStart = Date.parse(message.querySelector('#timer-start').dateTime);
const secondsPerDay = 86400;

const londonTime = document.querySelector('#london-time');
const nightCount = document.querySelector('#night-count');
const londonZone = 'Europe/London';
const timeInLondon = new Intl.DateTimeFormat('es-ES', {
  timeZone: londonZone,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

function elapsedSeconds(timestamp) {
  return Math.max(0, Math.floor((timestamp - timerStart) / 1000));
}

let clockTimeout;

function updateCameraClock() {
  clearTimeout(clockTimeout);
  if (document.hidden) return;

  const now = new Date();
  const night = Math.floor(elapsedSeconds(now.getTime()) / secondsPerDay);

  londonTime.textContent = timeInLondon.format(now);
  londonTime.dateTime = now.toISOString();
  nightCount.textContent = `NOCHE ${String(night).padStart(2, '0')}`;
  clockTimeout = setTimeout(updateCameraClock, 60000 - now.getTime() % 60000);
}

updateCameraClock();

let currentReason = 0;
let timerTimeout;
let swipeStart = null;

const initialPitch = -31;
const initialYaw = -20;
let pitch = initialPitch;
let yaw = initialYaw;
let drag = null;
let rotationFrame = null;

function updateRotation() {
  box.style.transform = `rotateX(${pitch}deg) rotateY(${yaw}deg)`;
}

function resetRotation() {
  if (rotationFrame !== null) {
    cancelAnimationFrame(rotationFrame);
    rotationFrame = null;
  }

  pitch = initialPitch;
  yaw = initialYaw;
  updateRotation();
}

cameraReset.addEventListener('click', () => {
  if (drag) return;

  resetRotation();
  if (!reducedMotion.matches) monitor.classList.add('is-reacquiring');
});

viewfinder.addEventListener('animationend', (event) => {
  if (event.animationName === 'camera-reacquire') monitor.classList.remove('is-reacquiring');
});

function toggleLid() {
  monitor.classList.remove('is-reacquiring');
  const isOpen = scene.classList.toggle('is-open');
  scene.setAttribute('aria-expanded', String(isOpen));
  scene.setAttribute('aria-label', isOpen ? 'Leer la nota dentro de la caja' : 'Abrir la caja del regalo');
  if (isOpen) scene.setAttribute('aria-haspopup', 'dialog');
  else scene.removeAttribute('aria-haspopup');
  signal.textContent = isOpen ? 'CAJA ABIERTA' : 'SEÑAL';
  if (isOpen) resetRotation();
  hint.textContent = isOpen
    ? 'Toca dentro para leer la nota o el borde para cerrar.'
    : 'Toca la caja para abrirla. Arrastra para girarla.';
}

function isNoteTap(event) {
  if (event.target.closest('.hinge, .rim, .face')) return false;
  if (event.target.closest('.note, .lining, .inner')) return true;

  const { left, right, top, bottom } = note.getBoundingClientRect();
  const padding = 24;

  return event.clientX >= left - padding && event.clientX <= right + padding
    && event.clientY >= top - padding && event.clientY <= bottom + padding;
}

scene.addEventListener('pointerdown', (event) => {
  if (drag || !event.isPrimary || event.button !== 0) return;

  const onBox = box.contains(event.target);
  const onNoteArea = scene.classList.contains('is-open') && isNoteTap(event);
  if (!onBox && !onNoteArea) return;

  drag = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    pitch,
    yaw,
    moved: false,
    onBox,
    onNoteArea,
    threshold: event.pointerType === 'touch' ? 14 : 8,
  };
  scene.setPointerCapture(event.pointerId);
});

// Keep touch gestures that start on the scene from scrolling the page.
scene.addEventListener('touchmove', (event) => {
  if (drag?.onBox && event.cancelable) event.preventDefault();
}, { passive: false });

scene.addEventListener('pointermove', (event) => {
  if (drag?.id !== event.pointerId) return;

  const dx = event.clientX - drag.x;
  const dy = event.clientY - drag.y;
  if (!drag.moved) {
    if (Math.hypot(dx, dy) < drag.threshold) return;

    drag.moved = true;
    scene.classList.add('is-dragging');
  }
  pitch = (drag.pitch - dy * 0.65) % 360;
  yaw = (drag.yaw + dx * 0.75) % 360;
  if (rotationFrame === null) {
    rotationFrame = requestAnimationFrame(() => {
      rotationFrame = null;
      updateRotation();
    });
  }
});

scene.addEventListener('pointerup', (event) => {
  if (drag?.id !== event.pointerId) return;

  const distance = Math.hypot(event.clientX - drag.x, event.clientY - drag.y);
  if (drag.moved || distance >= drag.threshold) return;

  if (drag.onNoteArea && scene.classList.contains('is-open')) {
    scene.focus({ preventScroll: true });
    openReasons();
  } else if (drag.onBox) {
    toggleLid();
  }
});

function clearDrag(event) {
  if (drag?.id !== event.pointerId) return;

  drag = null;
  scene.classList.remove('is-dragging');
}

scene.addEventListener('lostpointercapture', clearDrag);
scene.addEventListener('pointercancel', clearDrag);

function activateGift() {
  if (scene.classList.contains('is-open')) openReasons();
  else toggleLid();
}

scene.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && scene.classList.contains('is-open')) {
    event.preventDefault();
    toggleLid();
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    if (!event.repeat) activateGift();
  }
});

scene.addEventListener('click', (event) => {
  if (event.detail === 0 && !event.pointerType) activateGift();
});

const transmissions = [...document.querySelectorAll('.transmission-messages p')];
const transmissionCount = document.querySelector('#transmission-count');
let transmissionIndex = 0;

document.querySelector('#tune-button').addEventListener('click', () => {
  transmissions[transmissionIndex].hidden = true;
  transmissionIndex = (transmissionIndex + 1) % transmissions.length;
  transmissions[transmissionIndex].hidden = false;
  transmissionCount.textContent = `${String(transmissionIndex + 1).padStart(2, '0')} / ${transmissions.length}`;
});

function showReason(index) {
  reasons.style.setProperty('--card-offset', index < currentReason ? '-12px' : '12px');
  cards[currentReason].hidden = true;
  currentReason = (index + cards.length) % cards.length;
  cards[currentReason].hidden = false;
  reasonProgress.value = currentReason + 1;
  reasonCount.textContent = `${currentReason + 1} de ${cards.length}`;
  scheduleTimer();
}

function updateTimer() {
  const now = Date.now();
  const elapsed = elapsedSeconds(now);
  const values = {
    days: Math.floor(elapsed / secondsPerDay),
    hours: Math.floor(elapsed / 3600) % 24,
    minutes: Math.floor(elapsed / 60) % 60,
    seconds: elapsed % 60,
  };

  for (const field of timerFields) {
    const value = String(values[field.dataset.time]).padStart(2, '0');
    if (field.textContent !== value) field.textContent = value;
  }

  timerTimeout = setTimeout(updateTimer, 1000 - now % 1000);
}

function scheduleTimer() {
  clearTimeout(timerTimeout);
  if (message.open && currentReason === 0 && !document.hidden) updateTimer();
}

function openReasons() {
  if (message.open) return;

  message.showModal();
  message.scrollTop = 0;
  showReason(0);
}

message.addEventListener('close', () => {
  if (!message.open) clearTimeout(timerTimeout);
  swipeStart = null;
});

function refreshClocks() {
  updateCameraClock();
  scheduleTimer();
}

document.addEventListener('visibilitychange', refreshClocks);
window.addEventListener('pageshow', refreshClocks);

message.querySelector('#previous-reason').addEventListener('click', () => showReason(currentReason - 1));
message.querySelector('#next-reason').addEventListener('click', () => showReason(currentReason + 1));

message.addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

  event.preventDefault();
  showReason(currentReason + (event.key === 'ArrowLeft' ? -1 : 1));
});

reasons.addEventListener('touchstart', (event) => {
  swipeStart = event.touches.length === 1 ? event.touches[0] : null;
}, { passive: true });

reasons.addEventListener('touchend', (event) => {
  const start = swipeStart;
  swipeStart = null;
  if (!start) return;

  const end = [...event.changedTouches].find(touch => touch.identifier === start.identifier);
  if (!end) return;

  const dx = end.clientX - start.clientX;
  const dy = end.clientY - start.clientY;
  if (Math.abs(dx) >= 35 && Math.abs(dx) > Math.abs(dy)) {
    showReason(currentReason + (dx < 0 ? 1 : -1));
  }
}, { passive: true });

reasons.addEventListener('touchcancel', () => {
  swipeStart = null;
});
