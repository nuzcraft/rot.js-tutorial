
Game.Map.BossCavern = function() {
    // call the map constructor
    Game.Map.call(this, this._generateTiles(80, 24));
};

Game.Map.BossCavern.extend(Game.Map);

Game.Map.BossCavern.prototype._fillCircle = function(tiles, centerX, centerY, radius, tile) {
    var x = radius;
    var y = 0;
    var xChange = 1 - (radius << 1);
    var yChange = 0;
    var radiusError =  0;

    while (x >= y) {
        for (var i = centerX - x; i <= centerX + x; i++) {
            tiles[i][centerY + y] = tile;
            tiles[i][centerY - y] = tile;
        }
        for (var i = centerX - y; i <= centerX + y; i++) {
            tiles[i][centerY + x] = tile;
            tiles[i][centerY - x] = tile;
        }
        y++;
        radiusError += yChange;
        yChange += 2;
        if (((radiusError << 1) + xChange) > 0) {
            x--;
            radiusError += xChange;
            xChange += 2;
        }
    }
};

Game.Map.BossCavern.prototype._generateTiles = function(width, height) {
    // first we create an array, filling it with wall tiles
    var tiles = new Array(width);
    for (var x = 0; x < width; x++) {
        tiles[x] = new Array(height);
        for (var y = 0; y < height; y++) {
            tiles[x][y] = Game.Tile.wallTile;
        }
    }
    // now we determine the radius of the cave to carve out
    var radius = (Math.min(width, height) - 2) / 2;
    this._fillCircle(tiles, width / 2, height / 2, radius, Game.Tile.floorTile);

    // now we randomly position lakes (3-6 lakes)
    var lakes = Math.round(Math.random() * 3) + 3;
    var maxRadius = 2;
    for (var i = 0; i < lakes; i++) {
        // random position, taking into consideration the radius to make
        // sure we are within the bounds
        var centerX = Math.floor(Math.random() * (width - (maxRadius * 2)));
        var centerY = Math.floor(Math.random() * (height - (maxRadius * 2)));
        centerX += maxRadius;
        centerY += maxRadius;
        // random radisu
        var radius = Math.floor(Math.random() * maxRadius) + 1;
        // position the lake!
        this._fillCircle(tiles, centerX, centerY, radius, Game.Tile.waterTile);
    }
    // returnn the tiles in an array as we only have one depth
    return [tiles];
};

Game.Map.BossCavern.prototype.addEntity = function(entity) {
    // call super method
    Game.Map.prototype.addEntity.call(this, entity);
    // if it's a player, place at random position
    if (this.getPlayer() === entity) {
        var position = this.getRandomFloorPosition(0);
        entity.setPosition(position.x, position.y, 0);
        // start the engine
        this.getEngine().start();
    }
}
