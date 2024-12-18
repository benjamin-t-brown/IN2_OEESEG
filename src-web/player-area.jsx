const React = require('react');
const expose = require('expose');
const css = require('css');
const utils = require('utils');
const core = require('core-in2');
const $ = require('jquery');

function escapeHtml(unsafe) {
  // lol
  if (unsafe.includes('span')) {
    return unsafe;
  }
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const canvasCoordsToWorldCoords = (x, y) => {
  return {
    x: (x / 514) * 100,
    y: (y / 514) * 100,
  };
};

const worldCoordsToCanvasCoords = (x, y) => {
  return {
    x: (x / 100) * 514,
    y: (y / 100) * 514,
  };
};

const Canvas = () => {
  const [mouseCoords, setMouseCoords] = React.useState({ x: 0, y: 0 });

  const handleCanvasMouseMove = ev => {
    const { x, y } = canvasCoordsToWorldCoords(
      ev.nativeEvent.offsetX,
      ev.nativeEvent.offsetY
    );
    setMouseCoords({
      x: Math.round(x),
      y: Math.round(y),
    });
  };
  return (
    <div id="canvasArea" style={{ position: 'relative', height: '514px' }}>
      <div
        style={{
          position: 'relative',
        }}
      >
        <canvas
          width="1"
          height="1"
          id="player-canvas"
          onMouseMove={handleCanvasMouseMove}
        ></canvas>
      </div>
      <div>
        x: {mouseCoords.x}, y: {mouseCoords.y}
      </div>
    </div>
  );
};

let globalLines = [];

module.exports = class PlayerArea extends expose.Component {
  constructor(props) {
    super(props);
    this.last_index_shown = -1;
    this.choiceClicks = {};
    globalLines = [];

    this.show = () => {
      this.last_index_shown = -1;
      core.enable();
      this.setState({
        visible: true,
      });
    };

    this.hide = () => {
      globalLines = [];
      expose.get_state('board').removeAllExtraClasses();
      core.disable();
      this.setState({
        visible: false,
      });
    };

    this.add_line = (line, onClick, color, id) => {
      const arr = globalLines;

      if (onClick) {
        const localId = id || utils.random_id(10);
        this.choiceClicks[localId] = onClick;
        arr.push({
          text: escapeHtml(line),
          id: localId,
          color,
          isChoice: true,
        });
      } else if (color) {
        arr.push({
          text: escapeHtml(line),
          color,
          id,
        });
      } else {
        arr.push({ text: escapeHtml(line), id });
      }
      if (this.timeout !== null) {
        clearTimeout(this.timeout);
      }
      this.timeout = setTimeout(() => {
        this.timeout = null;
        this.setState({
          text: globalLines,
        });
      }, 100);
    };

    this.remove_choice_clicks = () => {
      const self = this;
      $('.choice-in2').map(function () {
        this.onclick = '';
        self.state.text.forEach(t => {
          if (typeof t === 'object') {
            // t.id = undefined;
            t.color = undefined;
            t.isChoice = false;
          }
        });
      });
    };

    this.get_choice_clicks_to_remove = () => {
      const self = this;
      return $('.choice-in2').map(
        () =>
          function () {
            this.onclick = '';
            self.state.text.forEach(t => {
              if (typeof t === 'object') {
                // t.id = undefined;
                t.color = undefined;
                t.isChoice = false;
              }
            });
          }
      );
    };

    this.remove_line = id => {
      // eslint-disable-next-line no-undef
      const arr = globalLines;
      let ind = 0;
      while (ind > -1) {
        ind = arr.findIndex(t => t.id === id);
        if (ind > -1) {
          arr.splice(ind, 1);
        }
      }
    };

    this.compile = (filename, nodeId) => {
      if (this.state.visible) {
        return;
      }

      const canvas = document.getElementById('player-canvas');
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      this.show();
      expose.get_state('board').removeAllExtraClasses();

      const _on_compile = resp => {
        if (resp.data.success) {
          core.runFile(resp.data.file, filename, nodeId);
        } else {
          this.add_line('Failure!');
          this.setState({
            errors: resp.data.errors,
          });
        }
      };

      if (filename && typeof filename === 'object') {
        const fileList = filename;
        utils.post(
          '/compile',
          {
            files: fileList,
          },
          _on_compile
        );
        this.setState({
          text: ['Compiling... ' + fileList.join(', ')],
          errors: [],
        });
      } else {
        this.setState({
          text: ['Compiling... ' + (filename ? filename : 'ALL')],
          errors: [],
        });
        utils.get('/compile' + (filename ? '/' + filename : ''), _on_compile);
      }
    };

    this.onEscapePress = ev => {
      if (ev.which === 27) {
        this.hide();
      }
    };

    window.on_choice_click = id => {
      // const clicksToRemove = this.get_choice_clicks_to_remove();
      const keepChoiceClicks = this.choiceClicks[id]();
      // console.log('ON CHOICE CLICk', id, keepChoiceClicks);
      // if (!keepChoiceClicks) {
      //   clicksToRemove.forEach(c => c());
      // }
    };

    this.state = {
      text: [],
      errors: [],
      visible: false,
      show: this.show,
      hide: this.hide,
      add_line: this.add_line,
      remove_line: this.remove_line,
      compile: this.compile,
      remove_choice_clicks: this.remove_choice_clicks,
    };

    this.expose('player-area');
  }

  componentDidUpdate() {
    const n = document.getElementById('player-text-area');
    n.scrollTop = n.scrollHeight;
    this.last_index_shown = this.state.text.length - 1;
  }
  componentDidMount() {
    this.last_index_shown = this.state.text.length - 1;
    window.addEventListener('keydown', this.onEscapePress);
  }
  componentWillUnmount() {
    window.removeEventListener('keydown', this.onEscapePress);
  }

  render() {
    return React.createElement(
      'div',
      {
        id: 'player-area',
        onMouseDown: ev => {
          if (ev.nativeEvent.which === 1) {
            if (ev.target.id === 'close-player') {
              this.hide();
            } else if (ev.target.className === 'player-error') {
              const arr = ev.target;
              expose
                .get_state('file-browser')
                .loadFileExternal(arr.title, () => {
                  const id = arr.id.slice(6);
                  expose.get_state('board').centerOnNode(id);
                  $('#' + id).addClass('item-error');
                });
            } else {
              core._core.getEventCallback()(ev);
              // setTimeout(() => {
              // });
            }
          }
          ev.stopPropagation();
          ev.nativeEvent.stopImmediatePropagation();
        },
        onWheel: ev => {
          ev.stopPropagation();
        },
        onMouseEnter: () => {
          //$('#diagram-parent').panzoom('disable');
        },
        onMouseLeave: () => {
          //$('#diagram-parent').panzoom('enable');
        },
        style: {
          cursor: 'default',
          height: window.innerHeight / 1.5 + 'px',
          width: '100%',
          backgroundColor: css.colors.TEXT_DARK,
          color: css.colors.TEXT_LIGHT,
          display: this.state.visible ? 'flex' : 'none',
          justifyContent: 'center',
          position: 'fixed',
          left: 0,
          top: window.innerHeight - window.innerHeight / 1.5,
          borderTop: '2px solid ' + css.colors.PRIMARY_ALT,
        },
      },
      React.createElement(
        'div',
        {
          style: {
            width: '30x',
          },
        },
        React.createElement(
          'div',
          {
            id: 'close-player',
            style: {
              position: 'absolute',
              right: '30px',
              top: '5px',
              color: 'red',
              fontSize: '16px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              background: 'black',
            },
          },
          'Close'
        )
      ),
      <Canvas />,
      React.createElement(
        'div',
        {
          id: 'player-text-area',
          style: {
            height: '100%',
            backgroundColor: css.colors.BG,
            overflowY: 'scroll',
            scrollBehavior: 'smooth',
            width: '700px',
            font: '18px courier new',
          },
        },
        React.createElement('div', {
          dangerouslySetInnerHTML: {
            __html:
              this.state.text.reduce((prev, curr, i) => {
                if (typeof curr === 'string') {
                  if (curr.indexOf('EXECUTION WARNING') > -1) {
                    return (
                      prev +
                      '<br/><span style="color:red">' +
                      curr.replace(/\n/g, '<br/>') +
                      '</span>'
                    );
                  } else if (
                    i > this.last_index_shown &&
                    curr.indexOf('Press any key to continue') === -1
                  ) {
                    return (
                      prev +
                      '<br/><span class="new-player-text">' +
                      curr.replace(/\n/g, '<br/>') +
                      '</span>'
                    );
                  } else {
                    return prev + '<br/>' + curr.replace(/\n/g, '<br/>');
                  }
                } else if (typeof curr === 'object') {
                  const { text, id, color, isChoice } = curr;

                  if (text.indexOf('EXECUTION WARNING') > -1) {
                    return (
                      prev +
                      '<br/><span style="color:red">' +
                      text.replace(/\n/g, '<br/>') +
                      '</span>'
                    );
                  }

                  let html = '';

                  if (!isChoice) {
                    html =
                      `<br/><span style="color:${color};">` +
                      text.replace(/\n/g, '<br/>') +
                      '</span>';
                  } else {
                    html =
                      '<br/>' +
                      `<span class="choice-in2" id="${id}" style="color:${
                        color || ''
                      };" onclick="on_choice_click('${id}')">${text.replace(
                        /\n/g,
                        '<br/>'
                      )}</span>`;
                  }
                  return prev + html;
                }
              }, '') + '<br/>       <br/><br/><br/><br/><br/><br/>',
          },
          style: {
            width: '90%',
            paddingLeft: '5%',
          },
        }),
        React.createElement(
          'div',
          {
            style: {
              width: '90%',
              paddingLeft: '5%',
            },
          },
          this.state.errors.map(error => {
            return React.createElement(
              'div',
              {
                key: error.text + error.node_id,
                className: 'player-error',
                title: error.filename,
                id: 'error_' + error.node_id,
                style: {
                  width: '100%',
                },
              },
              error.filename + '|' + error.node_id + '|' + error.text,
              <br />,
              <br />
            );
          })
        )
      )
    );
  }
};
