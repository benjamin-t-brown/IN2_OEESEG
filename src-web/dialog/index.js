import TextNodeInputDialog from './text-node-input-dialog';
import ActionNodeInputDialog from './action-node-input-dialog';
import TemplateCreateDialog from './template-create-dialog';

const React = require('react');
const ReactDOM = require('react-dom');
const ConfirmDialog = require('./confirm-dialog');
const InputDialog = require('./input-dialog');
const NotificationDialog = require('./notification-dialog');
const InputWithSelectDialog = require('./input-with-select-dialog');
const LoadingDialog = require('./loading-dialog');
// const core = require('core-in2');

window.current_confirm = null;
window.current_cancel = null;
let is_visible = false;
let require_shift = false;

let on_key_down = function (ev) {
  let t = true;
  if (require_shift) {
    t = ev.shiftKey;
  }
  if (ev.keyCode === 13 && t) {
    //enter
    window.current_confirm();
  } else if (ev.keyCode === 27) {
    //esc
    window.current_cancel();
  }
};

let show = function () {
  is_visible = true;
  window.addEventListener('keydown', on_key_down);
  window.disable();
};

const exp = {};

exp.show_confirm = function (text, on_confirm, on_cancel) {
  show();
  ReactDOM.render(
    React.createElement(ConfirmDialog, {
      text: text,
      on_confirm: on_confirm || function () {},
      on_cancel: on_cancel || function () {},
      hide: exp.hide,
    }),
    document.getElementById('dialog')
  );
};

exp.show_confirm_outer = function (text, on_confirm, on_cancel) {
  const id = 'confirm-outer';
  const div = document.createElement('div');
  Object.assign(div.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.5)',
  });
  div.id = id;
  document.body.appendChild(div);
  ReactDOM.render(
    React.createElement(ConfirmDialog, {
      text: text,
      on_confirm: on_confirm || function () {},
      on_cancel: on_cancel || function () {},
      hide: () => {
        div.remove();
      },
    }),
    div
  );
};

exp.set_shift_req = function (v) {
  require_shift = v;
};

exp.show_input = function (
  node_or_default_text,
  on_confirm,
  on_cancel,
  multiline
) {
  multiline = multiline ?? true;
  show();
  let node = null;
  let default_text = null;
  if (typeof node_or_default_text === 'object') {
    node = node_or_default_text;
  } else {
    default_text = node_or_default_text;
  }
  ReactDOM.render(
    React.createElement(InputDialog, {
      node: node,
      default_text: default_text,
      on_confirm: on_confirm || function () {},
      on_cancel: on_cancel || function () {},
      whiteSpace: require_shift,
      multiline,
      hide: exp.hide,
    }),
    document.getElementById('dialog')
  );
};

exp.showTextNodeInput = function ({ node, onConfirm, onCancel }) {
  show();
  ReactDOM.render(
    <TextNodeInputDialog
      node={node}
      onCancel={onCancel}
      onConfirm={onConfirm}
      hide={exp.hide}
    />,
    document.getElementById('dialog')
  );
};

exp.showActionNodeInput = function ({ node, onConfirm, onCancel }) {
  show();
  ReactDOM.render(
    <ActionNodeInputDialog
      node={node}
      onCancel={onCancel}
      onConfirm={onConfirm}
      hide={exp.hide}
    />,
    document.getElementById('dialog')
  );
};

exp.showTemplateCreateDialog = function ({ node, type, onConfirm, onCancel }) {
  show();
  ReactDOM.render(
    <TemplateCreateDialog
      node={node}
      type={type}
      onConfirm={onConfirm}
      onCancel={onCancel}
      hide={exp.hide}
    />,
    document.getElementById('dialog')
  );
};

// options - array of strings that show the options in the select
exp.show_input_with_select = function (
  options,
  default_value,
  on_confirm,
  on_cancel
) {
  show();
  ReactDOM.render(
    React.createElement(InputWithSelectDialog, {
      options: options,
      default_value: default_value,
      on_confirm: on_confirm || function () {},
      on_cancel: on_cancel || function () {},
      hide: exp.hide,
    }),
    document.getElementById('dialog')
  );
};

exp.show_notification = function (text, on_confirm) {
  show();
  ReactDOM.render(
    React.createElement(NotificationDialog, {
      text: text,
      on_confirm: on_confirm || function () {},
      hide: exp.hide,
    }),
    document.getElementById('dialog')
  );
};

exp.hide = function () {
  is_visible = false;
  window.removeEventListener('keydown', on_key_down);
  ReactDOM.unmountComponentAtNode(document.getElementById('dialog'));
  window.enable();
};

exp.is_visible = function () {
  return is_visible;
};

exp.show_loading = function () {
  show();
  ReactDOM.render(<LoadingDialog />, document.getElementById('dialog-loading'));
};

exp.hide_loading = () => {
  is_visible = false;
  window.removeEventListener('keydown', on_key_down);
  ReactDOM.unmountComponentAtNode(document.getElementById('dialog-loading'));
  window.enable();
};

window.dialog = exp;

export default exp;
