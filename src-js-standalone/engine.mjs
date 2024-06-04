/**
 * @typedef Engine
 * @property {() => void} init
 * @property {(pictureName: string) => void} setBackground
 * @property {(soundName: string) => void} playSound
 * @property {(soundName: string, postfixes: string[]) => void} playOneOfSound
 * @property {(item: import("./db.mjs").ItemTemplate) => (import("./db.mjs").NodeCall | undefined)} getItemExamineEvent
 * @property {(item: import("./db.mjs").ItemTemplate) => (import("./db.mjs").NodeCall | undefined)} getItemPickUpEvent
 * @property {() => import("./db.mjs").ItemTemplate[]} getInventoryItems
 * @property {(itemName: string) => void} pickUpRoomItem
 * @property {(itemName: string) => void} putDownRoomItem
 * @property {(roomName?: string) => import("./db.mjs").ItemTemplate[]} getRoomItems
 * @property {(roomName?: string) => string} getRoomItemsText
 * @property {(itemName: string) => boolean} hasItemInInventory
 * @property {(itemName: string) => void} addItemToInventory
 * @property {(itemName: string) => void} removeItemFromInventory
 * @property {(dir: 'n' | 'e' | 's' | 'w') => void} setHeading
 * @property {(itemName: string) => string} getItemLabel
 * @property {() => string} getClass
 * @property {(className: string) => boolean} isClass
 * @property {() => void} saveClassLocation
 */

