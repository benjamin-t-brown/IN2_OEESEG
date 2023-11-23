/**
 * @typedef Engine
 * @property {() => void} init
 * @property {(pictureName: string) => void} setBackground
 * @property {(item: import("./db.mjs").ItemTemplate) => (import("./db.mjs").NodeCall | undefined)} getItemExamineEvent
 * @property {(item: import("./db.mjs").ItemTemplate) => (import("./db.mjs").NodeCall | undefined)} getItemPickUpEvent
 * @property {() => import("./db.mjs").ItemTemplate[]} getInventoryItems
 * @property {(roomName?: string) => import("./db.mjs").ItemTemplate[]} getRoomItems
 * @property {(roomName?: string) => string} getRoomItemsText
 * @property {(itemName: string) => void} addItemToInventory
 * @property {(itemName: string) => void} removeItemFromInventory
 * @property {(dir: 'n' | 'e' | 's' | 'w') => void} setHeading
 */

const createEngine = () => {
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

  /**
   * @type {Engine}
   */
  const engine = {
    init() {
      engine.setHeading('n');
      getPlayer().set('inventory', ['peculiar_rock', 'candle', 'candle']);
    },
    setBackground(pictureName) {
      getPlayer().set('background', pictureName);

      const createFadeDiv = (durationMs, opacity) => {
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
      createFadeDiv(duration / 2, 1);
      setTimeout(() => {
        getDraw().drawBackground(pictureName);
        createFadeDiv(duration / 2, 0);
      }, duration / 2);
    },
    getItemExamineEvent(itemTemplate) {
      const nodeCall = itemTemplate?.onExamine?.(getPlayer());
      return nodeCall;
    },
    getItemPickUpEvent(itemTemplate) {
      const nodeCall = itemTemplate?.onPickUp?.(getPlayer());
      return nodeCall;
    },
    getInventoryItems() {
      return (
        getPlayer()
          .get('inventory')
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
    getRoomItems(roomName) {
      return (
        getPlayer()
          .get('roomItems.' + (roomName ?? getPlayer().get('curIN2f')))
          ?.map(name => {
            const itemTemplate = getDb().items.find(item => item.name === name);
            if (itemTemplate) {
              return { ...itemTemplate };
            } else {
              throw new Error(
                'Item not found when trying to get room items: ' + name
              );
            }
          })
          .sort((a, b) => {
            return a.label.localeCompare(b.label);
          }) ?? [
          getDb().items.find(item => item.name === 'candle'),
          getDb().items.find(item => item.name === 'peculiar_rock'),
        ]
      );
    },
    getRoomItemsText(roomName) {
      /** @type {string[]} */
      const items = engine
        .getRoomItems(roomName)
        .map(item => `<span style="color:#7ed7ff">${item.label}</span>`);
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
        return `You see these items on the ground: ${result}.`;
      } else {
        return '';
      }
    },
    addItemToInventory(itemName) {
      /** @type {string[]} */
      const inventory = getPlayer().get('inventory') ?? [];
      const itemTemplate = getDb().items.find(item => item.name === itemName);
      if (itemTemplate) {
        inventory.push(itemName);
      } else {
        throw new Error('Item not found in db: ' + itemName);
      }
      getPlayer().set('inventory', inventory);
    },
    removeItemFromInventory(itemName) {
      /** @type {string[]} */
      const inventory = getPlayer().get('inventory') ?? [];
      const index = inventory.findIndex(item => item === itemName);
      if (index > -1) {
        inventory.splice(index, 1);
      }
      getPlayer().set('inventory', inventory);
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
            nextRotation = 90;
            break;
          case 's':
            nextRotation = 180;
            break;
          case 'w':
            nextRotation = -90;
            break;
        }
        elem.style.transform = `rotate(${nextRotation}deg)`;
        /** @type {any} */
        const children = elem.children;
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          const x = 28 * Math.round(Math.cos(((i - 1) * Math.PI) / 2));
          const y = 28 * Math.round(Math.sin(((i - 1) * Math.PI) / 2));
          const transform = `translate(${x}px, ${y}px) rotate(${-nextRotation}deg)`;
          child.style.transform = transform;
        }
      }
    },
  };
  return engine;
};

// @ts-ignore
window.engine = createEngine();
