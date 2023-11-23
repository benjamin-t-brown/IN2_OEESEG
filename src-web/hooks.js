import React from 'react';

export const useKeyboardEventListener = (cb, captures) => {
  React.useEffect(() => {
    const handleKeyDown = ev => {
      if (!ev.repeat) {
        cb(ev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, captures);
};
