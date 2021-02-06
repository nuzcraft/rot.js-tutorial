
Game.Screen = {};

// define our initial start screen
Game.Screen.startScreen = {
    enter: function() {
        console.log("Entered start screen.");
    },
    exit: function() {
        console.log("Exited start screen.");
    },
    render: function(display) {
        // render our prompt to the screen
        display.drawText(1, 1, "%c{yellow}Javascript Roguelike");
        display.drawText(1, 2, "Press [Enter] to start!");
    },
    handleInput: function(inputType, inputData) {
        // when [Enter] is pressed, go to the play screen
        if (inputType === 'keydown') {
            if (inputData.keyCode === ROT.KEYS.VK_RETURN) {
                Game.switchScreen(Game.Screen.playScreen);
            }
        }
    }
}

// Define our playing screen
Game.Screen.playScreen = {
    _player: null,
    _gameEnded: false,
    _subScreen: null,
    enter: function() {
        // create a map based on our size parameters
        var width = 100;
        var height = 48;
        var depth = 6;
        // create our map from the tiles and player
        var tiles = new Game.Builder(width, height, depth).getTiles();
        this._player = new Game.Entity(Game.PlayerTemplate);
        var map = new Game.Map.Cave(tiles, this._player);
        // start the map engine
        map.getEngine().start();
    },
    move: function(dX, dY, dZ) {
        var newX = this._player.getX() + dX;
        var newY = this._player.getY() + dY;
        var newZ = this._player.getZ() + dZ;
        // try to move to the new cell
        this._player.tryMove(newX, newY, newZ, this._player.getMap());
    },
    exit: function() {
        console.log("Exited play screen");
    },
    render: function(display) {
        // render subscreen if there is one
        if (this._subScreen) {
            this._subScreen.render(display);
            return;
        };
        var screenWidth = Game.getScreenWidth();
        var screenHeight = Game.getScreenHeight();
        // make sure the x axis doesn't go to the left of the left bound
        var topLeftX = Math.max(0, this._player.getX() - (screenWidth / 2));
        // make sure we still have enough space to fit an entire game screen
        topLeftX = Math.min(topLeftX, this._player.getMap().getWidth() - screenWidth);
        // make sure the y axis doesn't go above the top bound
        var topLeftY = Math.max(0, this._player.getY() - (screenHeight / 2));
        // make sure we still have enough space to fit an entire game screen
        topLeftY = Math.min(topLeftY, this._player.getMap().getHeight() - screenHeight);
        // this object will keep track of all visible map cells
        var visibleCells = {};
        var map = this._player.getMap();
        var currentDepth = this._player.getZ();
        // find all the visible cells and update the object
        map.getFov(currentDepth).compute(
            this._player.getX(), this._player.getY(),
            this._player.getSightRadius(),
            function(x, y, radius, visbility) {
                visibleCells[x + "," + y] = true;
                map.setExplored(x, y, currentDepth, true);
            }
        );
        // render the explored map cells
        for (var x = topLeftX; x < topLeftX + screenWidth; x++) {
            for (var y = topLeftY; y < topLeftY + screenHeight; y++) {
                if (map.isExplored(x, y, currentDepth)) {
                    // fetch the glyph for the tile and render it to the screen
                    // at the offset position
                    var glyph = map.getTile(x, y, currentDepth);
                    var foreground = glyph.getForeground();
                    // if we are at a cell that is in the field of vision, we need
                    // to check if there are items or entities
                    if (visibleCells[x + ',' + y]) {
                        // check for items first, since we want to draw entities over items
                        var items  = map.getItemsAt(x, y, currentDepth);
                        // if we have multiple items, render the top most item
                        if (items) {
                            glyph = items[items.length - 1];
                        }
                        // check if we have an entity at the position
                        if (map.getEntityAt(x, y, currentDepth)) {
                            glyph = map.getEntityAt(x, y, currentDepth);
                        }
                        // update the foreground color in case our glyph changed
                        foreground = glyph.getForeground();
                    } else {
                        // since the tile was previously explored, but is not visible
                        // we want to change the foreground color to dark grey
                        foreground = 'darkGrey';
                    }
                    display.draw(
                        x - topLeftX,
                        y - topLeftY,
                        glyph.getChar(),
                        foreground,
                        glyph.getBackground());
                }
            }
        };
        // get the messages in the player's queue and render them
        var messages = this._player.getMessages();
        var messageY = 0;
        for (var i = 0; i < messages.length; i++) {
            // draw each message, adding the number of lines
            messageY += display.drawText(
                0,
                messageY,
                '%c{white}%b{black}' + messages[i]
            );
        }
        // render player hp
        var stats = '%c{white}%b{black}';
        stats += vsprintf('HP: %d/%d L: %d XP: %d',
            [this._player.getHp(), this._player.getMaxHp(),
            this._player.getLevel(), this._player.getExperience()]);
        display.drawText(0, screenHeight, stats);
        // render hunger state
        var hungerState = this._player.getHungerState();
        display.drawText(screenWidth - hungerState.length, screenHeight, hungerState);
    },
    handleInput: function(inputType, inputData) {
        // if the game is over, enter will bring the user to the losing screen.
        if (this._gameEnded) {
            if (inputType === 'keydown' && inputData.keyCode === ROT.KEYS.VK_RETURN) {
                Game.switchScreen(Game.Screen.loseScreen);
            }
            // retun to tmake sure the user can't still play
            return
        }
        // handle subscreen input if there is one
        if (this._subScreen) {
            this._subScreen.handleInput(inputType, inputData);
            return;
        };
        if (inputType === 'keydown') {
            // if enter is pressed, go to the win screen
            // if escape is pressed, go to the lose screen
            if (inputData.keyCode === ROT.KEYS.VK_RETURN) {
                Game.switchScreen(Game.Screen.winScreen);
            } else if (inputData.keyCode === ROT.KEYS.VK_ESCAPE) {
                Game.switchScreen(Game.Screen.loseScreen);
            } else {
                // movement
                if (inputData.keyCode === ROT.KEYS.VK_LEFT) {
                    this.move(-1, 0, 0);
                } else if (inputData.keyCode === ROT.KEYS.VK_RIGHT) {
                    this.move(1, 0, 0);
                } else if (inputData.keyCode === ROT.KEYS.VK_UP) {
                    this.move(0, -1, 0);
                } else if (inputData.keyCode === ROT.KEYS.VK_DOWN) {
                    this.move(0, 1, 0);
                } else if (inputData.keyCode === ROT.KEYS.VK_I) {
                    // show the inventory
                    this.showItemsSubScreen(Game.Screen.inventoryScreen, this._player.getItems(),
                        'You are not carrying anything.');
                } else if (inputData.keyCode === ROT.KEYS.VK_D) {
                    // show the eat screen
                    this.showItemsSubScreen(Game.Screen.dropScreen, this._player.getItems(),
                        'You have nothing to drop.');
                } else if (inputData.keyCode === ROT.KEYS.VK_E) {
                    // show the eat screen
                    this.showItemsSubScreen(Game.Screen.eatScreen, this._player.getItems(),
                        'You have nothing to eat.');
                } else if (inputData.keyCode === ROT.KEYS.VK_W) {
                    if (inputData.shiftKey) {
                        // show the wear screen
                        this.showItemsSubScreen(Game.Screen.wearScreen, this._player.getItems(),
                            'You have nothing to wear.');
                    } else {
                        // show the wield screen
                        this.showItemsSubScreen(Game.Screen.wieldScreen, this._player.getItems(),
                            'You have nothing to wield.');
                    }
                    return;
                } else if (inputData.keyCode === ROT.KEYS.VK_X) {
                    // show the drop screen
                    this.showItemsSubScreen(Game.Screen.examineScreen, this._player.getItems(),
                        'You have nothing to examine.');
                    return;
                }else if (inputData.keyCode === ROT.KEYS.VK_COMMA) {
                    var items = this._player.getMap().getItemsAt(this._player.getX(), this._player.getY(), this._player.getZ());
                    // if there is only one item, directly pick it up
                    if (items && items.length === 1) {
                        var item = items[0];
                        if (this._player.pickupItems([0])) {
                            Game.sendMessage(this._player, "You pick up %s.", [item.describeA()]);
                        } else {
                            Game.sendMessage(this._player, "Your inventory is full! Nothing was picked up.");
                        }
                    } else {
                        this.showItemsSubScreen(Game.Screen.pickupScreen, items,
                            'There is nothing here to pick up.');
                    }
                } else {
                    // not a valid key
                    return;
                }
                // unlock the engine
                this._player.getMap().getEngine().unlock();
            }
        } else if (inputType === 'keypress') {
            var keyChar = String.fromCharCode(inputData.charCode);
            if (keyChar === '>') {
                this.move(0, 0, 1);
            } else if (keyChar === '<') {
                this.move(0, 0, -1);
            } else {
                // not a valid key
                return;
            }
            // unlock the engine
            this._player.getMap().getEngine().unlock();
        }
    },
    setGameEnded: function(gameEnded) {
        this._gameEnded = gameEnded;
    },
    setSubScreen: function(subScreen) {
        this._subScreen = subScreen;
        // refresh screen on changing the subscreen
        Game.refresh();
    },
    showItemsSubScreen: function(subScreen, items, emptyMessage) {
        if (items && subScreen.setup(this._player, items) > 0) {
            this.setSubScreen(subScreen);
        } else {
            Game.sendMessage(this._player, emptyMessage);
            Game.refresh();
        }
    }
};

