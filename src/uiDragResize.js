// src/uiDragResize.js
window.BPS = window.BPS || {};

(function() {
    'use strict';

    const styles = window.BPS.styles;
    const applyStyles = window.BPS.applyStyles;

    /**
     * Makes an element draggable by clicking anywhere on it (except buttons/inputs).
     */
    function makeDraggable(element) {
        let isDragging = false;
        let offsetX = 0, offsetY = 0;

        element.addEventListener('mousedown', (e) => {
            const tag = e.target.tagName.toLowerCase();
            // Don’t drag if clicking on a button or input
            if (tag === 'button' || tag === 'input') return;

            isDragging = true;
            offsetX = e.clientX - element.offsetLeft;
            offsetY = e.clientY - element.offsetTop;
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            element.style.left = Math.max(0, Math.min(window.innerWidth - element.offsetWidth, x)) + 'px';
            element.style.top = Math.max(0, Math.min(window.innerHeight - element.offsetHeight, y)) + 'px';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    /**
     * Adds corner & edge resize handles to a panel, then wires up logic
     * to resize the panel by dragging them. Also includes standard “drag entire panel” logic.
     */
    function setupDraggableResize(panel) {
        // Corner handles
        const corners = [
            { corner: 'nw', top: '-10px', left: '-10px', cursor: 'nw-resize' },
            { corner: 'ne', top: '-10px', right: '-10px', cursor: 'ne-resize' },
            { corner: 'se', bottom: '-10px', right: '-10px', cursor: 'se-resize' },
            { corner: 'sw', bottom: '-10px', left: '-10px', cursor: 'sw-resize' }
        ];
        corners.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${pos.corner}`;
            applyStyles(handle, { ...styles.resizeHandle, ...pos });

            // Dot in the center for a visual
            const dot = document.createElement('div');
            applyStyles(dot, styles.resizeDot);
            handle.appendChild(dot);

            panel.appendChild(handle);
        });

        // Edge handles
        const edges = [
            { edge: 'n', top: '-5px', left: '20px', right: '20px', height: '10px', cursor: 'ns-resize' },
            { edge: 's', bottom: '-5px', left: '20px', right: '20px', height: '10px', cursor: 'ns-resize' },
            { edge: 'e', top: '20px', right: '-5px', bottom: '20px', width: '10px', cursor: 'ew-resize' },
            { edge: 'w', top: '20px', left: '-5px', bottom: '20px', width: '10px', cursor: 'ew-resize' }
        ];
        edges.forEach(pos => {
            const edge = document.createElement('div');
            edge.className = `resize-edge ${pos.edge}`;
            applyStyles(edge, { ...styles.resizeEdge, ...pos });
            panel.appendChild(edge);
        });

        // Dragging the entire panel
        let draggingPanel = false;
        let offsetX = 0, offsetY = 0;

        panel.addEventListener('mousedown', (e) => {
            // If user clicked on a resize-handle, do not drag the entire panel
            if (e.target.classList.contains('resize-handle') ||
                e.target.classList.contains('resize-edge')) {
                return;
            }
            draggingPanel = true;
            offsetX = e.clientX - panel.getBoundingClientRect().left;
            offsetY = e.clientY - panel.getBoundingClientRect().top;
            e.preventDefault();
        });

        panel.addEventListener('mousemove', (e) => {
            if (!draggingPanel) return;
            const newLeft = e.clientX - offsetX;
            const newTop = e.clientY - offsetY;
            panel.style.left = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, newLeft)) + 'px';
            panel.style.top = Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, newTop)) + 'px';
        });

        panel.addEventListener('mouseup', () => {
            draggingPanel = false;
        });
        panel.addEventListener('mouseleave', () => {
            draggingPanel = false;
        });

        // Resizing logic
        let resizing = false;
        let currentResizer = null;
        let startX, startY, startWidth, startHeight, panelLeft, panelTop;

        const resizers = [
            ...panel.querySelectorAll('.resize-handle'),
            ...panel.querySelectorAll('.resize-edge')
        ];
        resizers.forEach(r => {
            r.addEventListener('mousedown', (e) => {
                resizing = true;
                currentResizer = r;
                startX = e.clientX;
                startY = e.clientY;
                const rect = panel.getBoundingClientRect();
                startWidth = rect.width;
                startHeight = rect.height;
                panelLeft = rect.left;
                panelTop = rect.top;
                e.preventDefault();
                e.stopPropagation(); // don’t trigger panel-dragging
            });
        });

        document.addEventListener('mousemove', (e) => {
            if (!resizing || !currentResizer) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            const maxW = parseInt(styles.panel.maxWidth, 10) || 500;
            const minW = parseInt(styles.panel.minWidth, 10) || 200;
            const maxH = parseInt(styles.panel.maxHeight, 10) || 800;
            const minH = parseInt(styles.panel.minHeight, 10) || 150;

            let newW = startWidth;
            let newH = startHeight;
            let newL = panelLeft;
            let newT = panelTop;

            // e.g. "nw", "n", "se", etc.
            const direction = currentResizer.classList[1]; 

            if (currentResizer.classList.contains('resize-handle')) {
                // Corner handle
                switch (direction) {
                    case 'nw':
                        newW = startWidth - dx;
                        newH = startHeight - dy;
                        newL = panelLeft + (startWidth - newW);
                        newT = panelTop + (startHeight - newH);
                        break;
                    case 'ne':
                        newW = startWidth + dx;
                        newH = startHeight - dy;
                        newT = panelTop + (startHeight - newH);
                        break;
                    case 'se':
                        newW = startWidth + dx;
                        newH = startHeight + dy;
                        break;
                    case 'sw':
                        newW = startWidth - dx;
                        newH = startHeight + dy;
                        newL = panelLeft + (startWidth - newW);
                        break;
                }
            } else {
                // Edge handle
                switch (direction) {
                    case 'n':
                        newH = startHeight - dy;
                        newT = panelTop + (startHeight - newH);
                        break;
                    case 's':
                        newH = startHeight + dy;
                        break;
                    case 'e':
                        newW = startWidth + dx;
                        break;
                    case 'w':
                        newW = startWidth - dx;
                        newL = panelLeft + (startWidth - newW);
                        break;
                }
            }

            // Constrain dimensions
            newW = Math.min(maxW, Math.max(minW, newW));
            newH = Math.min(maxH, Math.max(minH, newH));
            // Keep in viewport
            newL = Math.min(window.innerWidth - newW, Math.max(0, newL));
            newT = Math.min(window.innerHeight - newH, Math.max(0, newT));

            // Apply
            panel.style.width = newW + 'px';
            panel.style.height = newH + 'px';
            panel.style.left = newL + 'px';
            panel.style.top = newT + 'px';
        });

        document.addEventListener('mouseup', () => {
            resizing = false;
            currentResizer = null;
        });
    }

    // Expose these on window.BPS
    window.BPS.makeDraggable = makeDraggable;
    window.BPS.setupDraggableResize = setupDraggableResize;
})();
