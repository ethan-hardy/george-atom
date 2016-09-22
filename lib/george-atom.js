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
      const match = body.match ?
        body.match(/(\+-\+-\+-\+-\+-\+-\+-\+[\s\S]*?)<\/textarea>/) : null;
      if (err || !match || !match[1]) {
        reject(err || 'Error getting george feedback');
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
      atom.notifications.addInfo(feedback, {dismissable: true});
    }).catch((e) => {
      askingMessage.dismiss();
      atom.notifications.addError(e);
    });
  }
};
