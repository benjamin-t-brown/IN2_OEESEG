/**
 * @typedef Sound
 * @property {(cache: Record<string, object>) => Promise<void>} init
 * @property {(soundObj: Object) => void} playSound
 * @property {(soundName: string) => (Object | null)} getSound
 */

const createSound = () => {
  function SoundLib() {
    // @ts-ignore
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    let soundEnabled = true;

    class CtxAudio {
      audioBuffer;
      source;
      audioCtx;
      gainNode;
      startTime = 0;

      paused = true;

      constructor(buffer, audioCtx) {
        this.audioCtx = audioCtx;
        this.audioBuffer = buffer;
        this.source = this.audioCtx.createBufferSource();
        this.source.buffer = this.audioBuffer;
        this.gainNode = audioCtx.createGain();
        this.source.connect(this.gainNode);
        this.gainNode.connect(this.audioCtx.destination);
      }

      copy() {
        return new CtxAudio(this.audioBuffer, new AudioContext());
      }

      copyWithCtx(audioCtx) {
        return new CtxAudio(this.audioBuffer, audioCtx);
      }

      static async createCtxAudio(arrayBuffer, ctx) {
        const audioCtx = ctx ?? new AudioContext();
        return new Promise((resolve, reject) => {
          audioCtx.decodeAudioData(
            arrayBuffer,
            buffer => {
              resolve(new CtxAudio(buffer, audioCtx));
            },
            err => {
              console.error(`Error with decoding audio data: ${err}`);
              reject(err);
            }
          );
        });
      }

      static async loadCtxAudio(url, ctx) {
        const blob = await fetch(url).then(res => res.blob());
        const arrayBuffer = await blob.arrayBuffer();
        return await CtxAudio.createCtxAudio(arrayBuffer, ctx);
      }

      play(args) {
        this.source = this.audioCtx.createBufferSource();
        this.source.buffer = this.audioBuffer;
        this.source.loop = false;
        this.gainNode = this.audioCtx.createGain();
        this.source.connect(this.gainNode);
        this.gainNode.connect(this.audioCtx.destination);
        this.setVolume(args.volume);
        this.source.loop = args.loop;
        this.source.start(0, args.startTime, args.duration);
        this.unpause();
        this.startTime = this.audioCtx.currentTime;
      }

      stop() {
        this.pause();
      }
      pause() {
        if (!this.paused) {
          this.source.stop();
          this.paused = true;
        }
      }
      unpause() {
        this.paused = false;
      }

      isPaused() {
        return this.paused;
      }

      setVolume(volume) {
        this.gainNode.gain.setValueAtTime(volume, this.audioCtx.currentTime);
      }

      getVolume() {
        return this.gainNode.gain.value;
      }

      getDuration() {
        return this.audioBuffer.duration;
      }

      getCurrentTime() {
        return this.audioCtx.currentTime - this.startTime;
      }
    }

    const SOUND_PATH = '';
    const sounds = {};

    this.loadSound = async function (name, url, volume, cache) {
      url = `${SOUND_PATH}${url}`;

      if (cache && cache[url]) {
        sounds[name] = cache[url];
        return cache[url];
      } else {
        return new Promise((resolve, reject) => {
          CtxAudio.loadCtxAudio(url, audioCtx)
            .then(sound => {
              console.log('sound loaded', url);
              sounds[name] = {
                sound,
                audio: sound,
                soundDuration: 5000,
                volume: volume,
              };
              cache[url] = sounds[name];
              resolve(sound);
            })
            .catch(reject);
        });
      }
    };

    this.getSound = function (soundName) {
      const soundObj = sounds[soundName];
      if (soundObj) {
        const s = {
          duration: 0,
          ...soundObj,
          //soundDuration merged in from soundObj
          audio: soundObj.audio,
          soundName,
          lastStartTimestamp: window.performance.now(),
          isPlaying: false,
          isPaused: false,
        };

        return s;
      } else {
        console.error('Could not find sound with name: ', soundName);
        return null;
      }
    };

    this.playSound = function (soundObj) {
      const { sound, volume } = soundObj;
      sound.play({
        startTime: 0,
        duration: 5000,
        loop: false,
        volume: soundEnabled ? volume || 0.5 : 0,
      });

      soundObj.lastStartTimestamp = window.performance.now();
      soundObj.isPlaying = true;
    };

    this.toggleSound = function () {
      soundEnabled = !soundEnabled;
    };
    this.setSoundEnabled = function (v) {
      soundEnabled = Boolean(v);
    };
  }

  const soundLib = {
    init: async cache => {
      const ctx = new SoundLib();
      Object.assign(soundLib, ctx);

      /** @type {any} */
      const globalWindow = window;
      /** @type {import("./db.mjs").Db} */
      const db = globalWindow.db;

      await Promise.all(
        db.assets.sounds.map(async sound => {
          try {
            await ctx.loadSound(sound.name, sound.url, sound.volume, cache);
          } catch (e) {
            console.error('Failed to load sound', sound.url, e);
          }
        })
      );
    },
  };

  return soundLib;
};

// @ts-ignore
window.sound = createSound();
