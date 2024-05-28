import React, { createRef, useEffect } from 'react';
import injectSheet from 'react-jss';
import expose from 'expose';
import utils, { getPlumb } from 'utils';
import context from 'context';
import dialog from 'dialog';
import css from 'css';
import DiagramNode from 'diagram-node';
import PlumbDiagram from 'plumb-diagram';
const $ = (window.$ = require('jquery'));

const BOARD_SIZE_PIXELS = 6400;

export const getNodeId = () => {
  let id;
  do {
    id = utils.random_id(9);
  } while (document.getElementById(id));
  return id;
};

const waitMs = ms => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

/**
 * @param {Object} file
 * @param {String} id
 * @returns {Object}
 */
export const getNode = (file, id) => {
  if (file) {
    for (let i in file.nodes) {
      if (file.nodes[i].id === id) {
        return file.nodes[i];
      }
    }
    return null;
  } else {
    return null;
  }
};

window.on_node_click = function (elem) {
  console.log('Click Event Not Overwritten!', elem);
};

window.on_node_unclick = function (elem) {
  console.log('Un-click Event Not Overwritten!', elem);
};

window.on_node_dblclick = function (elem) {
  console.log('DBLClick Event Not Overwritten!', elem);
};

window.on_node_rclick = function (elem) {
  console.log('RClick Event Not Overwritten!', elem);
};

window.on_delete_click = function (elem) {
  console.log('DeleteClick Event Not Overwritten!', elem);
};

window.on_node_mouseover = function (elem) {
  console.log('MouseOver Event Not Overwritten!', elem);
};

window.on_node_mouseout = function (elem) {
  console.log('MouseOut Event Not Overwritten!', elem);
};

window.center_on_active_node = function (elem) {
  expose.get_state('board').centerOnNode(elem);
};

