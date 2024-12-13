/** @ts-ignore */
window.IN2 = true;

/**
 * @typedef Core
 * @property {function} init
 * @property {function} say
 * @property {function} choose
 * @property {function} exit
 */

/**
 * @typedef Player
 * @property {function} init
 * @property {function} get
 * @property {function} set
 * @property {function} setIfUnset
 * @property {function} once
 * @property {function} clearArgs
 * @property {string} name
 * @property {object} state
 * @property {boolean} dontTriggerOnce
 */

/** @type {() => import("./draw.mjs").Draw} */
const getDraw = () => {
  /** @ts-ignore */
  return window.draw;
};
const getSound = () => {
  /** @ts-ignore */
  return window.sound;
};
const getEngine = () => {
  /** @ts-ignore */
  return window.engine;
};

// eslint-disable-next-line no-unused-vars
const getLib = () => {
  /** @ts-ignore */
  return window.Lib;
};
/** @ts-ignore */
window.getLib = getLib;

const addTextLine = args => {
  const { text, paragraph, color } = args;
  if (paragraph) {
    getDraw().renderLine('', color);
    // console.log();
  }
  // console.log(text);
  getDraw().renderLine(text, color);
  if (paragraph) {
    // console.log();
    getDraw().renderLine('', color);
  }
};

/**
 * @typedef Choice
 * @property {string} t
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
  getDraw().showButtons(
    choices.map((c, i) => {
      return {
        text: '<div class="line-number">' + (i + 1) + '.</div> ' + c.t,
        onClick: () => {
          eventCallback({
            which: `${i + 1}`.charCodeAt(0),
          });
        },
      };
    })
  );
};

/**
 * @returns {Core}
 */
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

  const localGetLabels = () => {
    //@ts-ignore
    return window.getLabels();
  };

  const onKeyOrMouseEvent = ev => {
    const lib = getLib();
    if (lib?.isEscapeKey(ev.key) || ev.key === 'Escape') {
      getDraw().showConfirm({
        text: localGetLabels().CONFIRM_LEAVE,
        onConfirm: () => {
          if (lib) {
            lib.notifyGameCancelled();
          } else {
            window.location.reload();
          }
        },
      });
    }
    if (
      isKeypressDisabled ||
      getDraw().isConfirmVisible() ||
      lib?.isSkipKey(ev.key)
    ) {
      return;
    }
    eventCallback(ev);
    return false;
  };

  window.addEventListener('keydown', onKeyOrMouseEvent);
  window.addEventListener('mousedown', onKeyOrMouseEvent);

  const isChoiceNode = id => {
    const scope = _player.get('scope');
    return scope?.[id]?.isChoice;
  };

  const hasPickedChoice = id => {
    return _player.get('nodes')?.[id || ''];
  };

  /**
   * @type {Core}
   */
  const core = {
    init() {},
    async say(text, cb, id, childId) {
      return new Promise(resolve => {
        setEventCallback(() => {
          getDraw().hidePressAnyKey();
          setEventCallback(DEFAULT_EVENT);
          cb && cb();
          resolve(undefined);
        });
        if (text) {
          addTextLine({
            text,
            paragraph: true,
            color: '',
          });
        }

        if (isChoiceNode(childId) || !text) {
          eventCallback({});
        } else {
          getDraw().showPressAnyKey();
        }
      });
    },
    async choose(text, id, choices) {
      return new Promise(resolve => {
        _player.dontTriggerOnce = true;
        const availableChoices = choices.filter(choice => {
          return choice.c();
        });
        _player.dontTriggerOnce = false;

        setEventCallback(ev => {
          const number = Number(String.fromCharCode(ev.which));
          const choice = availableChoices[number - 1];
          if (choice) {
            addTextLine({
              text: choice.t,
              color: '#aaa',
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
        addChoiceLines(
          availableChoices.map(c => {
            return {
              ...c,
              chosen: hasPickedChoice(c.id),
            };
          }),
          eventCallback
        );
      });
    },
    exit() {},
  };

  return core;
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

  /**
   * @type {Player}
   */
  const player = {
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
  return player;
};

const _player = createPlayer();
/** @ts-ignore */
window.player = _player;

const _core = createCore();
/** @ts-ignore */
window.core = _core;

let loading = false;
let loaded = false;
let loadingPromises = [];
/** @ts-ignore */
const load = (window.load = async function () {
  if (loaded) {
    return;
  }
  if (loading) {
    const p = new Promise(resolve => {
      loadingPromises.push(resolve);
    });
    await p;
    return;
  }
  loading = true;
  await Promise.all([getDraw().init('canv', undefined), getSound().init()]);
  loading = false;
  loaded = true;
  for (const resolve of loadingPromises) {
    resolve();
  }
  loadingPromises = [];
});

/** @ts-ignore */
window.main = async function () {
  _core.init();
  _player.init();
  await load();
  getEngine().init();

  // in2 places the 'run' function on the window object
  /** @ts-ignore */
  run();
};
