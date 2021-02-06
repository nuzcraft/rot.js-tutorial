
Game.extend = function(src, dest) {
    // create a copy of the source
    var result = {};
    for (var key in src) {
        result[key] = src[key];
    }
    // copy over all keys from dest
    for (var key in dest) {
        result[key] = dest[key];
    }
    return result;
};
