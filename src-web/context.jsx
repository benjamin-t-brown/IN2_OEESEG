import React from 'react';
import ReactDOM from 'react-dom';
import expose from './expose';
import css from './css';
import utils from 'utils';
import dialog from 'dialog';
import { notify } from 'notifications';
import { getNode } from 'board';

const exp = {};

class Context extends expose.Component {
  constructor(props) {
    super(props);
    this.expose('context');
  }

  getIconName(name) {
    switch (name) {
      case 'Link Node': {
        return 'link';
      }
      case 'Create Text Choice Node':
      case 'Create Text Node': {
        return 'text';
      }
      case 'Create Choice Node': {
        return 'choose';
      }
      case 'Create Conditional Choice Node': {
        return 'passfail';
      }
      case 'Create Pass Fail Node': {
        return 'passfail';
      }
      case 'Create Action Node': {
        return 'action';
      }
      case 'Create Chunk Node': {
        return 'chunk';
      }
      case 'Create Switch Node': {
        return 'switch';
      }
      case 'Create Switch Conditional Node': {
        return 'passfail';
      }
      case 'Create Defer Node': {
        return 'defer';
      }
      case 'Create Declaration Node': {
        return 'decl';
      }
      case 'Create Next File Node': {
        return 'nextfile';
      }
      default: {
        return 'decl';
      }
    }
  }

  renderItem(name, cb) {
    return (
      <div
        key={name}
        onClick={cb}
        className="context-button"
        style={{
          padding: '5px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            flexShrink: 0,
            width: '22px',
            height: '22px',
            marginRight: '5px',
          }}
        >
          <img
            src={`resources/img/${this.getIconName(name)}.svg`}
            alt={name}
          ></img>
        </div>
        <div className="no-select">
          {name.includes('Chunk') ? 'Create Script Node' : name}
        </div>
      </div>
    );
  }

  render() {
    if (!this.props.visible) {
      return React.createElement('div');
    }

    const elems = [];

    for (const i in this.props.cbs) {
      let name = i.split(/(?=[A-Z])/).join(' ');
      name = name.slice(0, 1).toUpperCase() + name.slice(1);
      elems.push(
        this.renderItem(name, this.props.cbs[i].bind(null, this.props.node))
      );
    }

    if (elems.length === 0) {
      elems.push(this.renderItem('(No Action)', () => {}));
    }

    return (
      <div
        style={{
          position: 'absolute',
          width: '200px',
          padding: '5px',
          top: this.props.style.top,
          left: this.props.style.left,
          backgroundColor: css.colors.TEXT_LIGHT,
          border: '2px solid ' + css.colors.FG_NEUTRAL,
        }}
      >
        {elems}
      </div>
    );
  }
}

window.addEventListener('click', () => {
  exp.hide();
});

exp.show = function (x, y, node, file, cbs) {
  ReactDOM.render(
    <Context
      visible={true}
      node={node}
      file={file}
      cbs={cbs}
      style={{
        top: y,
        left: x,
      }}
    />,
    document.getElementById('context')
  );
};

exp.hide = function () {
  ReactDOM.render(
    React.createElement(Context, {
      visible: false,
    }),
    document.getElementById('context')
  );
};

exp.show_context_menu = function (board, elem) {
  if (utils.is_ctrl()) {
    return;
  }
  board.disable_context = true;
  const { x, y } = utils.get_mouse_pos();
  const cbs = {};
  console.log('context', elem);
  const file_node = getNode(board.file, elem.id);
  if (file_node.type !== 'next_file' && board.nodeCanHaveChild(file_node)) {
    if (file_node.type === 'choice') {
      cbs.linkNode = function (parent) {
        this.enterLinkMode(parent);
      }.bind(board);
      cbs.copyNodeId = function (parent) {
        navigator.clipboard.writeText(parent.id);
        notify('Copied node ID to clipboard.', 'info');
      }.bind(board);
      cbs.createTextChoiceNode = function (parent) {
        this.addNode(parent, 'choice_text');
      }.bind(board);
      cbs.createConditionalChoiceNode = function (parent) {
        const added_node = this.addNode(
          parent,
          'choice_conditional',
          'player.once()'
        );
        this.addNode(added_node, 'choice_text');
        setTimeout(() => {
        }, 100);
      }.bind(board);
    } else if (file_node.type === 'choice_conditional') {
      cbs.linkNode = function (parent) {
        this.enterLinkMode(parent);
      }.bind(board);
      cbs.copyNodeId = function (parent) {
        navigator.clipboard.writeText(parent.id);
        notify('Copied node ID to clipboard.', 'info');
      }.bind(board);
      cbs.setNodeCondition = function (parent) {
        this.enterLinkMode(parent);
      }.bind(board);
      cbs.createTextChoiceNode = function (parent) {
        this.addNode(parent, 'choice_text');
      }.bind(board);
    } else if (file_node.type === 'switch') {
      cbs.linkNode = function (parent) {
        this.enterLinkMode(parent);
      }.bind(board);
      cbs.copyNodeId = function (parent) {
        navigator.clipboard.writeText(parent.id);
        notify('Copied node ID to clipboard.', 'info');
      }.bind(board);
      cbs.createSwitchConditionalNode = function (parent) {
        this.addNode(parent, 'switch_conditional', `player.once()`);
      }.bind(board);
    } else {
      cbs.linkNode = function (parent) {
        this.enterLinkMode(parent);
      }.bind(board);
      cbs.copyNodeId = function (parent) {
        navigator.clipboard.writeText(parent.id);
        notify('Copied node ID to clipboard.', 'info');
      }.bind(board);
      cbs.createTextNode = function (parent) {
        this.addNode(parent, 'text');
      }.bind(board);
      cbs.createChoiceNode = function (parent) {
        this.addNode(parent, 'choice', '');
      }.bind(board);
      cbs.createPassFailNode = function (parent) {
        this.addPassFailNode(parent);
      }.bind(board);
      cbs.createActionNode = function (parent) {
        this.addNode(parent, 'action', ``);
      }.bind(board);
      cbs.createChunkNode = function (parent) {
        this.addNode(parent, 'chunk', ``);
      }.bind(board);
      cbs.createSwitchNode = function (parent) {
        this.addSwitchNode(parent);
      }.bind(board);
      cbs.createDeferNode = function (parent) {
        this.addNode(parent, 'defer', `engine.defer();`);
      }.bind(board);
      cbs.createDeclNode = function (parent) {
        this.addNode(parent, 'declaration', `VAR_test = player.get('test')`);
      }.bind(board);
      cbs.createNextFileNode = function (parent) {
        dialog.show_input_with_select(
          expose.get_state('file-browser').file_list,
          null,
          name => {
            this.addNode(parent, 'next_file', name);
          }
        );
      }.bind(board);
    }
  } else if (file_node.type === 'choice_conditional') {
    cbs.copyNodeId = function (parent) {
      navigator.clipboard.writeText(parent.id);
      notify('Copied node ID to clipboard.', 'info');
    }.bind(board);
    cbs.setNodeCondition = function (parent) {
      this.enterLinkModeRef(parent);
    }.bind(board);
  } else {
    cbs.copyNodeId = function (parent) {
      navigator.clipboard.writeText(parent.id);
      notify('Copied node ID to clipboard.', 'info');
    }.bind(board);
  }

  exp.show(x, y, file_node, board.file, cbs);
};

export default exp;
