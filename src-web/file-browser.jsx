import dialog from './dialog';
import { notify } from './notifications';

const React = require('react');
const css = require('./css');
const utils = require('./utils');
const expose = require('./expose');
const core = require('./core-in2');

//This file represents the file browser on the right side of the screen.
//It can:
// 1.) List all files from the api endpoint at GET /file
// 2.) Load a file onto the board when it is clicked at GET /file/<filename>
// 3.) Rename a file if it is double clicked
// 4.) Create a new file by clicking the button at the top
// 5.) Delete a file by clicking the red 'x' on the right at DEL GET /file/<filename>
// 6.) Uses LocalStorage to remember the last file you had open

const PRIMARY_FILES = [
  // 'Inventory.json',
  // 'InventoryExamineEvents.json',
  // 'PickUp.json',
  // 'PickUpEvents.json',
];

let fileHistoryInd = -1;
let fileHistory = [];

export const pushFileHistory = fileName => {
  if (fileHistoryInd < fileHistory.length - 1) {
    fileHistory = fileHistory.slice(0, fileHistoryInd + 1);
  }
  if (fileHistory[fileHistory.length - 1] !== fileName) {
    fileHistory.push(fileName);
    fileHistoryInd++;
  }
};
export const popFileHistory = () => {
  fileHistoryInd--;
  if (fileHistoryInd < -1) {
    fileHistoryInd = -1;
  }
};
export const forwardFileHistory = () => {
  fileHistoryInd++;
  if (fileHistoryInd >= fileHistory.length) {
    fileHistoryInd = fileHistory.length - 1;
  }
};
export const loadFileFromHistory = () => {
  console.log(
    'LOAD FILE FROM HISTORY',
    fileHistoryInd,
    fileHistory[fileHistoryInd],
    fileHistory
  );
  const copiedFileHistory = fileHistory.slice();
  expose
    .get_state('file-browser')
    .loadFileExternal(fileHistory[fileHistoryInd], () => {
      console.log('reset file history', copiedFileHistory);
      fileHistory = copiedFileHistory;
    });
};

