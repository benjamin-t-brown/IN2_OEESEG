const fs = require('fs');
const prettier = require('prettier');

const QUOTE = '`';
const escapeQuotes = q => {
  return q.replaceAll(QUOTE, '\\' + QUOTE);
};

/**
 * @type {any}
 */
const strProto = String.prototype;
if (!strProto.replaceAll) {
  strProto.replaceAll = function (str, newStr) {
    // If a regex pattern
    if (
      Object.prototype.toString.call(str).toLowerCase() === '[object regexp]'
    ) {
      return this.replace(str, newStr);
    }

    // If a string
    return this.replace(new RegExp(str, 'g'), newStr);
  };
}

//This program can compile compatible json files into IN2 *.compiled.js files.
//Usage:
//  Compile all files within the ${ProjectDir}/save dirsectory into ${ProjectDir}/src-compile/main.compiled.js
//    node compiler.js
//  Compile file <filename> within the ${ProjectDir}/save directory into ${ProjectDir}/src-compile/out/<filename>.compiled.js
//    node compiler.js --file <filename>

//node types:
// root, text, choice, choice_text, choice_conditional, pass_fail, pass_text, fail_text, defer, next_file, action, picture

const CURRENT_NODE_VAR = 'curIN2n';
const CURRENT_FILE_VAR = 'curIN2f';
const LAST_FILE_VAR = 'lasIN2f';
const LAST_NODE_VAR = 'lasIN2n';
let includeDebugStatements = true;
let globalDeclarations = {};

let config;
try {
  config = JSON.parse(
    fs.readFileSync(__dirname + '/../config.json').toString()
  );
} catch (e) {
  console.log(
    '[WARN] Using config.template.js instead of config.js.  Copy and replace with your configs.'
  );
  config = JSON.parse(
    fs.readFileSync(__dirname + '/../config.template.json').toString()
  );
}
let standalone = fs
  .readFileSync(__dirname + '/../' + config.standaloneCorePath)
  .toString();
for (let i = 0; i < config.additionalPaths.length; i++) {
  standalone +=
    '\n' +
    fs.readFileSync(__dirname + '/../' + config.additionalPaths[i]).toString();
}
standalone = standalone.replace(/console\.log\((.*)\)/g, '');

class File {
  constructor(json) {
    this.json = json;
    this.name = json.name;
  }

  getRoot() {
    for (let i in this.json.nodes) {
      if (this.json.nodes[i].type === 'root') {
        return this.json.nodes[i];
      }
    }
    return null;
  }

  getSubRoots() {
    return this.json.nodes.filter(node => {
      return node.type === 'sub_root';
    });
  }

  getNode(id) {
    for (let i in this.json.nodes) {
      if (this.json.nodes[i].id === id) {
        return this.json.nodes[i];
      }
    }
    return null;
  }

  getChildren(node) {
    return this.json.links
      .filter(link => {
        return link.from === node.id;
      })
      .map(link => {
        return this.getNode(link.to);
      })
      .sort((a, b) => {
        if (a.type === 'switch_default') {
          return 1;
        }
        if (b.type === 'switch_default') {
          return -1;
        }

        const y1 = parseFloat(a.left);
        const y2 = parseFloat(b.left);
        if (y1 < y2) {
          return -1;
        } else {
          return 1;
        }
      });
  }

  getParents(node) {
    return this.json.links
      .filter(link => {
        return link.to === node.id;
      })
      .map(link => {
        return this.getNode(link.from);
      });
  }
}

function _replace_declarations(innerContent, declarations) {
  let declContent = '';
  Object.keys(declarations).forEach(declName => {
    if (declName.indexOf('DECL') === 0) {
      let [, playerKey] = declName.split(' ');
      if (!playerKey) {
        throw new Error('Invalid declaration ' + declName);
      }
      declContent += `if (player.get('${playerKey}') === undefined ) player.set('${playerKey}', ${declarations[declName]});\n`;
    } else {
      innerContent = innerContent.replace(
        new RegExp('\\$' + declName, 'g'),
        declarations[declName]
      );
    }
  });
  // console.log('replace decl', declarations, innerContent);
  return { innerContent, declContent };
}

