'use babel';

import { CompositeDisposable } from 'atom';
import request from 'request';
import fs from 'fs';

function askGeorge(text) {
  return new Promise(function(resolve, reject) {
    const url = 'https://www.student.cs.uwaterloo.ca/~se212/george/ask-george/cgi-bin/george.cgi/check';
    request.post({
      url: url,
      headers: {
        'Content-Type': 'text/plain'
      },
      body: text
    }, (err, res, body) => {
      if (err || res.statusCode !== 200 || !body || !body.match) {
        reject(typeof err === 'string' ? err : 'Error getting george feedback ddd');
        return;
      }
      resolve(body)
    });
  });
}

function formatNumToStr(num) {
  // assuming two-digit strings
  return num > 10 ? `${num}` : `0${num}`;
}

function getTextForAssignmentAndProblem(asn, prob) {
  return new Promise(function(resolve, reject) {
    const aStr = formatNumToStr(asn), qStr = formatNumToStr(prob);
    const url = `https://www.student.cs.uwaterloo.ca/~se212/asn/a${aStr}grg/a${aStr}q${qStr}.grg`;
    request.get(url, (err, res, body) => {
      if (err || res.statusCode !== 200 || !body || typeof body !== 'string') {
        reject(typeof err === 'string' ? err : `Error getting assignment texts for assignment ${asn}`);
        return;
      }
      resolve(body);
    });
  });
}

const fileExists = function(path) {
  try {
    fs.accessSync(path, fs.constants.F_OK);
  } catch (e) {
    return false;
  }
  return true;
};

function createFileForAssignmentAndProblem(asnInfo, prob, text) {
  new Promise(function(resolve, reject) {
    const aStr = formatNumToStr(asnInfo.number), qStr = formatNumToStr(prob);
    const path = `${asnInfo.path}/a${aStr}q${qStr}.grg`;
    if (fileExists(path)) { resolve(); }
    else {
      fs.writeFile(path, text, (err) => {
        if (err) { reject(err); }
        else { resolve(); }
      });
    }
  });
}

function getCurrentAssignmentNumber() {
  const roots = atom.project.rootDirectories;
  for (const root of roots) {
    const path = root.path;
    const parts = path.split('/');
    const rootDirName = parts[parts.length - 1];
    const match = rootDirName.match(/[0-9]+/);
    if (match) { return {number: parseInt(match[0]), path}; }
  }

  return null;
}

function getEditorText() {
  const editor =  atom.workspace.getActiveTextEditor();
  if (!editor) { return null; }
  return editor.getText();
}

function addNotificationForText(text) {
  if (text.includes('+ Pass\n')) {
    atom.notifications.addSuccess(text, {dismissable: true});
  } else if (text.includes('- Failed\n')) {
    atom.notifications.addError(text, {dismissable: true});
  } else {
    atom.notifications.addInfo(text, {dismissable: true});
  }
}

function addNotificationsForResponseText(text) {
  const partsRegex = /\+-\+-\+-\+-\+-\+-\+-\+([\s\S]*?)(?=(?:\+-\+-\+-\+-\+-\+-\+-\+)|$)/g;

  let match = partsRegex.exec(text);
  while (match !== null) {
    addNotificationForText(match[1]);
    match = partsRegex.exec(text);
  }
}

function tryToAddNextProblem(asnInfo, prob) {
  return new Promise(function(resolve, reject) {
    getTextForAssignmentAndProblem(asnInfo.number, prob).then((text) => {
      createFileForAssignmentAndProblem(asnInfo, prob, text);
      tryToAddNextProblem(asnInfo, prob + 1).then(resolve);
    }).catch((err) => {
      if (prob === 1) { reject(err); }
      else { resolve(); }
    });
  });
}

export default {
  subscriptions: null,

  activate() {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'george-atom:ask-george': () => this.showGeorgeOutput(),
      'george-atom:create-files': () => this.createFiles()
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  createFiles() {
    const asnInfo = getCurrentAssignmentNumber();
    const creatingMessage = atom.notifications.addInfo('Creating Files...', {dismissable: true});
    tryToAddNextProblem(asnInfo, 1).then(() => {
      creatingMessage.dismiss();
    }).catch((err) => {
      creatingMessage.dismiss();
      atom.notifications.addError(err);
    });
  },

  showGeorgeOutput() {
    const editorText = getEditorText();
    if (!editorText) { return; }
    const askingMessage = atom.notifications.addInfo('Asking George...', {dismissable: true});
    askGeorge(editorText).then((feedback) => {
      askingMessage.dismiss();
      addNotificationsForResponseText(feedback);
    }).catch((e) => {
      askingMessage.dismiss();
      atom.notifications.addError(e);
    });
  }
};
