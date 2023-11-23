import React, { useEffect } from 'react';
import css from 'css';
import expose from 'expose';
import Recorder from '../recorder';
import utils from '../utils';
import { useKeyboardEventListener } from '../hooks';
import dialog from '../dialog/index';
import { notify } from '../notifications';
import StyledDropzone from '../dropzone';

const AudioContext = window.AudioContext || window.webkitAudioContext;

const uploadSound = async (fileName, node, soundUrl) => {
  const blob = await fetch(soundUrl).then(r => r.blob());
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  reader.onloadend = function () {
    const base64data = reader.result;
    return new Promise(resolve => {
      utils.post(
        'voice',
        {
          fileName,
          id: node.id,
          url: base64data,
        },
        resolve
      );
    });
  };
};

const deleteSound = async (fileName, node) => {
  return new Promise(resolve => {
    utils.del(`voice/${fileName}/${node.id}`, resolve);
  });
};

const openSoundInAudacity = async (fileName, node) => {
  notify('Opening in Audacity...');
  return new Promise(resolve => {
    utils.get(`open/audacity/${fileName}/${node.id}`, resolve);
  });
};

const openSoundInExplorer = async (fileName, node) => {
  notify('Opening in Explorer...');
  return new Promise(resolve => {
    utils.get(`open/explorer/${fileName}/${node.id}`, resolve);
  });
};

let recordingIntervalId = -1;
let recordingStartTime = 0;
let recordingPausedTime = 0;
const startTimer = (setRecordingTime, reset) => {
  if (reset) {
    recordingStartTime = +new Date();
  } else {
    recordingStartTime += +new Date() - recordingPausedTime;
  }

  recordingIntervalId = setInterval(() => {
    setRecordingTime(+new Date() - recordingStartTime);
  }, 33);
};
const stopTimer = () => {
  recordingPausedTime = +new Date();
  clearInterval(recordingIntervalId);
};

