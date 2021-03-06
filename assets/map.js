
Game.Map = function(tiles, player) {
    this._tiles = tiles;
    // cache the width and height based
    // on the length of the dimensions of the tiles array
    this._depth = tiles.length;
    this._width = tiles[0].length;
    this._height = tiles[0][0].length;
    // setup the field of visions
    this._fov = [];
    this.setupFov();
    // create a list which will hold the entities
    this._entities = {};
    // create a table which will hold the items
    this._items = {};
    // create the engine and scheduler
    this._scheduler = new ROT.Scheduler.Speed();
    this._engine = new ROT.Engine(this._scheduler);
    // set up the explored array
    this._explored = new Array(this._depth);
    this._setupExploredArray();
};

// Standard getters
Game.Map.prototype.getDepth = function() {
    return this._depth
};

Game.Map.prototype.getWidth = function() {
    return this._width;
};

Game.Map.prototype.getHeight = function() {
    return this._height;
};

Game.Map.prototype.getEngine = function() {
    return this._engine;
}

Game.Map.prototype.getEntities = function() {
    return this._entities;
}

Game.Map.prototype.getEntityAt = function(x, y, z) {
    // get the entity base on position key
    return this._entities[x + ',' + y + ',' + z];
};

// gets the tile for a given coordinate set
Game.Map.prototype.getTile = function(x, y, z) {
    // make sure we are inside the bounds, if we aren't return null tile
    if (x < 0 || x >= this._width || y < 0 || y >= this._height ||
        z < 0 || z>= this._depth) {
        return Game.Tile.nullTile;
    } else {
        return this._tiles[z][x][y] || Game.Tile.nullTile;
    }
};

Game.Map.prototype.dig = function(x, y, z) {
    // if the tile is diggable, update it to a floor
    if (this.getTile(x, y, z).isDiggable()) {
        this._tiles[z][x][y] = Game.Tile.floorTile;
    }
};

Game.Map.prototype.getRandomFloorPosition = function(z) {
    // randomly generate a tile which is a floor
    var x, y;
    do {
        x = Math.floor(Math.random() * this._width);
        y = Math.floor(Math.random() * this._height);
    } while (!this.isEmptyFloor(x, y, z));
    return {x: x, y: y, z: z};
}

Game.Map.prototype.addEntity = function(entity) {
    // update the entity's map
    entity.setMap(this);
    // update the map with the entity's position
    this.updateEntityPosition(entity);
    // check to see if the entity is an actor, and if so
    // add them to the scheduler
    if (entity.hasMixin('Actor')) {
        this._scheduler.add(entity, true);
    }
    // if the entity is the player, set the player
    if (entity.hasMixin(Game.EntityMixins.PlayerActor)) {
        this._player = entity;
    }
}

Game.Map.prototype.addEntityAtRandomPosition = function(entity, z) {
    var position = this.getRandomFloorPosition(z);
    entity.setX(position.x);
    entity.setY(position.y);
    entity.setZ(position.z);
    this.addEntity(entity);
}

Game.Map.prototype.removeEntity = function(entity) {
    // remove the entity from the map
    var key = entity.getX() + ',' + entity.getY()  + ',' + entity.getZ();
    if (this._entities[key] == entity) {
        delete this._entities[key];
    }
    // if the entity is an actor, remove them from the scheduler
    if (entity.hasMixin('Actor')) {
        this._scheduler.remove(entity);
    }
    // if the entity is the player, update the player field
    if (entity.hasMixin(Game.EntityMixins.PlayerActor)) {
        this._player = undefined;
    }
}

Game.Map.prototype.isEmptyFloor = function(x, y, z) {
    // check if the tile is floor and also has no entity
    return this.getTile(x, y, z) == Game.Tile.floorTile && !this.getEntityAt(x, y, z);
}

