
// create our mixins namespace
Game.EntityMixins = {};

// main player's actor mixin
Game.EntityMixins.PlayerActor = {
    name: 'PlayerActor',
    groupName: 'Actor',
    act: function() {
        if (this._acting) {
            return;
        }
        this._acting = true;
        this.addTurnHunger();
        // detect if the game is over
        if (!this.isAlive()) {
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
        this._acting = false;
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
        var modifier = 0;
        // take into account defense values from weapons and armor
        if (this.hasMixin(Game.EntityMixins.Equipper)) {
            if (this.getWeapon()) {
                modifier += this.getWeapon().getDefenseValue();
            }
            if (this.getArmor()) {
                modifier += this.getArmor.getDefenseValue();
            }
        }
        return this._defenseValue + modifier;
    },
    takeDamage: function(attacker, damage) {
        this._hp -= damage;
        // if have 0 hp or less, remove ourselves from the map
        if (this._hp <= 0) {
            Game.sendMessage(attacker, 'You kill the %s!', [this.getName()]);
            // if the entity has a corpse dropper mixin, try to add a corpse
            if (this.hasMixin(Game.EntityMixins.CorpseDropper)) {
                this.tryDropCorpse();
            }
            this.kill();
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
        var modifier = 0;
        // if we have item equipped, take their attack and defense values
        // into account
        if (this.hasMixin(Game.EntityMixins.Equipper)) {
            if (this.getWeapon()) {
                modifier += this.getWeapon().getAttackValue();
            }
            if (this.getArmor()) {
                modifier += this.getArmor.getAttackValue();
            }
        }
        return this._attackValue + modifier;
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
        // if we can equip items, make sure we unequip the item we are removing
        if (this._items[i] && this.hasMixin(Game.EntityMixins.Equipper)) {
            this.unequip(this._items[i]);
        }
        // simply clear the inventory slot
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

Game.EntityMixins.FoodConsumer = {
    name: 'FoodConsumer',
    init: function(template) {
        this._maxFullness = template['maxFullness'] || 1000;
        // start halfway to max fullness if no default value
        this._fullness = template['fullness'] || (this._maxFullness / 2);
        // number of points to decrease fullness by every turn
        this._fullnessDepletionRate = template['fullnessDepletionRate'] || 1;
    },
    addTurnHunger: function() {
        // remove the standard depletion points
        this.modifyFullnessBy(-this._fullnessDepletionRate);
    },
    modifyFullnessBy: function(points) {
        this._fullness = this._fullness + points;
        if (this._fullness <= 0) {
            this.kill("You have died of starvation.");
        } else if (this.fullness > this.maxFullness) {
            this.kill("You choke and die!");
        }
    },
    getHungerState: function() {
        // fullness points per percent of max fullness
        var perPercent = this._maxFullness / 100;
        // 5% of max fullness or less = starvign
        if (this._fullness <= perPercent * 5) {
            return 'Starving';
        } else if (this._fullness <= perPercent * 25) {
            return 'Hungry';
        } else if (this._fullness >= perPercent * 95) {
            return 'Oversatiated';
        } else if (this._fullness >= perPercent * 75) {
            return 'Full';
        } else {
            return 'Not Hungry';
        }
    }
}

Game.EntityMixins.CorpseDropper = {
    name: 'CorpseDropper',
    init: function(template) {
        // chance of dropping a corpse (out of 100)
        this._corpseDropRate = template['corpseDropRate'] || 100;
    },
    tryDropCorpse: function() {
        if (Math.round(Math.random() * 100) < this._corpseDropRate) {
            // create a new corpse item and drop it
            this._map.addItem(this.getX(), this.getY(), this.getZ(),
                Game.ItemRepository.create('corpse', {
                    name: this._name + ' corpse',
                    foreground: this._foreground
                }));
        }
    }
};

Game.EntityMixins.Equipper = {
    name: 'Equipper',
    init: function(template) {
        this._weapon = null;
        this._armor = null;
    },
    wield: function(item) {
        this._weapon = item;
    },
    unwield: function() {
        this._weapon = null;
    },
    wear: function(item) {
        this._armor = item;
    },
    takeOff: function() {
        this._armor = null;
    },
    getWeapon: function() {
        return this._weapon;
    },
    getArmor: function() {
        return this._armor;
    },
    unequip: function(item) {
        // helper function to be called before getting rid of an item
        if (this._weapon === item) {
            this.unwield();
        }
        if (this._armor === item) {
            this.takeOff();
        }
    }
};