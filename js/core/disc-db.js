var DiscDB = (function() {
    'use strict';
    var DB_NAME = 'vipen_disc_db';
    var DB_VERSION = 1;
    var db = null;
    var urlCache = {};

    function init() {
        return new Promise(function(resolve, reject) {
            var request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = function(e) {
                var d = e.target.result;
                if (!d.objectStoreNames.contains('audio')) {
                    d.createObjectStore('audio', { keyPath: 'id' });
                }
                if (!d.objectStoreNames.contains('cover')) {
                    d.createObjectStore('cover', { keyPath: 'id' });
                }
            };
            request.onsuccess = function(e) {
                db = e.target.result;
                resolve(db);
            };
            request.onerror = function(e) {
                reject(e.target.error);
            };
        });
    }

    function ensureDB() {
        if (db) return Promise.resolve(db);
        return init();
    }

    function saveBlob(storeName, id, blob) {
        return ensureDB().then(function() {
            return new Promise(function(resolve, reject) {
                var tx = db.transaction(storeName, 'readwrite');
                var store = tx.objectStore(storeName);
                store.put({ id: String(id), blob: blob });
                tx.oncomplete = function() { resolve(); };
                tx.onerror = function(e) { reject(e.target.error); };
            });
        });
    }

    function getBlob(storeName, id) {
        return ensureDB().then(function() {
            return new Promise(function(resolve, reject) {
                var tx = db.transaction(storeName, 'readonly');
                var store = tx.objectStore(storeName);
                var req = store.get(String(id));
                req.onsuccess = function() { resolve(req.result ? req.result.blob : null); };
                req.onerror = function(e) { reject(e.target.error); };
            });
        });
    }

    function deleteBlob(storeName, id) {
        return ensureDB().then(function() {
            return new Promise(function(resolve, reject) {
                var tx = db.transaction(storeName, 'readwrite');
                var store = tx.objectStore(storeName);
                store.delete(String(id));
                tx.oncomplete = function() { resolve(); };
                tx.onerror = function(e) { reject(e.target.error); };
            });
        });
    }

    function blobToUrl(blob) {
        if (!blob) return '';
        return URL.createObjectURL(blob);
    }

    function revokeUrl(url) {
        if (url && url.indexOf('blob:') === 0) {
            URL.revokeObjectURL(url);
        }
    }

    function isIndexedDBRef(val) {
        return typeof val === 'string' && val.indexOf('indexeddb:') === 0;
    }

    function isDataUrl(val) {
        return typeof val === 'string' && val.indexOf('data:') === 0;
    }

    function dataUrlToBlob(dataUrl) {
        if (!dataUrl) return null;
        var parts = dataUrl.split(',');
        if (parts.length < 2) return null;
        var mime = parts[0].match(/:(.*?);/);
        var mimeType = mime ? mime[1] : 'application/octet-stream';
        var binary = atob(parts[1]);
        var bytes = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return new Blob([bytes], { type: mimeType });
    }

    function getIdFromRef(ref) {
        return ref.replace('indexeddb:', '');
    }

    return {
        init: init,

        saveTrackFiles: function(id, audioBlob, coverBlob) {
            var promises = [];
            if (audioBlob) promises.push(saveBlob('audio', id, audioBlob));
            if (coverBlob) promises.push(saveBlob('cover', id, coverBlob));
            return Promise.all(promises);
        },

        saveCoverBlob: function(id, blob) {
            return saveBlob('cover', id, blob);
        },

        deleteTrackFiles: function(id) {
            revokeUrl(urlCache[id + '_audio']);
            revokeUrl(urlCache[id + '_cover']);
            delete urlCache[id + '_audio'];
            delete urlCache[id + '_cover'];
            return Promise.all([
                deleteBlob('audio', id),
                deleteBlob('cover', id)
            ]);
        },

        resolveTapeUrls: function(tape) {
            if (!tape) return Promise.resolve(tape);
            var promises = [];

            if (isIndexedDBRef(tape.audio)) {
                var audioId = getIdFromRef(tape.audio);
                if (urlCache[audioId + '_audio']) {
                    tape.audio = urlCache[audioId + '_audio'];
                } else {
                    promises.push(
                        getBlob('audio', audioId).then(function(blob) {
                            if (blob) {
                                var url = blobToUrl(blob);
                                urlCache[audioId + '_audio'] = url;
                                tape.audio = url;
                            } else {
                                tape.audio = '';
                            }
                        })
                    );
                }
            }

            if (isIndexedDBRef(tape.cover)) {
                var coverId = getIdFromRef(tape.cover);
                if (urlCache[coverId + '_cover']) {
                    tape.cover = urlCache[coverId + '_cover'];
                } else {
                    promises.push(
                        getBlob('cover', coverId).then(function(blob) {
                            if (blob) {
                                var url = blobToUrl(blob);
                                urlCache[coverId + '_cover'] = url;
                                tape.cover = url;
                            }
                        })
                    );
                }
            }

            if (promises.length === 0) return Promise.resolve(tape);
            return Promise.all(promises).then(function() { return tape; });
        },

        resolveAllTapes: function(tapes) {
            if (!tapes || tapes.length === 0) return Promise.resolve(tapes);
            var promises = [];
            for (var i = 0; i < tapes.length; i++) {
                promises.push(this.resolveTapeUrls(tapes[i]));
            }
            return Promise.all(promises).then(function() { return tapes; });
        },

        isIndexedDBRef: isIndexedDBRef,
        isDataUrl: isDataUrl,
        dataUrlToBlob: dataUrlToBlob,

        migrateTape: function(tape) {
            if (!tape) return Promise.resolve(tape);
            var promises = [];
            var changed = false;

            if (isDataUrl(tape.audio)) {
                var audioBlob = dataUrlToBlob(tape.audio);
                if (audioBlob) {
                    promises.push(saveBlob('audio', tape.id, audioBlob));
                    tape.audio = 'indexeddb:' + tape.id;
                    changed = true;
                }
            }
            if (isDataUrl(tape.cover)) {
                var coverBlob = dataUrlToBlob(tape.cover);
                if (coverBlob) {
                    promises.push(saveBlob('cover', tape.id, coverBlob));
                    tape.cover = 'indexeddb:' + tape.id;
                    changed = true;
                }
            }

            if (promises.length === 0) return Promise.resolve(tape);
            return Promise.all(promises).then(function() { return tape; });
        },

        migrateAllTapes: function(tapes) {
            if (!tapes || tapes.length === 0) return Promise.resolve(tapes);
            var promises = [];
            for (var i = 0; i < tapes.length; i++) {
                promises.push(this.migrateTape(tapes[i]));
            }
            return Promise.all(promises).then(function() { return tapes; });
        },

        makeRef: function(id) {
            return 'indexeddb:' + id;
        }
    };
})();