class Board extends expose.Component {
  constructor(props) {
    super(props);
    const state = {};

    this.diagramContainer = createRef();
    this.diagramParent = createRef();

    this.file = props.file;
    this.panning = false;
    this.offsetX = 0;
    this.offsetY = 0;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.lastOffsetX = 0;
    this.lastOffsetY = 0;
    this.linkNode = null;
    this.linkNodeRef = null;
    this.dragSet = [];
    this.zoom = 1;
    this.maxZoom = 1;
    this.minZoom = 0.2;
    this.isSelectBoxVisible = false;
    this.selectPos = [0, 0];

    this.shouldRebuild = false;

    this.onKeydown = ev => {
      if (this.linkNode && ev.keyCode === 27) {
        this.exitLinkMode();
      } else if (this.dragSet.length && ev.keyCode === 27) {
        this.dragSet = [];
        getPlumb()?.clearDragSelection();
      }

      // if (!dialog.is_visible()) {
      //   if (String.fromCharCode(ev.which) === 'C' && !utils.is_ctrl()) {
      //     if (this.props.file) {
      //       expose.get_state('player-area').compile(this.props.file?.name);
      //     }
      //   } else if (String.fromCharCode(ev.which) === 'A' && !utils.is_ctrl()) {
      //     if (this.props.file) {
      //       expose.get_state('player-area').compile();
      //     }
      //   }
      // }
    };

    this.onMouseDown = ev => {
      if (dialog.is_visible() || ev.which === 3) {
        return;
      }
      if (utils.is_ctrl()) {
        ev.preventDefault();
        this.isSelectBoxVisible = true;
        this.selectPos = [ev.clientX, ev.clientY];
        const div = document.createElement('div');
        div.id = 'select-box';
        div.style.position = 'fixed';
        div.style.left = ev.clientX;
        div.style.top = ev.clientY;
        div.style.border = '4px solid white';
        div.style['min-width'] = '4px';
        div.style['min-height'] = '4px';
        div.style['pointer-events'] = 'none';
        document.body.appendChild(div);
      } else {
        this.panning = true;
        this.lastOffsetX = this.offsetX;
        this.lastOffsetY = this.offsetY;
        this.lastMouseX = ev.clientX;
        this.lastMouseY = ev.clientY;
      }
    };

    this.onMouseMove = ev => {
      if (this.panning) {
        this.offsetX =
          this.lastOffsetX + (this.lastMouseX - ev.clientX) * (1 / this.zoom);
        this.offsetY =
          this.lastOffsetY + (this.lastMouseY - ev.clientY) * (1 / this.zoom);
        this.renderAtOffset();
      } else if (this.isSelectBoxVisible) {
        const div = document.getElementById('select-box');
        const [origX, origY] = this.selectPos;
        const { clientX, clientY } = ev;
        div.style.width = Math.abs(clientX - origX);
        div.style.height = Math.abs(clientY - origY);

        if (clientX < origX) {
          div.style.left = clientX;
        } else {
          div.style.left = origX;
        }
        if (clientY < origY) {
          div.style.top = clientY;
        } else {
          div.style.top = origY;
        }
      }
    };

    this.onMouseUp = ev => {
      if (this.panning) {
        this.saveLocation();
      }
      this.panning = false;
      const div = document.getElementById('select-box');
      const rectCollides = (rect1, rect2) => {
        const { x: r1x, y: r1y, width: r1w, height: r1h } = rect1;
        const { x: r2x, y: r2y, width: r2w, height: r2h } = rect2;
        if (
          r1x + r1w >= r2x &&
          r1x <= r2x + r2w &&
          r1y + r1h >= r2y &&
          r1y <= r2y + r2h
        ) {
          return true;
        }
        return false;
      };

      if (div) {
        console.log('EV MOUSE UP', ev);
        if (!ev.shiftKey) {
          this.dragSet = [];
          getPlumb()?.clearDragSelection();
        }
        this.isSelectBoxVisible = false;
        const div = document.getElementById('select-box');
        const selectRect = div.getBoundingClientRect();
        for (let i in this.file.nodes) {
          const node = this.file.nodes[i];
          const item = document.getElementById(node.id);
          const rect = item.getBoundingClientRect();
          if (rectCollides(selectRect, rect)) {
            let ind = this.dragSet.indexOf(node.id);
            if (ind === -1) {
              getPlumb()?.addToDragSelection(node.id);
              this.dragSet.push(node.id);
            }
          }
        }
        this.isSelectBoxVisible = false;
        document.getElementById('select-box').remove();
        div.remove();
      }
    };

    this.onScroll = ev => {
      if (ev.ctrlKey) {
        ev.preventDefault();
      }

      const { offsetX, offsetY, scale } = utils.zoomWithFocalAndDelta({
        parentElem: this.diagramContainer.current,
        deltaY: ev.deltaY,
        scale: this.zoom,
        areaWidth: BOARD_SIZE_PIXELS,
        areaHeight: BOARD_SIZE_PIXELS,
        offsetX: this.offsetX,
        offsetY: this.offsetY,
        focalX: ev.clientX,
        focalY: ev.clientY,
        maxZoom: this.maxZoom,
        minZoom: this.minZoom,
      });

      this.zoom = scale;
      this.offsetX = offsetX;
      this.offsetY = offsetY;

      this.renderAtOffset();
      getPlumb().setZoom(this.zoom);

      this.saveLocation();
    };

    this.onDiagramDblClick = () => {};

    this.onNodeClick = window.on_node_click = elem => {
      let selectedNode = getNode(this.file, elem.id);
      if (this.linkNode) {
        let err = this.addLink(this.linkNode, selectedNode);
        if (err) {
          console.error('Error', 'Cannot create link', err);
          dialog.show_notification('Cannot create link. ' + err);
        }
        this.exitLinkMode();
      } else if (this.linkNodeRef) {
        this.setNodeContent(
          this.linkNodeRef,
          `player.get('nodes.${selectedNode.id}')`
        );
        this.linkNodeRef.rel = selectedNode.id;
        this.scheduleRebuild();
        this.exitLinkMode();
      } else if (utils.is_shift() || utils.is_ctrl()) {
        let ind = this.dragSet.indexOf(selectedNode.id);
        if (ind === -1) {
          getPlumb()?.addToDragSelection(selectedNode.id);
          this.dragSet.push(selectedNode.id);
        } else {
          getPlumb()?.removeFromDragSelection(selectedNode.id);
          this.dragSet.splice(ind, 1);
        }
      }
    };

    this.onNodeUnclick = window.on_node_unclick = elem => {
      let file_node = getNode(this.file, elem.id);
      //$('#diagram-parent').panzoom('enable');
      file_node.left = elem.style.left;
      file_node.top = elem.style.top;
      this.file.nodes.forEach(node_file => {
        let node = document.getElementById(node_file.id);
        node_file.left = node.style.left;
        node_file.top = node.style.top;
      });
      this.saveFile();
    };

    this.onNodeDblClick = window.on_node_dblclick = elem => {
      let file_node = getNode(this.file, elem.id);
      if (file_node.type === 'next_file') {
        dialog.show_input_with_select(
          expose.get_state('file-browser').file_list,
          file_node.content,
          content => {
            this.setNodeContent(file_node, content);
            this.scheduleRebuild();
            this.saveFile();
          }
        );
      } else if (file_node.type === 'chunk') {
        dialog.set_shift_req(true);
        dialog.show_input(
          file_node,
          content => {
            dialog.set_shift_req(false);
            this.setNodeContent(file_node, content);
            file_node.rel = null;
            this.scheduleRebuild();
            this.saveFile();
          },
          () => {
            dialog.set_shift_req(false);
          }
        );
      } else if (file_node.type === 'text') {
        dialog.set_shift_req(true);
        dialog.showTextNodeInput({
          node: file_node,
          onConfirm: content => {
            dialog.set_shift_req(false);
            this.setNodeContent(file_node, content);
            file_node.rel = null;
            this.scheduleRebuild();
            this.saveFile();
          },
          onCancel: () => {
            dialog.set_shift_req(false);
          },
        });
      } else if (
        file_node.type === 'action' ||
        file_node.type === 'declaration' ||
        file_node.type.includes('conditional') ||
        file_node.type.includes('pass')
      ) {
        dialog.set_shift_req(true);
        dialog.showActionNodeInput({
          node: file_node,
          onConfirm: content => {
            dialog.set_shift_req(false);
            this.setNodeContent(file_node, content);
            file_node.rel = null;
            this.scheduleRebuild();
            this.saveFile();
          },
          onCancel: () => {
            dialog.set_shift_req(false);
          },
        });
      } else {
        dialog.set_shift_req(false);
        dialog.show_input(file_node, content => {
          this.setNodeContent(file_node, content);
          file_node.rel = null;
          this.scheduleRebuild();
          this.saveFile();
        });
      }
    };

    this.onNodeRClick = window.on_node_rclick = elem => {
      context.show_context_menu(this, elem);
    };

    this.onNodeMouseOver = window.on_node_mouseover = elem => {
      // perf issue it think?
      // const node = getNode(this.file,elem.id);
      // expose.set_state('status-bar', {
      //   hoverText: `Double click to edit '${node.type}' node.`,
      // });
    };

    this.onNodeMouseOut = window.on_node_mouseout = () => {
      expose.set_state('status-bar', {
        hoverText: '',
      });
    };

    this.onConnRClick = (params, ev) => {
      let from_id = params.sourceId.split('_')[0];
      let to_id = params.targetId.split('_')[0];
      let from = getNode(this.file, from_id);
      let to = getNode(this.file, to_id);
      this.deleteLink(from, to);
      ev.preventDefault();
    };

    this.onDeleteClick = window.on_delete_click = elemId => {
      console.log('delete node', elemId);
      dialog.show_confirm('Are you sure you wish to delete this node?', () => {
        const nodeList = [getNode(this.file, elemId)];
        if (this.dragSet.includes(elemId)) {
          this.dragSet.forEach(id => {
            if (id !== elemId) {
              const node = getNode(this.file, id);
              if (node.type !== 'root') {
                nodeList.push(node);
              }
            }
          });
          this.dragSet = [];
          getPlumb()?.clearDragSelection();
        }
        setTimeout(() => {
          this.deleteNode(nodeList);
        });
      });
    };

    document.oncontextmenu = () => {
      if (this.disable_context) {
        this.disable_context = false;
        return false;
      } else {
        return true;
      }
    };

    this.connectLink = link => {
      let connection = getPlumb()?.connect({
        source: link.from + '_from',
        target: link.to + '_to',
        paintStyle: { stroke: 'rgba(255,255,255,0.2)', strokeWidth: 8 },
        endpointStyle: {
          fill: css.colors.PRIMARY,
          outlineStroke: css.colors.TEXT_LIGHT,
          outlineWidth: 5,
        },
        connector: [
          'Flowchart',
          {
            midpoint: 0.6,
            curviness: 30,
            cornerRadius: 2,
            stub: 0,
            alwaysRespectStubs: true,
          },
        ],
        endpoint: ['Dot', { radius: 2 }],
        overlays: [['Arrow', { location: 0.6, width: 20, length: 20 }]],
      });
      connection.bind('contextmenu', this.onConnRClick);
      connection.bind('mouseover', () => {
        expose.set_state('status-bar', {
          hoverText: 'Right click to delete this link.',
        });
      });
      connection.bind('mouseout', () => {
        expose.set_state('status-bar', {
          hoverText: '',
        });
      });
    };

    this.saveLocation = () => {
      utils.saveLocationToLocalStorage(
        expose.get_state('main').current_file.name,
        this.offsetX,
        this.offsetY,
        this.zoom
      );
    };

    this.loadLocation = () => {
      const loc = utils.getLocationFromLocalStorage(
        expose.get_state('main').current_file.name
      );
      if (loc) {
        if (loc.x !== null && loc.y !== null && loc.zoom !== null) {
          this.offsetX = loc.x;
          this.offsetY = loc.y;
          this.zoom = loc.zoom;
          this.renderAtOffset();
          getPlumb().setZoom(this.zoom);
        }
      }
    };
    state.loadLocation = this.loadLocation;

    this.centerOnNode = async nodeId => {
      const n = getNode(this.file, nodeId);
      if (n) {
        if (expose.get_state('player-area').visible) {
          const area = document
            .getElementById('player-area')
            .getBoundingClientRect();
          const node = document.getElementById(nodeId).getBoundingClientRect();
          this.offsetX =
            parseInt(n.left) + node.width / 2 - (window.innerWidth - 300) / 2;
          this.offsetY =
            parseInt(n.top) -
            area.height / 2 -
            node.height / 2 +
            window.innerHeight / 4;
          //const lastZoom = this.zoom;
          this.zoom = 1;
          this.renderAtOffset();
          getPlumb().setZoom(this.zoom);
        } else {
          const nodeElem = document.getElementById(nodeId);
          const node = nodeElem.getBoundingClientRect();
          this.offsetX =
            parseInt(n.left) + node.width / 2 - (window.innerWidth - 300) / 2;
          this.offsetY =
            parseInt(n.top) + node.height / 2 - window.innerHeight / 2;
          this.zoom = 1;
          this.renderAtOffset();
          getPlumb().setZoom(this.zoom);

          for (let i = 0; i < 3; i++) {
            nodeElem.style.opacity = '0.25';
            await waitMs(250);
            nodeElem.style.opacity = '1';
            await waitMs(250);
          }
        }
      }
    };
    state.centerOnNode = this.centerOnNode;

    this.copySelection = () => {
      const node_mapping = {};
      const links = [];
      const nodes = this.dragSet.map(id => {
        const node = getNode(this.file, id);
        const new_node = Object.assign({}, node);
        new_node.id = getNodeId();
        node_mapping[node.id] = new_node.id;
        return new_node;
      });
      this.dragSet.forEach(id => {
        const children = this.getChildren(getNode(this.file, id));
        children.forEach(child => {
          if (this.dragSet.includes(child.id)) {
            links.push({
              from: node_mapping[id],
              to: node_mapping[child.id],
            });
          }
        });
      });

      const anchorNode = nodes[0];
      if (anchorNode) {
        const anchorLeft = parseInt(anchorNode.left);
        const anchorTop = parseInt(anchorNode.top);
        for (const node of nodes.slice(1)) {
          const left = parseInt(node.left);
          const top = parseInt(node.top);
          node.left = left - anchorLeft + 'px';
          node.top = top - anchorTop + 'px';
        }
      }
      anchorNode.left = '0px';
      anchorNode.top = '0px';

      this.copySet = { nodes, links };
    };
    state.copySelection = this.copySelection;

    this.pasteSelection = () => {
      if (this.copySet) {
        let rootInd = -1;

        const { top, left } =
          this.diagramParent.current.getBoundingClientRect();

        // eslint-disable-next-line no-undef
        const newLinks = structuredClone(this.copySet.links);
        //JSON.parse(JSON.stringify(this.copySet.links));
        const newNodes = this.copySet.nodes.map((node, i) => {
          const newId = getNodeId();
          const newNode = Object.assign({}, node);
          newLinks.forEach(link => {
            if (link.to === node.id) {
              link.to = newId;
            }
            if (link.from === node.id) {
              link.from = newId;
            }
          });
          newNode.id = newId;

          const inverseZoom = 1 / this.zoom;

          const clientX =
            -left * inverseZoom + (window.innerWidth * inverseZoom) / 2;
          const clientY =
            -top * inverseZoom + (window.innerHeight * inverseZoom) / 2;

          newNode.left = clientX + parseInt(node.left) - 300 + 'px';
          newNode.top = clientY + parseInt(node.top) - 100 + 'px';
          if (newNode.type === 'root') {
            rootInd = i;
          }
          return newNode;
        });

        if (rootInd > -1) {
          const newRoot = newNodes.splice(rootInd, 1)[0];
          const oldRoot = this.file.nodes[0];
          oldRoot.content = newRoot.content;
          newLinks.forEach(link => {
            if (link.from === newRoot.id) {
              link.from = oldRoot.id;
            }
          });
        }

        newNodes.forEach(node => {
          this.file.nodes.push(node);
        });
        newLinks.forEach(link => {
          this.file.links.push(link);
        });
        this.dragSet = [];
        getPlumb()?.clearDragSelection();

        this.scheduleRebuild();
        this.saveFile();

        // needs a timeout or I think js plumb gets confused about what is selected after
        // rebuilding diagram
        setTimeout(() => {
          newNodes.forEach(node => {
            getPlumb()?.addToDragSelection(node.id);
            this.dragSet.push(node.id);
          });
        }, 100);
      }
    };
    state.pasteSelection = this.pasteSelection;

    //remove (item-error, item-active) from nodes
    this.removeAllExtraClasses = () => {
      $('.jtk-draggable')
        .removeClass('item-active')
        .removeClass('item-error')
        .css('outline', '');
    };
    state.removeAllExtraClasses = this.removeAllExtraClasses;

    state.addNode = (parent, type, defaultText) => {
      return this.addNode(parent, type, defaultText);
    };
    state.saveFile = () => {
      this.saveFile();
    };
    state.buildDiagram = () => {
      this.forceUpdate();
      // this.scheduleRebuild();
    };

    utils.set_on_copy(() => {
      if (!dialog.is_visible()) {
        this.copySelection();
      }
    });
    utils.set_on_paste(() => {
      if (!dialog.is_visible()) {
        this.pasteSelection();
      }
    });

    state.getOffset = () => {
      return { x: this.offsetX, y: this.offsetY };
    };

    this.state = state;
    this.expose('board');
  }

