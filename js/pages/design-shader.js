/**
 * Design Detail Page — WebGL Shader Background
 * Green organic floating lines via custom fragment shader
 */
var DesignShader = (function() {
'use strict';

var renderer = null;
var scene = null;
var camera = null;
var material = null;
var mesh = null;
var animationId = null;
var canvas = null;

var vertexShader = [
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = uv;',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
    '}'
].join('\n');

var fragmentShader = [
    'varying vec2 vUv;',
    'uniform float uTime;',
    'uniform vec2 uResolution;',
    '',
    '// Hash & noise functions',
    'float hash(vec2 p) {',
    '  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);',
    '}',
    '',
    'float noise(vec2 p) {',
    '  vec2 i = floor(p);',
    '  vec2 f = fract(p);',
    '  f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),',
    '             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);',
    '}',
    '',
    '// Wavy line with organic feel',
    'float waveLine(vec2 uv, float t, float speed, float freq, float amp, float thickness) {',
    '  float n = noise(vec2(uv.y * freq, t * speed));',
    '  float offset = (n - 0.5) * amp;',
    '  float wave = sin(uv.y * freq * 3.14159 * 2.0 + t * speed * 2.0 + offset * 10.0) * amp;',
    '  float dist = abs(uv.x - (0.5 + wave * 0.5 + offset * 0.3));',
    '  return smoothstep(thickness, 0.0, dist);',
    '}',
    '',
    'void main() {',
    '  vec2 uv = vUv;',
    '  float t = uTime;',
    '  vec3 color = vec3(0.0);',
    '  float alpha = 0.0;',
    '',
    '  // Multiple organic floating lines',
    '  for (int i = 0; i < 8; i++) {',
    '    float fi = float(i);',
    '    float speed = 0.08 + fi * 0.015;',
    '    float freq = 1.5 + fi * 0.4;',
    '    float amp = 0.12 + fi * 0.025;',
    '    float thickness = 0.025 + fi * 0.003;',
    '    float phase = fi * 1.2;',
    '',
    '    // Offset time per line for staggered movement',
    '    float lineTime = t + phase;',
    '',
    '    // Multiple waves per line for irregularity',
    '    float l1 = waveLine(uv, lineTime, speed, freq, amp, thickness);',
    '    float l2 = waveLine(uv, lineTime + 1.5, speed * 0.7, freq * 1.8, amp * 0.6, thickness * 0.6);',
    '',
    '    // Green color palette: variations from dark forest to bright neon',
    '    float hue = 0.28 + fi * 0.015;',
    '    float sat = 0.6 + fi * 0.05;',
    '    float bright = 0.15 + fi * 0.08;',
    '',
    '    vec3 lineColor = vec3(',
    '      0.05 + fi * 0.04,',
    '      0.2 + fi * 0.06,',
    '      0.05 + fi * 0.03',
    '    );',
    '',
    '    // Blend: neon green brighter for upper lines',
    '    if (fi < 3.0) {',
    '      lineColor = mix(lineColor, vec3(0.15, 0.85, 0.2), 0.6);',
    '    } else if (fi < 5.0) {',
    '      lineColor = mix(lineColor, vec3(0.1, 0.55, 0.15), 0.4);',
    '    }',
    '',
    '    float lineAlpha = l1 * 0.5 + l2 * 0.3;',
    '    lineAlpha *= 0.5 + fi * 0.08;',
    '',
    '    color += lineColor * lineAlpha;',
    '    alpha += lineAlpha;',
    '  }',
    '',
    '  // Subtle background glow (dark green ambient)',
    '  float bgNoise = noise(uv * 3.0 + t * 0.02) * 0.03;',
    '  color += vec3(0.02, 0.08, 0.02) * bgNoise;',
    '',
    '  // Dark background base so shader works standalone',
    '  color += vec3(0.03, 0.03, 0.04);',
    '  alpha = clamp(alpha, 0.0, 0.7);',
    '  gl_FragColor = vec4(color, 1.0);',
    '}'
].join('\n');

function init(container) {
    if (renderer) return; // already running

    canvas = document.createElement('canvas');
    canvas.className = 'dw-shader-canvas';

    try {
        renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
    } catch(e) {
        return; // THREE not loaded
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x0a0a0f, 1);

    container.appendChild(canvas);

    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    material = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
            uTime: { value: 0 },
            uResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) }
        },
        transparent: true,
        depthWrite: false,
        depthTest: false
    });

    var geometry = new THREE.PlaneGeometry(2, 2);
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    animate();

    // Handle resize
    window.addEventListener('resize', onResize);
}

function animate() {
    animationId = requestAnimationFrame(animate);

    if (material && material.uniforms) {
        material.uniforms.uTime.value += 0.01;
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

function onResize() {
    if (!canvas || !canvas.parentElement || !renderer) return;
    var w = canvas.parentElement.clientWidth;
    var h = canvas.parentElement.clientHeight;
    renderer.setSize(w, h);
    if (material && material.uniforms) {
        material.uniforms.uResolution.value.set(w, h);
    }
}

function destroy() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    window.removeEventListener('resize', onResize);

    if (mesh) {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
        mesh = null;
    }

    if (material) {
        material.dispose();
        material = null;
    }

    if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        renderer = null;
    }

    if (canvas && canvas.parentElement) {
        canvas.parentElement.removeChild(canvas);
    }
    canvas = null;
    scene = null;
    camera = null;
}

return {
    init: init,
    destroy: destroy
};

})();
