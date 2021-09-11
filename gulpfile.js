'use strict'

const { dest, parallel, series, src, watch } = require('gulp')
const bump = require('gulp-bump')
const cleanCSS = require('gulp-clean-css')
const flatmap = require('gulp-flatmap')
const fs = require('fs')
const htmlmin = require('gulp-html-minifier-terser')
const replace = require('gulp-replace')
const userscript = require('userscript-meta')

// paths
const paths = {
  css: {
    dest: 'template/',
    src: 'src/template/css/*.css'
  },
  handlebars: {
    dest: 'template/',
    src: 'src/template/handlebars/*.hbs'
  },
  meta: {
    dest: 'userscripts/meta/',
    src: 'userscripts/meta/'
  },
  userscripts: {
    dest: 'userscripts/',
    src: 'userscripts/*.user.js'
  }
}

// minify
const minifyCSS = () => {
  return src(paths.css.src)
    .pipe(cleanCSS({}))
    .pipe(dest(paths.css.dest))
}

const minifyHandlebars = () => {
  return src(paths.handlebars.src)
    .pipe(htmlmin({
      collapseBooleanAttributes: true,
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true,
      processScripts: ['text/x-handlebars-template'],
      removeAttributeQuotes: true,
      removeComments: true,
      removeEmptyAttributes: true,
      sortAttributes: true,
      sortClassName: true
    }))
    .pipe(dest(paths.handlebars.dest))
}

// replace
const replaceCSS = () => {
  return src(paths.userscripts.src)
    .pipe(flatmap((stream, file) => {
      return src(file.path)
        .pipe(replace(/(?<=(css: )')(.*?)(?=')/g, fs.readFileSync('template/config.css', 'utf8')))
        .pipe(dest('userscripts/'))
    }))
}

const replaceHandlebars = () => {
  return src(paths.userscripts.src)
    .pipe(flatmap((stream, file) => {
      const fileName = file.stem.replace('.user', '')

      if (fs.existsSync(`template/${fileName}.hbs`)) {
        return src(file.path)
          .pipe(replace(/(?<=(const template = )')(.*?)(?=')/g, fs.readFileSync(`template/${fileName}.hbs`, 'utf8')))
          .pipe(dest('userscripts/'))
      } else {
        return stream
      }
    }))
}

// bump meta version
const bumpMeta = () => {
  return src(paths.userscripts.src)
    .pipe(flatmap((stream, file) => {
      const fileName = file.basename.replace('.user', '.meta')
      const contents = file.contents.toString('utf8')
      const { version } = userscript.parse(contents)

      return src(`${paths.meta.src}${fileName}`)
        .pipe(bump({ version: version }))
        .pipe(dest(paths.meta.dest))
    }))
}

// watch
const watchUserscripts = () => {
  watch(paths.userscripts.src, {
    ignoreInitial: false
  }, series(bumpMeta))
}

const watchCSS = () => {
  watch(paths.css.src, {
    ignoreInitial: false
  }, series(minifyCSS, replaceCSS))
}

const watchHandlebars = () => {
  watch(paths.handlebars.src, {
    ignoreInitial: false
  }, series(minifyHandlebars, replaceHandlebars))
}

// exports
exports.default = parallel(watchUserscripts, watchCSS, watchHandlebars)
