/*
 * Minesweeper class
 *
 * @rows: the row of the map.
 * @cols: the cols of the map.
 * @bomb: the number of the bomb.
 *
 */
function Minesweeper(rows, cols, bomb) {
    if(bomb > rows * cols || typeof rows !== 'number' || typeof cols !== 'number' || typeof bomb !== 'number')
        throw 'Minesweeper: invalid arguments setting.'

    //arguments copy: to reuse it for reset the game.
    this.argvrows = rows;
    this.argvcols = cols;
    this.argvbomb = bomb;

    this.init(rows, cols, bomb);  //init status
}

/*
 * Minesweeper init & createMap method
 * To set the init attributes of the object.
 */
Minesweeper.prototype.init = function(rows, cols, bomb) {
    // Class attributes:
    this.bombList = [];
    this.markList = [];
    this.map = this.createMap(rows, cols, bomb);
    this.gameStatus = 'halt'; // halt | start | win | lose
    this.timer = 0;  // sec (maxium 999)
    this.bombNum = bomb;

    this.timerInterval;
    this.containerElm;
    this.containerClassName;
};
Minesweeper.prototype.createMap = function(rows, cols, bomb) {
    //A. Build the 2 dementional array.
    let map = [];
    for(let i = 0; i < rows; i++){
        map[i] = [];
        for(let j = 0; j < cols; j++){
            map[i].push('-');
        }
    }

    //B. Place the bomb randomly.
    let bombCount = 0;
    while(bombCount < bomb){
        let row = Math.floor(Math.random() * Math.floor(rows));
        let col = Math.floor(Math.random() * Math.floor(cols));

        if(map[row][col] !== 'B'){
            map[row][col] = 'B';
            this.bombList.push(`${row},${col}`);
            bombCount++;
        }
    }

    //C. Calculate the number of every block.
    for(let i = 0; i < rows; i++){
        for(let j = 0; j < cols; j++){
            if(map[i][j] === 'B')
                continue;

            let count = 0;
            // Check the neighbors
            // 0|1|2
            // 3|x|4
            // 5|6|7
            //row - 1:
            if(i-1 >= 0){
                if(j-1 >= 0 && map[i-1][j-1] === 'B') count++;      //0
                if(map[i-1][j] === 'B') count++;                    //1
                if(j+1 < cols && map[i-1][j+1] === 'B') count++;    //2
            }
            //current row:
            if(j-1 >= 0 && map[i][j-1] === 'B') count++;            //3
            if(j+1 < cols && map[i][j+1] === 'B') count++;          //4
            //row + 1:
            if(i+1 < rows){
                if(j-1 >= 0 && map[i+1][j-1] === 'B') count++;      //5
                if(map[i+1][j] === 'B') count++;                    //6
                if(j+1 < cols && map[i+1][j+1] === 'B') count++;    //7
            }

            map[i][j] = count + "";
        }
    }

    //D. Return the map array.
    return map;
};

/*
 * Minesweeper drawMap method
 * Draw the game interface by using the map attribute, and add the eventListener.
 * 
 * @domElm: the target DOM element
 * 
 */
