import * as fs from 'fs'
import * as path from 'path'
import * as cp from 'child_process'
import * as vsc from 'vscode';
import * as logger from './logger';
import * as util from './util';

export default class Formatter implements vsc.DocumentFormattingEditProvider {
    public provideDocumentFormattingEdits(
        document: vsc.TextDocument,
        options: vsc.FormattingOptions,
        token: vsc.CancellationToken
    ): Thenable<vsc.TextEdit[]> {
        return new Promise((resolve, reject) => {
            token.onCancellationRequested(reject);

            let configPath = util.configPath();

            logger.dbg('config file: ' + configPath);

            try {
                if (configPath) {
                    configPath = configPath.replace(/(%\w+%)|(\$\w+)/, (variable) => {
                        let end = variable.startsWith('%') ? 2 : 1;
                        return process.env[variable.substr(1, variable.length - end)];
                    });
                }

                fs.accessSync(configPath);
            } catch (err) {
                logger.dbg('error accessing config file: ' + err);
                vsc.window.showErrorMessage('The uncrustify config file path is incorrect: ' + configPath);
                reject();
                return;
            }

            let uncrustifyExecutable = vsc.workspace.getConfiguration('uncrustify').get('executablePath', 'uncrustify');
            let args = ['-l', languageMap[document.languageId], '-c', configPath];
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
            uncrustify.stderr.on('close', () => logger.dbg('uncrustify exited with error: ' + error));

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
