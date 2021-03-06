/*
* grunt-joomla-packager
* https://github.com/okonomiyaki3000/grunt-joomla-packager
*
* Copyright (c) 2015 Elijah Madden
* Licensed under the MIT license.
*/

'use strict';

var merge = require('merge'),
    parseXML = require('xml2js').parseString,
    path = require('path'),
    fs = require('fs-extra');


module.exports = function(grunt) {
    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    grunt.registerMultiTask('joomla_packager', 'Tasks for copying extension files from a Joomla installation and repackaging them as an installable package.', function() {
        var done = this.async(),
            options = getOptions(this.options),
            gruntOptions = this.options,
            manifestFile, extensionPath, manifestXML;

        try
        {
            manifestFile = getManifestFilename(options.type, options.name);
            extensionPath = getExtensionPath(options);
            manifestXML = grunt.file.read(extensionPath + '/' + manifestFile);
        }
        catch (err)
        {
            grunt.fatal(err);
        }

        parseXML(manifestXML, function (error, result) {
            if (error)
            {
                grunt.fatal(error);
            }

            if (!result.extension)
            {
                grunt.fatal('Malformed XML: <extension> missing');
            }

            // If the manifest file has a name, make it the default name.
            // Can be overriden by options.
            if (!!result.extension.name)
            {
                options = gruntOptions(merge(options, { packageName: result.extension.name[0] }));
            }

            var packageName = getPackageName(options);

            var mapping = getMapping(result.extension, options);

            // Of course, the manifest file itself.
            mapping.push({
                src: extensionPath + '/' + manifestFile,
                dest: '/' + manifestFile
            });

            mapping.forEach(function (file) {
                if (grunt.file.exists(file.src))
                {
                    grunt.verbose.writeln('Copying file: ' + file.src);
                    grunt.verbose.writeln('\tto: ' + options.dest + '/' + packageName + file.dest);
                    fs.copySync(file.src, options.dest + '/' + packageName + file.dest);
                }
                else
                {
                    grunt.fail.warn('File does not exist: ' + file.src);
                }
            });

            done();
        });

    });

};

/**
 * Get the merged options object.
 *
 * @param   {Object}  opt  The Grunt options object for merging options with defaults.
 *
 * @return  {Object}
 */
function getOptions(opt)
{
    // Merge task-specific and/or target-specific options with these defaults.
    var options = opt({
            joomla: '.',
            dest: './dest',
            client: 'site',
            packagePrefix: {
                'component': 'com',
                'plugin':    'plg',
                'files':     'files',
                'library':   'lib',
                'package':   'pkg',
                'module':    'mod',
                'template':  'tpl',
                'language':  'lan'
            }
        }),
        manifest;

    // Now that we're sure we have options.joomla, merge more default options.
    options = opt(merge(options, {
        administrator: options.joomla + '/administrator',
        libraries: options.joomla + '/libraries',
        plugins: options.joomla + '/plugins',
        templates: options.joomla + '/templates'
    }));

    // And one more that depends on options.administrator
    return opt(merge(options, {
        manifests: options.administrator + '/manifests',
        adminTemplates: options.administrator + '/templates'
    }));
}

/**
 * Get a name for the package directory.
 *
 * @param   {Object}  options  Options object.
 *
 * @return  {String}
 */
function getPackageName(options)
{
    if (options.packageName)
    {
        return options.packageName;
    }

    var prefix = !!options.packagePrefix[options.type] ? options.packagePrefix[options.type] + '_' : '',
        group = (options.type === 'plugin' && options.group) ? options.group + '_' : '',
        name = options.name;

    return prefix + group + name;
}

/**
 * Get the name of the xml manifest file based on the type and basename of the extension.
 *
 * @param   {String}  type  The type of extension
 * @param   {String}  name  The extension's name
 *
 * @return  {String}
 */
function getManifestFilename(type, name)
{
    switch (type)
    {
        case 'component':
        case 'plugin':
        case 'files':
        case 'library':
        case 'package':
            return name + '.xml';

        case 'module':
            return 'mod_' + name + '.xml';

        case 'template':
            return 'templateDetails.xml';

        case 'language':
            return 'install.xml';
    }

    throw 'Invalid option value: type';
}

/**
 * Get the path to the extension (where the manifest file is located).
 *
 * @param   {Object}  options  Options object.
 *
 * @return  {String}
 */
function getExtensionPath(options)
{
    switch (options.type)
    {
        case 'component':
            return options.administrator + '/components/com_' + options.name;

        case 'module':
            return (options.client === 'administrator' ? options.administrator : options.joomla) + '/modules/mod_' + options.name;

        case 'plugin':
            return options.plugins + '/' + options.group + '/' + options.name;

        case 'template':
            return (options.client === 'administrator' ? options.adminTemplates : options.templates) + '/' + options.name;

        case 'language':
            return (options.client === 'administrator' ? options.administrator : options.joomla) + '/language/' + options.name;

        case 'files':
            return options.manifests + '/files';

        case 'library':
            return options.manifests + '/libraries';

        case 'package':
            return options.manifests + '/packages';
    }

    throw 'Invalid option value: type';
}

/**
 * Get the mapping array. A list of objects specifying source and destination for files to be copied.
 *
 * @param   {Object}  extension  JS Object representation of the manifest file's 'extension' node.
 * @param   {Object}  options    Options object.
 *
 * @return  {Array}
 */