  scheduleRebuild() {
    this.forceUpdate();
  }

  UNSAFE_componentWillReceiveProps(props) {
    if (this.file && this.file !== props.file) {
      this.shouldRebuild = true;
    }
    this.file = props.file;
  }

  componentDidMount() {
    console.log('board mounted');
    // jsPlumb.ready(() => {
    //   console.log('jsPlumb ready');
    //   window.plumb = getPlumb()? = jsPlumb.getInstance({
    //     PaintStyle: { strokeWidth: 1 },
    //     Anchors: [['TopRight']],
    //     Container: this.diagram.current,
    //   });
    //   rebuild();
    //   this.loadLocation();
    // });
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('keydown', this.onKeydown);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('wheel', this.onScroll);
  }
  componentWillUnmount() {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('keydown', this.onKeydown);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('wheel', this.onScroll);
    this.exitLinkMode();
  }
  componentDidUpdate() {
    // if (this.shouldRebuild) {
    //   setTimeout(
    //     (() => {
    //       rebuild();
    //     },
    //     100)
    //   );
    //   this.shouldRebuild = false;
    // }
    // this.offsetX = 0;
    // this.offsetY = 0;
    // this.zoom = 1;
    // getPlumb()?.empty(this.diagram.current);
    // jsPlumb.ready(() => {
    //   this.buildDiagram();
    //   this.renderAtOffset();
    //   getPlumb().setZoom(this.zoom);
    // });
  }