class FileBrowser extends expose.Component {
  constructor(props) {
    super(props);
    this.expose('file-browser');
    const filter = localStorage.getItem('last_filter_value');

    /**
     * @type {string[]}
     */
    const file_list = [];

    this.state = {
      file_list,
      filter: filter || '',
      checked_files: {},
      check_all: false,
      check_primary: false,
    };

    this.onFileClick = function (filename) {
      this.loadFile(filename);
    }.bind(this);

    this.onFileCheckboxClick = function (filename, ev) {
      if (filename === this.props.current_file_name) {
        return;
      }
      const ns = this.state.checked_files;
      ns[filename] = !!ev.target.checked;
      this.setState({
        checked_files: ns,
        check_all: false,
        check_primary: false,
      });
    }.bind(this);

    this.onCheckAllClick = ev => {
      const ns = {};
      const filteredFiles = this.state.file_list.filter(filename => {
        let is_valid_regex = true;
        try {
          this.regex = new RegExp(this.state.filter);
        } catch (e) {
          is_valid_regex = false;
        }
        if (this.state.filter) {
          if (is_valid_regex) {
            return filename.search(this.state.filter) > -1;
          } else {
            return filename.indexOf(this.state.filter) > -1;
          }
        } else {
          return true;
        }
      });
      for (const fileName of filteredFiles) {
        if (fileName === this.props.current_file_name) {
          ns[fileName] = true;
        } else {
          ns[fileName] = !!ev.target.checked;
        }
      }
      this.setState({
        checked_files: ns,
        check_all: !!ev.target.checked,
        check_primary: false,
      });
    };

    this.onCheckPrimaryClick = () => {
      const ns = {};
      const filteredFiles = this.state.file_list;
      for (const fileName of filteredFiles) {
        if (
          fileName === this.props.current_file_name ||
          PRIMARY_FILES.includes(fileName) ||
          fileName.includes('FUNC_')
        ) {
          ns[fileName] = true;
        } else if (this.state.checked_files[fileName]) {
          ns[fileName] = true;
        }
      }
      this.setState({
        checked_files: ns,
        check_primary: true,
        check_all: false,
      });
    };

    this.onCompileFileClick = () => {
      expose.get_state('player-area').compile(this.props.current_file_name);
    };

    this.getCheckedFiles = () => {
      const checked_files = [];
      for (const i in this.state.checked_files) {
        if (this.state.checked_files[i]) {
          if (i === this.props.current_file_name) {
            checked_files.unshift(i);
          } else {
            checked_files.push(i);
          }
        }
      }
      return checked_files;
    };

    this.onCompileSelectedClick = () => {
      expose.get_state('player-area').compile(this.getCheckedFiles());
    };

    this.onCompileAllClick = () => {
      expose.get_state('player-area').compile();
    };

    this.onFileDoubleClick = function (filename) {
      dialog.show_input(filename, name => {
        this.renameFile(filename, name);
      });
    }.bind(this);

    this.onCreateClick = () => {
      dialog.show_input(
        null,
        name => {
          const err = this.createFile(name);
          if (err) {
            console.error(err);
            dialog.show_notification(err);
          }
        },
        undefined,
        false
      );
    };

    this.onRenameClick = () => {
      dialog.show_input(
        this.props.current_file_name,
        name => {
          const err = this.renameFile(this.props.current_file_name, name);
          if (err) {
            console.error(err);
            dialog.show_notification(err);
          }
        },
        undefined,
        false
      );
    };

    this.onCopyClick = () => {
      try {
        expose.get_state('board').copySelection();
        notify('Copied selection to clipboard', 'info');
      } catch (e) {
        notify('Select 1 or more nodes to copy!', 'error');
      }
    };

    this.onPasteClick = () => {
      expose.get_state('board').pasteSelection();
    };

    this.onDeleteClick = function (filename) {
      dialog.show_confirm(
        'Are you sure you want to delete "' + filename + '"?',
        () => {
          this.deleteFile(filename);
        }
      );
    }.bind(this);

    this.handleFilterChange = ev => {
      localStorage.setItem('last_filter_value', ev.target.value);
      this.setState({
        filter: ev.target.value,
      });
    };

    this.loadFileExternal = (filename, cb) => {
      this.loadFile(filename, cb);
    };
    this.state.loadFileExternal = this.loadFileExternal;
  }

  componentDidMount() {
    this.refreshFileList(() => {
      const file = localStorage.getItem('last_file_name');
      this.loadFile(file || 'default.json');
    });
  }

  refreshFileList(cb) {
    utils.get('/file', resp => {
      const new_checked_files = {};
      const checked_files = this.state.checked_files;
      resp.data.forEach(filename => {
        new_checked_files[filename] = checked_files[filename] || false;
      });

      this.setState({
        file_list: resp.data.sort((a, b) => {
          const aIsFunc = a.includes('FUNC_');
          const bIsFunc = b.includes('FUNC_');
          if (aIsFunc && !bIsFunc) {
            return 1;
          } else if (!aIsFunc && bIsFunc) {
            return -1;
          } else {
            return a.localeCompare(b);
          }
        }),
        checked_files: new_checked_files,
      });
      if (cb) {
        cb();
      }
    });
  }
  validateName(name) {
    if (name.length < 2) {
      return 'That name is too short';
    }
    if (
      this.state.file_list
        .map(n => n.toLowerCase())
        .indexOf(name.toLowerCase()) !== -1
    ) {
      return 'A file with that name already exists.';
    }
    return false;
  }

