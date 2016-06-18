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

## Requirements

Uncrustify has to be installed on your system in order for the extension to work.
If the executable is not in the PATH environment variable, you must set its path in the settings explicitly.
An uncrustify configuration file should be set, although on Linux and OS X it will try to use a default config file.
Thankfully, uncrustify comes with a few preset configurations if you don't want to spend hours making one yourself.

## Extension Settings

This extension contributes the following settings:

* `uncrustify.executablePath`: Path to the uncrustify executable
* `uncrustify.configPath`: Path to the uncrustify configuration file