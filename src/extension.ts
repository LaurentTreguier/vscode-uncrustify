'use strict';

import * as vsc from 'vscode';
import {MODES} from './modes';
import Formatter from './formatter';

export function activate(context: vsc.ExtensionContext) {
    let subscribtion = vsc.languages.registerDocumentFormattingEditProvider(MODES, new Formatter());
    context.subscriptions.push(subscribtion);
};

export function deactivate() { };