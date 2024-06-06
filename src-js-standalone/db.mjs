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
 * @property {number=} volume
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
  const PLAYER_KEY_PICK_UP_EVENT_NAME = 'PICK_UP_EVENT_NAME';
  const PLAYER_KEY_INVENTORY_EXAMINE_EVENT_NAME =
    'INVENTORY_EXAMINE_EVENT_NAME';

  const PICK_UP_EVENTS_FILE = 'FUNC_PickUpEvents.json';
  const INVENTORY_EXAMINE_EVENTS_FILE = 'FUNC_InventoryExamineEvents.json';

  const getPickUpEventOnceKey = itemEventName => {
    return 'vars.events.pickup.' + itemEventName;
  };

  const getInventoryExamineEventOnceKey = itemEventName => {
    return 'vars.events.examine.' + itemEventName;
  };

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
        'Caves_BelowCellar',
        'Caves_BelowCellar_2',
        'Caves_CaveBelowDungeon',
        'Caves_CaveBelowDungeon_2',
        'Caves_CaveBelowDungeon_3',
        'Caves_Cave1',
        'Caves_Cave1_2',
        'Caves_Cave2',
        'Caves_Cave3',
        'Caves_CaveChute1',
        'Caves_CaveCliff1_1',
        'Caves_ClearLake',
        'Caves_CollapsedCave1',
        'Caves_HotSprings',
        'Caves_Lava1',
        'Caves_NarrowStairway1',
        'Caves_RuinedElevator',
        'Caves_SecretCave1',
        'Caves_SecretCave1_2',
        'Caves_StoneStairway1',
        'Caves_StoneTempleChapel',
        'Caves_StoneTempleChambers1',
        'Caves_StoneTempleChambers1_2',
        'Caves_StoneTempleChantry',
        'Caves_StoneTempleChantry_2',
        'Caves_StoneTempleChantry_3',
        'Caves_StoneTempleDorms1',
        'Caves_StoneTempleEntrance',
        'Caves_StoneTempleEntrance_2',
        'Caves_StoneTempleEntrance_3',
        'Caves_StoneTempleEntrance_4',
        'Caves_StoneTempleMeditation',
        'Caves_StoneTempleMeditation_2',
        'Caves_StoneTempleMeditation_3',
        'Caves_StoneTemplePortal',
        'Caves_StoneTemplePortal_2',
        'Caves_StoneTemplePortal_3',
        'Caves_Waterfall',
        'Caves_Waterfall_2',
      ].map(name => ({
        name,
        url: `assets/ascii/${name}${ASCII_POSTFIX}.txt`,
      })),
      sounds: [
        'cave_ambience_1',
        'cave_drop_1',
        'cave_drop_2',
        'cave_drop_3',
        'cave_drop_4',
        'cave_drop_5',
        'clank',
        'chime_solve:0.5',
        'collapse',
        'get_item',
        'put_item',
        'light_fire',
        'step_1',
        'step_2',
        'step_3',
        'step_floor_1',
        'waterfall',
        'grunt',
        'slide',
        'stone_doors',
        'stone_lid_fall',
        'glow',
        'portal',
        'portal_buzz',
      ].map(name => {
        const [name1, volume] = name.split(':');
        return {
          name: name1,
          url: `assets/snd/${name1}.mp3`,
          volume: volume ? parseFloat(volume) : 0.5,
        };
      }),
    },
    items: [
      {
        name: 'peculiar_rock',
        label: 'Peculiar Rock',
        description:
          'This palm-sized rock has three perfect holes drilled through it, forming a small triangle.',
        onExamine: player => {
          const itemEventName = 'peculiar_rock';
          player.set(PLAYER_KEY_INVENTORY_EXAMINE_EVENT_NAME, itemEventName);
          const onceKey = getInventoryExamineEventOnceKey(itemEventName);
          if (!player.get(onceKey)) {
            return {
              file: INVENTORY_EXAMINE_EVENTS_FILE,
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
          const itemEventName = 'candle';
          player.set(PLAYER_KEY_PICK_UP_EVENT_NAME, itemEventName);
          const onceKey = getPickUpEventOnceKey(itemEventName);
          if (!player.get(onceKey)) {
            return {
              file: PICK_UP_EVENTS_FILE,
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
      {
        name: 'holy_symbol_of_the_temple',
        label: 'Holy Symbol',
        description:
          'This appears to be some kind of holy necklace or amulet.  It is made of silver and is shaped in a complex pattern that is hard to follow.',
      },
      {
        name: 'stone_hand',
        label: 'Stone Hand',
        description:
          'A stone figurine of wrist, palm, and fingers comprising a hand, spread out as if it was molded by someone pushing against a flat surface.',
      },
      {
        name: 'stone_hand_blessed',
        label: 'Blessed Stone Hand',
        description:
          'A stone figurine of wrist, palm, and fingers comprising a hand, spread out as if it was molded by someone pushing against a flat surface.  It is glowing a soft blue.',
      },
      {
        name: 'rusty_axe',
        label: 'Rusty Axe',
        description:
          'This is an axe the length of your forearm.  It has dull, rusty head.',
      },
      {
        name: 'shiny_axe',
        label: 'Shiny Axe',
        description:
          'This is an axe the length of your forearm.  It has dull, but shiny head.',
      },
      {
        name: 'tinderbox',
        label: 'Tinderbox',
        description:
          'This small box contains all the materials needed to light a well-kindled fire.',
      },
      {
        name: 'chapel_robes',
        label: 'Chapel Robes',
        description: 'Simple and unadorned.',
        onPickUp: player => {
          console.log('PICK UP CHAPEL ROBES');
          const itemEventName = 'chapel_robes';
          player.set(PLAYER_KEY_PICK_UP_EVENT_NAME, itemEventName);
          const onceKey = getPickUpEventOnceKey(itemEventName);
          if (!player.get(onceKey)) {
            return {
              file: PICK_UP_EVENTS_FILE,
              cb: () => {
                player.set(onceKey);
              },
            };
          }
          return undefined;
        },
      },
      {
        name: 'cleric_chains_key',
        label: 'Small Key',
        description:
          "Too small to lock a door; maybe it's for a chest or padlock....",
      },
      {
        name: 'canteen_FullWater',
        label: 'Full Canteen',
        description:
          'This gourd-shaped canteen is filled with water.  It is heavy.',
      },
      {
        name: 'note_SecretWaterfall',
        label: 'Note: Secret Waterfall',
        description:
          '"To get to the temple, a good acolyte must gather courage, jump through the waterfall, and head NORTH."',
        onPickUp: player => {
          player.set('flags.waterfall_knowledge', true);
          return undefined;
        },
      },
      {
        name: 'charge_crystal_powered',
        label: 'Charge Crystal',
        description:
          'A diamond-shaped crystal that fits in the palm of your hand.  It glows a soft blue.',
      },
    ],
  };
  return db;
};

// @ts-ignore
window.db = createDb();
