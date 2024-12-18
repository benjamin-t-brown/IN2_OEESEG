import React, { useEffect } from 'react';
import css from 'css';
import expose from 'expose';
import { notify } from '../notifications';
import dialog from '../dialog/index';
import MonacoEditor from 'react-monaco-editor';
import { useKeyboardEventListener } from 'hooks';
import utils from 'utils';
import DeclList from 'decl-list';

/**
 * @typedef {import('../board.jsx').BoardNode} BoardNode
 */
/**
 * @typedef {import('../board.jsx').CombinedConditionalChoiceSubNode} CombinedConditionalChoiceSubNode
 */

/**
 * @typedef CombinedChoiceConditionDialogProps
 * @property {BoardNode} node
 * @property {function} onConfirm
 * @property {function} onCancel
 * @property {function} hide
 * @property {Array<{variable: string, value: string}>} declarations
 */
/**
 * @param {CombinedChoiceConditionDialogProps} props
 * @returns {JSX.Element}
 */
const CombinedChoiceConditionDialog = props => {
  const { node, onConfirm, onCancel, hide, declarations } = props;
  const [value, setValue] = React.useState(node.content);
  const [conditionalValue, setConditionalValue] = React.useState(
    node.combinedConditionalChoice.conditionContent
  );
  const [prefixValue, setPrefixValue] = React.useState(
    node.combinedConditionalChoice.prefixText ?? ''
  );
  const [failText, setFailText] = React.useState(
    node.combinedConditionalChoice.failedConditionText ?? ''
  );
  const [showFailText, setShowFailText] = React.useState(
    node.combinedConditionalChoice.showTextOnFailedCondition ?? false
  );
  const [doActionOnChoose, setDoActionOnChoose] = React.useState(
    node.combinedConditionalChoice.doActionOnChoose ?? false
  );
  const [actionContent, setActionContent] = React.useState(
    node.combinedConditionalChoice.onChooseActionContent ?? ''
  );
  const [keyboardShortcutsEnabled, setKeyboardShortcutsEnabled] =
    React.useState(false);
  const [confirmLeave, setConfirmLeave] = React.useState(false);
  const [disableLeave, setDisableLeave] = React.useState(false);

  const handleInputChange = ev => {
    setValue(ev.target.value);
  };

  const handleConditionalInputChange = ev => {
    setConditionalValue(ev.target.value);
  };

  const handlePrefixInputChange = ev => {
    setPrefixValue(ev.target.value);
  };

  const handleFailTextInputChange = ev => {
    setFailText(ev.target.value);
  };

  const handleShowFailTextChange = ev => {
    setShowFailText(ev.target.checked);
  };

  const handleDoActionOnChooseChange = ev => {
    setDoActionOnChoose(ev.target.checked);
  };

  const handleActionContentChange = ev => {
    setActionContent(ev.target.value);
  };

  const handleConfirmClick = React.useCallback(() => {
    const _confirm = () => {
      onConfirm({
        conditionContent: conditionalValue,
        prefixText: prefixValue,
        failedConditionText: failText,
        showTextOnFailedCondition: showFailText,
        doActionOnChoose,
        actionContent,
        value,
      });
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
  }, [
    hide,
    onConfirm,
    value,
    confirmLeave,
    disableLeave,
    conditionalValue,
    prefixValue,
    failText,
    doActionOnChoose,
    actionContent,
    showFailText,
  ]);

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

  // useEffect(() => {
  //   const elem = document.getElementById('InputDialog-input');
  //   if (elem) {
  //     elem.focus();
  //   }
  // }, []);

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
          Edit Combined Choice Conditional Node{' '}
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
          style={
            {
              // display: 'flex',
            }
          }
        >
          <div>
            <div
              style={{
                padding: '5px',
              }}
            >
              Conditional
            </div>
            <DeclList declarations={declarations} />
            <MonacoEditor
              width="800"
              height="50"
              language="javascript"
              theme="vs-dark"
              value={conditionalValue}
              editorDidMount={(editor, monaco) => {
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
              onChange={value =>
                handleConditionalInputChange({ target: { value } })
              }
            />
            {/* <input
              type="text"
              value={conditionalValue}
              onChange={handleConditionalInputChange}
            /> */}
          </div>
          {/*  */}
          <div>
            <div
              style={{
                padding: '5px',
              }}
            >
              Choice Prefix
            </div>
            <input
              id="InputDialog-prefix"
              onChange={handlePrefixInputChange}
              value={prefixValue}
              spellCheck={true}
              style={{
                padding: '5px',
                background: 'rgb(53, 53, 53)',
                resize: 'none',
                color: css.colors.TEXT_LIGHT,
                width: '100%',
                // minHeight: '200px',
              }}
            ></input>
          </div>
          <div>
            <div
              style={{
                padding: '5px',
                color: css.colors.TEXT_LIGHT,
              }}
            >
              Choice Text
            </div>
            <textarea
              id="InputDialog-input"
              onChange={handleInputChange}
              value={value}
              spellCheck={true}
              style={{
                padding: '5px',
                background: 'rgb(53, 53, 53)',
                resize: 'none',
                color: css.colors.TEXT_LIGHT,
                width: '100%',
                minHeight: '100px',
              }}
            ></textarea>
          </div>
          <div
            style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.5)',
              marginTop: '5px',
            }}
          >
            <input
              id="InputDialog-failEnabled"
              type="checkbox"
              onChange={handleShowFailTextChange}
              checked={showFailText}
              style={{
                padding: '5px',
                background: 'rgb(53, 53, 53)',
                resize: 'none',
                color: css.colors.TEXT_LIGHT,
              }}
            ></input>
            <label
              htmlFor="InputDialog-failEnabled"
              style={{
                padding: '5px',
                color: '#F99',
              }}
            >
              Show Choice Fail Text
            </label>
          </div>
          <div
            style={{
              display: showFailText ? 'block' : 'none',
            }}
          >
            <div
              style={{
                padding: '5px',
                color: '#F99',
              }}
            >
              Choice Fail Text
            </div>
            <textarea
              id="InputDialog-fail"
              onChange={handleFailTextInputChange}
              value={failText}
              spellCheck={true}
              style={{
                padding: '5px',
                background: 'rgb(53, 53, 53)',
                resize: 'none',
                color: css.colors.TEXT_LIGHT,
                width: '100%',
                minHeight: '100px',
              }}
            ></textarea>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.5)',
            marginTop: '5px',
          }}
        >
          <input
            id="InputDialog-chooseActionEnabled"
            type="checkbox"
            onChange={handleDoActionOnChooseChange}
            checked={doActionOnChoose}
            style={{
              padding: '5px',
              background: 'rgb(53, 53, 53)',
              resize: 'none',
              color: css.colors.TEXT_LIGHT,
            }}
          ></input>
          <label
            htmlFor="InputDialog-chooseActionEnabled"
            style={{
              padding: '5px',
              // color: '#F99',
            }}
          >
            Do Action On Choose
          </label>
        </div>
        {doActionOnChoose ? (
          <div
            style={
              {
                // display: doActionOnChoose ? 'block' : 'none',
              }
            }
          >
            <div
              style={{
                padding: '5px',
              }}
            >
              On Choose Action
            </div>
            <MonacoEditor
              width="800"
              height="100"
              language="javascript"
              theme="vs-dark"
              value={actionContent}
              editorDidMount={(editor, monaco) => {
                // editor.focus();
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
              onChange={value =>
                handleActionContentChange({ target: { value } })
              }
            />
          </div>
        ) : null}
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

export default CombinedChoiceConditionDialog;
