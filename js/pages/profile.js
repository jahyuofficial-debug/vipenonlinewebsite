var ProfilePage = (function() {
    'use strict';

    (function loadSiteSettings() {
        fetch('data/manager/settings.json').then(function(r) { return r.json(); }).then(function(s) {
            if (s.siteName) {
                document.title = 'Profile - ' + s.siteName;
                var metaOgTitle = document.querySelector('meta[property="og:title"]');
                if (metaOgTitle) metaOgTitle.setAttribute('content', 'Profile - ' + s.siteName);
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

    var profileData = {
        displayName: '',
        email: '',
        avatar: '',
        badge: '',
        socialPublic: false,
        socials: {
            facebook: { username: null },
            instagram: { username: null },
            x: { username: null }
        }
    };

    var socialPlatforms = {
        facebook: { name: 'Facebook', color: '#1877f2', baseUrl: 'https://www.facebook.com/' },
        instagram: { name: 'Instagram', color: '#e4405f', baseUrl: 'https://www.instagram.com/' },
        x: { name: 'X', color: '#fff', baseUrl: 'https://x.com/' }
    };

    var socialSvgPaths = {
        facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
        instagram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
        x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>'
    };

    var currentEditField = null;
    var pendingEmail = null;
    var isBound = false;
    var cachedDom = {};
    var currentPreviewDraft = null;
    var currentConfirmCallback = null;
    var editingActionId = null;

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

    function buildSocialIconsHTML() {
        var platforms = ['facebook', 'instagram', 'x'];
        var html = '';
        for (var i = 0; i < platforms.length; i++) {
            var p = platforms[i];
            var cfg = socialPlatforms[p];
            var data = profileData.socials[p];
            var bound = data && data.username;
            var linkClass = 'social-icon-link ' + p + (bound ? '' : ' unbound');
            var href = bound ? cfg.baseUrl + data.username + '/' : '#';
            var target = bound ? ' target="_blank" rel="noopener noreferrer"' : '';
            html += '<div class="social-icon-wrap">' +
                '<a href="' + href + '" class="' + linkClass + '" aria-label="' + cfg.name + '" data-platform="' + p + '"' + target + '>' +
                socialSvgPaths[p] +
                '</a>';
            if (bound) {
                html += '<button class="social-icon-edit" data-platform="' + p + '" aria-label="Edit ' + cfg.name + '">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
                    '</button>';
            }
            html += '</div>';
        }
        return html;
    }

    function renderSocialIcons() {
        var container = cachedDom.socialContainer;
        if (!container) {
            container = document.querySelector('.profile-social-icons');
            if (!container) return;
        }
        container.innerHTML = buildSocialIconsHTML();
        cachedDom.socialContainer = container;
    }

    function renderBadge() {
        var badge = document.getElementById('profileBadge');
        if (!badge) return;
        badge.textContent = profileData.badge || (profileData.socialPublic ? 'Public' : 'Private');
        badge.classList.toggle('public', profileData.socialPublic);
        badge.classList.toggle('private', !profileData.socialPublic);
    }

    function showBindConfirm(platform) {
        var cfg = socialPlatforms[platform];
        if (!cfg) return;

        var bodyHTML =
            '<div class="social-edit-wrap">' +
            '<p class="social-edit-hint">Link your ' + cfg.name + ' profile?</p>' +
            '<div class="edit-modal-actions">' +
            '<button class="edit-modal-btn cancel bind-later-btn">Later</button>' +
            '<button class="edit-modal-btn save bind-yes-btn" style="background:#22c55e;color:#000;">Yes</button>' +
            '</div>' +
            '</div>';

        openModal('Link ' + cfg.name, '', bodyHTML);

        if (cachedDom.profileEditModalBody) {
            var laterBtn = cachedDom.profileEditModalBody.querySelector('.bind-later-btn');
            var yesBtn = cachedDom.profileEditModalBody.querySelector('.bind-yes-btn');
            if (laterBtn) laterBtn.addEventListener('click', closeModal);
            if (yesBtn) yesBtn.addEventListener('click', function() {
                closeModal();
                setTimeout(function() { openSocialEditModal(platform); }, 300);
            });
        }
    }

    function openSocialEditModal(platform) {
        var cfg = socialPlatforms[platform];
        if (!cfg) return;

        var data = profileData.socials[platform];
        var current = data ? data.username || '' : '';

        var bodyHTML =
            '<div class="social-edit-wrap">' +
            '<p class="social-edit-hint">Enter your ' + cfg.name + ' username (not full URL)</p>' +
            '<div class="social-edit-input-row">' +
            '<span class="social-edit-prefix">' + cfg.baseUrl + '</span>' +
            '<input type="text" class="edit-modal-input social-username-input" id="socialUsernameInput" placeholder="username" value="' + current + '">' +
            '</div>' +
            '</div>';

        openModal(cfg.name + ' Username', '', bodyHTML);

        var modalActions = document.getElementById('profileEditModalActions');
        if (modalActions) modalActions.style.display = '';

        var saveBtn = document.getElementById('profileEditModalSave');
        if (saveBtn) {
            var newSave = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newSave, saveBtn);
            newSave.addEventListener('click', function() {
                var input = document.getElementById('socialUsernameInput');
                var username = input ? input.value.trim() : '';
                if (!username) {
                    showToast('Please enter a username', true);
                    return;
                }
                profileData.socials[platform] = { username: username };
                renderSocialIcons();
                showToast(cfg.name + ' username saved');
                saveProfileData();
                closeModal();
            });
        }
    }

    function saveProfileData() {
        var auth = Utils.getAuth();
        if (!auth) return;
        var existing = Utils.getUserData('user') || {};
        var userData = {
            userId: existing.userId || auth.username || auth.email,
            username: existing.username || auth.username,
            email: existing.email || auth.email,
            role: existing.role || auth.role || '',
            profile: {}
        };
        userData.profile = {
            displayName: profileData.displayName,
            email: profileData.email,
            avatar: profileData.avatar,
            badge: profileData.badge,
            socialPublic: profileData.socialPublic,
            socials: profileData.socials
        };
        Utils.setUserData('user', userData);
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
                        saveProfileData();
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
            var drafts = Utils.getUserData('drafts') || [];
            drafts.push({
                type: 'fresh',
                title: title,
                content: body,
                images: freshImages,
                createdAt: new Date().toISOString()
            });
            Utils.setUserData('drafts', drafts);
            showToast('Saved to drafts');
            closeFreshEditor();
            renderArticleDrafts();
        }

        function publishFresh() {
            var title = freshEditorTitleInput ? freshEditorTitleInput.value.trim() : '';
            var body = freshEditorBody ? freshEditorBody.innerHTML.trim() : '';
            if (!title && !body) {
                showToast('Please enter content', true);
                return;
            }
            var posts = Utils.getUserData('posts') || [];
            posts.unshift({
                type: 'fresh',
                title: title,
                content: body,
                images: freshImages,
                publishedAt: new Date().toISOString(),
                author: profileData.displayName,
                avatar: profileData.avatar
            });
            Utils.setUserData('posts', posts);
            showToast('Fresh article published');
            closeFreshEditor();
            renderArticlePublished();
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
            editingActionId = null;
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

        function openActionEditorForEdit(actionItem) {
            editingActionId = actionItem.id;
            if (actionEditorModal) {
                actionEditorModal.classList.add('open');
                if (actionEditorTextarea) {
                    actionEditorTextarea.value = actionItem.content || '';
                    setTimeout(function() { actionEditorTextarea.focus(); }, 100);
                }
                actionImages = actionItem.images || [];
                if (actionEditorImageGrid) {
                    actionEditorImageGrid.innerHTML = '';
                    actionImages.forEach(function(src) {
                        appendActionImageItem(src);
                    });
                    var count = actionImages.length;
                    actionEditorImageGrid.className = 'action-editor-image-grid' +
                        (count === 1 ? ' single' : count === 2 ? ' double' : '');
                }
                if (actionEditorAvatar) actionEditorAvatar.src = profileData.avatar;
                if (actionEditorUsername) actionEditorUsername.textContent = profileData.displayName;
            }
        }

        function closeActionEditor() {
            if (actionEditorModal) actionEditorModal.classList.remove('open');
            editingActionId = null;
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
            var drafts = Utils.getUserData('actionDrafts') || [];
            drafts.push({
                type: 'action',
                content: text,
                images: actionImages,
                createdAt: new Date().toISOString()
            });
            Utils.setUserData('actionDrafts', drafts);
            showToast('Saved to drafts');
            closeActionEditor();
            renderActionDrafts();
        }

        function publishAction() {
            var text = actionEditorTextarea ? actionEditorTextarea.value.trim() : '';
            if (!text) {
                showToast('Please enter content', true);
                return;
            }
            if (editingActionId) {
                var posts = Utils.getUserData('actions') || [];
                var idx = posts.findIndex(function(p) { return p.id === editingActionId; });
                if (idx > -1) {
                    posts[idx].content = text;
                    posts[idx].images = actionImages;
                    posts[idx].editedAt = new Date().toISOString();
                    posts[idx].editCount = (posts[idx].editCount || 0) + 1;
                    Utils.setUserData('actions', posts);
                    showToast('Action updated');
                }
                closeActionEditor();
                renderActionPublished();
                return;
            }
            var posts = Utils.getUserData('actions') || [];
            posts.unshift({
                id: Date.now(),
                type: 'action',
                content: text,
                images: actionImages,
                publishedAt: new Date().toISOString(),
                author: profileData.displayName,
                avatar: profileData.avatar,
                hidden: false,
                editCount: 0
            });
            Utils.setUserData('actions', posts);
            showToast('Action update posted');
            closeActionEditor();
            renderActionPublished();
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

        return { openActionEditor: openActionEditor, closeActionEditor: closeActionEditor, openActionEditorForEdit: openActionEditorForEdit };
    }

    function setupTabs() {
        var tabs = document.querySelectorAll('.content-tab');
        var panels = document.querySelectorAll('.content-panel');

        tabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                var target = tab.getAttribute('data-tab');
                tabs.forEach(function(t) { t.classList.remove('active'); });
                panels.forEach(function(p) { p.classList.remove('active'); });
                tab.classList.add('active');
                var panel = document.getElementById('tab' + target.charAt(0).toUpperCase() + target.slice(1));
                if (panel) panel.classList.add('active');
            });
        });
    }

    function setupArticleSubtabs() {
        var subtabs = document.querySelectorAll('#tabArticle .content-subtab');
        var publishedList = document.getElementById('articlePublishedList');
        var draftList = document.getElementById('articleDraftList');

        subtabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                var target = tab.getAttribute('data-subtab');
                subtabs.forEach(function(t) { t.classList.remove('active'); });
                tab.classList.add('active');
                if (target === 'published') {
                    if (publishedList) publishedList.classList.remove('hidden');
                    if (draftList) draftList.classList.add('hidden');
                } else {
                    if (publishedList) publishedList.classList.add('hidden');
                    if (draftList) draftList.classList.remove('hidden');
                }
            });
        });
    }

    function setupLikeSubtabs() {
        var subtabs = document.querySelectorAll('#tabLike .content-subtab');
        var articleList = document.getElementById('likeArticleList');
        var discList = document.getElementById('likeDiscList');

        subtabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                var target = tab.getAttribute('data-likesub');
                subtabs.forEach(function(t) { t.classList.remove('active'); });
                tab.classList.add('active');
                if (target === 'article') {
                    if (articleList) articleList.classList.remove('hidden');
                    if (discList) discList.classList.add('hidden');
                } else {
                    if (articleList) articleList.classList.add('hidden');
                    if (discList) discList.classList.remove('hidden');
                }
            });
        });
    }

    function setupActionSubtabs() {
        var subtabs = document.querySelectorAll('#tabAction .content-subtab');
        var publishedList = document.getElementById('actionPublishedList');
        var draftList = document.getElementById('actionDraftList');

        subtabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                var target = tab.getAttribute('data-actionsub');
                subtabs.forEach(function(t) { t.classList.remove('active'); });
                tab.classList.add('active');
                if (target === 'published') {
                    if (publishedList) publishedList.classList.remove('hidden');
                    if (draftList) draftList.classList.add('hidden');
                } else {
                    if (publishedList) publishedList.classList.add('hidden');
                    if (draftList) draftList.classList.remove('hidden');
                }
            });
        });
    }

    function renderArticlePublished() {
        var container = document.getElementById('articlePublishedList');
        if (!container) return;
        var posts = Utils.getUserData('posts') || [];
        var articles = posts.filter(function(p) { return p.type === 'fresh'; });
        if (articles.length === 0) {
            container.innerHTML = '<div class="empty-state">No published articles yet</div>';
            return;
        }
        container.innerHTML = articles.map(function(item, idx) {
            return '<div class="article-item" data-idx="' + idx + '">' +
                '<div class="article-item-title">' + (item.title || 'Untitled') + '</div>' +
                '<div class="article-item-meta">' + Utils.getRelativeTime(item.publishedAt) + '</div>' +
                '<div class="article-item-actions">' +
                '<button class="article-item-btn preview" data-idx="' + idx + '">Preview</button>' +
                '<button class="article-item-btn send" data-idx="' + idx + '">Send Email</button>' +
                '</div>' +
                '</div>';
        }).join('');

        container.querySelectorAll('.article-item-btn.preview').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var idx = parseInt(btn.getAttribute('data-idx'), 10);
                openPreview(articles[idx]);
            });
        });

        container.querySelectorAll('.article-item-btn.send').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var idx = parseInt(btn.getAttribute('data-idx'), 10);
                openPreview(articles[idx], true);
            });
        });
    }

    function renderArticleDrafts() {
        var container = document.getElementById('articleDraftList');
        if (!container) return;
        var drafts = Utils.getUserData('drafts') || [];
        var articleDrafts = drafts.filter(function(d) { return d.type === 'fresh'; });
        if (articleDrafts.length === 0) {
            container.innerHTML = '<div class="empty-state">No drafts yet</div>';
            return;
        }
        container.innerHTML = articleDrafts.map(function(item, idx) {
            return '<div class="article-item draft" data-idx="' + idx + '">' +
                '<div class="article-item-title">' + (item.title || 'Untitled Draft') + '</div>' +
                '<div class="article-item-meta">Saved ' + Utils.getRelativeTime(item.createdAt) + '</div>' +
                '<div class="article-item-actions">' +
                '<button class="article-item-btn preview" data-idx="' + idx + '">Preview</button>' +
                '<button class="article-item-btn edit" data-idx="' + idx + '">Edit</button>' +
                '<button class="article-item-btn delete" data-idx="' + idx + '">Delete</button>' +
                '</div>' +
                '</div>';
        }).join('');

        container.querySelectorAll('.article-item').forEach(function(item) {
            item.addEventListener('click', function() {
                var idx = parseInt(item.getAttribute('data-idx'), 10);
                openDraftEditor(articleDrafts[idx], idx);
            });
        });

        container.querySelectorAll('.article-item-btn.preview').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var idx = parseInt(btn.getAttribute('data-idx'), 10);
                openPreview(articleDrafts[idx]);
            });
        });

        container.querySelectorAll('.article-item-btn.delete').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var idx = parseInt(btn.getAttribute('data-idx'), 10);
                showConfirm('Delete this draft?', function() {
                    var allDrafts = Utils.getUserData('drafts') || [];
                    var freshDrafts = allDrafts.filter(function(d) { return d.type === 'fresh'; });
                    var target = freshDrafts[idx];
                    var realIdx = allDrafts.indexOf(target);
                    if (realIdx > -1) allDrafts.splice(realIdx, 1);
                    Utils.setUserData('drafts', allDrafts);
                    renderArticleDrafts();
                    showToast('Draft deleted');
                });
            });
        });
    }

    function openDraftEditor(draft, draftIdx) {
        var modal = document.getElementById('freshEditorModal');
        var titleInput = document.getElementById('freshEditorTitleInput');
        var body = document.getElementById('freshEditorBody');
        var imageArea = document.getElementById('freshEditorImageArea');
        if (!modal) return;

        modal.classList.add('open');
        if (titleInput) titleInput.value = draft.title || '';
        if (body) body.innerHTML = draft.content || '';
        if (imageArea) imageArea.innerHTML = '';

        var freshImages = draft.images || [];
        freshImages.forEach(function(src, i) {
            var item = document.createElement('div');
            item.className = 'fresh-editor-image-item';
            item.dataset.idx = i;
            var img = document.createElement('img');
            img.src = src;
            var removeBtn = document.createElement('button');
            removeBtn.className = 'fresh-editor-image-remove';
            removeBtn.innerHTML = '&times;';
            removeBtn.addEventListener('click', function() {
                freshImages.splice(i, 1);
                item.remove();
            });
            item.appendChild(img);
            item.appendChild(removeBtn);
            imageArea.appendChild(item);
        });

        var publishBtn = document.getElementById('freshEditorPublish');
        if (publishBtn) {
            var newPublish = publishBtn.cloneNode(true);
            publishBtn.parentNode.replaceChild(newPublish, publishBtn);
            newPublish.addEventListener('click', function() {
                var title = titleInput ? titleInput.value.trim() : '';
                var content = body ? body.innerHTML.trim() : '';
                if (!title && !content) {
                    showToast('Please enter content', true);
                    return;
                }
                var posts = Utils.getUserData('posts') || [];
                posts.unshift({
                    type: 'fresh',
                    title: title,
                    content: content,
                    images: freshImages,
                    publishedAt: new Date().toISOString(),
                    author: profileData.displayName,
                    avatar: profileData.avatar
                });
                Utils.setUserData('posts', posts);

                var allDrafts = Utils.getUserData('drafts') || [];
                var freshDrafts = allDrafts.filter(function(d) { return d.type === 'fresh'; });
                var target = freshDrafts[draftIdx];
                var realIdx = allDrafts.indexOf(target);
                if (realIdx > -1) allDrafts.splice(realIdx, 1);
                Utils.setUserData('drafts', allDrafts);

                showToast('Article published');
                modal.classList.remove('open');
                renderArticlePublished();
                renderArticleDrafts();
            });
        }
    }

    function openPreview(item, autoFocusEmail) {
        currentPreviewDraft = item;
        var modal = document.getElementById('previewModal');
        var body = document.getElementById('previewBody');
        var emailInput = document.getElementById('previewEmailInput');
        if (!modal || !body) return;

        body.innerHTML = '<div class="preview-article-title">' + (item.title || 'Untitled') + '</div>' +
            '<div class="preview-article-body">' + (item.content || '') + '</div>';
        if (item.images && item.images.length) {
            var imgWrap = document.createElement('div');
            imgWrap.className = 'preview-article-images';
            item.images.forEach(function(src) {
                var img = document.createElement('img');
                img.src = src;
                imgWrap.appendChild(img);
            });
            body.appendChild(imgWrap);
        }

        modal.classList.add('open');
        if (autoFocusEmail && emailInput) {
            setTimeout(function() { emailInput.focus(); }, 100);
        }
    }

    function closePreview() {
        var modal = document.getElementById('previewModal');
        if (modal) modal.classList.remove('open');
        currentPreviewDraft = null;
    }

    function sendPreviewEmail() {
        var emailInput = document.getElementById('previewEmailInput');
        var email = emailInput ? emailInput.value.trim() : '';
        if (!email) {
            showToast('Please enter an email', true);
            return;
        }
        showToast('Preview sent to ' + email);
        if (emailInput) emailInput.value = '';
        closePreview();
    }

    function showConfirm(message, onConfirm) {
        currentConfirmCallback = onConfirm;
        var modal = document.getElementById('confirmModal');
        var body = document.getElementById('confirmBody');
        if (!modal || !body) return;
        body.textContent = message;
        modal.classList.add('open');
    }

    function closeConfirm() {
        var modal = document.getElementById('confirmModal');
        if (modal) modal.classList.remove('open');
        currentConfirmCallback = null;
    }

    function renderLikeArticles() {
        var container = document.getElementById('likeArticleList');
        if (!container) return;
        var likes = Utils.getUserData('likes') || {};
        var likedArticles = likes.likedArticles || [];
        if (likedArticles.length === 0) {
            container.innerHTML = '<div class="empty-state">No liked articles yet</div>';
            return;
        }
        container.innerHTML = likedArticles.map(function(item) {
            return '<div class="like-item">' +
                '<div class="like-item-title">' + (item.title || 'Untitled') + '</div>' +
                '<div class="like-item-meta">by ' + (item.author || 'Unknown') + ' · ' + (item.date || '') + '</div>' +
                '</div>';
        }).join('');
    }

    function renderLikeDisc() {
        var container = document.getElementById('likeDiscList');
        if (!container) return;
        var likes = Utils.getUserData('likes') || {};
        var likedDisc = likes.likedDisc || [];
        if (likedDisc.length === 0) {
            container.innerHTML = '<div class="empty-state">No liked disc yet</div>';
            return;
        }
        container.innerHTML = likedDisc.map(function(item) {
            return '<div class="like-item disc">' +
                '<div class="like-item-title">' + (item.title || 'Untitled') + '</div>' +
                '<div class="like-item-meta">' + (item.artist || 'Unknown') + '</div>' +
                '</div>';
        }).join('');
    }

    function renderActionPublished() {
        var container = document.getElementById('actionPublishedList');
        if (!container) return;
        var posts = Utils.getUserData('actions') || [];
        var visible = posts.filter(function(p) { return !p.hidden; });
        if (visible.length === 0) {
            container.innerHTML = '<div class="empty-state">No published actions yet</div>';
            return;
        }
        container.innerHTML = visible.map(function(item) {
            return '<div class="action-item" data-id="' + item.id + '">' +
                '<div class="action-item-content">' + (item.content || '') + '</div>' +
                '<div class="action-item-meta">' + Utils.getRelativeTime(item.publishedAt) + '</div>' +
                '<div class="action-item-actions">' +
                '<button class="action-item-btn edit" data-id="' + item.id + '">Edit</button>' +
                '<button class="action-item-btn hide" data-id="' + item.id + '">Hide</button>' +
                '<button class="action-item-btn delete" data-id="' + item.id + '">Delete</button>' +
                '</div>' +
                '</div>';
        }).join('');

        container.querySelectorAll('.action-item-btn.edit').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var id = parseInt(btn.getAttribute('data-id'), 10);
                var posts = Utils.getUserData('actions') || [];
                var item = posts.find(function(p) { return p.id === id; });
                if (!item) return;
                if (item.editCount && item.editCount >= 1) {
                    showToast('This action can only be edited once', true);
                    return;
                }
                showConfirm('You can only edit a published action once. Continue?', function() {
                    var editor = setupActionEditor(cachedDom, null);
                    editor.openActionEditorForEdit(item);
                });
            });
        });

        container.querySelectorAll('.action-item-btn.hide').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var id = parseInt(btn.getAttribute('data-id'), 10);
                showConfirm('Hide this action?', function() {
                    var posts = Utils.getUserData('actions') || [];
                    var idx = posts.findIndex(function(p) { return p.id === id; });
                    if (idx > -1) {
                        posts[idx].hidden = true;
                        Utils.setUserData('actions', posts);
                        renderActionPublished();
                        showToast('Action hidden');
                    }
                });
            });
        });

        container.querySelectorAll('.action-item-btn.delete').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var id = parseInt(btn.getAttribute('data-id'), 10);
                showConfirm('Delete this action permanently?', function() {
                    var posts = Utils.getUserData('actions') || [];
                    var idx = posts.findIndex(function(p) { return p.id === id; });
                    if (idx > -1) {
                        posts.splice(idx, 1);
                        Utils.setUserData('actions', posts);
                        renderActionPublished();
                        showToast('Action deleted');
                    }
                });
            });
        });
    }

    function renderActionDrafts() {
        var container = document.getElementById('actionDraftList');
        if (!container) return;
        var drafts = Utils.getUserData('actionDrafts') || [];
        if (drafts.length === 0) {
            container.innerHTML = '<div class="empty-state">No action drafts yet</div>';
            return;
        }
        container.innerHTML = drafts.map(function(item, idx) {
            return '<div class="action-item draft" data-idx="' + idx + '">' +
                '<div class="action-item-content">' + (item.content || '') + '</div>' +
                '<div class="action-item-meta">Saved ' + Utils.getRelativeTime(item.createdAt) + '</div>' +
                '<div class="action-item-actions">' +
                '<button class="action-item-btn edit" data-idx="' + idx + '">Edit</button>' +
                '<button class="action-item-btn delete" data-idx="' + idx + '">Delete</button>' +
                '</div>' +
                '</div>';
        }).join('');

        container.querySelectorAll('.action-item-btn.edit').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var idx = parseInt(btn.getAttribute('data-idx'), 10);
                var editor = setupActionEditor(cachedDom, null);
                editor.openActionEditorForEdit(drafts[idx]);
            });
        });

        container.querySelectorAll('.action-item-btn.delete').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var idx = parseInt(btn.getAttribute('data-idx'), 10);
                showConfirm('Delete this draft?', function() {
                    var allDrafts = Utils.getUserData('actionDrafts') || [];
                    allDrafts.splice(idx, 1);
                    Utils.setUserData('actionDrafts', allDrafts);
                    renderActionDrafts();
                    showToast('Draft deleted');
                });
            });
        });
    }

    function bindAll() {
        if (isBound) return;
        isBound = true;

        var auth = Utils.getAuth();
        if (auth) {
            var savedUser = Utils.getUserData('user');
            if (savedUser && savedUser.profile) {
                profileData.displayName = savedUser.profile.displayName || profileData.displayName;
                profileData.email = savedUser.profile.email || profileData.email;
                profileData.avatar = savedUser.profile.avatar || profileData.avatar;
                profileData.badge = savedUser.profile.badge || profileData.badge;
                if (savedUser.profile.socialPublic !== undefined) profileData.socialPublic = savedUser.profile.socialPublic;
                if (savedUser.profile.socials) {
                    for (var sk in savedUser.profile.socials) {
                        if (savedUser.profile.socials.hasOwnProperty(sk)) {
                            profileData.socials[sk] = savedUser.profile.socials[sk];
                        }
                    }
                }
            }
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
                    saveProfileData();
                    showToast('Name updated');
                    closeModal();
                } else if (currentEditField === 'badge') {
                    profileData.badge = newValue;
                    if (dom.badgeEl) dom.badgeEl.textContent = newValue;
                    saveProfileData();
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
                saveProfileData();
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
                        saveProfileData();
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
                var editBtn = e.target.closest('.social-icon-edit');
                if (editBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    var platform = editBtn.getAttribute('data-platform');
                    if (platform) openSocialEditModal(platform);
                    return;
                }
                var link = e.target.closest('.social-icon-link');
                if (link && link.classList.contains('unbound')) {
                    e.preventDefault();
                    var platform = link.getAttribute('data-platform');
                    if (platform) showBindConfirm(platform);
                }
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

        var previewClose = document.getElementById('previewClose');
        var previewOverlay = document.getElementById('previewOverlay');
        var previewSendBtn = document.getElementById('previewSendBtn');
        if (previewClose) previewClose.addEventListener('click', closePreview);
        if (previewOverlay) previewOverlay.addEventListener('click', closePreview);
        if (previewSendBtn) previewSendBtn.addEventListener('click', sendPreviewEmail);

        var confirmCancel = document.getElementById('confirmCancel');
        var confirmYes = document.getElementById('confirmYes');
        var confirmOverlay = document.getElementById('confirmOverlay');
        if (confirmCancel) confirmCancel.addEventListener('click', closeConfirm);
        if (confirmOverlay) confirmOverlay.addEventListener('click', closeConfirm);
        if (confirmYes) {
            confirmYes.addEventListener('click', function() {
                if (currentConfirmCallback) currentConfirmCallback();
                closeConfirm();
            });
        }

        setupTabs();
        setupArticleSubtabs();
        setupLikeSubtabs();
        setupActionSubtabs();
        renderArticlePublished();
        renderArticleDrafts();
        renderLikeArticles();
        renderLikeDisc();
        renderActionPublished();
        renderActionDrafts();
        renderSocialIcons();
        renderBadge();
    }

    function buildPage() {
        isBound = false;
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
            '<div class="profile-social-icons">' + buildSocialIconsHTML() + '</div>' +
            '<div class="profile-badge" id="profileBadge">' + profileData.badge + '</div>' +
            '<button class="profile-logout-btn" id="profileLogoutBtn">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' +
            '<span>Log out</span>' +
            '</button>' +
            '</div>' +
            '<div class="profile-right">' +
            '<div class="profile-quick-actions">' +
            '<div class="quick-action-card card-yo" id="cardYo">' +
            '<div class="quick-action-icon">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>' +
            '</div>' +
            '<div class="quick-action-info">' +
            '<div class="quick-action-title">Yo</div>' +
            '<div class="quick-action-desc">Post Idea</div>' +
            '</div>' +
            '<div class="quick-action-arrow">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>' +
            '</div>' +
            '</div>' +
            '<div class="quick-action-card card-hi" id="cardHi">' +
            '<div class="quick-action-icon">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>' +
            '</div>' +
            '<div class="quick-action-info">' +
            '<div class="quick-action-title">Hi</div>' +
            '<div class="quick-action-desc">Hang Out</div>' +
            '</div>' +
            '<div class="quick-action-arrow">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="profile-content-area">' +
            '<div class="content-tabs" id="profileTabs">' +
            '<button class="content-tab active" data-tab="article">Article</button>' +
            '<button class="content-tab" data-tab="like">Like</button>' +
            '<button class="content-tab" data-tab="action">Action</button>' +
            '</div>' +
            '<div class="content-panel active" id="tabArticle">' +
            '<div class="content-subtabs">' +
            '<button class="content-subtab active" data-subtab="published">Published</button>' +
            '<button class="content-subtab" data-subtab="draft">Drafts</button>' +
            '</div>' +
            '<div class="content-list" id="articlePublishedList"></div>' +
            '<div class="content-list hidden" id="articleDraftList"></div>' +
            '</div>' +
            '<div class="content-panel" id="tabLike">' +
            '<div class="content-subtabs">' +
            '<button class="content-subtab active" data-likesub="article">Articles</button>' +
            '<button class="content-subtab" data-likesub="disc">Disc</button>' +
            '</div>' +
            '<div class="content-list" id="likeArticleList"></div>' +
            '<div class="content-list hidden" id="likeDiscList"></div>' +
            '</div>' +
            '<div class="content-panel" id="tabAction">' +
            '<div class="content-subtabs">' +
            '<button class="content-subtab active" data-actionsub="published">Published</button>' +
            '<button class="content-subtab" data-actionsub="draft">Drafts</button>' +
            '</div>' +
            '<div class="content-list" id="actionPublishedList"></div>' +
            '<div class="content-list hidden" id="actionDraftList"></div>' +
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
            '<div class="preview-modal" id="previewModal">' +
            '<div class="preview-overlay" id="previewOverlay"></div>' +
            '<div class="preview-content">' +
            '<div class="preview-header">' +
            '<span class="preview-title">Preview</span>' +
            '<button class="preview-close" id="previewClose">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>' +
            '</div>' +
            '<div class="preview-body" id="previewBody"></div>' +
            '<div class="preview-actions">' +
            '<input type="email" class="preview-email-input" id="previewEmailInput" placeholder="Enter email to send...">' +
            '<button class="preview-send-btn" id="previewSendBtn">Send to Email</button>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="confirm-modal" id="confirmModal">' +
            '<div class="confirm-overlay" id="confirmOverlay"></div>' +
            '<div class="confirm-content">' +
            '<div class="confirm-header" id="confirmHeader">Reminder</div>' +
            '<div class="confirm-body" id="confirmBody"></div>' +
            '<div class="confirm-actions">' +
            '<button class="confirm-btn cancel" id="confirmCancel">Cancel</button>' +
            '<button class="confirm-btn confirm" id="confirmYes">Confirm</button>' +
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
            if (data.socials) {
                for (var key in data.socials) {
                    if (data.socials.hasOwnProperty(key)) {
                        profileData.socials[key] = data.socials[key];
                    }
                }
            }
        }
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    if (typeof ProfilePage !== 'undefined' && ProfilePage.bindAll) {
        fetch('data/profile.json')
            .then(function(r) { return r.json(); })
            .then(function(d) {
                ProfilePage.setData(d);
                ProfilePage.bindAll();
            })
            .catch(function() {
                ProfilePage.bindAll();
            });
    }
});
