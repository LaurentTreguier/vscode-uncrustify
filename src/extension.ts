'use strict';

import * as vsc from 'vscode';
import * as pkg from 'meta-pkg';
import { MODES } from './modes';
import Formatter from './formatter';

export function activate(context: vsc.ExtensionContext) {
    let message = 'Uncrustify does not seem to be installed';
    let choices: string[] = [];
    let installerChoices = {};
    let output: vsc.OutputChannel;
    let uncrustify: pkg.Package = {
        targets: ['uncrustify'],
        backends: {
            packagekit: 'uncrustify',
            brew: 'uncrustify',
            fallback: {
                name: 'uncrustify',
                win32: {
                    source: 'http://downloads.sourceforge.net/project/uncrustify/uncrustify/uncrustify-%VERSION%/uncrustify-%VERSION%-win32.zip',
                    version: {
                        feed: 'https://sourceforge.net/projects/uncrustify/rss?path=/',
                        regexp: /uncrustify\/uncrustify-([\d.]+)\/uncrustify-\1-win32\.zip/
                    },
                    bin: 'uncrustify.exe'
                }
            }
        }
    };

    pkg.isInstalled(uncrustify)
        .then((installed) => {
            return installed
                ? pkg.isUpgradable(uncrustify).then((upgradable) => {
                    message = 'Uncrustify can be upgraded';
                    return upgradable;
                })
                : Promise.resolve(!installed);
        }).then((shouldInstall) =>
            shouldInstall ? pkg.getInstallers(uncrustify) : null
        ).then((installers) => {
            if (installers && installers.length) {
                installers.forEach((installer) => {
                    let choice = 'Install using ' + installer.name;
                    choices.push(choice);
                    installerChoices[choice] = installer;
                });

                return vsc.window.showWarningMessage(message, ...choices);
            }
        }).then((choice) => {
            if (choice) {
                output = vsc.window.createOutputChannel('Uncrustify');
                output.show(true);
                return installerChoices[choice].install(output.append.bind(output));
            }
        }).then((alreadyInstalled) => {
            if (output) {
                output.hide();
            }

            if (!alreadyInstalled) {
                vsc.window.showInformationMessage('Uncrustify installed successfully');
            }
        });

    let subscribtion = vsc.languages.registerDocumentFormattingEditProvider(MODES, new Formatter());
    context.subscriptions.push(subscribtion);
}

export function deactivate() { }