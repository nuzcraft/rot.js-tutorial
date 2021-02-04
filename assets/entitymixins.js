
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
    setHp: function(hp) {
        this._hp = hp;
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
            // give the attacker experience points
            if (attacker.hasMixin('ExperienceGainer')) {
                var exp = this.getMaxHp() + this.getDefenseValue();
                if (this.hasMixin('Attacker')) {
                    exp += this.getAttackValue();
                }
                // account for level differences
                if (this.hasMixin('ExperienceGainer')) {
                    exp -= (attacker.getLevel() - this.getLevel()) * 3;
                }
                // only give experience if more than 0
                if (exp > 0) {
                    attacker.giveExperience(exp);
                }
            }
        }
    },
    increaseDefenseValue: function(value) {
        // if no value was passed, default to 2
        value = value || 2;
        // add to the defense value
        this._defenseValue += value;
        Game.sendMessage(this, "You look tougher!");
    },
    increaseMaxHp: function(value) {
        // if no value was passed, default to 10
        value = value || 10;
        // add to both max HP and HP
        this._maxHp += value;
        this._hp += value;
        Game.sendMessage(this, "You look healthier!");
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
                modifier += this.getArmor().getAttackValue();
            }
        }
        return this._attackValue + modifier;
    },
    increaseAttackValue: function(value) {
        // if no value was passed, default to 2
        value = value || 2;
        // add to the attack value
        this._attackValue += value;
        Game.sendMessage(this, "You look stronger!");
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
    },
    canSee: function(entity) {
        // if not on the same map or on different floors, then exit early
        if (!entity || this._map !== entity.getMap() || this._z !== entity.getZ()) {
            return false;
        }
        var otherX = entity.getX();
        var otherY = entity.getY();
        // if we're not in a square field of view, then we won't be in a real
        // field of view either
        if ((otherX - this._x) * (otherX - this._x) + 
            (otherY - this._y) * (otherY - this._y) >
            this._sightRadius * this._sightRadius) {
            return false;
        }

        // compute the fov and check the coordinates are in there
        var found = false;
        this.getMap().getFov(this.getZ()).compute(
            this.getX(), this.getY(),
            this.getSightRadius(),
            function(x, y, radius, visibility) {
                if (x === otherX && y === otherY) {
                    found = true;
                }
            }
        );
        return found;
    },
    increasesSightRadius: function(value) {
        // if no value was passed, default to 1
        value = value || 1;
        // add to sight radius
        this._sightRadius += value;
        Game.sendMessage(this, "You are more aware of your surroundings!");
    }
};

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

