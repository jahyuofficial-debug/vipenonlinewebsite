var NotificationCenter = (function() {
    'use strict';

    var notifications = [];
    var bellBtn = null;
    var popup = null;
    var overlay = null;
    var expandedCategory = null;
    var isInitialized = false;
    var chatDialog = null;
    var chatOverlay = null;
    var activeChatUser = null;
    var chatMessages = [];

    var emojiList = ['\u{1F600}','\u{1F60D}','\u{1F601}','\u{1F389}','\u{1F92F}','\u{1F44D}','\u{1F496}','\u{1F480}','\u{1F4AF}','\u{1F4A1}','\u{1F525}','\u{1F308}','\u{1F31F}','\u{1F3B6}','\u{1F60E}','\u{1F618}','\u{1F92A}','\u{1F44F}','\u{1F4A5}','\u{1F6A8}','\u{2615}','\u{1F37F}','\u{1F3C6}','\u{1F451}','\u{1F98B}','\u{1F31A}','\u{270C}','\u{1F64C}','\u{1F33A}','\u{1F30D}','\u{1F3A8}','\u{1F48E}','\u{1F514}','\u{1F380}','\u{1F31E}','\u{1F4F8}','\u{1F393}','\u{1F91D}','\u{1F680}','\u{1F49D}'];

    function getStorageKey() {
        var auth = Utils.getAuth();
        if (!auth) return 'vipen_notifications_guest';
        var userId = auth.username || auth.email;
        return 'vipen_notifications_' + userId;
    }

    function getChatStorageKey() {
        var auth = Utils.getAuth();
        if (!auth) return null;
        var userId = auth.username || auth.email;
        return 'vipen_chat_' + userId;
    }

    function loadFromStorage() {
        var key = getStorageKey();
        var raw = localStorage.getItem(key);
        if (raw) {
            try { notifications = JSON.parse(raw); } catch (e) { notifications = []; }
        } else {
            notifications = getMockData();
            saveToStorage();
        }
    }

    function saveToStorage() {
        var key = getStorageKey();
        localStorage.setItem(key, JSON.stringify(notifications));
    }

    function loadChatMessages(userName) {
        var chatKey = getChatStorageKey();
        if (!chatKey) return [];
        var allChats = {};
        var raw = localStorage.getItem(chatKey);
        if (raw) {
            try { allChats = JSON.parse(raw); } catch (e) { allChats = {}; }
        }
        return allChats[userName] || [];
    }

    function saveChatMessages(userName, msgs) {
        var chatKey = getChatStorageKey();
        if (!chatKey) return;
        var allChats = {};
        var raw = localStorage.getItem(chatKey);
        if (raw) {
            try { allChats = JSON.parse(raw); } catch (e) { allChats = {}; }
        }
        allChats[userName] = msgs;
        localStorage.setItem(chatKey, JSON.stringify(allChats));
    }

    function getMockData() {
        return [];
    }

    function formatTime(timestamp) {
        var now = new Date();
        var date = new Date(timestamp);
        var diffMs = now - date;
        var diffSec = Math.floor(diffMs / 1000);
        var diffMin = Math.floor(diffSec / 60);
        var diffHour = Math.floor(diffMin / 60);
        var diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) return 'Just now';
        if (diffMin < 60) return diffMin + 'm ago';
        if (diffHour < 24) return diffHour + 'h ago';
        if (diffDay < 7) return diffDay + 'd ago';

        var y = date.getFullYear();
        var m = String(date.getMonth() + 1).padStart(2, '0');
        var d = String(date.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
    }

    function getUnreadCount() {
        var count = 0;
        for (var i = 0; i < notifications.length; i++) {
            if (!notifications[i].read) count++;
        }
        return count;
    }

    function getUnreadByType(type) {
        var count = 0;
        for (var i = 0; i < notifications.length; i++) {
            if (notifications[i].type === type && !notifications[i].read) count++;
        }
        return count;
    }

    function getByType(type) {
        var result = [];
        for (var i = 0; i < notifications.length; i++) {
            if (notifications[i].type === type) result.push(notifications[i]);
        }
        result.sort(function(a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
        return result;
    }

    function markAllRead() {
        for (var i = 0; i < notifications.length; i++) {
            if (notifications[i].type === 'like' || notifications[i].type === 'comment') {
                notifications[i].read = true;
            }
        }
        saveToStorage();
        updateBadge();
        refreshPopupContent();
    }

    function markCategoryRead(type) {
        for (var i = 0; i < notifications.length; i++) {
            if (notifications[i].type === type) {
                notifications[i].read = true;
            }
        }
        saveToStorage();
        updateBadge();
        refreshPopupContent();
    }

    function markRead(id) {
        for (var i = 0; i < notifications.length; i++) {
            if (notifications[i].id === id) {
                notifications[i].read = true;
                break;
            }
        }
        saveToStorage();
        updateBadge();
    }

    function handleNotificationClick(notif) {
        markRead(notif.id);

        if (notif.type === 'message') {
            openChatDialog(notif.fromUser);
            return;
        }

        if (notif.targetType === 'fresh') {
            window.location.hash = '#/fresh/detail/' + notif.targetId;
        } else if (notif.targetType === 'action') {
            window.location.hash = '#/action';
        } else if (notif.targetType === 'design') {
            window.location.hash = '#/design-work/detail/' + notif.targetId;
        }
    }

    function buildBellHTML() {
        var unread = getUnreadCount();
        var badgeHTML = unread > 0 ? '<span class="notif-badge">' + (unread > 99 ? '99+' : unread) + '</span>' : '';
        return '<button id="notifBellBtn" class="notif-bell-btn">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' +
            badgeHTML +
            '</button>';
    }

    function buildActionBtn(type) {
        var unreadCount = getUnreadByType(type);
        var badgeHTML = unreadCount > 0 ? '<span class="notif-action-badge">' + unreadCount + '</span>' : '';
        var isActive = expandedCategory === type;
        var activeClass = isActive ? ' active' : '';
        var iconHTML = type === 'like'
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

        return '<button class="notif-action-btn' + activeClass + '" data-category="' + type + '">' +
            '<span class="notif-action-icon">' + iconHTML + '</span>' +
            badgeHTML +
            '</button>';
    }

    function buildExpandedSubList(type) {
        var items = getByType(type);
        var html = '';
        if (items.length === 0) {
            html += '<div class="notif-empty-sub">No notifications yet</div>';
        } else {
            for (var i = 0; i < items.length; i++) {
                html += buildSubItem(items[i]);
            }
        }
        return html;
    }

    function buildSubItem(notif) {
        var unreadClass = notif.read ? '' : ' unread';
        var timeText = formatTime(notif.timestamp);
        var contentText = notif.type === 'comment' ? notif.commentText : 'liked your post "' + notif.targetDesc + '"';

        return '<div class="notif-sub-item' + unreadClass + '" data-id="' + notif.id + '">' +
            '<div class="notif-sub-avatar">' +
            '<img src="' + notif.fromUser.avatar + '" alt="' + notif.fromUser.name + '">' +
            '</div>' +
            '<div class="notif-sub-body">' +
            '<div class="notif-sub-header">' +
            '<span class="notif-sub-name">' + notif.fromUser.name + '</span>' +
            '<span class="notif-sub-time">' + timeText + '</span>' +
            '</div>' +
            '<div class="notif-sub-text">' + contentText + '</div>' +
            '<div class="notif-sub-target">' + notif.targetDesc + '</div>' +
            '</div>' +
            '</div>';
    }

    function buildMessageItem(notif) {
        var unreadClass = notif.read ? '' : ' unread';
        var timeText = formatTime(notif.timestamp);
        var previewText = notif.content;
        if (previewText.length > 80) {
            previewText = previewText.substring(0, 80) + '...';
        }

        return '<div class="notif-msg-item' + unreadClass + '" data-id="' + notif.id + '">' +
            '<div class="notif-msg-avatar">' +
            '<img src="' + notif.fromUser.avatar + '" alt="' + notif.fromUser.name + '">' +
            '</div>' +
            '<div class="notif-msg-body">' +
            '<div class="notif-msg-header">' +
            '<span class="notif-msg-name">' + notif.fromUser.name + '</span>' +
            '<span class="notif-msg-time">' + timeText + '</span>' +
            '</div>' +
            '<div class="notif-msg-preview">' + previewText + '</div>' +
            '</div>' +
            '</div>';
    }

    function buildPopupHeader() {
        return '<div class="notif-popup-header">' +
            '<h3 class="notif-popup-title">Notification</h3>' +
            '<button class="notif-mark-all" id="notifMarkAll">Mark all as read</button>' +
            '</div>';
    }

    function buildPopupBody() {
        var messages = getByType('message');
        var isLikeExpanded = expandedCategory === 'like';
        var isCommentExpanded = expandedCategory === 'comment';

        var html = '<div class="notif-actions-row">' +
            buildActionBtn('like') +
            buildActionBtn('comment') +
            '</div>';

        if (isLikeExpanded) {
            html += '<div class="notif-sub-list" data-category="like">' +
                buildExpandedSubList('like') +
                '</div>';
        }

        if (isCommentExpanded) {
            html += '<div class="notif-sub-list" data-category="comment">' +
                buildExpandedSubList('comment') +
                '</div>';
        }

        html += '<div class="notif-msg-section">';
        if (messages.length > 0) {
            for (var i = 0; i < messages.length; i++) {
                html += buildMessageItem(messages[i]);
            }
        } else {
            html += '<div class="notif-empty-sub">No messages yet</div>';
        }
        html += '</div>';

        return html;
    }

    function buildPopupContent() {
        return buildPopupHeader() + '<div class="notif-popup-body">' + buildPopupBody() + '</div>';
    }

    function refreshPopupContent() {
        if (!popup) return;
        var body = popup.querySelector('.notif-popup-body');
        if (!body) return;
        body.innerHTML = buildPopupBody();
        bindPopupEvents();
    }

    function openPopup() {
        if (popup) popup.classList.add('open');
        if (overlay) overlay.classList.add('open');
        expandedCategory = null;
        refreshPopupContent();
        document.body.style.overflow = 'hidden';
    }

    function closePopup() {
        if (popup) popup.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    function toggleCategory(type) {
        if (expandedCategory === type) {
            expandedCategory = null;
        } else {
            expandedCategory = type;
        }
        refreshPopupContent();
    }

    function openChatDialog(user) {
        closePopup();
        activeChatUser = user;
        chatMessages = loadChatMessages(user.name);

        if (chatDialog) chatDialog.remove();
        if (chatOverlay) chatOverlay.remove();

        chatOverlay = document.createElement('div');
        chatOverlay.className = 'notif-chat-overlay';
        chatOverlay.addEventListener('click', closeChatDialog);

        chatDialog = document.createElement('div');
        chatDialog.className = 'notif-chat-dialog';
        chatDialog.innerHTML = buildChatDialogHTML(user);

        document.body.appendChild(chatOverlay);
        document.body.appendChild(chatDialog);

        bindChatEvents();
        scrollChatToBottom();
        document.body.style.overflow = 'hidden';
    }

    function closeChatDialog() {
        if (chatDialog) chatDialog.remove();
        if (chatOverlay) chatOverlay.remove();
        chatDialog = null;
        chatOverlay = null;
        activeChatUser = null;
        chatMessages = [];
        document.body.style.overflow = '';
    }

    function buildChatDialogHTML(user) {
        return '<div class="notif-chat-header">' +
            '<button class="notif-chat-back" id="notifChatBack">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>' +
            '</button>' +
            '<div class="notif-chat-user">' +
            '<img src="' + user.avatar + '" alt="' + user.name + '">' +
            '<span>' + user.name + '</span>' +
            '</div>' +
            '<button class="notif-chat-close" id="notifChatClose">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>' +
            '</div>' +
            '<div class="notif-chat-messages" id="notifChatMessages">' +
            buildChatMessagesHTML() +
            '</div>' +
            '<div class="notif-chat-input-wrap">' +
            '<div class="notif-chat-input-area">' +
            '<textarea class="notif-chat-textarea" id="notifChatTextarea" placeholder="Type a message..." rows="1"></textarea>' +
            '<div class="notif-chat-input-tools">' +
            '<button class="notif-chat-emoji-btn" id="notifChatEmojiBtn" title="Emoji">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>' +
            '</button>' +
            '</div>' +
            '</div>' +
            '<button class="notif-chat-send-btn" id="notifChatSendBtn">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
            '</button>' +
            '<div class="notif-chat-emoji-panel" id="notifChatEmojiPanel" style="display:none;">' +
            emojiList.map(function(e) {
                return '<button class="notif-chat-emoji-item" data-emoji="' + e + '">' + e + '</button>';
            }).join('') +
            '</div>' +
            '</div>';
    }

    function buildChatMessagesHTML() {
        if (chatMessages.length === 0) {
            return '<div class="notif-chat-empty">No messages yet. Start the conversation!</div>';
        }
        return chatMessages.map(function(msg) {
            var isMine = msg.from === 'me';
            var cls = isMine ? ' notif-chat-msg-mine' : '';
            return '<div class="notif-chat-msg' + cls + '">' +
                '<div class="notif-chat-msg-bubble">' + msg.text + '</div>' +
                '<div class="notif-chat-msg-time">' + formatTime(msg.timestamp) + '</div>' +
                '</div>';
        }).join('');
    }

    function scrollChatToBottom() {
        setTimeout(function() {
            var msgContainer = document.getElementById('notifChatMessages');
            if (msgContainer) {
                msgContainer.scrollTop = msgContainer.scrollHeight;
            }
        }, 50);
    }

    function sendChatMessage() {
        var textarea = document.getElementById('notifChatTextarea');
        if (!textarea) return;
        var text = textarea.value.trim();
        if (!text) return;

        var now = new Date().toISOString();
        chatMessages.push({ from: 'me', text: text, timestamp: now });
        saveChatMessages(activeChatUser.name, chatMessages);

        textarea.value = '';
        textarea.style.height = 'auto';

        var msgContainer = document.getElementById('notifChatMessages');
        if (msgContainer) {
            var emptyEl = msgContainer.querySelector('.notif-chat-empty');
            if (emptyEl) emptyEl.remove();
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = '<div class="notif-chat-msg notif-chat-msg-mine">' +
                '<div class="notif-chat-msg-bubble">' + text + '</div>' +
                '<div class="notif-chat-msg-time">Just now</div>' +
                '</div>';
            while (tempDiv.firstChild) {
                msgContainer.appendChild(tempDiv.firstChild);
            }
        }
        scrollChatToBottom();
    }

    function bindChatEvents() {
        if (!chatDialog) return;

        var backBtn = chatDialog.querySelector('#notifChatBack');
        var closeBtn = chatDialog.querySelector('#notifChatClose');
        var sendBtn = chatDialog.querySelector('#notifChatSendBtn');
        var textarea = chatDialog.querySelector('#notifChatTextarea');
        var emojiBtn = chatDialog.querySelector('#notifChatEmojiBtn');
        var emojiPanel = chatDialog.querySelector('#notifChatEmojiPanel');

        if (backBtn) {
            backBtn.addEventListener('click', function() {
                closeChatDialog();
                openPopup();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', closeChatDialog);
        }

        if (sendBtn && textarea) {
            sendBtn.addEventListener('click', sendChatMessage);
        }

        if (textarea) {
            textarea.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = this.scrollHeight + 'px';
            });
            textarea.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendChatMessage();
                }
            });
        }

        if (emojiBtn && emojiPanel) {
            emojiBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                var visible = emojiPanel.style.display === 'grid';
                emojiPanel.style.display = visible ? 'none' : 'grid';
            });
        }

        if (emojiPanel) {
            var emojiItems = emojiPanel.querySelectorAll('.notif-chat-emoji-item');
            for (var i = 0; i < emojiItems.length; i++) {
                emojiItems[i].addEventListener('click', function() {
                    var emoji = this.getAttribute('data-emoji');
                    if (textarea) {
                        textarea.value += emoji;
                        textarea.focus();
                        textarea.dispatchEvent(new Event('input'));
                    }
                    emojiPanel.style.display = 'none';
                });
            }
        }

        document.addEventListener('click', function hideEmoji(e) {
            if (emojiPanel && emojiPanel.style.display === 'grid') {
                if (!emojiPanel.contains(e.target) && e.target !== emojiBtn && !emojiBtn.contains(e.target)) {
                    emojiPanel.style.display = 'none';
                }
            }
        });
    }

    function bindPopupEvents() {
        if (!popup) return;

        var markAllBtn = popup.querySelector('#notifMarkAll');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                markAllRead();
            });
        }

        var actionBtns = popup.querySelectorAll('.notif-action-btn');
        for (var i = 0; i < actionBtns.length; i++) {
            actionBtns[i].addEventListener('click', function(e) {
                e.stopPropagation();
                var cat = this.getAttribute('data-category');
                if (cat) toggleCategory(cat);
            });

            actionBtns[i].addEventListener('mouseenter', function() {
                var catType = this.getAttribute('data-category');
                if (catType && getUnreadByType(catType) > 0) {
                    markCategoryRead(catType);
                }
            });
        }

        var subItems = popup.querySelectorAll('.notif-sub-item');
        for (var j = 0; j < subItems.length; j++) {
            subItems[j].addEventListener('click', function(e) {
                e.stopPropagation();
                var id = this.getAttribute('data-id');
                var notif = null;
                for (var k = 0; k < notifications.length; k++) {
                    if (notifications[k].id === id) { notif = notifications[k]; break; }
                }
                if (notif) handleNotificationClick(notif);
            });
        }

        var msgItems = popup.querySelectorAll('.notif-msg-item');
        for (var m = 0; m < msgItems.length; m++) {
            msgItems[m].addEventListener('click', function(e) {
                e.stopPropagation();
                var id = this.getAttribute('data-id');
                var notif = null;
                for (var k = 0; k < notifications.length; k++) {
                    if (notifications[k].id === id) { notif = notifications[k]; break; }
                }
                if (notif) handleNotificationClick(notif);
            });
        }
    }

    function updateBadge() {
        if (!bellBtn) return;
        var badge = bellBtn.querySelector('.notif-badge');
        var unread = getUnreadCount();
        if (unread > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'notif-badge';
                bellBtn.appendChild(badge);
            }
            badge.textContent = unread > 99 ? '99+' : unread;
        } else {
            if (badge) badge.remove();
        }
    }

    function buildPopup() {
        var existingPopup = document.getElementById('notifPopup');
        var existingOverlay = document.getElementById('notifOverlay');
        if (existingPopup) existingPopup.remove();
        if (existingOverlay) existingOverlay.remove();

        overlay = document.createElement('div');
        overlay.className = 'notif-overlay';
        overlay.id = 'notifOverlay';
        overlay.addEventListener('click', closePopup);

        popup = document.createElement('div');
        popup.className = 'notif-popup';
        popup.id = 'notifPopup';
        popup.innerHTML = buildPopupContent();

        document.body.appendChild(overlay);
        document.body.appendChild(popup);

        bindPopupEvents();
    }

    function initBell() {
        var existingBell = document.getElementById('notifBellBtn');
        if (existingBell) existingBell.remove();

        var headerActions = document.querySelector('.headerActions');
        if (!headerActions) return;

        var settingsBtn = document.getElementById('settingsBtn');
        var temp = document.createElement('div');
        temp.innerHTML = buildBellHTML();
        bellBtn = temp.firstChild;

        if (settingsBtn) {
            headerActions.insertBefore(bellBtn, settingsBtn);
        } else {
            headerActions.appendChild(bellBtn);
        }

        bellBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            if (popup && popup.classList.contains('open')) {
                closePopup();
            } else {
                openPopup();
            }
        });

        updateBadge();
    }

    function init() {
        if (isInitialized) return;
        if (!Utils.isLoggedIn()) return;
        isInitialized = true;

        loadFromStorage();
        initBell();
        buildPopup();

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                if (chatDialog) {
                    closeChatDialog();
                } else if (popup && popup.classList.contains('open')) {
                    closePopup();
                }
            }
        });
    }

    function show() {
        if (!Utils.isLoggedIn()) return;
        loadFromStorage();
        if (!isInitialized) {
            init();
        } else {
            if (bellBtn) bellBtn.style.display = '';
            updateBadge();
        }
    }

    function hide() {
        if (bellBtn) bellBtn.style.display = 'none';
        closePopup();
        closeChatDialog();
    }

    function destroy() {
        if (bellBtn) bellBtn.remove();
        if (popup) popup.remove();
        if (overlay) overlay.remove();
        if (chatDialog) chatDialog.remove();
        if (chatOverlay) chatOverlay.remove();
        bellBtn = null;
        popup = null;
        overlay = null;
        chatDialog = null;
        chatOverlay = null;
        isInitialized = false;
    }

    function refresh() {
        if (!isInitialized || !Utils.isLoggedIn()) return;
        loadFromStorage();
        updateBadge();
        if (popup && popup.classList.contains('open')) {
            refreshPopupContent();
        }
    }

    return {
        init: init,
        show: show,
        hide: hide,
        destroy: destroy,
        refresh: refresh,
        getUnreadCount: getUnreadCount
    };
})();