const VoiceRecordingContainer = ({
  node,
  keyboardShortcutsEnabled,
  setConfirmLeave,
  setDisableLeave,
}) => {
  const [isRecording, setIsRecording] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [recordedSoundUrl, setRecordedSoundUrl] = React.useState(null);
  const [existingSoundUrl, setExistingSoundUrl] = React.useState(null);
  const [uploadSoundUrl, setUploadSoundUrl] = React.useState(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [recordingTime, setRecordingTime] = React.useState(0);

  const [recordingState, setRecordingState] = React.useState({
    audioContext: null,
    gumStream: null,
    rec: null,
    input: null,
  });

  const fileName = expose.get_state('main').current_file.name.slice(0, -5);

  // useKeyboardEventListener(
  //   ev => {
  //     if (!keyboardShortcutsEnabled) {
  //       return;
  //     }

  //     if (isRecording) {
  //       if (ev.key === ' ') {
  //         handlePauseClick();
  //       }
  //     } else {
  //       if (ev.key === ' ') {
  //         handlePauseClick();
  //       }
  //     }
  //   },
  //   [isPaused, isRecording, keyboardShortcutsEnabled]
  // );

  React.useEffect(() => {
    const fileName = expose.get_state('main').current_file.name.slice(0, -5);
    utils.get(`voice/${fileName}/${node.id}`, resp => {
      if (resp.data.file) {
        setExistingSoundUrl(resp.data.file);
      }
      setIsLoading(false);
    });
  }, [node]);

  const handleRecordClick = React.useCallback(() => {
    const constraints = { audio: true, video: false };
    setIsRecording(true);
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(function (stream) {
        console.log(
          'getUserMedia() success, stream created, initializing Recorder.js ...'
        );
        const audioContext = new AudioContext();
        const gumStream = stream;
        const input = audioContext.createMediaStreamSource(stream);

        // Recording 2 channels will double the file size
        const rec = new Recorder(input, { numChannels: 1 });
        setRecordingState({
          audioContext,
          gumStream,
          input,
          rec,
        });

        rec.record();

        startTimer(setRecordingTime, true);
        setDisableLeave(true);
      })
      .catch(function (err) {
        console.error('Could not record', err);
        setIsRecording(false);
      });
  }, [setDisableLeave]);

  const handlePauseClick = React.useCallback(() => {
    const { rec } = recordingState;
    if (rec.recording) {
      setIsPaused(true);
      stopTimer();
      rec.stop();
    } else {
      setIsPaused(false);
      startTimer(setRecordingTime, false);
      rec.record();
    }
  }, [recordingState]);

  const handleStopClick = React.useCallback(() => {
    const { rec, gumStream } = recordingState;

    setIsPaused(false);
    setIsRecording(false);
    stopTimer();

    rec.stop();
    setDisableLeave(false);
    setConfirmLeave(true);

    gumStream.getAudioTracks()[0].stop();
    rec.exportWAV(blob => {
      const url = URL.createObjectURL(blob);
      setRecordedSoundUrl(url);
    });
  }, [recordingState, setConfirmLeave, setDisableLeave]);

  const handleSaveClick = React.useCallback(() => {
    const save = async () => {
      const fileName = expose.get_state('main').current_file.name.slice(0, -5);
      setIsSaving(true);
      await uploadSound(fileName, node, recordedSoundUrl);
      notify('Audio file saved successfully.', 'confirm');
      setIsSaving(false);
      setExistingSoundUrl(recordedSoundUrl);
      setRecordedSoundUrl(null);
      setConfirmLeave(false);
    };

    if (existingSoundUrl) {
      dialog.show_confirm_outer(
        'Saving will overwrite the existing recording.  Are you sure?',
        save,
        () => void 0
      );
    } else {
      save();
    }
  }, [node, recordedSoundUrl, setConfirmLeave, existingSoundUrl]);

  const handleSaveUploadClick = React.useCallback(() => {
    const save = async () => {
      const fileName = expose.get_state('main').current_file.name.slice(0, -5);
      setIsSaving(true);
      await uploadSound(fileName, node, uploadSoundUrl);
      notify('Audio file uploaded successfully.', 'confirm');
      setIsSaving(false);
      setExistingSoundUrl(uploadSoundUrl);
      setUploadSoundUrl(null);
      setConfirmLeave(false);
    };

    if (existingSoundUrl) {
      dialog.show_confirm_outer(
        'Uploading will overwrite the existing recording.  Are you sure?',
        save,
        () => void 0
      );
    } else {
      save();
    }
  }, [node, uploadSoundUrl, setConfirmLeave, existingSoundUrl]);

  handleSaveUploadClick;

  const handleDeleteClick = React.useCallback(() => {
    const del = async () => {
      const fileName = expose.get_state('main').current_file.name.slice(0, -5);
      setIsSaving(true);
      await deleteSound(fileName, node);
      notify('Audio file deleted successfully.', 'confirm');
      setIsSaving(false);
      setExistingSoundUrl(recordedSoundUrl);
      setRecordedSoundUrl(null);
      setConfirmLeave(false);
    };

    dialog.show_confirm_outer(
      'This will delete the current audio file for this text node.  Are you sure?',
      del,
      () => void 0
    );
  }, [recordedSoundUrl, setConfirmLeave, node]);

  const handleOpenInAudacityClick = React.useCallback(() => {
    const fileName = expose.get_state('main').current_file.name.slice(0, -5);
    openSoundInAudacity(fileName, node);
  }, [node]);

  const handleOpenInExplorerClick = React.useCallback(() => {
    const fileName = expose.get_state('main').current_file.name.slice(0, -5);
    openSoundInExplorer(fileName, node);
  }, [node]);

  return (
    <div
      style={{
        width: '100%',
      }}
    >
      <div style={{ color: css.colors.WHITE, textAlign: 'center' }}>
        Record an audio file for this text node.
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <button
          style={{
            minWidth: '140px',
          }}
          className={'cancel-button'}
          onClick={() => {
            if (isRecording) {
              handleStopClick();
            } else {
              handleRecordClick();
            }
          }}
        >
          <span className="no-select">
            {isRecording ? '■ Stop' : '○ Record'}
          </span>
        </button>
        <button
          style={{
            minWidth: '140px',
          }}
          className="confirm-button"
          onClick={handlePauseClick}
          disabled={!isRecording}
        >
          <span className="no-select">
            {isPaused ? '► Resume' : '|| Pause'}
          </span>
        </button>
      </div>
      <div
        style={{
          margin: '5px',
        }}
      >
        {isRecording ? (
          <div style={{ color: '#faa', textAlign: 'center' }}>
            Recording in progress... {(recordingTime / 1000).toFixed(2)}s
          </div>
        ) : null}
        {isSaving ? (
          <div style={{ color: css.colors.WHITE, textAlign: 'center' }}>
            Saving audio file...
          </div>
        ) : null}
        {isLoading ? (
          <div style={{ color: css.colors.WHITE, textAlign: 'center' }}>
            Loading...
          </div>
        ) : null}
        {recordedSoundUrl ? (
          <div>
            <div
              style={{
                color: css.colors.WHITE,
                textAlign: 'left',
                margin: '8px 20px',
                borderBottom: '1px solid white',
              }}
            >
              RECORDED AUDIO
            </div>
            <audio
              style={{
                width: '100%',
              }}
              controls
              src={recordedSoundUrl}
            ></audio>
          </div>
        ) : null}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '8px 0px',
          }}
        >
          <button
            className="confirm-button"
            onClick={handleSaveClick}
            style={{
              display: !recordedSoundUrl || isRecording ? 'none' : '',
              width: '40%',
            }}
          >
            <span className="no-select">Save Recording</span>
          </button>
          <button
            className="cancel-button"
            disabled={isRecording}
            onClick={handleDeleteClick}
            style={{
              display: existingSoundUrl ? '' : 'none',
              width: '40%',
            }}
          >
            <span className="no-select">Delete Existing Audio</span>
          </button>
        </div>
        {existingSoundUrl ? (
          <div>
            <div
              style={{
                color: css.colors.WHITE,
                textAlign: 'left',
                margin: '8px 20px',
              }}
            >
              <div
                style={{
                  borderBottom: '1px solid white',
                }}
              >
                EXISTING AUDIO
              </div>
              <div
                style={{
                  display: 'flex',
                }}
              >
                <div
                  onClick={handleOpenInAudacityClick}
                  className="link"
                  style={{
                    userSelect: 'none',
                    fontSize: '0.75rem',
                    margin: '8px 0px',
                  }}
                >{`Open in Audacity`}</div>
                <div
                  onClick={handleOpenInExplorerClick}
                  className="link"
                  style={{
                    userSelect: 'none',
                    fontSize: '0.75rem',
                    margin: '8px 0px',
                    marginLeft: '32px',
                  }}
                >{`Open in File Explorer`}</div>
              </div>
              <div
                style={{
                  userSelect: 'none',
                  fontSize: '0.75rem',
                  margin: '8px 0px',
                }}
              >{`save/voice/${fileName}/${node.id}.wav`}</div>
            </div>

            <audio
              style={{
                width: '100%',
              }}
              controls
              src={existingSoundUrl}
            ></audio>
          </div>
        ) : (
          !isLoading &&
          !isRecording &&
          !recordedSoundUrl && (
            <div style={{ color: css.colors.WHITE, textAlign: 'center' }}>
              No audio file exists for this text node.
            </div>
          )
        )}
      </div>
      <div>
        <div>
          <div
            style={{
              color: css.colors.WHITE,
              textAlign: 'left',
              margin: '8px 20px',
              borderBottom: '1px solid white',
            }}
          >
            UPLOAD AUDIO
          </div>
        </div>
        <StyledDropzone
          onDrop={url => {
            setUploadSoundUrl(url);
          }}
        />
        {uploadSoundUrl ? (
          <div>
            <audio
              style={{
                width: '100%',
                marginTop: '8px',
              }}
              controls
              src={uploadSoundUrl}
            ></audio>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <button
                className="confirm-button"
                disabled={isRecording}
                onClick={handleSaveUploadClick}
                style={{
                  width: '40%',
                }}
              >
                <span className="no-select">Upload Audio</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const TextNodeInputDialog = ({ node, onConfirm, onCancel, hide }) => {
  const [value, setValue] = React.useState(node.content);
  const [keyboardShortcutsEnabled, setKeyboardShortcutsEnabled] =
    React.useState(false);
  const [confirmLeave, setConfirmLeave] = React.useState(false);
  const [disableLeave, setDisableLeave] = React.useState(false);

  const handleInputChange = React.useCallback(ev => {
    setValue(ev.target.value);
  }, []);
  const handleConfirmClick = React.useCallback(() => {
    const _confirm = () => {
      onConfirm(value);
      hide();
    };
    if (disableLeave) {
      return;
    }

    if (confirmLeave) {
      dialog.show_confirm_outer(
        'You have unsaved changes for this node, would you still like to continue without saving them?',
        _confirm,
        () => void 0
      );
    } else {
      _confirm();
    }
  }, [hide, onConfirm, value, confirmLeave, disableLeave]);

  const handleCancelClick = React.useCallback(() => {
    const _cancel = () => {
      if (onCancel) {
        onCancel();
      }
      hide();
    };
    if (disableLeave) {
      return;
    }
    if (confirmLeave) {
      dialog.show_confirm_outer(
        'You have unsaved changes for this node, would you still like to cancel?',
        _cancel,
        () => void 0
      );
    } else {
      _cancel();
    }
  }, [hide, onCancel, confirmLeave, disableLeave]);

  const handleTextareaFocus = React.useCallback(() => {
    setKeyboardShortcutsEnabled(false);
  }, []);

  const handleTextareaBlur = React.useCallback(() => {
    setKeyboardShortcutsEnabled(true);
  }, []);

  useEffect(() => {
    window.current_confirm = handleConfirmClick;
    window.current_cancel = handleCancelClick;
  }, [handleConfirmClick, handleCancelClick]);

  useEffect(() => {
    const elem = document.getElementById('InputDialog-input');
    if (elem) {
      elem.focus();
    }
  }, []);

  return (
    <div
      onWheel={ev => ev.stopPropagation()}
      onMouseDown={ev => ev.stopPropagation()}
      onMouseUp={ev => ev.stopPropagation()}
      style={{
        position: 'fixed',
        left: '0',
        top: '0',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(0, 0, 0, 0.25)',
      }}
    >
      <div
        style={{
          width: '800px',
          // minWidth: '50%',
          padding: '5px',
          backgroundColor: css.colors.SECONDARY,
          border: '4px solid ' + css.colors.SECONDARY_ALT,
          color: css.colors.TEXT_LIGHT,
        }}
      >
        <div style={{ margin: '5px 0px' }}>
          Edit Text Node{' '}
          <span
            style={{
              marginLeft: '16px',
              color: '#AAA',
              textTransform: 'underline',
              fontFamily: 'monospace',
            }}
          >
            {expose.get_state('main').current_file.name.slice(0, -5)}/{node.id}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <textarea
            id="InputDialog-input"
            onChange={handleInputChange}
            onFocus={handleTextareaFocus}
            onBlur={handleTextareaBlur}
            value={value}
            spellCheck={true}
            style={{
              padding: '5px',
              background: 'rgb(53, 53, 53)',
              resize: 'none',
              // whiteSpace: 'pre',
              color: css.colors.TEXT_LIGHT,
              width: '50%',

              minHeight: '500px',
            }}
          ></textarea>
          <div
            style={{
              width: '50%',
              padding: '0px 8px',
              boxSizing: 'border-box',
            }}
          >
            <VoiceRecordingContainer
              node={node}
              keyboardShortcutsEnabled={keyboardShortcutsEnabled}
              setConfirmLeave={setConfirmLeave}
              setDisableLeave={setDisableLeave}
            />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            margin: '5px',
          }}
        >
          <div className="confirm-button" onClick={handleConfirmClick}>
            <span className="no-select">OK</span>
          </div>
          <div className="cancel-button" onClick={handleCancelClick}>
            <span className="no-select">Cancel</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextNodeInputDialog;