Game.EntityMixins.TaskActor = {
    name: 'TaskActor',
    groupName: 'Actor',
    init: function(template) {
        // load tasks
        this._tasks = template['tasks'] || ['wander'];
    },
    act: function() {
        // iterate through all our tasks
        for (var i = 0; i < this._tasks.length; i++) {
            if (this.canDoTask(this._tasks[i])) {
                // if we can perform the task, execute the function for it
                this[this._tasks[i]]();
                return;
            }
        }
    },
    canDoTask: function(task) {
        if (task === 'hunt') {
            return this.hasMixin('Sight') && this.canSee(this.getMap().getPlayer());
        } else if (task === 'wander') {
            return true;
        } else {
            throw new Error('Tried to perform undefined task ' + task);
        }
    },
    hunt: function() {
        var player = this.getMap().getPlayer();
        // if we are adjacent to the player, then attack instead of hunting
        var offsets = Math.abs(player.getX() - this.getX()) + 
            Math.abs(player.getY() - this.getY());
        if (offsets === 1) {
            if (this.hasMixin('Attacker')) {
                this.attack(player);
                return;
            }
        }
        // generate the path and move to the first tile
        var source = this;
        var z = source.getZ();
        var path = new ROT.Path.AStar(player.getX(), player.getY(), function(x, y) {
            // if an entity is present at the tile, can't move there
            var entity = source.getMap().getEntityAt(x, y, z);
            if (entity && entity !== player && entity !== source) {
                return false;
            }
            return source.getMap().getTile(x, y, z).isWalkable();
        }, {topology: 4});
        // once we've gotten the path, we want to move to the second cell that is
        // passed in the callback (the first is the entity's starting point)
        var count = 0;
        path.compute(source.getX(), source.getY(), function(x, y) {
            if (count == 1) {
                source.tryMove(x, y, z);
            }
            count++;
        });
    },
    wander: function() {
        // flip a coin to determine if moving by 1 in the positive or negative direction
        var moveOffset = (Math.round(Math.random()) === 1) ? 1 : -1;
        // flip a coin to determine if moving in x direction or y direction
        if (Math.round(Math.random()) === 1) {
            this.tryMove(this.getX() + moveOffset, this.getY(), this.getZ());
        } else {
            this.tryMove(this.getX(), this.getY() + moveOffset, this.getZ());
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

Game.EntityMixins.ExperienceGainer = {
    name: 'ExperienceGainer',
    init: function(template) {
        this._level = template['level'] || 1;
        this._experience = template['experience'] || 0;
        this._statPointsPerLevel = template['statPointsPerLevel'] || 1;
        this._statPoints = 0;
        // determine what stats can be leveled up
        this._statOptions = [];
        if (this.hasMixin('Attacker')) {
            this._statOptions.push(['Increase attack value', this.increaseAttackValue]);
        }
        if (this.hasMixin('Destructible')) {
            this._statOptions.push(['Increase defense value', this.increaseDefenseValue]);
            this._statOptions.push(['Increase max health', this.increaseMaxHp]);
        }
        if (this.hasMixin('Sight')) {
            this._statOptions.push(['Increase sight range', this.increasesSightRadius]);
        }
    },
    getLevel: function() {
        return this._level;
    },
    getExperience: function() {
        return this._experience;
    },
    getNextLevelExperience: function() {
        return (this._level * this._level) * 10;
    },
    getStatPoints: function() {
        return this._statPoints;
    },
    setStatPoints: function(statPoints) {
        this._statPoints = statPoints;
    },
    getStatOptions: function() {
        return this._statOptions;
    },
    giveExperience: function(points) {
        var statPointGained = 0;
        var levelsGained = 0;
        // loop until we've allocated all points
        while (points > 0) {
            // check if adding points will surpass the level threshold
            if (this._experience + points > this.getNextLevelExperience()) {
                // Fill our experienc till the next threshold
                var usedPoints = this.getNextLevelExperience() - this.experience;
                points -= usedPoints;
                this._experience += usedPoints;
                // level up our entity
                this._level++;
                levelsGained++;
                this._statPoints += this._statPointsPerLevel;
                statPointsGained += this._statPointsPerLevel;
            } else {
                // simple case - just give the experience
                this._experience += points;
                points = 0;
            }
        }
        // check if we gained at least one level
        if (levelsGained > 0) {
            Game.sendMessage(this, "You advance to level %d.", [this._level]);
            // heal the entity if possible
            if (this.hasMixin('Destructible')) {
                this.setHp(this.getMaxHp());
            }
            if (this.hasMixin('StatGainer')) {
                this.onGainLevel();
            }
        }
    }
};

Game.EntityMixins.RandomStatGainer = {
    name: 'RandomStatGainer',
    groupName: 'StatGainer',
    onGainLevel: function() {
        var statOptions = this.getStatOptions();
        // randomly select a stat option and execute the callback for each
        // stat point
        while (this.getStatPoints() > 0) {
            // call the stat increasing function with this as the context
            statOptions.random()[1].call(this);
            this.setStatPoints(this.getStatPoints() - 1);
        }
    }
};

Game.EntityMixins.PlayerStatGainer = {
    name: 'PlayerStatGainer',
    groupName: 'StatGainer',
    onGainLevel: function() {
        // setup the gain stat screen and show it
        Game.Screen.gainStatScreen.setup(this);
        Game.Screen.playScreen.setSubScreen(Game.Screen.gainStatScreen);
    }
};
