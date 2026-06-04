"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.signJwt = signJwt;
exports.verifyJwt = verifyJwt;
const crypto = __importStar(require("crypto"));
const JWT_SECRET = process.env.JWT_SECRET || 'default-super-secret-key-1234567890-tradebot';
function base64url(input) {
    const buf = typeof input === 'string' ? Buffer.from(input) : input;
    return buf
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}
function base64urlDecode(str) {
    let s = str.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) {
        s += '=';
    }
    return Buffer.from(s, 'base64').toString();
}
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
        .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
        .toString('hex');
    return `${salt}:${hash}`;
}
function verifyPassword(password, storedPassword) {
    if (!storedPassword || !storedPassword.includes(':'))
        return false;
    const [salt, hash] = storedPassword.split(':');
    const verifyHash = crypto
        .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
        .toString('hex');
    return hash === verifyHash;
}
function signJwt(payload, expiresInSeconds = 86400) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const fullPayload = { ...payload, exp };
    const tokenParts = [
        base64url(JSON.stringify(header)),
        base64url(JSON.stringify(fullPayload)),
    ];
    const signatureInput = tokenParts.join('.');
    const signature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(signatureInput)
        .digest();
    tokenParts.push(base64url(signature));
    return tokenParts.join('.');
}
function verifyJwt(token) {
    try {
        if (!token)
            return null;
        const parts = token.split('.');
        if (parts.length !== 3)
            return null;
        const [headerB64, payloadB64, signatureB64] = parts;
        const signatureInput = `${headerB64}.${payloadB64}`;
        const expectedSignature = crypto
            .createHmac('sha256', JWT_SECRET)
            .update(signatureInput)
            .digest();
        const expectedSignatureB64 = base64url(expectedSignature);
        if (signatureB64 !== expectedSignatureB64) {
            return null;
        }
        const payload = JSON.parse(base64urlDecode(payloadB64));
        if (payload.exp && Date.now() / 1000 > payload.exp) {
            return null;
        }
        return payload;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=crypto.util.js.map