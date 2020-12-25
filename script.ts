declare const p5: any;

const sketch = new p5((p: any): void => {
    // useful interfaces

    interface Complex {
        real: number;
        imag: number;
    }

    interface Range {
        x: { start: number; stop: number };
        y: { start: number; stop: number };
    }

    // variables that decide how to display the set

    // let cartCordesians: Range = { x: { start: -2, stop: 2 }, y: { start: -2, stop: 2 } };
    let cartCordesians: Range = { x: { start: -2.5, stop: 1.5 }, y: { start: -2, stop: 2 } };

    let maxIterations = 50;
    let escapeRadius = 500;
    let zoomValue = 0;
    const zoomStart = Math.log(1e-10);
    const zoomStop = Math.log(2.3);

    // slider to adjust above variables

    let maxIterationsSlider: any;

    p.setup = (): void => {
        const windowSize = Math.min(p.windowHeight, p.windowWidth) - 20;

        p.createCanvas(windowSize, windowSize);
        p.pixelDensity(1);
        p.frameRate(20);
        p.ellipseMode(p.CENTER);

        p.textSize(32);
        showText();

        maxIterationsSlider = p.createSlider(3, 100, 50, 1);
        maxIterationsSlider.position(20, 140);
        maxIterationsSlider.input((): void => {
            maxIterations = maxIterationsSlider.value();
        });
    };

    p.draw = (): void => {
        p.background(51);

        p.loadPixels();

        for (let x = 0; x < p.width; x++) {
            for (let y = 0; y < p.height; y++) {
                // find what color each pixel should be
                let col: number = mapRange(goesToInf(screenToCart({ x, y })), -10, 75, 0, 255);

                const loc = (x + y * p.width) * 4;
                p.pixels[loc + 0] = col * 0.9;
                p.pixels[loc + 1] = col * 1.477;
                p.pixels[loc + 2] = col * 1.428;
                p.pixels[loc + 3] = 255;
            }
        }

        p.updatePixels();

        p.ellipse(p.width / 2, p.height / 2, 0);
    };

    p.windowResized = (): void => {
        const windowSize = Math.min(p.windowHeight, p.windowWidth) - 20;
        p.resizeCanvas(windowSize, windowSize);
    };

    p.mouseDragged = (): void => {
        if (p.mouseX >= 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height) {
            const offset = convertSliderToLog(zoomValue);

            const movement = {
                real: offset * -2e-3 * (p.mouseX - p.pmouseX),
                imag: offset * -2e-3 * (p.mouseY - p.pmouseY),
            };

            cartCordesians.x.start += movement.real;
            cartCordesians.x.stop += movement.real;

            cartCordesians.y.start += movement.imag;
            cartCordesians.y.stop += movement.imag;
        }
    };

    // helper functions

    const screenToCart = ({ x, y }: { x: number; y: number }): Complex => {
        // desired range = [-2,    2   ]  (for each direction)
        // input   range = [ 0, width-1]  (for each direction)

        return {
            real: mapRange(x, 0, p.width, cartCordesians.x.start, cartCordesians.x.stop),
            imag: mapRange(y, 0, p.height, cartCordesians.y.start, cartCordesians.y.stop),
        };
    };

    const goesToInf = (c: Complex): number => {
        // this is the main function that we iterate multiple times

        const iterate = (z: Complex): Complex => {
            const square: Complex = {
                real: z.real * z.real - z.imag * z.imag,
                imag: 2 * z.real * z.imag,
            };
            return { real: square.real + c.real, imag: square.imag + c.imag };
        };

        // iterate multiple times until either MAX_ITERATIONS is reached
        // or the value blows up

        let zNext = iterate({ real: 0, imag: 0 });

        let i = 0;
        while (i < maxIterations) {
            zNext = iterate(zNext);
            if (magnitude(zNext) > escapeRadius) break;

            i++;
        }

        return i;
    };

    // function to calculate the magnitude of any complex number
    const magnitude = (z: Complex): number => Math.sqrt(z.real * z.real + z.imag + z.imag);

    // maps a number from one range to another
    const mapRange = (
        n: number,
        initialRangeStart: number,
        initialRangeStop: number,
        newRangeStart: number,
        newRangeEnd: number
    ): number => {
        const initialRange = initialRangeStop - initialRangeStart;
        const newRange = newRangeEnd - newRangeStart;

        return ((n - initialRangeStart) / initialRange) * newRange + newRangeStart;
    };

    const convertSliderToLog = (val: number): number => {
        // to convert a linearly increasing value to a logarithmically increasing one

        const inputStart = 100;
        const inputStop = 0;

        const outputStart = zoomStart;
        const outputStop = zoomStop;

        const scale = (outputStop - outputStart) / (inputStop - inputStart);

        return Math.exp((val - inputStart) * scale + outputStart);
    };

    const showText = (): void => {
        // helper functions

        // function to setup and show all interactive elements
        const insertText = (
            text: string,
            x: number,
            y: number,
            size?: number,
            onClickCallback?: () => void
        ): void => {
            const label = document.createElement("p");

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

        const zoomIn = (): void => {
            zoomValue += 1;
            updateZoom();
        };

        const zoomOut = (): void => {
            zoomValue -= 1;
            updateZoom();
        };

        // calculates and changes the coordinates to
        const updateZoom = (): void => {
            // calculate canvas size
            const offset = convertSliderToLog(zoomValue);

            const prevCenter = {
                x: (cartCordesians.x.start + cartCordesians.x.stop) / 2,
                y: (cartCordesians.y.start + cartCordesians.y.stop) / 2,
            };

            cartCordesians = {
                x: { start: prevCenter.x - offset, stop: prevCenter.x + offset },
                y: { start: prevCenter.y - offset, stop: prevCenter.y + offset },
            };
        };

        insertText("Zoom", 35, 5);
        insertText("-", 30, 15, 35, zoomOut);
        insertText("+", 60, 25, 30, zoomIn);

        insertText("Max iterations", 30, 95);

        // keyboard shortcuts for zooming
        document.addEventListener("keypress", (e: KeyboardEvent): void => {
            if (e.code === "Equal") zoomIn();
            if (e.code === "Minus") zoomOut();
        });
    };
});
