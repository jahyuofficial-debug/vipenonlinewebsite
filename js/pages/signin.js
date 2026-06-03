var SigninPage = (function() {
    'use strict';

    (function loadSiteSettings() {
        fetch('data/manager/settings.json').then(function(r) { return r.json(); }).then(function(s) {
            if (s.siteName) {
                document.title = 'Sign In - ' + s.siteName;
                var metaOgTitle = document.querySelector('meta[property="og:title"]');
                if (metaOgTitle) metaOgTitle.setAttribute('content', 'Sign In - ' + s.siteName);
            }
            if (s.siteLogo) {
                var logoImg = document.querySelector('header .logo img');
                if (logoImg) logoImg.src = s.siteLogo;
            }
            if (s.contactInfo) {
                var metaDesc = document.querySelector('meta[name="description"]');
                if (metaDesc) metaDesc.setAttribute('content', s.contactInfo);
            }
        }).catch(function() {});
    })();

    var email;
    var emailCode;
    var sendCodeBtn;
    var signinBtn;
    var signinForm;
    var sendTip;
    var password;
    var passwordToggle;
    var passwordGroup;
    var emailCodeGroup;
    var tabCode;
    var tabPassword;
    var signinSubtitle;
    var isSending = false;
    var countdownTimer = null;
    var verifyHash = '';
    var verifyTs = 0;
    var currentMode = 'code';

    function validateEmail(value) {
        if (!value) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    function validateUsername(value) {
        return value && value.trim().length >= 2;
    }

    function validateEmailCode(value) {
        return value && value.length === 6 && /^[0-9]+$/.test(value);
    }

    function validatePassword(value) {
        return value && value.length >= 6;
    }

    function setValidationIcon(iconId, isValid) {
        var icon = document.getElementById(iconId);
        if (!icon) return;
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
        if (currentMode === 'code') {
            var isEmailValid = validateEmail(email.value);
            var isCodeValid = validateEmailCode(emailCode.value);
            signinBtn.disabled = !(isEmailValid && isCodeValid);
        } else {
            var isUsernameValid = validateUsername(email.value);
            var isPasswordValid = validatePassword(password.value);
            signinBtn.disabled = !(isUsernameValid && isPasswordValid);
        }
    }

    function switchMode(mode) {
        currentMode = mode;
        if (mode === 'code') {
            tabCode.classList.add('active');
            tabPassword.classList.remove('active');
            signinSubtitle.textContent = 'Sign in with email verification';
            email.setAttribute('type', 'email');
            email.placeholder = 'Email';
            emailCodeGroup.style.display = 'flex';
            passwordGroup.style.display = 'none';
            sendTip.style.display = 'block';
        } else {
            tabPassword.classList.add('active');
            tabCode.classList.remove('active');
            signinSubtitle.textContent = 'Sign in with password';
            email.setAttribute('type', 'text');
            email.placeholder = 'Username';
            emailCodeGroup.style.display = 'none';
            passwordGroup.style.display = 'flex';
            sendTip.style.display = 'none';
        }
        updateSigninButton();
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

        fetch(CONFIG.API_BASE + '/auth/send-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailVal })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.success) {
                if (data.hash && data.ts) {
                    verifyHash = data.hash;
                    verifyTs = data.ts;
                }
            } else {
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

    function buildPage() {
        return '<section id="page-signin" class="signin-page">' +
            '<a href="#/" class="back-link" id="signinBackLink">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>' +
            '</a>' +
            '<div class="copyright">Copyright ©2026 VipenOnline All rights reserved</div>' +
            '<div class="comet-canvas" id="signinCometCanvas"></div>' +
            '<div class="signin-container">' +
            '<div class="signin-header">' +
            '<div class="signin-logo">' +
            '<img src="images/vipen-logo.png" alt="Vipen">' +
            '</div>' +
            '<h1 class="signin-title">Welcome Back</h1>' +
            '<p class="signin-subtitle" id="signinSubtitle">Sign in with email verification</p>' +
            '<div class="signin-tabs">' +
            '<button type="button" class="signin-tab active" data-mode="code" id="tabCode">Verification Code</button>' +
            '<button type="button" class="signin-tab" data-mode="password" id="tabPassword">Password</button>' +
            '</div>' +
            '</div>' +
            '<form class="signin-form" id="signinForm" autocomplete="off">' +
            '<div class="input-group" id="emailGroup">' +
            '<input type="email" id="signinEmail" class="input-field" placeholder="Email" autocomplete="off">' +
            '<div class="validation-icon" id="emailIcon">' +
            '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#32c864" stroke-width="2"/><path d="M8 12l2.5 2.5L16 9" stroke="#32c864" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '</div>' +
            '</div>' +
            '<div class="input-group email-code-group" id="emailCodeGroup">' +
            '<input type="text" id="signinEmailCode" class="input-field" placeholder="Verification Code" autocomplete="off" maxlength="6">' +
            '<button type="button" class="send-code-btn" id="sendCodeBtn">Send Code</button>' +
            '</div>' +
            '<div class="input-group has-toggle" id="passwordGroup" style="display:none">' +
            '<input type="password" id="signinPassword" class="input-field" placeholder="Password" autocomplete="off">' +
            '<button type="button" class="password-toggle" id="passwordToggle">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
            '</button>' +
            '</div>' +
            '<div class="send-tip" id="sendTip">Code sent, please check your inbox</div>' +
            '<button type="submit" class="signin-btn" id="signinSubmitBtn" disabled>Sign In</button>' +
            '<p class="signup-link">Don\'t have an account? <a href="#/signup">Sign up</a></p>' +
            '</form>' +
            '</div>' +
            '</section>';
    }

    function bindAll() {
        email = document.getElementById('signinEmail');
        emailCode = document.getElementById('signinEmailCode');
        sendCodeBtn = document.getElementById('sendCodeBtn');
        signinBtn = document.getElementById('signinSubmitBtn');
        signinForm = document.getElementById('signinForm');
        sendTip = document.getElementById('sendTip');
        password = document.getElementById('signinPassword');
        passwordToggle = document.getElementById('passwordToggle');
        passwordGroup = document.getElementById('passwordGroup');
        emailCodeGroup = document.getElementById('emailCodeGroup');
        tabCode = document.getElementById('tabCode');
        tabPassword = document.getElementById('tabPassword');
        signinSubtitle = document.getElementById('signinSubtitle');

        if (!email || !signinForm) return;

        tabCode.addEventListener('click', function() {
            switchMode('code');
        });

        tabPassword.addEventListener('click', function() {
            switchMode('password');
        });

        email.addEventListener('input', function() {
            if (currentMode === 'code') {
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
            } else {
                var isValid = validateUsername(this.value);
                setValidationIcon('emailIcon', isValid);
                if (isValid) {
                    this.classList.add('valid');
                    clearFieldError(this);
                } else {
                    this.classList.remove('valid');
                }
                sendCodeBtn.classList.remove('active');
            }
            if (sendTip.classList.contains('show')) {
                sendTip.classList.remove('show');
            }
            updateSigninButton();
        });

        email.addEventListener('blur', function() {
            var val = this.value;
            if (currentMode === 'code') {
                if (val && !validateEmail(val)) {
                    triggerShake(this);
                }
            } else {
                if (val && !validateUsername(val)) {
                    triggerShake(this);
                }
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

        password.addEventListener('input', function() {
            var isValid = validatePassword(this.value);
            if (isValid) {
                this.classList.add('valid');
                clearFieldError(this);
            } else {
                this.classList.remove('valid');
            }
            updateSigninButton();
        });

        password.addEventListener('blur', function() {
            var val = this.value;
            if (val && !validatePassword(val)) {
                triggerShake(this);
            }
        });

        passwordToggle.addEventListener('click', function() {
            var isPassword = password.type === 'password';
            password.type = isPassword ? 'text' : 'password';
            passwordToggle.innerHTML = isPassword ?
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>' :
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
        });

        sendCodeBtn.addEventListener('click', function() {
            if (isSending) return;
            sendVerificationCode();
        });

        signinForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (signinBtn.disabled) return;

            var emailVal = email.value;

            signinBtn.disabled = true;
            signinBtn.textContent = 'Verifying...';

            if (currentMode === 'code') {
                var codeVal = emailCode.value;
                fetch(CONFIG.API_BASE + '/auth/verify-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailVal, code: codeVal, hash: verifyHash, ts: verifyTs })
                })
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    if (data.success) {
                        Utils.setAuth({
                            username: data.username,
                            email: data.email,
                            token: data.token,
                            role: data.role || ''
                        });
                        Utils.migrateUserData();
                        if (window.location.pathname.toLowerCase().indexOf('signin.html') > -1) {
                            window.location.href = 'index.html#/profile';
                        } else {
                            window.location.hash = '#/profile';
                        }
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
            } else {
                var passwordVal = password.value;
                fetch(CONFIG.API_BASE + '/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailVal, password: passwordVal })
                })
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    if (data.success) {
                        Utils.setAuth({
                            username: data.username,
                            email: data.email,
                            token: data.token,
                            role: data.role || ''
                        });
                        Utils.migrateUserData();
                        if (window.location.pathname.toLowerCase().indexOf('signin.html') > -1) {
                            window.location.href = 'index.html#/profile';
                        } else {
                            window.location.hash = '#/profile';
                        }
                    } else {
                        signinBtn.disabled = false;
                        signinBtn.textContent = 'Sign In';
                        alert(data.error || 'Login failed');
                        triggerShake(password);
                    }
                })
                .catch(function() {
                    signinBtn.disabled = false;
                    signinBtn.textContent = 'Sign In';
                    alert('Network error. Please try again.');
                });
            }
        });

        var backLink = document.getElementById('signinBackLink');
        if (backLink) {
            backLink.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.hash = '#/';
            });
        }

        CometTrail.init('signinCometCanvas', '.signin-container, .back-link');
    }

    return {
        buildPage: buildPage,
        bindAll: bindAll
    };
})();