Minesweeper.prototype.drawMap = function (domElm) {
    this.containerElm = domElm; //make a pointer to the container DOM so that it can be easier to reset the game
    this.containerClassName = "." + domElm.attributes.class.value;

    //A. Prepare .row & .block:
    let blocks = "";
    for(let i = 0; i < this.map.length; i++){
        blocks += "<div class='game__map__row'>"
        for(let j = 0; j < this.map[0].length; j++){
            blocks += `<div class='game__map__row__block' data-coordinate='${i},${j}' data-visit='0'></div>`;
        }
        blocks += "</div>";
    } 

    //B. Draw .header & .map:
    //set the width(depends on the number of cols)
    const containerWidth = 26.5 * this.map[0].length; //26.5 * 26.5 px per block
    domElm.innerHTML = `
        <div class='game' style='width: ${containerWidth}px'>
            <div class='game__header' style='width: ${containerWidth - 6/*border width*/}px'>
                <div class='game__header__counter game__header__counter--bomb'>0</div>
                <div class='game__header__icon'>
                  <p class='game__header__icon__face fas fa-smile'></p>
                </div>
                <div class='game__header__counter game__header__counter--time'>0</div>
            </div>
            <div class='game__map'>
                ${blocks}
            </div>
        </div>
    `;    

    //C. Add eventListener:
    //C-1. Blocks
    const self = this;
    let blockElms = document.querySelectorAll(`${this.containerClassName} .game__map__row__block`);
    blockElms.forEach(function(node) {
        node.addEventListener('click', function(e) {
            self.blockEventFunc(e);
        });
        node.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            self.blockEventFunc(e);
        });
    })
    //C-2. Set the bomb-counter
    const bombCounterElm = document.querySelector(`${this.containerClassName} .game__header__counter--bomb`);
    bombCounterElm.innerHTML = self.bombNum;

    //C-3. Face icon
    const faceIconElm = document.querySelector(`${this.containerClassName} .game__header__icon`);
    faceIconElm.addEventListener('click', function() {
        self.resetGame();
    });
};
Minesweeper.prototype.blockEventFunc = function(e){
    //don't do anything if the game is end or if the block is revealed already.
    const target = e.target;
    const isRevealed = e.target.attributes.class.value.indexOf('game__map__row__block--revealed') === -1 ? false : true ;
    if(this.gameStatus === 'win' || this.gameStatus === 'lose' || isRevealed ) return; //don't do anything if the game is end or the block is revealed

    //A. If the game hasn't started yet -> start the game
    if(this.gameStatus === 'halt') this.startGame();

    const isFlag = target.attributes.class.value.indexOf('game__map__row__block--flag') !== -1;
    const coordinate = target.attributes['data-coordinate'].value;
    const row = parseInt(coordinate.split(',')[0]);
    const col = parseInt(coordinate.split(',')[1]);
    
    //B. If mouseclick event -> reveal the block
    if(e.type === 'click'){
        //do nothing if the block is flagged
        if(isFlag) return;
        //reveal the block
        //if(!this.isBlockMarked(row, col)) this.revealBlock(row, col);
        if(!isFlag) this.revealBlock(row, col);

        //if the block is 0 trigger sweep method
        if(this.map[row][col] === '0'){
            this.sweep(row, col);
            this.clearVisitMark();
        }else if(this.map[row][col] === 'B'){
        //if the block is a bomb -> gameover (end the program)
            this.endGame('lose');
        }

        // Check is the player win
        // Check reveled block's length 
        const revealedBlocksLen = document.querySelectorAll('.game__map__row__block--revealed').length;
        const maxRevealedBlocks = parseInt(this.argvrows) * parseInt(this.argvcols) - parseInt(this.argvbomb);
        // If the length equals to (blocks - bombs) -> check all the coordinates in the bombList (to make sure, or don't)
        if(revealedBlocksLen === maxRevealedBlocks && this.gameStatus !== 'lose'){
            //const self = this;
            //let isPlayerWin = true;
            //this.bombList.forEach(function(coordinate) {
            //    console.log(coordinate);
            //    const target = document.querySelector(`${self.containerClassName} .game__map__row__block[data-coordinate='${coordinate}']`);
            //    const isRevealed = target.attributes.class.value.indexOf('game__map__row__block--revealed') === -1 ? false : true ;
            //    console.log(isRevealed, isPlayerWin);
            //    if(isRevealed) isPlayerWin = false;
            //});
            
            //if(isPlayerWin){
                this.endGame('win');
            //};
        }
    }

    if(e.type === 'contextmenu'){
        //trigger mark method
        this.mark(target, row, col);
    }
}
Minesweeper.prototype.revealBlock = function(row, col) {
    //If the block is not reveled -> add the revealed class
    if(!this.isBlockRevealed(row, col)){
        const target = document.querySelector(`${this.containerClassName} .game__map__row__block[data-coordinate='${row},${col}']`);
        target.classList.add('game__map__row__block--revealed');
        target.classList.add(`game__map__row__block--revealed--${this.map[row][col]}`);
        if(this.map[row][col] === 'B'){
            target.classList.add('fas');
            target.classList.add('fa-bomb');
        }
        target.classList.remove('fa-question'); //remove the question-mark if exist
        target.innerHTML = this.map[row][col] !== '0' && this.map[row][col] !== 'B' ? this.map[row][col] : '';
    }
};
Minesweeper.prototype.isBlockRevealed = function(row, col) {
    if(row < 0 || col < 0 || row >= this.argvrows || col >= this.argvcols) return true;     // for the one that is out of the border

    //Select the block on the coordinate
    const target = document.querySelector(`${this.containerClassName} .game__map__row__block[data-coordinate='${row},${col}']`);
    if(target.attributes.class.value.indexOf('game__map__row__block--revealed') !== -1){
        return true;
    }else{
        return false;
    }
};
Minesweeper.prototype.isBlockVisited = function(row, col) {
    const target = document.querySelector(`${this.containerClassName} .game__map__row__block[data-coordinate='${row},${col}']`);
    if(target.attributes['data-visit'].value === '0'){
        return false;
    }else{
        return true;
    }
};
Minesweeper.prototype.markAsVisit = function(row, col) {
    const target = document.querySelector(`${this.containerClassName} .game__map__row__block[data-coordinate='${row},${col}']`);
    target.setAttribute("data-visit", "1");
}
Minesweeper.prototype.clearVisitMark = function() {
    const target = document.querySelectorAll(`${this.containerClassName} .game__map__row__block[data-visit='1']`);
    target.forEach(function(block){
        block.setAttribute("data-visit", "0");
    })
};
Minesweeper.prototype.isBlockMarked = function(row, col) {
    if(row < 0 || col < 0 || row >= this.argvrows || col >= this.argvcols) return true;     // for the one that is out of the border

    const target = document.querySelector(`${this.containerClassName} .game__map__row__block[data-coordinate='${row},${col}']`);
    isFlag = target.attributes.class.value.indexOf('game__map__row__block--flag') !== -1;
    isQuestionmark = target.attributes.class.value.indexOf('game__map__row__block--questionmark') !== -1;

    if(isFlag || isQuestionmark){
        return true;
    }else{
        return false;
    }
};
Minesweeper.prototype.sweep = function(row, col) {
    //console.log('sweep[201]: ', row, col);

    //A. Check the neighbors and open the path
    // 0|1|2
    // 3|x|4
    // 5|6|7
    //row - 1:
    if(row-1 >= 0){
        //0
        if(col-1 >= 0){
            if(this.map[row-1][col-1] === '0'){
                //reveal and trigger the sweep method again if the block is not revealed
                if(!this.isBlockVisited(row-1, col-1)){
                    if(!this.isBlockMarked(row-1, col-1)) this.revealBlock(row-1, col-1);
                    this.markAsVisit(row-1, col-1);
                    this.sweep(row-1, col-1);
                }
            }else if(this.map[row-1][col-1] !== 'B'){
                //reveal the block
                if(!this.isBlockMarked(row-1, col-1)) this.revealBlock(row-1, col-1);
            }
        }

        //1
        if(this.map[row-1][col] === '0'){
            //reveal and trigger the sweep method again if the block is not revealed
            if(!this.isBlockVisited(row-1, col)){
                if(!this.isBlockMarked(row-1, col)) this.revealBlock(row-1, col);
                this.markAsVisit(row-1, col);
                this.sweep(row-1, col);
            }
        }else if(this.map[row-1][col] !== 'B'){
            //reveal the block
            if(!this.isBlockMarked(row-1, col)) this.revealBlock(row-1, col);
        }

        //2
        if(col+1 < this.argvcols){
            if(this.map[row-1][col+1] === '0'){
                if(!this.isBlockVisited(row-1, col+1)){
                    if(!this.isBlockMarked(row-1, col+1)) this.revealBlock(row-1, col+1);
                    this.markAsVisit(row-1, col+1);
                    this.sweep(row-1, col+1);
                }
            }else if(this.map[row-1][col+1] !== 'B'){
                //reveal the block
                if(!this.isBlockMarked(row-1, col+1)) this.revealBlock(row-1, col+1);
            }
        }
    }
    
    //current row:
    //3
    if(col-1 >= 0){
        if(this.map[row][col-1] === '0'){
            if(!this.isBlockVisited(row, col-1)){
                if(!this.isBlockMarked(row, col-1)) this.revealBlock(row, col-1);
                this.markAsVisit(row, col-1);
                this.sweep(row, col-1);
            }
        }else if(this.map[row][col-1] !== 'B'){
            //reveal the block
            if(!this.isBlockMarked(row, col-1)) this.revealBlock(row, col-1);
        }
    }
    //4
    if(col+1 < this.argvcols){
        if(this.map[row][col+1] === '0'){
            if(!this.isBlockVisited(row, col+1)){
                if(!this.isBlockMarked(row, col+1)) this.revealBlock(row, col+1);
                this.markAsVisit(row, col+1);
                this.sweep(row, col+1);
            }
        }else if(this.map[row][col+1] !== 'B'){
            //reveal the block
            if(!this.isBlockMarked(row, col+1)) this.revealBlock(row, col+1);
        }
    }
    //row + 1:
    if(row+1 < this.argvrows){
        //5
        if(col-1 >= 0){
            if(this.map[row+1][col-1] === '0'){
                if(!this.isBlockVisited(row+1, col-1)){
                    if(!this.isBlockMarked(row+1, col-1)) this.revealBlock(row+1, col-1);
                    this.markAsVisit(row, col-1);
                    this.sweep(row+1, col-1);
                }
            }else if(this.map[row+1][col-1] !== 'B'){
                //reveal the block
                if(!this.isBlockMarked(row+1, col-1)) this.revealBlock(row+1, col-1);
            }
        }
        //6
        if(col >= 0){
            if(this.map[row+1][col] === '0'){
                if(!this.isBlockVisited(row+1, col)){
                    if(!this.isBlockMarked(row+1, col)) this.revealBlock(row+1, col);
                    this.markAsVisit(row+1, col);
                    this.sweep(row+1, col);
                }
            }else if(this.map[row+1][col] !== 'B'){
                //reveal the block
                if(!this.isBlockMarked(row+1, col)) this.revealBlock(row+1, col);
            }
        }
        //7
        if(col+1 < this.argvcols){
            if(this.map[row+1][col+1] === '0'){
                if(!this.isBlockVisited(row+1, col+1)){
                    if(!this.isBlockMarked(row+1, col+1)) this.revealBlock(row+1, col+1);
                    this.markAsVisit(row+1, col+1);
                    this.sweep(row+1, col+1);
                }
            }else if(this.map[row+1][col+1] !== 'B'){
                //reveal the block
                if(!this.isBlockMarked(row+1, col+1)) this.revealBlock(row+1, col+1);
            }
        }
    }

};
Minesweeper.prototype.mark = function(target, row, col) {
    //A. Check the className
    isFlag = target.attributes.class.value.indexOf('game__map__row__block--flag') !== -1;
    isQuestionmark = target.attributes.class.value.indexOf('game__map__row__block--questionmark') !== -1;
    //B. Toggle the class
    if( !isFlag && !isQuestionmark){
        target.classList.add('fas');
        target.classList.add('fa-flag');
        target.classList.add('game__map__row__block--flag');

        // Update markList
        this.markList.push(`${row},${col}`);

        // Deduct the bomb count
        this.bombNum--;
        document.querySelector(`${this.containerClassName} .game__header__counter--bomb`).innerHTML = this.bombNum;
    }else if( isFlag ){
        target.classList.remove('game__map__row__block--flag');
        target.classList.remove('fas');
        target.classList.remove('fa-flag');
        target.classList.add('fas');
        target.classList.add('fa-question');
        target.classList.add('game__map__row__block--questionmark');

        // Update markList
        const index = this.markList.indexOf(`${row},${col}`);
        this.markList.splice(index, 1);

        // Add the bomb count
        this.bombNum++;
        document.querySelector(`${this.containerClassName} .game__header__counter--bomb`).innerHTML = this.bombNum;
    }else if( isQuestionmark ){
        target.classList.remove('game__map__row__block--questionmark');
        target.classList.remove('fas');
        target.classList.remove('fa-question');
    }
    //C. Check is the player win
    if(this.bombList.length === this.markList.length){
        let isPlayerWin = true;
        const self = this;
        this.markList.forEach(function(coordinate) {
            if(self.bombList.indexOf(coordinate) === -1) isPlayerWin = false;
        });

        if(isPlayerWin){
            this.endGame('win');
        }
    }
};

