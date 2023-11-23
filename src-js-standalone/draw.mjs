/**
 * @typedef Draw
 * @property {HTMLCanvasElement} canvas;
 * @property {(id: string) => Promise<void>} init
 * @property {(picName: string) => void} drawBackground
 * @property {(itemName: string, x: number, y: number) => void} drawItem
 * @property {(text: string, color?: string) => void} renderLine
 * @property {() => void} showPressAnyKey
 * @property {() => void} hidePressAnyKey
 * @property {(choices: DrawLineChoice[]) => void} showButtons
 * @property {() => void} hideButtons
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
      console.error('No image found named: ' + name, images);
    }
  };

  /**
   * @type {Draw}
   */
  const draw = {
    canvas,
    async init(canvasId) {
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
          const img = await loadPicture(image.url);
          images.push({
            name: image.name,
            url: image.url,
            img,
          });
        })
      );

      await Promise.all(
        db.assets.ascii.map(async ascii => {
          const { canvas, text } = await loadAscii(ascii.url);
          images.push({
            name: ascii.name,
            url: ascii.url,
            img: canvas,
            drawAscii: true,
            asciiText: text,
          });
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
          '<span style="color:#7ed7ff">$1</span>$2$3'
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
      div.className = 'line';
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

      for (const { text, onClick } of choices) {
        const button = getDocument().createElement('button');
        button.innerHTML = text;
        button.className = 'button';
        button.onclick = onClick;
        buttonsArea.appendChild(button);
      }

      buttonsArea.style.display = 'block';
    },
    hideButtons() {
      /** @type {any} */
      const buttonsArea = getDocument().getElementById('buttons-zone');

      buttonsArea.innerHTML = '';
    },
  };
  return draw;
};

// @ts-ignore
window.draw = createDraw();
