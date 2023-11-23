import React, { useEffect } from 'react';
import css from 'css';
import expose from 'expose';
import { notify } from '../notifications';
import dialog from '../dialog/index';
import MonacoEditor from 'react-monaco-editor';
import { useKeyboardEventListener } from 'hooks';
import utils from 'utils';

const ActionNodeInputDialog = ({ node, onConfirm, onCancel, hide }) => {
  const [value, setValue] = React.useState(node.content);
  const [keyboardShortcutsEnabled, setKeyboardShortcutsEnabled] =
    React.useState(false);
  const [confirmLeave, setConfirmLeave] = React.useState(false);
  const [disableLeave, setDisableLeave] = React.useState(false);

  const handleInputChange = value => {
    setValue(value);
    // setConfirmLeave(true);
  };
  const handleConfirmClick = React.useCallback(() => {
    const _confirm = () => {
      onConfirm(value);
      hide();
    };
    if (disableLeave) {
      return;
    }

    if (confirmLeave) {
      dialog.show_confirm_outer(
        'You have unsaved changes for this node, would you still like to continue without saving them?',
        _confirm,
        () => void 0
      );
    } else {
      _confirm();
    }
  }, [hide, onConfirm, value, confirmLeave, disableLeave]);

  const handleCancelClick = React.useCallback(() => {
    const _cancel = () => {
      if (onCancel) {
        onCancel();
      }
      hide();
    };
    if (disableLeave) {
      return;
    }
    if (confirmLeave) {
      dialog.show_confirm_outer(
        'You have unsaved changes for this node, would you still like to cancel?',
        _cancel,
        () => void 0
      );
    } else {
      _cancel();
    }
  }, [hide, onCancel, confirmLeave, disableLeave]);

  useEffect(() => {
    window.current_confirm = handleConfirmClick;
    window.current_cancel = handleCancelClick;
  }, [handleConfirmClick, handleCancelClick]);

  useEffect(() => {
    const elem = document.getElementById('InputDialog-input');
    if (elem) {
      elem.focus();
    }
  }, []);

  useKeyboardEventListener(
    ev => {
      const formatValue = async () => {
        const result = await utils.post('/format', { text: value });

        if (result.err) {
          notify('Error', result.err);
        } else {
          setValue(result.formattedText);
        }
      };

      if (ev.key === 'f' && ev.ctrlKey && ev.altKey) {
        ev.preventDefault();
        ev.stopPropagation();
        formatValue();
      }
    },
    [value]
  );

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
          // minWidth: '50%',
          padding: '5px',
          backgroundColor: css.colors.SECONDARY,
          border: '4px solid ' + css.colors.SECONDARY_ALT,
          color: css.colors.TEXT_LIGHT,
        }}
      >
        <div style={{ margin: '5px 0px' }}>
          Edit Text Node{' '}
          <span
            style={{
              marginLeft: '16px',
              color: '#AAA',
              textTransform: 'underline',
              fontFamily: 'monospace',
            }}
          >
            {expose.get_state('main').current_file.name.slice(0, -5)}/{node.id}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
          }}
        >
          <MonacoEditor
            width="800"
            height="600"
            language="javascript"
            theme="vs-dark"
            value={value}
            editorDidMount={(editor, monaco) => {
              console.log('editorDidMount', editor);
              editor.focus();
              // editor.updateOptions({ autoClosingBrackets: false });
            }}
            options={{
              selectOnLineNumbers: true,
              autoClosingComments: false,
              autoClosingDelete: false,
              autoClosingOvertype: false,
              autoClosingQuotes: false,
              autoClosingBrackets: false,
              autoSurround: false,
              wordWrap: true,
            }}
            onChange={handleInputChange}
            // editorDidMount={::this.editorDidMount}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            margin: '5px',
          }}
        >
          <div className="confirm-button" onClick={handleConfirmClick}>
            <span className="no-select">OK</span>
          </div>
          <div className="cancel-button" onClick={handleCancelClick}>
            <span className="no-select">Cancel</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionNodeInputDialog;
