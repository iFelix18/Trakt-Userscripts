// ==UserScript==
// @name            Trakt Search
// @name:it         Ricerca Trakt
// @author          Davide <iFelix18@protonmail.com>
// @namespace       https://github.com/iFelix18
// @icon            https://www.google.com/s2/favicons?sz=64&domain=https://trakt.tv
// @description     Shows the results of a search on Trakt
// @description:it  Mostra i risultati di una ricerca su Trakt
// @copyright       2021, Davide (https://github.com/iFelix18)
// @license         MIT
// @version         1.4.0
// @homepage        https://github.com/iFelix18/Trakt-Userscripts#readme
// @homepageURL     https://github.com/iFelix18/Trakt-Userscripts#readme
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/trakt-search.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/trakt-search.user.js
// @require         https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@43fd0fe4de1166f343883511e53546e87840aeaf/gm_config.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@utils-3.0.1/lib/utils/utils.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@trakt-1.5.4/lib/api/trakt.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@tmdb-1.5.4/lib/api/tmdb.min.js
// @require         https://cdn.jsdelivr.net/npm/node-creation-observer@1.2.0/release/node-creation-observer-latest.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js
// @require         https://cdn.jsdelivr.net/npm/handlebars@4.7.7/dist/handlebars.min.js
// @match           *://trakt.tv/*
// @connect         api.trakt.tv
// @connect         api.themoviedb.org
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM.deleteValue
// @grant           GM.getValue
// @grant           GM.registerMenuCommand
// @grant           GM.setValue
// @grant           GM.xmlHttpRequest
// @run-at          document-start
// @inject-into     content
// ==/UserScript==

/* global $, GM_config, Handlebars, migrateConfig, MyUtils, NodeCreationObserver, TMDb, Trakt */

