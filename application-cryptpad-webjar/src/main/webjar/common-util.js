var Util = window.CryptPad_Util = {};

// If once is true, after the event has been fired, any further handlers which are
// registered will fire immediately, and this type of event cannot be fired twice.
Util.mkEvent = function (once) {
    var handlers = [];
    var fired = false;
    return {
        reg: function (cb) {
            if (once && fired) { return void setTimeout(cb); }
            handlers.push(cb);
        },
        unreg: function (cb) {
            if (handlers.indexOf(cb) === -1) { throw new Error("Not registered"); }
            handlers.splice(handlers.indexOf(cb), 1);
        },
        fire: function () {
            if (once && fired) { return; }
            fired = true;
            var args = Array.prototype.slice.call(arguments);
            handlers.forEach(function (h) { h.apply(null, args); });
        }
    };
};

Util.find = function (map, path) {
    var l = path.length;
    for (var i = 0; i < l; i++) {
        if (typeof(map[path[i]]) === 'undefined') { return; }
        map = map[path[i]];
    }
    return map;
};

Util.uid = function () {
    return Number(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))
        .toString(32).replace(/\./g, '');
};

Util.fixHTML = function (str) {
    if (!str) { return ''; }
    return str.replace(/[<>&"']/g, function (x) {
        return ({ "<": "&lt;", ">": "&gt", "&": "&amp;", '"': "&#34;", "'": "&#39;" })[x];
    });
};

Util.hexToBase64 = function (hex) {
    var hexArray = hex
        .replace(/\r|\n/g, "")
        .replace(/([\da-fA-F]{2}) ?/g, "0x$1 ")
        .replace(/ +$/, "")
        .split(" ");
    var byteString = String.fromCharCode.apply(null, hexArray);
    return window.btoa(byteString).replace(/\//g, '-').replace(/=+$/, '');
};

Util.base64ToHex = function (b64String) {
    var hexArray = [];
    atob(b64String.replace(/-/g, '/')).split("").forEach(function(e){
        var h = e.charCodeAt(0).toString(16);
        if (h.length === 1) { h = "0"+h; }
        hexArray.push(h);
    });
    return hexArray.join("");
};

Util.uint8ArrayToHex = function (a) {
    // call slice so Uint8Arrays work as expected
    return Array.prototype.slice.call(a).map(function (e) {
        var n = Number(e & 0xff).toString(16);
        if (n === 'NaN') {
            throw new Error('invalid input resulted in NaN');
        }

        switch (n.length) {
            case 0: return '00'; // just being careful, shouldn't happen
            case 1: return '0' + n;
            case 2: return n;
            default: throw new Error('unexpected value');
        }
    }).join('');
};

Util.deduplicateString = function (array) {
    var a = array.slice();
    for(var i=0; i<a.length; i++) {
        for(var j=i+1; j<a.length; j++) {
            if(a[i] === a[j]) { a.splice(j--, 1); }
        }
    }
    return a;
};

/*
 *  Saving files
 */
Util.fixFileName = function (filename) {
    return filename.replace(/ /g, '-').replace(/[\/\?]/g, '_')
        .replace(/_+/g, '_');
};

var oneKilobyte = 1024;
var oneMegabyte = 1024 * oneKilobyte;
var oneGigabyte = 1024 * oneMegabyte;

Util.bytesToGigabytes = function (bytes) {
    return Math.ceil(bytes / oneGigabyte * 100) / 100;
};

Util.bytesToMegabytes = function (bytes) {
    return Math.ceil(bytes / oneMegabyte * 100) / 100;
};

Util.bytesToKilobytes = function (bytes) {
    return Math.ceil(bytes / oneKilobyte * 100) / 100;
};

Util.magnitudeOfBytes = function (bytes) {
    if (bytes >= oneGigabyte) { return 'GB'; }
    else if (bytes >= oneMegabyte) { return 'MB'; }
};

Util.fetch = function (src, cb) {
    var done = false;
    var CB = function (err, res) {
        if (done) { return; }
        done = true;
        cb(err, res);
    };

    var xhr = new XMLHttpRequest();
    xhr.open("GET", src, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = function () {
        if (/^4/.test(''+this.status)) {
            return CB('XHR_ERROR');
        }
        return void CB(void 0, new Uint8Array(xhr.response));
    };
    xhr.send(null);
};

Util.throttle = function (f, ms) {
    var to;
    var g = function () {
        window.clearTimeout(to);
        to = window.setTimeout(f, ms);
    };
    return g;
};

/*  takes a function (f) and a time (t) in ms. returns a function wrapper
    which prevents the internal function from being called more than once
    every t ms. if the function is prevented, returns time til next valid
    execution, else null.
*/
Util.notAgainForAnother = function (f, t) {
    if (typeof(f) !== 'function' || typeof(t) !== 'number') {
        throw new Error("invalid inputs");
    }
    var last = null;
    return function () {
        var now = +new Date();
        if (last && now <= last + t) { return t - (now - last); }
        last = now;
        f();
        return null;
    };
};

Util.createRandomInteger = function () {
    return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
};

/* for wrapping async functions such that they can only be called once */
Util.once = function (f) {
    var called;
    return function () {
        if (called) { return; }
        called = true;
        f.apply(this, Array.prototype.slice.call(arguments));
    };
};

Util.slice = function (A) {
    return Array.prototype.slice.call(A);
};

Util.blobToImage = function (blob, cb) {
    var reader = new FileReader();
    reader.onloadend = function() {
        cb(reader.result);
    };
    reader.readAsDataURL(blob);
};
Util.blobURLToImage = function (url, cb) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
        var reader = new FileReader();
        reader.onloadend = function() {
            cb(reader.result);
        };
        reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
};

// Check if an element is a plain object
Util.isObject = function (o) {
    return typeof (o) === "object" &&
        Object.prototype.toString.call(o) === '[object Object]';
};

Util.isCircular = function (o) {
    try {
        JSON.stringify(o);
        return false;
    } catch (e) { return true; }
};

/*  recursively adds the properties of an object 'b' to 'a'
    arrays are only shallow copies, so references to the original
    might still be present. Be mindful if you will modify 'a' in the future */
Util.extend = function (a, b) {
    if (!Util.isObject(a) || !Util.isObject(b)) {
        return void console.log("Extend only works with 2 objects");
    }
    if (Util.isCircular(b)) {
        return void console.log("Extend doesn't accept circular objects");
    }
    for (var k in b) {
        if (Util.isObject(b[k])) {
            a[k] = {};
            Util.extend(a[k], b[k]);
            continue;
        }
        if (Array.isArray(b[k])) {
            a[k] = b[k].slice();
            continue;
        }
        a[k] = b[k];
    }
};

Util.isChecked = function (el) {
    // could be nothing...
    if (!el) { return false; }
    // check if it's a dom element
    if (typeof(el.tagName) !== 'undefined') {
        return Boolean(el.checked);
    }
    // sketchy test to see if it's jquery
    if (typeof(el.prop) === 'function') {
        return Boolean(el.prop('checked'));
    }
    // else just say it's not checked
    return false;
};