// Define our winning screen
Game.Screen.winScreen = {
    enter: function() {
        console.log("Entered win screen");
    },
    exit: function() {
        console.log("Exited win screen");
    },
    render: function(display) {
        // render our prompt to the screen
        for (var i=0; i<22; i++) {
            // generate random background colors
            var r = Math.round(Math.random() *255);
            var g = Math.round(Math.random() *255);
            var b = Math.round(Math.random() *255);
            var background = ROT.Color.toRGB([r, g,  b]);
            display.drawText(2, i+1, "%b{" + background + "}You win!");
        }
    },
    handleInput: function(inputType, inputData) {
        // nothing to do here
    }
}

// define our losing screen
Game.Screen.loseScreen = {
    enter: function() {
        console.log("Entered lose screen");
    },
    exit: function() {
        console.log("Exited lose screen");
    },
    render: function(display) {
        // render our prompt to the screen
        for (var i=0;i<22;i++) {
            display.drawText(2, i+1, "%b{red}You lose! :(");
        }
    },
    handleInput: function(inputType, inputData) {
        // nothing to do here
    }
}

Game.Screen.ItemListScreen = function(template) {
    // set up based on the template
    this._caption = template['caption'];
    this._okFunction = template['ok'];
    // by default, we can use the identity function
    this._isAcceptableFunction = template['isAcceptable'] || function(x) {
        return x;
    }
    // whether the user can select items at all
    this._canSelectItem = template['canSelect'];
    // wheter the user can select multiple items
    this._canSelectMultipleItems = template['canSelectMultipleItems'];
    // whether a 'no item' option should appear
    this._hasNoItemOption = template['hasNoItemOption'];
}

