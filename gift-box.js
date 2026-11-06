const scene = document.querySelector('#scene');
const box = scene.querySelector('.box');
const note = box.querySelector('.note-front');
const lidButton = document.querySelector('#lid-button');
const messageControls = document.querySelector('#message-controls');
const messageButton = document.querySelector('#message-button');
const message = document.querySelector('#message');
const hint = document.querySelector('.hint');
const signal = document.querySelector('#signal');
const reasons = message.querySelector('.reasons');
const cards = [...reasons.children];
const reasonCount = message.querySelector('#reason-count');
const reasonProgress = message.querySelector('.reason-progress');
const timerFields = [...message.querySelectorAll('[data-time]')];
const timerStart = Date.parse('2026-08-10T00:00:00+01:00');

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
  lidButton.setAttribute('aria-expanded', String(isOpen));
  lidButton.textContent = isOpen ? 'Close the gift' : 'Open the gift';
  messageControls.hidden = !isOpen;
  signal.textContent = isOpen ? 'CASE OPEN ▂ ▄ ▆' : 'SIGNAL ▂ ▄ ▆';
  if (isOpen) {
    pitch = -31;
    yaw = -20;
    updateRotation();
  }
  hint.textContent = isOpen ? 'Tap inside the box to read the note · Tap the frame or lid to close' : 'Drag to rotate · Tap the box to open';
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
    messageButton.focus({ preventScroll: true });
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

lidButton.addEventListener('click', toggleLid);
messageButton.addEventListener('click', openReasons);

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
