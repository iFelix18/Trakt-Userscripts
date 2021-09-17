// ==UserScript==
// @name            Translate Trakt
// @name:it         Traduci Trakt
// @author          Davide <iFelix18@protonmail.com>
// @namespace       https://github.com/iFelix18
// @icon            https://www.google.com/s2/favicons?sz=64&domain=trakt.tv
// @description     Translates titles, plots, taglines and posters of movies, TV series and episodes in the choice language
// @description:it  Traduce titoli, trame, tagline e poster di film, serie TV ed episodi nella lingua scelta
// @copyright       2019, Davide (https://github.com/iFelix18)
// @license         MIT
// @version         4.0.0
// @homepage        https://github.com/iFelix18/Trakt-Userscripts#readme
// @homepageURL     https://github.com/iFelix18/Trakt-Userscripts#readme
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/translate-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/translate-trakt.user.js
// @require         https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@43fd0fe4de1166f343883511e53546e87840aeaf/gm_config.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@6a6beccf06c63b180fc2e251f024bb25feac3eb0/lib/utils/utils.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@2a8d621376678f748acb81102f6c07c9d5129e81/lib/api/trakt.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@8c5a008457b859c22300b94b416767b8d2605bb2/lib/api/tmdb.min.js
// @require         https://cdn.jsdelivr.net/npm/gm4-polyfill@1.0.1/gm4-polyfill.min.js#sha256-qmLl2Ly0/+2K+HHP76Ul+Wpy1Z41iKtzptPD1Nt8gSk=
// @require         https://cdn.jsdelivr.net/npm/node-creation-observer@1.2.0/release/node-creation-observer-latest.js#sha256-OlRWIaZ5LD4UKqMHzIJ8Sc0ctSV2pTIgIvgppQRdNUU=
// @require         https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js#sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=
// @require         https://cdn.jsdelivr.net/npm/jquery-visible@1.2.0/jquery.visible.min.js#sha256-VzXcD0HmV1s8RGdJ/yIf7YkZiOZrcxPphaDpwM++pSs=
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

/* global $, GM_config, MonkeyUtils, NodeCreationObserver, TMDb, Trakt */