Game.Screen.ItemListScreen.prototype.setup = function(player, items) {
    this._player = player;
    // should be called before switching to the screen
    var count = 0;
    // iterate over each item, keeping only the acceptable ones and counting
    // the number of acceptable items
    var that = this;
    this._items = items.map(function(item) {
        //  transform the item into null if it's not acceptable
        if (that._isAcceptableFunction(item)) {
            count++;
            return item;
        } else {
            return null;
        }
    });
    // clearn set of selected indicies
    this._selectedIndices = {};
    return count;
};

Game.Screen.ItemListScreen.prototype.render = function(display) {
    var letters = 'abcdefghijklmnopqrstuvwxyz';
    // rendeer the caption in the top row
    display.drawText(0, 0, this._caption);
    // render the no item row if enabled
    if (this._hasNoItemOption) {
        display.drawText(0, 1, '0 - no item');
    }
    var row = 0;
    for (var i = 0; i < this._items.length; i++) {
        // if we have an item, we want to render it
        if (this._items[i]) {
            // get the letter matching the item's index
            var letter = letters.substring(i, i + 1);
            // if we have selected an item, show a +, else show a dash between
            // the letter and the item's name
            var selectionState = (this._canSelectItem && this._canSelectMultipleItems &&
                this._selectedIndices[i]) ? '+' : '-';
            // check if the item is worn or wielded
            var suffix = '';
            if (this._items[i] === this._player.getArmor()) {
                suffix = ' (wearing)';
            } else if (this._items[i] === this._player.getWeapon()) {
                suffix = ' (wielding)';
            }
            // render at the correct row and add 2
            display.drawText(0, 2 + row, letter + ' ' + selectionState + ' ' + 
                this._items[i].describe() + suffix);
            row++;
        }
    }
};

