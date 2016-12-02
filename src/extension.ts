'use strict';

import * as vsc from 'vscode';
import * as pkg from 'meta-pkg';
import { MODES } from './modes';
import Formatter from './formatter';

export function activate(context: vsc.ExtensionContext) {
    let choices: string[] = [];
    let installerChoices = {};
    let message: vsc.Disposable;
    let uncrustify = {
        targets: ['uncrustify'],
        backends: {
            packagekit: ['uncrustify'],
            brew: 'uncrustify'
        }
    };

    pkg.isInstalled(uncrustify)
        .then((installed) => !installed && pkg.getInstallers(uncrustify)
            .then((installers) => {
                if (installers.length) {
                    installers.forEach((installer) => {
                        let choice = 'Install using ' + installer.name;
                        choices.push(choice);
                        installerChoices[choice] = installer;
                    });

                    return vsc.window.showWarningMessage('Uncrustify does not seem to be installed', ...choices);
                }
            }))
        .then((choice) => {
            if (choice) {
                message = vsc.window.setStatusBarMessage('Installing uncrustify...');
                return installerChoices[choice].install();
            }
        })
        .then((result) => {
            if (result) {
                message.dispose();
                vsc.window.showInformationMessage('Uncrustify is now installed');
            }
        });

    let subscribtion = vsc.languages.registerDocumentFormattingEditProvider(MODES, new Formatter());
    context.subscriptions.push(subscribtion);
};

export function deactivate() { };