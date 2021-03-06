
Game.Entity = function(properties) {
    properties = properties || {};
    // call the glyph's constructor with our set of properties
    Game.DynamicGlyph.call(this, properties);
    // instantiate any properties from the passed object
    this._name = properties['name'] || '';
    this._x = properties['x'] || 0;
    this._y = properties['y'] || 0;
    this._z = properties['z'] || 0;
    this._map = null;
    this._alive = true;
    // create an object which will keep track what mixins we have
    // attached to the entity based on the name property
    this._attachedMixins = {};
    // create similar object for groups
    this._attachedMixinGroups = {};
    // setup the entity's mixins
    var mixins = properties['mixins'] || [];
    for (var i = 0; i < mixins.length; i++) {
        // copy over all properties from each mixin as long
        // as it's not the name or the init property. We also make sure
        // not to override a property that already exists on an entity
        for (var key in mixins[i]) {
            if (key != 'init' && key != 'name' && !this.hasOwnProperty(key)) {
                this[key] = mixins[i][key];
            }
        }
        // add the name of this mixin to our attached mixins
        this._attachedMixins[mixins[i].name] = true;
        // if a group name is present, add it
        if (mixins[i].groupName) {
            this._attachedMixinGroups[mixins[i].groupName] = true;
        }
        // finally call the init function if there is one
        if (mixins[i].init) {
            mixins[i].init.call(this, properties);
        }
    }
    // acting speed
    this._speed = properties['speed'] || 1000;
};

// make entities inherit all the functionality from glyphs
Game.Entity.extend(Game.DynamicGlyph);

Game.Entity.prototype.setX = function(x) {
    this._x = x;
}

Game.Entity.prototype.setY = function(y) {
    this._y = y;
}

Game.Entity.prototype.setZ = function(z) {
    this._z = z;
}

Game.Entity.prototype.getX = function() {
    return this._x;
}

Game.Entity.prototype.getY = function() {
    return this._y;
}

Game.Entity.prototype.getZ = function() {
    return this._z;
}

Game.Entity.prototype.setMap = function(map) {
    this._map = map;
}

Game.Entity.prototype.getMap = function() {
    return this._map;
}

Game.Entity.prototype.setPosition = function(x, y, z) {
    var oldX = this._x;
    var oldY = this._y;
    var oldZ = this._z;
    // update position
    this._x = x;
    this._y = y;
    this._z = z;
    // if the entity is on a map, notify the map that the entity has moved.
    if (this._map) {
        this._map.updateEntityPosition(this, oldX, oldY, oldZ);
    }
}

Game.Entity.prototype.tryMove = function(x, y, z, map) {
    var map = this.getMap();
    // must use starting z
    var tile = map.getTile(x, y, this.getZ());
    var target = map.getEntityAt(x, y, this.getZ());
    // if our z level changed, check if we are on stairs
    if (z < this.getZ()) {
        if (tile != Game.Tile.stairsUpTile) {
            Game.sendMessage(this, "You can't go up here!");
        } else {
            Game.sendMessage(this, "You ascend to level %d!", [z + 1]);
            this.setPosition(x, y, z);
        }
    } else if (z > this.getZ()) {
        if (tile === Game.Tile.holeToCavernTile &&
            this.hasMixin(Game.EntityMixins.PlayerActor)) {
            // switch the entity to a boss cavern
            this.switchMap(new Game.Map.BossCavern());
        } else if (tile != Game.Tile.stairsDownTile) {
            Game.sendMessage(this, "You can't go down here!");
        } else {
            this.setPosition(x, y, z);
            Game.sendMessage(this, "You descend to level %d!", [z + 1]);
        }
    // if an entity was present at the tile
    } else if (target) {
        // if we are an attacker, try to attack the target
        if (this.hasMixin('Attacker') &&
            (this.hasMixin(Game.EntityMixins.PlayerActor) ||
            target.hasMixin(Game.EntityMixins.PlayerActor))) {
            this.attack(target);
            return true;
        } else {
            // if not, nothing we can do, but we can't move to the tile
            return false;
        }
    // check to see if we can walk on the tile and walk it if we can
    } else if (tile.isWalkable()) {
        // update the entity's position
        this.setPosition(x, y, z);
        // notify the entity that there are items at this position
        var items = this.getMap().getItemsAt(x, y, z);
        if (items) {
            if (items.length === 1) {
                Game.sendMessage(this, "You see %s.", [items[0].describeA()]);
            } else {
                Game.sendMessage(this, "There are several objects here.");
            }
        }
        return true;
    // check if the tile is diggable, and if so try to dig it
    } else if (tile.isDiggable()) {
        // only dig if the entity is the player
        if (this.hasMixin(Game.EntityMixins.PlayerActor)) {
            map.dig(x, y, z);
            return true;
        }
    }
    return false;
};

Game.Entity.prototype.isAlive = function() {
    return this._alive;
};

Game.Entity.prototype.kill = function(message) {
    // only kill once!
    if (!this._alive) {
        return;
    }
    this._alive = false;
    if (message) {
        Game.sendMessage(this, message);
    } else {
        Game.sendMessage(this, "You have died!");
    }

    // check if the player died, and if so call their act method to prmpt the user
    if (this.hasMixin(Game.EntityMixins.PlayerActor)) {
        this.act();
    } else {
        this.getMap().removeEntity(this);
    }
};

Game.Entity.prototype.setSpeed = function(speed) {
    this._speed = speed;
};

Game.Entity.prototype.getSpeed = function() {
    return this._speed;
};

Game.Entity.prototype.switchMap = function(newMap) {
    // if its the same map, nothing to do
    if (newMap === this.getMap()) {
        return;
    };
    this.getMap().removeEntity(this);
    // clear the position
    this._x = 0;
    this._y = 0;
    this._z = 0;
    // add to the new map
    newMap.addEntity(this);
};
