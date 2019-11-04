# VSCode uncrustify

## Features

Formats your code using [uncrustify](https://github.com/uncrustify/uncrustify).
Supported languages are :
- C
- C++
- C#
- D
- Java
- Objective-C
- Pawn
- Vala

Apex, while not officially supported by uncrustify, is also supported by the extension and will be formatted as if it was Java.

## Installing uncrustify

On most Linux distributions, macOS (if brew is installed) and Windows, uncrustify can be installed by the extension automatically.

If you want or have to install it yourself :
- Linux : Uncrustify is available in most distributions as a package in the official repositories (`sudo apt/yum install uncrustify` or equivalent)
- macOS : Uncrustify is available through Homebrew (`brew install uncrustify` or see http://macappstore.org/uncrustify)
- Windows : Prebuilt binaries are available on [sourceforge](https://sourceforge.net/projects/uncrustify/files). You will need to put the executable in your `PATH` variable and you will have to update it manually

If the executable is not in the PATH environment variable, you must set its path in the settings explicitly.

## Uncrustify configuration

A default config file can automatically be created (see the [commands](#extension-commands) below).

Starting with version 2.0.0, opening the configured config file (or a file named `uncrustify.cfg` at the root of your workspace if it's not configured) will display a graphical editor to easily tweak the configuration file.

![configuration image](https://raw.githubusercontent.com/LaurentTreguier/vscode-uncrustify/master/images/screenshot.png)

The graphical editor can be disabled in the [extension settings](#extension-settings).
Uncrustify's default config file keeps its version at the top of the file; if that version differs from the version of the uncrustify executable then a button will be available to upgrade the config file to the newer version. New items will be marked as such when using the graphical editor.

![configuration upgrade image](https://raw.githubusercontent.com/LaurentTreguier/vscode-uncrustify/master/images/screenshot-upgrade.png)
![configuration new items image](https://raw.githubusercontent.com/LaurentTreguier/vscode-uncrustify/master/images/screenshot-new-items.png)

## Extension commands

* `Uncrustify: Create default config file` (`uncrustify.create`): Creates a default `uncrustify.cfg` file and puts it at the root of the current workspace.
* `Uncrustify: Open config file` (`uncrustify.open`): Opens the configuration file that is currently set in the extension settings.

## Extension settings

* `uncrustify.executablePath.[linux|osx|windows]` (`string`): Path to the uncrustify executable if it's not already in the PATH environment variable.
* `uncrustify.configPath.[linux|osx|windows]` (`string`): Path to the uncrustify configuration file. Environment variables can be used with either a Windows or a bash syntax (examples: `%SOME_PATH%/dev/uncrustify.cfg`, `$SOME_PATH/dev/uncrustify.cfg`). A relative path will be automatically prefixed with the current workspace path.
* `uncrustify.graphicalConfig` (`boolean`): Toggles the graphical config editor when opening an uncrustify config file.
* `uncrustify.debug` (`boolean`): Activates logs for debugging the extension. Logs should appear in the uncrustify output channel.
* `uncrustify.langOverrides` (`object`): Overrides the language used by uncrustify.

## Changelog

See CHANGELOG.md