(() => {
  migrateConfig('trakt-config', 'trakt-search') // migrate to the new config ID

  //* GM_config
  GM_config.init({
    id: 'trakt-search',
    title: `${GM.info.script.name} v${GM.info.script.version} Settings`,
    fields: {
      TraktClientID: {
        label: 'Trakt Client ID',
        section: ['Enter your Trakt Client ID', 'Get one at: https://trakt.tv/oauth/applications/new'],
        labelPos: 'left',
        type: 'text',
        title: 'Your Trakt Client ID',
        size: 70,
        default: ''
      },
      TMDbApiKey: {
        label: 'TMDb API Key',
        section: ['Enter your TMDb API Key', 'Get one at: https://developers.themoviedb.org/3/'],
        labelPos: 'left',
        type: 'text',
        title: 'Your TMDb API Key',
        size: 70,
        default: ''
      },
      logging: {
        label: 'Logging',
        section: ['Develop'],
        labelPos: 'right',
        type: 'checkbox',
        default: false
      },
      debugging: {
        label: 'Debugging',
        labelPos: 'right',
        type: 'checkbox',
        default: false
      }
    },
    css: ':root{--mainBackground:#343433;--background:#282828;--text:#fff}body{background-color:var(--mainBackground)!important;color:var(--text)!important}body .section_header{background-color:var(--background)!important;border-bottom:none!important;border:1px solid var(--background)!important;color:var(--text)!important}body .section_desc{background-color:var(--background)!important;border-top:none!important;border:1px solid var(--background)!important;color:var(--text)!important}body .reset{color:var(--text)!important}',
    events: {
      init: () => {
        if (!GM_config.isOpen && (GM_config.get('TraktClientID') === '' | GM_config.get('TMDbApiKey') === '')) {
          window.addEventListener('load', () => GM_config.open())
        }
      },
      save: () => {
        if (GM_config.isOpen && (GM_config.get('TraktClientID') === '' | GM_config.get('TMDbApiKey') === '')) {
          window.alert(`${GM.info.script.name}: check your settings and save`)
        } else {
          window.alert(`${GM.info.script.name}: settings saved`)
          GM_config.close()
          window.location.reload(false)
        }
      }
    }
  })
  if (GM.info.scriptHandler !== 'Userscripts') GM.registerMenuCommand('Configure', () => GM_config.open()) //! Userscripts Safari: GM.registerMenuCommand is missing

  //* MyUtils
  const MU = new MyUtils({
    name: GM.info.script.name,
    version: GM.info.script.version,
    author: GM.info.script.author,
    color: '#ed1c24',
    logging: GM_config.get('logging')
  })
  MU.init('trakt-search')

  //* Trakt API
  const trakt = new Trakt({
    clientID: GM_config.get('TraktClientID'),
    debug: GM_config.get('debugging')
  })

  //* TMDb API
  const tmdb = new TMDb({
    apikey: GM_config.get('TMDbApiKey'),
    language: ' ',
    debug: GM_config.get('debugging')
  })

  //* Functions
  /**
   * Adds a button for script configuration to the menu
   */
  const addMenu = () => {
    const menu = `<li class='${GM.info.script.name.toLowerCase().replace(/\s/g, '_')}'><a href='' onclick='return false;'>${GM.info.script.name}</a></li>`
    $('#user-menu ul li.separator').last().after(menu)
    $(`.${GM.info.script.name.toLowerCase().replace(/\s/g, '_')}`).click(() => GM_config.open())
  }

  /**
   * Add style
   */
  const addStyle = () => {
    const css = '<style>#header-search .search-results{background:#333;display:none;max-width:427px}#header-search.open .search-results{display:block}.search-result{border-top:none;border:1px solid #666;display:flex;overflow:hidden;text-decoration:none!important}.search-result:hover{background-color:#222}.search-result-poster{float:left;height:auto;width:37.83333px}.search-result-text{align-items:center;display:flex;min-width:0;padding-left:12px;padding-right:12px}.search-result-type{background-color:#ed1c24;color:#fff;display:inline-block;flex-shrink:0;font-family:proxima nova semibold;font-size:11px;height:auto;margin-right:6px;text-align:center;text-transform:capitalize;width:7ch}.search-result-title{color:#fff;font-family:proxima nova;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.search-result-year{color:#999;flex-shrink:0;font-family:proxima nova;font-size:11px;margin-left:6px}</style>'

    $('head').append(css)
  }

  /**
   * Add template
   */
  const addTemplate = () => {
    const template = '<div class=search-results></div><script id=results-template type=text/x-handlebars-template>{{#each results}} <a class=search-result href={{link}} target=_self><img alt=poster class=search-result-poster src={{poster}}><div class=search-result-text><span class=search-result-type>{{this.type}} </span><span class=search-result-title>{{this.title}} </span><span class=search-result-year>{{this.year}}</span></div></a>{{/each}}</script>'

    $('#header-search').append(template)
  }

  /**
   * Returns id
   *
   * @param {object} element Search results element
   * @param {string} type Element type
   * @returns {string} ID
   */
  const id = (element, type) => {
    switch (type) {
      case 'episode': {
        return element.show.ids.tmdb
      }
      default: {
        return element[type].ids.tmdb
      }
    }
  }

  /**
   * Returns title
   *
   * @param {object} element Search results element
   * @param {string} type Element type
   * @returns {string} Title
   */
  const title = (element, type) => {
    switch (type) {
      case 'episode': {
        return `${element.show.title} ${element[type].season}x${element[type].number} "${element[type].title}"`
      }
      case 'person':
      case 'list': {
        return element[type].name
      }
      default: {
        return element[type].title
      }
    }
  }

  /**
   * Returns year
   *
   * @param {object} element Search results element
   * @param {string} type Element type
   * @returns {string} Year
   */
  const year = (element, type) => {
    switch (type) {
      case 'episode': {
        return element.show.year
      }
      case 'list': {
        return `${element[type].item_count} items`
      }
      default: {
        return element[type].year
      }
    }
  }

  /**
   * Returns link
   *
   * @param {object} element Search results element
   * @param {string} type Element type
   * @returns {string} Link
   */
  const link = (element, type) => {
    switch (type) {
      case 'episode': {
        return `/shows/${element.show.ids.slug}/seasons/${element[type].season}/episodes/${element[type].number}`
      }
      case 'person': {
        return `/people/${element[type].ids.slug}`
      }
      case 'list': {
        return `/lists/${element[type].ids.trakt}`
      }
      default: {
        return `/${type}s/${element[type].ids.slug}`
      }
    }
  }

  /**
   * Returns poster link
   *
   * @param {object} response Response
   * @returns {string} Poster link
   */
  const poster = (response) => {
    if (response.posters !== undefined && response.posters.length > 0) {
      return `https://image.tmdb.org/t/p/w92${response.posters[0].file_path}`
    } else if (response.profiles !== undefined && response.profiles.length > 0) {
      return `https://image.tmdb.org/t/p/w92${response.profiles[0].file_path}`
    } else {
      return 'https://trakt.tv/assets/placeholders/thumb/poster-2561df5a41a5cb55c1d4a6f02d6532cf327f175bda97f4f813c18dea3435430c.png'
    }
  }

  /**
   * Returns all search results
   *
   * @param {string} type Search type
   * @param {string} query Text query to search
   * @returns {Promise} Search results
   */
  const search = (type, query) => {
    let data = []
    let resultsProcessed = 0

    return new Promise((resolve, reject) => {
      trakt.search(type, query, 'title').then((response) => {
        response = response.slice(0, 6)

        const length = response.length

        if (length === 0) resolve()

        for (const [index, element] of response.map((element) => element).entries()) {
          const type = element.type
          const score = element.score
          const tmdbID = id(element, type)

          tmdb.images((type === 'show' || type === 'episode') ? 'tv' : type, tmdbID).then((response) => {
            data.push({
              type: type,
              score: score,
              id: tmdbID,
              title: title(element, type),
              year: year(element, type),
              link: link(element, type),
              poster: poster(response),
              index: index
            })

            resultsProcessed++

            if (resultsProcessed === length) {
              data = data.sort((a, b) => a.index - b.index)
              resolve(data)
            }
          }).catch((error) => MU.error(error))
        }
      }).catch((error) => MU.error(error))
    })
  }

  /**
   * Get input
   */
  const getInput = () => {
    $('#header-search-query').attr('autocomplete', 'off').on('input', () => {
      $('.search-results').empty()

      const type = $('#header-search-type.shown .title').text().toLowerCase().replace(/(s)\b/g, '').replace(/\s&\s/g, ',').replace(/people/g, 'person').replace(/\s/g, '')
      const query = $('#header-search-query.open').val()

      if (type === 'user') return
      if (query === '') return

      search(type, query).then((response) => {
        MU.log(response)

        const template = Handlebars.compile($('#results-template').html())
        const context = { results: response }
        const compile = template(context)
        $('.search-results').html(compile)
      }).catch((error) => MU.error(error))
    })
  }

  //* Script
  $(document).ready(() => {
    NodeCreationObserver.init(GM.info.script.name.toLowerCase().replace(/\s/g, '_'))
    NodeCreationObserver.onCreation('#user-menu ul', () => addMenu())
    NodeCreationObserver.onCreation('#header-search', () => {
      addStyle()
      addTemplate()
      getInput()
    })
  })
})()
