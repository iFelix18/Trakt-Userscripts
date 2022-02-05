// ==UserScript==
// @name            Translate Trakt
// @name:it         Traduci Trakt
// @author          Davide <iFelix18@protonmail.com>
// @namespace       https://github.com/iFelix18
// @icon            https://www.google.com/s2/favicons?sz=64&domain=https://trakt.tv/
// @description     Translates titles, plots, taglines and posters of movies, TV series and episodes in the choice language
// @description:it  Traduce titoli, trame, tagline e poster di film, serie TV ed episodi nella lingua scelta
// @copyright       2019, Davide (https://github.com/iFelix18)
// @license         MIT
// @version         4.0.3
// @homepage        https://github.com/iFelix18/Trakt-Userscripts#readme
// @homepageURL     https://github.com/iFelix18/Trakt-Userscripts#readme
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/translate-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/translate-trakt.user.js
// @require         https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@43fd0fe4de1166f343883511e53546e87840aeaf/gm_config.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@utils-2.3.4/lib/utils/utils.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@trakt-1.5.3/lib/api/trakt.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@tmdb-1.5.3/lib/api/tmdb.min.js
// @require         https://cdn.jsdelivr.net/npm/node-creation-observer@1.2.0/release/node-creation-observer-latest.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js
// @require         https://cdn.jsdelivr.net/npm/jquery-visible@1.2.0/jquery.visible.min.js
// @match           *://trakt.tv/*
// @connect         api.trakt.tv
// @connect         api.themoviedb.org
// @compatible      chrome
// @compatible      edge
// @compatible      firefox
// @compatible      safari
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM.registerMenuCommand
// @grant           GM.xmlHttpRequest
// @run-at          document-start
// @inject-into     page
// ==/UserScript==

/* global $, GM_config, MonkeyUtils, NodeCreationObserver, TMDb, Trakt */

