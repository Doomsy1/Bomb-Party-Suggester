/**
 * styles.js - Style definitions for Bomb Party Suggester
 */

// Define styles centrally for better organization and maintenance
const styles = {
    colors: {
        primary: '#61dafb',
        background: '#282c34',
        text: '#ffffff',
        highlight: '#2EFF2E', // brighter green
        special: '#FF8C00' // orange for special letters
    },
    panel: {
        position: 'fixed',
        top: '10px',
        right: '10px',
        backgroundColor: 'rgba(40, 44, 52, 0.5)',
        border: '2px solid #61dafb',
        borderRadius: '8px',
        padding: '10px',
        zIndex: '2147483647',
        maxWidth: '500px',
        minWidth: '200px',
        minHeight: '150px',
        maxHeight: '800px',
        width: '300px', // default width
        height: '400px', // default height
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#fff',
        boxShadow: '0px 4px 12px rgba(0,0,0,0.5)',
        cursor: 'move',
        resize: 'none',
        overflow: 'hidden'
    },
    resizeHandle: {
        position: 'absolute',
        width: '20px', // larger hitbox
        height: '20px', // larger hitbox
        background: 'transparent', // transparent background for larger hitbox
        zIndex: '2147483647',
        cursor: 'nw-resize'
    },
    resizeDot: {
        position: 'absolute',
        width: '8px',
        height: '8px',
        background: '#61dafb',
        borderRadius: '50%',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
    },
    resizeEdge: {
        position: 'absolute',
        background: 'transparent',
        zIndex: '2147483647'
    },
    sizeSelector: {
        marginBottom: '4px',
        display: 'flex',
        gap: '8px',
        justifyContent: 'center'
    },
    sortControls: {
        marginBottom: '8px',
        display: 'flex',
        gap: '8px', // increased gap for better spacing
        justifyContent: 'center',
        flexWrap: 'wrap'
    },
    sortButton: {
        padding: '4px 8px',
        border: '1px solid #61dafb',
        borderRadius: '4px',
        background: 'transparent',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
    },
    activeSortButton: {
        background: '#61dafb',
        color: '#282c34'
    },
    button: {
        padding: '4px 8px',
        border: '1px solid #61dafb',
        borderRadius: '4px',
        background: 'transparent',
        color: '#fff',
        cursor: 'pointer'
    },
    activeButton: {
        background: '#61dafb',
        color: '#282c34'
    },
    resultsList: {
        listStyle: 'none',
        padding: '0',
        margin: '0'
    },
    resultsItem: {
        padding: '4px 0',
        textAlign: 'center',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        borderRadius: '4px'
    },
    resultsItemHover: {
        backgroundColor: 'rgba(97, 218, 251, 0.2)'
    },
    resultsItemDisabled: {
        backgroundColor: 'rgba(220, 53, 69, 0.2)' // dulled red background
    },
    resultsDiv: {
        height: 'auto',
        overflowY: 'visible',
        marginTop: '8px'
    },
    settingsButton: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        padding: '4px 8px',
        border: '1px solid #61dafb',
        borderRadius: '4px',
        background: 'transparent',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '12px'
    },
    settingsPanel: {
        position: 'fixed',
        top: '10px',
        left: '10px',
        backgroundColor: 'rgba(40, 44, 52, 0.9)',
        border: '2px solid #61dafb',
        borderRadius: '8px',
        padding: '12px',
        zIndex: '2147483647',
        width: '220px',
        color: '#fff',
        fontFamily: 'sans-serif',
        fontSize: '12px',
        cursor: 'move',
        boxShadow: '0px 4px 12px rgba(0,0,0,0.5)'
    },
    settingsGroup: {
        marginBottom: '8px',
        display: 'flex',
        flexDirection: 'column'
    },
    settingsLabel: {
        display: 'block',
        marginBottom: '2px',
        color: '#61dafb',
        fontSize: '11px'
    },
    settingsInputGroup: {
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
    },
    settingsInput: {
        width: '50px',
        padding: '2px 4px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid #61dafb',
        borderRadius: '4px',
        color: '#fff',
        fontSize: '11px'
    },
    settingsSlider: {
        flex: 1,
        height: '4px',
        WebkitAppearance: 'none',
        background: 'rgba(97, 218, 251, 0.2)',
        borderRadius: '2px',
        outline: 'none'
    }
};

// Expose styles to global scope for userscript use
window.styles = { styles }; 