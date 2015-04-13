# TypeScriptMaker
Node.js script to compile several TypeScript files into one single source.

##Usage:
```
node make [ts-files-folder] [output-javascript-file]
```

| Parameter              | Description                                       | Default value |
-------------------------|---------------------------------------------------|---------------|
| ts-files-folder        | Path to the folder where the .ts files are placed | .             |
| output-javascript-file | File path to the output JavaScript file.          | script.js     |

##CSS Concatenation
If CSS files are found on the directory, they will be also concatenated into one single
with the same name of the JavaScript file.

##About
- More information on TypeScript: http://typescriptlang.org
- Developed by http://menendezpoo.com for http://goplek.com
