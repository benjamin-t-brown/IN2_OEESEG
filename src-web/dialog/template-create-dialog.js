import React, { useEffect } from 'react';
import css from 'css';
import BasicOEESEGRoom from 'templates/BasicOEESEGRoom';
import FUNCSelectItem from 'templates/FUNCSelectItem';

const TemplateCreateDialog = ({ node, type, onConfirm, onCancel, hide }) => {
  const handleCancelClick = (window.current_cancel = () => {
    onCancel();
    hide();
  });

  const handleSubmit = (newSet, location, replaceNodeIds) => {
    onConfirm(newSet, location, replaceNodeIds);
    hide();
  };

  const getBody = () => {
    switch (type) {
      case 'BasicOEESEGRoom': {
        return (
          <BasicOEESEGRoom
            handleSubmit={handleSubmit}
            handleCancelClick={handleCancelClick}
            rootNode={node}
          />
        );
      }
      case 'FUNCSelectItem': {
        return (
          <FUNCSelectItem
            handleSubmit={handleSubmit}
            handleCancelClick={handleCancelClick}
            rootNode={node}
          />
        );
      }
    }
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
        {getBody()}
      </div>
    </div>
  );
};

export default TemplateCreateDialog;
