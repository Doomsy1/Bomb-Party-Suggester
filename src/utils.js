/**
 * utils.js - Utility functions for Bomb Party Suggester
 */

; (function() {
    // Ensure the window.utils namespace exists
    window.utils = window.utils || {};

    // Only add functions if they haven't been declared
    if (!window.utils.normalRandom) {
        // helper function for normal distribution
        window.utils.normalRandom = (mean, stdDev) => {
            // box-muller transform for normal distribution
            const u1 = Math.random();
            const u2 = Math.random();
            const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
            return mean + z * stdDev;
        };

        // helper function to apply styles to an element
        window.utils.applyStyles = (element, styleObj) => {
            Object.assign(element.style, styleObj);
        };

        // helper function to make an element draggable
        window.utils.makeDraggable = (element) => {
            let isDragging = false;
            let currentX;
            let currentY;
            let initialX;
            let initialY;

            const dragStart = (e) => {
                // don't start drag if clicking on a button or input
                if (e.target.tagName.toLowerCase() === 'button' ||
                    e.target.tagName.toLowerCase() === 'input') {
                    return;
                }
                isDragging = true;
                initialX = e.clientX - element.offsetLeft;
                initialY = e.clientY - element.offsetTop;
                e.preventDefault();
            };

            const dragEnd = () => {
                isDragging = false;
            };

            const drag = (e) => {
                if (!isDragging) return;

                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                // keep panel within viewport bounds
                currentX = Math.min(Math.max(0, currentX), window.innerWidth - element.offsetWidth);
                currentY = Math.min(Math.max(0, currentY), window.innerHeight - element.offsetHeight);

                element.style.left = currentX + 'px';
                element.style.top = currentY + 'px';
            };

            element.addEventListener('mousedown', dragStart);
            element.addEventListener('mousemove', drag);
            element.addEventListener('mouseup', dragEnd);
            element.addEventListener('mouseleave', dragEnd);
        };
    }
})(); 