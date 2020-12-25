var sketch = new p5(function (p) {
    // useful interfaces
    // variables that decide how to display the set
    // let cartCordesians: Range = { x: { start: -2, stop: 2 }, y: { start: -2, stop: 2 } };
    var cartCordesians = { x: { start: -2.5, stop: 1.5 }, y: { start: -2, stop: 2 } };
    var maxIterations = 50;
    var escapeRadius = 500;
    var zoomValue = 0;
    var zoomStart = Math.log(1e-10);
    var zoomStop = Math.log(2.3);
    // slider to adjust above variables
    var maxIterationsSlider;
    p.setup = function () {
        var windowSize = Math.min(p.windowHeight, p.windowWidth) - 20;
        p.createCanvas(windowSize, windowSize);
        p.pixelDensity(1);
        p.frameRate(20);
        p.ellipseMode(p.CENTER);
        p.textSize(32);
        showText();
        maxIterationsSlider = p.createSlider(3, 100, 50, 1);
        maxIterationsSlider.position(20, 140);
        maxIterationsSlider.input(function () {
            maxIterations = maxIterationsSlider.value();
        });
    };
    p.draw = function () {
        p.background(51);
        p.loadPixels();
        for (var x = 0; x < p.width; x++) {
            for (var y = 0; y < p.height; y++) {
                // find what color each pixel should be
                var col = mapRange(goesToInf(screenToCart({ x: x, y: y })), -10, 75, 0, 255);
                var loc = (x + y * p.width) * 4;
                p.pixels[loc + 0] = col * 0.9;
                p.pixels[loc + 1] = col * 1.477;
                p.pixels[loc + 2] = col * 1.428;
                p.pixels[loc + 3] = 255;
            }
        }
        p.updatePixels();
        p.ellipse(p.width / 2, p.height / 2, 0);
    };
    p.windowResized = function () {
        var windowSize = Math.min(p.windowHeight, p.windowWidth) - 20;
        p.resizeCanvas(windowSize, windowSize);
    };
    p.mouseDragged = function () {
        if (p.mouseX >= 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height) {
            var offset = convertSliderToLog(zoomValue);
            var movement = {
                real: offset * -2e-3 * (p.mouseX - p.pmouseX),
                imag: offset * -2e-3 * (p.mouseY - p.pmouseY)
            };
            cartCordesians.x.start += movement.real;
            cartCordesians.x.stop += movement.real;
            cartCordesians.y.start += movement.imag;
            cartCordesians.y.stop += movement.imag;
        }
    };
    // helper functions
    var screenToCart = function (_a) {
        // desired range = [-2,    2   ]  (for each direction)
        // input   range = [ 0, width-1]  (for each direction)
        var x = _a.x, y = _a.y;
        return {
            real: mapRange(x, 0, p.width, cartCordesians.x.start, cartCordesians.x.stop),
            imag: mapRange(y, 0, p.height, cartCordesians.y.start, cartCordesians.y.stop)
        };
    };
    var goesToInf = function (c) {
        // this is the main function that we iterate multiple times
        var iterate = function (z) {
            var square = {
                real: z.real * z.real - z.imag * z.imag,
                imag: 2 * z.real * z.imag
            };
            return { real: square.real + c.real, imag: square.imag + c.imag };
        };
        // iterate multiple times until either MAX_ITERATIONS is reached
        // or the value blows up
        var zNext = iterate({ real: 0, imag: 0 });
        var i = 0;
        while (i < maxIterations) {
            zNext = iterate(zNext);
            if (magnitude(zNext) > escapeRadius)
                break;
            i++;
        }
        return i;
    };
    // function to calculate the magnitude of any complex number
    var magnitude = function (z) { return Math.sqrt(z.real * z.real + z.imag + z.imag); };
    // maps a number from one range to another
    var mapRange = function (n, initialRangeStart, initialRangeStop, newRangeStart, newRangeEnd) {
        var initialRange = initialRangeStop - initialRangeStart;
        var newRange = newRangeEnd - newRangeStart;
        return ((n - initialRangeStart) / initialRange) * newRange + newRangeStart;
    };
    var convertSliderToLog = function (val) {
        // to convert a linearly increasing value to a logarithmically increasing one
        var inputStart = 100;
        var inputStop = 0;
        var outputStart = zoomStart;
        var outputStop = zoomStop;
        var scale = (outputStop - outputStart) / (inputStop - inputStart);
        return Math.exp((val - inputStart) * scale + outputStart);
    };
    var showText = function () {
        // helper functions
        // function to setup and show all interactive elements
        var insertText = function (text, x, y, size, onClickCallback) {
            var label = document.createElement("p");
            label.innerText = text;
            label.className = "help-text";
            label.style.left = x.toString() + "px";
            label.style.top = y.toString() + "px";
            label.style.fontSize = (size || 16).toString() + "px";
            if (onClickCallback) {
                label.className += " interactive";
                label.style.cursor = "pointer";
                label.addEventListener("click", onClickCallback);
            }
            document.body.insertAdjacentElement("beforeend", label);
        };
        var zoomIn = function () {
            zoomValue += 1;
            updateZoom();
        };
        var zoomOut = function () {
            zoomValue -= 1;
            updateZoom();
        };
        // calculates and changes the coordinates to
        var updateZoom = function () {
            // calculate canvas size
            var offset = convertSliderToLog(zoomValue);
            var prevCenter = {
                x: (cartCordesians.x.start + cartCordesians.x.stop) / 2,
                y: (cartCordesians.y.start + cartCordesians.y.stop) / 2
            };
            cartCordesians = {
                x: { start: prevCenter.x - offset, stop: prevCenter.x + offset },
                y: { start: prevCenter.y - offset, stop: prevCenter.y + offset }
            };
        };
        insertText("Zoom", 35, 5);
        insertText("-", 30, 15, 35, zoomOut);
        insertText("+", 60, 25, 30, zoomIn);
        insertText("Max iterations", 30, 95);
        // keyboard shortcuts for zooming
        document.addEventListener("keypress", function (e) {
            if (e.code === "Equal")
                zoomIn();
            if (e.code === "Minus")
                zoomOut();
        });
    };
});