Game.Screen.ItemListScreen.prototype.executeOkFunction = function()  {
    // gather the selected items
    var selectedItems = {};
    for (var key in this._selectedIndices) {
        selectedItems[key] = this._items[key];
    }
    // switch back to the play screen
    Game.Screen.playScreen.setSubScreen(undefined);
    // call the OK function and end the player's turn if it returns true
    if (this._okFunction(selectedItems)) {
        this._player.getMap().getEngine().unlock();
    }
};

Game.Screen.ItemListScreen.prototype.handleInput = function(inputType, inputData) {
    if (inputType === 'keydown') {
        // if the user hit escape, hit enter and can't select an item, or hit
        // enter without any items selecte, simply cancel out
        if (inputData.keyCode === ROT.KEYS.VK_ESCAPE ||
            (inputData.keyCode === ROT.KEYS.VK_RETURN &&
                (!this._canSelectItem || Object.keys(this._selectedIndices).length === 0))) {
            Game.Screen.playScreen.setSubScreen(undefined);
        // handle pressing return when items are selected
        } else if (inputData.keyCode === ROT.KEYS.VK_RETURN) {
            this.executeOkFunction();
        // handle pressing zero when 'no item' selection is enabled
        } else if (this._canSelectItem && this._hasNoItemOption && inputData.keyCode === ROT.KEYS.VK_0) {
            this._selectedIndices = {};
            this.executeOkFunction();
        // handle pressing return when items are selected
        } else if (this._canSelectItem && inputData.keyCode >= ROT.KEYS.VK_A &&
            inputData.keyCode <= ROT.KEYS.VK_Z) {
            // chec if it maps to a valid item by subtracting 'a' from the character
            // to know what letter of the alphabet we used
            var index = inputData.keyCode - ROT.KEYS.VK_A;
            if (this._items[index]) {
                // if multiple selection is allowed, toggle the selection status, else
                // select the item and exit the screen
                if (this._canSelectMultipleItems) {
                    if (this._selectedIndices[index]) {
                        delete this._selectedIndices[index];
                    } else {
                        this._selectedIndices[index] = true;
                    }
                    // Redraw screen
                    Game.refresh();
                } else {
                    this._selectedIndices[index] = true;
                    this.executeOkFunction();
                }
            }
        }
    }
};

Game.Screen.inventoryScreen = new Game.Screen.ItemListScreen({
    caption: 'Inventory',
    canSelect: false
});

Game.Screen.pickupScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the items you wish to pick up',
    canSelect: true,
    canSelectMultipleItems: true,
    ok: function(selectedItems) {
        // try to pick up all items, messaging the player if they couldn't all be
        // picked up
        if (!this._player.pickupItems(Object.keys(selectedItems))) {
            Game.sendMessage(this._player, "Your inventory is full! Not all items were picked up.");
        }
        return true;
    }
});

Game.Screen.dropScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the item you wish to drop',
    canSelect: true,
    canSelectMultipleItems: false,
    ok: function(selectedItems) {
        // drop the selected item
        this._player.dropItem(Object.keys(selectedItems)[0]);
        return true;
    }
});