  renameFile(old_name, new_name) {
    if (new_name.length > 1 && new_name.slice(-5) !== '.json') {
      new_name = new_name + '.json';
    }
    const err = this.validateName(new_name);
    if (err) {
      console.error(err);
      dialog.show_notification(err);
      return;
    }
    dialog.show_loading();
    utils.get('/file/' + old_name, resp => {
      resp.data.name = new_name;
      utils.post('/file/' + new_name, resp.data, () => {
        this.deleteFile(old_name, () => {
          utils.post(
            '/rename-file-contents',
            {
              oldName: old_name,
              newName: new_name,
            },
            () => {
              this.loadFile(new_name);
              dialog.hide_loading();
            }
          );
        });
      });
    });
  }
  loadFile(name, cb) {
    return new Promise(resolve => {
      console.log('LOAD FILE', name);
      if (!name) {
        resolve();
        return;
      }
      if (this.props.current_file_name === name) {
        pushFileHistory(name);
        if (cb) {
          cb();
        }
        resolve();
        return;
      }
      utils.get('/file/' + name, resp => {
        localStorage.setItem('last_file_name', name);
        const ns = this.state.checked_files;
        ns[name] = true;

        expose.set_state('main', {
          current_file: resp.data,
          checked_files: ns,
        });
        pushFileHistory(name);
        if (cb) {
          cb();
        }

        setTimeout(() => {
          resolve();
        }, 1);
      });
    });
  }
  createFile(name) {
    if (name.length > 1 && name.slice(-5) !== '.json') {
      name = name + '.json';
    }
    const err = this.validateName(name);
    if (err) {
      return err;
    }
    const file = {
      name: name,
      nodes: [
        {
          id: utils.random_id(3),
          type: 'root',
          content: 'Root',
          top: '20px',
          left: '20px',
        },
      ],
      links: [],
    };
    utils.post('/file/' + file.name, file, () => {
      console.log('File created', file.name);
      this.refreshFileList(() => {
        this.loadFile(name);
      });
    });
  }
  deleteFile(name, cb) {
    if (name === 'default.json') {
      return;
    }
    utils.del('/file/' + name, () => {
      this.refreshFileList(() => {
        if (cb) {
          cb(name);
        } else {
          if (name === this.props.current_file_name) {
            expose.set_state('main', {
              current_file: null,
            });
          }
        }
      });
    });
  }

  render() {
    let is_valid_regex = true;
    try {
      this.regex = new RegExp(this.state.filter);
    } catch (e) {
      is_valid_regex = false;
    }
    /**
     * @type {any}
     */
    let elems = this.state.file_list
      .filter(filename => {
        if (this.state.filter) {
          if (is_valid_regex) {
            return filename.search(this.state.filter) > -1;
          } else {
            return filename.indexOf(this.state.filter) > -1;
          }
        } else {
          return true;
        }
      })
      .map(filename => {
        const isFunc = filename.includes('FUNC_');
        return React.createElement(
          'div',
          {
            key: filename,
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              width: '280px',
            },
          },
          React.createElement('input', {
            type: 'checkbox',
            checked: this.state.checked_files[filename] ?? false,
            onChange: this.onFileCheckboxClick.bind(this, filename),
            style: {
              marginTop: '6px',
            },
          }),
          React.createElement(
            'div',
            {
              className: 'file',
              onClick: this.onFileClick.bind(this, filename),
              onDoubleClick: this.onFileDoubleClick.bind(this, filename),
              title: filename,
              style: {
                backgroundColor:
                  this.props.current_file_name === filename
                    ? css.colors.FG_NEUTRAL
                    : null,
                padding: '5px',
                cursor: 'pointer',
                color: isFunc
                  ? css.colors.YELLOW_HIGHLIGHT
                  : css.colors.TEXT_LIGHT,
                width: '240px',
                textOverflow: 'ellipsis',
                whiteSpace: 'pre',
                overflow: 'hidden',
              },
            },
            React.createElement(
              'span',
              {
                className: 'no-select',
              },
              filename
            )
          ),
          React.createElement(
            'span',
            {
              onClick: this.onDeleteClick.bind(this, filename),
              className: 'file-delete',
            },
            React.createElement('span', { className: 'no-select' }, 'X')
          )
        );
      });

