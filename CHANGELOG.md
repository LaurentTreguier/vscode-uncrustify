# Changelog

#### 2.13.6
- Fixed typo in README (#41)
- Updated dependencies

#### 2.13.5
- Updated dependencies

#### 2.13.4
- Updated dependencies to fix potential security issues

#### 2.13.3
- Fixed typos in commands display names (#39)

#### 2.13.2
- Updated Windows archive URL to fetch x64 binaries as x86 ones are not produced with the latest Uncrustify

#### 2.13.1
- Updated dependencies to fix potential security issues

### 2.13.0
- Added option to use the `--replace` uncrustify flag to format files in-place, bypassing VSCode (#36)

### 2.12.0
- Added ability to override language mappings (#33)

#### 2.11.1
- Fixed error when the config file didn't have comments

### 2.11.0
- `editor.formatOnType` is now respected (#30)

### 2.10.0
- Fixed uncrustify executable version not being parsed correctly (#27)
- The action buttons now fade away until the mouse hovers over them so that they don't hide any text (#28)
- Any config option that has been changed and is not yet saved will have a shadow to easily spot them (#29)

#### 2.9.2
- Fixed environment variable not expanding after the first one

#### 2.9.1
- Fixed wrong behavior when using environment variables in config path (#26)

### 2.9.0
- Added a search widget to look for specific settings in the graphical config (#19)

#### 2.8.6
- Fixed wrong multiple choice selections being replaced by text areas (#25)

#### 2.8.5
- Fixed problems with uncrustify executable path (#23, #24)
- Updated config parsing to support even barebone config files without any comment (#20)

#### 2.8.4
- Fixed formatting potentially erasing all text from a file containing a syntax error

#### 2.8.3
- Fixed constant prompting to install uncrustify when using a custom installation path (#21)

#### 2.8.2
- Fixed configuration file upgrading

#### 2.8.1
- Fixed installation/upgrade of uncrustify on Windows

### 2.8.0
- Added support for PDE to be formatted as Java (#16)

#### 2.7.3
- Fixed default config file not being created with older version of uncrustify

#### 2.7.2
- Fixed extension not working with uncrustify 0.65

#### 2.7.1
- Added relative paths support for config file (#14)

### 2.7.0
- Added support for multi-root workspaces

### 2.6.0
- Added a warning message before overwriting an already existing config file

#### 2.5.1
- Fixed document formatting potentially not working (#11, #12)
- Fixed range formatting showing errors (#12)

### 2.5.0
- Added range formatting

#### 2.4.2
- Fixed (hopefully) `uncrustify.create` not filling `uncrustify.cfg`

#### 2.4.1
- Fixed extension activation (#10)

### 2.4.0
- Fixed string values not being displayed in graphical config editor
- Added text box to graphical config editor for custom values (#8)

### 2.3.0
- Fixed behavior when invoking uncrustify commands manually when they are not supposed to be (#7)
- Added `uncustify.open` command to open currently used uncrustify config file (#7)
- Replaced `uncrustify.download` command with `uncrustify.create` that creates config files instead of downoading thems

#### 2.2.1
- Fixed editor css and js files not being loaded

### 2.2.0
- Fixed preset loading that could interrupt config file download
- Added the ability to upgrade config files when they are not made for the same version as the uncrustify executable

### 2.1.0
- Added ability to save and load configuration file presets

#### 2.0.1
- Corrected image in README

## 2.0.0
- Added graphical config editor to ease configuration

### 1.6.0
- Added command to automatically download a default config file for uncrustify

#### 1.5.6
- Removed useless error message appearing even when everything is fine; this time it's working I swear

#### 1.5.5
- Removed forgotten test that forced uncrustify not to work...

#### 1.5.4
- Updated README to add forgotten doc about the "debug mode"

#### 1.5.3
- Added a "debug mode" that shows a bunch of logs in the uncrustify output channel (see)

#### 1.5.2
- Fixed README wrongly asserting that Apex is officially supported by uncrustify (#6)

#### 1.5.1
- Fixed local uncrusify install

### 1.5.0
- Added support for environment variables in the `uncrustify.configPath` option

#### 1.4.4
- Actually fixed the bug

#### 1.4.3
- Fixed a crash occuring when uncrustify is already installed

#### 1.4.2
- Uncrustify can now be automatically installed on Windows as well

#### 1.4.1
- The installation progress is now displayed in an OutputChannel
- The README was updated to reflect the possible automatic installation of uncrustify by the extension

### 1.4.0
- The extension now uses Typescript 2
- On MacOS and Linux, uncrustify can be installed by the extension if it's not detected

#### 1.3.5
- The user is now warned whenever the path to `uncrustify.cfg` is incorrect, and the C# language id is correctly set for uncrustify

#### 1.3.4
- Actually fixed C# support

#### 1.3.3
- Updated README

#### 1.3.2
- Fixed C# support

#### 1.3.1
- Updated README

### 1.3.0
- Added Apex support

#### 1.2.3
- Added an icon and a background color for the extension marketplace

#### 1.2.2
- Remove another useless file, write changelog

#### 1.2.1
- Remove useless files

### 1.2.0
- Try to use default uncrustify configuration file on Posix systems

### 1.1.0
Add URLs and fix keywords
- (should have been 1.0.1 but I accidently wrote `vsce publish minor` instead of `vsce publish patch`)

## 1.0.0
- Initial release