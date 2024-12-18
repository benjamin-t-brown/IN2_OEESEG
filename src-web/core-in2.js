const $ = require('jquery');
const expose = require('expose');
const utils = require('utils');
const { notify } = require('notifications');

window.IN2 = true;

const LOCAL_STORAGE_SAVE_STATE_KEY = 'in2_save_state';
const CANVAS_ID = 'player-canvas';

exports.setSaveData = initialState => {
  localStorage.setItem(
    LOCAL_STORAGE_SAVE_STATE_KEY,
    JSON.stringify(initialState)
  );
};
exports.getSaveData = () => {
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_SAVE_STATE_KEY) || '{}');
};

const _console_log = (text, onClick, color, id) => {
  expose
    .get_state('player-area')
    .add_line((text || '').trim(), onClick, color, id);
};

const centerAtActiveNode = () => {
  const board = expose.get_state('board');
  board.removeAllExtraClasses();
  const active_node_id = exports.player().get('curIN2n');
  const active_file_name = exports.player().get('curIN2f');
  if (active_node_id) {
    const elem = document.getElementById(active_node_id);
    if (elem) {
      board.removeAllExtraClasses();
      $('#' + active_node_id).css('outline', '4px solid green');
      board.centerOnNode(active_node_id);
    } else {
      expose
        .get_state('file-browser')
        .loadFileExternal(active_file_name, () => {
          const elem = document.getElementById(active_node_id);
          if (elem) {
            board.removeAllExtraClasses();
            $('#' + active_node_id).css('outline', '4px solid green');
            setTimeout(() => {
              board.centerOnNode(active_node_id);
            }, 33);
          }
        });
    }
  }
};

const getDraw = () => {
  /** @ts-ignore */
  return {
    renderLine: (text, color) => {
      _console_log(text, undefined, color);
    },
    /**
     * @param {Choice[]} choices
     */
    showButtons: choices => {
      _console_log('---------');
      for (const { text, color, onClick } of choices) {
        _console_log(text, onClick, color);
      }
    },
    hideButtons: () => {},
    showPressAnyKey: () => {
      _console_log(
        '     Press any key to continue...',
        null,
        '#DDD',
        'press-any-key'
      );
    },
    hidePressAnyKey: () => {
      expose.get_state('player-area').remove_line('press-any-key');
    },
  };
};

const addTextLine = args => {
  const { text, paragraph, color } = args;
  if (paragraph) {
    // getDraw().renderLine('', color);
    // console.log();
  }
  // console.log(text);
  getDraw().renderLine(text, color);
  if (paragraph) {
    // console.log();
    getDraw().renderLine('', color);
    getDraw().renderLine('', color);
  }
};

/**
 * @interface Choice
 * @property {string} t
 * @property {string | null} ft
 * @property {boolean} failed
 * @property {string} id
 * @property {function} cb
 * @property {function} c
 * @property {boolean} chosen
 */

/**
 * @param {Choice[]} choices
 * @param {function} eventCallback
 */
const addChoiceLines = (choices, eventCallback) => {
  const buttons = choices.map((c, i) => {
    return {
      text: i + 1 + '.) ' + (c.failed ? c.ft : c.t),
      color: c.failed ? '#a44' : undefined,
      onClick: () => {
        if (c.failed) {
          return true;
        }
        eventCallback({
          which: `${i + 1}`.charCodeAt(0),
        });
      },
    };
  });
  getDraw().showButtons(buttons);
};