  saveFile() {
    clearTimeout(this.savetimeout);
    this.savetimeout = setTimeout(() => {
      const file = this.file;
      if (file !== null) {
        utils.post('/file/' + file.name, file, () => {
          console.log('Successfully saved.');
        });
      }
    }, 500);
  }

  enterLinkMode(parent) {
    expose.set_state('status-bar', {
      isInLinkMode: true,
    });
    setTimeout(() => {
      this.linkNode = parent;
      this.diagramContainer.current.class =
        'no-drag linking ' + this.props.classes.diagramArea;
    }, 150);
  }
  enterLinkModeRef(parent) {
    expose.set_state('status-bar', {
      isInLinkMode: true,
    });
    setTimeout(() => {
      this.linkNodeRef = parent;
      this.diagramContainer.current.class =
        'no-drag linking ' + this.props.classes.diagramArea;
    }, 150);
  }
  exitLinkMode() {
    this.linkNode = false;
    this.linkNodeRef = false;
    this.diagramContainer.current.class =
      'no-drag movable ' + this.props.classes.diagramArea;
    expose.set_state('status-bar', {
      isInLinkMode: false,
    });
  }

  setNodeContent(node, content) {
    node.content = content;
    document.getElementById(node.id).children[1].innerHTML = content;
    this.renderAtOffset();
    getPlumb().setZoom(this.zoom);
  }

