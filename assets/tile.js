
Game.Tile = function(properties) {
    properties = properties || {};
    // call the Glyph constructor with our properties
    Game.Glyph.call(this, properties);
    // set up the properties, we use false by default
    this._walkable = properties['walkable'] || false;
    this._diggable = properties['diggable'] || false;
    this._blocksLight = (properties['blocksLight'] !== undefined) ?
        properties['blocksLight']: true;
    this._description = properties['description'] || '';
};

// make the tile inherit the functionality from glyphs
Game.Tile.extend(Game.Glyph);

// standard getters
Game.Tile.prototype.isWalkable = function() {
    return this._walkable;
}

Game.Tile.prototype.isDiggable = function() {
    return this._diggable;
}

Game.Tile.prototype.isBlockingLight = function() {
    return this._blocksLight;
}

Game.Tile.prototype.getDescription = function() {
    return this._description;
}

Game.Tile.nullTile = new Game.Tile({description: '(unkonwn)'});
Game.Tile.floorTile = new Game.Tile({
    character: '.',
    walkable: true,
    blocksLight: false,
    description: 'a cave floor'
});
Game.Tile.wallTile = new Game.Tile({
    character: '#',
    foreground: 'goldenrod',
    diggable: true,
    description: 'a cave wall'
});
Game.Tile.undiggableWallTile = new Game.Tile({
    character: '#',
    foreground: 'peru',
    diggable: false,
    description: 'a rocky cave wall'
});
Game.Tile.stairsUpTile = new Game.Tile({
    character: '<',
    foreground: 'white',
    walkable: true,
    blocksLight: false,
    description: 'a rock staircase leading upwards'
});
Game.Tile.stairsDownTile = new Game.Tile({
    character: '>',
    foreground: 'white',
    walkable: true,
    blocksLight: false,
    description: 'a rock staircase leading downwards'
});
Game.Tile.holeToCavernTile = new Game.Tile({
    character: 'O',
    foreground: 'white',
    walkable: true,
    blocksLight: false,
    description: 'a great dark hole in the ground'
});
Game.Tile.waterTile = new Game.Tile({
    character: '~',
    foreground: 'blue',
    walkable: false,
    blocksLight: false,
    description: 'murky blue water'
});

Game.getNeighborPositions = function(x, y) {
    var tiles = [];
    // generate all possible offsets
    for (var dX = -1; dX < 2; dX++) {
        for (var dY = -1; dY < 2; dY++) {
            // make sure isn't the same tile
            if (dX == 0 && dY == 0) {
                continue;
            }
            tiles.push({x: x + dX, y: y + dY});
        }
    }
    return randomize(tiles);
}

function randomize(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    // while there remain elements to shuffle...
    while (0 != currentIndex) {
        // pick a remaining element
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        // swap it with a current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}
