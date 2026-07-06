/**
 * DiscPage Abstract Flowing Lines Background
 * Canvas-based animated flowing curves network
 * Warm golden tones matching the disc page theme
 */
var DiscBgLines = (function() {
    'use strict';

    var canvas = null;
    var ctx = null;
    var animId = null;
    var isActive = false;
    var width = 0;
    var height = 0;
    var dpr = 1;
    var time = 0;

    // Configuration
    var config = {
        lineCount: 6,
        baseAlpha: 0.08,
        peakAlpha: 0.18,
        speed: 0.0003,
        waveAmp: 0.06,       // amplitude relative to height
        waveFreq: 2.5,       // horizontal frequency
        flowSpeed: 0.0005,
        colorBase: { r: 212, g: 168, b: 83 },   // #d4a853 golden
        colorAlt:  { r: 180, g: 140, b: 60 },    // slightly darker gold
        mouseInfluence: 0.15,
    };

    var lines = [];
    var mouse = { x: -9999, y: -9999, active: false };

    function resize() {
        if (!canvas) return;
        var parent = canvas.parentElement;
        if (!parent) return;
        width = parent.clientWidth;
        height = parent.clientHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function createLines() {
        lines = [];
        for (var i = 0; i < config.lineCount; i++) {
            lines.push({
                yOffset: 0.15 + (i / (config.lineCount - 1)) * 0.7, // distribute 15%~85% vertically
                phase: Math.random() * Math.PI * 2,
                freq: config.waveFreq + (Math.random() - 0.5) * 1.2,
                amp: config.waveAmp + (Math.random() - 0.5) * 0.02,
                speed: config.speed + (Math.random() - 0.5) * 0.0002,
                flowPhase: Math.random() * Math.PI * 2,
                colorMix: Math.random(),
                lineWidth: 0.8 + Math.random() * 1.5,
            });
        }
    }

    function onMouseMove(e) {
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        mouse.active = true;
    }

    function onMouseLeave() {
        mouse.active = false;
    }

    function drawLine(line, t) {
        if (!ctx) return;
        var baseY = line.yOffset * height;
        var ampPx = line.amp * height;

        ctx.beginPath();

        // Build a smooth curve through many points
        var steps = Math.max(80, Math.floor(width / 8));
        for (var i = 0; i <= steps; i++) {
            var x = (i / steps) * width;
            var nx = x / width; // normalized 0~1

            // Primary wave
            var y = baseY + Math.sin(nx * line.freq * Math.PI * 2 + line.phase + t * line.speed * 800) * ampPx;

            // Secondary harmonic for organic feel
            y += Math.sin(nx * line.freq * 1.7 * Math.PI * 2 + line.phase * 0.7 + t * line.speed * 600) * ampPx * 0.4;

            // Tertiary subtle wave
            y += Math.sin(nx * line.freq * 0.5 * Math.PI * 2 + line.flowPhase + t * config.flowSpeed * 1000) * ampPx * 0.25;

            // Vertical flow over time
            y += Math.sin(t * config.flowSpeed * 400 + line.flowPhase) * ampPx * 0.3;

            // Mouse influence (gentle repulsion)
            if (mouse.active) {
                var dx = x - mouse.x;
                var dy = y - mouse.y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                var influenceRadius = Math.min(width, height) * 0.25;
                if (dist < influenceRadius && dist > 0.001) {
                    var force = (1 - dist / influenceRadius) * config.mouseInfluence * ampPx * 3;
                    y += (dy / dist) * force;
                }
            }

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        // Color blending between base and alt gold
        var r = Math.round(config.colorBase.r * (1 - line.colorMix) + config.colorAlt.r * line.colorMix);
        var g = Math.round(config.colorBase.g * (1 - line.colorMix) + config.colorAlt.g * line.colorMix);
        var b = Math.round(config.colorBase.b * (1 - line.colorMix) + config.colorAlt.b * line.colorMix);

        // Subtle alpha pulse
        var alpha = config.baseAlpha + (Math.sin(t * 0.0008 + line.phase) * 0.5 + 0.5) * (config.peakAlpha - config.baseAlpha);

        ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha.toFixed(3) + ')';
        ctx.lineWidth = line.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    }

    function drawGlowLine(line, t) {
        if (!ctx) return;
        // Draw a wider, more transparent version for glow effect
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.filter = 'blur(4px)';
        var baseY = line.yOffset * height;
        var ampPx = line.amp * height * 1.2;

        ctx.beginPath();
        var steps = Math.max(60, Math.floor(width / 12));
        for (var i = 0; i <= steps; i++) {
            var x = (i / steps) * width;
            var nx = x / width;
            var y = baseY + Math.sin(nx * line.freq * Math.PI * 2 + line.phase + t * line.speed * 800) * ampPx;
            y += Math.sin(nx * line.freq * 1.7 * Math.PI * 2 + line.phase * 0.7 + t * line.speed * 600) * ampPx * 0.4;
            y += Math.sin(nx * line.freq * 0.5 * Math.PI * 2 + line.flowPhase + t * config.flowSpeed * 1000) * ampPx * 0.25;
            y += Math.sin(t * config.flowSpeed * 400 + line.flowPhase) * ampPx * 0.3;

            if (mouse.active) {
                var dx = x - mouse.x;
                var dy = y - mouse.y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                var influenceRadius = Math.min(width, height) * 0.25;
                if (dist < influenceRadius && dist > 0.001) {
                    var force = (1 - dist / influenceRadius) * config.mouseInfluence * ampPx * 3;
                    y += (dy / dist) * force;
                }
            }

            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }

        var r = Math.round(config.colorBase.r * (1 - line.colorMix) + config.colorAlt.r * line.colorMix);
        var g = Math.round(config.colorBase.g * (1 - line.colorMix) + config.colorAlt.g * line.colorMix);
        var b = Math.round(config.colorBase.b * (1 - line.colorMix) + config.colorAlt.b * line.colorMix);
        var alpha = (config.baseAlpha * 0.5) * (0.6 + 0.4 * Math.sin(t * 0.0008 + line.phase));

        ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha.toFixed(3) + ')';
        ctx.lineWidth = line.lineWidth * 6;
        ctx.stroke();
        ctx.restore();
    }

    function render(t) {
        if (!isActive || !ctx) return;
        time = t;

        ctx.clearRect(0, 0, width, height);

        // Draw glow lines first (behind)
        for (var i = 0; i < lines.length; i++) {
            drawGlowLine(lines[i], t);
        }

        // Draw main lines
        for (var i = 0; i < lines.length; i++) {
            drawLine(lines[i], t);
        }

        animId = requestAnimationFrame(render);
    }

    function start() {
        if (isActive) return;
        isActive = true;
        if (!animId) {
            animId = requestAnimationFrame(render);
        }
    }

    function stop() {
        isActive = false;
        if (animId) {
            cancelAnimationFrame(animId);
            animId = null;
        }
    }

    function init(containerOrSelector) {
        var container;
        if (typeof containerOrSelector === 'string') {
            container = document.querySelector(containerOrSelector);
        } else {
            container = containerOrSelector;
        }
        if (!container) return false;

        // Remove existing canvas if any
        var existing = container.querySelector('.disc-bg-lines-canvas');
        if (existing) existing.remove();

        canvas = document.createElement('canvas');
        canvas.className = 'disc-bg-lines-canvas';
        container.appendChild(canvas);
        ctx = canvas.getContext('2d');

        resize();
        createLines();

        window.addEventListener('resize', resize);
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mouseleave', onMouseLeave);

        return true;
    }

    function destroy() {
        stop();
        if (canvas) {
            canvas.removeEventListener('mousemove', onMouseMove);
            canvas.removeEventListener('mouseleave', onMouseLeave);
            window.removeEventListener('resize', resize);
            if (canvas.parentElement) canvas.parentElement.removeChild(canvas);
        }
        canvas = null;
        ctx = null;
        lines = [];
    }

    return {
        init: init,
        start: start,
        stop: stop,
        destroy: destroy,
        resize: resize,
    };
})();