  getChildren(node) {
    return this.file.links
      .filter(link => {
        return link.from === node.id;
      })
      .map(link => {
        return getNode(this.file, link.to);
      });
  }

  getParents(node) {
    return this.file.links
      .filter(link => {
        return link.to === node.id;
      })
      .map(link => {
        return getNode(this.file, link.from);
      });
  }

  getLinkIndex(from_id, to_id) {
    if (this.file) {
      for (let i in this.file.links) {
        if (
          this.file.links[i].from === from_id &&
          this.file.links[i].to === to_id
        ) {
          return i;
        }
      }
      return -1;
    } else {
      return -1;
    }
  }

  nodeHasChild(node) {
    if (this.file) {
      for (let i in this.file.links) {
        if (this.file.links[i].from === node.id) {
          return true;
        }
      }
      return false;
    } else {
      return false;
    }
  }

  nodeCanHaveChild(node) {
    if (node.type !== 'choice' && node.type !== 'switch') {
      if (this.nodeHasChild(node)) {
        return false;
      } else {
        return true;
      }
    }
    return true;
  }

  addLink(from, to) {
    let link = this.getLinkIndex(from.id, to.id);
    if (link !== -1) {
      return 'That specific link already exists.';
    }

    if (from.type === 'text' && this.nodeHasChild(from)) {
      return 'That text node already has a child.';
    }
    if (from.type === 'chunk' && this.nodeHasChild(from)) {
      return 'That chunk node already has a child.';
    }
    if (to.type === 'root') {
      return 'You cannot link to the root node.';
    }
    if (from.type === 'choice_conditional' && to.type !== 'choice_text') {
      return 'You can only link a Choice Conditional to a Choice Text.';
    }
    if (from.type === 'switch' && to.type !== 'switch_conditional') {
      return 'You can only link a Switch Conditional to a Switch node.';
    }
    if (
      (to.type === 'choice_text' || to.type === 'choice_conditional') &&
      this.getParents(to).length
    ) {
      if (this.getParents(to).length) {
        return 'You can only link to a Choice Text or Choice Conditional without a parent.';
      }
    }
    if (to.type === 'pass_text' || to.type === 'fail_text') {
      return 'You cannot link to Pass or Fail nodes.';
    }
    if (from.type === 'next_file') {
      return 'You cannot link from a Next File node.';
    }

    link = {
      from: from.id,
      to: to.id,
    };
    this.file.links.push(link);
    this.saveFile();
    this.scheduleRebuild();
  }

