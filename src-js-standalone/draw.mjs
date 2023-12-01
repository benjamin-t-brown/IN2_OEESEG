/**
 * @typedef Draw
 * @property {HTMLCanvasElement} canvas;
 * @property {(id: string, cache: Record<string, any>) => Promise<void>} init
 * @property {(picName: string) => void} drawBackground
 * @property {(itemName: string, x: number, y: number) => void} drawItem
 * @property {(text: string, color?: string) => void} renderLine
 * @property {() => void} showPressAnyKey
 * @property {() => void} hidePressAnyKey
 * @property {(choices: DrawLineChoice[]) => void} showButtons
 * @property {() => void} hideButtons
 * @property {() => Record<string, string>} getColors
 */
/**
 * @typedef DrawLineChoice
 * @property {string} text
 * @property {string} color
 * @property {() => void} onClick
 */

const createDraw = () => {
  const CANVAS_WIDTH = 514;
  const CANVAS_HEIGHT = 300;
  const COLOR_ACCENT_1 = '#7ed7ff';
  const COLOR_BG_3 = '#8d8d8d';

  let numChoices = 0;
  let selectedChoiceIndex = 0;
  let isSelecting = false;

  const getDocument = () => {
    /** @type {any} */
    const globalWindow = window;
    const document = globalWindow?.document;
    return document;
  };

  /** @type {HTMLCanvasElement} */
  let canvas = getDocument().createElement?.('canvas');
  /** @type {CanvasRenderingContext2D} */
  let ctx;

  /**
   * @typedef LoadedImage
   * @property {string} url
   * @property {string} name
   * @property {HTMLImageElement | HTMLCanvasElement} img
   * @property {boolean=} drawAscii
   * @property {string=} asciiText
   */
  /** @type {LoadedImage[]} */
  let images = [];

  /** @type {string[]} */
  let lines = [];

  /**
   * @param {string} url
   * @returns {Promise<HTMLImageElement>}
   */
  const loadPicture = async url => {
    return new Promise(resolve => {
      const image = new Image();
      image.onload = () => {
        console.log('loaded picture', url);
        resolve(image);
      };
      image.src = url;
    });
  };

  /**
   * @param {string} url
   * @returns {Promise<{canvas: HTMLCanvasElement, text: string}>}
   */
  const loadAscii = async url => {
    const text = await fetch(url).then(r => r.text());
    console.log('loaded ascii', url);
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    return { canvas, text };
  };

  /**
   * @param {string} text
   * @param {HTMLCanvasElement} canvas
   */
  const drawAscii = (text, canvas) => {
    const ctx = canvas.getContext('2d');
    const fontSize = 8;
    const lineHeight = 5;
    const xOffset = 7;
    const yOffset = 0;
    if (ctx) {
      ctx.font = `${fontSize}px courier new, serif`;
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      let ctr = 0;
      for (const line of text.split('\n')) {
        ctx.fillText(line, xOffset, yOffset + lineHeight * (ctr + 1));
        ctr++;
      }
    }
  };

  /**
   * @param {string} name
   * @param {number} x
   * @param {number} y
   * @param {number=} w
   * @param {number=} h
   * @returns {void}
   */
  const drawPicture = (name, x, y, w, h) => {
    const obj = images.find(i => i.name === name);
    if (obj) {
      if (obj.drawAscii) {
        // @ts-ignore
        drawAscii(obj.asciiText ?? '', obj.img);
        obj.drawAscii = false;
      }
      if (ctx) {
        ctx.drawImage(
          obj.img,
          0,
          0,
          obj.img.width,
          obj.img.height,
          x,
          y,
          w ?? obj.img.width,
          h ?? obj.img.height
        );
      } else {
        console.error('The ctx for the canvas could not be found.');
      }
    } else {
      console.error('No image found named: ' + name, images);
    }
  };

  /** @type {(KeyboardEvent) => void} */
  const onChoiceKeyPress = e => {
    const { key } = e;

    // @ts-ignore
    const lib = window.getLib();

    if (isSelecting) {
      return;
    }

    if (lib?.isUpKey(key) || key === 'ArrowUp') {
      selectedChoiceIndex--;
      if (selectedChoiceIndex < 0) {
        selectedChoiceIndex = numChoices - 1;
      }
    } else if (lib?.isDownKey(key) || key === 'ArrowDown') {
      selectedChoiceIndex++;
      if (selectedChoiceIndex >= numChoices) {
        selectedChoiceIndex = 0;
      }
    } else if (
      lib?.isActionKey(key) ||
      key === 'Enter' ||
      key === 'x' ||
      key === ' '
    ) {
      isSelecting = true;
      setTimeout(() => {
        isSelecting = false;
        const div = getDocument().getElementById('buttons-zone');
        if (div) {
          const button = div.children[selectedChoiceIndex];
          if (button) {
            button.click();
          }
        }
      }, 100);
    }
    renderButtonHighlight();
  };

  const renderButtonHighlight = () => {
    const div = getDocument().getElementById('buttons-zone');
    if (div) {
      const children = Array.from(div.children);
      for (let i = 0; i < numChoices; i++) {
        const button = children[i];
        if (button) {
          button.classList.remove('button-highlight');
          button.classList.remove('button-selected');
        }
      }
      const button = children[selectedChoiceIndex];
      if (button) {
        button.classList.add(
          isSelecting ? 'button-selected' : 'button-highlight'
        );
      }
    }
  };

  /**
   * @type {Draw}
   */
  const draw = {
    canvas,
    async init(canvasId, cache) {
      /** @type {any} */
      const c = getDocument().getElementById(canvasId);
      if (c) {
        c.width = CANVAS_WIDTH;
        c.height = CANVAS_HEIGHT;
        draw.canvas = canvas = c;
        /** @type {any} */
        const localCtx = canvas.getContext('2d');
        ctx = localCtx;
        ctx.imageSmoothingEnabled = false;
      }

      /** @type {any} */
      const globalWindow = window;
      /** @type {import("./db.mjs").Db} */
      const db = globalWindow.db;

      await Promise.all(
        db.assets.images.map(async image => {
          if (cache?.[image.url]) {
            images.push(cache[image.url]);
          } else {
            const img = await loadPicture(image.url);
            const obj = {
              name: image.name,
              url: image.url,
              img,
            };
            images.push(obj);
            if (cache) {
              cache[image.url] = obj;
            }
          }
        })
      );

      await Promise.all(
        db.assets.ascii.map(async ascii => {
          if (cache?.[ascii.url]) {
            images.push(cache[ascii.url]);
          } else {
            const { canvas, text } = await loadAscii(ascii.url);
            const obj = {
              name: ascii.name,
              url: ascii.url,
              img: canvas,
              drawAscii: true,
              asciiText: text,
            };
            images.push(obj);
            if (cache) {
              cache[ascii.url] = obj;
            }
          }
        })
      );

      // if (globalWindow.in2LoopIntervalId) {
      //   console.log('Cleared existing interval');
      //   clearInterval(globalWindow.in2LoopIntervalId);
      // }
      // globalWindow.in2LoopIntervalId = setInterval(() => {
      //   for (let i = 0; i < particles.length; i++) {
      //     const p = particles[i];
      //     const now = performance.now();
      //     if (p.startTimeMs && p.durationMs) {
      //       if (now - p.startTimeMs > p.durationMs) {
      //         if (p.onDestroy) {
      //           p.onDestroy();
      //         }
      //         particles.splice(i, 1);
      //         i--;
      //       } else if (p.onUpdate) {
      //         p.onUpdate();
      //       }
      //     }
      //   }
      // }, 16);
    },
    drawBackground(imageName) {
      drawPicture(imageName, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    },
    drawItem(itemName, x, y) {
      // const obj = images.find(i => i.name === name);
    },
    renderLine(text, color) {
      /** @type {any} */
      const textArea = getDocument().getElementById('text-zone');
      lines.push(text);
      const div = getDocument().createElement('div');

      text = text
        .trim()
        .replace(
          /([A-Z]{2,})([.,;?!:])*([ .?:])/g,
          `<span style="color:${COLOR_ACCENT_1}">$1</span>$2$3`
        )
        .replace(/\n/g, '<br />');

      div.innerHTML = text;
      div.className = 'line';
      div.style.color = color ?? 'white';
      textArea.appendChild(div);
      textArea.scrollTop = textArea.scrollHeight;
    },
    showPressAnyKey() {
      /** @type {any} */
      const buttonsArea = getDocument().getElementById('buttons-zone');

      const div = getDocument().createElement('div');
      div.id = 'pressAnyKey';
      div.innerHTML = 'Press any key';
      div.className = 'line line-press-any-key';
      buttonsArea.appendChild(div);
    },
    hidePressAnyKey() {
      const div = getDocument().getElementById('pressAnyKey');
      if (div) {
        div.remove();
      }
    },
    showButtons(choices) {
      /** @type {any} */
      const buttonsArea = getDocument().getElementById('buttons-zone');

      numChoices = choices.length;
      selectedChoiceIndex = 0;

      const onButtonHover = i => {
        selectedChoiceIndex = i;
        renderButtonHighlight();
      };

      let lastButton = null;
      for (let i = 0; i < choices.length; i++) {
        const { text, onClick } = choices[i];
        const button = getDocument().createElement('button');

        const replacedText = text
          .replaceAll(
            /(NORTH|EAST|SOUTH|WEST)/g,
            `<img src="assets/img/ArrowDown.svg" class="inline-arrow inline-arrow-$1" /><span style="color:${COLOR_ACCENT_1}">$1</span>`
          )
          .replaceAll(/(\d\.)/g, `<span style="color:${COLOR_BG_3}">$1</span>`);

        button.innerHTML = replacedText;
        button.className = 'button';
        button.onclick = onClick;
        button.onmouseover = () => {
          onButtonHover(i);
        };
        buttonsArea.appendChild(button);
        lastButton = button;
      }

      lastButton.style.marginBottom = '32px';

      window.addEventListener('keydown', onChoiceKeyPress);
      renderButtonHighlight();
    },
    hideButtons() {
      /** @type {any} */
      const buttonsArea = getDocument().getElementById('buttons-zone');

      buttonsArea.innerHTML = '';

      window.removeEventListener('keydown', onChoiceKeyPress);
    },
    getColors() {
      return {
        COLOR_ACCENT_1,
        COLOR_BG_3,
      };
    },
  };
  return draw;
};

// @ts-ignore
window.draw = createDraw();
