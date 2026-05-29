(function(){
    var profileData = {
        displayName: 'Alex Chen',
        username: '@alexchen',
        email: 'alex@example.com',
        bio: 'Digital creator & designer',
        location: 'Shanghai, China',
        gender: '',
        genderChanged: false,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80',
        social: {
            instagram: '',
            x: '',
            youtube: '',
            tiktok: ''
        }
    };

    var currentEditField = null;
    var currentEditPlatform = null;

    var tabs = document.querySelectorAll('.profile-tab');
    var sections = document.querySelectorAll('.profile-section');

    tabs.forEach(function(tab){
        tab.addEventListener('click', function(){
            var target = this.dataset.tab;
            tabs.forEach(function(t){ t.classList.remove('active'); });
            sections.forEach(function(s){ s.classList.remove('active'); });
            this.classList.add('active');
            document.getElementById(target + 'Section').classList.add('active');
        });
    });

    function showToast(msg, isError){
        var toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.classList.toggle('error', !!isError);
        toast.classList.add('show');
        setTimeout(function(){ toast.classList.remove('show'); }, 2500);
    }

    function openModal(title, value, isTextarea, isGender){
        var modal = document.getElementById('editModal');
        var modalTitle = document.getElementById('editModalTitle');
        var modalBody = document.getElementById('editModalBody');
        modalTitle.textContent = 'Edit ' + title;
        modalBody.innerHTML = '';

        if(isGender){
            var warning = document.createElement('div');
            warning.className = 'gender-warning' + (profileData.genderChanged ? ' show' : '');
            warning.id = 'genderWarning';
            warning.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><span>Gender can only be changed once. Please choose carefully.</span>';
            modalBody.appendChild(warning);

            var options = document.createElement('div');
            options.className = 'gender-options';
            var genders = [
                {value: 'male', label: 'Male', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M8 12h8"/></svg>'},
                {value: 'female', label: 'Female', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>'},
                {value: 'other', label: 'Other', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>'}
            ];
            genders.forEach(function(g){
                var btn = document.createElement('div');
                btn.className = 'gender-option' + (profileData.gender === g.value ? ' selected' : '');
                btn.dataset.value = g.value;
                btn.innerHTML = g.icon + '<span>' + g.label + '</span>';
                btn.addEventListener('click', function(){
                    if(profileData.genderChanged && profileData.gender !== ''){
                        showToast('Gender can only be changed once', true);
                        return;
                    }
                    options.querySelectorAll('.gender-option').forEach(function(o){ o.classList.remove('selected'); });
                    this.classList.add('selected');
                });
                options.appendChild(btn);
            });
            modalBody.appendChild(options);
        } else if(isTextarea){
            var ta = document.createElement('textarea');
            ta.className = 'edit-modal-textarea';
            ta.id = 'editModalInput';
            ta.placeholder = 'Enter ' + title.toLowerCase() + '...';
            ta.value = value || '';
            modalBody.appendChild(ta);
        } else {
            var inp = document.createElement('input');
            inp.type = 'text';
            inp.className = 'edit-modal-input';
            inp.id = 'editModalInput';
            inp.placeholder = 'Enter ' + title.toLowerCase() + '...';
            inp.value = value || '';
            modalBody.appendChild(inp);
        }

        modal.classList.add('open');
        setTimeout(function(){
            var focusEl = document.getElementById('editModalInput');
            if(focusEl) focusEl.focus();
        }, 100);
    }

    function closeModal(){
        document.getElementById('editModal').classList.remove('open');
        currentEditField = null;
        currentEditPlatform = null;
    }

    document.querySelectorAll('.info-row.editable').forEach(function(row){
        row.addEventListener('click', function(){
            var field = this.dataset.field;
            var label = this.dataset.label;
            currentEditField = field;
            var value = profileData[field] || '';
            var isTextarea = field === 'bio';
            var isGender = field === 'gender';
            openModal(label, value, isTextarea, isGender);
        });
    });

    document.getElementById('editModalCancel').addEventListener('click', closeModal);
    document.getElementById('editModalOverlay').addEventListener('click', closeModal);

    document.getElementById('editModalSave').addEventListener('click', function(){
        if(currentEditField === 'gender'){
            if(profileData.genderChanged && profileData.gender !== ''){
                showToast('Gender can only be changed once', true);
                closeModal();
                return;
            }
            var selected = document.querySelector('.gender-option.selected');
            if(!selected){
                showToast('Please select a gender', true);
                return;
            }
            var newGender = selected.dataset.value;
            if(profileData.gender && profileData.gender !== newGender && profileData.genderChanged){
                showToast('Gender can only be changed once', true);
                closeModal();
                return;
            }
            profileData.gender = newGender;
            profileData.genderChanged = true;
            updateGenderDisplay();
            showToast('Gender updated successfully');
        } else if(currentEditField){
            var input = document.getElementById('editModalInput');
            var newValue = input.value.trim();
            if(!newValue){
                showToast('Please enter a value', true);
                return;
            }
            profileData[currentEditField] = newValue;
            updateFieldDisplay(currentEditField, newValue);
            showToast('Updated successfully');
        } else if(currentEditPlatform){
            var input2 = document.getElementById('editModalInput');
            var newHandle = input2.value.trim();
            if(!newHandle){
                showToast('Please enter a handle', true);
                return;
            }
            profileData.social[currentEditPlatform] = newHandle;
            updateSocialDisplay(currentEditPlatform, newHandle);
            showToast('Account linked successfully');
        }
        closeModal();
    });

    function updateFieldDisplay(field, value){
        var el = document.getElementById('info' + field.charAt(0).toUpperCase() + field.slice(1));
        if(el) el.textContent = value;
        if(field === 'displayName'){
            document.getElementById('displayName').textContent = value;
        }
        if(field === 'username'){
            document.getElementById('userHandle').textContent = value;
        }
    }

    function updateGenderDisplay(){
        var genderMap = {male: 'Male', female: 'Female', other: 'Other'};
        var display = profileData.gender ? genderMap[profileData.gender] : 'Not set';
        document.getElementById('infoGender').textContent = display;
    }

    function updateSocialDisplay(platform, handle){
        var handleEl = document.getElementById(platform + 'Handle');
        var btn = document.getElementById(platform + 'Btn');
        if(handle){
            handleEl.textContent = '@' + handle;
            btn.textContent = 'Unlink';
            btn.classList.add('linked');
        } else {
            handleEl.textContent = 'Not connected';
            btn.textContent = 'Link';
            btn.classList.remove('linked');
        }
    }

    document.querySelectorAll('.social-link-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
            var platform = this.dataset.platform;
            currentEditPlatform = platform;
            currentEditField = null;
            if(this.classList.contains('linked')){
                profileData.social[platform] = '';
                updateSocialDisplay(platform, '');
                showToast('Account unlinked');
            } else {
                var platformNames = {instagram: 'Instagram', x: 'X (Twitter)', youtube: 'YouTube', tiktok: 'TikTok'};
                openModal(platformNames[platform] + ' Handle', '', false, false);
            }
        });
    });

    var avatarInput = document.getElementById('avatarInput');
    var avatarEditBtn = document.getElementById('avatarEditBtn');
    var profileAvatarImg = document.getElementById('profileAvatarImg');

    avatarEditBtn.addEventListener('click', function(){
        avatarInput.click();
    });

    avatarInput.addEventListener('change', function(e){
        var file = e.target.files[0];
        if(file){
            var reader = new FileReader();
            reader.onload = function(evt){
                profileAvatarImg.src = evt.target.result;
                profileData.avatar = evt.target.result;
                showToast('Avatar updated');
            };
            reader.readAsDataURL(file);
        }
    });

    document.addEventListener('keydown', function(e){
        if(e.key === 'Escape'){
            closeModal();
        }
    });

    CometTrail.init('cometCanvas', '.profile-container, .back-link, .edit-modal-content, .profile-tab');
})();