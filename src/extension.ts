import * as fs from 'fs';
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

    let formatterSub = vsc.languages.registerDocumentFormattingEditProvider(util.MODES, new Formatter());
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

        return new Promise<string>((resolve) => cp.spawn('uncrustify', ['--version'])
            .stdout
            .on('data', (data) => output += data.toString())
            .on('close', () => resolve(output.match(/([\d.]+)/)[1])))
            .then((ver) => new Promise<string>((resolve, reject) => {
                logger.dbg('uncrustify version: ' + ver);
                req.get(util.ADDRESS.replace('%VERSION%', ver), (err, res, body) =>
                    err ? reject(err) : resolve(body));
            })).then((config) => fs.writeFile(util.configPath(), config));
    });

    vsc.commands.registerCommand('uncrustify.save', (config) => {
        logger.dbg('command: save');

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

    vsc.commands.registerCommand('uncrustify.savePreset', (config) => {
        logger.dbg('command: savePreset');

        return vsc.window.showInputBox({ placeHolder: 'Name of the preset' })
            .then((name) => {
                if (!name) {
                    vsc.window.showErrorMessage('Name can\'t be empty !');
                    throw new Error('Name is empty');
                }

                logger.dbg('saving preset ' + name);

                let presets = extContext.globalState.get('presets', {});
                presets[name] = config;
                return extContext.globalState.update('presets', presets)
            }).then(() => vsc.window.showInformationMessage('Preset saved !'));
    });

    presetCommand('loadPreset', (presets, name) => vsc.commands.executeCommand('uncrustify.download')
        .then(() => vsc.commands.executeCommand('uncrustify.save', presets[name]))
        .then(() => vsc.window.showInformationMessage('Preset loaded !')));

    presetCommand('deletePreset', (presets, name) => {
        delete presets[name];
        extContext.globalState.update('presets', presets)
            .then(() => vsc.window.showInformationMessage('Preset deleted !'));
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

function presetCommand(commandName: string, callback: (presets: any, name: string) => any) {
    vsc.commands.registerCommand('uncrustify.' + commandName, () => {
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

        return vsc.window.showQuickPick(names)
            .then((name) => {
                if (!name) {
                    throw new Error('No preset selected');
                }

                return callback(presets, name);
            });
    });
}
