# grunt-joomla-packager

> Tasks for copying extension files from a Joomla installation and repackaging them as an installable package.

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-joomla-packager --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-joomla-packager');
```

## The "joomla_packager" task

### Overview
In your project's Gruntfile, add a section named `joomla_packager` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  joomla_packager: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
});
```

### Options

#### options.name
**Required**
Type: `String`
Default value: `null`

The base name of the extension to be packaged. Omit any obligatory prefix. For example, to package a component called `com_mycompoment`, just use `mycomponent`.  

#### options.type
**Required**
Type: `String`
Default value: `null`

The extension type. Should be one of: `component`, `file`, `language`, `library`, `module`, `plugin`, or `template`. The `package` type extension is not currently supported. 

#### options.group
**Required if type is `plugin`**
Type: `String`
Default value: `null`

The plugin group. Joomla's built-in groups are `authentication`, `captcha`, `content`, `editors`, `editors-xtd`, `extension`, `finder`, `quickicon`, `search`, `system`, `twofactorauth`, and `user` but this list is also extensible. 

#### options.joomla
Type: `String`
Default value: `'.'`

The path to your Joomla installation's root directory. Files will be copied from locations inside this directory (in most cases). 

#### options.dest
Type: `String`
Default value: `'./dest'`

The location where files should be copied to. A directory will be created in this location for each and every extension being packed. If you are packaging a component called `mycomponent`, a folder `com_mycomponent` will be created here and files will be copied into it.

#### options.administrator
Type: `String`
Default value: `options.joomla + '/administrator'`

The location of the Joomla _administrator_ directory. No need to change this unless using a custom `defines.php` file.

#### options.libraries
Type: `String`
Default value: `options.joomla + '/libraries'`

The location of the _libraries_ directory. No need to change this unless using a custom `defines.php` file.

#### options.plugins
Type: `String`
Default value: `options.joomla + '/plugins'`

The location of the _plugins_ directory. No need to change this unless using a custom `defines.php` file.

#### options.templates
Type: `String`
Default value: `options.joomla + '/templates'`

The location of the _templates_ directory. No need to change this unless using a custom `defines.php` file.

#### options.manifests
Type: `String`
Default value: `options.administrator + '/manifests'`

The location of the _manifests_ directory. No need to change this unless using a custom `defines.php` file.

#### options.adminTemplates
Type: `String`
Default value: `options.administrator + '/templates'`

The location of the administrator _templates_ directory. No need to change this unless using a custom `defines.php` file in the administrator app.

### Usage Examples

#### Component Packaging
In this example, `com_custom` is being copied from a Joomla directory and packaged.

```js
grunt.initConfig({
  joomla_packager: {
    com_custom: {
      'name': 'custom',
      'type': 'component',
      'joomla': '/path/to/joomla',
      'dest': '/path/to/packages'
    },
  },
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
* 2015-09-28   v0.1.0b1   First beta. Probably works...
