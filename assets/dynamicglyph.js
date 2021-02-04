
Game.DynamicGlyph = function(properties) {
    properties = properties || {};
    // call the glyph's constructor with our set of properties
    Game.Glyph.call(this, properties);
    // instantiate any properties from the passed object
    this._name = properties['name'] || '';
    // create an object which will keep track of what mixins we have
    // attached to this entity based on the name property
    this._attachedMixins = {};
    // create a similar object for our groups
    this._attachedMixinGroups = {};
    // set up an object for listeners
    this._listeners = {};
    // set up the object's mixins
    var mixins = properties['mixins'] || [];
    for (var i = 0; i< mixins.length; i++) {
        // copy over all the properties from each mixin as long as it's not
        // the name or the init property. We also make sure not to override
        // a property that already exists on the entity
        for (var key in mixins[i]) {
            if (key != 'init' && key != 'name' && key != 'listeners' &&
                !this.hasOwnProperty(key)) {
                this[key] = mixins[i][key];
            }
        }
        // add the name of this mixin to our attached mixins
        this._attachedMixins[mixins[i].name] = true;
        // if a group name is present, add it
        if (mixins[i].groupName) {
            this._attachedMixinGroups[mixins[i].groupName] = true;
        }
        // add in all our listeners
        if (mixins[i].listeners) {
            for (var key in mixins[i].listeners) {
                // if we don't already have a key for this event in our listeners
                // array, add it
                if (!this._listeners[key]) {
                    this._listeners[key] = [];
                }
                // add the listener
                this._listeners[key].push(mixins[i].listeners[key]);
            }
        }
        // finally, call the init function if there is one
        if (mixins[i].init) {
            mixins[i].init.call(this, properties);
        }
    }
};

// make dynamic glyphs inherit all the functionality from glyphs
Game.DynamicGlyph.extend(Game.Glyph);

Game.DynamicGlyph.prototype.hasMixin = function(obj) {
    // allow the passing of the mixin itself or the name/groupName as a string
    if (typeof obj === 'object') {
        return this._attachedMixins[obj.name];
    } else {
        return this._attachedMixins[obj] || this._attachedMixinGroups[obj];
    }
};

Game.DynamicGlyph.prototype.setName = function(name) {
    this._name = name;
};

Game.DynamicGlyph.prototype.getName = function() {
    return this._name;
};

Game.DynamicGlyph.prototype.describe = function() {
    return this._name;
};

Game.DynamicGlyph.prototype.describeA = function(capitalize) {
    // optional parameter to capitalize the a/an
    var prefixes = capitalize ? ['A', 'An'] : ['a', 'an'];
    var string = this.describe();
    var firstLetter = string.charAt(0).toLowerCase();
    // if word starts with a vowel, use an, else use a
    var prefix = 'aeiou'.indexOf(firstLetter) >= 0 ? 1 : 0;
    return prefixes[prefix] + ' ' + string;
};

Game.DynamicGlyph.prototype.describeThe = function(capitalize) {
    var prefix = capitalize ? 'The' : 'the';
    return prefix + ' ' + this.describe();
}

Game.DynamicGlyph.prototype.raiseEvent = function(event) {
    // make sure we have at lease one listener, or else exit
    if (!this._listeners[event]) {
        return;
    }
    // extract any arguments passed, removing the event name
    var args = Array.prototype.slice.call(arguments, 1);
    // invoke each listener, with this entity as the context and the arguments
    for (var i = 0; i < this._listeners[event].length; i++) {
        this._listeners[event][i].apply(this, args);
    }
}
