# VSCode uncrustify

## Features

Formats your code using [uncrustify](https://github.com/uncrustify/uncrustify).
Supported languages are :
- Apex
- C
- C++
- C#
- D
- Java
- Objective-C
- Pawn
- Vala

## Requirements

Uncrustify has to be installed on your system in order for the extension to work. However, on most Linux distributions and on macOS (if brew is installed), the installation can be handled by the extension automatically.

If you want or have to install it yourself :
- Linux : Uncrustify is available in most distributions as a package in the official repositories (`apt/yum install uncrustify` or equivalent)
- macOS : Uncrustify is available through Homebrew (see http://macappstore.org/uncrustify)
- Windows : Prebuilt binaries are available on [sourceforge](https://sourceforge.net/projects/uncrustify/files)

If the executable is not in the PATH environment variable, you must set its path in the settings explicitly.
An uncrustify configuration file should be set, although on Linux and OS X it will try to use a default config file.
Thankfully, uncrustify comes with a few preset configurations if you don't want to spend hours making one yourself.

## Extension Settings

This extension contributes the following settings:

* `uncrustify.executablePath`: Path to the uncrustify executable if it's not already in the PATH environment variable
* `uncrustify.configPath`: Path to the uncrustify configuration file