    if (!elems.length) {
      elems = React.createElement(
        'div',
        {
          style: {
            padding: '10px',
            color: css.colors.TEXT_NEUTRAL,
          },
        },
        '(No Files)'
      );
    }

    return (
      <>
        <div
          style={{
            position: 'fixed',
            top: '0',
            right: '300px',
            width: '125px',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <div
            className={
              'confirm-button confirm-button-player' +
              (fileHistoryInd < 0 ? ' disabled' : '')
            }
            onClick={() => {
              popFileHistory();
              loadFileFromHistory();
            }}
          >
            ◄
          </div>
          <div
            className={
              'confirm-button confirm-button-player' +
              (fileHistoryInd >= fileHistory.length - 1 ? ' disabled' : '')
            }
            onClick={() => {
              forwardFileHistory();
              loadFileFromHistory();
            }}
          >
            ►
          </div>
        </div>
        {React.createElement(
          'div',
          {
            //prevents the board from moving when you click anywhere on the file browser
            onMouseDown: ev => {
              ev.stopPropagation();
              ev.nativeEvent.stopImmediatePropagation();
            },
            onWheel: ev => {
              ev.stopPropagation();
            },
            style: {
              backgroundColor: css.colors.BG_NEUTRAL,
              overflowY: 'scroll',
              height: window.innerHeight + 'px',
            },
          },
          React.createElement(
            'div',
            {
              style: {
                height: '52px',
                display: 'flex',
                justifyContent: 'space-around',
              },
            },
            React.createElement(
              'div',
              {
                className: 'confirm-button',
                onClick: this.onCompileFileClick,
              },
              React.createElement(
                'span',
                { className: 'no-select' },
                'Compile File'
              )
            ),
            React.createElement(
              'div',
              {
                className: 'confirm-button',
                onClick: this.onCompileSelectedClick,
              },
              React.createElement(
                'span',
                { className: 'no-select' },
                'Compile Selected'
              )
            ),
            React.createElement(
              'div',
              {
                className: 'confirm-button',
                onClick: this.onCompileAllClick,
              },
              React.createElement(
                'span',
                { className: 'no-select' },
                'Compile All'
              )
            )
          ),
          React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                justifyContent: 'flex-start',
              },
            },
            <div
              className="confirm-button-secondary"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onClick={this.onCreateClick}
            >
              <span className="no-select">New</span>
            </div>,
            <div
              className="confirm-button-secondary"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onClick={this.onRenameClick}
            >
              <span className="no-select">Rename</span>
            </div>,
            <div
              className="confirm-button-secondary"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '25px',
              }}
              onClick={this.onCopyClick}
            >
              <span className="no-select">
                <img
                  src={`resources/img/copy.svg`}
                  style={{
                    width: '20px',
                  }}
                  alt="copy"
                ></img>
              </span>
            </div>,
            <div
              className="confirm-button-secondary"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '25px',
              }}
              onClick={this.onPasteClick}
            >
              <span className="no-select">
                <img
                  src={`resources/img/paste.svg`}
                  style={{
                    width: '20px',
                  }}
                  alt="copy"
                ></img>
              </span>
            </div>
          ),
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <div
              className="confirm-button confirm-button-player"
              onClick={() => {
                dialog.show_input(
                  null,
                  async nodeId => {
                    dialog.show_loading();
                    const resp = await new Promise(resolve => {
                      utils.get('/find-node/' + nodeId, resolve);
                    });
                    dialog.hide_loading();
                    if (resp.error) {
                      console.error(resp.error);
                      dialog.show_notification('Node not found: ' + nodeId);
                    } else {
                      await this.loadFile(
                        resp.file.slice(resp.file.lastIndexOf('/save/') + 6)
                      );
                      await new Promise(resolve => {
                        setTimeout(resolve, 1);
                      });
                      expose.get_state('board').centerOnNode(nodeId);
                    }
                  },
                  undefined,
                  false
                );
              }}
            >
              Find Node
            </div>
            {/* <div
          className="confirm-button confirm-button-player"
          onClick={async () => {
            dialog.show_loading();
            const resp = await new Promise(resolve => {
              utils.get('/compile', resolve);
            });
            let states = {};
            if (resp.error) {
              states.error = resp.error;
            } else if (resp.data.success === false) {
              states = resp.data.errors;
            } else {
              states = await core.runFileDry(resp.data.file);
            }
            dialog.set_shift_req(true);
            dialog.hide_loading();
            dialog.showActionNodeInput({
              node: {
                content: JSON.stringify(states, null, 2),
              },
              onConfirm: () => {
                dialog.set_shift_req(false);
              },
              onCancel: () => {
                dialog.set_shift_req(false);
              },
            });
          }}
        >
          State
        </div> */}
            <div
              className="confirm-button confirm-button-player"
              onClick={async () => {
                const saveData = core.getSaveData() || {};
                dialog.set_shift_req(true);
                dialog.showActionNodeInput({
                  node: {
                    content: JSON.stringify(saveData, null, 2),
                  },
                  onConfirm: result => {
                    const data = JSON.parse(result);
                    core.setSaveData(data);
                    dialog.set_shift_req(false);
                  },
                  onCancel: () => {
                    dialog.set_shift_req(false);
                  },
                });
              }}
            >
              Saved Data
            </div>
          </div>,
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <div
              className="confirm-button confirm-button-export"
              onClick={async () => {
                dialog.show_loading();
                const resp = await new Promise(resolve => {
                  utils.post('/export', {}, resolve);
                });
                dialog.hide_loading();
                if (resp.data.err) {
                  dialog.show_notification(
                    <>
                      <div>Export Failure</div>
                      <div>
                        {resp.data.err
                          .filter((_, i) => i < 10)
                          .map(({ text, node_id, filename }) => (
                            <div
                              key={node_id}
                              style={{
                                margin: '8px',
                              }}
                            >
                              <span style={{ color: '#ff6565' }}>
                                {node_id}:{filename}
                              </span>{' '}
                              <span>{text}</span>
                            </div>
                          ))}
                      </div>
                    </>
                  );
                } else {
                  notify('Export successful!  ' + resp.data.msg, 'confirm');
                }
              }}
            >
              EXPORT
            </div>
          </div>,
          <div
            style={{
              style: {
                height: '30px',
                display: 'flex',
                justifyContent: 'space-around',
              },
            }}
          >
            <input
              placeholder="Filter..."
              value={this.state.filter}
              onChange={this.handleFilterChange}
              style={{
                width: 'calc(100% - 10px)',
                padding: '3px',
                margin: '5px',
              }}
            />
          </div>,
          <div
            style={{
              textAlign: 'center',
              color: css.colors.TEXT_LIGHT,
              textDecoration: 'underline',
              margin: '10px',
            }}
          >
            {this.props.current_file_name?.slice(0, -5) || '(None Selected)'}
          </div>,
          <div
            style={{
              color: '#77d8ff',
              display: 'flex',
              alignItems: 'center',
              margin: '8px 0px',
            }}
          >
            <div>
              <input
                id="check_all"
                name="check_all"
                type="checkbox"
                checked={this.state.check_all ?? false}
                onChange={this.onCheckAllClick}
                style={{
                  marginTop: '6px',
                  padding: '3px',
                }}
              ></input>
            </div>
            <label htmlFor="check_all">All </label>
            <div>
              <input
                id="check_primary"
                name="check_primary"
                type="checkbox"
                checked={this.state.check_primary ?? false}
                onChange={this.onCheckPrimaryClick}
                style={{ marginTop: '6px', padding: '3px' }}
              ></input>
            </div>
            <label htmlFor="check_primary">Lib Items</label>
          </div>,
          <div style={{ width: 'calc( 100% - 14px )' }}>{elems}</div>
        )}
      </>
    );
  }
}

export default FileBrowser;
