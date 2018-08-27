console.log("Sanity Check");

const canvas = document.getElementById("signature");
const ctx = canvas.getContext("2d");
const clear = document.getElementById("clearcanvas");
const submitButton = document.getElementById("submit-button");
const hiddenInput = document.getElementById("signatureInput");
const logout = document.getElementById("logoutbutton");

const login = document.getElementById("#loginbutton");
// canvas.toDateURL(str);

//mousedown event to start the signature taking interaction in the canvas
canvas.addEventListener("mousedown", function(e) {
    var mouseX = e.pageX - this.offsetLeft; //get the x-axis position of the mouse in relation to just the canvas
    var mouseY = e.pageY - this.offsetTop; // get the vertical position in relation to the distance from the top of the canvas div
    console.log(mouseX, mouseY); // see the co-ordinates

    paint = true; //declares the state of painting
    addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
    redraw();
});

canvas.addEventListener("mousemove", function(e) {
    if (paint) {
        addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
        redraw();
    }
});

canvas.addEventListener("mouseup", function(e) {
    hiddenInput.value = canvas.toDataURL();

    paint = false;
});

canvas.addEventListener("mousemove", function(e) {
    if (paint) {
        addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
        redraw();
    }
});

var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();
var paint;

function addClick(x, y, dragging) {
    clickX.push(x);
    clickY.push(y);
    clickDrag.push(dragging);
}

function redraw() {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clears the canvas

    //styleing the signature color etc
    ctx.strokeStyle = "black";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;

    for (var i = 0; i < clickX.length; i++) {
        ctx.beginPath(); //drawing the lines using a loop that checks the position constantly
        if (clickDrag[i] && i) {
            ctx.moveTo(clickX[i - 1], clickY[i - 1]);
        } else {
            ctx.moveTo(clickX[i] - 1, clickY[i]);
        }
        ctx.lineTo(clickX[i], clickY[i]);
        ctx.closePath();
        ctx.stroke();
    }
}
clear.addEventListener("click", function(e) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    clickX = [];
    clickY = [];
    signature.value = "";
});
submitButton.addEventListener("click", function(e) {});

// log in button

// mouse down // initiated the event that creates the str (listener)
// mouse move  // appends to str
// mouse up // ends process

// create a canvas 'hidden input' value to store the string from the canvas input

//todataUrl is the mothod we use with canvas to convert the input of the signature to a string
