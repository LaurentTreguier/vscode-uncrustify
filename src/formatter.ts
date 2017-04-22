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
            let path = conf.get<string>('uncrustify.configPath');

            try {
                if (path) {
                    path = path.replace(/(%\w+%)|(\$\w+)/, (variable) => {
                        let end = variable.startsWith('%') ? 2 : 1;
                        return process.env[variable.substr(1, variable.length - end)];
                    });
                }

                fs.accessSync(path.toString());
            } catch (err) {
                vsc.window.showErrorMessage('The uncrustify config file path is incorrect: ' + path);
                reject();
                return;
            }

            let output = '';
            let uncrustify = cp.spawn(conf.get('uncrustify.executablePath', 'uncrustify'), [
                '-l', languageMap[document.languageId],
                '-c', path
            ]);

            uncrustify.on('error', reject);
            uncrustify.on('exit', (code) => {
                if (code !== 0) {
                    vsc.window.showErrorMessage('Uncrustify exited with error code ' + code);
                    reject();
                }
            });

            uncrustify.stdout.on('data', (data) => output += data);
            uncrustify.stdout.on('close', () => {
                let lastLine = document.lineCount - 1;
                let lastCol = document.lineAt(lastLine).text.length;
                let range = new vsc.Range(0, 0, lastLine, lastCol);

                resolve([new vsc.TextEdit(range, output)]);
            });

            uncrustify.stdin.write(document.getText());
            uncrustify.stdin.end();
        });
    }
};

const languageMap = {
    'apex': 'JAVA',
    'c': 'C',
    'cpp': 'CPP',
    'csharp': 'CS',
    'd': 'D',
    'java': 'JAVA',
    'objective-c': 'OC',
    'pawn': 'PAWN',
    'vala': 'VALA'
};
