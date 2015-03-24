/**
 * 2015(c) Goplek.com
 * www.goplek.com
 *
 * This Node.js script gathers al .ts files in specified directory, analyzes their inheritance
 * and compiles them on a runnable JS file.
 *
 * Usage:
 *
 * node make [ts-files-folder] [output-javascript-file]
 *
 * ts-files-folder:         Path to the folder where the .ts files are placed
 * output-javascript-file:  File path to the output JavaScript file.
 *
 *
 * More information on TypeScript: http://www.typescriptlang.org/
 */


var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var sys = require('sys');
var EOL = '\n';


/**
 * Walks a directory recursively searching for files of specified extension and will
 * return an array of files with an absolute path
 *
 * @param {string} dir
 * @param {string} extension (optional)
 * @return {Array} Array of file names
 */
var walk = function(dir, extension) {
    var results = [];

    var files = fs.readdirSync(dir);

    for(var i = 0; i < files.length; i++){

        var file = path.join(dir, files[i]);
        var stat = fs.statSync(file);

        if(stat.isDirectory()){
            results = results.concat(walk(file, extension));
        }else {
            if(typeof extension === 'string' && extension && file.substr(file.length - extension.length) != extension){
                continue;
            }else{
                results.push(file);
            }
        }
    }

    return results;
};

/**
 * Reads the TypeScript file and returns an array with information about it
 *
 * @param {string} path
 * @result { }
 */
var getClassInfo = function(path){

    // Read file
    var data = fs.readFileSync(path, 'utf8');

    var result = {
        isClass: false,
        path: path
    };


    // Get matches
    var matches = data.match(/export\s+class\s+(\w*)(\s+extends\s+([\w|\.]*))?/i);

    if(matches && matches.length > 1){
        result = {
            isClass: true,
            path: path,
            className: matches[1],
            extends: matches[3],
            references: 0
        };
    }

    return result;
};

/**
 * Returns a value indicating if the baseClass implements superClass
 *
 * @param baseClassInfo Information about base class
 * @param superClassInfo Information about super class
 * @param infos List of all classes info
 * @returns {boolean}
 */
var _extends = function(baseClassInfo, superClassInfo, infos){

    if(!baseClassInfo) return false;

    if(typeof infos[baseClassInfo.className] == 'undefined'){
        return false;
    }

    if(baseClassInfo.extends == superClassInfo.className){
        return true;
    }else{
        if(typeof baseClassInfo.extends == 'string'){
            return _extends(infos[baseClassInfo.extends], superClassInfo, infos);
        }else{
            return false;
        }
    }

}

/**
 * Scans the array and assigns references to class info
 *
 * @param {Array<ClassInfo>} infos
 */
var findReferences = function(infos){

    var metas = {};

    for(var j = 0; j < infos.length; j++) metas[infos[j].className] = infos[j];

    // Time to Count references
    for(var j = 0; j < infos.length; j++){
        for(var k = 0; k < infos.length; k++){
            if(_extends(infos[k], infos[j], metas)){
                infos[j].references++;
            }
        }
    }
};

/**
 * Sorts the array of classes info by references count
 *
 * @param {Array<ClassInfo>} infos
 */
var sortByReferences = function(infos){

    // Bubble sort'em
    var swapped;

    do{

        swapped = false;

        for(var j = 0; j < infos.length - 1; j++){

            if( infos[j + 1].references > infos[j].references ){
                var tmp = infos[j];
                infos[j] = infos[j+1];
                infos[j+1] = tmp;
                swapped = true;
            }

        }
    }while(swapped);
};

/**
 * Creates a list of the files in order to be placed to TypeScriptCompiler
 * @param dir
 * @returns {Array}
 */
var createReferenceList = function(dir){
    var buffer = [];

    /**
     * 1. Find *.ts files
     */
    var results = walk(dir, '.ts');
    var classInfo = [];
    var ignoredFiles = [];
    var served = 0;

    /**
     * 2. For each found file
     */
    for(var i = 0; i < results.length; i++){

        /**
         * 3. Get Information of file
         */
        var info = getClassInfo(results[i]);

        if(info.isClass){
            classInfo.push(info);
        }else{
            ignoredFiles.push(info.path);
        }

        // If all files served
        if(results.length === ++served){

            /**
             * 4. Find references
             */
            findReferences(classInfo);

            /**
             * 5. Sort by references
             */
            sortByReferences(classInfo);

            /**
             * 6. Dump non-class files
             */
            for(var j = 0; j < ignoredFiles.length; j++)
                buffer.push(ignoredFiles[j]);

            /**
             * 7. Dump sorted paths
             */
            for(var j = 0; j < classInfo.length; j++)
                buffer.push(classInfo[j].path);

        }

    }

    return buffer;
};

/**
 * Creates a file referencing all files in list.
 * @param list
 */
var createReferenceFile = function(filename, list){
    var gluea="///<reference path=\"";
    var glueb="\"/>" + EOL;


    fs.writeFileSync(filename, gluea + list.join(glueb + gluea) + glueb);
};

/**
 * Compiles the specified tsFile, directing output to outputFile
 * @param outputFile
 * @param tsFile
 * @param callback
 */
var compile = function(outputFile, tsFile, callback){
    exec("tsc --target ES5 --out \"" + outputFile + "\" __tmp.ts", function(error, stdout, stderr) {
        sys.puts(stdout)
        if(typeof callback == 'function'){
            callback();
        }
    });
};

// Get arguments
var args = process.argv.slice(2);

var dirToWalk = path.resolve(args[0] || '.');
var outputFile = path.resolve(args[1] || 'script.js');
var tmp = '__tmp.ts';

// Create file to compile
createReferenceFile(tmp, createReferenceList(dirToWalk));

// Compile
compile(outputFile, tmp, function(){

    // DONE!
    fs.unlinkSync(tmp);

});