function getMapping(extension, options)
{
    var mapping = [],
        thisObj = {
            options: options
        };

    if (options.type === 'library')
    {
        options.libraryname = extension.libraryname ? extension.libraryname[0] : options.name;
    }

    if (extension.files)
    {
        thisObj.path = getFilesPath(options, false);
        extension.files.map(processFiles, thisObj).forEach(function (list) {
            [].push.apply(mapping, list);
        });
    }

    if (extension.languages)
    {
        thisObj.path = getLanguagesPath(options, false);
        extension.languages.map(processLanguages, thisObj).forEach(function (list) {
            [].push.apply(mapping, list);
        });
    }

    if (extension.media)
    {
        thisObj.path = options.joomla + '/media';
        extension.media.map(processMedia, thisObj).forEach(function (list) {
            [].push.apply(mapping, list);
        });
    }

    if (extension.administration)
    {
        extension.administration.forEach(function (administration) {
            if (administration.files)
            {
                thisObj.path = getFilesPath(options, true);
                administration.files.map(processFiles, thisObj).forEach(function (list) {
                    [].push.apply(mapping, list);
                });
            }

            if (administration.languages)
            {
                thisObj.path = getLanguagesPath(options, true);
                administration.languages.map(processLanguages, thisObj).forEach(function (list) {
                    [].push.apply(mapping, list);
                });
            }
        });
    }

    if (extension.fileset)
    {
        extension.fileset.forEach(function (fileset) {
            if (fileset.files)
            {
                thisObj.path = getFilesPath(options, true);
                fileset.files.map(processFiles, thisObj).forEach(function (list) {
                    [].push.apply(mapping, list);
                });
            }
        });
    }

    return mapping;
}

/**
 * Get the path to a folder containing files to be copied.
 *
 * @param   {Object}   options  Options object.
 * @param   {Boolean}  admin    True for the admin version of the path.
 *
 * @return  {String}
 */
function getFilesPath(options, admin)
{
    switch (options.type)
    {
        case 'component':
            return (admin ? options.administrator : options.joomla) + '/components/com_' + options.name;

        case 'module':
            return (admin || options.client === 'administrator' ? options.administrator : options.joomla) + '/modules/mod_' + options.name;

        case 'plugin':
            return options.plugins + '/' + options.group + '/' + options.name;

        case 'template':
            return (admin || options.client === 'administrator' ? options.adminTemplates : options.templates) + '/' + options.name;

        case 'language':
            return (admin || options.client === 'administrator' ? options.administrator : options.joomla) + '/language/';

        case 'files':
            return options.joomla;

        case 'library':
            return options.libraries + '/' + options.libraryname;

        case 'package':
            return '';
    }

    throw 'Invalid option value: type';

}

/**
 * Process a 'files' element from the manifest file.
 *
 * @param   {Object}  files  JS Object representation of 'files' element. May contain 'filename' and 'folder' elements.
 *
 * @return  {Array}
 */
function processFiles(files)
{
    /* jslint validthis: true */
    var mappings = [],
        basePath = this.path,
        dest = (files && files.$ && files.$.folder) ? '/' + files.$.folder : '';

    // We don't really care what the tagname is in here... weird, right?
    Object.keys(files).forEach(function (key) {
        if (key === '$' || key === '_') { return; }

        [].push.apply(mappings, files[key].map(mapFile));
    });

    return mappings;

    /**
     * Get a mapping object containing a 'src' and 'dest' for a file.
     *
     * @param   {Mixed}  file  May be a string or object representation of a 'filename' or 'folder' element.
     *
     * @return  {Object}
     */
    function mapFile(file)
    {
        if (typeof file === 'object')
        {
            file = file._;
        }

        return {
            src: basePath + '/' + file,
            dest: dest + '/' + file
        };
    }
}

/**
 * Get the path to the language folder, either for the site or the administrator.
 *
 * @param   {Object}   options  Options object.
 * @param   {Boolean}  admin    True for the administrator language folder path.
 *
 * @return  {String}
 */
function getLanguagesPath(options, admin)
{
    return (admin ? options.administrator : options.joomla) + '/language';
}

/**
 * Process a 'languages' element from the manifest file.
 *
 * @param   {Object}  languages  JS Object representation of 'languages' element.
 *
 * @return  {Array}
 */
function processLanguages(languages)
{
    /* jslint validthis: true */
    var mappings = [],
        basePath = this.path,
        dest = (languages && languages.$ && languages.$.folder) ? '/' + languages.$.folder : '';

    if (languages.language)
    {
        [].push.apply(mappings, languages.language.map(mapFile));
    }

    return mappings;

    /**
     * Get a mapping object containing a 'src' and 'dest' for a language file.
     *
     * @param   {Object}  file  JS Object representation of a 'language' element.
     *
     * @return  {Object}
     */
    function mapFile(file)
    {
        if (typeof file !== 'object')
        {
            throw "<language> tag must contain a 'tag' attribute.";
        }

        var filename = file._,
            tag = file.$.tag;

        return {
            src: basePath + '/' + tag + '/' + path.basename(filename),
            dest: dest + '/' + filename
        };
    }
}

/**
 * Process a 'media' element from the manifest file.
 *
 * @param   {Object}  media  JS Object representation of 'media' element.
 *
 * @return  {Array}
 */
function processMedia(media)
{
    /* jslint validthis: true */
    var mappings = [],
        basePath = this.path,
        src = (media && media.$ && media.$.destination) ? '/' + media.$.destination : '',
        dest = (media && media.$ && media.$.folder) ? '/' + media.$.folder : '';

    // We don't really care what the tagname is in here... weird, right?
    Object.keys(media).forEach(function (key) {
        if (key === '$' || key === '_') { return; }

        [].push.apply(mappings, media[key].map(mapFile));
    });

    return mappings;

    /**
     * Get a mapping object containing a 'src' and 'dest' for a file.
     *
     * @param   {Object}  file  JS Object representation of a 'filename' or 'folder' element.
     *
     * @return  {Object}
     */
    function mapFile(file)
    {
        return {
            src: basePath + src + '/' + file,
            dest: dest + '/' + file
        };
    }
}