(() => {
  'use strict'

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
          window.onload = () => GM_config.open()
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
   * @param {Object}    i Item to be translated
   * @returns {boolean}
   */
  const isTranslated = (i) => $(i).is('.translate, .untranslatable, .translated')

  /**
   * Returns infos from Trakt
   * @param {Object}    i Item to be translated
   * @returns {Object}
   */
  const getInfos = (i) => {
    const infos = {}

    infos.type = $(i).data('type') // item type
    infos.id = ( // Trakt ID
      $(i).data('movie-id')
        ? $(i).data('movie-id')
        : $(i).data('episode-id')
          ? $(i).data('episode-id')
          : $(i).data('show-id')
            ? $(i).data('show-id')
            : null
    )

    if (infos.type === 'season') { // season number
      infos.season = (
        $(i).data('season-number')
          ? $(i).data('season-number')
          : null
      )
    }

    return infos
  }

  /**
   * Translate poster
   * @param {Object}  i     Item to be translated
   * @param {string}  path  Poster path
   * @param {string}  size  Poster size
   */
  const translatePoster = (i, path, size) => {
    const url = `https://image.tmdb.org/t/p/${size}${path}`
    const cases = {
      a: $(i).find('.poster:not(.screenshot) .real'), // main
      b: $(i).find('.sidebar .poster .real'), // details page
      c: $(i).find('.mobile-poster .poster .real') // details page
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
   * @param {Object}  i     Item to be translated
   * @param {string}  path  Backdrop path
   * @param {string}  size  Backdrop size
   */
  const translateBackdrop = (i, path, size) => {
    const url = `https://image.tmdb.org/t/p/${size}${path}`
    const cases = {
      a: $(i).find('#summary-wrapper .full-screenshot'),
      b: $(i).find('.fanart .real'),
      c: $(i).find('.screenshot .real')
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
   * @param {Object}  i     Item to be translated
   * @param {string}  title Main title
   * @returns
   */
  const translateMainTitle = (i, title) => {
    const target = (
      $(i).find('#summary-wrapper .summary .container h1 .main-title').length // details page (episode)
        ? $(i).find('#summary-wrapper .summary .container h1 .main-title')
        : $(i).find('#summary-wrapper .summary .container h1').length // details page
          ? $(i).find('#summary-wrapper .summary .container h1')
          : $(i).parent().find('> .under-info > .titles .main-title').length // season page
            ? $(i).parent().find('> .under-info > .titles .main-title')
            : $(i).find('> .titles > a > h3 > .main-title').length // poster - episode on deck
              ? $(i).find('> .titles > a > h3 > .main-title')
              : $(i).find('> .titles-link > .titles > h3 > .main-title').length // poster/fanart - episode
                ? $(i).find('> .titles-link > .titles > h3 > .main-title')
                : $(i).find('> .titles-link > .titles > h3:not(:has(> .main-title))').length // poster - movie/show/season
                  ? $(i).find('> .titles-link > .titles > h3:not(:has(> .main-title))')
                  : $(i).find('> .titles > .titles-link > h3').length // poster - recommendations
                    ? $(i).find('> .titles > .titles-link > h3')
                    : $(i).find('> a > .fanart > .titles > h3 > .main-title').length // fanart - episode
                      ? $(i).find('> a > .fanart > .titles > h3 > .main-title')
                      : $(i).find('> a > .fanart > .titles > h3:not(:has(> .main-title))').length // fanart - movie
                        ? $(i).find('> a > .fanart > .titles > h3:not(:has(> .main-title))')
                        : null
    )

    if (!target) return

    const year = target.find('.year')
    const certification = target.find('.certification')

    target.text(title).append(' ').append(year).append(certification)

    if (GM_config.get('visualDebugging')) target.css('color', '#66FF66')
  }

  /**
   * Translate title
   * @param {Object}  i         Item to be translated
   * @param {string}  title     Title
   * @param {string}  subTitle  Subtitle
   * @returns
   */
  const translateTitle = (i, title, subTitle) => {
    const target = (
      $(i).find('#summary-wrapper .summary .container h2 a').length // details page
        ? $(i).find('#summary-wrapper .summary .container h2 a')
        : $(i).find('> .titles > h4 > .titles-link:last-child').length // poster - episode on deck
          ? $(i).find('> .titles > h4 > .titles-link:last-child')
          : $(i).find('> .titles-link > .titles > h4:first-of-type:not(:has(> .format-date)):not(:contains("\u00a0")):not(:contains("episode"))').length // poster - calendar
            ? $(i).find('> .titles-link > .titles > h4:first-of-type:not(:has(> .format-date)):not(:contains("\u00a0")):not(:contains("episode"))')
            : $(i).find('> a > .fanart > .titles > h5').length // fanart - episode
              ? $(i).find('> a > .fanart > .titles > h5')
              : null
    )

    if (!target) return

    target.text(title)

    if (GM_config.get('visualDebugging')) target.css('color', '#50BFE6')

    if (subTitle) { // episode details page
      $(i).find('#summary-wrapper .summary .container h2 a:first-child').text(title).append(': ')
      $(i).find('#summary-wrapper .summary .container h2 a:last-child').text(subTitle)

      if (GM_config.get('visualDebugging')) {
        $(i).find('#summary-wrapper .summary .container h2 a:first-child').css('color', '#50BFE6')
        $(i).find('#summary-wrapper .summary .container h2 a:last-child').css('color', '#50BFE6')
      }
    }
  }

  /**
   * Translate tagline
   * @param {Object}  i       Item to be translated
   * @param {string}  tagline Tagline
   * @returns
   */
  const translateTagline = (i, tagline) => {
    const target = (
      $(i).find('#info-wrapper .info #tagline').length
        ? $(i).find('#info-wrapper .info #tagline')
        : null
    )

    if (!target) return

    $(target).text(tagline)

    if (GM_config.get('visualDebugging')) target.css('color', '#FFFF66')
  }

  /**
   * Translate overview
   * @param {Object}  i         Item to be translated
   * @param {string}  overview  Overview
   * @returns
   */
  const translateOverview = (i, overview) => {
    const target = (
      $(i).find('#info-wrapper .info #overview p').length // main
        ? $(i).find('#info-wrapper .info #overview p')
        : $(i).parent().find('> .under-info > .overview p').length // if grid season
          ? $(i).parent().find('> .under-info > .overview p')
          : null
    )

    if (!target) return

    target.text(overview)

    if (GM_config.get('visualDebugging')) target.css('color', '#FF9933')
  }

  /**
   * Translate movie
   * @param {Object}  i     Item to be translated
   * @param {Object}  infos Infos from Trakt
   * @param {Object}  data  Data from Trakt API
   * @returns
   */
  const translateMovie = (i, infos, data) => {
    const id = data.movie.ids.tmdb // TMDb ID

    if (!id) { // untranslatable
      $(i).addClass('untranslatable')
      return
    }

    tmdb.moviesDetails(id).then((data) => { // get movie details from TMDb API
      const backdrop = data.backdrop_path // movie backdrop
      const poster = data.poster_path // movie poster
      const mainTitle = data.title // movie title
      const tagline = data.tagline // movie tagline
      const overview = data.overview // movie overview

      if (backdrop) translateBackdrop(i, backdrop, 'original') // translate movie backdrop
      if (poster) translatePoster(i, poster, 'w300') // translate movie poster
      if (mainTitle) translateMainTitle(i, mainTitle) // translate movie title
      if (tagline) translateTagline(i, tagline) // translate movie tagline
      if (overview) translateOverview(i, overview) // translate movie overview

      $(i).removeClass('translate')
      $(i).addClass('translated') // is now translated

      MU.log(`the movie "${mainTitle}" is translated`)
    }).catch((e) => MU.error(e))
  }

  /**
   * Translate show
   * @param {Object}  i     Item to be translated
   * @param {Object}  infos Infos from Trakt
   * @param {Object}  data  Data from Trakt API
   * @returns
   */
  const translateShow = (i, infos, data) => {
    const id = data.show.ids.tmdb // TMDb ID

    if (!id) { // untranslatable
      $(i).addClass('untranslatable')
      return
    }

    tmdb.tvDetails(id).then((data) => { // get show details from TMDb API
      const backdrop = data.backdrop_path // show backdrop
      const poster = data.poster_path // show poster
      const mainTitle = data.name // show title
      const overview = data.overview // show overview

      if (backdrop) translateBackdrop(i, backdrop, 'original') // translate show backdrop
      if (poster) translatePoster(i, poster, 'w300') // translate show poster
      if (mainTitle) translateMainTitle(i, mainTitle) // translate show title
      if (overview) translateOverview(i, overview) // translate show overview

      $(i).removeClass('translate')
      $(i).addClass('translated') // is now translated

      MU.log(`the show "${mainTitle}" is translated`)
    }).catch((e) => MU.error(e))
  }

  /**
   * Translate season
   * @param {Object}  i     Item to be translated
   * @param {Object}  infos Infos from Trakt
   * @param {Object}  data  Data from Trakt API
   * @returns
   */
  const translateSeason = (i, infos, data) => {
    const id = data.show.ids.tmdb // TMDb ID
    const season = infos.season

    if (!id) { // untranslatable
      $(i).addClass('untranslatable')
      return
    }

    tmdb.tvDetails(id).then((data) => { // get show details from TMDb API
      const backdrop = data.backdrop_path // movie backdrop
      const title = data.name

      tmdb.seasonDetails(id, season).then((data) => { // get season details from TMDb API
        const poster = data.poster_path // season poster
        const mainTitle = data.name // season title
        const overview = data.overview // movie overview

        if (backdrop) translateBackdrop(i, backdrop, 'original') // translate show backdrop
        if (poster) translatePoster(i, poster, 'w300') // translate season poster
        if (title) translateTitle(i, title) // translate show title
        if (mainTitle) translateMainTitle(i, mainTitle) // translate season title
        if (overview) translateOverview(i, overview) // translate season overview

        $(i).removeClass('translate')
        $(i).addClass('translated') // is now translated

        MU.log(`the season "${mainTitle} - ${season}" is translated`)
      }).catch((e) => MU.error(e))
    }).catch((e) => MU.error(e))
  }

  /**
   * Translate episode
   * @param {Object}  i     Item to be translated
   * @param {Object}  infos Infos from Trakt
   * @param {Object}  data  Data from Trakt API
   * @returns
   */
  const translateEpisode = (i, infos, data) => {
    const id = data.show.ids.tmdb // TMDb ID
    const episode = data.episode.number
    const season = data.episode.season

    if (!id) { // untranslatable
      $(i).addClass('untranslatable')
      return
    }

    tmdb.tvDetails(id).then((data) => { // get show details from TMDb API
      const seasonData = data.seasons.map((s) => s).filter((s) => s.season_number === season) // season data
      const poster = seasonData[0] ? seasonData[0].poster_path : data.poster_path // show/season poster
      const title = data.name // show title
      const subTitle = seasonData[0] ? seasonData[0].name : null// season title

      tmdb.episodeDetails(id, season, episode).then((data) => { // get episode details from TMDb API
        const backdrop = data.still_path // episode backdrop
        const mainTitle = data.name // episode title
        const overview = data.overview // episode overview

        if (backdrop) translateBackdrop(i, backdrop, 'original') // translate episode backdrop
        if (poster) translatePoster(i, poster, 'w300') // translate show/season poster
        if (title) translateTitle(i, title, subTitle) // translate show/season title
        if (mainTitle) translateMainTitle(i, mainTitle) // translate episode title
        if (overview) translateOverview(i, overview) // translate episode overview

        $(i).removeClass('translate')
        $(i).addClass('translated') // is now translated

        MU.log(`the episode "${title} ${season}x${episode} - ${mainTitle}" is translated`)
      }).catch((e) => MU.error(e))
    }).catch((e) => MU.error(e))
  }

  /**
   * Translate grid items
   * @param {Object}  i  Item to be translated
   */
  const translateGrid = (i) => {
    const translateIfVisible = async () => { // translate visible grid items
      if (!$(i).visible(true, true)) return
      if (isTranslated(i)) return

      $(i).addClass('translate')

      const infos = getInfos(i) // get infos from Trakt webpage

      if (!infos) return

      const type = (infos.type === 'season') ? 'show' : infos.type // season ==> show

      trakt.searchID('trakt', infos.id, type).then((data) => { // get TMDb ID from Trakt API
        if (infos.type === 'movie') translateMovie(i, infos, data[0]) // translate movie
        if (infos.type === 'show') translateShow(i, infos, data[0]) // translate show
        if (infos.type === 'season') translateSeason(i, infos, data[0]) // translate season
        if (infos.type === 'episode') translateEpisode(i, infos, data[0]) // translate episode
      }).catch((e) => MU.error(e))
    }

    $(document).scroll(translateIfVisible)
    $(window).resize(translateIfVisible)
    translateIfVisible()
  }

  //* NodeCreationObserver
  NodeCreationObserver.init('observed-translate')
  NodeCreationObserver.onCreation('.movies.show', (i) => { // movie
    $(document).ready(() => {
      $(i).addClass('translate')

      const infos = getInfos($(i).find('.btn-watch[data-movie-id]')) // get infos from Trakt webpage

      if (!infos) return

      trakt.searchID('trakt', infos.id, infos.type).then((data) => { // get TMDb ID from Trakt API
        translateMovie(i, infos, data[0]) // translate movie
      }).catch((e) => MU.error(e))
    })
  })
  NodeCreationObserver.onCreation('.shows.show', (i) => { // show
    $(document).ready(() => {
      $(i).addClass('translate')

      const infos = getInfos($(i).find('.btn-watch[data-show-id]')) // get infos from Trakt webpage

      if (!infos) return

      trakt.searchID('trakt', infos.id, infos.type).then((data) => { // get TMDb ID from Trakt API
        translateShow(i, infos, data[0]) // translate show
      }).catch((e) => MU.error(e))
    })
  })
  NodeCreationObserver.onCreation('.shows.season', (i) => { // season
    $(document).ready(() => {
      $(i).addClass('translate')

      const infos = getInfos($(i).find('.btn-watch[data-season-id]')) // get infos from Trakt webpage

      if (!infos) return

      const type = (infos.type === 'season') ? 'show' : infos.type // season ==> show

      trakt.searchID('trakt', infos.id, type).then((data) => { // get TMDb ID from Trakt API
        translateSeason(i, infos, data[0]) // translate season
      }).catch((e) => MU.error(e))
    })
  })
  NodeCreationObserver.onCreation('.shows.episode', (i) => { // episode
    $(document).ready(() => {
      $(i).addClass('translate')

      const infos = getInfos($(i).find('.btn-checkin[data-show-id]')) // get infos from Trakt webpage

      if (!infos) return

      trakt.searchID('trakt', infos.id, infos.type).then((data) => { // get TMDb ID from Trakt API
        translateEpisode(i, infos, data[0])
      }).catch((e) => MU.error(e))
    })
  })
  NodeCreationObserver.onCreation('body:not(.people) .grid-item', (i) => { // grid
    $(document).ready(() => {
      translateGrid(i)
    })
  })
  NodeCreationObserver.onCreation('.loaded', () => { // grid loaded items
    $('.loaded').ready(() => {
      translateGrid()
    })
  })
})()
