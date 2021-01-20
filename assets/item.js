
Game.Item = function(properties) {
    properties = properties || {};
    // call the glyph's constructor with our set of properties
    Game.Glyph.call(this, properties);
    // Instantiate any properties from the passed object
    this._name = properties['name'] || '';
};

// make items inherit all the functionality from glyphs
Game.Item.extend(Game.Glyph);
