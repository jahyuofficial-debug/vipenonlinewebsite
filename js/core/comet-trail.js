var CometTrail = (function(){
    var canvas = null;
    var isOverInteractive = false;
    var mouseX = -9999, mouseY = -9999;
    var prevMouseX = -9999, prevMouseY = -9999;
    var particles = [];
    var maxParticles = 40;
    var particleId = 0;
    var interactiveSelectors = '';
    var lastSpawnTime = 0;
    var spawnInterval = 16;
    var animationId = null;
    var destroyed = false;

    function checkInteractiveTarget(e){
        var target = e.target;
        while(target && target !== document.body){
            if(target.matches && target.matches(interactiveSelectors)){
                return true;
            }
            target = target.parentElement;
        }
        return false;
    }

    function onMouseMove(e){
        prevMouseX = mouseX;
        prevMouseY = mouseY;
        mouseX = e.clientX;
        mouseY = e.clientY;
        isOverInteractive = checkInteractiveTarget(e);
    }

    function onMouseLeave(){
        isOverInteractive = true;
    }

    function createParticle(x, y, speed){
        var el = document.createElement('div');
        el.className = 'comet-particle';
        var size = Math.random() * 3 + 2;
        el.style.width = size + 'px';
        el.style.height = size + 'px';
        el.style.left = '0px';
        el.style.top = '0px';

        var hue = Math.random() * 40 + 180;
        var color = 'hsla(' + hue + ', 80%, 70%, 1)';
        var glow = 'hsla(' + hue + ', 80%, 60%, 0.6)';
        el.style.background = color;
        el.style.boxShadow = '0 0 ' + (size * 2) + 'px ' + glow + ', 0 0 ' + (size * 4) + 'px ' + glow;

        canvas.appendChild(el);

        var angle = Math.atan2(mouseY - prevMouseY, mouseX - prevMouseX);
        var spread = (Math.random() - 0.5) * 0.6;
        var vx = Math.cos(angle + spread) * speed * 0.3;
        var vy = Math.sin(angle + spread) * speed * 0.3;

        var p = {
            id: particleId++,
            el: el,
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            life: 1,
            decay: Math.random() * 0.015 + 0.012,
            scale: 1
        };

        gsap.set(el, { x: x, y: y, scale: 1, opacity: 1 });

        gsap.to(p, {
            life: 0,
            scale: 0,
            duration: 0.8 + Math.random() * 0.4,
            ease: 'power2.out',
            onUpdate: function(){
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.96;
                p.vy *= 0.96;
                gsap.set(el, {
                    x: p.x,
                    y: p.y,
                    opacity: p.life,
                    scale: p.scale
                });
            },
            onComplete: function(){
                if(el.parentNode) el.parentNode.removeChild(el);
                var idx = particles.indexOf(p);
                if(idx > -1) particles.splice(idx, 1);
            }
        });

        particles.push(p);
    }

    function spawnHeadGlow(x, y){
        var el = document.createElement('div');
        el.className = 'comet-particle';
        var size = 6;
        el.style.width = size + 'px';
        el.style.height = size + 'px';
        el.style.left = '0px';
        el.style.top = '0px';
        el.style.background = 'radial-gradient(circle, rgba(200,230,255,0.9) 0%, rgba(150,200,255,0.4) 40%, transparent 70%)';
        el.style.boxShadow = '0 0 12px rgba(150,200,255,0.5), 0 0 24px rgba(100,180,255,0.3)';
        canvas.appendChild(el);

        gsap.set(el, { x: x - size/2, y: y - size/2, scale: 1, opacity: 0.8 });

        gsap.to(el, {
            opacity: 0,
            scale: 2,
            duration: 0.3,
            ease: 'power2.out',
            onComplete: function(){
                if(el.parentNode) el.parentNode.removeChild(el);
            }
        });
    }

    function loop(timestamp){
        if(destroyed) return;

        if(!isOverInteractive && mouseX > -9999 && prevMouseX > -9999){
            var dx = mouseX - prevMouseX;
            var dy = mouseY - prevMouseY;
            var dist = Math.sqrt(dx*dx + dy*dy);
            var speed = Math.min(dist, 30);

            if(dist > 1 && timestamp - lastSpawnTime > spawnInterval){
                var count = Math.min(Math.floor(dist / 4), 3);
                for(var i = 0; i < count; i++){
                    var t = i / count;
                    var px = prevMouseX + dx * t + (Math.random() - 0.5) * 4;
                    var py = prevMouseY + dy * t + (Math.random() - 0.5) * 4;
                    createParticle(px, py, speed);
                }
                spawnHeadGlow(mouseX, mouseY);
                lastSpawnTime = timestamp;
            }
        }

        while(particles.length > maxParticles){
            var old = particles.shift();
            gsap.killTweensOf(old);
            if(old.el && old.el.parentNode) old.el.parentNode.removeChild(old.el);
        }

        animationId = requestAnimationFrame(loop);
    }

    return {
        init: function(canvasId, selectors){
            canvas = document.getElementById(canvasId);
            if(!canvas) return;
            destroyed = false;
            interactiveSelectors = selectors || '';
            mouseX = -9999; mouseY = -9999;
            prevMouseX = -9999; prevMouseY = -9999;
            particles = [];
            particleId = 0;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseleave', onMouseLeave);

            animationId = requestAnimationFrame(loop);
        },
        destroy: function(){
            destroyed = true;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseleave', onMouseLeave);
            if(animationId) cancelAnimationFrame(animationId);
            for(var i = 0; i < particles.length; i++){
                var p = particles[i];
                gsap.killTweensOf(p);
                if(p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el);
            }
            particles = [];
            canvas = null;
        }
    };
})();