Minesweeper.prototype.startGame = function() {
    //A. add eventListener: start timer
    const timerElm = document.querySelector(`${this.containerClassName} .game__header__counter--time`);

    self = this;
    this.timerInterval = setInterval(function() {
        if(self.timer >= 999){
            self.timer = 999;
        }else{
            self.timer++;
        }

        timerElm.innerHTML = self.timer;
    }, 1000);   

    //B. update the gameStatus
    this.gameStatus = 'start';
};
//@status: win | lose
Minesweeper.prototype.endGame = function(status) {
    //A. Update status
    this.gameStatus = status;
    //B. Pause the timer
    clearInterval(this.timerInterval);

    if(this.gameStatus === 'win'){
        //change the face-icon
        const faceIconElm = document.querySelector(`${this.containerClassName} .game__header__icon__face`);
        faceIconElm.classList.remove('fa-smile');
        faceIconElm.classList.add('fa-grin-tongue');
        //show other bomb(grey)
        const self = this;
        this.bombList.forEach(function(coordinate){
            const target = document.querySelector(`${self.containerClassName} .game__map__row__block[data-coordinate='${coordinate}']`);
            const isRevealed = target.attributes.class.value.indexOf('game__map__row__block--revealed') === -1 ? false : true ;
            if(!isRevealed){
                target.classList.add('fas');
                target.classList.add('fa-bomb');
            }
        });
    }else if(this.gameStatus === 'lose'){
        //show other bomb(red)
        const self = this;
        this.bombList.forEach(function(coordinate){
            const target = document.querySelector(`${self.containerClassName} .game__map__row__block[data-coordinate='${coordinate}']`);
            const isRevealed = target.attributes.class.value.indexOf('game__map__row__block--revealed') === -1 ? false : true ;
            if(!isRevealed){
                target.classList.add('game__map__row__block--bombStillCovered');
                target.classList.add('fas');
                target.classList.add('fa-bomb');
            }
        });

        //chagne the face
        const faceIconElm = document.querySelector(`${this.containerClassName} .game__header__icon__face`);
        faceIconElm.classList.remove('fa-smile');
        faceIconElm.classList.add('fa-dizzy');
    }
}
Minesweeper.prototype.resetGame = function() {
    //A. Reset the data
    this.init(this.argvrows, this.argvcols, this.argvbomb);
    //A-1. Remove timer interval
    clearInterval(this.timerInterval);

    //B. Redraw the game interface
    this.drawMap(this.containerElm);
}

//Init the game object and render the view:
var elm = document.querySelector('.app');
var game = new Minesweeper(10, 10, 10);
game.drawMap(elm);

/*
var elm2 = document.querySelector('.app2');
var game2 = new Minesweeper(10, 10, 10);
game2.drawMap(elm2);
*/