function _eval_content(content, params) {
  if (!content) {
    return;
  }

  params = params || {};
  function evalInContext(js, context) {
    return function () {
      return eval(`${js}`); //eslint-disable-line no-eval
    }.call(context);
  }

  const { quote } = params;
  if (quote) {
    content = `${QUOTE}${escapeQuotes(content)}${QUOTE}`;
  }

  // const dom = new JSDOM(``, {
  //   url: 'https://example.org/',
  //   referrer: 'https://example.com/',
  //   contentType: 'text/html',
  //   includeNodeLocations: true,
  //   storageQuota: 10000000,
  // });
  // Object.assign(global, dom.window);
  // global.document = dom.window.document;

  const prefix = `
  var window = global;
  window.addEventListener = function() {};
  window.IN2 = true;
  window.IN2COMPILER = true;
  window.CURRENT_NODE_VAR = '${CURRENT_NODE_VAR}';
  window.CURRENT_FILE_VAR = '${CURRENT_FILE_VAR}';
  window.LAST_FILE_VAR = '${LAST_FILE_VAR}';
  var document = window.document = {};
  `;

  const postfix = `
  player = {...player};
  core = {...core, ...{
    say: function() {},
    choose: function() {},
    exit: function() {},
  }};
  for (const funcName in engine) {
    engine[funcName] = function() {};
  }
  `;

  const { innerContent, declContent: innerDeclContent } = _replace_declarations(
    content,
    globalDeclarations
  );

  const evalStr = `{${prefix}\n${standalone}\n${postfix}\n${escapeQuotes(
    innerContent
  )}\n}`;

  try {
    evalInContext(evalStr, {});
  } catch (e) {
    console.log('COULD NOT EVAL', innerContent, globalDeclarations, e.stack);
    return 'error' + e;
  }
}

function _create_action_node(content, id, childId, isAsync) {
  let evaluationFailure = _eval_content(content);
  if (evaluationFailure) {
    return evaluationFailure;
  }
  const ret =
    `// action\n` +
    `scope.${id} = ${isAsync ? 'async ' : ''}() => {\n` +
    `    player.set(CURRENT_NODE_VAR, '${id}' );\n` +
    `    ${content};\n` +
    `    scope.${childId}();\n` +
    `};\n`;
  return ret;
}

function _create_text_node(content, id, child_id) {
  // let evaluationFailure = _eval_content(
  //   `${QUOTE}${escapeQuotes(content)}${QUOTE}`
  // );
  // if (evaluationFailure) {
  //   return evaluationFailure;
  // }
  const ret =
    `// text\n` +
    `scope.${id} = () => {\n` +
    `    player.set(CURRENT_NODE_VAR, '${id}');\n` +
    `    var text = ${QUOTE}${escapeQuotes(content)}${QUOTE};\n` +
    `    core.say(text, scope.${child_id}, '${id}', '${child_id}');\n` +
    `};\nscope['${id}'].isText=true;\n`;
  return ret;
}

