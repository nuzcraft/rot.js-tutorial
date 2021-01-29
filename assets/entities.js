
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
        Game.EntityMixins.InventoryHolder, Game.EntityMixins.FoodConsumer,
        Game.EntityMixins.Sight, Game.EntityMixins.MessageRecipient,
        Game.EntityMixins.Equipper]
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
        Game.EntityMixins.Attacker, Game.EntityMixins.Destructible,
        Game.EntityMixins.CorpseDropper]
});

Game.EntityRepository.define('newt', {
    name: 'newt',
    character: 'n',
    foreground: 'yellow',
    maxHp: 3,
    attackValue: 2,
    mixins: [Game.EntityMixins.WanderActor,
        Game.EntityMixins.Attacker, Game.EntityMixins.Destructible,
        Game.EntityMixins.CorpseDropper]
});

Game.EntityRepository.define('spider', {
    name: 'spider',
    character: 's',
    foreground: 'violet',
    maxHp: 4,
    attackValue: 3,
    mixins: [Game.EntityMixins.WanderActor,
        Game.EntityMixins.Attacker, Game.EntityMixins.Destructible,
        Game.EntityMixins.CorpseDropper]
});