Game.Map.prototype.getEntitiesWithinRadius = function(centerX, centerY, centerZ, radius) {
    results = [];
    // determine our bounds
    var leftX = centerX - radius;
    var rightX = centerX + radius;
    var topY = centerY - radius;
    var bottomY = centerY + radius;
    // iterate through our entities, adding any which are within the bounds
    for (var key in this._entities) {
        var entity = this._entities[key];
        if (entity.getX() >= leftX && entity.getX() <= rightX &&
            entity.getY() >= topY && entity.getY() <= bottomY &&
            entity.getZ() == centerZ) {
            results.push(entity);
        }
    }
    return results;
}

Game.Map.prototype.setupFov = function() {
    // keep this in 'map' variable so that we don't lose it
    var map = this;
    // iterate through each depth level, setting up the field of vision
    for (var z = 0; z < this._depth; z++) {
        // we have to put the following code in its own scope to prevent the 
        // depth variabel from being hoisted out of the loop
        (function() {
            var depth = z;
            map._fov.push(
                new ROT.FOV.DiscreteShadowcasting(function(x, y) {
                    return !map.getTile(x, y, depth).isBlockingLight();
                }, {topology: 4})
            );
        })();
    }
}

Game.Map.prototype.getFov = function(depth) {
    return this._fov[depth];
};

Game.Map.prototype._setupExploredArray = function() {
    for (var z = 0; z < this._depth; z++) {
        this._explored[z] = new Array(this._width);
        for (var x = 0; x < this._width; x++) {
            this._explored[z][x] = new Array(this._height);
            for (var y = 0; y < this._height; y++) {
                this._explored[z][x][y] = false;
            }
        }
    }
};

Game.Map.prototype.setExplored = function(x, y, z, state) {
    // only update if the tile is within bounds
    if (this.getTile(x, y, z) !== Game.Tile.nullTile) {
        this._explored[z][x][y] = state;
    }
};

Game.Map.prototype.isExplored = function(x, y, z) {
    // only return the value if within bounds
    if (this.getTile(x, y, z) !== Game.Tile.nullTile) {
        return this._explored[z][x][y];
    } else {
        return false;
    }
}

Game.Map.prototype.updateEntityPosition = function(entity, oldX, oldY, oldZ) {
    // delete the old key if it is the same entity and we have old positions
    if (typeof oldX === 'number') {
        var oldKey = oldX + ',' + oldY + ',' + oldZ;
        if (this._entities[oldKey] == entity) {
            delete this._entities[oldKey];
        }
    }
    // make sure the entity's position is within bounds
    if (entity.getX() < 0 || entity.getX() >= this._width ||
        entity.getY() < 0 || entity.getY() >= this._height ||
        entity.getZ() < 0 || entity.getZ() >= this._depth) {
        throw new Error("Entity's position is out of bounds.")
    }
    // sanity check to make sure there is no entity at the new position
    var key = entity.getX() + ',' + entity.getY() + ',' + entity.getZ();
    if (this._entities[key]) {
        throw new Error('Tried to add an entity at an occupied position.');
    }
    // add the entity to the table of entities
    this._entities[key] = entity;
}

Game.Map.prototype.getItemsAt = function(x, y, z) {
    return this._items[x + ',' + y + ',' + z];
};

Game.Map.prototype.setItemsAt = function(x, y, z, items) {
    // if our items array is empty, then delete the key from the table.
    var key = x + ',' + y + ',' + z;
    if (items.length == 0) {
        if (this._items[key]) {
            delete this._items[key];
        }
    } else {
        // simply update the items at that key
        this._items[key] = items;
    }
};

Game.Map.prototype.addItem = function(x, y, z, item) {
    // if we already have items at the position, simply append
    // the item to the list of items
    var key = x + ',' + y + ',' + z;
    if (this._items[key]) {
        this._items[key].push(item);
    } else {
        this._items[key] = [item];
    }
};

Game.Map.prototype.addItemAtRandomPosition = function(item, z) {
    var position = this.getRandomFloorPosition(z);
    this.addItem(position.x, position.y, position.z, item);
};

Game.Map.prototype.getPlayer = function() {
    return this._player;
};
