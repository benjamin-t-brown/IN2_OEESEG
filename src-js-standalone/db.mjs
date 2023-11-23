/**
 * @typedef Db
 * @property {Object} assets
 * @property {ImageAsset[]} assets.images
 * @property {AsciiAsset[]} assets.ascii
 * @property {SoundAsset[]} assets.sounds
 * @property {ItemTemplate[]} items
 */

/**
 * @typedef ImageAsset
 * @property {string} name
 * @property {string} url
 */

/**
 * @typedef SoundAsset
 * @property {string} name
 * @property {string} url
 */
/**
 * @typedef AsciiAsset
 * @property {string} name
 * @property {string} url
 */

/**
 * @typedef ItemTemplate
 * @property {string} name
 * @property {string} label
 * @property {string} description
 * @property {((player: import("./core.mjs").Player) => (NodeCall | undefined))=} onExamine
 * @property {((player: import("./core.mjs").Player) => (NodeCall | undefined))=} onPickUp
 */

/**
 * @typedef NodeCall
 * @property {string} file
 * @property {string=} node
 * @property {()=>void=} cb
 */

const createDb = () => {
  const ASCII_POSTFIX = '.ascii';

  /**
   * @type {Db}
   */
  const db = {
    assets: {
      images: [
        {
          name: 'room1',
          url: 'assets/img/room1.png',
        },
        {
          name: 'Black',
          url: `assets/img/black.png`,
        },
        {
          name: 'Inventory',
          url: `assets/img/Inventory${ASCII_POSTFIX}.png`,
        },
      ],
      ascii: [
        'Caves_CaveBelowDungeon',
        'Caves_CaveBelowDungeon_2',
        'Caves_Waterfall',
        'Caves_Waterfall_2',
        'Caves_Cave1',
        'Caves_Cave1_2',
        'Caves_BelowCellar',
        'Caves_BelowCellar_2',
      ].map(name => ({
        name,
        url: `assets/ascii/${name}${ASCII_POSTFIX}.txt`,
      })),
      sounds: [],
    },
    items: [
      {
        name: 'peculiar_rock',
        label: 'Peculiar Rock',
        description:
          'This palm-sized rock has three perfect holes drilled through it, forming a small triangle.',
        onExamine: player => {
          const onceKey = 'events.examine.peculiar_rock';
          if (!player.get(onceKey)) {
            return {
              file: 'Examine_PeculiarRock.json',
              cb: () => {
                player.set(onceKey);
              },
            };
          }
          return undefined;
        },
      },
      {
        name: 'candle',
        label: 'Candle',
        description: 'Wax melts slowly as the candle flickers.',
        onPickUp: player => {
          player.set('PICK_UP_EVENT_NAME', 'candle');
          const onceKey = 'events.pickup.candle';
          if (!player.get(onceKey)) {
            return {
              file: 'PickUpEvents.json',
              cb: () => {
                player.set(onceKey);
              },
            };
          }
          return undefined;
        },
      },
      {
        name: 'button',
        label: 'Button',
        description:
          "This is a large button that looks like it would fit on a giant's winter coat.",
      },
    ],
  };
  return db;
};

// @ts-ignore
window.db = createDb();
