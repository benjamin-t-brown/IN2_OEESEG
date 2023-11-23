import React, { useMemo, useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import css from 'css';

const baseStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px',
  borderWidth: 2,
  borderRadius: 2,
  borderColor: '#eeeeee',
  borderStyle: 'dashed',
  // backgroundColor: '#fafafa',
  background: 'black',
  color: '#bdbdbd',
  outline: 'none',
  transition: 'border .24s ease-in-out',
};

const focusedStyle = {
  borderColor: '#2196f3',
};

const acceptStyle = {
  borderColor: '#00e676',
};

const rejectStyle = {
  borderColor: css.colors.CANCEL,
};

const getTargetOptions = () => {
  return {
    sampleRate: 48000,
    bytesPerSample: 1,
    channelOpt: 'bot',
  };
};

const audioToRawWave = (audioChannels, bytesPerSample, mixChannels) => {
  const bufferLength = audioChannels[0].length;
  const numberOfChannels = audioChannels.length === 1 ? 1 : 2;
  const reducedData = new Uint8Array(
    bufferLength * numberOfChannels * bytesPerSample
  );
  for (let i = 0; i < bufferLength; ++i) {
    for (
      let channel = 0;
      channel < (mixChannels ? 1 : numberOfChannels);
      ++channel
    ) {
      const outputIndex = (i * numberOfChannels + channel) * bytesPerSample;
      let sample;
      if (!mixChannels) sample = audioChannels[channel][i];
      else
        sample =
          audioChannels.reduce((prv, cur) => prv + cur[i], 0) /
          numberOfChannels;
      sample = sample > 1 ? 1 : sample < -1 ? -1 : sample; //check for clipping
      //bit reduce and convert to Uint8
      switch (bytesPerSample) {
        case 2:
          sample = sample * 32767;
          reducedData[outputIndex] = sample;
          reducedData[outputIndex + 1] = sample >> 8;
          break;
        case 1:
          reducedData[outputIndex] = (sample + 1) * 127;
          break;
        default:
          throw 'Only 8, 16 bits per sample are supported';
      }
    }
  }
  return reducedData;
};

const makeWav = (data, channels, sampleRate, bytesPerSample) => {
  const headerLength = 44;
  var wav = new Uint8Array(headerLength + data.length);
  var view = new DataView(wav.buffer);

  view.setUint32(0, 1380533830, false); // RIFF identifier 'RIFF'
  view.setUint32(4, 36 + data.length, true); // file length minus RIFF identifier length and file description length
  view.setUint32(8, 1463899717, false); // RIFF type 'WAVE'
  view.setUint32(12, 1718449184, false); // format chunk identifier 'fmt '
  view.setUint32(16, 16, true); // format chunk length
  view.setUint16(20, 1, true); // sample format (raw)
  view.setUint16(22, channels, true); // channel count
  view.setUint32(24, sampleRate, true); // sample rate
  view.setUint32(28, sampleRate * bytesPerSample * channels, true); // byte rate (sample rate * block align)
  view.setUint16(32, bytesPerSample * channels, true); // block align (channel count * bytes per sample)
  view.setUint16(34, bytesPerSample * 8, true); // bits per sample
  view.setUint32(36, 1684108385, false); // data chunk identifier 'data'
  view.setUint32(40, data.length, true); // data chunk length

  wav.set(data, headerLength);

  return new Blob([wav.buffer], { type: 'audio/wav' });
};

const audioResample = (buffer, sampleRate) => {
  const offlineCtx = new OfflineAudioContext(
    2,
    (buffer.length / buffer.sampleRate) * sampleRate,
    sampleRate
  );
  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(offlineCtx.destination);
  source.start();
  return offlineCtx.startRendering();
};

const audioReduceChannels = (buffer, targetChannelOpt) => {
  if (targetChannelOpt === 'both' || buffer.numberOfChannels < 2) return buffer;
  const outBuffer = new AudioBuffer({
    sampleRate: buffer.sampleRate,
    length: buffer.length,
    numberOfChannels: 1,
  });

  const data = [buffer.getChannelData(0), buffer.getChannelData(1)];
  const newData = new Float32Array(buffer.length);
  for (let i = 0; i < buffer.length; ++i)
    newData[i] =
      targetChannelOpt === 'left'
        ? data[0][i]
        : targetChannelOpt === 'right'
        ? data[1][i]
        : (data[0][i] + data[1][i]) / 2;
  outBuffer.copyToChannel(newData, 0);
  return outBuffer;
};

const audioNormalize = buffer => {
  const data = Array.from(Array(buffer.numberOfChannels)).map((_, idx) =>
    buffer.getChannelData(idx)
  );
  const maxAmplitude = Math.max(
    ...data.map(chan =>
      chan.reduce((acc, cur) => Math.max(acc, Math.abs(cur)), 0)
    )
  );
  if (maxAmplitude >= 1.0) return buffer;
  const coeff = 1.0 / maxAmplitude;
  data.forEach(chan => {
    chan.forEach((v, idx) => (chan[idx] = v * coeff));
    buffer.copyToChannel(chan, 0);
  });
  return buffer;
};

const processAudioFile = async (
  audioBufferIn,
  targetChannelOpt,
  targetSampleRate
) => {
  const resampled = await audioResample(audioBufferIn, targetSampleRate);
  const reduced = audioReduceChannels(resampled, targetChannelOpt);
  const normalized = audioNormalize(reduced);
  return normalized;
};

const convertAndSaveAudioBuffer = async audioBufferIn => {
  const targetOptions = getTargetOptions();
  const audioBuffer = await processAudioFile(
    audioBufferIn,
    targetOptions.channelOpt,
    targetOptions.sampleRate
  );
  const rawData = audioToRawWave(
    targetOptions.channelOpt === 'both'
      ? [audioBuffer.getChannelData(0), audioBuffer.getChannelData(1)]
      : [audioBuffer.getChannelData(0)],
    targetOptions.bytesPerSample
  );
  return rawData;
};

const convertToWav = async file => {
  const audioBuffer = await new AudioContext().decodeAudioData(
    await file.arrayBuffer()
  );
  const rawData = await convertAndSaveAudioBuffer(audioBuffer);
  const targetOptions = getTargetOptions();
  return makeWav(
    rawData,
    targetOptions.channelOpt === 'both' ? 2 : 1,
    targetOptions.sampleRate,
    targetOptions.bytesPerSample
  );
};

const fileToBase64Url = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

function StyledDropzone({ onDrop }) {
  const [file, setFile] = useState(null);

  const handleDrop = useCallback(
    async acceptedFiles => {
      let file = acceptedFiles[0];

      if (file.type !== 'audio/wav') {
        console.log('converting to wav');
        const name = file.name;
        file = await convertToWav(file);
        file.name = name;
      }

      const base64Url = await fileToBase64Url(file);
      setFile(file);
      if (onDrop) {
        onDrop(base64Url);
      }
    },
    [onDrop]
  );
  const {
    getRootProps,
    getInputProps,
    isFocused,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    accept: 'audio/*',
    onDrop: handleDrop,
    maxFiles: 1,
  });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isFocused ? focusedStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isFocused, isDragAccept, isDragReject]
  );

  return (
    <div className="container">
      <div {...getRootProps({ style })}>
        <input {...getInputProps()} />
        {file ? (
          <p style={{ color: '#5F5' }}>{file.name}</p>
        ) : (
          <p>Drag and Drop Audio file here</p>
        )}
      </div>
    </div>
  );
}
export default StyledDropzone;
