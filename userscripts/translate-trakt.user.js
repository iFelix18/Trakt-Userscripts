// ==UserScript==
// @name               Translate Trakt
// @name:de            Übersetzen Trakt
// @name:es            Traducir Trakt
// @name:fr            Traduire Trakt
// @name:it            Traduci Trakt
// @name:ru            Перевести Trakt
// @name:zh-CN         翻译Trakt
// @author             Davide <iFelix18@protonmail.com>
// @namespace          https://github.com/iFelix18
// @icon               https://www.google.com/s2/favicons?sz=64&domain=https://trakt.tv
// @description        Translates titles, plots, taglines and posters of movies, TV series and episodes in the choice language
// @description:de     Übersetzt Titel, Plots, Taglines und Plakate von Filmen, TV-Serien und Episoden in die gewünschte Sprache
// @description:es     Traduce títulos, argumentos, eslóganes y carteles de películas, series de televisión y episodios en el idioma elegido
// @description:fr     Traduire les titres, les intrigues, les slogans et les affiches de films, de séries télévisées et d'épisodes dans la langue choisie
// @description:it     Traduce titoli, trame, tagline e poster di film, serie TV ed episodi nella lingua scelta
// @description:ru     Переводит названия, сюжеты, теглайны и постеры фильмов, сериалов и эпизодов на выбранный язык
// @description:zh-CN  翻译电影、电视剧和剧集的标题、剧情、标语和海报的选择语言
// @copyright          2019, Davide (https://github.com/iFelix18)
// @license            MIT
// @version            5.0.0
// @homepage           https://github.com/iFelix18/Trakt-Userscripts#readme
// @homepageURL        https://github.com/iFelix18/Trakt-Userscripts#readme
// @supportURL         https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL          https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/translate-trakt.meta.js
// @downloadURL        https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/translate-trakt.user.js
// @require            https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@2207c5c1322ebb56e401f03c2e581719f909762a/gm_config.min.js
// @require            https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js
// @require            https://cdn.jsdelivr.net/npm/@ifelix18/utils@6.2.1/lib/index.min.js
// @require            https://cdn.jsdelivr.net/npm/@ifelix18/trakt@2.3.1/lib/index.min.js
// @require            https://cdn.jsdelivr.net/npm/@ifelix18/tmdb@2.2.1/lib/index.min.js
// @match              *://trakt.tv/*
// @connect            api.trakt.tv
// @connect            api.themoviedb.org
// @compatible         chrome
// @compatible         edge
// @compatible         firefox
// @compatible         safari
// @grant              GM_getValue
// @grant              GM_setValue
// @grant              GM.deleteValue
// @grant              GM.getValue
// @grant              GM.listValues
// @grant              GM.registerMenuCommand
// @grant              GM.setValue
// @grant              GM.xmlHttpRequest
// @run-at             document-idle
// @inject-into        content
// ==/UserScript==

/* global $, GM_config, TMDb, Trakt, UU */

