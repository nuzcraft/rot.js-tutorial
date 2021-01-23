
Game.Item = function(properties) {
    properties = properties || {};
    // call the glyph's constructor with our set of properties
    Game.Glyph.call(this, properties);
    // Instantiate any properties from the passed object
    this._name = properties['name'] || '';
};

// make items inherit all the functionality from glyphs
Game.Item.extend(Game.Glyph);

Game.Item.prototype.describe = function() {
    return this._name;
};

Game.Item.prototype.describeA = function(capitalize) {
    // optional parameter to capitalize the a/an
    var prefixes = capitalize ? ['A', 'An'] : ['a', 'an'];
    var string = this.describe();
    var firstLetter = string.charAt(0).toLowerCase();
    // if word starts with a vowel, use an, else use a.
    // note that this is not perfect.
    var prefix = 'aeiou'.indexOf(firstLetter) >= 0 ? 1 : 0;
    return prefixes[prefix] + ' ' + string;
};