class Compiler {
  constructor() {
    this.errors = [];
    this.files_to_verify = [];
    this.already_compiled = {};
    this.has_error = {};
    globalDeclarations = {};
    this.typeFuncs = {
      root: (node, file) => {
        const children = file.getChildren(node);
        if (children.length === 0) {
          this.error(file.name, node.id, 'Root node has no child.');
          return null;
        } else if (children.length > 1) {
          this.error(file.name, node.id, 'Root node has multiple children.');
          return null;
        } else {
          const child = children[0];
          let innerContent = this.compileNode(child, file);
          let declContent = '';
          if (innerContent) {
            try {
              const {
                innerContent: innerInnerContent,
                declContent: innerDeclContent,
              } = _replace_declarations(innerContent, globalDeclarations);
              declContent = innerDeclContent;
              innerContent = innerInnerContent;
            } catch (e) {
              console.log('Error replacing decl', e);
              this.error(
                file.name,
                node.id,
                'Declaration node syntax error: expected variable name after DECL.'
              );
            }
          }
          const ret =
            `if(id === undefined){\n` +
            `    scope.${child.id}();\n` +
            `}\n` +
            `else if (id) {\n` +
            `    scope[id]();\n` +
            `}\n`;
          return (
            `files[${QUOTE}${file.name}${QUOTE}] = function(id) {\n` +
            `player.set(CURRENT_FILE_VAR, '${file.name}' );\n` +
            declContent +
            innerContent +
            ret +
            'return player.state' +
            `};\n`
          );
        }
      },
      sub_root: (node, file) => {
        const children = file.getChildren(node);
        if (children.length === 0) {
          this.error(file.name, node.id, 'Sub Root node has no child.');
          return null;
        } else if (children.length > 1) {
          this.error(
            file.name,
            node.id,
            'Sub Root node has multiple children.'
          );
          return null;
        } else {
          const child = children[0];
          let innerContent = this.compileNode(child, file);
          const ret =
            `// sub_root\n` +
            `scope.${node.id} = () => {\n` +
            `    player.set(CURRENT_NODE_VAR, '${node.id}');\n` +
            `    scope.${child.id}();\n` +
            `};\n\n` +
            innerContent;

          return ret;
        }
      },
      text: (node, file) => {
        const children = file.getChildren(node);
        if (children.length === 0) {
          this.error(
            file.name,
            node.id,
            `Text node ${node.id} has no child.\n CONTENT ${node.content}`
          );
          return null;
        } else if (children.length > 1) {
          this.error(
            file.name,
            node.id,
            `Text node ${node.id} has multiple children.\n CONTENT ${node.content}`
          );
          return null;
        } else {
          const child = children[0];
          const ret = _create_text_node(node.content, node.id, child.id);
          if (ret.slice(0, 5) === 'error') {
            this.error(
              file.name,
              node.id,
              'Text node content could not be evaluated. ' +
                ret.slice(5) +
                `\n CONTENT ${node.content}`
            );
            return null;
          }
          return ret + '\n' + this.compileNode(child, file);
        }
      },
      choice: (node, file) => {
        const children = file.getChildren(node);
        if (children.length === 0) {
          this.error(
            file.name,
            node.id,
            `Choice node ${node.id} has no children.\n CONTENT ${node.content}`
          );
          return null;
        }
        // try {
        //   let evaluationFailure = _eval_content(
        //     `${QUOTE}${escapeQuotes(node.content)}${QUOTE}`
        //   );
        //   if (evaluationFailure) {
        //     return evaluationFailure;
        //   }
        // } catch (e) {
        //   this.error(
        //     file.name,
        //     node.id,
        //     'Choice node content could not be evaluated. ' +
        //       e +
        //       `\n CONTENT ${node.content}`
        //   );
        //   return null;
        // }
        let actionRet = '';
        let ret =
          `// ${node.type}\n` +
          `scope.${node.id} = function() {\n` +
          `    player.set(CURRENT_NODE_VAR, '${node.id}' );\n` +
          `    let text = ${QUOTE}${escapeQuotes(node.content)}${QUOTE};\n` +
          `    core.choose(text, '${node.id}', [` +
          ``;
        const nodes_to_compile = [];
        for (let i in children) {
          let condition_child = children[i];
          let text_child = null;
          let action_child = null;
          if (
            condition_child.type === 'test' ||
            condition_child.type === 'choice_text'
          ) {
            text_child = condition_child;
            condition_child = null;
          } else if (condition_child.type === 'choice_conditional') {
            text_child = file.getChildren(condition_child)[0];
            if (!text_child) {
              this.error(
                file.name,
                condition_child.id,
                `Choice Condition node has no child.\n CONTENT ${condition_child.content}`
              );
              return null;
            }
          } else if (condition_child.type === 'combined_conditional_choice') {
            let content = children[i].content;
            if (children[i].combinedConditionalChoice.prefixText) {
              const prefixText =
                children[i].combinedConditionalChoice.prefixText;
              content = `\${player.get('settings.showPrefixes') ? '[${prefixText}]' : ''} ${children[i].content}`;
            }
            text_child = {
              ...condition_child,
              content,
            };
            condition_child = {
              id: children[i].combinedConditionalChoice.id,
              type: 'choice_conditional',
              content: children[i].combinedConditionalChoice.conditionContent,
              conditionReplaceText: children[i].combinedConditionalChoice
                .showTextOnFailedCondition
                ? children[i].combinedConditionalChoice.failedConditionText
                : null,
            };
            if (children[i].combinedConditionalChoice.doActionOnChoose) {
              action_child = {
                id: children[i].combinedConditionalChoice.actionId,
                type: 'action',
                content:
                  children[i].combinedConditionalChoice.onChooseActionContent,
              };
            }
          } else {
            this.error(
              file.name,
              condition_child.id,
              `Choice node ${node.id} has non-text child ${condition_child.id}.\n CONTENT ${node.content}`
            );
            return null;
          }
          // try {
          //   let evaluationFailure = _eval_content(text_child.content, {
          //     quote: true,
          //   });
          //   if (evaluationFailure) {
          //     throw new Error(evaluationFailure.slice(5));
          //   }
          // } catch (e) {
          //   this.error(
          //     file.name,
          //     text_child.id,
          //     'Choice Text node content could not be evaluated. ' +
          //       e +
          //       `\n CONTENT ${node.content}`
          //   );
          //   return null;
          // }
          const textChildChildren = file.getChildren(text_child);
          if (!textChildChildren.length) {
            this.error(
              file.name,
              text_child.id,
              `Text choice node ${text_child.id} has no child.\n CONTENT ${text_child.content}`
            );
            return null;
          }
          let nextChild = textChildChildren[0];
          nodes_to_compile.push(nextChild);
          if (action_child) {
            const textChild = nextChild;
            nextChild = action_child;
            const nextChildText = _create_action_node(
              action_child.content,
              action_child.id,
              textChild.id
            );
            if (nextChildText.slice(0, 5) === 'error') {
              this.error(
                file.name,
                node.id,
                'Action node content (in choice) could not be evaluated. ' +
                  ret.slice(5) +
                  `\n CONTENT ${action_child.content}`
              );
              return null;
            }
            actionRet += '\n' + nextChildText + '\n';
          }

          ret +=
            `{\n` +
            `        t: ${QUOTE}${escapeQuotes(
              text_child.content
            )}${QUOTE},\n` +
            `        ft: ${QUOTE}${escapeQuotes(
              condition_child?.conditionReplaceText || ''
            )}${QUOTE},\n` +
            `        id: '${nextChild.id}',\n` +
            `        cb: scope.${nextChild.id},\n` +
            `        c: function() { ${
              condition_child
                ? 'return ' + condition_child.content
                : 'return true;'
            } }\n` +
            `    },`;
          if (condition_child) {
            try {
              // let evaluationFailure = _eval_content(condition_child.content);
              // if (evaluationFailure) {
              //   throw new Error(evaluationFailure.slice(5));
              // }
            } catch (e) {
              this.error(
                file.name,
                condition_child.id,
                'Choice Condition node could not be evaluated. ' +
                  e +
                  `\n CONTENT ${condition_child.content}`
              );
              return null;
            }
          }
        }
        ret = ret.slice(0, -1);
        ret += `]);\n};scope['${node.id}'].isChoice=true;\n\n`;
        ret += actionRet;
        let is_invalid = false;
        for (let j in nodes_to_compile) {
          const child = nodes_to_compile[j];
          const r = this.compileNode(child, file);
          if (r !== null) {
            ret += r;
          } else {
            is_invalid = true;
          }
        }
        if (is_invalid) {
          return null;
        } else {
          return ret;
        }
      },
      switch: (node, file) => {
        const children = file.getChildren(node);
        if (children.length === 0) {
          this.error(
            file.name,
            node.id,
            `Switch node ${node.id} has no children.\n CONTENT ${node.content}`
          );
          return null;
        }
        const nodes_to_compile = [];
        let ret = `// ${node.type}\n`;
        ret += `scope.${node.id} = () => {\n`;
        ret += `    player.set(CURRENT_NODE_VAR, '${node.id}' );\n`;

        for (let i in children) {
          const child = children[i];
          if (
            child.type !== 'switch_conditional' &&
            child.type !== 'switch_default'
          ) {
            this.error(
              file.name,
              node.id,
              `Switch node ${node.id} has invalid child.\n CONTENT ${node.content}`
            );
            return null;
          }
          const children2 = file.getChildren(child);
          const child2 = children2[0];
          if (!child2) {
            this.error(
              file.name,
              child.id,
              `Switch child ${child.id} has no children.\n CONTENT ${child.content}`
            );
            return null;
          }
          const content =
            child.content === 'default'
              ? 'true'
              : child.content.trim().replace(/\n/g, ' ');
          if (content.indexOf(';') > -1) {
            this.error(
              file.name,
              node.id,
              `Switch child ${child.id} has invalid conditional with ';'.\n CONTENT ${child.content}`
            );
            return null;
          }
          ret += `    ${Number(i) === 0 ? 'if' : 'else if'}(${escapeQuotes(
            content
          )})\n        scope.${child2.id}();\n`;
          nodes_to_compile.push(child2);
        }
        ret += '}';
        let is_invalid = false;
        for (let i in nodes_to_compile) {
          const node = nodes_to_compile[i];
          const r = this.compileNode(node, file);
          if (r !== null) {
            ret += '\n' + r;
          } else {
            is_invalid = true;
          }
        }
        if (is_invalid) {
          return null;
        } else {
          return ret;
        }
      },
      pass_fail: (node, file) => {
        const children = file.getChildren(node);
        if (children.length !== 2) {
          this.error(
            file.name,
            node.id,
            `PassFail node ${node.id} has incorrect children amount.\n CONTENT ${node.content}`
          );
          return null;
        }
        let ret =
          `// ${node.type}\n` +
          `scope.${node.id} = function() {\n` +
          `    player.set(CURRENT_NODE_VAR, '${node.id}');\n` +
          `    var condition = (function() { return ${escapeQuotes(
            node.content
          )} })();\n` +
          ``;
        try {
          let evaluationFailure = _eval_content(node.content);
          if (evaluationFailure) {
            throw new Error(evaluationFailure.slice(5));
          }
        } catch (e) {
          this.error(
            file.name,
            node.id,
            'PassFail node content could not be evaluated. ' +
              e +
              `\n CONTENT ${node.content}`
          );
          return null;
        }
        for (let i in children) {
          const child = children[i];
          const children2 = file.getChildren(child);
          if (children2.length === 0) {
            this.error(
              file.name,
              child.id,
              `PassFail node ${node.id} text child ${child.type} has no child.\n CONTENT ${node.content}`
            );
            return null;
          } else if (children2.length > 1) {
            this.error(
              file.name,
              child.id,
              `PassFail node ${node.id} text child ${child.type} has multiple children.\n CONTENT ${node.content}`
            );
            return null;
          }
          const child2 = children2[0];
          if (child.type === 'pass_text') {
            ret +=
              `    if(condition){\n` +
              `        player.set(CURRENT_NODE_VAR, '${child.id}');\n` +
              `        scope.${child2.id}()` +
              // `        var text = ${QUOTE}${child.content}${QUOTE};\n` +
              // `        core.say(text, scope.${child2.id});\n` +
              `    }\n`;
          } else if (child.type === 'fail_text') {
            ret +=
              `    if(!condition){\n` +
              `        player.set(CURRENT_NODE_VAR, '${child.id}');\n` +
              `        scope.${child2.id}()` +
              // `        var text = ${QUOTE}${child.content}${QUOTE};\n` +
              // `        core.say(text, scope.${child2.id});\n` +
              `    }\n`;
          }
        }
        ret += '};';
        for (let i in children) {
          const children2 = file.getChildren(children[i]);
          const child2 = children2[0];
          ret += '\n' + this.compileNode(child2, file);
        }
        return ret;
      },
      action: (node, file) => {
        const children = file.getChildren(node);
        if (children.length === 0) {
          this.error(
            file.name,
            node.id,
            `Action node ${node.id} has no child.\n CONTENT ${node.content}`
          );
          return null;
        } else if (children.length > 1) {
          this.error(
            file.name,
            node.id,
            `Action node ${node.id} has multiple children.\n CONTENT ${node.content}`
          );
          return null;
        } else {
          const child = children[0];
          const ret = _create_action_node(node.content, node.id, child.id);
          if (ret.slice(0, 5) === 'error') {
            this.error(
              file.name,
              node.id,
              'Action node content could not be evaluated. ' +
                ret.slice(5) +
                `\n CONTENT ${node.content}`
            );
            return null;
          }
          return ret + '\n' + this.compileNode(child, file);
        }
      },
      picture: (node, file) => {
        const children = file.getChildren(node);
        if (children.length === 0) {
          this.error(
            file.name,
            node.id,
            `Picture node ${node.id} has no child.\n CONTENT ${node.content}`
          );
          return null;
        } else if (children.length > 1) {
          this.error(
            file.name,
            node.id,
            `Picture node ${node.id} has multiple children.\n CONTENT ${node.content}`
          );
          return null;
        } else {
          const child = children[0];
          const ret =
            `// ${node.type}\n` +
            `scope.${node.id} = function() {\n` +
            `    core.picture( ${QUOTE}${node.content}${QUOTE} );\n` +
            `    scope.${child.id}();\n` +
            `};\n`;
          return ret + '\n' + this.compileNode(child, file);
        }
      },
      chunk: (node, file) => {
        const children = file.getChildren(node);
        if (children.length === 0) {
          this.error(
            file.name,
            node.id,
            `Chunk node ${node.id} has no child.\n CONTENT ${node.content}`
          );
          return null;
        } else if (children.length > 1) {
          this.error(
            file.name,
            node.id,
            `Chunk node ${node.id} has multiple children.\n CONTENT ${node.content}`
          );
          return null;
        } else {
          const content_list = node.content.split(/\n/g);
          let is_error = false;

          const node_list = content_list.map((content, i) => {
            const id = node.id + '_' + i;
            const child_id = node.id + '_' + (i + 1);
            let local_node;
            if (content[0] === '+' || content.length === 0) {
              local_node = _create_action_node(content.slice(1), id, child_id);
            } else {
              local_node = _create_text_node(content, id, child_id);
            }

            if (local_node.slice(0, 5) === 'error') {
              console.log('CONTENT', content);
              this.error(
                file.name,
                node.id,
                `Chunk node content could not be evaluated. LINE ${i + 1} ` +
                  local_node.slice(5) +
                  `\n CONTENT ${node.content}`
              );
              is_error = true;
              return null;
            }
            return local_node;
          });

          if (is_error) {
            return null;
          }

          const child = children[0];
          const first_ret =
            `// ${node.type} FIRST\n` +
            `scope.${node.id} = function() {\n` +
            `    scope.${node.id + '_0'}();\n` +
            `};\n`;
          const last_ret =
            `// ${node.type} LAST\n` +
            `scope.${node.id + '_' + node_list.length} = function() {\n` +
            `    scope.${child.id}();\n` +
            `};\n`;
          return (
            first_ret +
            node_list.join('\n') +
            last_ret +
            this.compileNode(child, file)
          );
        }
      },
      trigger: (node, file) => {
        const children = file.getChildren(node);
        if (children.length === 0) {
          this.error(
            file.name,
            node.id,
            `Trigger node ${node.id} has no child.\n CONTENT ${node.content}`
          );
          return null;
        } else if (children.length > 1) {
          this.error(
            file.name,
            node.id,
            `Trigger node ${node.id} has multiple children.\n CONTENT ${node.content}`
          );
          return null;
        } else {
          const child = children[0];
          const spl = node.content.split(',');
          const trigger_name = spl[0];
          let trigger_val = spl[1] || 'true';
          if (typeof trigger_val === 'string') {
            trigger_val = trigger_val.trim();
          }
          const ret = _create_action_node(
            `player.set( "${trigger_name}", ${trigger_val} )`,
            node.id,
            child.id
          );
          if (ret.slice(0, 5) === 'error') {
            this.error(
              file.name,
              node.id,
              'Trigger node content could not be evaluated. ' +
                ret.slice(5) +
                `\n CONTENT ${node.content}`
            );
            return null;
          }
          return ret + '\n' + this.compileNode(child, file);
        }
      },
      // this is broken
      defer: (node, file) => {
        const children = file.getChildren(node);
        if (children.length === 0) {
          this.error(
            file.name,
            node.id,
            `Defer node ${node.id} has no child.\n CONTENT ${node.content}`
          );
          return null;
        } else if (children.length > 1) {
          this.error(
            file.name,
            node.id,
            `Defer node ${node.id} has multiple children.\n CONTENT ${node.content}`
          );
          return null;
        } else {
          const child = children[0];
          const ret =
            `// defer\n` +
            `scope.${node.id} = async () => {\n` +
            `    player.set(CURRENT_NODE_VAR, '${node.id}');\n` +
            `    await core.defer(${node.content});\n` +
            `    scope.${child.id}();\n` +
            `};\n`;
          return ret + '\n' + this.compileNode(child, file);
        }
      },
      declaration: (node, file) => {
        const children = file.getChildren(node);
        if (children.length === 0) {
          this.error(
            file.name,
            node.id,
            `Declaration node ${node.id} has no child.\n CONTENT ${node.content}`
          );
          return null;
        } else if (children.length > 1) {
          this.error(
            file.name,
            node.id,
            `Declaration node ${node.id} has multiple children.\n CONTENT ${node.content}`
          );
          return null;
        } else {
          const child = children[0];
          const lines = node.content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) {
              continue;
            }
            const [first, second] = line.split('=');
            if (!first) {
              continue;
            }
            if (!second) {
              this.error(
                file.name,
                node.id,
                `Declaration node ${node.id} could not be parsed, no '=' found.\n CONTENT ${node.content}`
              );
              return null;
            }
            globalDeclarations[first.trim().replace(/;/g, '')] = second
              .trim()
              .replace(/;/g, '');
          }
          const ret = _create_action_node(``, node.id, child.id);
          if (ret.slice(0, 5) === 'error') {
            this.error(
              file.name,
              node.id,
              'Declaration node content could not be evaluated. ' +
                ret.slice(5) +
                `\n CONTENT ${node.content}`
            );
            return null;
          }
          return ret + '\n' + this.compileNode(child, file);
        }
      },
      next_file: node => {
        this.files_to_verify.push(node.content);
        let ret =
          `// ${node.type}\n` +
          `scope.${node.id} = function() {\n` +
          `    var key = ${QUOTE}${escapeQuotes(node.content)}${QUOTE};\n` +
          `    var func = files[key];\n` +
          `    if (!func){ func = files[player.get(key)]; }\n` +
          `    player.set(LAST_FILE_VAR, player.get(CURRENT_FILE_VAR));\n` +
          `    var nodeId = player.get('NEXT_NODE_ID');\n` +
          `    if(func) {\n` +
          `        player.set('NEXT_NODE_ID', null);\n` +
          `        func(nodeId);\n}`;
        if (includeDebugStatements) {
          ret +=
            `    else {\n` +
            "        core.say(`EXECUTION WARNING, no file exists named '${key}' or player.get('${key}') ('${player.get(key)}'). You are probably running a subset of all the files and not the whole scenario. ` + Object.keys(files), files.exit);\n" + //eslint-disable-line
            `    }\n`;
        } else {
          ret +=
            `    else {\n` +
            '        core.exit();\n' + //eslint-disable-line
            `    }\n`;
        }
        ret += `};\n\n`;
        return ret;
      },
    };
    this.typeFuncs.choice_text = this.typeFuncs.text;
  }

  //header for output file (not individual compiled files)
  getHeader(isExport) {
    return `//@ts-nocheck
    /**
    * IN2 Logic Tree File
    *
    * This file has been generated by an IN2 compiler.
    */\n/* */${
      isExport ? 'export' : ''
    } function run(isDryRun){\n/* global player, core, engine */
var files = {};
var scope = {};
var CURRENT_NODE_VAR = '${CURRENT_NODE_VAR}';
var CURRENT_FILE_VAR = '${CURRENT_FILE_VAR}';
var LAST_FILE_VAR = '${LAST_FILE_VAR}';
player.set('scope', scope);`;
  }
  //footer for entire file (not individual compiled files)
  getFooter(mainFileName) {
    const ret =
      `files.exit = function() {\n` +
      `  core.exit();\n` +
      `};\n` +
      `if (!isDryRun){ files['${mainFileName}'](); }\n` +
      `return { files, scope }\n` +
      `}`;
    return ret;
  }

  error(filename, node_id, text) {
    this.has_error[filename] = true;
    this.errors.push(filename + '|' + node_id + '|' + text);
  }

  hasError(filename) {
    return this.has_error[filename];
  }

  readAndCompile(filename, cb) {
    fs.readFile(filename, (err, data) => {
      if (err) {
        this.error(filename, null, 'Cannot read file. \n\n' + err);
        return cb(this.errors);
      } else {
        let json = null;
        try {
          json = JSON.parse(data.toString());
        } catch (e) {
          this.error(filename, null, 'Cannot parse json in file. \n\n' + e);
          return cb(this.errors);
        }
        globalDeclarations = {};
        const file = new File(json);
        const ret = this.compileFile(file);
        if (this.errors.length) {
          cb(ret, file);
        } else {
          cb(ret, file);
        }
      }
    });
  }

  compileFile(file) {
    const root = file.getRoot();
    if (root === null) {
      this.error(file.name, null, 'File has no root!');
      return null;
    }

    let text = this.compileNode(root, file);

    const roots = file.getSubRoots();
    let subText = '';
    if (roots.length) {
      for (let i in roots) {
        subText += this.compileNode(roots[i], file);
      }
      subText += '\n';
    }
    const { innerContent: innerInnerContent, declContent: innerDeclContent } =
      _replace_declarations(text + '\n' + subText, globalDeclarations);
    return innerInnerContent;
  }

  compileNode(node, file) {
    if (this.already_compiled[node.id]) {
      return '';
    }
    if (this.typeFuncs[node.type]) {
      this.already_compiled[node.id] = true;
      return this.typeFuncs[node.type](node, file);
    } else {
      this.error(
        file.name,
        node.id,
        `Node ${node.id} has an invalid type: ${node.type}. \n\n CONTENT: ${node.content}`
      );
      return null;
    }
  }
}

