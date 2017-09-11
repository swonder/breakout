/*****************************************************************
* Shawn Wonder                                                   *
* 02/03/2016                                                     *
* Draws, updates, and provides logic for Breakout! game          *
******************************************************************/
"use strict";

document.addEventListener('DOMContentLoaded', function() { 	
	var msPerFrame = 10;   //Adjust up to make ball go faster, down to go slower
	
	//Size of the game window in pixels
	var mainWidth  = 800;
	var mainHeight = 600; 
	
	//Boundaries of the main playing window
	var main = document.getElementById('main');
	var mainLeftBound = main.offsetLeft;
	var mainRightBound = main.offsetLeft + mainWidth;
	var mainTopBound = main.offsetTop;
	var mainBottomBound = main.offsetTop + mainHeight;
	
	//Size of each brick in pixels
	var brickWidth  = 80;
	var brickHeight = 20;
	
	var numBricks   = 100;
	var bricks = document.querySelectorAll('div.row0, div.row1, div.row2, div.row3, div.row4, div.row5, div.row6, div.row7, div.row8, div.row9');
	var brick;
	var brokenBricks = {};   //Object that holds all the bricks that have been broken
	
	//Size of the paddle in pixels
	var paddleWidth  = 140;
	var paddleHeight = 20;
	var paddleHits   = 0;
	var paddle;
	
	var paddleSpeedLevel = 1;
	var paddleHitsToIncreaseSpeed = 7; //# of times ball has to hit paddle before speed is increased
	
	//Size of the ball in pixels
	var ballWidth  = 30;
	var ballHeight = 30; 
	
	loadBricks();
	loadPaddle();
	
	//Add the ball when player clicks the screen and set the ball in motion 
	var ball = document.createElement('div');
	main.addEventListener('click', loadBall, false);
	var intervalID = window.setInterval(moveBall, 20);
	
	//Ball velocity
	var secondsPerFrame = msPerFrame / 1000;

	//This sets horizontal rate to 200--600 pixels/second
	var vx = secondsPerFrame * (Math.floor(Math.random() * 400) + 200);
	if (Math.random() < 0.5) vx = -vx;

	//This sets verical rate - negative sets the ball initially going downward
	var vy = -(secondsPerFrame * 500);

	/***** Brick functions *****/
	//Add all the bricks to the main div
	function loadBricks() {	
		for(var i=0; i < 10; i++) {
			for(var j=0; j < 10; j++) {
			    brick = document.createElement('div');
				brick.setAttribute('id', 'brick' + i + j);
				brick.classList.add('brick');
				brick.classList.add('col' + i);
				brick.classList.add('row' + j);
				main.appendChild(brick);
			}
		}
	}
	
	//Returns false if there was not a collision with a brick, otherwise returns true
	function brickCollision(x, y) {		
		var row = Math.floor((y - 100) / brickHeight);
		var col = Math.floor(x / brickWidth);
		if (row < 0 || row >= 10 || col < 0 || col >= 10) {
			return false; //Not in the right area
		}
		if ((x + 2) % brickWidth < 4 || (y + 2) % brickHeight < 4) {
			return false; //Not quite in the brick--it's in the white border around a brick
		}
		//Otherwise, row and column give the brick number
		brickIsBroken(col, row);
		return true;	
	}
	
	//Returns true if a brick is broken, false otherwise
	function brickIsBroken(col, row) {
		var key = String(col) + ',' + String(row);
		//Brick is already broken, pretend it's not there
		if (key in brokenBricks) { 
			return true;
		} else { //Brick has not been broken yet
			brokenBricks[key] = true; //Now it has
			//Make brick invisible
			document.getElementById('brick' + col + row) && document.getElementById('brick' + col + row).classList.add('broken');
			//Reverse y direction of ball
			vy = -vy;
			return false;
		}
	}

	/***** Ball functions *****/
	//Add ball to main div
	function loadBall() {
		ball.setAttribute('id', 'ball');
		//Put the ball in middle of screen
		ball.style.left = (mainWidth/2) - (ballWidth/2) + 'px';
		ball.style.top = (mainHeight/2 + 30) + 'px';
		main.appendChild(ball);
		//Make it so player can't create multiple balls by clicking on the screen multiple times
		main.removeEventListener('click', loadBall, false);
	}
	
	function moveBall() {
		//Check for a win!
		if(Object.size(brokenBricks) > numBricks) {
			window.clearInterval(intervalID);
			alert('You win!');	
			document.location.reload();
		}

		//Increment the ball position by the velocity
		ball.style.left = ball.offsetLeft + vx;
		ball.style.top = ball.offsetTop + vy;
		
		//Make sure the ball does not travel outside of the main div
		if(ball.offsetLeft < 0 || ball.offsetLeft + ballWidth  > mainWidth) {
			vx = -vx;
		}
		if(ball.offsetTop < 0) {
			vy = -vy;
		}
		
		//Check if the ball hit the bottom of the main div - player loses game
		if(ball.offsetTop + ballHeight > mainHeight) {
			window.clearInterval(intervalID);
			document.getElementById('ball').classList.add('broken');
			alert('Game over!');
			document.location.reload();
			return;
		}

		//Test each one of the 8 points along the circumference of the ball to see
		//if it is colliding with one of the bricks
		for(var i = 0; i < 8; i++)
		{
			var theta = (2 * Math.PI/i) * 8;
			var circX = Math.round(ball.offsetLeft + (ballWidth/2 * Math.cos(theta)));
			var circY = Math.round(ball.offsetTop + (ballHeight/2 * Math.sin(theta)));
			brickCollision(circX, circY);
		}
				
		//Ball hit the paddle - increment the paddleHits by one
		var paddleHit = false;
		if(paddleCollision() && !paddleHit) {
			paddleHits++;
			paddleHit=true;
		}
		
		//Only want the speed of ball to increase when number of paddle hits is reached 
		var increaseSpeed = false;
		if(paddleHits/paddleHitsToIncreaseSpeed > paddleSpeedLevel) {
			increaseSpeed = true;
		}
		paddleSpeedLevel = Math.ceil(paddleHits/paddleHitsToIncreaseSpeed);
		//Increase the speed of the ball
		if(increaseSpeed) {
			vx *= 1.09;  //Constant multiplier just increases the speed slightly each level
			vy *= 1.09;
			increaseSpeed = false;
		}
	}

	/***** Paddle functions *****/
	//Add the paddle to the main div
	function loadPaddle() {	
		paddle = document.createElement('div');
		paddle.setAttribute('id', 'paddle');
		//Center the paddle
		paddle.style.left = (mainWidth - paddleWidth) / 2;
		main.appendChild(paddle);
		//Set the paddle to follow the mouse motion
		document.onmousemove = function (evt) {
			//Don't let the paddle travel outside the playing area
			if(evt.clientX > mainLeftBound + (paddleWidth/2)  && evt.clientX < mainRightBound - (paddleWidth/2)) {
				paddle.style.left = evt.clientX - mainLeftBound - (paddleWidth/2);
			}
		}
	}
	
	//Returns true if the paddle collided with the ball, false otherwise
	function paddleCollision() {
		//Check if the ball horizonatally collided with the paddle
		if(ball.offsetLeft > paddle.offsetLeft + paddleWidth || ball.offsetLeft + ballWidth < paddle.offsetLeft) {
			return false; //No collision
		}
		//Check if the ball vertically collided with the paddle
		if(ball.offsetTop - ballWidth > paddle.offsetTop || ball.offsetTop < paddle.offsetTop - paddleHeight) {
			return false;  //No collision
		}
		//There was a collision - reverse ball direction
		vy = -Math.abs(vy);
		return true;
	}
	
	
	//Uses prototype and returns the number of elements in an object 
	Object.size = function(obj) {
    	var size = 0, key;
    	for (key in obj) {
        	if (obj.hasOwnProperty(key)) { 
				size++;
			}
    	}
    	return size;
	};
});
