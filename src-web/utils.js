let mouse_x = 0;
let mouse_y = 0;
let shift = false;
let ctrl = false;
let on_copy = function () {};
let on_paste = function () {};
let on_delete = function () {};

window.addEventListener('mousemove', ev => {
  mouse_x = ev.clientX;
  mouse_y = ev.clientY;
  // console.log(
  //   'MOUSE POS REL BOARD',
  //   module.exports.get_mouse_pos_rel_diagram()
  // );
});

window.addEventListener('keydown', ev => {
  if (ev.keyCode === 17) {
    ctrl = true;
  } else if (ev.keyCode === 16) {
    shift = true;
  } else if (ev.keyCode === 67 && ctrl) {
    on_copy();
  } else if (ev.keyCode === 86 && ctrl) {
    on_paste();
  } else if (ev.key === 'Delete') {
    on_delete();
  }
});

window.addEventListener('keyup', ev => {
  if (ev.keyCode === 17) {
    ctrl = false;
  } else if (ev.keyCode === 16) {
    shift = false;
  }
});

module.exports = {
  getCurrentTime: function () {
    return +new Date();
  },
  set_on_copy: function (cb) {
    on_copy = cb;
  },
  set_on_paste: function (cb) {
    on_paste = cb;
  },
  set_on_delete: function (cb) {
    on_delete = cb;
  },
  random_id: function (len) {
    len = len || 9;
    let text = '';
    const possible = 'abcdefghigklmnopqrstufwxyz1234567890';
    for (let i = 0; i < len; i++) {
      text += possible.charAt(
        Math.floor(
          Math.random() * (i === 0 ? possible.length - 10 : possible.length)
        )
      );
    }
    return text;
  },
  normalize: function (x, A, B, C, D) {
    return C + ((x - A) * (D - C)) / (B - A);
  },
  get_random_value_from_array: function (arr) {
    let ind = Math.floor(
      module.exports.normalize(Math.random(), 0, 1, 0, arr.length)
    );
    return arr[ind];
  },
  inArr: function (x, arr) {
    for (let i in arr) {
      if (x == arr[i] /*eslint-disable-line eqeqeq*/) {
        return true;
      }
    }
    return false;
  },
  in_rectangle: function (x, y, rx, ry, rw, rh) {
    return x >= rx && x <= rx + rw && y >= ry && ry <= rx + rh;
  },
  to_ratio: function (useconds) {
    return useconds / 1000000;
  },
  to_micro_seconds: function (ms) {
    return Math.round(ms * 1000);
  },
  to_radians: function (degrees) {
    return (degrees / 180.0) * Math.PI;
  },
  to_degrees: function (radians) {
    return (radians * 180.0) / Math.PI;
  },
  hex_to_array: function (hex) {
    return [
      hex.substring(1, 3),
      hex.substring(3, 5),
      hex.substring(5, 7),
      hex.substring(7, 9),
    ].map(function (_color, i) {
      let color = parseInt(_color, 16);
      if (i === 3) {
        color = isNaN(color) ? 1 : color / 255;
      }
      return color;
    });
  },
  hex_to_RGBA: function (hex) {
    let arr = this.hex_to_array(hex);
    return 'rgba(' + arr.join(',') + ')';
  },
  array_to_hex: function (arr) {
    if (!Array.instanceOf(arr)) {
      return undefined;
    }
    let _convert = function (c, i) {
      if (i === 3) {
        c = Math.round(c * 255);
      }
      let hex = Number(c).toString(16);
      return hex.length < 2 ? '0' + hex : hex;
    };
    return '#' + arr.map(_convert).join('');
  },
  rgb_to_hex: function (rgb, g, b) {
    let _digit = function (d) {
      d = parseInt(d).toString(16);
      while (d.length < 2) {
        d = '0' + d;
      }
      return d;
    };
    if (arguments.length === 1) {
      let m = rgb.match(/rgba\((\d{1,3}),(\d{1,3}),(\d{1,3})\)/);
      if (!m) {
        console.log('Unparsable color:', rgb);
      } else {
        return '#' + m.slice(1, 4).map(_digit).join('');
      }
    } else if (arguments.length === 3) {
      return '#' + _digit(rgb) + _digit(g) + _digit(b);
    } else {
      return '#000000';
    }
  },
  get_mouse_pos() {
    return {
      x: mouse_x,
      y: mouse_y,
    };
  },
  get_mouse_pos_rel_diagram() {
    return {
      x:
        mouse_x -
        document.getElementById('diagram').getBoundingClientRect().left,
      y:
        mouse_y -
        document.getElementById('diagram').getBoundingClientRect().top,
    };
  },
  is_shift() {
    return shift;
  },
  is_ctrl() {
    return ctrl;
  },
  get: async function (url, cb) {
    let opts = {
      method: 'GET',
      headers: {},
    };
    let initial_time = +new Date();
    if (cb) {
      return fetch(url, opts)
        .then(function (response) {
          response.json().then(function (d) {
            if (d.err) {
              console.error('req error', d.err, url);
            } else {
              if (cb) {
                cb(d, +new Date() - initial_time);
              } else {
                return d;
              }
            }
          });
        })
        .catch(err => {
          console.error('Fetch GET Error', err, url);
        });
    } else {
      return fetch(url, opts).then(response => response.json());
    }
  },
  del: async function (url, cb) {
    let opts = {
      method: 'DELETE',
      headers: {},
    };
    let initial_time = +new Date();
    return fetch(url, opts)
      .then(function (response) {
        response.json().then(function (d) {
          if (d.err) {
            console.error('Internal Server Error', d.err, url);
          } else {
            if (cb) {
              cb(d, +new Date() - initial_time);
            } else {
              return d;
            }
          }
        });
      })
      .catch(err => {
        console.error('Fetch DEL Error', err, url);
      });
  },
  post: async function (url, data, cb) {
    let opts = {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {},
    };
    let initial_time = +new Date();
    return await fetch(url, opts)
      .then(function (response) {
        return response.json().then(function (d) {
          if (d.err) {
            console.error('Internal Server Error', d.err, url);
            return {
              err: d.err,
            };
          } else {
            if (cb) {
              cb(d, +new Date() - initial_time);
              return d;
            } else {
              console.log('return data', d);
              return d;
            }
          }
        });
      })
      .catch(err => {
        console.error('Fetch POST Error', err, url);
      });
  },
  renderAt: function ({ elem, scale, offsetX, offsetY }) {
    if (!elem) {
      return;
    }

    const newStyle = {
      transform: `scale(${scale})`,
      left: -1 * offsetX * scale,
      right: offsetX * scale,
      top: -1 * (offsetY * scale),
      bottom: offsetY * scale,
    };

    for (let styleName in newStyle) {
      elem.style[styleName] = newStyle[styleName];
    }
  },
  zoomWithFocalAndDelta: function ({
    parentElem,
    deltaY,
    scale,
    areaWidth,
    areaHeight,
    offsetX,
    offsetY,
    focalX,
    focalY,
    maxZoom,
    minZoom,
  }) {
    const { top, left } = parentElem.getBoundingClientRect();

    const eventDelta = deltaY > 0 ? -1 : 1;
    let nextScale = scale + eventDelta / 10;
    if (nextScale > maxZoom) {
      nextScale = maxZoom;
    } else if (nextScale < minZoom) {
      nextScale = minZoom;
    }
    const clientX = focalX - left;
    const clientY = focalY - top;
    const percentXInCurrentBox = clientX / areaWidth;
    const percentYInCurrentBox = clientY / areaHeight;
    const currentBoxWidth = areaWidth / scale;
    const currentBoxHeight = areaHeight / scale;
    const nextBoxWidth = areaWidth / nextScale;
    const nextBoxHeight = areaHeight / nextScale;
    const dX = (nextBoxWidth - currentBoxWidth) * (percentXInCurrentBox - 0.5);
    const dY =
      (nextBoxHeight - currentBoxHeight) * (percentYInCurrentBox - 0.5);
    const nextOffsetX = offsetX - dX;
    const nextOffsetY = offsetY - dY;

    return {
      offsetX: nextOffsetX,
      offsetY: nextOffsetY,
      scale: nextScale,
    };
  },

  saveLocationToLocalStorage: (fileName, x, y, zoom) => {
    const lsData = localStorage.getItem('FILE_LOCATIONS') || '[]';
    const data = JSON.parse(lsData);
    const existingElem = data.find(elem => elem.fileName === fileName);
    if (existingElem) {
      existingElem.x = x;
      existingElem.y = y;
      existingElem.zoom = zoom;
    } else {
      data.push({ fileName, x, y, zoom });
    }
    localStorage.setItem('FILE_LOCATIONS', JSON.stringify(data));
  },

  getLocationFromLocalStorage: fileName => {
    const lsData = localStorage.getItem('FILE_LOCATIONS') || '[]';
    const data = JSON.parse(lsData);
    const existingElem = data.find(elem => elem.fileName === fileName);
    return existingElem;
  },

  setPlumb(plumb) {
    window.plumb = plumb;
  },
  getPlumb() {
    return window.plumb;
  },

  getDeclsForFile(file) {
    return file.nodes
      .filter(node => {
        return node.type === 'declaration';
      })
      .reduce((agg, node) => {
        for (const line of node.content.split('\n')) {
          const match = line.match(/VAR_([\w\d]*)\s*=\s*(.*)/);
          if (match) {
            agg.push({
              variable: 'VAR_' + match[1],
              value: match[2],
            });
          }
        }
        return agg;
      }, []);
  },
};

window.utils = module.exports;
