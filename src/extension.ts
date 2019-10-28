import * as fs from 'fs-extra';
import * as cp from 'child_process';
import * as vsc from 'vscode';
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
    let installerChoices = new Map<string, pkg.Installer>();
    let uncrustify: pkg.Package = {
        name: 'uncrustify',
        targets: ['uncrustify'],
        backends: {
            packagekit: 'uncrustify',
            brew: 'uncrustify',
            fallback: {
                win32: {
                    source: 'http://downloads.sourceforge.net/project/uncrustify/uncrustify/uncrustify-%VERSION%/uncrustify-%VERSION%-win64.zip',
                    version: {
                        feed: 'https://sourceforge.net/projects/uncrustify/rss?path=/',
                        regexp: /uncrustify\/uncrustify-([\d.]+)\/uncrustify-\1-win64\.zip/
                    },
                    bin: '.'
                }
            }
        }
    };

    pkg.isInstalled(uncrustify)
        .then(installed => {
            logger.dbg('uncrustify installed: ' + installed);
            return installed
                ? pkg.isUpgradable(uncrustify).then(upgradable => {
                    const noUpdates = vsc.workspace.getConfiguration('uncrustify').get('noUpdates', false);
                    message = 'Uncrustify can be upgraded';
                    return upgradable && !noUpdates;
                })
                : Promise.resolve(!installed && util.executablePath(false) === null);
        }).then(shouldInstall => {
            logger.dbg('should uncrustify be installed: ' + shouldInstall);
            return shouldInstall ? pkg.getInstallers(uncrustify) : null;
        }).then(installers => {
            logger.dbg('installers found: ' + (installers
                ? installers.map(i => i.prettyName).join(', ')
                : 'none'));

            let choices: string[] = [];

            if (installers && installers.length) {
                installers.forEach(installer => {
                    let choice = 'Install using ' + installer.prettyName;
                    choices.push(choice);
                    installerChoices.set(choice, installer);
                });

                return <PromiseLike<string>>vsc.window.showWarningMessage(message, ...choices).then((choice) => choice);
            }
        }).then(async choice => {
            logger.dbg('installer choice: ' + choice);

            if (choice) {
                logger.show();
                const alreadyInstalled = await installerChoices.get(choice)
                    .install(data => logger.log(data, false));
                return !alreadyInstalled;
            }
        }).then(didIntall => {
            if (didIntall) {
                logger.dbg('uncrustify installed');
                vsc.window.showInformationMessage('Uncrustify installed successfully');
            }
        });

    let formatter = new Formatter();
    const modes = util.modes();
    context.subscriptions.push(vsc.languages.registerDocumentFormattingEditProvider(modes, formatter));
    context.subscriptions.push(vsc.languages.registerDocumentRangeFormattingEditProvider(modes, formatter));
    context.subscriptions.push(vsc.languages.registerOnTypeFormattingEditProvider(modes, formatter, ';', '}'));
    logger.dbg('registered formatter for modes: ' + modes);

    let configurator = new Configurator();
    let configurationSub = vsc.workspace.registerTextDocumentContentProvider('uncrustify', configurator);
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
                .then(choice => {
                    if (choice !== 'Overwrite') {
                        throw error;
                    }
                })
            ).catch(e => {
                if (e === error) {
                    throw e;
                } else {
                    return fs.ensureFile(util.configPath());
                }
            })
            .then(() => new Promise(resolve =>
                cp.spawn(util.executablePath(), ['-c', util.configPath(), '--update-config-with-doc'])
                    .stdout
                    .on('data', data => output += data.toString())
                    .on('end', () => resolve(output.replace(/\?\?\?:.*/g, '')))
            )).then(config => fs.writeFile(util.configPath(), config))
            .catch(reason => logger.dbg(reason));
    });

    vsc.commands.registerCommand('uncrustify.open', () =>
        vsc.commands.executeCommand('vscode.open', vsc.Uri.file(util.configPath())));

    vsc.commands.registerCommand('uncrustify.save', async config => {
        logger.dbg('command: save');

        if (!config) {
            logger.dbg('error saving config: no config passed');
            return;
        }

        try {
            const data = await new Promise((resolve, reject) => fs.readFile(util.configPath(), (err, data) => {
                if (err) {
                    reject(err);
                }
                resolve(data);
            }));

            let result = data.toString();

            for (let key in config) {
                result = result.replace(new RegExp(`^(${key}\\s*=\\s*)\\S+(.*)`, 'm'), `$1${config[key]}$2`);
            }

            return await new Promise((resolve, reject) => fs.writeFile(util.configPath(), result, err => {
                if (err) {
                    reject(err);
                }

                resolve();
                logger.dbg('saved config file');
            }));
        }
        catch (reason) {
            return logger.dbg('error saving config file: ' + reason);
        }
    });

    vsc.commands.registerCommand('uncrustify.savePreset', async (config, name) => {
        logger.dbg('command: savePreset');

        if (!config) {
            logger.dbg('error saving preset: no config passed');
            return;
        }

        let promise: Thenable<string> = name !== undefined
            ? Promise.resolve(name)
            : vsc.window.showInputBox({ placeHolder: 'Name of the preset' });

        const chosenName = await promise;

        if (!chosenName && name === undefined) {
            vsc.window.showErrorMessage('Name can\'t be empty !');
            throw new Error('Name is empty');
        }

        let presets = extContext.globalState.get('presets', {});
        presets[chosenName] = config;
        logger.dbg('saved preset ' + chosenName);

        await extContext.globalState.update('presets', presets);
        return await ((name === undefined) && vsc.window.showInformationMessage('Preset saved !'));
    });

    presetCommand('loadPreset', async (presets, name, internal) => {
        logger.dbg('command: loadPreset');

        if (!presets || (!name && name !== '')) {
            logger.dbg('error loading presets');
            return;
        }

        await vsc.commands.executeCommand('uncrustify.create');
        await vsc.commands.executeCommand('uncrustify.save', presets[name]);
        Configurator.oldConfig = presets[name];

        if (!internal) {
            vsc.window.showInformationMessage('Preset loaded !');
        }
    });

    presetCommand('deletePreset', async (presets, name, internal) => {
        logger.dbg('command: deletePreset');

        if (!presets || (!name && name !== '')) {
            logger.dbg('error loading presets');
            return;
        }

        delete presets[name];
        await extContext.globalState.update('presets', presets);
        return await (!internal && vsc.window.showInformationMessage('Preset deleted !'));
    });

    vsc.commands.registerCommand('uncrustify.upgrade', async config => {
        logger.dbg('command: upgrade');

        if (!config) {
            logger.dbg('error upgrading config: no config passed');
            return;
        }

        await vsc.commands.executeCommand('uncrustify.savePreset', config, '');
        await vsc.commands.executeCommand('uncrustify.loadPreset', '');
        await vsc.commands.executeCommand('uncrustify.deletePreset', '');
        return await vsc.commands.executeCommand('vscode.open', vsc.Uri.file(util.configPath()));
    });

    if (vsc.workspace.getConfiguration('uncrustify').get('graphicalConfig', true)) {
        function graphicalEdit(doc: vsc.TextDocument) {
            if (doc.uri.scheme === 'file' && doc.fileName === util.configPath()) {
                logger.dbg('launching graphical editor');

                vsc.commands.executeCommand('workbench.action.closeActiveEditor')
                    .then(async () => {
                        let webviewPanel = vsc.window.createWebviewPanel(
                            'uncrustifyConfiguration',
                            'Uncrustify configuration',
                            vsc.ViewColumn.Active,
                            { enableCommandUris: true, enableScripts: true }
                        );

                        webviewPanel.webview.html = await configurator.provideTextDocumentContent(util.configUri(), null);
                    });
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
    vsc.commands.registerCommand('uncrustify.' + commandName, async name => {
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

        let promise: Thenable<string> = name !== undefined
            ? Promise.resolve(name)
            : vsc.window.showQuickPick(names);

        const chosenName = await promise;

        if (!chosenName && name === undefined) {
            throw new Error('No preset selected');
        }

        return callback(presets, chosenName, name !== undefined);
    });
}
