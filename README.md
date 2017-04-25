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
An uncrustify configuration file should be set, although on Linux and OS X it will try to use a default config file.
Thankfully, uncrustify comes with a few preset configurations if you don't want to spend hours making one yourself.

## Extension Settings

This extension contributes the following settings:

* `uncrustify.executablePath` (`string`): Path to the uncrustify executable if it's not already in the PATH environment variable.
* `uncrustify.configPath` (`string`): Path to the uncrustify configuration file. Environment variables can be used with both a Windows and a bash syntax (examples: `%SOME_PATH%/dev/uncrustify.cfg`, `$SOME_PATH/dev/uncrustify.cfg`)
* `uncrustify.debug` (`boolean`): Activates logs for debugging the extension. Logs should appear in the uncrustify output channel.

## Changelog

See CHANGELOG.md