const output_result = function (result, output_url) {
  fs.writeFile(__dirname + '/' + output_url, result, err => {
    if (err) {
      console.error('Error writing output ' + output_url, err);
    } else {
      console.log('Output written: ' + output_url);
    }
  });
};

const output_errors = function (errors) {
  console.log('-------------');
  errors.forEach((err, i) => {
    console.log(' ' + err);
    if (i !== errors.length - 1) {
      console.log();
    }
  });
  console.log('-------------');
  console.log();
};

//the first file listed in "input_files" will be the entrypoint for the program
const compile = function (inputFiles, outputUrls, isExport) {
  let numStarted = 0;
  let numFinished = 0;
  const c = new Compiler();
  let aggregatedResult = c.getHeader(isExport);
  let mainFileName = '';
  const failed_files = [];
  inputFiles.forEach((filename, i) => {
    if (i === 0) {
      mainFileName = filename.split('/').slice(-1)[0];
    }
  });

  inputFiles.forEach(filename => {
    numStarted++;
    c.readAndCompile(filename, (result, file) => {
      numFinished++;
      if (file) {
        if (result && !c.hasError(file.name)) {
          aggregatedResult += '\n\n' + result;
        } else {
          failed_files.push(file.name);
        }
      }
      if (numStarted === numFinished) {
        if (c.errors.length) {
          output_errors(c.errors);
          console.log(
            `Failed. Could not compile ${failed_files.length} of ${inputFiles.length} files:`
          );
          for (let j in failed_files) {
            console.log(' ' + failed_files[j]);
          }
        }
        aggregatedResult = aggregatedResult + c.getFooter(mainFileName);
        try {
          aggregatedResult = prettier.format(aggregatedResult, {
            semi: true,
            parser: 'babel',
            singleQuote: true,
            trailingComma: 'es5',
            arrowParens: 'avoid',
          });
        } catch (e) {
          console.log('PRETTIER FAILURE', e);
          c.error('(unset)', '(unset)', 'Output file has invalid syntax.');
          output_errors(c.errors);
          for (let j in failed_files) {
            console.log(' ' + failed_files[j]);
          }
        }
        console.log();
        outputUrls.forEach(outputUrl => {
          output_result(aggregatedResult, outputUrl);
        });
      }
    });
  });
};

