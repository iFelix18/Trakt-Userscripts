// ==UserScript==
// @name            Translate Trakt
// @name:it         Traduci Trakt
// @author          Felix
// @namespace       https://github.com/iFelix18
// @description     Translates titles, plots, taglines and posters of movies, TV series and episodes in the choice language
// @description:it  Traduce titoli, trame, tagline e poster di film, serie TV ed episodi nella lingua scelta
// @copyright       2019, Felix (https://github.com/iFelix18)
// @license         MIT
// @version         3.0.2
//
// @homepageURL     https://git.io/Trakt-Userscripts
// @homepageURL     https://greasyfork.org/scripts/377969-translate-trakt
// @homepageURL     https://openuserjs.org/scripts/iFelix18/Translate_Trakt
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/translate-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/translate-trakt.user.js
//
// @require         https://cdn.jsdelivr.net/gh/greasemonkey/gm4-polyfill@master/gm4-polyfill.min.js
// @require         https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@master/gm_config.min.js
// @require         https://cdn.jsdelivr.net/gh/soufianesakhi/node-creation-observer-js@master/release/node-creation-observer-1.2.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@master/lib/utils/utils.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@master/lib/api/trakt.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@master/lib/api/tmdb.min.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.4.1/dist/jquery.min.js#sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=
// @require         https://cdn.jsdelivr.net/npm/jquery-visible@1.2.0/jquery.visible.min.js#sha256-VzXcD0HmV1s8RGdJ/yIf7YkZiOZrcxPphaDpwM++pSs=
//
// @match           *://trakt.tv/*
// @connect         api.trakt.tv
// @connect         api.themoviedb.org
//
// @grant           GM.info
// @grant           GM_info
// @grant           GM.setValue
// @grant           GM_setValue
// @grant           GM.getValue
// @grant           GM_getValue
// @grant           GM.deleteValue
// @grant           GM_deleteValue
// @grant           GM.registerMenuCommand
// @grant           GM_registerMenuCommand
// @grant           GM.xmlHttpRequest
// @grant           GM_xmlhttpRequest
//
// @run-at          document-start
// @inject-into     page
// ==/UserScript==

/* global $, GM_config, NodeCreationObserver, MonkeyUtils, TMDb , Trakt */