const createCore = () => {
  // let lastChooseNodeId = null;
  // let lastChooseNodesSelected = [];
  let isKeypressDisabled = false;
  // eslint-disable-next-line no-unused-vars
  const DEFAULT_EVENT = ev => {};
  let eventCallback = DEFAULT_EVENT;

  const setEventCallback = cb => {
    eventCallback = cb;
  };

  const onKeyOrMouseEvent = ev => {
    if (isKeypressDisabled) {
      return;
    }
    eventCallback(ev);
  };

  const globalWindow = window;
  if (globalWindow.globalOnKeyOrMouseEvent) {
    window.removeEventListener('keydown', globalWindow.globalOnKeyOrMouseEvent);
    window.removeEventListener(
      'mousedown',
      globalWindow.globalOnKeyOrMouseEvent
    );
  }
  globalWindow.globalOnKeyOrMouseEvent = onKeyOrMouseEvent;

  window.addEventListener('keydown', onKeyOrMouseEvent);
  window.addEventListener('mousedown', onKeyOrMouseEvent);

  const isChoiceNode = id => {
    const scope = _player.get('scope');
    return scope?.[id]?.isChoice;
  };

  const isTextNode = id => {
    const scope = _player.get('scope');
    return scope?.[id]?.isText;
  };

  const hasPickedChoice = id => {
    return _player.get('nodes')?.[id || ''];
  };

  return {
    init() {},
    setKeypressEnabled(v) {
      isKeypressDisabled = !v;
    },
    // in2 only
    getEventCallback() {
      return eventCallback;
    },
    setNextSayPrefix(prefix) {
      _player.set('nextSayPrefix', prefix);
    },
    async say(text, cb, id, childId) {
      return new Promise(resolve => {
        setEventCallback(() => {
          getDraw().hidePressAnyKey();
          setEventCallback(DEFAULT_EVENT);
          cb && cb();
          resolve(undefined);
        });
        if (text) {
          const nextSayPrefix = _player.get('nextSayPrefix');
          if (nextSayPrefix) {
            text = nextSayPrefix + ' ' + text;
            _player.set('nextSayPrefix', '');
          }
          addTextLine({
            text: text,
            paragraph: true,
            color: '',
          });
        }

        getDraw().showPressAnyKey();
        if (!text || isChoiceNode(childId)) {
          eventCallback({});
        } else {
          centerAtActiveNode();
        }
      });
    },
    async choose(text, id, choices) {
      return new Promise(resolve => {
        _player.dontTriggerOnce = true;
        const availableChoices = choices.filter(choice => {
          const condition = choice.c();
          if (condition || choice.ft) {
            if (!condition) {
              choice.failed = true;
            }
            return true;
          }
        });
        _player.dontTriggerOnce = false;

        setEventCallback(ev => {
          const number = Number(String.fromCharCode(ev.which));
          const choice = availableChoices[number - 1];
          if (choice) {
            expose.get_state('player-area').remove_choice_clicks();
            addTextLine({
              text: choice.t,
              color: 'grey',
              paragraph: true,
            });
            getDraw().hideButtons();
            setEventCallback(DEFAULT_EVENT);
            // invoke once if it hasn't been invoked
            choice.c();
            choice.cb();
            resolve(undefined);
          }
        });

        if (text) {
          addTextLine({
            text,
            paragraph: true,
            color: '',
          });
        }
        centerAtActiveNode();
        addChoiceLines(
          availableChoices.map(c => {
            if (c.failed) {
              return {
                ...c,
                chosen: false,
              };
            } else {
              return {
                ...c,
                chosen: hasPickedChoice(c.id),
              };
            }
          }),
          eventCallback
        );
      });
    },
    exit() {},
    reset() {},
  };
};

const createPlayer = () => {
  const _get = (data, path, defaultValue) => {
    path = String(path);

    if (!path) {
      return defaultValue;
    }

    const value = path?.split('.').reduce((value, key) => value?.[key], data);

    return value ?? defaultValue;
  };

  const _set = (obj, path, value) => {
    if (typeof obj !== 'object') {
      return obj;
    }
    const arr = path.split('.');
    let i = 0;
    let currentObj = obj;
    let key = arr[i];
    while (i < arr.length - 1) {
      if (typeof currentObj[key] !== 'object') {
        currentObj[key] = {};
      }
      currentObj = currentObj[key];
      i++;
      key = arr[i];
    }
    currentObj[key] = value;
    return obj;
  };

  return {
    state: {},
    name: '',
    dontTriggerOnce: false,
    init() {
      this.state = {};
    },

    get(path) {
      // dumb hack
      path = path.replace(/\.json/g, '');
      return _get(this.state, path, undefined);
    },

    set(path, val) {
      if (path === 'curIN2n') {
        const existingNode = this.get('curIN2n');
        if (existingNode) {
          this.set('lasIN2n', existingNode);
        }
        this.set('nodes.' + val, true);
      }
      if (path === 'curIN2f') {
        this.set('files.' + val.replace('.json', ''), true);
      }
      // dumb hack
      path = path.replace(/\.json/g, '');
      return _set(this.state, path, val);
    },

    setIfUnset(path, val) {
      if (this.get(path) === undefined) {
        this.set(path, val);
      }
    },

    increment(path, val) {
      let current = this.get(path);
      if (isNaN(current) || current === null) {
        current = 0;
      }
      this.set(path, current + val);
    },

    once(arg) {
      const nodeId = arg ?? this.get('curIN2n');
      const key = 'once.' + nodeId;
      if (!this.get(key)) {
        if (!this.dontTriggerOnce) {
          this.set(key, true);
        }
        return true;
      }
      return false;
    },

    // custom functions
    clearArgs() {
      this.set('args', {});
    },
  };
};

/** @ts-ignore */
const _player = (exports._player = window.player = createPlayer());
/** @ts-ignore */
const _core = (exports._core = window.core = createCore());

