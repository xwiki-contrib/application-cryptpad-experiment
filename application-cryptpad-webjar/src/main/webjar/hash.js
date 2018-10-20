
var Hash = {};
var Nacl = window.nacl;
var uint8ArrayToHex = Util.uint8ArrayToHex;
var hexToBase64 = Util.hexToBase64;
var base64ToHex = Util.base64ToHex;
Hash.encodeBase64 = Nacl.util.encodeBase64;


var fixDuplicateSlashes = function (s) {
    return s.replace(/\/+/g, '/');
};

var parseTypeHash = Hash.parseTypeHash = function (type, hash) {
    if (!hash) { return; }
    var options;
    var parsed = {};
    var hashArr = fixDuplicateSlashes(hash).split('/');
    if (['media', 'file', 'user', 'invite'].indexOf(type) === -1) {
        parsed.type = 'pad';
        parsed.getHash = function () { return hash; };
        if (hash.slice(0,1) !== '/' && hash.length >= 56) { // Version 0
            // Old hash
            parsed.channel = hash.slice(0, 32);
            parsed.key = hash.slice(32, 56);
            parsed.version = 0;
            return parsed;
        }
        if (hashArr[1] && hashArr[1] === '1') { // Version 1
            parsed.version = 1;
            parsed.mode = hashArr[2];
            parsed.channel = hashArr[3];
            parsed.key = Crypto.b64AddSlashes(hashArr[4]);

            options = hashArr.slice(5);
            parsed.present = options.indexOf('present') !== -1;
            parsed.embed = options.indexOf('embed') !== -1;

            parsed.getHash = function (opts) {
                var hash = hashArr.slice(0, 5).join('/') + '/';
                if (opts.embed) { hash += 'embed/'; }
                if (opts.present) { hash += 'present/'; }
                return hash;
            };
            return parsed;
        }
        if (hashArr[1] && hashArr[1] === '2') { // Version 2
            parsed.version = 2;
            parsed.app = hashArr[2];
            parsed.mode = hashArr[3];
            parsed.key = hashArr[4];

            options = hashArr.slice(5);
            parsed.password = options.indexOf('p') !== -1;
            parsed.present = options.indexOf('present') !== -1;
            parsed.embed = options.indexOf('embed') !== -1;

            parsed.getHash = function (opts) {
                var hash = hashArr.slice(0, 5).join('/') + '/';
                if (parsed.password) { hash += 'p/'; }
                if (opts.embed) { hash += 'embed/'; }
                if (opts.present) { hash += 'present/'; }
                return hash;
            };
            return parsed;
        }
        return parsed;
    }
    parsed.getHash = function () { return hashArr.join('/'); };
    if (['media', 'file'].indexOf(type) !== -1) {
        parsed.type = 'file';
        if (hashArr[1] && hashArr[1] === '1') {
            parsed.version = 1;
            parsed.channel = hashArr[2].replace(/-/g, '/');
            parsed.key = hashArr[3].replace(/-/g, '/');
            return parsed;
        }
        if (hashArr[1] && hashArr[1] === '2') { // Version 2
            parsed.version = 2;
            parsed.app = hashArr[2];
            parsed.key = hashArr[3];

            options = hashArr.slice(4);
            parsed.password = options.indexOf('p') !== -1;
            parsed.present = options.indexOf('present') !== -1;
            parsed.embed = options.indexOf('embed') !== -1;

            parsed.getHash = function (opts) {
                var hash = hashArr.slice(0, 4).join('/') + '/';
                if (parsed.password) { hash += 'p/'; }
                if (opts.embed) { hash += 'embed/'; }
                if (opts.present) { hash += 'present/'; }
                return hash;
            };
            return parsed;
        }
        return parsed;
    }
    if (['user'].indexOf(type) !== -1) {
        parsed.type = 'user';
        if (hashArr[1] && hashArr[1] === '1') {
            parsed.version = 1;
            parsed.user = hashArr[2];
            parsed.pubkey = hashArr[3].replace(/-/g, '/');
            return parsed;
        }
        return parsed;
    }
    if (['invite'].indexOf(type) !== -1) {
        parsed.type = 'invite';
        if (hashArr[1] && hashArr[1] === '1') {
            parsed.version = 1;
            parsed.channel = hashArr[2];
            parsed.pubkey = hashArr[3].replace(/-/g, '/');
            return parsed;
        }
        return parsed;
    }
    return;
};
var parsePadUrl = Hash.parsePadUrl = function (href) {
    var patt = /^https*:\/\/([^\/]*)\/(.*?)\//i;

    var ret = {};

    if (!href) { return ret; }
    if (href.slice(-1) !== '/') { href += '/'; }
    href = href.replace(/\/\?[^#]+#/, '/#');

    var idx;

    ret.getUrl = function (options) {
        options = options || {};
        var url = '/';
        if (!ret.type) { return url; }
        url += ret.type + '/';
        if (!ret.hashData) { return url; }
        if (ret.hashData.type !== 'pad') { return url + '#' + ret.hash; }
        if (ret.hashData.version === 0) { return url + '#' + ret.hash; }
        var hash = ret.hashData.getHash(options);
        url += '#' + hash;
        return url;
    };

    if (!/^https*:\/\//.test(href)) {
        idx = href.indexOf('/#');
        ret.type = href.slice(1, idx);
        ret.hash = href.slice(idx + 2);
        ret.hashData = parseTypeHash(ret.type, ret.hash);
        return ret;
    }

    href.replace(patt, function (a, domain, type) {
        ret.domain = domain;
        ret.type = type;
        return '';
    });
    idx = href.indexOf('/#');
    if (idx === -1) { return ret; }
    ret.hash = href.slice(idx + 2);
    ret.hashData = parseTypeHash(ret.type, ret.hash);
    return ret;
};

Hash.getRelativeHref = function (href) {
    if (!href) { return; }
    if (href.indexOf('#') === -1) { return; }
    var parsed = parsePadUrl(href);
    return '/' + parsed.type + '/#' + parsed.hash;
};

/*
 * Returns all needed keys for a realtime channel
 * - no argument: use the URL hash or create one if it doesn't exist
 * - secretHash provided: use secretHash to find the keys
 */
Hash.getSecrets = function (type, secretHash, password) {
    var secret = {};
    var generate = function () {
        secret.keys = Crypto.createEditCryptor2(void 0, void 0, password);
        secret.channel = base64ToHex(secret.keys.chanId);
        secret.version = 2;
        secret.type = type;
    };
    if (!secretHash && !window.location.hash) { //!/#/.test(window.location.href)) {
        generate();
        return secret;
    } else {
        var parsed;
        var hash;
        if (secretHash) {
            if (!type) { throw new Error("getSecrets with a hash requires a type parameter"); }
            parsed = parseTypeHash(type, secretHash);
            hash = secretHash;
        } else {
            var pHref = parsePadUrl(window.location.href);
            parsed = pHref.hashData;
            hash = pHref.hash;
        }
        //var hash = secretHash || window.location.hash.slice(1);
        if (hash.length === 0) {
            generate();
            return secret;
        }
        // old hash system : #{hexChanKey}{cryptKey}
        // new hash system : #/{hashVersion}/{b64ChanKey}/{cryptKey}
        if (parsed.version === 0) {
            // Old hash
            secret.channel = parsed.channel;
            secret.key = parsed.key;
            secret.version = 0;
        } else if (parsed.version === 1) {
            // New hash
            secret.version = 1;
            if (parsed.type === "pad") {
                secret.channel = base64ToHex(parsed.channel);
                if (parsed.mode === 'edit') {
                    secret.keys = Crypto.createEditCryptor(parsed.key);
                    secret.key = secret.keys.editKeyStr;
                    if (secret.channel.length !== 32 || secret.key.length !== 24) {
                        throw new Error("The channel key and/or the encryption key is invalid");
                    }
                }
                else if (parsed.mode === 'view') {
                    secret.keys = Crypto.createViewCryptor(parsed.key);
                    if (secret.channel.length !== 32) {
                        throw new Error("The channel key is invalid");
                    }
                }
            } else if (parsed.type === "file") {
                secret.channel = base64ToHex(parsed.channel);
                secret.keys = {
                    fileKeyStr: parsed.key,
                    cryptKey: Nacl.util.decodeBase64(parsed.key)
                };
            } else if (parsed.type === "user") {
                throw new Error("User hashes can't be opened (yet)");
            }
        } else if (parsed.version === 2) {
            // New hash
            secret.version = 2;
            secret.type = type;
            secret.password = password;
            if (parsed.type === "pad") {
                if (parsed.mode === 'edit') {
                    secret.keys = Crypto.createEditCryptor2(parsed.key, void 0, password);
                    secret.channel = base64ToHex(secret.keys.chanId);
                    secret.key = secret.keys.editKeyStr;
                    if (secret.channel.length !== 32 || secret.key.length !== 24) {
                        throw new Error("The channel key and/or the encryption key is invalid");
                    }
                }
                else if (parsed.mode === 'view') {
                    secret.keys = Crypto.createViewCryptor2(parsed.key, password);
                    secret.channel = base64ToHex(secret.keys.chanId);
                    if (secret.channel.length !== 32) {
                        throw new Error("The channel key is invalid");
                    }
                }
            } else if (parsed.type === "file") {
                secret.keys = Crypto.createFileCryptor2(parsed.key, password);
                secret.channel = base64ToHex(secret.keys.chanId);
                secret.key = secret.keys.fileKeyStr;
                if (secret.channel.length !== 48 || secret.key.length !== 24) {
                    throw new Error("The channel key and/or the encryption key is invalid");
                }
            } else if (parsed.type === "user") {
                throw new Error("User hashes can't be opened (yet)");
            }
        }
    }
    return secret;
};