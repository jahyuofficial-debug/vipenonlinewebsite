var crypto = require('crypto');
var fs = require('fs');
var path = require('path');

var SECRET_FILE = path.join(process.cwd(), '.auth_secret');
var OLD_SECRET_FILE = path.join(process.cwd(), '.old_auth_secret');
var cachedSecret = null;

function getAuthSecret() {
    if (cachedSecret) return cachedSecret;

    if (process.env.AUTH_SECRET) {
        cachedSecret = process.env.AUTH_SECRET;
        return cachedSecret;
    }

    try {
        cachedSecret = fs.readFileSync(SECRET_FILE, 'utf8').trim();
        if (cachedSecret) return cachedSecret;
    } catch(e) {}

    cachedSecret = crypto.randomBytes(32).toString('hex');
    try {
        fs.writeFileSync(SECRET_FILE, cachedSecret, 'utf8');
        console.log('[AUTH] Generated persistent secret in .auth_secret file');
    } catch(e) {
        console.log('[AUTH] Using ephemeral random secret (set AUTH_SECRET env var for production persistence)');
    }
    return cachedSecret;
}

function getOldAuthSecret() {
    if (process.env.OLD_AUTH_SECRET !== undefined) {
        return process.env.OLD_AUTH_SECRET;
    }
    try {
        var val = fs.readFileSync(OLD_SECRET_FILE, 'utf8').trim();
        if (val) return val;
    } catch(e) {}
    return '';
}

var TOKEN_TTL = 24 * 60 * 60 * 1000;

function generateToken(email, username, role) {
    var payload = JSON.stringify({
        email: email,
        username: username,
        role: role || '',
        exp: Date.now() + TOKEN_TTL
    });
    var encoded = Buffer.from(payload).toString('base64');
    var hmac = crypto.createHmac('sha256', getAuthSecret());
    hmac.update(encoded);
    var sig = hmac.digest('hex');
    return encoded + '.' + sig;
}

function verifyToken(token) {
    if (!token) return null;
    var parts = token.split('.');
    if (parts.length !== 2) return null;
    var encoded = parts[0];
    var sig = parts[1];
    var hmac = crypto.createHmac('sha256', getAuthSecret());
    hmac.update(encoded);
    if (hmac.digest('hex') !== sig) return null;
    try {
        var payload = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
        if (Date.now() > payload.exp) return null;
        return payload;
    } catch(e) {
        return null;
    }
}

module.exports = {
    getAuthSecret: getAuthSecret,
    getOldAuthSecret: getOldAuthSecret,
    generateToken: generateToken,
    verifyToken: verifyToken
};