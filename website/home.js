const SPOTLIGHT_R = 260;

const revealRoot = document.querySelector(".lai-spotlight-reveal");
const revealImage = document.querySelector(".lai-spotlight-reveal-image");
const maskCanvas = document.querySelector(".lai-spotlight-mask");
const ctx = maskCanvas?.getContext("2d");
const nav = document.querySelector(".lai-spotlight-nav");
const menuButton = document.querySelector(".lai-spotlight-menu");

const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
const smooth = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let rafId;

function resizeMaskCanvas() {
  if (!maskCanvas) return;
  const ratio = window.devicePixelRatio || 1;
  maskCanvas.width = Math.max(1, Math.round(window.innerWidth * ratio));
  maskCanvas.height = Math.max(1, Math.round(window.innerHeight * ratio));
  maskCanvas.style.width = `${window.innerWidth}px`;
  maskCanvas.style.height = `${window.innerHeight}px`;
  ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawMask(x, y) {
  if (!ctx || !maskCanvas || !revealImage) return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createRadialGradient(x, y, 0, x, y, SPOTLIGHT_R);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.4, "rgba(255,255,255,1)");
  gradient.addColorStop(0.6, "rgba(255,255,255,0.75)");
  gradient.addColorStop(0.75, "rgba(255,255,255,0.4)");
  gradient.addColorStop(0.88, "rgba(255,255,255,0.12)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, SPOTLIGHT_R, 0, Math.PI * 2);
  ctx.fill();

  const maskUrl = `url(${maskCanvas.toDataURL("image/png")})`;
  revealImage.style.maskImage = maskUrl;
  revealImage.style.webkitMaskImage = maskUrl;
  revealImage.style.maskSize = "100% 100%";
  revealImage.style.webkitMaskSize = "100% 100%";
}

function animateSpotlight() {
  smooth.x += (mouse.x - smooth.x) * 0.1;
  smooth.y += (mouse.y - smooth.y) * 0.1;
  drawMask(smooth.x, smooth.y);
  rafId = window.requestAnimationFrame(animateSpotlight);
}

function updatePointer(event) {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
}

function updateTouch(event) {
  const touch = event.touches?.[0];
  if (!touch) return;
  mouse.x = touch.clientX;
  mouse.y = touch.clientY;
}

function initSpotlight() {
  if (!revealRoot || !revealImage || !maskCanvas || !ctx) return;
  resizeMaskCanvas();
  drawMask(smooth.x, smooth.y);
  window.addEventListener("mousemove", updatePointer, { passive: true });
  window.addEventListener("touchmove", updateTouch, { passive: true });
  window.addEventListener("resize", resizeMaskCanvas);
  animateSpotlight();
}

initSpotlight();

menuButton?.addEventListener("click", () => {
  const isOpen = nav?.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(Boolean(isOpen)));
});
