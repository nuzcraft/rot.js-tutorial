
Game.Builder = function(width, height, depth) {
    this._width = width;
    this._height = height;
    this._depth = depth;
    this._tiles = new Array(depth);
    this._regions = new Array(depth);

    // instantiate the arrays to be multi-dimension
    for (var z = 0; z < depth; z++) {
        // create a new cave at each level
        this._tiles[z] = this._generateLevel();
        // setup the regions array for each depth
        this._regions[z] = new Array(width);
        for (var x = 0; x < width; x++) {
            this._regions[z][x] = new Array(height);
            // fill with zeroes
            for (var y = 0; y < height; y++) {
                this._regions[z][x][y] = 0;
            }
        }
    }
    for (var z = 0; z < this._depth; z++) {
        this._setupRegions(z);
    }
    this._connectAllRegions();
};

Game.Builder.prototype._generateLevel = function() {
    // create the empty map
    var map = new Array(this._width);
    for (var w = 0; w < this._width; w++) {
        map[w] = new Array(this._height);
    }
    // set up the cave generator
    var generator = new ROT.Map.Cellular(this._width, this._height);
    generator.randomize(0.5);
    var totalIterations = 3;
    // iteratively smoothen the map
    for (var i = 0; i < totalIterations - 1; i++) {
        generator.create();
    }
    // smoothen it one last time and then update our map
    generator.create(function(x, y, v) {
        if (v === 1) {
            map[x][y] = Game.Tile.floorTile;
        } else { // 3% chance to be undiggable wall
            var wallTile = Game.Tile.wallTile;
            if (Math.floor(Math.random() * 100) <= 3) {
                wallTile = Game.Tile.undiggableWallTile;
            }
            map[x][y] = wallTile;
        }
    });
    return map;
}

Game.Builder.prototype._canFillRegion = function(x, y, z) {
    // Make sure the tile is within bounds
    if (x < 0 || y < 0 || z < 0 || x >= this._width ||
        y >= this._height || z >= this._depth) {
        return false;
    }
    // make sure the tile does not already have a region
    if (this._regions[z][x][y] != 0) {
        return false;
    }
    // make sure the tile is walkable
    return this._tiles[z][x][y].isWalkable();
}

Game.Builder.prototype._fillRegion = function(region, x, y, z) {
    var tilesFilled = 1;
    var tiles = [{x:x, y:y}];
    var tile;
    var neighbors;
    // update the region of the original tile
    this._regions[z][x][y] = region;
    // keep looping while we still have tiles to process
    while (tiles.length > 0) {
        tile = tiles.pop();
        // get the neighbors of the tile
        neighbors = Game.getNeighborPositions(tile.x, tile.y);
        // iterate through each neighbor, checking if we can use it to fill
        // and if so updating the region and adding it to our processing list
        while (neighbors.length > 0) {
            tile = neighbors.pop();
            if (this._canFillRegion(tile.x, tile.y, z)) {
                this._regions[z][tile.x][tile.y] = region;
                tiles.push(tile);
                tilesFilled++;
            }
        }
    }
    return tilesFilled;
}

// this removes all tiles at a given depth level with a region number.
// it fills the tiles with a wall tile.
Game.Builder.prototype._removeRegion = function(region, z) {
    for (var x = 0; x < this._width; x++) {
        for (var y = 0; y < this._height; y++) {
            if (this._regions[z][x][y] === region) {
                // clear the region and set the tile to a wall tile
                this._regions[z][x][y] = 0;
                this._tiles[z][x][y] = Game.Tile.wallTile
            }
        }
    }
}

// this sets up the regions for a given depth level.
Game.Builder.prototype._setupRegions = function(z) {
    var region = 1;
    var tilesFilled;
    // iterate through all tiles searching for a tile that 
    // can be used as the starting point for a flood fill
    for (var x = 0; x < this._width; x++) {
        for (var y = 0; y < this._height; y++) {
            if (this._canFillRegion(x, y, z)) {
                // try to fill
                tilesFilled = this._fillRegion(region, x, y, z);
                // if it was too small, simply remove it
                if (tilesFilled <= 20) {
                    this._removeRegion(region, z);
                } else {
                    region++;
                }
            }
        }
    }
}

// this fetches a list of points that overlap between one 
// region at a given depth level and a region at a level beneath it
Game.Builder.prototype._findRegionOverlaps = function(z, r1, r2) {
    var matches = [];
    // iterate through all tiles, checking if they respect
    // the region constraints and are floor tiles. We check 
    // that they are floor to make sure we don't try to 
    // put two stairs on the same tile
    for (var x = 0; x < this._width; x++) {
        for (var y = 0; y < this._height; y++) {
            if (this._tiles[z][x][y] == Game.Tile.floorTile &&
                this._tiles[z + 1][x][y] == Game.Tile.floorTile &&
                this._regions[z][x][y] == r1 &&
                this._regions[z + 1][x][y] == r2) {
                matches.push({x: x, y: y});
            }
        }
    }
    // we shuffle the list of matches to prevent bias
    return randomize(matches);
}

// this tries to connect the two regions by calculating where they overlap
// and adding stairs
Game.Builder.prototype._connectRegions = function(z, r1, r2) {
    var overlap = this._findRegionOverlaps(z, r1, r2);
    // make sure ther was overlap
    if (overlap.length == 0) {
        return false;
    }
    // select the first tile from the overlap and change it to stairs
    var point = overlap[0];
    this._tiles[z][point.x][point.y] = Game.Tile.stairsDownTile;
    this._tiles[z + 1][point.x][point.y] = Game.Tile.stairsUpTile;
    return true;
}

// this tries to connect all regions for each depth level
Game.Builder.prototype._connectAllRegions = function() {
    console.log('ConnectAllRegions');
    for (var z = 0; z < this._depth - 1; z++) {
        // iterate through each tile, and if we haven't tried
        // to connect the region of that tile on both depth levels
        // then we try. We store connected properties as strings 
        // for quick lookups
        var connected = {};
        var key; 
        for (var x = 0; x < this._width; x++) {
            for (var y = 0; y < this._height; y++) {
                key = this._regions[z][x][y] + ',' + 
                    this._regions[z + 1][x][y];
                if (this._tiles[z][x][y] == Game.Tile.floorTile &&
                    this._tiles[z + 1][x][y] == Game.Tile.floorTile &&
                    !connected[key]) {
                        // since both tiles are floors and we haven't
                        // already connected the two regions
                        this._connectRegions(z, this._regions[z][x][y],
                            this._regions[z + 1][x][y]);
                        connected[key] = true;
                    }
            }
        }
    }
}

Game.Builder.prototype.getTiles = function() {
    return this._tiles;
}
Game.Builder.prototype.getDepth = function() {
    return this._depth;
}
Game.Builder.prototype.getWidth = function() {
    return this._width;
}
Game.Builder.prototype.getHeight = function() {
    return this._height;
}
