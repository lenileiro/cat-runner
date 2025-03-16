// Shared constants
export const CONSTANTS = {
  CAT_WIDTH: 40,
  CAT_HEIGHT: 40,
  JUMP_FORCE: 15,
  MOVE_SPEED: 5,
  GRAVITY: 0.5,
  GROUND_OFFSET: 10
};

// Utility functions
export const Utils = {
  // Color utilities
  interpolateColor: (color1, color2, factor) => {
    // Convert hex to RGB
    const hex2rgb = (hex) => {
      const r = parseInt(hex.substring(1, 3), 16);
      const g = parseInt(hex.substring(3, 5), 16);
      const b = parseInt(hex.substring(5, 7), 16);
      return [r, g, b];
    };
    
    // Interpolate between two RGB values
    const interpolate = (a, b, factor) => {
      return Math.round(a + (b - a) * factor);
    };
    
    const rgb1 = hex2rgb(color1);
    const rgb2 = hex2rgb(color2);
    
    const r = interpolate(rgb1[0], rgb2[0], factor);
    const g = interpolate(rgb1[1], rgb2[1], factor);
    const b = interpolate(rgb1[2], rgb2[2], factor);
    
    return `rgb(${r}, ${g}, ${b})`;
  },
  
  // Get ground Y position
  getGroundY: (canvas) => canvas.height - CONSTANTS.GROUND_OFFSET,
  
  // Safe server communication helper
  safeServerEvent: function(self, eventName, payload = {}) {
    console.log(`Attempting to send ${eventName} event to server`);
    
    // Use try-catch and setTimeout to make this non-blocking
    setTimeout(() => {
      try {
        if (self && typeof self.pushEvent === 'function') {
          self.pushEvent(eventName, payload);
          console.log(`Successfully sent ${eventName} to server`);
        } else {
          console.warn(`Could not send ${eventName}: pushEvent not available, running locally`);
        }
      } catch (error) {
        console.error(`Error sending ${eventName} to server:`, error);
      }
    }, 0);
  }
}; 