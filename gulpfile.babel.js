import { dest, parallel, series, src, watch } from 'gulp'
import { parse, stringify } from 'userscript-meta'
import { readFileSync, existsSync, writeFile } from 'node:fs'
import cleanCSS from 'gulp-clean-css'
import flatmap from 'gulp-flatmap'
import htmlMinifier from 'gulp-html-minifier-terser'
import replace from 'gulp-replace'

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
    .pipe(htmlMinifier({
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
        .pipe(replace(/(?<=(css: )')(.*?)(?=')/g, readFileSync('template/config.css', 'utf8')))
        .pipe(dest('userscripts/'))
    }))
}

const replaceHandlebars = () => {
  return src(paths.userscripts.src)
    .pipe(flatmap((stream, file) => {
      const fileName = file.stem.replace('.user', '')

      return existsSync(`template/${fileName}.hbs`)
        ? src(file.path)
          .pipe(replace(/(?<=(const template = )')(.*?)(?=')/g, readFileSync(`template/${fileName}.hbs`, 'utf8')))
          .pipe(dest('userscripts/'))
        : stream
    }))
}

// bump meta
const bumpMeta = (callback) => {
  return src(paths.userscripts.src)
    .pipe(flatmap((stream, file) => {
      const fileName = file.basename.replace('.user', '.meta')
      const contents = file.contents.toString('utf8')
      const { name, author, namespace, description, copyright, license, version } = parse(contents)
      const meta = stringify({ name, author, namespace, description, copyright, license, version })

      writeFile(`${paths.meta.src}${fileName}`, meta, callback)

      return stream
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

// export
const _default = parallel(watchUserscripts, watchCSS, watchHandlebars)
export { _default as default }