  addNode(parent, type, defaultText) {
    const id = getNodeId();
    const parentElem = document.getElementById(parent.id);
    const rect = parentElem?.getBoundingClientRect() ?? { height: 100 };
    const node = {
      id: id,
      type: type,
      content:
        defaultText === undefined
          ? 'This node currently has no actual content.'
          : defaultText,
      left: parent.left,
      top: parseInt(parent.top) + (rect.height + 30) + 'px',
    };
    this.file.nodes.push(node);
    const link = {
      to: id,
      from: parent.id,
    };
    this.file.links.push(link);
    this.saveFile();
    this.scheduleRebuild();
    return node;
  }

  addSwitchNode(parent) {
    const node = this.addNode(parent, 'switch', 'switch');
    const idDefault = getNodeId();
    const parent_elem = document.getElementById(parent.id);
    const rect = parent_elem.getBoundingClientRect();
    const nodeDefault = {
      id: idDefault,
      type: 'switch_default',
      content: 'default',
      left: parseInt(node.left),
      top: parseInt(parent.top) + (rect.height + 120) + 'px',
    };
    this.file.nodes.push(nodeDefault);
    this.file.links.push({
      to: idDefault,
      from: node.id,
    });
    this.saveFile();
    this.scheduleRebuild();
    return node;
  }

