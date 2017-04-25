'use strict';

import * as vsc from 'vscode';

let output: vsc.OutputChannel = vsc.window.createOutputChannel('Uncrustify');

export function show() {
    output.show(true);
};

export function hide() {
    output.hide();
};

export function log(msg: string, line = true) {
    if (line) {
        output.appendLine(msg);
    } else {
        output.append(msg);
    }
};

export function dbg(msg: string, line = true) {
    if (vsc.workspace.getConfiguration().get('uncrustify.debug', false)) {
        let dmsg = 'Debug: ' + msg;

        if (line) {
            output.appendLine(dmsg);
        } else {
            output.append(dmsg);
        }
    }
};
