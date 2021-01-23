
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
    _map: null,
    _player: null,
    _gameEnded: false,
    enter: function() {
        // create a map based on our size parameters
        var width = 100;
        var height = 48;
        var depth = 6;
        // create our map from the tiles and player
        var tiles = new Game.Builder(width, height, depth).getTiles();
        this._player = new Game.Entity(Game.PlayerTemplate);
        this._map = new Game.Map(tiles, this._player);
        // start the map engine
        this._map.getEngine().start();
    },
    move: function(dX, dY, dZ) {
        var newX = this._player.getX() + dX;
        var newY = this._player.getY() + dY;
        var newZ = this._player.getZ() + dZ;
        // try to move to the new cell
        this._player.tryMove(newX, newY, newZ, this._map);
    },
    exit: function() {
        console.log("Exited play screen");
    },
    render: function(display) {
        var screenWidth = Game.getScreenWidth();
        var screenHeight = Game.getScreenHeight();
        // make sure the x axis doesn't go to the left of the left bound
        var topLeftX = Math.max(0, this._player.getX() - (screenWidth / 2));
        // make sure we still have enough space to fit an entire game screen
        topLeftX = Math.min(topLeftX, this._map.getWidth() - screenWidth);
        // make sure the y axis doesn't go above the top bound
        var topLeftY = Math.max(0, this._player.getY() - (screenHeight / 2));
        // make sure we still have enough space to fit an entire game screen
        topLeftY = Math.min(topLeftY, this._map.getHeight() - screenHeight);
        // this object will keep track of all visible map cells
        var visibleCells = {};
        var map = this._map;
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
                    var glyph = this._map.getTile(x, y, currentDepth);
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
        stats += vsprintf('HP: %d/%d ', [this._player.getHp(), this._player.getMaxHp()]);
        display.drawText(0, screenHeight, stats);
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
                }
                // unlock the engine
                this._map.getEngine().unlock();
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
            this._map.getEngine().unlock();
        }
    },
    setGameEnded: function(gameEnded) {
        this._gameEnded = gameEnded;
    }
}

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
    // whether the user can select items at all
    this._canSelectItem = template['canSelect'];
    // wheter the user can select multiple items
    this._canSelectMultipleItems = template['canSelectMultipleItems'];
}
