'use strict';

import * as fs from 'fs'
import * as cp from 'child_process'
import * as vsc from 'vscode';
import * as logger from './logger';

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

            logger.dbg('config file: ' + path);

            try {
                if (path) {
                    path = path.replace(/(%\w+%)|(\$\w+)/, (variable) => {
                        let end = variable.startsWith('%') ? 2 : 1;
                        return process.env[variable.substr(1, variable.length - end)];
                    });
                }

                fs.accessSync(path.toString());
            } catch (err) {
                logger.dbg('config file could not be accessed: ' + err);
                vsc.window.showErrorMessage('The uncrustify config file path is incorrect: ' + path);
                reject();
                return;
            }

            let uncrustifyExecutable = conf.get('uncrustify.executablePath', 'uncrustify');
            let args = ['-l', languageMap[document.languageId], '-c', path];
            let output = '';
            let error = '';
            let uncrustify = cp.spawn(uncrustifyExecutable, args);

            logger.dbg(`launched: ${uncrustifyExecutable} ${args.join(' ')}`);
            uncrustify.on('error', reject);
            uncrustify.on('exit', (code) => {
                logger.dbg('uncrustify exited with status: ' + code);

                if (code !== 0) {
                    vsc.window.showErrorMessage('Uncrustify exited with error code: ' + code);
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

            uncrustify.stderr.on('data', (data) => error += data);
            uncrustify.stderr.on('close', () => {
                logger.dbg('uncrustify exited with error: ' + error);
                if (error.length) {
                    vsc.window.showErrorMessage('Uncrustify exited with error message: ' + error);
                }
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