exports.core = function () {
  return exports._core;
};

exports.player = function () {
  return window.player;
};

exports.disable = window.disable = function () {
  _core.setKeypressEnabled(false);
  _core.exit();
};

exports.enable = window.enable = function () {
  _core.setKeypressEnabled(true);
};

window.addEventListener('unhandledrejection', function (promiseRejectionEvent) {
  _console_log('EXECUTION WARNING ' + promiseRejectionEvent.reason);
});

function evalInContext(js, context) {
  return function () {
    return eval(js); //eslint-disable-line no-eval
  }.call(context);
}

window.cachedSounds = {};
window.cachedImages = {};

const postfix = `
window.core = window?.core?.origCore || window.core;
// window._core.origCore = window.core;
window.player = {...window._player};
window.core = {...window._core};
`;

let standalone = '';
exports.runFile = async function (file, fileId, nodeId) {
  _console_log('Success!');
  _console_log('');
  console.log('Now evaluating...');
  window._core = exports._core;
  window._player = exports._player;
  window._player.state = {};

  standalone = (await utils.get('/standalone/')).data;
  window._scriptLoading = true;

  const saveData = exports.getSaveData();
  console.log('Save Data: ', structuredClone(saveData));

  const evalStr =
    '{' +
    standalone +
    '\n' +
    '\ntry {' +
    postfix +
    '\n' +
    `
${file}
async function main() {
  console.log('Loading...');
  _core.init();
  _player.init();
  await Promise.all([getDraw().init('${CANVAS_ID}', window.cachedImages), getSound().init(window.cachedSounds)]);
  getEngine().init();
  window._scriptLoading = false;
  const saveData = '${JSON.stringify(saveData)}';
  // _player is not the right object apparantly...
  player.state = {..._player.state, ...JSON.parse(saveData)};
  console.log('player state data', player.state);
  // console.log('Run!', core);
  const nodeId = '${nodeId}';
  const fileName = '${fileId}';
  if (nodeId && nodeId !== 'undefined' && nodeId !== 'null') {
    const scopeObj = run(true);
    console.log('SCOPE', scopeObj, fileName, nodeId);
    scopeObj.files[fileName](nodeId);
  } else {
    run();
  }
}
main();
} catch (e) {
console.error(e);
alert('There was an error evaluating the script.');
}
}`;
  try {
    const existingScript = document.getElementById('in2-injection');
    if (existingScript) {
      existingScript.remove();
    }
    setTimeout(() => {
      if (window._scriptLoading) {
        notify('There was an error evaluating the script.', 'error');
        _console_log(
          'There was an error evaluating the script.',
          undefined,
          '#f00'
        );
      }
    }, 5000);
    const script = document.createElement('script');
    script.type = 'text/javascript';
    // console.log('evalStr', evalStr);
    script.innerHTML = evalStr;
    script.id = 'in2-injection';
    const existingScriptElem = document.getElementById('in2-injection');
    if (existingScriptElem) {
      existingScriptElem.remove();
    }
    document.body.appendChild(script);
    window.player = exports._player;
  } catch (e) {
    console.error(e, e.stack);
    //console.log(evalStr);
  }
};

exports.runFileDry = async function (file) {
  const flatten = prevState => {
    const errors = [];
    const keys = {};
    const fileNames = {};
    for (let fileName in prevState) {
      for (let key in prevState[fileName]) {
        const type = typeof keys[key];
        if (type === 'string' || type === 'number') {
          errors.push(
            `Duplicate key declared: '${key}' (${fileName}) and (${fileNames[key]})`
          );
        } else {
          if (type === 'object') {
            keys[key] = {
              ...keys[key],
              ...prevState[fileName][key],
            };
            fileNames[key] = fileName;
          } else {
            keys[key] = prevState[fileName][key];
            fileNames[key] = fileName;
          }
        }
      }
    }
    if (errors.length) {
      keys.errors = errors;
    }
    return keys;
  };

  standalone = (await utils.get('/standalone/')).data;
  const context = {};
  const evalStr = standalone + '\n' + postfix + '\n(' + file + ')(true)';
  window._core = exports._core;
  window._player = exports._player;
  console.log('Now evaluating dry...');
  const states = {};
  try {
    let result = evalInContext(evalStr, context);
    for (let i in result.files) {
      if (i === 'exit') {
        continue;
      }
      exports._player.init();
      result = evalInContext(evalStr, context);
      const playerState = result.files[i](false);
      states[i] = { ...playerState };
      delete states[i].curIN2f;
    }
    const flattenedState = flatten(states);
    states._ = flattenedState;
    return states;
  } catch (e) {
    console.error(e, e.stack);
    return {};
  }
};
