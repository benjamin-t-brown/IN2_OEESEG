import React, { useEffect } from 'react';
import css from 'css';
import BasicOEESEGRoom from 'templates/BasicOEESEGRoom';

const TemplateCreateDialog = ({ node, type, onConfirm, onCancel, hide }) => {
  const handleCancelClick = (window.current_cancel = () => {
    onCancel();
    hide();
  });

  const handleSubmit = newSet => {
    const location = {
      left: -600,
      top: 111,
    };
    onConfirm(newSet, location);
    hide();
  };

  return (
    <div
      onWheel={ev => ev.stopPropagation()}
      onMouseDown={ev => ev.stopPropagation()}
      onMouseUp={ev => ev.stopPropagation()}
      style={{
        position: 'fixed',
        left: '0',
        top: '0',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(0, 0, 0, 0.25)',
      }}
    >
      <div
        style={{
          width: '800px',
          padding: '5px',
          backgroundColor: css.colors.SECONDARY,
          border: '4px solid ' + css.colors.SECONDARY_ALT,
          color: css.colors.TEXT_LIGHT,
        }}
      >
        <BasicOEESEGRoom
          handleSubmit={handleSubmit}
          handleCancelClick={handleCancelClick}
          rootNode={node}
        />
      </div>
    </div>
  );
};

export default TemplateCreateDialog;
