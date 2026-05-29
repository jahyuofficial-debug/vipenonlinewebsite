(function(){
    var accountName = document.getElementById('accountName');
    var password = document.getElementById('password');
    var email = document.getElementById('email');
    var emailCode = document.getElementById('emailCode');
    var agreementCheckbox = document.getElementById('agreementCheckbox');
    var agreementRadio = document.getElementById('agreementRadio');
    var nextBtn = document.getElementById('nextBtn');
    var passwordToggle = document.getElementById('passwordToggle');
    var confirmPasswordWrapper = document.getElementById('confirmPasswordWrapper');
    var confirmPassword = document.getElementById('confirmPassword');
    var confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
    var sendCodeBtn = document.getElementById('sendCodeBtn');
    var signupForm = document.getElementById('signupForm');
    var accountError = document.getElementById('accountError');
    var sendTip = document.getElementById('sendTip');

    var eyeOpenSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    var eyeClosedSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

    function validateAccountName(value){
        if(!value) return false;
        if(value.length < 3 || value.length > 10) return false;
        return /^[a-zA-Z0-9]+$/.test(value);
    }

    function hasNonEnglishChars(value){
        if(!value) return false;
        return /[^a-zA-Z0-9]/.test(value);
    }

    function validatePassword(value){
        if(!value) return false;
        return value.length >= 8 && value.length <= 15;
    }

    function validateEmail(value){
        if(!value) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    function validateEmailCode(value){
        return value && value.length === 6 && /^[0-9]+$/.test(value);
    }

    function showConfirmPassword(){
        confirmPasswordWrapper.style.display = 'block';
        requestAnimationFrame(function(){
            confirmPasswordWrapper.classList.add('expanded');
        });
    }

    function hideConfirmPassword(){
        confirmPasswordWrapper.classList.remove('expanded');
        confirmPassword.value = '';
        confirmPassword.classList.remove('valid','error');
        setValidationIcon('confirmPasswordIcon', false);
        setTimeout(function(){
            confirmPasswordWrapper.style.display = 'none';
        }, 350);
    }

    function setValidationIcon(iconId, isValid){
        var icon = document.getElementById(iconId);
        if(isValid){
            icon.classList.add('show');
        } else {
            icon.classList.remove('show');
        }
    }

    function setFieldError(inputEl, isError){
        if(isError){
            inputEl.classList.add('error');
            inputEl.classList.remove('valid');
        } else {
            inputEl.classList.remove('error');
        }
    }

    function clearFieldError(inputEl){
        inputEl.classList.remove('error');
    }

    function triggerShake(inputEl){
        inputEl.classList.remove('error');
        void inputEl.offsetWidth;
        inputEl.classList.add('error');
    }

    function updateNextButton(){
        var isAccountValid = validateAccountName(accountName.value);
        var isPasswordValid = validatePassword(password.value);
        var isEmailValid = validateEmail(email.value);
        var isCodeValid = validateEmailCode(emailCode.value);
        var isAgreed = agreementCheckbox.checked;

        var allValid = isAccountValid && isPasswordValid && isEmailValid && isCodeValid && isAgreed;

        if(confirmPasswordWrapper.classList.contains('expanded')){
            var isConfirmValid = confirmPassword.value && confirmPassword.value === password.value;
            if(!isConfirmValid) allValid = false;
        }

        if(allValid){
            nextBtn.disabled = false;
        } else {
            nextBtn.disabled = true;
        }
    }

    accountName.addEventListener('input', function(){
        var val = this.value;
        var isValid = validateAccountName(val);
        var hasInvalid = hasNonEnglishChars(val);
        setValidationIcon('accountIcon', isValid);
        if(isValid){
            this.classList.add('valid');
            clearFieldError(this);
        } else {
            this.classList.remove('valid');
        }
        if(hasInvalid){
            accountError.classList.add('show');
        } else {
            accountError.classList.remove('show');
        }
        updateNextButton();
    });

    accountName.addEventListener('blur', function(){
        var val = this.value;
        if(val && !validateAccountName(val)){
            triggerShake(this);
        }
    });

    password.addEventListener('input', function(){
        var isValid = validatePassword(this.value);
        setValidationIcon('passwordIcon', isValid);
        if(isValid){
            this.classList.add('valid');
            clearFieldError(this);
            if(!confirmPasswordWrapper.classList.contains('expanded')){
                showConfirmPassword();
            } else {
                setValidationIcon('confirmPasswordIcon', confirmPassword.value === this.value);
                if(confirmPassword.value !== this.value){
                    confirmPassword.classList.remove('valid');
                }
            }
        } else {
            this.classList.remove('valid');
            if(confirmPasswordWrapper.classList.contains('expanded')){
                hideConfirmPassword();
            }
        }
        updateNextButton();
    });

    password.addEventListener('blur', function(){
        var val = this.value;
        if(val && !validatePassword(val)){
            triggerShake(this);
        }
    });

    confirmPassword.addEventListener('input', function(){
        var isValid = this.value && this.value === password.value;
        setValidationIcon('confirmPasswordIcon', isValid);
        if(isValid){
            this.classList.add('valid');
            clearFieldError(this);
        } else {
            this.classList.remove('valid');
        }
        updateNextButton();
    });

    confirmPassword.addEventListener('blur', function(){
        var val = this.value;
        if(val && val !== password.value){
            triggerShake(this);
        }
    });

    confirmPasswordToggle.addEventListener('click', function(){
        var isPassword = confirmPassword.type === 'password';
        confirmPassword.type = isPassword ? 'text' : 'password';
        document.getElementById('confirmPasswordEyeIcon').innerHTML = isPassword ? eyeClosedSvg : eyeOpenSvg;
    });

    email.addEventListener('input', function(){
        var isValid = validateEmail(this.value);
        setValidationIcon('emailIcon', isValid);
        if(isValid){
            this.classList.add('valid');
            clearFieldError(this);
            sendCodeBtn.classList.add('active');
        } else {
            this.classList.remove('valid');
            sendCodeBtn.classList.remove('active');
        }
        if(sendTip.classList.contains('show')){
            sendTip.classList.remove('show');
        }
        updateNextButton();
    });

    email.addEventListener('blur', function(){
        var val = this.value;
        if(val && !validateEmail(val)){
            triggerShake(this);
        }
    });

    emailCode.addEventListener('input', function(){
        var isValid = validateEmailCode(this.value);
        if(isValid){
            this.classList.add('valid');
            clearFieldError(this);
        } else {
            this.classList.remove('valid');
        }
        updateNextButton();
    });

    emailCode.addEventListener('blur', function(){
        var val = this.value;
        if(val && !validateEmailCode(val)){
            triggerShake(this);
        }
    });

    agreementRadio.addEventListener('click', function(){
        var isChecked = agreementRadio.classList.toggle('checked');
        agreementCheckbox.checked = isChecked;
        updateNextButton();
    });

    passwordToggle.addEventListener('click', function(){
        var isPassword = password.type === 'password';
        password.type = isPassword ? 'text' : 'password';
        document.getElementById('passwordEyeIcon').innerHTML = isPassword ? eyeClosedSvg : eyeOpenSvg;
    });

    sendCodeBtn.addEventListener('click', function(){
        if (sendCodeBtn.disabled) return;
        var emailVal = email.value;
        if(!validateEmail(emailVal)){
            alert('Please enter a valid email address first.');
            email.focus();
            return;
        }
        sendCodeBtn.disabled = true;
        sendTip.classList.add('show');
        var countdown = 60;
        sendCodeBtn.textContent = countdown + 's';
        var timer = setInterval(function(){
            countdown--;
            if(countdown <= 0){
                clearInterval(timer);
                sendCodeBtn.disabled = false;
                sendCodeBtn.textContent = 'Send Code';
                sendTip.classList.remove('show');
            } else {
                sendCodeBtn.textContent = countdown + 's';
            }
        }, 1000);

        fetch('/api/auth/send-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailVal })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (!data.success) {
                clearInterval(timer);
                sendCodeBtn.disabled = false;
                sendCodeBtn.textContent = 'Send Code';
                sendTip.classList.remove('show');
                alert(data.error || 'Failed to send verification code');
            }
        })
        .catch(function() {
            clearInterval(timer);
            sendCodeBtn.disabled = false;
            sendCodeBtn.textContent = 'Send Code';
            sendTip.classList.remove('show');
            alert('Network error. Please try again.');
        });
    });

    signupForm.addEventListener('submit', function(e){
        e.preventDefault();
        if(nextBtn.disabled) return;

        fetch('/api/auth/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.value, code: emailCode.value })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.success) {
                Utils.setAuth({
                    username: data.username || accountName.value,
                    email: data.email || email.value,
                    token: data.token
                });
                window.location.href = 'index.html#/';
            } else {
                alert(data.error || 'Verification failed');
            }
        })
        .catch(function() {
            alert('Network error. Please try again.');
        });
    });

    var backLink = document.getElementById('backLink');
    if(backLink){
        backLink.addEventListener('click', function(e){
            e.preventDefault();
            window.location.href = 'index.html#/';
        });
    }

    CometTrail.init('cometCanvas', '.signup-container, .back-link');
})();