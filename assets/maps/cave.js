
Game.Map.Cave = function(tiles, player) {
    // call the map constructor
    Game.Map.call(this, tiles);
    this.addEntityAtRandomPosition(player, 0);
    // add random enemies and items to each floor
    for (var z = 0; z < this._depth; z++) {
        // 15 entities per floor
        for (var i = 0; i < 15; i++) {
            // add a random entity
            var entity = Game.EntityRepository.createRandom();
            this.addEntityAtRandomPosition(entity, z);
            // level up the entity based on the floor
            if (entity.hasMixin('ExperienceGainer')) {
                for (var level = 0; level < z; level++) {
                    entity.giveExperience(entity.getNextLevelExperience() -
                        entity.getExperience())
                }
            }
        }
        // 15 items per floor
        for (var i = 0; i < 15; i++) {
            // add a random entity
            this.addItemAtRandomPosition(Game.ItemRepository.createRandom(), z);
        }
    }
    // add weapons and armor to the map in random positions
    var templates = ['dagger', 'sword', 'staff',
        'tunic', 'chainmail', 'platemail'];
    for (var i = 0; i < templates.length; i++) {
        this.addItemAtRandomPosition(Game.ItemRepository.create(templates[i]),
            Math.floor(this._depth * Math.random()));
    }
    // add a hole to the final cavern on the last level
    var holePosition = this.getRandomFloorPosition(this._depth - 1);
    this._tiles[this._depth - 1][holePosition.x][holePosition.y] = 
        Game.Tile.holeToCavernTile;
};

Game.Map.Cave.extend(Game.Map);
