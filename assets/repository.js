
// a repository has a name and constructor. The constructor is used to create
// items in the repository
Game.Repository = function(name, ctor) {
    this._name = name;
    this._templates = {};
    this._ctor = ctor;
    this._randomTemplates = {};
};

// define a new named template
Game.Repository.prototype.define = function(name, template, options) {
    this._templates[name] = template;
    // apply any options
    var disableRandomCreation = options && options['disableRandomCreation'];
    if (!disableRandomCreation) {
        this._randomTemplates[name] = template;
    }
};

// create an object based on a template
Game.Repository.prototype.create = function(name, extraProperties) {
    if (!this._templates[name]) {
        throw new Error("No template named '" + name + "' in repository '" + 
            this._name + "'");
    }
    // copy the template
    var template = Object.create(this._templates[name]);
    // apply any extra properties
    if (extraProperties) {
        for (var key in extraProperties) {
            template[key] = extraProperties[key];
        }
    }
    // create the object, passing the template as an argument
    return new this._ctor(template);
};

// create an object based on a random template
Game.Repository.prototype.createRandom = function() {
    // pick a random key and create an object based off of it
    return this.create(Object.keys(this._randomTemplates).random());
}

Array.prototype.random = function() {
    if (!this.length) {return null;}
    return this[Math.floor(Math.random() * this.length)];
}