  addPassFailNode(parent) {
    let node = this.addNode(
      parent,
      'pass_fail',
      'player.once() ? true : false'
    );
    let idPass = getNodeId();
    let idFail = getNodeId();
    let parentElem = document.getElementById(parent.id);
    let rect = parentElem.getBoundingClientRect();
    let nodePass = {
      id: idPass,
      type: 'pass_text',
      content: '',
      left: parseInt(node.left) - 115 + 'px',
      top: parseInt(parent.top) + (rect.height + 90) + 'px',
    };
    let nodeFail = {
      id: idFail,
      type: 'fail_text',
      content: '',
      left: parseInt(node.left) + 115 + 'px',
      top: parseInt(parent.top) + (rect.height + 90) + 'px',
    };
    this.file.nodes.push(nodePass, nodeFail);
    this.file.links.push({
      to: idPass,
      from: node.id,
    });
    this.file.links.push({
      to: idFail,
      from: node.id,
    });
    this.saveFile();
    this.scheduleRebuild();
    return node;
  }

  deleteLink(from, to) {
    let ind = this.getLinkIndex(from.id, to.id);
    if (to.type === 'pass_text' || from.type === 'pass_fail') {
      return;
    }
    if (ind > -1) {
      dialog.show_confirm('Are you sure you wish to delete this link?', () => {
        this.file.links.splice(ind, 1);
        this.scheduleRebuild();
      });
    } else {
      console.error(
        'ERROR',
        'no link exists that you just clicked on',
        from,
        to,
        this.file.links
      );
    }
  }

