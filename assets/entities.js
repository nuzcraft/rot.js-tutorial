
// create our mixins namespace
Game.EntityMixins = {};

// main player's actor mixin
Game.EntityMixins.PlayerActor = {
    name: 'PlayerActor',
    groupName: 'Actor',
    act: function() {
        // detect if the game is over
        if (this.getHp() < 1) {
            Game.Screen.playScreen.setGameEnded(true);
            // send a message to the player
            Game.sendMessage(this, 'You have died... Press [Enter] to continue!');
        }
        // rerender the screen
        Game.refresh();
        // lock the engine and wait asynchronously
        // for the player to press a key
        this.getMap().getEngine().lock();
        // clear the message queue
        this.clearMessages();
    }
}

Game.EntityMixins.FungusActor = {
    name: 'FungusActor',
    groupName: 'Actor',
    init: function(template) {
        this._growthsRemaining = 5;
        this._percentChanceToSpread = template['percentChanceToSpread'] || 10;
        this._fungusType = template['name'] || 'fungus'
    },
    getPercentChanceToSpread: function() {
        return this._percentChanceToSpread;
    },
    getFungusType: function() {
        return this._fungusType;
    },
    act: function() {
        // check if we are going to try growing this turn
        if (this._growthsRemaining > 0) {
            if  (Math.random() * 100 < this.getPercentChanceToSpread() ) {
                // generate the coordinates of a random adjacent square by
                // generating an offset between [-1,0,1] for both the x and
                // y directions. to do this we generate a number between 0-2
                // then subtract 1
                var xOffset = Math.floor(Math.random() * 3) - 1;
                var yOffset = Math.floor(Math.random() * 3) - 1;
                // make sure we aren't trying to spawn at the same tile as us
                if (xOffset != 0 || yOffset != 0) {
                    // check to see if we can actually spawn at that location, and
                    // if so then we grow!
                    if (this.getMap().isEmptyFloor(this.getX() + xOffset, 
                        this.getY() + yOffset, this.getZ())) {
                        // use getFungusType to check the type of fungus and grow the same kind
                        var entity = Game.EntityRepository.create(this.getFungusType());
                        entity.setPosition(this.getX() + xOffset,
                            this.getY() + yOffset, this.getZ());
                        this.getMap().addEntity(entity);
                        this._growthsRemaining--;
                        // send a message nearby
                        Game.sendMessageNearby(this.getMap(),
                            entity.getX(), entity.getY(), entity.getZ(),
                            'The fungus is spreading!');
                    }
                }
            }
        }
    }
}

Game.EntityMixins.WanderActor = {
    name: 'WanderActor',
    groupName: 'Actor',
    act: function() {
        // flip a coin to determin if moving by one in the positive or negative direction
        var moveOffset = (Math.round(Math.random()) === 1) ? 1 : -1;
        // flip a coin to determine if moving in x or y direction
        if (Math.round(Math.random()) === 1) {
            this.tryMove(this.getX() + moveOffset, this.getY(), this.getZ());
        } else {
            this.tryMove(this.getX(), this.getY() + moveOffset, this.getZ());
        }
    }
};

Game.EntityMixins.Destructible = {
    name: 'Destructible',
    init: function(template) {
        this._maxHp = template['maxHp'] || 10;
        // we allow taking in health from the template in case we want
        // the entity to start with a different amount of HP than the max specified
        this._hp = template['Hp'] || this._maxHp;
        this._defenseValue = template['defenseValue'] || 0;
    },
    getHp: function() {
        return this._hp;
    },
    getMaxHp: function() {
        return this._maxHp;
    },
    getDefenseValue: function() {
        return this._defenseValue;
    },
    takeDamage: function(attacker, damage) {
        this._hp -= damage;
        // if have 0 hp or less, remove ourselves from the map
        if (this._hp <= 0) {
            Game.sendMessage(attacker, 'You kill the %s!', [this.getName()]);
            // check if the player died, and if so call their act method to prompt the user
            if (this.hasMixin(Game.EntityMixins.PlayerActor)) {
                this.act();
            } else {
                this.getMap().removeEntity(this);
            }
        }
    }
}

Game.EntityMixins.Attacker = {
    name: 'Attacker',
    groupName: 'Attacker',
    init: function(template) {
        this._attackValue = template['attackValue'] || 1;
    },
    getAttackValue: function() {
        return this._attackValue;
    },
    attack: function(target) {
        // only remove the entity if they were attackable
        if (target.hasMixin('Destructible')) {
            var attack = this.getAttackValue();
            var defense = target.getDefenseValue();
            var max = Math.max(0, attack - defense);
            var damage = 1 + Math.floor(Math.random() * max);

            Game.sendMessage(this, 'You strike the %s for %d damage!',
                [target.getName(), damage]);
            Game.sendMessage(target, 'The %s strikes you for %d damage!',
                [this.getName(), damage]);
            target.takeDamage(this, damage);
        }
    }
}

Game.EntityMixins.MessageRecipient = {
    name: 'MessageRecipient',
    init: function(template) {
        this._messages = [];
    },
    receiveMessage: function(message) {
        this._messages.push(message);
    },
    getMessages: function() {
        return this._messages;
    },
    clearMessages: function() {
        this._messages = [];
    }
}

