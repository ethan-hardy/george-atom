'use babel';

import { CompositeDisposable } from 'atom';
import request from 'request';

function askGeorge(text) {
  return new Promise(function(resolve, reject) {
    const url = 'https://www.student.cs.uwaterloo.ca/~se212/george/ask-george/george.cgi'
    request.post({
      url: url,
      form: {
        'input_script': text,
        'check': 'Ask George',
        'filename': '',
        'download': '',
        'download_file_name': '',
        'uwid': '',
        'bug': ''
      }
    }, (err, res, body) => {
      if (err || !body || !body.match) {
        reject(typeof err === 'string' ? err : 'Error getting george feedback');
        return;
      }
      const match = body.match(/(\+-\+-\+-\+-\+-\+-\+-\+[\s\S]*?)<\/textarea>/);
      if (!match || !match[1]) {
        reject(typeof err === 'string' ? err : 'Error getting george feedback');
      } else {
        resolve(match[1]);
      }
    });
  });
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

export default {
  subscriptions: null,

  activate(state) {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'george-atom:ask-george': () => this.showGeorgeOutput()
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
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
