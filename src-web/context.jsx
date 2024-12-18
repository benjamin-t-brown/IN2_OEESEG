import React from 'react';
import ReactDOM from 'react-dom';
import expose from './expose';
import css from './css';
import utils, { random_id } from 'utils';
import dialog from 'dialog';
import { notify } from 'notifications';
import { getNode } from 'board';
import { getClassCheckForkTemplate } from 'templates/ClassCheckFork';
import { getPersonalityTestTemplate } from 'templates/PersonalityTest';

const exp = {};

/**
 * @typedef {import('./board.jsx').BoardNode} BoardNode
 */
/**
 * @typedef {import('./board.jsx').CombinedConditionalChoiceSubNode} CombinedConditionalChoiceSubNode
 */

const templates = [
  'createBasicOeesegRoom',
  'createFuncSelectItem',
  'createClassPassFail',
  'createPersonalityTest',
  'createBasicCarcerDialogue',
];

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
      case 'Create Combined Conditional Choice Node':
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
      case 'Create Sub Root': {
        return 'root';
      }
      case 'Create Basic Carcer Dialogue':
      case 'Create Personality Test':
      case 'Create Func Select Item':
      case 'Create Class Pass Fail':
      case 'Create Basic Oeeseg Room': {
        return 'template';
      }
      case 'Create Decl Node': {
        return 'decl2';
      }
      case 'Create Comment': {
        return 'comment';
      }
      default: {
        return 'decl';
      }
    }
  }

  renderItem(identifier, name, cb) {
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
        <div
          className="no-select"
          style={{
            color: templates.includes(identifier)
              ? css.colors.HIGHLIGHT_TEXT_DARK
              : css.colors.TEXT,
          }}
        >
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
        this.renderItem(i, name, this.props.cbs[i].bind(null, this.props.node))
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

let lastMousePosDiagram = null;
export const getMouseDiagramPosContext = () => {
  return lastMousePosDiagram;
};

exp.show_context_menu = function (board, elem) {
  if (utils.is_ctrl()) {
    return;
  }
  board.disable_context = true;
  const { x, y } = utils.get_mouse_pos();
  lastMousePosDiagram = utils.get_mouse_pos_rel_diagram();
  const cbs = {};
  console.log(
    'context',
    lastMousePosDiagram,
    elem,
    utils.getDeclsForFile(board.file)
  );
  const fileNode = getNode(board.file, elem?.id) ?? {};
  if (fileNode.type !== 'next_file' && board.nodeCanHaveChild(fileNode)) {
    if (fileNode.type === 'choice') {
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
        const addedNode = this.addNode(
          parent,
          'choice_conditional',
          'player.once()'
        );
        this.addNode(addedNode, 'choice_text');
      }.bind(board);
      cbs.createCombinedConditionalChoiceNode = function (parent) {
        /** @type {BoardNode} */
        const addedNode = this.addNode(
          parent,
          'combined_conditional_choice',
          'This node has no actual content.'
        );
        /** @type {CombinedConditionalChoiceSubNode} */
        const c = {
          id: random_id(9),
          actionId: random_id(9),
          conditionContent: 'true',
          prefixText: '',
          showTextOnFailedCondition: false,
          failedConditionText: 'Not available.',
          doActionOnChoose: false,
          onChooseActionContent:
            "player.set('amazing', true);" +
            '\n' +
            "core.setNextSayPrefix('{Your choice had some kind of effect.}\\n\\n');",
        };
        addedNode.combinedConditionalChoice = c;
      }.bind(board);
    } else if (fileNode.type === 'choice_conditional') {
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
    } else if (fileNode.type === 'switch') {
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
    } else if (elem) {
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
  } else if (fileNode.type === 'choice_conditional') {
    cbs.copyNodeId = function (parent) {
      navigator.clipboard.writeText(parent.id);
      notify('Copied node ID to clipboard.', 'info');
    }.bind(board);
    cbs.setNodeCondition = function (parent) {
      this.enterLinkModeRef(parent);
    }.bind(board);
  } else if (elem) {
    cbs.copyNodeId = function (parent) {
      navigator.clipboard.writeText(parent.id);
      notify('Copied node ID to clipboard.', 'info');
    }.bind(board);
  }

  if (!elem) {
    cbs.createComment = function () {
      this.addNode(null, 'text', 'COMMENT: ');
    }.bind(board);
    cbs.createSubRoot = function () {
      this.addNode(null, 'sub_root', 'sub_root');
    }.bind(board);
    cbs.createBasicOeesegRoom = function () {
      dialog.showTemplateCreateDialog({
        node: null,
        type: 'BasicOEESEGRoom',
        onConfirm: (content, location, replaceNodeIds) => {
          expose
            .get_state('board')
            .pasteSelection(content, location, replaceNodeIds);
          this.saveFile();
        },
        onCancel: () => {},
      });
    }.bind(board);
    cbs.createBasicCarcerDialogue = function () {
      dialog.showTemplateCreateDialog({
        node: null,
        type: 'BasicCarcerDialogue',
        onConfirm: (content, location, replaceNodeIds) => {
          expose
            .get_state('board')
            .pasteSelection(content, location, replaceNodeIds);
          this.saveFile();
        },
        onCancel: () => {},
      });
    }.bind(board);
    cbs.createFuncSelectItem = function () {
      dialog.showTemplateCreateDialog({
        node: null,
        type: 'FUNCSelectItem',
        onConfirm: (content, location, replaceNodeIds) => {
          expose
            .get_state('board')
            .pasteSelection(content, location, replaceNodeIds);
          this.saveFile();
        },
        onCancel: () => {},
      });
    }.bind(board);
    cbs.createClassPassFail = function () {
      const { template, location, replaceNodeIds } =
        getClassCheckForkTemplate();
      expose
        .get_state('board')
        .pasteSelection(template, location, replaceNodeIds);
      this.saveFile();
    }.bind(board);
    cbs.createPersonalityTest = function () {
      const { template, location, replaceNodeIds } =
        getPersonalityTestTemplate();
      expose
        .get_state('board')
        .pasteSelection(template, location, replaceNodeIds);
      this.saveFile();
    }.bind(board);
  }

  exp.show(x, y, fileNode, board.file, cbs);
};

export default exp;