(() => {
  //* Constants
  const tml = 3600 // 3600 seconds = 1 hour
  const id = GM.info.script.name.toLowerCase().replace(/\s/g, '-')
  const title = `${GM.info.script.name} v${GM.info.script.version} Settings`
  const fields = {
    TMDbApiKey: {
      label: 'TMDb API Key',
      section: ['TMDb', 'Get one at: https://developers.themoviedb.org/3/'],
      labelPos: 'left',
      type: 'text',
      title: 'Your TMDb API Key',
      size: 70,
      default: ''
    },
    TraktClientID: {
      label: 'Trakt Client ID',
      section: ['Trakt', 'Get one at: https://trakt.tv/oauth/applications/new'],
      labelPos: 'left',
      type: 'text',
      title: 'Your Trakt Client ID',
      size: 70,
      default: ''
    },
    language: {
      label: 'Language code',
      section: ['Language', 'More info at: https://developers.themoviedb.org/3/configuration/get-primary-translations'],
      labelPos: 'left',
      type: 'select',
      title: 'Your language code',
      options: ['af-ZA', 'ar-AE', 'ar-SA', 'be-BY', 'bg-BG', 'bn-BD', 'ca-ES', 'ch-GU', 'cn-CN', 'cs-CZ', 'cy-GB', 'da-DK', 'de-AT', 'de-CH', 'de-DE', 'el-GR', 'en-AU', 'en-CA', 'en-GB', 'en-IE', 'en-NZ', 'en-US', 'eo-EO', 'es-ES', 'es-MX', 'et-EE', 'eu-ES', 'fa-IR', 'fi-FI', 'fr-CA', 'fr-FR', 'ga-IE', 'gd-GB', 'gl-ES', 'he-IL', 'hi-IN', 'hr-HR', 'hu-HU', 'id-ID', 'it-IT', 'ja-JP', 'ka-GE', 'kk-KZ', 'kn-IN', 'ko-KR', 'ky-KG', 'lt-LT', 'lv-LV', 'ml-IN', 'mr-IN', 'ms-MY', 'ms-SG', 'nb-NO', 'nl-BE', 'nl-NL', 'no-NO', 'pa-IN', 'pl-PL', 'pt-BR', 'pt-PT', 'ro-RO', 'ru-RU', 'si-LK', 'sk-SK', 'sl-SI', 'sq-AL', 'sr-RS', 'sv-SE', 'ta-IN', 'te-IN', 'th-TH', 'tl-PH', 'tr-TR', 'uk-UA', 'vi-VN', 'zh-CN', 'zh-HK', 'zh-SG', 'zh-TW', 'zu-ZA'],
      default: 'en-US'
    },
    logging: {
      label: 'Logging',
      section: ['Develop'],
      labelPos: 'left',
      type: 'checkbox',
      default: true
    },
    debugging: {
      label: 'Debugging',
      labelPos: 'left',
      type: 'checkbox',
      default: false
    },
    visualDebugging: {
      label: 'Visual debugging',
      labelPos: 'left',
      type: 'checkbox',
      default: false
    },
    clearCache: {
      label: 'Clear all the cache',
      type: 'button',
      click: async () => {
        const values = await GM.listValues()

        for (const value of values) {
          const cache = await GM.getValue(value) // get cache
          if (cache.time) { GM.deleteValue(value) } // delete cache
        }

        UU.alert('cache cleared')
      }
    }
  }

  //* GM_config
  UU.migrateConfig('trakt-config', id) // migrate to the new GM_config ID
  GM_config.init({
    id,
    title,
    fields,
    css: ':root{--font:"Montserrat",sans-serif;--background-grey:rgb(29, 29, 29);--black:rgb(0, 0, 0);--dark-grey:rgb(22, 22, 22);--grey:rgb(51, 51, 51);--light-grey:rgb(102, 102, 102);--red:rgb(237, 34, 36);--white:rgb(255, 255, 255)}#translate-trakt *{color:var(--white)!important;font-family:var(--font)!important;font-size:14px!important;font-weight:400!important}#translate-trakt{background:var(--background-grey)!important}#translate-trakt .config_header{font-size:34px!important;line-height:1.1!important;text-shadow:0 0 20px var(--black)!important}#translate-trakt .section_header_holder{background:var(--dark-grey)!important;border:1px solid var(--grey)!important;margin-bottom:1em!important}#translate-trakt .section_header{background:var(--grey)!important;border:1px solid var(--grey)!important;padding:8px!important;text-align:left!important;text-transform:uppercase!important}#translate-trakt .section_desc{background:var(--black)!important;border:1px solid var(--grey)!important;border-left:0!important;border-right:0!important;font-size:13px!important;margin:0!important;padding:10px 8px!important;text-align:left!important}#translate-trakt .config_var{align-items:center!important;display:flex!important;margin:0!important;padding:15px!important}#translate-trakt .field_label{margin-left:6px!important}#translate-trakt select,#translate-trakt_field_TMDbApiKey,#translate-trakt_field_TraktClientID{background-color:var(--grey)!important;border:1px solid var(--light-grey)!important;box-shadow:inset 0 1px 1px rgba(0,0,0,.075)!important;flex:1!important;padding:6px 12px!important}#translate-trakt select:focus,#translate-trakt_field_TMDbApiKey:focus,#translate-trakt_field_TraktClientID:focus{box-shadow:inset 0 1px 1px rgba(0,0,0,.075),0 0 8px rgba(102,175,233,.6)!important;outline:0!important}#translate-trakt button,#translate-trakt input[type=button]{background:var(--grey)!important;border:1px solid transparent!important;padding:10px 16px!important}#translate-trakt button:hover,#translate-trakt input[type=button]:hover{filter:brightness(85%)!important}#translate-trakt_buttons_holder button{background-color:var(--red)!important}#translate-trakt .reset{margin-right:10px!important}',
    events: {
      init: () => {
        window.addEventListener('load', () => { // add style
          $('head').append('<style>@import url(https://fonts.googleapis.com/css2?family=Montserrat&display=swap);header#top-nav .navbar-nav.navbar-user:hover #user-menu{max-height:max-content}</style>')
        })
        if (GM.info.scriptHandler !== 'Userscripts') { //! Userscripts Safari: GM.registerMenuCommand is missing
          GM.registerMenuCommand('Configure', () => GM_config.open())
        }
        if (GM_config.get('TMDbApiKey') === '' || GM_config.get('TraktClientID') === '') { // first configuration
          window.addEventListener('load', () => GM_config.open())
        }
      },
      save: () => {
        if (GM_config.get('TMDbApiKey') === '' || GM_config.get('TraktClientID') === '') {
          UU.alert('check your settings and save')
        } else {
          UU.alert('settings saved')
          GM_config.close()
          setTimeout(window.location.reload(false), 500)
        }
      }
    }
  })

  //* Utils
  UU.init({ id, logging: GM_config.get('logging') })

  //* Trakt API
  const trakt = new Trakt({
    client_id: GM_config.get('TraktClientID'),
    debug: GM_config.get('debugging'),
    cache: {
      active: true,
      time_to_live: tml
    }
  })

  //* TMDb API
  const tmdb = new TMDb({
    api_key: GM_config.get('TMDbApiKey'),
    language: GM_config.get('language'),
    debug: GM_config.get('debugging'),
    cache: {
      active: true,
      time_to_live: tml
    }
  })

  //* Functions
  /**
   * Adds a link to the menu to access the script configuration
   */
  const addSettingsToMenu = () => {
    const menu = `<li class=${id}><a href=""onclick=return!1>${GM.info.script.name}</a>`

    $('#user-menu ul li.separator').last().after(menu)
    $(`.${id}`).click(() => GM_config.open())
  }

  /**
   * Clear old data from the cache
   */
  const clearOldCache = async () => {
    const values = await GM.listValues()

    for (const value of values) {
      const cache = await GM.getValue(value) // get cache
      if ((Date.now() - cache.time) > tml * 1000) { GM.deleteValue(value) } // delete old cache
    }
  }

  /**
   * Returns if translated
   *
   * @param {object} item Item to be translated
   * @returns {boolean} Is translated
   */
  const isTranslated = (item) => $(item).is('.translate, .untranslatable, .translated')

  /**
   * Translate poster
   *
   * @param {object} item Item to be translated
   * @param {string} path Poster path
   * @param {string} size Poster size
   */
  const translatePoster = (item, path, size) => {
    const url = `https://image.tmdb.org/t/p/${size}${path}`
    const $node = $(item).find('.poster .real').filter((index, node) => node.nodeType === 1 && !node.closest('#actors') && !node.closest('#lists'))

    if ($node && path) {
      $.each($node, (key, value) => {
        $(value).removeAttr('data-original').removeAttr('src').attr('src', url)
        if (GM_config.get('visualDebugging')) $(value).css('border', '4px solid #FF00CC')
      })
    }
  }

  /**
   * Translate backdrop
   *
   * @param {object} item Item to be translated
   * @param {string} path Backdrop path
   * @param {string} size Backdrop size
   */
  const translateBackdrop = (item, path, size) => {
    const url = `https://image.tmdb.org/t/p/${size}${path}`
    const $node = $(item).find('.fanart:not(.poster) .real, .screenshot .real, #summary-wrapper .full-screenshot')

    if ($node && path) {
      $.each($node, (key, value) => {
        $(value).css('background-image') !== 'none'
          ? $(value).css('background-image', `url('${url}')`)
          : $(value).removeAttr('data-original').removeAttr('src').attr('src', url)
        if (GM_config.get('visualDebugging')) $node.css('border', '4px solid #FF9933')
      })
    }
  }

  /**
   * Translate title
   *
   * @param {object} item Item to be translated
   * @param {string} originalTitle Original title
   * @param {string} translatedTitle Translated title
   */
  const translateTitle = (item, originalTitle, translatedTitle) => {
    const $node = $(item).parent().find('*').contents().filter((index, node) => node.nodeType === 3 && node.textContent.normalize().replace(/[\p{P}\p{Z}]/gu, '') === originalTitle.normalize().replace(/[\p{P}\p{Z}]/gu, ''))

    if ($node && originalTitle !== translatedTitle) {
      $.each($node, (key, value) => {
        value.textContent.endsWith(': ')
          ? value.textContent = `${translatedTitle}: `
          : (value.textContent.endsWith(' ')
              ? value.textContent = `${translatedTitle} `
              : value.textContent = translatedTitle)
        if (GM_config.get('visualDebugging')) $(value).parent().css('color', '#50BFE6')
      })
    }
  }

  /**
   * Translate tagline
   *
   * @param {object} item Item to be translated
   * @param {string} tagline Tagline
   */
  const translateTagline = (item, tagline) => {
    const $node = $(item).find('#info-wrapper .info #tagline')

    if ($node && tagline) {
      $node.text(tagline)
      if (GM_config.get('visualDebugging')) $($node).parent().css('color', '#50BFE6')
    }
  }

  /**
   * Translate overview
   *
   * @param {object} item Item to be translated
   * @param {string} overview Overview
   */
  const translateOverview = (item, overview) => {
    const $node = $(item).parent().find('#info-wrapper .info #overview, > .under-info > .overview p')

    if ($node && overview) {
      $node.text(overview)
      if (GM_config.get('visualDebugging')) $($node).parent().css('color', '#50BFE6')
    }
  }

  /**
   * Translate movie
   *
   * @param {object} item Item to be translated
   * @param {object} data Data from Trakt API
   */
  const translateMovie = async (item, data) => {
    const id = data.movie.ids.tmdb // TMDb IDk

    if (!id) { // untranslatable
      $(item).removeClass('translate').addClass('untranslatable')
      return
    }

    const movie = await tmdb.movie.details({ movie_id: id }).then().catch(error => UU.error(error)) // show details

    if (!movie) { // untranslatable
      $(item).removeClass('translate').addClass('untranslatable')
      return
    }

    translatePoster(item, movie.poster_path, 'w300') // translate movie poster
    translateBackdrop(item, movie.backdrop_path, 'original') // translate movie backdrop
    translateTitle(item, movie.original_title, movie.title) // translate movie title
    translateTagline(item, movie.tagline) // translate movie tagline
    translateOverview(item, movie.overview) // translate movie overview

    $(item).removeClass('translate').addClass('translated') // is now translated

    UU.log(`the movie "${movie.original_title}" is translated`)
  }

  /**
   * Translate show
   *
   * @param {object} item Item to be translated
   * @param {object} data Data from Trakt API
   */
  const translateShow = async (item, data) => {
    const id = data.show.ids.tmdb // TMDb IDk

    if (!id) { // untranslatable
      $(item).removeClass('translate').addClass('untranslatable')
      return
    }

    const show = await tmdb.tv.details({ tv_id: id }).then().catch(error => UU.error(error)) // show details

    if (!show) { // untranslatable
      $(item).removeClass('translate').addClass('untranslatable')
      return
    }

    translatePoster(item, show.poster_path, 'w300') // translate show poster
    translateBackdrop(item, show.backdrop_path, 'original') // translate episode backdrop
    translateTitle(item, data.show.title, show.name) // translate show title
    translateOverview(item, show.overview) // translate show overview

    $(item).removeClass('translate').addClass('translated') // is now translated

    UU.log(`the show "${data.show.title}" is translated`)
  }

  /**
   * Translate season
   *
   * @param {object} item Item to be translated
   * @param {object} data Data from Trakt API
   */
  const translateSeason = async (item, data) => {
    const id = data.show.ids.tmdb // TMDb ID

    if (!id) { // untranslatable
      $(item).removeClass('translate').addClass('untranslatable')
      return
    }

    const show = await tmdb.tv.details({ tv_id: id }).then().catch(error => UU.error(error)) // show details
    const season = show.seasons.map((season) => season).find((season) => Number(season.season_number) === Number(data.number)) // season details

    if (!show && !season) { // untranslatable
      $(item).removeClass('translate').addClass('untranslatable')
      return
    }

    translatePoster(item, season.poster_path, 'w300') // translate season poster
    translateBackdrop(item, show.backdrop_path, 'original') // translate show backdrop
    translateTitle(item, data.show.title, show.name) // translate show title
    translateTitle(item, data.title, season.name) // translate season title
    translateOverview(item, season.overview) // translate season overview

    $(item).removeClass('translate').addClass('translated') // is now translated

    UU.log(`the season "${data.show.title} - ${data.title}" is translated`)
  }

  /**
   * Translate episode
   *
   * @param {object} item Item to be translated
   * @param {object} data Data from Trakt API
   */
  const translateEpisode = async (item, data) => {
    const id = data.show.ids.tmdb // TMDb IDk

    if (!id) { // untranslatable
      $(item).removeClass('translate').addClass('untranslatable')
      return
    }

    const show = await tmdb.tv.details({ tv_id: id }).then().catch(error => UU.error(error)) // show details
    const season = show.seasons.map((season) => season).find((season) => Number(season.season_number) === Number(data.episode.season)) // season details
    const episode = await tmdb.tv.episode.details({ tv_id: id, season_number: data.episode.season, episode_number: data.episode.number }).then().catch(error => UU.error(error)) // episode details

    if (!show && !season && !episode) { // untranslatable
      $(item).removeClass('translate').addClass('untranslatable')
      return
    }

    translatePoster(item, season.poster_path, 'w300') // translate season poster
    translateBackdrop(item, episode.still_path, 'original') // translate episode backdrop
    translateTitle(item, data.show.title, show.name) // translate show title
    translateTitle(item, data.title, season.name) // translate season title
    translateTitle(item, data.episode.title, episode.name) // translate episode title
    translateOverview(item, episode.overview) // translate episode overview

    $(item).removeClass('translate').addClass('translated') // is now translated

    UU.log(`the episode "${data.show.title} ${episode.season_number}x${episode.episode_number} - ${data.episode.title}" is translated`)
  }

  /**
   * Translate items
   *
   * @param {object} item Item to be translated
   */
  const translateItem = async (item) => {
    clearOldCache() // clear old cache

    if (isTranslated(item)) return

    $(item).addClass('translate') // translate item...

    const infos = $(item).data('movieId') || $(item).data('showId') || $(item).data('seasonId')
      ? $(item).data()
      : $(item).find('*[data-movie-id], *[data-show-id], *[data-season-id]').first().data()

    if (infos.type === 'movie') { // translate movie
      if (!infos.movieId) { // untranslatable
        $(item).removeClass('translate').addClass('untranslatable')
        return
      } else {
        const data = await trakt.search.id({ id_type: 'trakt', id: infos.movieId, type: 'movie' }).then(response => response[0]).catch(error => UU.error(error)) // get movie data from Trakt API
        translateMovie(item, data)
      }
    }
    if (infos.type === 'show') { // translate show
      if (!infos.showId) { // untranslatable
        $(item).removeClass('translate').addClass('untranslatable')
        return
      } else {
        const data = await trakt.search.id({ id_type: 'trakt', id: infos.showId, type: 'show' }).then(response => response[0]).catch(error => UU.error(error)) // get show data from Trakt API
        translateShow(item, data)
      }
    }
    if (infos.type === 'season') { // translate seasons
      if (!infos.showId) { // untranslatable
        $(item).removeClass('translate').addClass('untranslatable')
        return
      } else {
        const data1 = await trakt.search.id({ id_type: 'trakt', id: infos.showId, type: 'show' }).then(response => response[0]).catch(error => UU.error(error)) // get show data from Trakt API
        const data2 = await trakt.seasons.summary({ id: infos.showId, extended: 'full' }).then(response => response.map((season) => season).find((season) => season.number === Number(infos.seasonNumber))).catch(error => UU.error(error)) // get season data from Trakt API
        const data = $.extend({}, data1, data2) // merge data
        translateSeason(item, data)
      }
    }
    if (infos.type === 'episode') { // translate episodes
      if (!infos.episodeId) { // untranslatable
        $(item).removeClass('translate').addClass('untranslatable')
      } else {
        const data1 = await trakt.search.id({ id_type: 'trakt', id: infos.episodeId, type: 'episode' }).then(response => response[0]).catch(error => UU.error(error)) // get episode data from Trakt API
        const data2 = await trakt.seasons.summary({ id: infos.showId, extended: 'full' }).then(response => response.map((season) => season).find((season) => season.number === Number(infos.seasonNumber))).catch(error => UU.error(error)) // get season data from Trakt API
        const data = $.extend({}, data1, data2) // merge data
        translateEpisode(item, data)
      }
    }

    if (GM_config.get('visualDebugging') && !$(item).hasClass('untranslatable')) $(item).css('border', '1px solid #66FF66')
  }

  //* Script
  UU.observe.creation('#user-menu ul', () => addSettingsToMenu()) // link settings to trakt menu
  UU.observe.creation('body:not(.people) .grid-item:visible', (item) => translateItem(item), true) // grid items
  UU.observe.creation('.movies.show, .shows.show, .shows.season, .shows.episode', (item) => translateItem(item)) // main pages
})()
