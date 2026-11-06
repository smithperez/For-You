const scene = document.querySelector('#scene');
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

const londonTime = document.querySelector('#london-time');
const nightCount = document.querySelector('#night-count');
const londonZone = 'Europe/London';
const timeInLondon = new Intl.DateTimeFormat('es-ES', {
  timeZone: londonZone,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});
const dateInLondon = new Intl.DateTimeFormat('en-GB', {
  timeZone: londonZone,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

function londonCalendarDay(date) {
  const parts = Object.fromEntries(dateInLondon.formatToParts(date).map(({ type, value }) => [type, value]));
  return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)) / 86400000;
}

const firstNight = londonCalendarDay(timerStart);

function updateCameraClock() {
  const now = new Date();
  const night = Math.max(0, londonCalendarDay(now) - firstNight + 1);

  londonTime.textContent = timeInLondon.format(now);
  londonTime.dateTime = now.toISOString();
  nightCount.textContent = `NOCHE ${String(night).padStart(2, '0')}`;
  setTimeout(updateCameraClock, 60000 - now.getTime() % 60000);
}

updateCameraClock();

let currentReason = 0;
let timerInterval;
let swipeStart = null;

let pitch = -31;
let yaw = -20;
let drag = null;
let rotationFrame = null;

function updateRotation() {
  box.style.transform = `rotateX(${pitch}deg) rotateY(${yaw}deg)`;
}

function toggleLid() {
  const isOpen = scene.classList.toggle('is-open');
  scene.setAttribute('aria-expanded', String(isOpen));
  scene.setAttribute('aria-label', isOpen ? 'Leer la nota dentro de la caja' : 'Abrir la caja del regalo');
  if (isOpen) scene.setAttribute('aria-haspopup', 'dialog');
  else scene.removeAttribute('aria-haspopup');
  signal.textContent = isOpen ? 'CAJA ABIERTA ▂ ▄ ▆' : 'SEÑAL ▂ ▄ ▆';
  if (isOpen) {
    pitch = -31;
    yaw = -20;
    updateRotation();
  }
  hint.textContent = isOpen ? 'Toca el interior para leer la nota · Toca el borde o la tapa para cerrar' : 'Arrastra para girar · Toca la caja para abrirla';
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
  if (drag || event.button !== 0) return;

  drag = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    pitch,
    yaw,
    moved: false,
    onBox: box.contains(event.target),
    onNoteArea: scene.classList.contains('is-open') && isNoteTap(event),
    threshold: event.pointerType === 'touch' ? 14 : 8,
  };
  scene.setPointerCapture(event.pointerId);
});

// Keep touch gestures that start on the scene from scrolling the page.
scene.addEventListener('touchmove', (event) => {
  if (event.cancelable) event.preventDefault();
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

scene.addEventListener('lostpointercapture', (event) => {
  if (drag?.id !== event.pointerId) return;

  drag = null;
  scene.classList.remove('is-dragging');
});

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
  if (event.detail === 0) activateGift();
});

const transmissions = [...document.querySelectorAll('.transmission-messages p')];
let transmissionIndex = 0;

document.querySelector('#tune-button').addEventListener('click', () => {
  transmissions[transmissionIndex].hidden = true;
  transmissionIndex = (transmissionIndex + 1) % transmissions.length;
  transmissions[transmissionIndex].hidden = false;
});

function showReason(index) {
  reasons.style.setProperty('--card-offset', index < currentReason ? '-12px' : '12px');
  cards[currentReason].hidden = true;
  currentReason = (index + cards.length) % cards.length;
  cards[currentReason].hidden = false;
  reasonProgress.value = currentReason + 1;
  reasonCount.textContent = `${currentReason + 1} de ${cards.length}`;
  if (currentReason === 0) updateTimer();
}

function updateTimer() {
  const elapsed = Math.max(0, Math.floor((Date.now() - timerStart) / 1000));
  const values = {
    days: Math.floor(elapsed / 86400),
    hours: Math.floor(elapsed / 3600) % 24,
    minutes: Math.floor(elapsed / 60) % 60,
    seconds: elapsed % 60,
  };

  for (const field of timerFields) {
    field.textContent = String(values[field.dataset.time]).padStart(2, '0');
  }
}

function openReasons() {
  showReason(0);
  message.showModal();
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (currentReason === 0) updateTimer();
  }, 1000);
}

message.addEventListener('close', () => {
  clearInterval(timerInterval);
});

message.querySelector('#previous-reason').addEventListener('click', () => showReason(currentReason - 1));
message.querySelector('#next-reason').addEventListener('click', () => showReason(currentReason + 1));

message.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') showReason(currentReason - 1);
  if (event.key === 'ArrowRight') showReason(currentReason + 1);
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
