module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-peg')

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    peg: {
      constraints: {
        grammar: './docu/grammar.peg',
        outputFile: './app/ui/app/lib-grammar.js',
        exportVar: 'app.lib.constraint_parser'
      }
    }
  })

  grunt.registerTask('grammar', ['peg'])
}