const createEngine = () => {
  let compassOffsetSize = 28;

  const PLAYER_KEY_BACKGROUND = 'background';
  const PLAYER_KEY_INVENTORY = 'inventory';
  const PLAYER_KEY_ROOM_ITEMS = 'roomItems';

  const getPlayer = () => {
    /** @type {any} */
    const globalWindow = window;
    /** @type {import("./core.mjs").Player} */
    const player = globalWindow.player;
    return player;
  };

  const getDb = () => {
    /** @type {any} */
    const globalWindow = window;
    /** @type {import("./db.mjs").Db} */
    const db = globalWindow.db;
    return db;
  };

  const getDraw = () => {
    /** @type {any} */
    const globalWindow = window;
    /** @type {import("./draw.mjs").Draw} */
    const draw = globalWindow.draw;
    return draw;
  };

  const getSoundPlayer = () => {
    /** @type {any} */
    const globalWindow = window;
    /** @type {import("./sound.mjs").Sound} */
    const sound = globalWindow.sound;
    return sound;
  };

  const getRoomItemKey = roomName => {
    return (
      PLAYER_KEY_ROOM_ITEMS + '.' + (roomName ?? getPlayer().get('curIN2f'))
    );
  };

  /**
   * @type {Engine}
   */
  const engine = {
    init() {
      engine.setHeading('n');
      getPlayer().set(PLAYER_KEY_INVENTORY, []);

      /** @type {any} */
      const globalWindow = window;

      if (globalWindow.onResizeHandler) {
        globalWindow.removeEventListener(
          'resize',
          globalWindow.onResizeHandler
        );
      }
      // keep the compass on the screen when the vertical breakpoint is hit
      globalWindow.onResizeHandler = () => {
        if (window.innerHeight < 475) {
          if (compassOffsetSize !== 14) {
            compassOffsetSize = 14;
            engine.setHeading(getPlayer().get('heading') ?? 'n');
          }
        } else {
          if (compassOffsetSize !== 28) {
            compassOffsetSize = 28;
            engine.setHeading(getPlayer().get('heading') ?? 'n');
          }
        }
      };
      globalWindow.addEventListener('resize', globalWindow.onResizeHandler);
      globalWindow.onResizeHandler();
    },
    setBackground(pictureName) {
      if (getPlayer().get('background') === pictureName) {
        getDraw().drawBackground(pictureName);
        return;
      }

      getPlayer().set(PLAYER_KEY_BACKGROUND, pictureName);

      const createFade = (durationMs, opacity) => {
        /** @type {any} */
        const globalWindow = window;
        /** @type {import("./draw.mjs").Draw} */
        const draw = globalWindow.draw;

        draw.canvas.style.opacity = String(opacity);
        draw.canvas.style.transition = `opacity ${durationMs}ms`;
        setTimeout(() => {
          draw.canvas.style.opacity = String(1 - opacity);
        }, 1);
      };

      const duration = 200;
      createFade(duration / 2, 1);
      setTimeout(() => {
        getDraw().drawBackground(pictureName);
        createFade(duration / 2, 0);
      }, duration / 2);
    },
    playSound(soundName) {
      const soundObj = getSoundPlayer().getSound(soundName);
      if (soundObj) {
        getSoundPlayer().playSound(soundObj);
      }
    },
    playOneOfSound(soundPrefix, postfixes) {
      const soundName =
        soundPrefix +
        '_' +
        postfixes[Math.floor(Math.random() * postfixes.length)];
      engine.playSound(soundName);
    },
    getItemExamineEvent(itemTemplate) {
      const nodeCall = itemTemplate?.onExamine?.(getPlayer());
      return nodeCall;
    },
    getItemPickUpEvent(itemTemplate) {
      const nodeCall = itemTemplate?.onPickUp?.(getPlayer());
      return nodeCall;
    },
    pickUpRoomItem(itemName, roomName) {
      /** @type {string[] | undefined} */
      const roomItems = getPlayer().get(getRoomItemKey(roomName));
      if (roomItems) {
        const index = roomItems.findIndex(item => item === itemName);
        if (index > -1) {
          roomItems.splice(index, 1);
          getPlayer().set(getRoomItemKey(roomName), roomItems);
          engine.addItemToInventory(itemName);
          return;
        }
      }
    },
    putDownRoomItem(itemName, roomName) {
      if (!roomName) {
        roomName = getPlayer().get('curIN2f');
      }

      /** @type {string[] | undefined} */
      const roomItems = getPlayer().get(getRoomItemKey(roomName)) ?? [];
      if (getRoomItemKey(roomName)) {
        roomItems.push(itemName);
        getPlayer().set(getRoomItemKey(roomName), roomItems);
      }
    },
    getRoomItems(roomName) {
      if (!roomName) {
        roomName = getPlayer().get('curIN2f');
      }

      const items =
        getPlayer()
          .get(getRoomItemKey(roomName))
          ?.map(name => {
            const itemTemplate = getDb().items.find(item => item.name === name);
            if (itemTemplate) {
              return { ...itemTemplate };
            } else {
              throw new Error(
                'Item not found when trying to get room items: ' + name
              );
            }
          }) ?? [];
      // .sort((a, b) => {
      //   return a.label.localeCompare(b.label);
      // }) ?? [];

      return items;
    },
    getRoomItemsText(roomName) {
      if (!roomName) {
        roomName = getPlayer().get('curIN2f');
      }

      /** @type {string[]} */
      const items = engine
        .getRoomItems(roomName)
        .map(
          item =>
            `<span style="color:${getDraw().getColors().COLOR_ACCENT_1}">${
              item.label
            }</span>`
        );
      if (items.length) {
        /** @type {string} */
        let result = '';
        if (items.length > 2) {
          const last = items.pop() ?? '';
          result = items.join(', ') + ', and ' + last;
        } else if (items.length === 2) {
          const last = items.pop() ?? '';
          result = items[0] + ' and ' + last;
        } else {
          result = items[0];
        }
        return `You see these items: ${result}.`;
      } else {
        return '';
      }
    },
    getInventoryItems() {
      return (
        getPlayer()
          .get(PLAYER_KEY_INVENTORY)
          ?.map(name => {
            const itemTemplate = getDb().items.find(item => item.name === name);
            if (itemTemplate) {
              return { ...itemTemplate };
            } else {
              throw new Error(
                'Item not found when trying to get inventory: ' + name
              );
            }
          })
          .sort((a, b) => {
            return a.label.localeCompare(b.label);
          }) ?? []
      );
    },
    hasItemInInventory(itemName) {
      /** @type {string[]} */
      const inventory = getPlayer().get(PLAYER_KEY_INVENTORY) ?? [];
      return inventory.includes(itemName);
    },
    addItemToInventory(itemName) {
      /** @type {string[]} */
      const inventory = getPlayer().get(PLAYER_KEY_INVENTORY) ?? [];
      const itemTemplate = getDb().items.find(item => item.name === itemName);
      if (itemTemplate) {
        inventory.push(itemName);
      } else {
        throw new Error('Item not found in db: ' + itemName);
      }
      getPlayer().set(PLAYER_KEY_INVENTORY, inventory);
    },
    removeItemFromInventory(itemName) {
      /** @type {string[]} */
      const inventory = getPlayer().get(PLAYER_KEY_INVENTORY) ?? [];
      const index = inventory.findIndex(item => item === itemName);
      if (index > -1) {
        inventory.splice(index, 1);
      }
      getPlayer().set(PLAYER_KEY_INVENTORY, inventory);
    },
    // set the heading and orient the compass towards it
    setHeading(dir) {
      getPlayer().set('heading', dir);

      const elem = document.getElementById('compass');
      let nextRotation = 0;
      if (elem) {
        switch (dir) {
          case 'n':
            nextRotation = 0;
            break;
          case 'e':
            nextRotation = -90;
            break;
          case 's':
            nextRotation = 180;
            break;
          case 'w':
            nextRotation = 90;
            break;
        }
        elem.style.transform = `rotate(${nextRotation}deg)`;
        /** @type {any} */
        const children = elem.children;
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          // polar coords
          const x =
            compassOffsetSize * Math.round(Math.cos(((i - 1) * Math.PI) / 2));
          const y =
            compassOffsetSize * Math.round(Math.sin(((i - 1) * Math.PI) / 2));
          const transform = `translate(${x}px, ${y}px) rotate(${-nextRotation}deg)`;
          child.style.transform = transform;
        }
      }
    },
    getItemLabel(itemName) {
      const itemTemplate = getDb().items.find(item => item.name === itemName);
      return itemTemplate?.label ?? '';
    },
    getClass() {
      return getPlayer().get('vars.class');
    },
    isClass(className) {
      /** @type {any} */
      const globalWindow = window;
      return (
        globalWindow.player.get('vars.class').toLowerCase() ===
        className.toLowerCase()
      );
    },
    saveClassLocation() {
      const classLocation = getPlayer().get('curIN2f');
      const className = this.getClass();
      getPlayer().set('classLocations.' + className, classLocation);
    },
  };
  return engine;
};

// @ts-ignore
window.engine = createEngine();
