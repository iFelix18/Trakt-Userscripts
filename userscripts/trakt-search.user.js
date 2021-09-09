// ==UserScript==
// @name            Trakt Search
// @name:it         Ricerca Trakt
// @author          Davide <iFelix18@protonmail.com>
// @namespace       https://github.com/iFelix18
// @icon            https://www.google.com/s2/favicons?sz=64&domain=trakt.tv
// @description     Shows the results of a search on Trakt
// @description:it  Mostra i risultati di una ricerca su Trakt
// @copyright       2021, Davide (https://github.com/iFelix18)
// @license         MIT
// @version         1.0.3
// @homepage        https://github.com/iFelix18/Trakt-Userscripts#readme
// @homepageURL     https://github.com/iFelix18/Trakt-Userscripts#readme
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/trakt-search.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/trakt-search.user.js
// @require         https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@43fd0fe4de1166f343883511e53546e87840aeaf/gm_config.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@abce8796cedbe28ac8e072d9824c4b9342985098/lib/utils/utils.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@2a8d621376678f748acb81102f6c07c9d5129e81/lib/api/trakt.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@8c5a008457b859c22300b94b416767b8d2605bb2/lib/api/tmdb.min.js
// @require         https://cdn.jsdelivr.net/npm/gm4-polyfill@1.0.1/gm4-polyfill.min.js#sha256-qmLl2Ly0/+2K+HHP76Ul+Wpy1Z41iKtzptPD1Nt8gSk=
// @require         https://cdn.jsdelivr.net/npm/node-creation-observer@1.2.0/release/node-creation-observer-latest.js#sha256-OlRWIaZ5LD4UKqMHzIJ8Sc0ctSV2pTIgIvgppQRdNUU=
// @require         https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js#sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=
// @require         https://cdn.jsdelivr.net/npm/handlebars@4.7.7/dist/handlebars.min.js#sha256-ZSnrWNaPzGe8v25yP0S6YaMaDLMTDHC+4mHTw0xydEk=
// @match           *://trakt.tv/*
// @connect         api.trakt.tv
// @connect         api.themoviedb.org
// @compatible      chrome
// @compatible      edge
// @compatible      firefox
// @grant           GM.getValue
// @grant           GM.info
// @grant           GM.registerMenuCommand
// @grant           GM.setValue
// @grant           GM.xmlHttpRequest
// @grant           GM_getValue
// @grant           GM_info
// @grant           GM_registerMenuCommand
// @grant           GM_setValue
// @grant           GM_xmlhttpRequest
// @run-at          document-start
// @inject-into     page
// ==/UserScript==

/* global $, GM_config, Handlebars, MonkeyUtils, NodeCreationObserver, TMDb, Trakt */

(() => {
  'use strict'

  //* GM_config
  GM_config.init({
    id: 'trakt-config',
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
    /* cSpell: disable-next-line */
    css: '#trakt-config{background-color:#343434;color:#fff}#trakt-config *{font-family:varela round,helvetica neue,Helvetica,Arial,sans-serif}#trakt-config .section_header{background-color:#282828;border:1px solid #282828;border-bottom:none;color:#fff;font-size:10pt}#trakt-config .section_desc{background-color:#282828;border:1px solid #282828;border-top:none;color:#fff;font-size:10pt}#trakt-config .reset{color:#fff}',
    events: {
      init: () => {
        if (!GM_config.isOpen && (GM_config.get('TraktClientID') === '' | GM_config.get('TMDbApiKey') === '')) {
          window.onload = () => GM_config.open()
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
  GM.registerMenuCommand('Configure', () => GM_config.open())

  //* MonkeyUtils
  const MU = new MonkeyUtils({
    name: GM.info.script.name,
    version: GM.info.script.version,
    author: GM.info.script.author,
    color: '#ed1c24',
    logging: GM_config.get('logging')
  })
  MU.init('trakt-config')

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
   * Add style
   */
  const addStyle = () => {
    const css = '<style>#header-search .search-results{background:#333;display:none;max-width:427px}#header-search.open .search-results{display:block}.search-result{border-top:none;border:1px solid #666;display:flex;overflow:hidden;text-decoration:none!important}.search-result:hover{background-color:#222}.search-result-poster{float:left;height:auto;width:37.83333px}.search-result-text{align-items:center;display:flex;min-width:0;padding-left:12px;padding-right:12px}.search-result-type{background-color:#ed1c24;color:#fff;display:inline-block;flex-shrink:0;font-family:proxima nova semibold;font-size:11px;height:auto;margin-right:6px;text-align:center;text-transform:capitalize;width:6ch}.search-result-title{color:#fff;font-family:proxima nova;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.search-result-year{color:#999;flex-shrink:0;font-family:proxima nova;font-size:11px;margin-left:6px}</style>'
    $('head').append(css)
  }

  /**
   * Add template
   */
  const addTemplate = () => {
    const template = '<div class=search-results></div><script id=results-template type=text/x-handlebars-template>{{#each results}}<a class=search-result target=_self href={{link}}><img class=search-result-poster alt=poster src={{poster}}><div class=search-result-text><span class=search-result-type>{{this.type}}</span><span class=search-result-title>{{this.title}}</span><span class=search-result-year>{{this.year}}</span></div></a>{{/each}}</script>'
    $('#header-search').append(template)
  }

  /**
   * Returns all search results
   * @param {string} query  Text query to search
   * @returns {Promise}
   */
  const search = (query) => {
    let data = []
    let resultsProcessed = 0

    return new Promise((resolve, reject) => {
      trakt.search('movie,show', query, 'title').then((response) => {
        response = response.slice(0, 6)

        const length = response.length

        if (length === 0) resolve(null)

        response.map((element) => element).forEach((element, index) => {
          const type = element.type
          const score = element.score
          const id = element[type].ids.tmdb
          const title = element[type].title
          const year = element[type].year
          const link = `/${type}s/${element[type].ids.slug}`

          tmdb.images((type === 'show') ? 'tv' : type, id).then((response) => {
            const poster = (
              (response.posters !== undefined && response.posters.length > 0)
                ? `https://image.tmdb.org/t/p/w92${response.posters[0].file_path}`
                : 'https://trakt.tv/assets/placeholders/thumb/poster-2561df5a41a5cb55c1d4a6f02d6532cf327f175bda97f4f813c18dea3435430c.png'
            )

            data.push({
              type: type,
              score: score,
              id: id,
              title: title,
              year: year,
              link: link,
              poster: poster,
              index: index
            })

            resultsProcessed++

            if (resultsProcessed === length) {
              data = data.sort((a, b) => a.index - b.index)
              resolve(data)
            }
          }).catch((error) => MU.error(error))
        })
      }).catch((error) => MU.error(error))
    })
  }

  /**
   * Get input
   */
  const getInput = () => {
    $('#header-search-query').attr('autocomplete', 'off').on('input', () => {
      $('.search-results').empty()

      const query = $('#header-search-query.open').val()

      if (query === '') return

      search(query).then((response) => {
        MU.log(response)
        const template = Handlebars.compile($('#results-template').html())
        const context = { results: response }
        const compile = template(context)
        $('.search-results').html(compile)
      }).catch((error) => MU.error(error))
    })
  }

  //* NodeCreationObserver
  NodeCreationObserver.init('observed-search')
  NodeCreationObserver.onCreation('#header-search', () => {
    addStyle()
    addTemplate()
    getInput()
  })
})()