// this signifies our entity posseses a field of vision of a given radius
Game.EntityMixins.Sight = {
    name: 'Sight',
    groupName: 'Sight',
    init: function(template) {
        this._sightRadius = template['sightRadius'] || 5;
    },
    getSightRadius: function() {
        return this._sightRadius;
    }
}

Game.EntityMixins.InventoryHolder = {
    name: 'InventoryHolder',
    init: function(template) {
        // default to 10 inventory slots
        var inventorySlots = template['inventorySlots'] || 10;
        // set up empty inventory
        this._items = new Array(inventorySlots);
    },
    getItems: function() {
        return this._items;
    },
    getItem: function(i) {
        return this._items[i];
    },
    addItem: function(item) {
        // try to find a slot, returning true only if we could add the item
        for (var i = 0; i < this._items.length; i++) {
            if (!this._items[i]) {
                this._items[i] = item;
                return true;
            }
        }
        return false;
    },
    removeItem: function(i) {
        // simply cleear the inventory slot
        this._items[i] = null;
    },
    canAddItem: function() {
        // check to see if we have an empty slot
        for (var i = 0; i , this._items.length; i++) {
            if (!this._items[i]) {
                return true;
            }
        }
    },
    pickupItems: function(indices) {
        // allows the user to pick up items from the map, where incices is
        // the indices for the array return by map.getItemsAt
        var mapItems = this._map.getItemsAt(this.getX(), this.getY(), this.getZ());
        var added = 0;
        // iterate through all indices
        for (var i = 0; i < indices.length; i++) {
            // try to add the item, if our inventory is full, then splice the 
            // item out of the list of items. In order to fetch the right item, 
            // we have to offset the number of items already added
            if (this.addItem(mapItems[indices[i] - added])) {
                mapItems.splice(indices[i] - added, 1);
                added++;
            } else {
                // inventory is full
                break;
            }
        }
        // update the map items
        this._map.setItemsAt(this.getX(), this.getY(), this.getZ(), mapItems);
        // return true only if we added all items
        return added === indices.length;
    },
    dropItem: function(i) {
        // drops an item to the current map tile
        if (this._items[i]) {
            if (this._map) {
                this._map.addItem(this.getX(), this.getY(), this.getZ(), this._items[i]);
            }
            this.removeItem(i);
        }
    }
};

Game.sendMessage = function(recipient, message, args) {
    // make sure the recipient can recieve the message
    // before doing any work

    if (recipient.hasMixin('MessageRecipient')) {
        // if args were passed, then we format the message, else
        // no formatting necessary
        if (args) {
            message = vsprintf(message, args);
        }
        recipient.receiveMessage(message);
    }
}

Game.sendMessageNearby = function(map, centerX, centerY, centerZ, message, args) {
    // if args were passed, then we format the message, else no formatting
    if (args) {
        message = vsprintf(message, args);
    }
    // get nearby entities
    entities = map.getEntitiesWithinRadius(centerX, centerY, centerZ, 5);
    // iterate through nearby entities, sending the message
    // if they can recieve it
    for (var i = 0; i < entities.length; i++) {
        if (entities[i].hasMixin('MessageRecipient')) {
            entities[i].receiveMessage(message);
        }
    }
}

// player template
Game.PlayerTemplate = {
    character: '@',
    foreground: 'white',
    maxHp: 40,
    attackValue: 10,
    sightRadius: 6,
    inventorySlots: 22,
    mixins: [Game.EntityMixins.PlayerActor,
        Game.EntityMixins.Attacker, Game.EntityMixins.Destructible,
        Game.EntityMixins.InventoryHolder,
        Game.EntityMixins.Sight, Game.EntityMixins.MessageRecipient]
}

// create our central entity repository
Game.EntityRepository = new Game.Repository('entities', Game.Entity);

Game.EntityRepository.define('fungus', {
    name: 'fungus',
    character: 'f',
    foreground: 'green',
    maxHp: 10,
    percentChanceToSpread: 5,
    mixins: [Game.EntityMixins.FungusActor, Game.EntityMixins.Destructible]
});

Game.EntityRepository.define('red fungus', {
    name: 'red fungus',
    character: 'f',
    foreground: 'red',
    maxHp: 12,
    percentChanceToSpread: 3,
    mixins: [Game.EntityMixins.FungusActor, Game.EntityMixins.Destructible]
});

Game.EntityRepository.define('bat', {
    name: 'bat',
    character: 'b',
    foreground: 'white',
    maxHp: 5,
    attackValue: 4,
    mixins: [Game.EntityMixins.WanderActor,
        Game.EntityMixins.Attacker, Game.EntityMixins.Destructible]
});

Game.EntityRepository.define('newt', {
    name: 'newt',
    character: ':',
    foreground: 'yellow',
    maxHp: 3,
    attackValue: 2,
    mixins: [Game.EntityMixins.WanderActor,
        Game.EntityMixins.Attacker, Game.EntityMixins.Destructible]
});

Game.EntityRepository.define('spider', {
    name: 'spider',
    character: 's',
    foreground: 'violet',
    maxHp: 4,
    attackValue: 3,
    mixins: [Game.EntityMixins.WanderActor,
        Game.EntityMixins.Attacker, Game.EntityMixins.Destructible]
});