(() => {
  //* GM_config
  GM_config.init({
    id: 'trakt-config',
    title: `${GM.info.script.name} v${GM.info.script.version} Settings`,
    fields: {
      TMDbApiKey: {
        label: 'TMDb API Key',
        section: ['Enter your TMDb API Key', 'Get one at: https://developers.themoviedb.org/3/'],
        labelPos: 'left',
        type: 'text',
        title: 'Your TMDb API Key',
        size: 70,
        default: ''
      },
      TraktClientID: {
        label: 'Trakt Client ID',
        section: ['Enter your Trakt Client ID', 'Get one at: https://trakt.tv/oauth/applications/new'],
        labelPos: 'left',
        type: 'text',
        title: 'Your Trakt Client ID',
        size: 70,
        default: ''
      },
      language: {
        label: 'Language',
        section: ['Select the code of your language', 'More info at: https://developers.themoviedb.org/3/configuration/get-primary-translations'],
        labelPos: 'left',
        type: 'select',
        title: 'Your language',
        options: ['ar-AE', 'ar-SA', 'be-BY', 'bg-BG', 'bn-BD', 'ca-ES', 'ch-GU', 'cn-CN', 'cs-CZ', 'da-DK', 'de-AT', 'de-CH', 'de-DE', 'el-GR', 'en-AU', 'en-CA', 'en-GB', 'en-IE', 'en-NZ', 'en-US', 'eo-EO', 'es-ES', 'es-MX', 'et-EE', 'eu-ES', 'fa-IR', 'fi-FI', 'fr-CA', 'fr-FR', 'gl-ES', 'he-IL', 'hi-IN', 'hu-HU', 'id-ID', 'it-IT', 'ja-JP', 'ka-GE', 'kk-KZ', 'kn-IN', 'ko-KR', 'lt-LT', 'lv-LV', 'ml-IN', 'ms-MY', 'ms-SG', 'nb-NO', 'nl-NL', 'no-NO', 'pl-PL', 'pt-BR', 'pt-PT', 'ro-RO', 'ru-RU', 'si-LK', 'sk-SK', 'sl-SI', 'sq-AL', 'sr-RS', 'sv-SE', 'ta-IN', 'te-IN', 'th-TH', 'tl-PH', 'tr-TR', 'uk-UA', 'vi-VN', 'zh-CN', 'zh-HK', 'zh-TW', 'zu-ZA'],
        default: 'en-US'
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
      },
      visualDebugging: {
        label: 'Visual Debugging',
        labelPos: 'right',
        type: 'checkbox',
        default: false
      }
    },
    css: ':root{--mainBackground:#343433;--background:#282828;--text:#fff}#trakt-config{background-color:var(--mainBackground);color:var(--text)}#trakt-config .section_header{background-color:var(--background);border-bottom:none;border:1px solid var(--background);color:var(--text)}#trakt-config .section_desc{background-color:var(--background);border-top:none;border:1px solid var(--background);color:var(--text)}#trakt-config .reset{color:var(--text)}',
    events: {
      init: () => {
        if (!GM_config.isOpen && (GM_config.get('TMDbApiKey') === '' | GM_config.get('TraktClientID') === '')) {
          window.addEventListener('load', () => GM_config.open())
        }
      },
      save: () => {
        if (GM_config.isOpen && (GM_config.get('TMDbApiKey') === '' | GM_config.get('TraktClientID') === '')) {
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
    language: GM_config.get('language'),
    debug: GM_config.get('debugging')
  })

  //* Functions
  /**
   * Returns if translated
   * @param {Object}    item Item to be translated
   * @returns {boolean}
   */
  const isTranslated = (item) => $(item).is('.translate, .untranslatable, .translated')

  /**
   * Returns infos from Trakt
   * @param {Object}    item Item to be translated
   * @returns {Object}
   */
  const getInfos = (item) => {
    const infos = {}

    infos.type = $(item).data('type') // item type

    if ($(item).data('movie-id')) { // Trakt ID
      infos.id = $(item).data('movie-id')
    } else if ($(item).data('episode-id')) {
      infos.id = $(item).data('episode-id')
    } else if ($(item).data('show-id')) {
      infos.id = $(item).data('show-id')
    } else {
      infos.id = undefined
    }

    if (infos.type === 'season') { // season number
      infos.season = (
        $(item).data('season-number')
          ? $(item).data('season-number')
          : undefined
      )
    }

    return infos
  }

  /**
   * Translate poster
   * @param {Object}  item  Item to be translated
   * @param {string}  path  Poster path
   * @param {string}  size  Poster size
   */
  const translatePoster = (item, path, size) => {
    const url = `https://image.tmdb.org/t/p/${size}${path}`
    const cases = {
      a: $(item).find('.poster:not(.screenshot) .real'), // main
      b: $(item).find('.sidebar .poster .real'), // details page
      c: $(item).find('.mobile-poster .poster .real') // details page
    }

    $.each(cases, (key, value) => {
      if (value.length === 1) {
        $(value).removeAttr('data-original').removeAttr('src').attr('src', url)

        if (GM_config.get('visualDebugging')) $(value).css('border', '2px solid #FF355E')
      }
    })
  }

  /**
   * Translate backdrop
   * @param {Object}  item  Item to be translated
   * @param {string}  path  Backdrop path
   * @param {string}  size  Backdrop size
   */
  const translateBackdrop = (item, path, size) => {
    const url = `https://image.tmdb.org/t/p/${size}${path}`
    const cases = {
      a: $(item).find('#summary-wrapper .full-screenshot'),
      b: $(item).find('.fanart .real'),
      c: $(item).find('.screenshot .real')
    }

    $.each(cases, (key, value) => {
      if (value.length === 1) {
        if (key === 'a') {
          $(value).css('background-image', `url('${url}')`)
        } else {
          $(value).removeAttr('data-original').removeAttr('src').attr('src', url)
        }

        if (GM_config.get('visualDebugging')) $(value).css('border', '2px solid #FF00CC')
      }
    })
  }

  /**
   * Translate main title
   * @param {Object}  item  Item to be translated
   * @param {string}  title Main title
   * @returns
   */
  const translateMainTitle = (item, title) => {
    let target

    switch (true) {
      case $(item).find('#summary-wrapper .summary .container h1 .main-title').length > 0: // details page (episode)
        target = $(item).find('#summary-wrapper .summary .container h1 .main-title')
        break
      case $(item).find('#summary-wrapper .summary .container h1').length > 0: // details page
        target = $(item).find('#summary-wrapper .summary .container h1')
        break
      case $(item).parent().find('> .under-info > .titles .main-title').length > 0: // season page
        target = $(item).parent().find('> .under-info > .titles .main-title')
        break
      case $(item).find('> .titles > a > h3 > .main-title').length > 0: // poster - episode on deck
        target = $(item).find('> .titles > a > h3 > .main-title')
        break
      case $(item).find('> .titles-link > .titles > h3 > .main-title').length > 0: // poster/fanart - episode
        target = $(item).find('> .titles-link > .titles > h3 > .main-title')
        break
      case $(item).find('> .titles-link > .titles > h3:not(:has(> .main-title))').length > 0: // poster - movie/show/season
        target = $(item).find('> .titles-link > .titles > h3:not(:has(> .main-title))')
        break
      case $(item).find('> .titles > .titles-link > h3').length > 0: // poster - recommendations
        target = $(item).find('> .titles > .titles-link > h3')
        break
      case $(item).find('> a > .fanart > .titles > h3 > .main-title').length > 0: // fanart - episode
        target = $(item).find('> a > .fanart > .titles > h3 > .main-title')
        break
      case $(item).find('> a > .fanart > .titles > h3:not(:has(> .main-title))').length > 0: // fanart - movie
        target = $(item).find('> a > .fanart > .titles > h3:not(:has(> .main-title))')
        break
      default: {
        target = undefined
      }
    }

    if (!target) return

    const year = target.find('.year')
    const certification = target.find('.certification')

    target.text(title).append(' ').append(year).append(certification)

    if (GM_config.get('visualDebugging')) target.css('color', '#66FF66')
  }

  /**
   * Translate title
   * @param {Object}  item      Item to be translated
   * @param {string}  title     Title
   * @param {string}  subTitle  Subtitle
   * @returns
   */
  const translateTitle = (item, title, subTitle) => {
    let target

    switch (true) {
      case $(item).find('#summary-wrapper .summary .container h2 a').length > 0: // details page
        target = $(item).find('#summary-wrapper .summary .container h2 a')
        break
      case $(item).find('> .titles > h4 > .titles-link:last-child').length > 0: // poster - episode on deck
        target = $(item).find('> .titles > h4 > .titles-link:last-child')
        break
      case $(item).find('> .titles-link > .titles > h4:first-of-type:not(:has(> .format-date)):not(:contains("\u00A0")):not(:contains("episode"))').length > 0: // poster - calendar
        target = $(item).find('> .titles-link > .titles > h4:first-of-type:not(:has(> .format-date)):not(:contains("\u00A0")):not(:contains("episode"))')
        break
      case $(item).find('> a > .fanart > .titles > h5').length > 0: // fanart - episode
        target = $(item).find('> a > .fanart > .titles > h5')
        break
      default: {
        target = undefined
      }
    }

    if (!target) return

    target.text(title)

    if (GM_config.get('visualDebugging')) target.css('color', '#50BFE6')

    if (subTitle) { // episode details page
      $(item).find('#summary-wrapper .summary .container h2 a:first-child').text(title).append(': ')
      $(item).find('#summary-wrapper .summary .container h2 a:last-child').text(subTitle)

      if (GM_config.get('visualDebugging')) {
        $(item).find('#summary-wrapper .summary .container h2 a:first-child').css('color', '#50BFE6')
        $(item).find('#summary-wrapper .summary .container h2 a:last-child').css('color', '#50BFE6')
      }
    }
  }

  /**
   * Translate tagline
   * @param {Object}  item    Item to be translated
   * @param {string}  tagline Tagline
   * @returns
   */
  const translateTagline = (item, tagline) => {
    const target = (
      $(item).find('#info-wrapper .info #tagline').length > 0
        ? $(item).find('#info-wrapper .info #tagline')
        : undefined
    )

    if (!target) return

    $(target).text(tagline)

    if (GM_config.get('visualDebugging')) target.css('color', '#FFFF66')
  }

  /**
   * Translate overview
   * @param {Object}  item      Item to be translated
   * @param {string}  overview  Overview
   * @returns
   */
  const translateOverview = (item, overview) => {
    const target = (
      $(item).find('#info-wrapper .info #overview p').length > 0 // main
        ? $(item).find('#info-wrapper .info #overview p')
        : ($(item).parent().find('> .under-info > .overview p').length > 0 // if grid season
            ? $(item).parent().find('> .under-info > .overview p')
            : undefined)
    )

    if (!target) return

    target.text(overview)

    if (GM_config.get('visualDebugging')) target.css('color', '#FF9933')
  }

  /**
   * Translate movie
   * @param {Object}  item  Item to be translated
   * @param {Object}  infos Infos from Trakt
   * @param {Object}  data  Data from Trakt API
   * @returns
   */
  const translateMovie = (item, infos, data) => {
    const id = data.movie.ids.tmdb // TMDb ID

    if (!id) { // untranslatable
      $(item).addClass('untranslatable')
      return
    }

    tmdb.moviesDetails(id).then((data) => { // get movie details from TMDb API
      const backdrop = data.backdrop_path // movie backdrop
      const poster = data.poster_path // movie poster
      const mainTitle = data.title // movie title
      const tagline = data.tagline // movie tagline
      const overview = data.overview // movie overview

      if (backdrop) translateBackdrop(item, backdrop, 'original') // translate movie backdrop
      if (poster) translatePoster(item, poster, 'w300') // translate movie poster
      if (mainTitle) translateMainTitle(item, mainTitle) // translate movie title
      if (tagline) translateTagline(item, tagline) // translate movie tagline
      if (overview) translateOverview(item, overview) // translate movie overview

      $(item).removeClass('translate')
      $(item).addClass('translated') // is now translated

      MU.log(`the movie "${mainTitle}" is translated`)
    }).catch((error) => MU.error(error))
  }

  /**
   * Translate show
   * @param {Object}  item  Item to be translated
   * @param {Object}  infos Infos from Trakt
   * @param {Object}  data  Data from Trakt API
   * @returns
   */
  const translateShow = (item, infos, data) => {
    const id = data.show.ids.tmdb // TMDb ID

    if (!id) { // untranslatable
      $(item).addClass('untranslatable')
      return
    }

    tmdb.tvDetails(id).then((data) => { // get show details from TMDb API
      const backdrop = data.backdrop_path // show backdrop
      const poster = data.poster_path // show poster
      const mainTitle = data.name // show title
      const overview = data.overview // show overview

      if (backdrop) translateBackdrop(item, backdrop, 'original') // translate show backdrop
      if (poster) translatePoster(item, poster, 'w300') // translate show poster
      if (mainTitle) translateMainTitle(item, mainTitle) // translate show title
      if (overview) translateOverview(item, overview) // translate show overview

      $(item).removeClass('translate')
      $(item).addClass('translated') // is now translated

      MU.log(`the show "${mainTitle}" is translated`)
    }).catch((error) => MU.error(error))
  }

  /**
   * Translate season
   * @param {Object}  item  Item to be translated
   * @param {Object}  infos Infos from Trakt
   * @param {Object}  data  Data from Trakt API
   * @returns
   */
  const translateSeason = (item, infos, data) => {
    const id = data.show.ids.tmdb // TMDb ID
    const season = infos.season

    if (!id) { // untranslatable
      $(item).addClass('untranslatable')
      return
    }

    tmdb.tvDetails(id).then((data) => { // get show details from TMDb API
      const backdrop = data.backdrop_path // movie backdrop
      const title = data.name

      tmdb.seasonDetails(id, season).then((data) => { // get season details from TMDb API
        const poster = data.poster_path // season poster
        const mainTitle = data.name // season title
        const overview = data.overview // movie overview

        if (backdrop) translateBackdrop(item, backdrop, 'original') // translate show backdrop
        if (poster) translatePoster(item, poster, 'w300') // translate season poster
        if (title) translateTitle(item, title) // translate show title
        if (mainTitle) translateMainTitle(item, mainTitle) // translate season title
        if (overview) translateOverview(item, overview) // translate season overview

        $(item).removeClass('translate')
        $(item).addClass('translated') // is now translated

        MU.log(`the season "${mainTitle} - ${season}" is translated`)
      }).catch((error) => MU.error(error))
    }).catch((error) => MU.error(error))
  }

  /**
   * Translate episode
   * @param {Object}  item  Item to be translated
   * @param {Object}  infos Infos from Trakt
   * @param {Object}  data  Data from Trakt API
   * @returns
   */
  const translateEpisode = (item, infos, data) => {
    const id = data.show.ids.tmdb // TMDb ID
    const episode = data.episode.number
    const season = data.episode.season

    if (!id) { // untranslatable
      $(item).addClass('untranslatable')
      return
    }

    tmdb.tvDetails(id).then((data) => { // get show details from TMDb API
      const seasonData = data.seasons.map((s) => s).find((s) => s.season_number === season) // season data
      const poster = seasonData ? seasonData.poster_path : data.poster_path // show/season poster
      const title = data.name // show title
      const subTitle = seasonData ? seasonData.name : undefined// season title

      tmdb.episodeDetails(id, season, episode).then((data) => { // get episode details from TMDb API
        const backdrop = data.still_path // episode backdrop
        const mainTitle = data.name // episode title
        const overview = data.overview // episode overview

        if (backdrop) translateBackdrop(item, backdrop, 'original') // translate episode backdrop
        if (poster) translatePoster(item, poster, 'w300') // translate show/season poster
        if (title) translateTitle(item, title, subTitle) // translate show/season title
        if (mainTitle) translateMainTitle(item, mainTitle) // translate episode title
        if (overview) translateOverview(item, overview) // translate episode overview

        $(item).removeClass('translate')
        $(item).addClass('translated') // is now translated

        MU.log(`the episode "${title} ${season}x${episode} - ${mainTitle}" is translated`)
      }).catch((error) => MU.error(error))
    }).catch((error) => MU.error(error))
  }

  /**
   * Translate grid items
   * @param {Object}  item  Item to be translated
   */
  const translateGrid = (item) => {
    const translateIfVisible = async () => { // translate visible grid items
      if (!$(item).visible(true, true)) return
      if (isTranslated(item)) return

      $(item).addClass('translate')

      const infos = getInfos(item) // get infos from Trakt webpage

      if (!infos) return

      const type = (infos.type === 'season') ? 'show' : infos.type // season ==> show

      trakt.searchID('trakt', infos.id, type).then((data) => { // get TMDb ID from Trakt API
        if (infos.type === 'movie') translateMovie(item, infos, data[0]) // translate movie
        if (infos.type === 'show') translateShow(item, infos, data[0]) // translate show
        if (infos.type === 'season') translateSeason(item, infos, data[0]) // translate season
        if (infos.type === 'episode') translateEpisode(item, infos, data[0]) // translate episode
      }).catch((error) => MU.error(error))
    }

    $(document).scroll(translateIfVisible)
    $(window).resize(translateIfVisible)
    translateIfVisible()
  }

  //* NodeCreationObserver
  NodeCreationObserver.init('observed-translate')
  NodeCreationObserver.onCreation('.movies.show', (item) => { // movie
    $(document).ready(() => {
      $(item).addClass('translate')

      const infos = getInfos($(item).find('.btn-watch[data-movie-id]')) // get infos from Trakt webpage

      if (!infos) return

      trakt.searchID('trakt', infos.id, infos.type).then((data) => { // get TMDb ID from Trakt API
        translateMovie(item, infos, data[0]) // translate movie
      }).catch((error) => MU.error(error))
    })
  })
  NodeCreationObserver.onCreation('.shows.show', (item) => { // show
    $(document).ready(() => {
      $(item).addClass('translate')

      const infos = getInfos($(item).find('.btn-watch[data-show-id]')) // get infos from Trakt webpage

      if (!infos) return

      trakt.searchID('trakt', infos.id, infos.type).then((data) => { // get TMDb ID from Trakt API
        translateShow(item, infos, data[0]) // translate show
      }).catch((error) => MU.error(error))
    })
  })
  NodeCreationObserver.onCreation('.shows.season', (item) => { // season
    $(document).ready(() => {
      $(item).addClass('translate')

      const infos = getInfos($(item).find('.btn-watch[data-season-id]')) // get infos from Trakt webpage

      if (!infos) return

      const type = (infos.type === 'season') ? 'show' : infos.type // season ==> show

      trakt.searchID('trakt', infos.id, type).then((data) => { // get TMDb ID from Trakt API
        translateSeason(item, infos, data[0]) // translate season
      }).catch((error) => MU.error(error))
    })
  })
  NodeCreationObserver.onCreation('.shows.episode', (item) => { // episode
    $(document).ready(() => {
      $(item).addClass('translate')

      const infos = getInfos($(item).find('.btn-checkin[data-show-id]')) // get infos from Trakt webpage

      if (!infos) return

      trakt.searchID('trakt', infos.id, infos.type).then((data) => { // get TMDb ID from Trakt API
        translateEpisode(item, infos, data[0])
      }).catch((error) => MU.error(error))
    })
  })
  NodeCreationObserver.onCreation('body:not(.people) .grid-item', (item) => { // grid
    $(document).ready(() => {
      translateGrid(item)
    })
  })
  NodeCreationObserver.onCreation('.loaded', () => { // grid loaded items
    $('.loaded').ready(() => {
      translateGrid()
    })
  })
})()
