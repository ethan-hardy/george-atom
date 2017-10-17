# george-atom package

Fixed issues with george plugin related to [@ethan-hardy](https://github.com/ethan-hardy) branch   
Currently waiting on pull request to be merged.
## Installation

Until my pull request is merged use george-atom-v2

apm install george-atom-v2

## Usage
`Cmd-Shift-G` (`Ctrl-Shift-G` for windows/linux users) to ask george, using the entire contents of your current text editor as input.

Results will show up in a notification.

**NEW:** You can now use the command `create-files` (from the packages menu or the command palette) to have george-atom create a file for each problem in the current assignment and populate each file with the initial text given to us on the SE 212 site.
george-atom determines your assignment number by scanning through your open projects and finding one with a number in it -- so make sure to have something like "Assignment 3" or "A6" as your assignment folder. Also, if you happen to have another project folder with a different number in it, george-atom might choose that one, so.. don't :)

Also, adds syntax highlighting thanks to [@georgeutsin](https://github.com/georgeutsin)