  deleteNode(nodes) {
    let _delete = node => {
      for (let i in this.file.nodes) {
        if (node === this.file.nodes[i]) {
          this.file.nodes.splice(i, 1);
          break;
        }
      }

      this.file.links = this.file.links.filter(link => {
        if (link.to === node.id || link.from === node.id) {
          return false;
        } else {
          return true;
        }
      });
    };

    let nodesToDelete = [];

    const _selectAndDelete = node => {
      if (node.type === 'pass_fail' || node.type === 'switch') {
        let children = this.getChildren(node);
        for (let i in children) {
          _delete(children[i]);
        }
        _delete(node);
      } else if (
        node.type === 'pass_text' ||
        node.type === 'fail_text' ||
        node.type === 'switch_default'
      ) {
        let parents = this.getParents(node);
        for (let i in parents) {
          nodesToDelete.push(parents[i]);
        }
      } else {
        _delete(node);
      }
    };

    console.log('DELETE NODE?', nodes);

    if (Array.isArray(nodes)) {
      nodesToDelete = nodes;
    } else {
      nodesToDelete = [nodes];
    }
    // mutable array, must use index instead of iterator
    for (let i = 0; i < nodesToDelete.length; i++) {
      const node = nodesToDelete[i];
      _selectAndDelete(node);
    }

    this.saveFile();
    this.scheduleRebuild();
  }

  connectLink = link => {
    const connection = getPlumb().connect({
      source: link.from + '_from',
      target: link.to + '_to',
      paintStyle: { stroke: 'rgba(255,255,255,0.2)', strokeWidth: 8 },
      endpointStyle: {
        fill: css.colors.PRIMARY,
        outlineStroke: css.colors.TEXT_LIGHT,
        outlineWidth: 5,
      },
      connector: [
        'Flowchart',
        {
          midpoint: 0.6,
          curviness: 30,
          cornerRadius: 2,
          stub: 0,
          alwaysRespectStubs: true,
        },
      ],
      endpoint: ['Dot', { radius: 2 }],
      overlays: [['Arrow', { location: 0.6, width: 20, length: 20 }]],
    });
    connection.bind('contextmenu', this.onConnRClick);
    connection.bind('mouseover', () => {
      expose.set_state('status-bar', {
        hoverText: 'Right click to delete this link.',
      });
    });
    connection.bind('mouseout', () => {
      expose.set_state('status-bar', {
        hoverText: '',
      });
    });
  };

  renderAtOffset() {
    utils.renderAt({
      elem: this.diagramParent.current,
      scale: this.zoom,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
    });
  }

  render() {
    const { classes } = this.props;
    return (
      <div
        id="diagram-area"
        className={'no-drag movable ' + classes.diagramArea}
        ref={this.diagramContainer}
        onMouseDown={ev => {
          ev.preventDefault();
        }}
        onDragStart={ev => {
          ev.preventDefault();
          return false;
        }}
        onDrop={ev => {
          ev.preventDefault();
          return false;
        }}
      >
        <div
          id="diagram-parent"
          ref={this.diagramParent}
          className={classes.diagramParent}
        >
          <PlumbDiagram
            classes={classes}
            file={this.file}
            renderAtOffset={this.renderAtOffset}
            loadLocation={this.loadLocation}
            connectLink={this.connectLink}
            zoom={this.zoom}
          />
        </div>
      </div>
    );
  }
}

const styles = theme => ({
  diagramArea: {
    position: 'relative',
    width: BOARD_SIZE_PIXELS + 'px',
    height: BOARD_SIZE_PIXELS + 'px',
  },
  diagramParent: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    left: 0,
    top: 0,
  },
  diagram: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: theme.colors.BG,
  },
});

export default injectSheet(styles)(Board);
