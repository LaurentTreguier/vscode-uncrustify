import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import * as vsc from 'vscode';
import * as req from 'request';
import * as pkg from 'meta-pkg';
import * as logger from './logger';
import { MODES } from './modes';
import Formatter from './formatter';
import Configurator from './configurator';

const address = 'https://raw.githubusercontent.com/uncrustify/uncrustify/uncrustify-%VERSION%/documentation/htdocs/default.cfg';

export function activate(context: vsc.ExtensionContext) {
    let message = 'Uncrustify does not seem to be installed';
    let choices: string[] = [];
    let installerChoices = {};
    let uncrustify: pkg.Package = {
        name: 'uncrustify',
        targets: ['uncrustify'],
        backends: {
            packagekit: 'uncrustify',
            brew: 'uncrustify',
            fallback: {
                version: {
                    feed: 'https://sourceforge.net/projects/uncrustify/rss?path=/',
                    regexp: /uncrustify\/uncrustify-([\d.]+)\/uncrustify-\1-win32\.zip/
                },
                win32: {
                    source: 'http://downloads.sourceforge.net/project/uncrustify/uncrustify/uncrustify-%VERSION%/uncrustify-%VERSION%-win32.zip',
                    bin: '.'
                }
            }
        }
    };

    logger.dbg('extension started');

    pkg.isInstalled(uncrustify)
        .then((installed) => {
            logger.dbg('uncrustify installed: ' + installed);
            return installed
                ? pkg.isUpgradable(uncrustify).then((upgradable) => {
                    message = 'Uncrustify can be upgraded';
                    return upgradable;
                })
                : Promise.resolve(!installed);
        }).then((shouldInstall) => {
            logger.dbg('should uncrustify be installed: ' + shouldInstall);
            return shouldInstall ? pkg.getInstallers(uncrustify) : null;
        }).then((installers) => {
            logger.dbg('installers found: ' + (installers
                ? installers.map((i) => i.prettyName).join(', ')
                : 'none'));

            if (installers && installers.length) {
                installers.forEach((installer) => {
                    let choice = 'Install using ' + installer.prettyName;
                    choices.push(choice);
                    installerChoices[choice] = installer;
                });

                return vsc.window.showWarningMessage(message, ...choices);
            }
        }).then((choice) => {
            logger.dbg('installer choice: ' + choice);

            if (choice) {
                logger.show();
                return installerChoices[choice]
                    .install((data) => logger.log(data, false))
                    .then((alreadyInstalled) => !alreadyInstalled);
            }
        }).then((didIntall) => {
            if (didIntall) {
                logger.dbg('uncrustify installed');
                vsc.window.showInformationMessage('Uncrustify installed successfully');
            }
        });

    let formatterSub = vsc.languages.registerDocumentFormattingEditProvider(MODES, new Formatter());
    context.subscriptions.push(formatterSub);
    logger.dbg('registered formatter');

    let configurationSub = vsc.workspace.registerTextDocumentContentProvider('uncrustify', new Configurator());
    context.subscriptions.push(configurationSub);

    vsc.commands.registerCommand('uncrustify.download', () => {
        logger.dbg('command: download');

        if (!vsc.workspace.rootPath) {
            return vsc.window.showWarningMessage('No folder is open');
        }

        let output = '';
        let configPath = path.join(vsc.workspace.rootPath, 'uncrustify.cfg');

        new Promise<string>((resolve) => cp.spawn('uncrustify', ['--version'])
            .stdout
            .on('data', (data) => output += data.toString())
            .on('close', () => resolve(output.match(/([\d.]+)/)[1])))
            .then((ver) => new Promise<string>((resolve, reject) => {
                logger.dbg('uncrustify version: ' + ver);
                req.get(address.replace('%VERSION%', ver), (err, res, body) =>
                    err ? reject(err) : resolve(body));
            }
            )).then((config) => new Promise((resolve) =>
                fs.writeFile(configPath, config, () => resolve(config))))
            .then(() => vsc.workspace.getConfiguration('uncrustify').update('configPath', configPath));
    });
};

export function deactivate() { };
