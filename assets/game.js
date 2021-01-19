
// check if rot.js can work on the browser
// if (!ROT.isSupported()){ // lol, i guess this function doesn't exist anymore
//     alert("The rot.js library isn't supported by your browser.");
// } else {
//     // Good to go!
// }

// // create a display 80 by 20
// var display = new ROT.Display({width:80, height:20});
// var container = display.getContainer();
// // add the container to our HTML page
// document.body.appendChild(container);

// var foreground, background, colors;
// for (var i=0; i<15; i++){
//     // calculate the foreground color, getting progressively darker
//     // and the background color, getting progressively lighter
//     foreground = ROT.Color.toRGB([255-(i*20),
//                                   255-(i*20),
//                                   255-(i*20)]);

//     background = ROT.Color.toRGB([i*20, i*20, i*20]);
//     // create the color format specifier
//     colors = "%c{" + foreground + "}%b{" + background + "}";
//     // draw the taxt at col 2 and row i
//     display.drawText(2, i, colors + "Hello, world!");
// }
Function.prototype.extend = function(parent) {
	this.prototype = Object.create(parent.prototype);
	this.prototype.constructor = this;
	return this;
}

var Game = {
    _display: null,
    _currentScreen: null,
    _screenWidth: 80,
    _screenHeight: 24,
    init: function() {
        // any necessary initialization will go here
        this._display = new ROT.Display({width: this._screenWidth, height: this._screenHeight + 1});
        // create a helper function for binding to an event and
        // and making it send it to the screen
        var game = this; // so that we don't lose this
        var bindEventToScreen = function (event) {
            window.addEventListener(event, function(e) {
                // when an event is received, send it to the 
                // screen if there is one
                if (game._currentScreen !== null) {
                    game._currentScreen.handleInput(event, e);
                }
            })
        }
        // bind keyboard input events
        bindEventToScreen('keydown');
        // bindEventToScreen('keyup');
        bindEventToScreen('keypress');
    }, 
    getDisplay: function() {
        return this._display;
    },
    getScreenWidth: function() {
        return this._screenWidth;
    },
    getScreenHeight: function() {
        return this._screenHeight;
    },
    refresh: function() {
        // clear the screen
        this._display.clear();
        // render the screen
        this._currentScreen.render(this._display);
    },
    switchScreen: function(screen) {
        // if we had a screen before, notify it that we exited
        if (this._currentScreen !== null) {
            this._currentScreen.exit();
        }
        // clear the display
        this.getDisplay().clear();
        // update our current screen, notify it we entered
        // and then render it
        this._currentScreen = screen;
        if (!this.currentScreen !== null) {
            this._currentScreen.enter();
            this.refresh();
        }
    }
}

window.onload = function() {
    // initialize the gmae
    Game.init();
    // add the container to our HTML page
    document.body.appendChild(Game.getDisplay().getContainer());
    // load the start screen
    Game.switchScreen(Game.Screen.startScreen);
}
