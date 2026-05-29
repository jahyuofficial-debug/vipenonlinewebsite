(function(){
    'use strict';

    var email = document.getElementById('email');
    var emailCode = document.getElementById('emailCode');
    var sendCodeBtn = document.getElementById('sendCodeBtn');
    var signinBtn = document.getElementById('signinBtn');
    var signinForm = document.getElementById('signinForm');
    var sendTip = document.getElementById('sendTip');
    var isSending = false;
    var countdownTimer = null;

    function validateEmail(value) {
        if (!value) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    function validateEmailCode(value) {
        return value && value.length === 6 && /^[0-9]+$/.test(value);
    }

    function setValidationIcon(iconId, isValid) {
        var icon = document.getElementById(iconId);
        if (isValid) {
            icon.classList.add('show');
        } else {
            icon.classList.remove('show');
        }
    }

    function clearFieldError(inputEl) {
        inputEl.classList.remove('error');
    }

    function triggerShake(inputEl) {
        inputEl.classList.remove('error');
        void inputEl.offsetWidth;
        inputEl.classList.add('error');
    }

    function updateSigninButton() {
        var isEmailValid = validateEmail(email.value);
        var isCodeValid = validateEmailCode(emailCode.value);
        if (isEmailValid && isCodeValid) {
            signinBtn.disabled = false;
        } else {
            signinBtn.disabled = true;
        }
    }

    function stopCountdown() {
        if (countdownTimer) {
            clearInterval(countdownTimer);
            countdownTimer = null;
        }
        isSending = false;
        sendCodeBtn.disabled = false;
        sendCodeBtn.textContent = 'Send Code';
        if (validateEmail(email.value)) {
            sendCodeBtn.classList.add('active');
        }
    }

    function startCountdown() {
        isSending = true;
        sendCodeBtn.disabled = true;
        sendCodeBtn.classList.remove('active');
        sendTip.classList.add('show');
        var countdown = 60;
        sendCodeBtn.textContent = countdown + 's';
        countdownTimer = setInterval(function() {
            countdown--;
            if (countdown <= 0) {
                stopCountdown();
                sendTip.classList.remove('show');
            } else {
                sendCodeBtn.textContent = countdown + 's';
            }
        }, 1000);
    }

    function sendVerificationCode() {
        var emailVal = email.value;
        if (!validateEmail(emailVal)) {
            triggerShake(email);
            email.focus();
            return;
        }

        startCountdown();

        fetch('/api/auth/send-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailVal })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (!data.success) {
                stopCountdown();
                sendTip.classList.remove('show');
                alert(data.error || 'Failed to send verification code');
            }
        })
        .catch(function() {
            stopCountdown();
            sendTip.classList.remove('show');
            alert('Network error. Please try again.');
        });
    }

    email.addEventListener('input', function() {
        var isValid = validateEmail(this.value);
        setValidationIcon('emailIcon', isValid);
        if (isValid) {
            this.classList.add('valid');
            clearFieldError(this);
            if (!isSending) {
                sendCodeBtn.classList.add('active');
            }
        } else {
            this.classList.remove('valid');
            sendCodeBtn.classList.remove('active');
        }
        if (sendTip.classList.contains('show')) {
            sendTip.classList.remove('show');
        }
        updateSigninButton();
    });

    email.addEventListener('blur', function() {
        var val = this.value;
        if (val && !validateEmail(val)) {
            triggerShake(this);
        }
    });

    emailCode.addEventListener('input', function() {
        var isValid = validateEmailCode(this.value);
        if (isValid) {
            this.classList.add('valid');
            clearFieldError(this);
        } else {
            this.classList.remove('valid');
        }
        updateSigninButton();
    });

    emailCode.addEventListener('blur', function() {
        var val = this.value;
        if (val && !validateEmailCode(val)) {
            triggerShake(this);
        }
    });

    sendCodeBtn.addEventListener('click', function() {
        if (isSending) return;
        sendVerificationCode();
    });

    signinForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (signinBtn.disabled) return;

        var emailVal = email.value;
        var codeVal = emailCode.value;

        signinBtn.disabled = true;
        signinBtn.textContent = 'Verifying...';

        fetch('/api/auth/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailVal, code: codeVal })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.success) {
                Utils.setAuth({
                    username: data.username,
                    email: data.email,
                    token: data.token
                });
                window.location.href = 'index.html#/';
            } else {
                signinBtn.disabled = false;
                signinBtn.textContent = 'Sign In';
                alert(data.error || 'Verification failed');
                triggerShake(emailCode);
            }
        })
        .catch(function() {
            signinBtn.disabled = false;
            signinBtn.textContent = 'Sign In';
            alert('Network error. Please try again.');
        });
    });

    var backLink = document.getElementById('backLink');
    if (backLink) {
        backLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'index.html#/';
        });
    }

    CometTrail.init('cometCanvas', '.signin-container, .back-link');
})();