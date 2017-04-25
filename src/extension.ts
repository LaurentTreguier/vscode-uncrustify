'use strict';

import * as vsc from 'vscode';
import * as pkg from 'meta-pkg';
import * as logger from './logger';
import { MODES } from './modes';
import Formatter from './formatter';

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
                    .install((a) => logger.log(a, false))
                    .then((alreadyInstalled) => !alreadyInstalled);
            }
        }).then((didIntall) => {
            if (didIntall) {
                logger.dbg('uncrustify installed');
                vsc.window.showInformationMessage('Uncrustify installed successfully');
            }
        });

    let subscribtion = vsc.languages.registerDocumentFormattingEditProvider(MODES, new Formatter());
    context.subscriptions.push(subscribtion);
    logger.dbg('registered formatter');
};

export function deactivate() { };
