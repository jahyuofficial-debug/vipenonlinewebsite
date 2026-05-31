var ProfilePage = (function() {
    'use strict';

    var profileData = {
        displayName: 'Jah 72',
        email: 'jahyuofficial@gmail.com',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80',
        badge: 'Social Public',
        socialPublic: true,
        socials: {
            facebook: { linked: true, url: 'https://facebook.com/jahyuofficial' },
            instagram: { linked: false, url: '' },
            x: { linked: true, url: 'https://x.com/jahyuofficial' },
            wechat: { linked: false, url: '' }
        }
    };

    var socialPlatforms = {
        facebook: { name: 'Facebook', color: '#1877f2', bindUrl: 'https://facebook.com/vipen/bind' },
        instagram: { name: 'Instagram', color: '#e4405f', bindUrl: 'https://instagram.com/vipen/bind' },
        x: { name: 'X', color: '#fff', bindUrl: 'https://x.com/vipen/bind' },
        wechat: { name: 'WeChat', color: '#07c160', bindUrl: 'https://wechat.com/vipen/bind' }
    };

    var currentEditField = null;
    var pendingEmail = null;
    var isBound = false;
    var cachedDom = {};

    function showToast(msg, isError) {
        var toast = document.getElementById('profileToast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.toggle('error', !!isError);
        toast.classList.add('show');
        setTimeout(function() { toast.classList.remove('show'); }, 2500);
    }

    function openModal(title, value, extraContent) {
        var modal = document.getElementById('profileEditModal');
        var modalTitle = document.getElementById('profileEditModalTitle');
        var modalBody = document.getElementById('profileEditModalBody');
        var modalActions = document.getElementById('profileEditModalActions');
        if (!modal || !modalTitle || !modalBody) return;

        modalTitle.textContent = title;
        modalBody.innerHTML = '';

        if (extraContent) {
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = extraContent;
            while (tempDiv.firstChild) {
                modalBody.appendChild(tempDiv.firstChild);
            }
            if (modalActions) modalActions.style.display = 'none';
        } else {
            var input = document.createElement('input');
            input.type = 'text';
            input.className = 'edit-modal-input';
            input.id = 'profileEditModalInput';
            input.placeholder = 'Enter value...';
            modalBody.appendChild(input);
            if (modalActions) modalActions.style.display = '';
            input.value = value || '';
            input.placeholder = 'Enter ' + (title ? title.toLowerCase() : 'value') + '...';
            setTimeout(function() { input.focus(); }, 100);
        }
        modal.classList.add('open');
    }

    function closeModal() {
        if (cachedDom.profileEditModal) {
            cachedDom.profileEditModal.classList.remove('open');
        }
        if (cachedDom.profileLogoutModal) {
            cachedDom.profileLogoutModal.classList.remove('open');
        }
        currentEditField = null;
        pendingEmail = null;
    }

    function renderSocialIcons() {
        var container = cachedDom.socialContainer;
        if (!container) return;

        var links = container.querySelectorAll('.social-icon-link');
        var platforms = ['facebook', 'instagram', 'x', 'wechat'];

        for (var i = 0; i < links.length; i++) {
            var link = links[i];
            var platform = platforms[i];
            if (!platform) return;

            var data = profileData.socials[platform];
            var cfg = socialPlatforms[platform];
            if (!data || !cfg) return;

            link.classList.toggle('unlinked', !data.linked);
            link.classList.toggle('linked', data.linked);

            var tooltip = link.querySelector('.social-tooltip');
            if (!tooltip) {
                tooltip = document.createElement('span');
                tooltip.className = 'social-tooltip';
                link.appendChild(tooltip);
            }
            tooltip.textContent = data.linked ? cfg.name : 'No link';
        }
    }

    function renderBadge() {
        var badge = document.getElementById('profileBadge');
        if (!badge) return;
        badge.textContent = profileData.badge;
        badge.classList.toggle('public', profileData.socialPublic);
        badge.classList.toggle('private', !profileData.socialPublic);
    }

    function handleSocialClick(e, platform) {
        e.preventDefault();
        var data = profileData.socials[platform];
        var cfg = socialPlatforms[platform];
        if (!data || !cfg) return;

        if (!data.linked) {
            window.open(cfg.bindUrl, '_blank');
            return;
        }

        var modalBody =
            '<p style="color:rgba(255,255,255,.7);font-size:.12rem;text-align:center;margin-bottom:.16rem;">Unbind ' + cfg.name + '?</p>' +
            '<div class="edit-modal-actions">' +
            '<button class="edit-modal-btn cancel unbind-cancel-btn">Cancel</button>' +
            '<button class="edit-modal-btn save unbind-yes-btn" style="background:#22c55e;color:#000;">Yes</button>' +
            '</div>';

        openModal('Unbind', '', modalBody);

        if (cachedDom.profileEditModalBody) {
            var cancelBtn = cachedDom.profileEditModalBody.querySelector('.unbind-cancel-btn');
            var yesBtn = cachedDom.profileEditModalBody.querySelector('.unbind-yes-btn');
            if (cancelBtn) cancelBtn.addEventListener('click', closeModal, { once: true });
            if (yesBtn) yesBtn.addEventListener('click', function() {
                profileData.socials[platform].linked = false;
                profileData.socials[platform].url = '';
                renderSocialIcons();
                showToast(cfg.name + ' unbound');
                closeModal();
            }, { once: true });
        }
    }

    function openEmailEditModal() {
        var modal = document.getElementById('profileEditModal');
        var modalTitle = document.getElementById('profileEditModalTitle');
        var modalBody = document.getElementById('profileEditModalBody');
        var modalActions = document.getElementById('profileEditModalActions');
        if (!modal || !modalTitle || !modalBody) return;

        modalTitle.textContent = 'Email';
        modalBody.innerHTML = '';

        var wrap = document.createElement('div');
        wrap.className = 'email-edit-wrap';

        var input = document.createElement('input');
        input.type = 'email';
        input.className = 'edit-modal-input';
        input.placeholder = 'Enter new email...';
        input.value = profileData.email;

        var verifyBtn = document.createElement('button');
        verifyBtn.className = 'email-verify-btn disabled';
        verifyBtn.textContent = 'Verify';
        verifyBtn.disabled = true;

        wrap.appendChild(input);
        wrap.appendChild(verifyBtn);
        modalBody.appendChild(wrap);
        if (modalActions) modalActions.style.display = 'none';

        input.addEventListener('input', function() {
            var val = input.value.trim();
            if (val && val !== profileData.email) {
                verifyBtn.classList.remove('disabled');
                verifyBtn.disabled = false;
            } else {
                verifyBtn.classList.add('disabled');
                verifyBtn.disabled = true;
            }
        });

        verifyBtn.addEventListener('click', function() {
            var newEmail = input.value.trim();
            if (!newEmail || newEmail === profileData.email) return;

            input.disabled = true;

            var codeInput = document.createElement('input');
            codeInput.type = 'text';
            codeInput.className = 'email-code-input';
            codeInput.placeholder = 'Enter verification code';
            codeInput.maxLength = 6;

            verifyBtn.replaceWith(codeInput);
            setTimeout(function() { codeInput.focus(); }, 100);

            codeInput.addEventListener('input', function() {
                var code = codeInput.value.trim();
                codeInput.classList.remove('error');
                if (code.length === 6) {
                    if (code === '123456') {
                        codeInput.classList.remove('error');
                        profileData.email = newEmail;
                        if (cachedDom.profileEmail) cachedDom.profileEmail.textContent = newEmail;
                        closeModal();
                        showToast('Email verified!');
                    } else {
                        codeInput.classList.add('error');
                    }
                }
            });
        });

        modal.classList.add('open');
        setTimeout(function() { input.focus(); }, 100);
    }

    function setupYoMenu(dom) {
        var cardYo = dom.cardYo;
        var yoMenuModal = dom.yoMenuModal;
        var yoMenuOverlay = dom.yoMenuOverlay;
        var yoMenuFresh = dom.yoMenuFresh;
        var yoMenuAction = dom.yoMenuAction;

        function openYoMenu() {
            if (yoMenuModal) yoMenuModal.classList.add('open');
        }

        function closeYoMenu() {
            if (yoMenuModal) yoMenuModal.classList.remove('open');
        }

        if (cardYo) cardYo.addEventListener('click', openYoMenu);
        if (yoMenuOverlay) yoMenuOverlay.addEventListener('click', closeYoMenu);

        return { closeYoMenu: closeYoMenu };
    }

    function setupFreshEditor(dom, closeYoMenuFn) {
        var freshEditorModal = dom.freshEditorModal;
        var freshEditorOverlay = dom.freshEditorOverlay;
        var freshEditorClose = dom.freshEditorClose;
        var freshEditorTitleInput = dom.freshEditorTitleInput;
        var freshEditorBody = dom.freshEditorBody;
        var freshEditorImageBtn = dom.freshEditorImageBtn;
        var freshEditorImageInput = dom.freshEditorImageInput;
        var freshEditorImageArea = dom.freshEditorImageArea;
        var freshEditorDraft = dom.freshEditorDraft;
        var freshEditorPublish = dom.freshEditorPublish;
        var freshImages = [];

        function openFreshEditor() {
            if (freshEditorModal) {
                freshEditorModal.classList.add('open');
                if (freshEditorTitleInput) {
                    freshEditorTitleInput.value = '';
                    setTimeout(function() { freshEditorTitleInput.focus(); }, 100);
                }
                if (freshEditorBody) freshEditorBody.innerHTML = '';
                freshImages = [];
                if (freshEditorImageArea) freshEditorImageArea.innerHTML = '';
            }
        }

        function closeFreshEditor() {
            if (freshEditorModal) freshEditorModal.classList.remove('open');
        }

        function appendFreshImageItem(src, idx) {
            if (!freshEditorImageArea) return;
            var item = document.createElement('div');
            item.className = 'fresh-editor-image-item';
            item.dataset.idx = idx;
            var img = document.createElement('img');
            img.src = src;
            img.alt = '';
            var removeBtn = document.createElement('button');
            removeBtn.className = 'fresh-editor-image-remove';
            removeBtn.innerHTML = '&times;';
            removeBtn.addEventListener('click', function() {
                var itemIdx = parseInt(item.dataset.idx, 10);
                freshImages.splice(itemIdx, 1);
                item.remove();
                reindexFreshImages();
            });
            item.appendChild(img);
            item.appendChild(removeBtn);
            freshEditorImageArea.appendChild(item);
        }

        function reindexFreshImages() {
            if (!freshEditorImageArea) return;
            var items = freshEditorImageArea.querySelectorAll('.fresh-editor-image-item');
            items.forEach(function(item, i) {
                item.dataset.idx = i;
            });
        }

        function saveFreshDraft() {
            var title = freshEditorTitleInput ? freshEditorTitleInput.value.trim() : '';
            var body = freshEditorBody ? freshEditorBody.innerHTML.trim() : '';
            if (!title && !body) {
                showToast('Cannot save empty draft', true);
                return;
            }
            var drafts = JSON.parse(localStorage.getItem('vipenDrafts') || '[]');
            drafts.push({
                type: 'fresh',
                title: title,
                content: body,
                images: freshImages,
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('vipenDrafts', JSON.stringify(drafts));
            showToast('Saved to drafts');
            closeFreshEditor();
        }

        function publishFresh() {
            var title = freshEditorTitleInput ? freshEditorTitleInput.value.trim() : '';
            var body = freshEditorBody ? freshEditorBody.innerHTML.trim() : '';
            if (!title && !body) {
                showToast('Please enter content', true);
                return;
            }
            var posts = JSON.parse(localStorage.getItem('vipenPosts') || '[]');
            posts.unshift({
                type: 'fresh',
                title: title,
                content: body,
                images: freshImages,
                publishedAt: new Date().toISOString(),
                author: profileData.displayName,
                avatar: profileData.avatar
            });
            localStorage.setItem('vipenPosts', JSON.stringify(posts));
            showToast('Fresh article published');
            closeFreshEditor();
        }

        if (freshEditorOverlay) freshEditorOverlay.addEventListener('click', closeFreshEditor);
        if (freshEditorClose) freshEditorClose.addEventListener('click', closeFreshEditor);
        if (freshEditorDraft) freshEditorDraft.addEventListener('click', saveFreshDraft);
        if (freshEditorPublish) freshEditorPublish.addEventListener('click', publishFresh);

        if (freshEditorImageBtn && freshEditorImageInput) {
            freshEditorImageBtn.addEventListener('click', function() {
                freshEditorImageInput.click();
            });
            freshEditorImageInput.addEventListener('change', function(e) {
                var files = e.target.files;
                if (!files) return;
                Array.from(files).forEach(function(file) {
                    var reader = new FileReader();
                    reader.onload = function(evt) {
                        freshImages.push(evt.target.result);
                        appendFreshImageItem(evt.target.result, freshImages.length - 1);
                    };
                    reader.readAsDataURL(file);
                });
                freshEditorImageInput.value = '';
            });
        }

        if (freshEditorBody) {
            freshEditorBody.addEventListener('keydown', function(e) {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    document.execCommand('insertText', false, '    ');
                }
            });
        }

        var toolbar = freshEditorModal ? freshEditorModal.querySelector('.fresh-editor-toolbar') : null;
        if (toolbar) {
            toolbar.addEventListener('click', function(e) {
                var btn = e.target.closest('.fresh-editor-tool');
                if (!btn) return;
                var cmd = btn.getAttribute('data-cmd');
                var val = btn.getAttribute('data-val') || null;
                if (cmd === 'formatBlock' && val) {
                    document.execCommand(cmd, false, val);
                } else {
                    document.execCommand(cmd, false, null);
                }
                if (freshEditorBody) freshEditorBody.focus();
                if (cmd === 'bold' || cmd === 'italic') {
                    setTimeout(function() {
                        var isActive = document.queryCommandState(cmd);
                        btn.classList.toggle('active', isActive);
                    }, 0);
                }
            });
        }

        return { openFreshEditor: openFreshEditor, closeFreshEditor: closeFreshEditor };
    }

    function setupActionEditor(dom, closeYoMenuFn) {
        var actionEditorModal = dom.actionEditorModal;
        var actionEditorOverlay = dom.actionEditorOverlay;
        var actionEditorClose = dom.actionEditorClose;
        var actionEditorTextarea = dom.actionEditorTextarea;
        var actionEditorImageBtn = dom.actionEditorImageBtn;
        var actionEditorImageInput = dom.actionEditorImageInput;
        var actionEditorImageGrid = dom.actionEditorImageGrid;
        var actionEditorDraft = dom.actionEditorDraft;
        var actionEditorPublish = dom.actionEditorPublish;
        var actionEditorAvatar = dom.actionEditorAvatar;
        var actionEditorUsername = dom.actionEditorUsername;
        var actionEditorEmojiBtn = dom.actionEditorEmojiBtn;
        var actionImages = [];

        function openActionEditor() {
            if (actionEditorModal) {
                actionEditorModal.classList.add('open');
                if (actionEditorTextarea) {
                    actionEditorTextarea.value = '';
                    setTimeout(function() { actionEditorTextarea.focus(); }, 100);
                }
                actionImages = [];
                if (actionEditorImageGrid) {
                    actionEditorImageGrid.innerHTML = '';
                    actionEditorImageGrid.className = 'action-editor-image-grid';
                }
                if (actionEditorAvatar) actionEditorAvatar.src = profileData.avatar;
                if (actionEditorUsername) actionEditorUsername.textContent = profileData.displayName;
            }
        }

        function closeActionEditor() {
            if (actionEditorModal) actionEditorModal.classList.remove('open');
        }

        function appendActionImageItem(src) {
            if (!actionEditorImageGrid) return;
            var count = actionImages.length;
            actionEditorImageGrid.className = 'action-editor-image-grid' +
                (count === 1 ? ' single' : count === 2 ? ' double' : '');

            var item = document.createElement('div');
            item.className = 'action-editor-image-item';
            item.dataset.src = src;
            var img = document.createElement('img');
            img.src = src;
            img.alt = '';
            var removeBtn = document.createElement('button');
            removeBtn.className = 'action-editor-image-remove';
            removeBtn.innerHTML = '&times;';
            removeBtn.addEventListener('click', function() {
                var itemSrc = item.dataset.src;
                var idx = actionImages.indexOf(itemSrc);
                if (idx > -1) actionImages.splice(idx, 1);
                item.remove();
                var newCount = actionImages.length;
                if (actionEditorImageGrid) {
                    actionEditorImageGrid.className = 'action-editor-image-grid' +
                        (newCount === 1 ? ' single' : newCount === 2 ? ' double' : '');
                }
            });
            item.appendChild(img);
            item.appendChild(removeBtn);
            actionEditorImageGrid.appendChild(item);
        }

        function saveActionDraft() {
            var text = actionEditorTextarea ? actionEditorTextarea.value.trim() : '';
            if (!text) {
                showToast('Cannot save empty draft', true);
                return;
            }
            var drafts = JSON.parse(localStorage.getItem('vipenDrafts') || '[]');
            drafts.push({
                type: 'action',
                content: text,
                images: actionImages,
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('vipenDrafts', JSON.stringify(drafts));
            showToast('Saved to drafts');
            closeActionEditor();
        }

        function publishAction() {
            var text = actionEditorTextarea ? actionEditorTextarea.value.trim() : '';
            if (!text) {
                showToast('Please enter content', true);
                return;
            }
            var posts = JSON.parse(localStorage.getItem('vipenPosts') || '[]');
            posts.unshift({
                type: 'action',
                content: text,
                images: actionImages,
                publishedAt: new Date().toISOString(),
                author: profileData.displayName,
                avatar: profileData.avatar
            });
            localStorage.setItem('vipenPosts', JSON.stringify(posts));
            showToast('Action update posted');
            closeActionEditor();
        }

        if (actionEditorOverlay) actionEditorOverlay.addEventListener('click', closeActionEditor);
        if (actionEditorClose) actionEditorClose.addEventListener('click', closeActionEditor);
        if (actionEditorDraft) actionEditorDraft.addEventListener('click', saveActionDraft);
        if (actionEditorPublish) actionEditorPublish.addEventListener('click', publishAction);

        if (actionEditorImageBtn && actionEditorImageInput) {
            actionEditorImageBtn.addEventListener('click', function() {
                actionEditorImageInput.click();
            });
            actionEditorImageInput.addEventListener('change', function(e) {
                var files = e.target.files;
                if (!files) return;
                Array.from(files).forEach(function(file) {
                    var reader = new FileReader();
                    reader.onload = function(evt) {
                        actionImages.push(evt.target.result);
                        appendActionImageItem(evt.target.result);
                    };
                    reader.readAsDataURL(file);
                });
                actionEditorImageInput.value = '';
            });
        }

        if (actionEditorEmojiBtn && actionEditorTextarea) {
            actionEditorEmojiBtn.addEventListener('click', function() {
                var emojis = ['😀','😂','🥰','😎','🤔','👍','🔥','❤️','🎉','✨'];
                var emoji = emojis[Math.floor(Math.random() * emojis.length)];
                var start = actionEditorTextarea.selectionStart;
                var end = actionEditorTextarea.selectionEnd;
                var text = actionEditorTextarea.value;
                actionEditorTextarea.value = text.substring(0, start) + emoji + text.substring(end);
                actionEditorTextarea.selectionStart = actionEditorTextarea.selectionEnd = start + emoji.length;
                actionEditorTextarea.focus();
            });
        }

        return { openActionEditor: openActionEditor, closeActionEditor: closeActionEditor };
    }

    function bindAll() {
        if (isBound) return;
        isBound = true;

        var auth = Utils.getAuth();
        if (auth) {
            if (auth.username) {
                profileData.displayName = auth.username;
                var dn = document.getElementById('profileDisplayName');
                if (dn) dn.textContent = auth.username;
            }
            if (auth.email) {
                profileData.email = auth.email;
                var em = document.getElementById('profileEmail');
                if (em) em.textContent = auth.email;
            }
        }

        cachedDom.profileEditModalBody = document.getElementById('profileEditModalBody');
        var dom = {
            cancelBtn: document.getElementById('profileEditModalCancel'),
            overlay: document.getElementById('profileEditModalOverlay'),
            saveBtn: document.getElementById('profileEditModalSave'),
            cardYo: document.getElementById('cardYo'),
            cardHi: document.getElementById('cardHi'),
            yoMenuModal: document.getElementById('yoMenuModal'),
            yoMenuOverlay: document.getElementById('yoMenuOverlay'),
            yoMenuFresh: document.getElementById('yoMenuFresh'),
            yoMenuAction: document.getElementById('yoMenuAction'),
            freshEditorModal: document.getElementById('freshEditorModal'),
            freshEditorOverlay: document.getElementById('freshEditorOverlay'),
            freshEditorClose: document.getElementById('freshEditorClose'),
            freshEditorTitleInput: document.getElementById('freshEditorTitleInput'),
            freshEditorBody: document.getElementById('freshEditorBody'),
            freshEditorImageBtn: document.getElementById('freshEditorImageBtn'),
            freshEditorImageInput: document.getElementById('freshEditorImageInput'),
            freshEditorImageArea: document.getElementById('freshEditorImageArea'),
            freshEditorDraft: document.getElementById('freshEditorDraft'),
            freshEditorPublish: document.getElementById('freshEditorPublish'),
            actionEditorModal: document.getElementById('actionEditorModal'),
            actionEditorOverlay: document.getElementById('actionEditorOverlay'),
            actionEditorClose: document.getElementById('actionEditorClose'),
            actionEditorTextarea: document.getElementById('actionEditorTextarea'),
            actionEditorImageBtn: document.getElementById('actionEditorImageBtn'),
            actionEditorImageInput: document.getElementById('actionEditorImageInput'),
            actionEditorImageGrid: document.getElementById('actionEditorImageGrid'),
            actionEditorDraft: document.getElementById('actionEditorDraft'),
            actionEditorPublish: document.getElementById('actionEditorPublish'),
            actionEditorAvatar: document.getElementById('actionEditorAvatar'),
            actionEditorUsername: document.getElementById('actionEditorUsername'),
            actionEditorEmojiBtn: document.getElementById('actionEditorEmojiBtn'),
            avatarInput: document.getElementById('profileAvatarInput'),
            avatarEditBtn: document.getElementById('profileAvatarEditBtn'),
            profileAvatarImg: document.getElementById('profileAvatarImg'),
            displayNameEl: document.getElementById('profileDisplayName'),
            emailEl: document.getElementById('profileEmail'),
            badgeEl: document.getElementById('profileBadge'),
            backLink: document.querySelector('.profile-page .back-link'),
            profileEditModal: document.getElementById('profileEditModal'),
            profileLogoutBtn: document.getElementById('profileLogoutBtn'),
            profileLogoutModal: document.getElementById('profileLogoutModal'),
            profileLogoutModalOverlay: document.getElementById('profileLogoutModalOverlay'),
            profileLogoutCancel: document.getElementById('profileLogoutCancel'),
            profileLogoutYes: document.getElementById('profileLogoutYes'),
            socialContainer: document.querySelector('.profile-social-icons')
        };
        
        for (var key in dom) {
            cachedDom[key] = dom[key];
        }

        if (dom.cancelBtn) dom.cancelBtn.addEventListener('click', closeModal);
        if (dom.overlay) dom.overlay.addEventListener('click', closeModal);

        if (dom.saveBtn) {
            dom.saveBtn.addEventListener('click', function() {
                var input = document.getElementById('profileEditModalInput');
                if (!input) { closeModal(); return; }
                var newValue = input.value.trim();
                if (!newValue) {
                    showToast('Please enter a value', true);
                    return;
                }
                if (currentEditField === 'displayName') {
                    profileData.displayName = newValue;
                    if (dom.displayNameEl) dom.displayNameEl.textContent = newValue;
                    showToast('Name updated');
                    closeModal();
                } else if (currentEditField === 'badge') {
                    profileData.badge = newValue;
                    if (dom.badgeEl) dom.badgeEl.textContent = newValue;
                    showToast('Badge updated');
                    closeModal();
                }
            });
        }

        if (dom.displayNameEl) {
            dom.displayNameEl.style.cursor = 'pointer';
            dom.displayNameEl.addEventListener('click', function() {
                currentEditField = 'displayName';
                openModal('Display Name', profileData.displayName);
            });
        }

        if (dom.emailEl) {
            dom.emailEl.style.cursor = 'pointer';
            dom.emailEl.addEventListener('click', function() {
                openEmailEditModal();
            });
        }

        if (dom.badgeEl) {
            dom.badgeEl.style.cursor = 'pointer';
            dom.badgeEl.addEventListener('click', function() {
                profileData.socialPublic = !profileData.socialPublic;
                renderBadge();
                showToast(profileData.socialPublic ? 'Social profile is now public' : 'Social profile is now private');
            });
        }

        if (dom.avatarEditBtn && dom.avatarInput) {
            dom.avatarEditBtn.addEventListener('click', function() {
                dom.avatarInput.click();
            });
        }

        if (dom.avatarInput) {
            dom.avatarInput.addEventListener('change', function(e) {
                var file = e.target.files[0];
                if (file) {
                    var reader = new FileReader();
                    reader.onload = function(evt) {
                        if (dom.profileAvatarImg) dom.profileAvatarImg.src = evt.target.result;
                        profileData.avatar = evt.target.result;
                        showToast('Avatar updated');
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        if (dom.backLink) {
            dom.backLink.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = 'index.html';
            });
        }

        var yoMenu = setupYoMenu(dom);
        var freshEditor = setupFreshEditor(dom, yoMenu.closeYoMenu);
        var actionEditor = setupActionEditor(dom, yoMenu.closeYoMenu);

        if (dom.yoMenuFresh) {
            dom.yoMenuFresh.addEventListener('click', function() {
                yoMenu.closeYoMenu();
                setTimeout(function() { freshEditor.openFreshEditor(); }, 200);
            });
        }

        if (dom.yoMenuAction) {
            dom.yoMenuAction.addEventListener('click', function() {
                yoMenu.closeYoMenu();
                setTimeout(function() { actionEditor.openActionEditor(); }, 200);
            });
        }

        if (dom.cardHi) {
            dom.cardHi.addEventListener('click', function() {
                window.location.href = 'index.html#/fresh';
            });
        }

        var socialContainer = document.querySelector('.profile-social-icons');
        if (socialContainer) {
            cachedDom.socialContainer = socialContainer;
            socialContainer.addEventListener('click', function(e) {
                var link = e.target.closest('.social-icon-link');
                if (!link) return;
                
                var platform = '';
                if (link.classList.contains('facebook')) platform = 'facebook';
                else if (link.classList.contains('instagram')) platform = 'instagram';
                else if (link.classList.contains('x')) platform = 'x';
                else if (link.classList.contains('wechat')) platform = 'wechat';
                if (!platform) return;

                handleSocialClick(e, platform);
            });
        }

        if (dom.profileLogoutBtn) {
            dom.profileLogoutBtn.addEventListener('click', function() {
                if (dom.profileLogoutModal) dom.profileLogoutModal.classList.add('open');
            });
        }

        if (dom.profileLogoutModalOverlay) {
            dom.profileLogoutModalOverlay.addEventListener('click', function() {
                if (dom.profileLogoutModal) dom.profileLogoutModal.classList.remove('open');
            });
        }

        if (dom.profileLogoutCancel) {
            dom.profileLogoutCancel.addEventListener('click', function() {
                if (dom.profileLogoutModal) dom.profileLogoutModal.classList.remove('open');
            });
        }

        if (dom.profileLogoutYes) {
            dom.profileLogoutYes.addEventListener('click', function() {
                Utils.logout();
                window.location.hash = '#/';
                window.location.reload();
            });
        }

        renderSocialIcons();
        renderBadge();
    }

    function buildPage() {
        return '<section id="page-profile" class="profile-page">' +
            '<a href="#/" class="back-link">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>' +
            '</a>' +
            '<div class="profile-main">' +
            '<div class="profile-left">' +
            '<div class="profile-avatar-wrap">' +
            '<div class="profile-avatar">' +
            '<img src="' + profileData.avatar + '" alt="Avatar" id="profileAvatarImg">' +
            '<div class="profile-avatar-edit" id="profileAvatarEditBtn">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
            '</div>' +
            '<input type="file" id="profileAvatarInput" accept="image/*">' +
            '</div>' +
            '</div>' +
            '<h1 class="profile-name" id="profileDisplayName">' + profileData.displayName + '</h1>' +
            '<p class="profile-email" id="profileEmail">' + profileData.email + '</p>' +
            '<div class="profile-social-icons">' +
            '<a href="#" class="social-icon-link facebook" aria-label="Facebook">' +
            '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>' +
            '</a>' +
            '<a href="#" class="social-icon-link instagram" aria-label="Instagram">' +
            '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>' +
            '</a>' +
            '<a href="#" class="social-icon-link x" aria-label="X">' +
            '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' +
            '</a>' +
            '<a href="#" class="social-icon-link wechat" aria-label="WeChat">' +
            '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/></svg>' +
            '</a>' +
            '</div>' +
            '<div class="profile-badge" id="profileBadge">' + profileData.badge + '</div>' +
            '<button class="profile-logout-btn" id="profileLogoutBtn">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' +
            '<span>Log out</span>' +
            '</button>' +
            '</div>' +
            '<div class="profile-right">' +
            '<div class="profile-card card-yo" id="cardYo">' +
            '<div class="card-content">' +
            '<div class="card-main-text">Yo</div>' +
            '<div class="card-icon-col">' +
            '<svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>' +
            '<div class="card-label">POST</div>' +
            '</div>' +
            '</div>' +
            '<div class="card-sub">' +
            '<span class="card-sub-left">What\'s Up</span>' +
            '<span class="card-sub-right">Idea or Lifestyle</span>' +
            '</div>' +
            '<div class="card-progress">' +
            '<div class="card-progress-bar"></div>' +
            '</div>' +
            '</div>' +
            '<div class="profile-card card-hi" id="cardHi">' +
            '<div class="card-content">' +
            '<div class="card-icon-col">' +
            '<svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>' +
            '<div class="card-label">Hang</div>' +
            '</div>' +
            '<div class="card-main-text">Hi</div>' +
            '</div>' +
            '<div class="card-sub">' +
            '<span class="card-sub-left">what\'s going up</span>' +
            '<span class="card-sub-right">Hang around</span>' +
            '</div>' +
            '<div class="card-progress">' +
            '<div class="card-progress-bar"></div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="yo-menu-modal" id="yoMenuModal">' +
            '<div class="yo-menu-overlay" id="yoMenuOverlay"></div>' +
            '<div class="yo-menu-content">' +
            '<button class="yo-menu-item" id="yoMenuFresh">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>' +
            '<span>Fresh Article</span>' +
            '</button>' +
            '<button class="yo-menu-item" id="yoMenuAction">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' +
            '<span>Action Update</span>' +
            '</button>' +
            '</div>' +
            '</div>' +
            '<div class="fresh-editor-modal" id="freshEditorModal">' +
            '<div class="fresh-editor-overlay" id="freshEditorOverlay"></div>' +
            '<div class="fresh-editor-content">' +
            '<div class="fresh-editor-header">' +
            '<span class="fresh-editor-title">Fresh Article</span>' +
            '<button class="fresh-editor-close" id="freshEditorClose">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>' +
            '</div>' +
            '<div class="fresh-editor-body">' +
            '<input type="text" class="fresh-editor-title-input" id="freshEditorTitleInput" placeholder="Enter article title...">' +
            '<div class="fresh-editor-toolbar">' +
            '<button class="fresh-editor-tool" data-cmd="bold" title="Bold">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>' +
            '</button>' +
            '<button class="fresh-editor-tool" data-cmd="italic" title="Italic">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>' +
            '</button>' +
            '<button class="fresh-editor-tool" data-cmd="insertUnorderedList" title="Bullet List">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>' +
            '</button>' +
            '<button class="fresh-editor-tool" data-cmd="insertOrderedList" title="Numbered List">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>' +
            '</button>' +
            '<button class="fresh-editor-tool" data-cmd="formatBlock" data-val="H2" title="Heading">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M17 12h3"/><path d="M17 18V6"/></svg>' +
            '</button>' +
            '<button class="fresh-editor-tool" id="freshEditorImageBtn" title="Insert Image">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
            '</button>' +
            '</div>' +
            '<div class="fresh-editor-textarea" id="freshEditorBody" contenteditable="true" placeholder="Start writing your article..."></div>' +
            '<div class="fresh-editor-image-area" id="freshEditorImageArea"></div>' +
            '<input type="file" id="freshEditorImageInput" accept="image/*" multiple style="display:none">' +
            '</div>' +
            '<div class="fresh-editor-actions">' +
            '<button class="fresh-editor-btn draft" id="freshEditorDraft">Save Draft</button>' +
            '<button class="fresh-editor-btn publish" id="freshEditorPublish">Publish Now</button>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="action-editor-modal" id="actionEditorModal">' +
            '<div class="action-editor-overlay" id="actionEditorOverlay"></div>' +
            '<div class="action-editor-content">' +
            '<div class="action-editor-header">' +
            '<span class="action-editor-title">Action Update</span>' +
            '<button class="action-editor-close" id="actionEditorClose">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>' +
            '</div>' +
            '<div class="action-editor-body">' +
            '<div class="action-editor-user-row">' +
            '<img class="action-editor-avatar" id="actionEditorAvatar" src="' + profileData.avatar + '" alt="Avatar">' +
            '<span class="action-editor-username" id="actionEditorUsername">' + profileData.displayName + '</span>' +
            '</div>' +
            '<textarea class="action-editor-textarea" id="actionEditorTextarea" placeholder="What\'s on your mind?"></textarea>' +
            '<div class="action-editor-image-grid" id="actionEditorImageGrid"></div>' +
            '<div class="action-editor-tools">' +
            '<button class="action-editor-tool" id="actionEditorImageBtn" title="Add Photo">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
            '<span>Photo</span>' +
            '</button>' +
            '<button class="action-editor-tool" id="actionEditorEmojiBtn" title="Emoji">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>' +
            '<span>Feeling</span>' +
            '</button>' +
            '</div>' +
            '<input type="file" id="actionEditorImageInput" accept="image/*" multiple style="display:none">' +
            '</div>' +
            '<div class="action-editor-actions">' +
            '<button class="action-editor-btn draft" id="actionEditorDraft">Save Draft</button>' +
            '<button class="action-editor-btn publish" id="actionEditorPublish">Post Now</button>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="edit-modal" id="profileEditModal">' +
            '<div class="edit-modal-overlay" id="profileEditModalOverlay"></div>' +
            '<div class="edit-modal-content">' +
            '<div class="edit-modal-header" id="profileEditModalTitle">Edit</div>' +
            '<div id="profileEditModalBody">' +
            '<input type="text" class="edit-modal-input" id="profileEditModalInput" placeholder="Enter value...">' +
            '</div>' +
            '<div class="edit-modal-actions" id="profileEditModalActions">' +
            '<button class="edit-modal-btn cancel" id="profileEditModalCancel">Cancel</button>' +
            '<button class="edit-modal-btn save" id="profileEditModalSave">Save</button>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="edit-modal" id="profileLogoutModal">' +
            '<div class="edit-modal-overlay" id="profileLogoutModalOverlay"></div>' +
            '<div class="edit-modal-content">' +
            '<div class="edit-modal-header">Exit current account?</div>' +
            '<div class="edit-modal-actions">' +
            '<button class="edit-modal-btn cancel" id="profileLogoutCancel">Cancel</button>' +
            '<button class="edit-modal-btn save" id="profileLogoutYes" style="background:#ef4444;color:#fff;">Yes</button>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="toast" id="profileToast"></div>' +
            '</section>';
    }

    return {
        buildPage: buildPage,
        bindAll: bindAll,
        setData: function(data) {
            if (data.displayName !== undefined) profileData.displayName = data.displayName;
            if (data.email !== undefined) profileData.email = data.email;
            if (data.avatar !== undefined) profileData.avatar = data.avatar;
            if (data.badge !== undefined) profileData.badge = data.badge;
            if (data.socialPublic !== undefined) profileData.socialPublic = data.socialPublic;
            if (data.socials) profileData.socials = data.socials;
        }
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    if (typeof ProfilePage !== 'undefined' && ProfilePage.bindAll) {
        ProfilePage.bindAll();
    }
});