(() => {
  'use strict'

  //* GM_config
  GM_config.init({
    id: 'trakt-config',
    title: `${GM.info.script.name} v${GM.info.script.version} Settings`,
    fields: {
      tmdbapikey: {
        label: 'TMDb API Key',
        section: ['Enter your TMDb API Key', 'Get one at: https://developers.themoviedb.org/3/'],
        type: 'text',
        title: 'Your TMDb API Key',
        size: 70,
        default: ''
      },
      traktapikey: {
        label: 'Trakt API Key',
        section: ['Enter your Trakt API Key (Client ID)', 'Get one at: https://trakt.tv/oauth/applications/new'],
        type: 'text',
        title: 'Your Trakt API Key',
        size: 70,
        default: ''
      },
      language: {
        label: 'Language',
        section: ['Select the code of your language', 'More info at: https://developers.themoviedb.org/3/configuration/get-primary-translations'],
        type: 'select',
        title: 'Your language',
        options: ['ar-AE', 'ar-SA', 'be-BY', 'bg-BG', 'bn-BD', 'ca-ES', 'ch-GU', 'cn-CN', 'cs-CZ', 'da-DK', 'de-AT', 'de-CH', 'de-DE', 'el-GR', 'en-AU', 'en-CA', 'en-GB', 'en-IE', 'en-NZ', 'en-US', 'eo-EO', 'es-ES', 'es-MX', 'et-EE', 'eu-ES', 'fa-IR', 'fi-FI', 'fr-CA', 'fr-FR', 'gl-ES', 'he-IL', 'hi-IN', 'hu-HU', 'id-ID', 'it-IT', 'ja-JP', 'ka-GE', 'kk-KZ', 'kn-IN', 'ko-KR', 'lt-LT', 'lv-LV', 'ml-IN', 'ms-MY', 'ms-SG', 'nb-NO', 'nl-NL', 'no-NO', 'pl-PL', 'pt-BR', 'pt-PT', 'ro-RO', 'ru-RU', 'si-LK', 'sk-SK', 'sl-SI', 'sq-AL', 'sr-RS', 'sv-SE', 'ta-IN', 'te-IN', 'th-TH', 'tl-PH', 'tr-TR', 'uk-UA', 'vi-VN', 'zh-CN', 'zh-HK', 'zh-TW', 'zu-ZA'],
        default: 'en-US'
      },
      logging: {
        label: 'Logging',
        section: ['Develop'],
        labelPos: 'above',
        type: 'checkbox',
        default: false
      },
      debugging: {
        label: 'Debugging',
        labelPos: 'above',
        type: 'checkbox',
        default: false
      }
    },
    css: '#trakt-config{background-color:#343434;color:#fff}#trakt-config *{font-family:varela round,helvetica neue,Helvetica,Arial,sans-serif}#trakt-config .section_header{background-color:#282828;border:1px solid #282828;border-bottom:none;color:#fff;font-size:10pt}#trakt-config .section_desc{background-color:#282828;border:1px solid #282828;border-top:none;color:#fff;font-size:10pt}#trakt-config .reset{color:#fff}',
    events: {
      init: () => {
        if (!GM_config.isOpen && (GM_config.get('tmdbapikey') === '' | GM_config.get('traktapikey') === '')) {
          window.onload = () => GM_config.open()
        }
      },
      save: () => {
        if (GM_config.isOpen && (GM_config.get('tmdbapikey') === '' | GM_config.get('traktapikey') === '')) {
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
    author: 'Felix',
    color: '#ed1c24',
    logging: GM_config.get('logging')
  })
  MU.init('trakt-config')

  //* Trakt API
  const trakt = new Trakt({
    apikey: GM_config.get('traktapikey'),
    language: GM_config.get('language'),
    debug: GM_config.get('debugging')
  })

  //* TMDb API
  const tmdb = new TMDb({
    apikey: GM_config.get('tmdbapikey'),
    language: GM_config.get('language'),
    debug: GM_config.get('debugging')
  })

  //* functions
  const isTranslated = (i) => $(i).is('.translate, .untranslatable, .translated') // check if it is translated

  const getInfos = (i) => { // get infos from Trakt webpage
    const infos = {}
    const type = $(i).data('type') // item type
    const id = ( // Trakt ID
      (type === 'movie') ? $(i).data('movie-id') // movie Trakt ID
        : (type === 'episode') ? $(i).data('episode-id') // episode Trakt ID
          : $(i).data('show-id') // show Trakt ID
    )
    infos.type = type
    infos.id = id
    if (type === 'episode') { // episode and season number
      const sxe = ( // seasonXepisode
        ($(i).find('h3 .main-title-sxe').length > 0) ? $(i).find('h3 .main-title-sxe').text().split('x')
          : ($(i).parents().find('h1 .main-title-sxe').length > 0) ? $(i).parents().find('h1 .main-title-sxe').text().split('x') // edpisode details page
            : null
      )
      const s = (sxe !== null) ? parseInt(sxe[0]) : '' // season
      const e = (sxe !== null) ? parseInt(sxe[1]) : '' // episode
      infos.season = s
      infos.episode = e
    }
    if (type === 'season') { // season number
      const s = ( // season
        ($(i).data('season-number')) ? $(i).data('season-number')
          : $(i).data('number')
      )
      infos.season = s
    }
    return infos
  }

  const translatePoster = (i, posterPath, size) => { // translate poster
    const url = `https://image.tmdb.org/t/p/${size}${posterPath}`
    const cases = {
      a: $(i).find('.poster:not(.screenshot) .real'),
      b: $(i).find('.sidebar .poster .real'), // details page
      c: $(i).find('.mobile-poster .poster .real') // details page
    }
    $.each(cases, (key, value) => {
      if (value.length === 1) $(value).removeAttr('data-original').removeAttr('src').attr('src', url)
    })
  }

  const translateTitle = (i, title) => { // translate title
    const container = $(i).find('#summary-wrapper .summary .container h1')
    if (container.find('.main-title').length > 0) { // episode details page
      container.find('.main-title').text(title)
    } else {
      const year = container.find('.year')
      const certification = container.find('.certification')
      container.text(title).append(' ').append(year).append(certification)
    }
  }

  const translateMainTitle = (i, title, secondTitle) => { // translate main title
    if (secondTitle) { // episode deatails page
      $(i).find('#summary-wrapper .summary .container h2 a:first-child').text(title).append(': ')
      $(i).find('#summary-wrapper .summary .container h2 a:last-child').text(secondTitle)
    } else {
      $(i).find('#summary-wrapper .summary .container h2 a:first-child').text(title)
    }
  }

  const translateGridTitle = (i, title) => { // translate title on grid
    if ($(i).parent('.fanarts').length > 0) { // fanart
      $(i).find('.titles h5').text(title)
    } else {
      if ($(i).find('h4 .titles-link:last-of-type').length === 0) { // screnshoot
        $(i).find('.titles h4:first-of-type').text(title)
      } else { // poster
        $(i).find('h4 .titles-link:last-of-type').text(title)
      }
    }
  }

  const translateGridMainTitle = (i, title) => { // translate main title on grid
    if ($(i).parent('.row.fanarts.sortable').length > 0) { // is an episode on season details
      $(i).parent().find('.main-title').text(title)
    } else {
      if ($(i).find('.main-title').length > 0) $(i).find('.main-title').text(title) // is an episode
      if (!$(i).find('.main-title').length > 0) $(i).find('.titles h3').text(title) // is a movie or show
    }
  }

  const translateTagline = (i, tagline) => { // translate tagline
    $(i).find('#info-wrapper .info #tagline').text(tagline)
  }

  const translateOverview = (i, overview) => { // translate overview
    $(i).find('#info-wrapper .info #overview p').text(overview)
  }

  const translateGridOverview = (i, overview) => { // translate overview on grid
    $(i).parent().find('.overview p').text(overview)
  }

  const translateMovie = (i) => { // translate movie
    const infos = getInfos($(i).find('.btn-list[data-movie-id]')) // get infos from Trakt webpage
    if (!infos) return

    trakt.searchID('trakt', infos.id, infos.type).then((data) => { // get TMDb ID from Trakt API
      const id = data.movie.ids.tmdb // TMDb ID
      if (!id) $(i).addClass('untranslatable') // untranslatable
      tmdb.moviesDetails(id).then((data) => { // get movie details from TMDb API
        const title = data.title // movie title
        const tagline = data.tagline // movie tagline
        const overview = data.overview // movie overview
        const poster = data.poster_path // movie poster
        if (title) translateTitle(i, title) // translate movie title
        if (tagline && tagline !== '') translateTagline(i, tagline) // translate movie tagline
        if (overview && overview !== '') translateOverview(i, overview) // translate movie overview
        if (poster && poster !== null) translatePoster(i, poster, 'w300') // translate movie poster
        $(i).removeClass('translate')
        $(i).addClass('translated') // is now translated
        MU.log(`the ${infos.type} "${title}" is translated`)
      }).catch((e) => MU.error(e))
    }).catch((e) => MU.error(e))
  }

  const translateGridMovie = (i, infos, data) => { // translate movie on grid
    const id = data.movie.ids.tmdb // TMDb ID
    if (!id) $(i).addClass('untranslatable') // untranslatable

    tmdb.moviesDetails(id).then((data) => { // get movie details from TMDb API
      const title = data.title // movie title
      const poster = data.poster_path // movie poster
      if (title) translateGridMainTitle(i, title) // translate movie title
      if (poster !== null) translatePoster(i, poster, 'w300') // translate movie poster
      $(i).removeClass('translate')
      $(i).addClass('translated') // is now translated
      MU.log(`the ${infos.type} "${title}" is translated`)
    }).catch((e) => MU.error(e))
  }

  const translateShow = (i) => { // translate show
    const infos = getInfos($(i).find('.btn-list[data-show-id]')) // get infos from Trakt webpage
    if (!infos) return

    trakt.searchID('trakt', infos.id, infos.type).then((data) => { // get TMDb ID from Trakt API
      const id = data.show.ids.tmdb // TMDb ID
      if (!id) $(i).addClass('untranslatable') // untranslatable
      tmdb.tvDetails(id).then((data) => { // get show details from TMDb API
        const title = data.name // show title
        const overview = data.overview // show overview
        const poster = data.poster_path // show poster
        if (title) translateTitle(i, title) // translate title
        if (overview && overview !== '') translateOverview(i, overview) // translate show overview
        if (poster && poster !== null) translatePoster(i, poster, 'w300') // translate show poster
        $(i).removeClass('translate')
        $(i).addClass('translated') // is now translated
        MU.log(`the ${infos.type} "${title}" is translated`)
      }).catch((e) => MU.error(e))
    }).catch((e) => MU.error(e))
  }

  const translateGridShow = (i, infos, data) => { // translate show on grid
    const id = data.show.ids.tmdb // TMDb ID
    if (!id) $(i).addClass('untranslatable') // untranslatable

    tmdb.tvDetails(id).then((data) => { // get show details from TMDb API
      const title = data.name // show title
      const poster = data.poster_path // show poster
      if (title) translateGridMainTitle(i, title) // translate show title
      if (poster !== null) translatePoster(i, poster, 'w300') // translate show poster
      $(i).removeClass('translate')
      $(i).addClass('translated') // is now translated
      MU.log(`the ${infos.type} "${title}" is translated`)
    }).catch((e) => MU.error(e))
  }

  const translateSeason = (i) => { // translate season
    const infos = getInfos($(i).find('.btn-list')) // get infos from Trakt webpage
    if (!infos) return

    const type = (infos.type === 'season') ? 'show' : infos.type // season ==> show

    trakt.searchID('trakt', infos.id, type).then((data) => { // get TMDb ID from Trakt API
      const id = data.show.ids.tmdb // TMDb ID
      if (!id) $(i).addClass('untranslatable') // untranslatable
      tmdb.tvDetails(id).then((data) => { // get show details from TMDb API
        const sn = infos.season // season number
        const title = data.name // show title
        const seasonTitle = data.seasons[sn].name // season title
        const overview = data.seasons[sn].overview // show overview
        const poster = data.seasons[sn].poster_path // show poster
        if (title) translateMainTitle(i, title) // translate show title
        if (seasonTitle) translateTitle(i, seasonTitle) // translate season title
        if (overview && overview !== '') translateOverview(i, overview) // translate show overview
        if (poster && poster !== null) translatePoster(i, poster, 'w300') // translate show poster
        $(i).removeClass('translate')
        $(i).addClass('translated') // is now translated
        MU.log(`the ${infos.type} "${title} ${seasonTitle}" is translated`)
      }).catch((e) => MU.error(e))
    }).catch((e) => MU.error(e))
  }

  const translateGridSeason = (i, infos, data) => { // translate show on grid
    const id = data.show.ids.tmdb // TMDb ID
    if (!id) $(i).addClass('untranslatable') // untranslatable

    tmdb.seasonDetails(id, infos.season).then((data) => { // get season details from TMDb API
      const title = data.name // season title
      const poster = data.poster_path // season poster
      if (title) translateGridMainTitle(i, title) // translate season title
      if (poster !== null) translatePoster(i, poster, 'w300') // translate season poster
      $(i).removeClass('translate')
      $(i).addClass('translated') // is now translated
      MU.log(`the ${infos.type} "${title}" is translated`)
    }).catch((e) => MU.error(e))
  }

  const translateEpisode = (i) => { // translate episode
    const infos = getInfos($(i).find('.btn-list[data-show-id]')) // get infos from Trakt webpage
    if (!infos) return

    trakt.searchID('trakt', infos.id, infos.type).then((data) => { // get TMDb ID from Trakt API
      const id = data.show.ids.tmdb // TMDb ID
      if (!id) $(i).addClass('untranslatable') // untranslatable
      tmdb.tvDetails(id).then((data) => { // get show details from TMDb API
        const sn = infos.season
        const title = data.name // show title
        const seasonTitle = data.seasons[sn].name // season title
        const poster = data.seasons[sn].poster_path // show poster
        tmdb.episodeDetails(id, sn, infos.episode).then((data) => { // get episode details from TMDb API
          const episodeTitle = data.name // episode title
          const overview = data.overview // episode overview
          if (episodeTitle) translateTitle(i, episodeTitle) // translate episode title
          if (title && seasonTitle) translateMainTitle(i, title, seasonTitle) // translate show/season titles
          if (overview && overview !== '') translateOverview(i, overview) // translate episode title
          if (poster !== null) translatePoster(i, poster, 'w300') // translate show poster
          $(i).removeClass('translate')
          $(i).addClass('translated') // is now translated
          MU.log(`the ${infos.type} "${title} ${sn}x${infos.episode}" is translated`)
        }).catch((e) => MU.error(e))
      }).catch((e) => MU.error(e))
    }).catch((e) => MU.error(e))
  }

  const translateGridEpisode = (i, infos, data) => { // translate episode on grid
    const id = data.show.ids.tmdb // TMDb ID
    if (!id) $(i).addClass('untranslatable') // untranslatable

    tmdb.tvDetails(id).then((data) => { // get show details from TMDb API
      const title = data.name // show title
      const poster = data.poster_path // show poster
      tmdb.episodeDetails(id, infos.season, infos.episode).then((data) => { // get episode details from TMDb API
        const episodeTitle = data.name // episode title
        const overview = data.overview // episode overview
        if (title) translateGridTitle(i, title) // translate show title
        if (episodeTitle) translateGridMainTitle(i, episodeTitle) // translate episode title
        if (overview && overview !== '') translateGridOverview(i, overview) // translate episode title
        if (poster !== null) translatePoster(i, poster, 'w300') // translate show poster
        $(i).removeClass('translate')
        $(i).addClass('translated') // is now translated
        MU.log(`the ${infos.type} "${title} ${infos.season}x${infos.episode}" is translated`)
      }).catch((e) => MU.error(e))
    }).catch((e) => MU.error(e))
  }

  const translateVisibleGridItem = (i) => { // translate visible item on grid
    const infos = getInfos(i) // get infos from Trakt webpage
    if (!infos) return

    const type = (infos.type === 'season') ? 'show' : infos.type // season ==> show

    trakt.searchID('trakt', infos.id, type).then((data) => { // get TMDb ID from Trakt API
      if (infos.type === 'movie') translateGridMovie(i, infos, data) // translate movie
      if (infos.type === 'show') translateGridShow(i, infos, data) // translate show
      if (infos.type === 'season') translateGridSeason(i, infos, data) // translate season
      if (infos.type === 'episode') translateGridEpisode(i, infos, data) // translate episode
    }).catch((e) => MU.error(e))
  }

  const translateGrid = () => { // translate grid
    const items = $('.grid-item[data-type]').toArray() // get all grid items

    const translateGridItems = async () => { // translate grid items
      const visibleItems = $.grep(items, (i) => $(i).visible(true) & !isTranslated(i)) // get visible and untranslated items
      if (!visibleItems.length) return

      await $.map(visibleItems, (i) => { // get items
        $(i).addClass('translate')
        translateVisibleGridItem(i)
      })
    }

    $(document).scroll(translateGridItems)
    $(window).resize(translateGridItems)
    translateGridItems()
  }

  //* NodeCraetionObserver
  NodeCreationObserver.init('observed-translate')
  NodeCreationObserver.onCreation('.movies.show', (i) => { // movie
    $(document).ready(() => {
      $(i).addClass('translate')
      translateMovie(i)
    })
  })
  NodeCreationObserver.onCreation('.shows.show', (i) => { // show
    $(document).ready(() => {
      $(i).addClass('translate')
      translateShow(i)
    })
  })
  NodeCreationObserver.onCreation('.shows.season', (i) => { // season
    $(document).ready(() => {
      $(i).addClass('translate')
      translateSeason(i)
    })
  })
  NodeCreationObserver.onCreation('.shows.episode', (i) => { // episode
    $(document).ready(() => {
      $(i).addClass('translate')
      translateEpisode(i)
    })
  })
  NodeCreationObserver.onCreation('body', () => { // grid items
    $(document).ready(() => {
      translateGrid()
    })
  })
  NodeCreationObserver.onCreation('.loaded', () => { // grid loaded items
    $('.loaded').ready(() => {
      translateGrid()
    })
  })
})()