const argv = require('minimist')(process.argv.slice(2));

if (argv.d) {
  includeDebugStatements = false;
}

if (argv.file) {
  console.log('Compiling ' + argv.file + '...');
  compile(
    [__dirname + '/../save/' + argv.file],
    ['/out/' + argv.file + '.compiled.js'],
    argv.export
  );
} else if (argv.files) {
  console.log('Compiling ' + argv.files + '...');
  const filelist = argv.files.split(',').map(filename => {
    return __dirname + '/../save/' + filename;
  });
  compile(filelist, ['main.compiled.js', 'out/main.compiled.js'], argv.export);
} else {
  fs.readdir(__dirname + '/../save', (err, dirs) => {
    dirs = dirs
      .filter(dir => {
        if (
          dir === 'DONT_DELETE' ||
          dir.indexOf('loader.js') > -1 ||
          dir.slice(-4) === '.zip'
        ) {
          return false;
        }
        if (fs.statSync(__dirname + '/../save/' + dir).isDirectory()) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a === 'main.json') {
          return -1;
        } else if (b === 'main.json') {
          return 1;
        } else {
          return a > b ? -1 : 1;
        }
      })
      .map(dir => {
        return __dirname + '/../save/' + dir;
      });
    console.log('Compiling...');
    for (let i in dirs) {
      console.log(' ' + dirs[i]);
    }
    console.log();
    compile(dirs, ['main.compiled.js', 'out/main.compiled.js'], argv.export);
  });
}
