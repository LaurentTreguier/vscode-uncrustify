import * as fs from 'fs-extra';
import * as path from 'path';
import * as cp from 'child_process';
import * as vsc from 'vscode';
import * as req from 'request';
import * as pkg from 'meta-pkg';
import * as logger from './logger';
import * as util from './util';
import Formatter from './formatter';
import Configurator from './configurator';

let extContext: vsc.ExtensionContext;

export function activate(context: vsc.ExtensionContext) {
    logger.dbg('extension started');
    extContext = context;

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
                win32: {
                    source: 'http://downloads.sourceforge.net/project/uncrustify/uncrustify/uncrustify-%VERSION%/uncrustify-%VERSION%-win32.zip',
                    version: {
                        feed: 'https://sourceforge.net/projects/uncrustify/rss?path=/',
                        regexp: /uncrustify\/uncrustify-([\d.]+)\/uncrustify-\1-win32\.zip/
                    },
                    bin: '.'
                }
            }
        }
    };

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

                return <PromiseLike<string>>vsc.window.showWarningMessage(message, ...choices).then((choice) => choice);
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

    let formatter = new Formatter();
    context.subscriptions.push(vsc.languages.registerDocumentFormattingEditProvider(util.MODES, formatter));
    context.subscriptions.push(vsc.languages.registerDocumentRangeFormattingEditProvider(util.MODES, formatter));
    logger.dbg('registered formatter');

    let configurationSub = vsc.workspace.registerTextDocumentContentProvider('uncrustify', new Configurator());
    context.subscriptions.push(configurationSub);

    vsc.commands.registerCommand('uncrustify.create', () => {
        logger.dbg('command: create');

        if (!vsc.workspace.workspaceFolders || !vsc.workspace.workspaceFolders.length) {
            return vsc.window.showWarningMessage('No folder is open');
        }

        let output = '';
        let error = new Error('Configuration file already exists');

        return fs.access(util.configPath(), fs.constants.F_OK)
            .then(() => vsc.window.showWarningMessage('Configuration file already exists', 'Overwrite')
                .then((choice) => {
                    if (choice !== 'Overwrite') {
                        throw error;
                    }
                })
            ).catch((e) => {
                if (e === error) {
                    throw e;
                } else {
                    return fs.ensureFile(util.configPath());
                }
            })
            .then(() => new Promise((resolve) =>
                cp.spawn('uncrustify', ['-c', util.configPath(), '--update-config-with-doc'])
                    .stdout
                    .on('data', (data) => output += data.toString())
                    .on('end', () => resolve(output.replace(/\?\?\?:.*/g, '')))
            )).then((config) => fs.writeFile(util.configPath(), config))
            .catch((reason) => logger.dbg(reason));
    });

    vsc.commands.registerCommand('uncrustify.open', () =>
        vsc.commands.executeCommand('vscode.open', vsc.Uri.file(util.configPath())));

    vsc.commands.registerCommand('uncrustify.save', (config) => {
        logger.dbg('command: save');

        if (!config) {
            logger.dbg('error saving config: no config passed');
            return;
        }

        return new Promise((resolve, reject) => fs.readFile(util.configPath(), (err, data) => {
            if (err) {
                reject(err);
            }

            resolve(data);
        })).then((data) => {
            let result = data.toString();

            for (let key in config) {
                result = result.replace(new RegExp(`^(${key}\\s*=\\s*)\\S+(.*)`, 'm'), `$1${config[key]}$2`);
            }

            return result;
        }).then((result) => new Promise((resolve, reject) => fs.writeFile(util.configPath(), result, (err) => {
            if (err) {
                reject(err);
            }

            resolve();

            logger.dbg('saved config file');
        }))).catch((reason) => logger.dbg('error saving config file: ' + reason));
    });

    vsc.commands.registerCommand('uncrustify.savePreset', (config, name) => {
        logger.dbg('command: savePreset');

        if (!config) {
            logger.dbg('error saving preset: no config passed');
            return;
        }

        let promise = name !== undefined
            ? Promise.resolve(name)
            : vsc.window.showInputBox({ placeHolder: 'Name of the preset' });

        return promise.then((chosenName) => {
            if (!chosenName && name === undefined) {
                vsc.window.showErrorMessage('Name can\'t be empty !');
                throw new Error('Name is empty');
            }

            let presets = extContext.globalState.get('presets', {});
            presets[chosenName] = config;

            logger.dbg('saved preset ' + chosenName);

            return extContext.globalState.update('presets', presets)
        }).then(() => (name === undefined) && vsc.window.showInformationMessage('Preset saved !'));
    });

    presetCommand('loadPreset', (presets, name, internal) => {
        logger.dbg('command: loadPreset');

        if (!presets || (!name && name !== '')) {
            logger.dbg('error loading presets');
            return;
        }

        return vsc.commands.executeCommand('uncrustify.create')
            .then(() => vsc.commands.executeCommand('uncrustify.save', presets[name]))
            .then(() => {
                Configurator.oldConfig = presets[name];

                if (!internal) {
                    vsc.window.showInformationMessage('Preset loaded !');
                }
            });
    });

    presetCommand('deletePreset', (presets, name, internal) => {
        logger.dbg('command: deletePreset');

        if (!presets || (!name && name !== '')) {
            logger.dbg('error loading presets');
            return;
        }

        delete presets[name];
        return extContext.globalState.update('presets', presets)
            .then(() => !internal && vsc.window.showInformationMessage('Preset deleted !'));
    });

    vsc.commands.registerCommand('uncrustify.upgrade', (config) => {
        logger.dbg('command: upgrade');

        if (!config) {
            logger.dbg('error upgrading config: no config passed');
            return;
        }

        return vsc.commands.executeCommand('uncrustify.savePreset', config, '')
            .then(() => vsc.commands.executeCommand('uncrustify.loadPreset', ''))
            .then(() => vsc.commands.executeCommand('uncrustify.deletePreset', ''))
            .then(() => vsc.commands.executeCommand('vscode.open', vsc.Uri.file(util.configPath())));
    });

    if (vsc.workspace.getConfiguration('uncrustify').get('graphicalConfig')) {
        function graphicalEdit(doc: vsc.TextDocument) {
            if (doc.uri.scheme === 'file' && doc.fileName === util.configPath()) {
                logger.dbg('launching graphical editor');

                vsc.commands.executeCommand('workbench.action.closeActiveEditor')
                    .then(() => vsc.commands.executeCommand('vscode.previewHtml',
                        util.configUri(), undefined, 'Uncrustify configuration'));
            }
        }

        vsc.workspace.onDidOpenTextDocument(graphicalEdit);

        if (vsc.window.activeTextEditor) {
            graphicalEdit(vsc.window.activeTextEditor.document);
        }
    }
};

export function deactivate() { };

export { extContext };

function presetCommand(commandName: string, callback: (presets: any, name: string, internal: boolean) => any) {
    vsc.commands.registerCommand('uncrustify.' + commandName, (name) => {
        logger.dbg('command: ' + commandName);

        let presets = extContext.globalState.get('presets', {});
        let names: string[] = [];

        for (let name in presets) {
            names.push(name);
        }

        if (names.length === 0) {
            vsc.window.showErrorMessage('No presets saved');
            return;
        }

        let promise = name !== undefined
            ? Promise.resolve(name)
            : vsc.window.showQuickPick(names);

        return promise.then((chosenName) => {
            if (!chosenName && name === undefined) {
                throw new Error('No preset selected');
            }

            return callback(presets, chosenName, name !== undefined);
        });
    });
}
