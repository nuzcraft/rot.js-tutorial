# Rot.js Tutorial
Hello! Welcome to my project for learning rot.js. We'll be following this tutorial:
http://www.codingcookies.com/2013/04/01/building-a-roguelike-in-javascript-part-1/
I've not done *any* research to see if the tutorial goes all the way to the end of a finished game, but regardless, we're gonna take a shot!

### 2020.02.06
Hey! Woo! I finished up the entirety of this tutorial! The end result is a pretty fun game (if a bit easy). I'm not sure where I'm going to take this next, but I had a whole lot of fun.

### 2020.02.05
Hoohah! I finished up the final boss section where we add a new cavern and a Giant Zombie boss. I was able to beat the game, and it was fun! It was cool to see how we could take some of the systems we'd already designed, decouple them from the specifics, and reuse code for slightly different stuff.

### 2020.02.03
This was a pretty interesting section, adding a leveling system. I can see how much fiddling you could do trying to get this balanced and to make sense. Regardless, it was fun setting it up! I like that by leveling up the enemies on lower floors, we give them random stat boosts.

### 2020.02.02
Today was pretty exciting, we tackled giving one of our enemies some basic ai. If we are out of range, they'll wander, but once we're in range, they'll follow us and try to attack. I'm also starting to get a bit better at handling git - but I'm not super good at it yet. Branches are a bit difficult, so I may need to brush up on how branches and remote stuff works with github.

### 2020.01.28
Heyo! Today, we start on part 12, the 'weapons and wearables' section. I'm pretty pumped about this. Weapons and armor are some of the coolest things in games.

This part went a little slow - I was a bit distracted most of the time. But hey, this opened the doors for a lot of cool stuff we can do with weapons and armors down the line. I really liked that we made items multi-purpose.

### 2020.01.27
Alrighty, today we're going to start on Part 11, adding a hunger system. I'm very interested to see how this goes, as well as how we implement using items.

This ended up being a really cool section with a lot of stuff involved. We added a hunger mechanic that will kill the player if the eat too much or too little. We added the ability to eat certain items and eat items more than once. We added the ability for corpses to drop from slain enemies (which can also be eaten). Very fun section! I can see lots of ways to expand upon these bits.

### 2020.01.23
Today I'm going to start on part 10b - Inventory and Item Management. Now that we've added items to the game, it's time for the player to be able to pick them up!

Hoo boy, this was tough to get finished. There was a lot to unpack here, and there wasn't any great chances to test any of it before the code was finished. I'm happy with the result though, it's a simple screen that can server a bunch of purposes and seems like it will be easy to implement for more things later.

### 2020.01.22
Well, progress didn't happen on the 20th, but I came back today and got part 10a finished. Once again, I had issues with some minor typos, but it's cool seeing how easy it is to add both entities and items to the game now the part 10a is finished. Ah, I almost forgot, during this section, I implemented git source control for the project.

### 2020.01.20
Happy Inauguration Day! To celebrate, I'm going to eat some mac n cheese, drink a margarita, and work on some of coding! Today, I'm going to try to tackle part 10a - adding items and an inventory to our game. We'll see how it goes!

### 2020.01.16
Good day! I'm planning on tackling part 9 today!

And I did! it was kinda fun going through and doing the bit of refactoring in this part, and it's nice to see additional creatures start to populate our cave.

### 2020.01.15
Welp, I forgot to write a post for the last couple days. Basically, I went through part 7, but wasn't fully awake, so I ended up having to come back the next day and really clean up the sloppy work that I'd done. Part 7 was _really_ long and it wasn't segmented such that you could do a section, test the code, do a section, test it. It was instead set up so that you had to do the entire part before being able to test your code, which led to a bunch of missed typos and bugs that took too long to sort through at the end. Onwards to part 8a!

Part 8a was a bit shorter, but it makes the game so much more interesting! We added in a field of view for the player so we can't see the whole cave/dungeon all at once. I believe the next part will have us adding in some lingering memory of places we've been which will give us the ability to actually explore the whole cave (and know we've succeeded) if we wish.

Part 8b was _even_ shorter! This just set up a way to see tiles we'd seen before but aren't in our current field of vision. It was interesting to me that we'd store the 'explored' bit outside of the individual tile properties, but it seems to work fine.

### 2020.01.12
Day 4, okay, I forgot to write a post for day 3 - likely because I got super frustrated. Basically, on day 3, I finished the first half of part 5 (part 5a) and on MY LAST TEST the cdn where I was pulling rot.js went down. So, I put it down for a week or so. Today, I finished up debugging my issues with 5a and downloaded a copy of rot so I don't have to worry about the cdn anymore. I also added a couple personal touches to the code thus far with red fungi variants (that currently behave the same as green) and undiggable walls that are a slightly different color than the normal wall. Part 5b was very enjoyable, getting to add in some new mixins for the fungus growth. I implemented a (mostly copied) red fungus actor mixin where the red fungus grows a little slower than the green. Aight - I got part 6 finished as well (though it took longer than expected) and things are coming together! I like the messaging system and how it's entity specific as opposed to just displayed on the screen. For reals tho, the mistypes/fat fingers are real, especially with capitalizing the wrong letters - really tough to track down these sorts of issues.

### 2020.01.03
Day 2, I got through parts 3 and 4, and it's starting to come along well. I got in a fight with the _extend_ function because it only existed in a previous version of ROT.js. Even after finding the function bringing it into the codebase, I still couldn't render the map all because I mistyped 2 commas as periods. SUPER FRUSTRATING, especially when the scripts don't fail at all. It's tough to debug an issue with no error message to follow. 

Here at the end of day 2, we've got a HUGE map, a player that can walk around and dig and it's pretty fricken cool - definitely looking forward to the coming sections.

### 2020.01.02
Day 1, I got through parts one and two. This means we've got a few screens up and running (start, play, win, lose) and the ability to cycle between them. Looking forward to getting into more of the meat of the game soon. It's super interesting to me how some tutorials (or games in general I guess) are written with things like screens first, then gameplay vs the other way around. I think it's probably more valuable to start with gameplay, then integrate infrastructure later, but I can see the value both ways.