Game.Screen.eatScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the item you wish to eat',
    canSelect: true,
    canSelectMultipleItems: false,
    isAcceptable: function(item) {
        return item && item.hasMixin('Edible');
    },
    ok: function(selectedItems) {
        // eat the item, removing it if there are no consumptions remaining
        var key = Object.keys(selectedItems)[0];
        var item = selectedItems[key];
        Game.sendMessage(this._player, "You eat %s.", [item.describeThe()]);
        item.eat(this._player);
        if (!item.hasRemainingConsumptions()) {
            this._player.removeItem(key);
        }
        return true;
    }
});

Game.Screen.wieldScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the item you wish to wield.',
    canSelect: true,
    canSelectMultipleItems: false,
    hasNoItemOption: true,
    isAcceptable: function(item) {
        return item && item.hasMixin('Equippable') && item.isWieldable();
    },
    ok: function(selectedItems) {
        // check if we selected 'no item'
        var keys = Object.keys(selectedItems);
        if (keys.length === 0) {
            this._player.unwield();
            Game.sendMessage(this._player, "You are empty handed.");
        } else {
            // make sure to unequip the item first in case it is the armor
            var item = selectedItems[keys[0]];
            this._player.unequip(item);
            this._player.wield(item);
            Game.sendMessage(this._player, "You are wielding %s.", [item.describeA()]);
        }
        return true;
    }
});

Game.Screen.wearScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the item you wish to wear.',
    canSelect: true,
    canSelectMultipleItems: false,
    hasNoItemOption: true,
    isAcceptable: function(item) {
        return item && item.hasMixin('Equippable') && item.isWearable();
    },
    ok: function(selectedItems) {
        // check if we selected 'no item'
        var keys = Object.keys(selectedItems);
        if (keys.length === 0) {
            this._player.unwield();
            Game.sendMessage(this._player, "You are not wearing anything.");
        } else {
            // make sure to unequip the item first in case it is the armor
            var item = selectedItems[keys[0]];
            this._player.unequip(item);
            this._player.wear(item);
            Game.sendMessage(this._player, "You are wearing %s.", [item.describeA()]);
        }
        return true;
    }
});

Game.Screen.gainStatScreen = {
    setup: function(entity) {
        // must be called before rendering
        this._entity = entity;
        this._options = entity.getStatOptions();
    },
    render: function(display) {
        var letters = 'abcdefghijklmnopqrstuvwxyz';
        display.drawText(0, 0, 'Choose a stat to increase: ');

        // iterate through each of our options
        for (var i = 0; i < this._options.length; i++) {
            display.drawText(0, 2 + i,
                letters.substring(i, i + 1) + ' - ' + this._options[i][0]);
        }

        // render remaining stat points
        display.drawText(0, 4 + this._options.length,
            "Remaining points: " + this._entity.getStatPoints());
    },
    handleInput: function(inputType, inputData) {
        if (inputType === 'keydown') {
            // if a letter was pressed, check if ti matches to a valid option
            if (inputData.keyCode >= ROT.KEYS.VK_A && inputData.keyCode <= ROT.KEYS.VK_Z) {
                // check if it maps to a valid item by subtracting 'a' from the character
                // to know what letter of the alphabet we used
                var index = inputData.keyCode - ROT.KEYS.VK_A;
                if (this._options[index]) {
                    // call the stat increasing function
                    this._options[index][1].call(this._entity);
                    // decrease stat points
                    this._entity.setStatPoints(this._entity.getStatPoints() - 1);
                    // if we have no stat points left, exit the screen, else refresh
                    if (this._entity.getStatPoints() == 0) {
                        Game.Screen.playScreen.setSubScreen(undefined);
                    } else {
                        Game.refresh();
                    }
                }
            }
        }
    }
};

Game.Screen.examineScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the item you wish to examine.',
    canSelect: true,
    canSelectMultipleItems: false,
    isAcceptable: function(item) {
        return true;
    },
    ok: function(selectedItems) {
        var keys = Object.keys(selectedItems);
        if (keys.length > 0) {
            var item = selectedItems[keys[0]];
            Game.sendMessage(this._player, "It's %s (%s).",
                [
                    item.describeA(false),
                    item.details()
                ]);
        }
        return true;
    }
});
