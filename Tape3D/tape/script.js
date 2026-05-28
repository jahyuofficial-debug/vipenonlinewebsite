(function () {
  var wrapper = document.getElementById('tapeWrapper');
  var scene = document.getElementById('scene');

  if (!wrapper) return;

  var isDragging = false;
  var startX = 0;
  var startY = 0;
  var currentRotateX = -35;
  var currentRotateY = 20;
  var velocityX = 0;
  var velocityY = 0;
  var lastX = 0;
  var lastY = 0;
  var lastTime = 0;
  var inertiaFrame = null;

  var SENSITIVITY = 0.4;
  var FRICTION = 0.94;
  var MIN_VELOCITY = 0.08;

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function updateTransform() {
    wrapper.style.transform =
      'rotateX(' + currentRotateX.toFixed(2) + 'deg) ' +
      'rotateY(' + currentRotateY.toFixed(2) + 'deg)';
  }

  function onStart(e) {
    e.preventDefault();
    isDragging = true;

    var pos = getPosition(e);
    startX = pos.x;
    startY = pos.y;
    lastX = startX;
    lastY = startY;
    lastTime = performance.now();
    velocityX = 0;
    velocityY = 0;

    if (inertiaFrame) {
      cancelAnimationFrame(inertiaFrame);
      inertiaFrame = null;
    }

    wrapper.classList.remove('inertia');
  }

  function onMove(e) {
    if (!isDragging) return;
    e.preventDefault();

    var pos = getPosition(e);
    var now = performance.now();
    var dt = now - lastTime;
    if (dt < 1) dt = 1;

    var dx = pos.x - startX;
    var dy = pos.y - startY;

    currentRotateY += dx * SENSITIVITY;
    currentRotateX -= dy * SENSITIVITY;

    currentRotateX = clamp(currentRotateX, -80, 80);
    currentRotateY = currentRotateY % 360;

    velocityX = (pos.x - lastX) * SENSITIVITY / dt * 16;
    velocityY = -(pos.y - lastY) * SENSITIVITY / dt * 16;

    lastX = pos.x;
    lastY = pos.y;
    lastTime = now;
    startX = pos.x;
    startY = pos.y;

    updateTransform();
  }

  function onEnd(e) {
    if (!isDragging) return;
    isDragging = false;

    if (Math.abs(velocityX) > MIN_VELOCITY || Math.abs(velocityY) > MIN_VELOCITY) {
      wrapper.classList.add('inertia');
      startInertia();
    }
  }

  function startInertia() {
    var step = function () {
      velocityX *= FRICTION;
      velocityY *= FRICTION;

      currentRotateY += velocityX;
      currentRotateX += velocityY;

      currentRotateX = clamp(currentRotateX, -80, 80);
      currentRotateY = currentRotateY % 360;

      updateTransform();

      if (Math.abs(velocityX) > MIN_VELOCITY || Math.abs(velocityY) > MIN_VELOCITY) {
        inertiaFrame = requestAnimationFrame(step);
      } else {
        wrapper.classList.remove('inertia');
        inertiaFrame = null;
      }
    };

    inertiaFrame = requestAnimationFrame(step);
  }

  function getPosition(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].pageX, y: e.touches[0].pageY };
    }
    return { x: e.pageX, y: e.pageY };
  }

  wrapper.addEventListener('mousedown', onStart);
  window.addEventListener('mousemove', function (e) { onMove(e); });
  window.addEventListener('mouseup', onEnd);

  wrapper.addEventListener('touchstart', onStart, { passive: false });
  window.addEventListener('touchmove', function (e) { onMove(e); }, { passive: false });
  window.addEventListener('touchend', onEnd);
})();
