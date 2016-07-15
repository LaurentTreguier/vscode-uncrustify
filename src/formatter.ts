'use strict';

import * as fs from 'fs'
import * as cp from 'child_process'
import * as vsc from 'vscode';

export default class Formatter implements vsc.DocumentFormattingEditProvider {
    public provideDocumentFormattingEdits(
        document: vsc.TextDocument,
        options: vsc.FormattingOptions,
        token: vsc.CancellationToken
    ) {
        return new Promise((resolve, reject) => {
            token.onCancellationRequested(reject);

            let conf = vsc.workspace.getConfiguration();
            let path = conf.get('uncrustify.configPath');

            if (!path) {
                try {
                    if (process.platform !== 'win32') {
                        path = '/usr/share/uncrustify/defaults.cfg'
                        fs.accessSync(path.toString());
                    }
                } catch (err) {
                    vsc.window.showWarningMessage('Uncrustify config file path not set');
                    reject();
                    return;
                }
            }

            let output = '';
            let uncrustify = cp.spawn(conf.get('uncrustify.executablePath', 'uncrustify'), [
                '-l', languageMap[document.languageId],
                '-c', path
            ]);

            uncrustify.stdout.on('data', (data) => {
                output += data;
            });

            uncrustify.on('error', reject);
            uncrustify.on('exit', (code) => {
                if (code == 0) {
                    let lastLine = document.lineCount - 1;
                    let lastCol = document.lineAt(lastLine).text.length;
                    let range = new vsc.Range(0, 0, lastLine, lastCol);

                    resolve([new vsc.TextEdit(range, output)]);
                } else {
                    reject();
                }
            })

            uncrustify.stdin.write(document.getText());
            uncrustify.stdin.end();
        });
    }
}

const languageMap = {
    'c': 'C',
    'cpp': 'CPP',
    'cs': 'CS',
    'd': 'D',
    'java': 'JAVA',
    'objective-c': 'OC',
    'pawn': 'PAWN',
    'vala': 'VALA',
    'apex': 'APEX'
};
