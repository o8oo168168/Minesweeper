//Init the game object and render the view:
var elm = document.querySelector('.app');
var game = new Minesweeper(10, 10, 10);
game.drawMap(elm);

/*
var elm2 = document.querySelector('.app2');
var game2 = new Minesweeper(10, 10, 10);
game2.drawMap(elm2);
*/