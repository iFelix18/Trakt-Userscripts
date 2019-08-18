// ==UserScript==
// @name            Translate Trakt
// @name:it         Traduci Trakt
// @author          Felix
// @namespace       https://github.com/iFelix18
// @description     Translates titles, plots, taglines and posters of movies, TV series and episodes in the choice language
// @description:it  Traduce titoli, trame, tagline e poster di film, serie TV ed episodi nella lingua scelta
// @copyright       2019, Felix (https://github.com/iFelix18)
// @license         MIT
// @version         2.0.3
// @homepageURL     https://git.io/Trakt-Userscripts
// @homepageURL     https://greasyfork.org/scripts/377969-translate-trakt
// @homepageURL     https://openuserjs.org/scripts/iFelix18/Translate_Trakt
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/translate-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/translate-trakt.user.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.4.1/dist/jquery.min.js#sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=
// @require         https://cdn.jsdelivr.net/gh/soufianesakhi/node-creation-observer-js@edabdee1caaee6af701333a527a0afd95240aa3b/release/node-creation-observer-latest.min.js
// @require         https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@a4a49b47ecfb1d8fcd27049cc0e8114d05522a0f/gm_config.min.js
// @require         https://cdn.jsdelivr.net/gh/cvzi/RequestQueue@e4297b3c2e11761d69858bad4746832ea412b571/RequestQueue.min.js
// @match           *://trakt.tv/*
// @connect         api.themoviedb.org
// @grant           GM_info
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_registerMenuCommand
// @grant           GM_xmlhttpRequest
// @run-at          document-start
// @inject-into     page
// ==/UserScript==
//
// Recommended in combination with Darkt, my darker theme for Trakt.
// More info on: https://git.io/Darkt

/* global $, NodeCreationObserver, GM_config, RequestQueue */

(function () {
  'use strict'

  console.log(`${GM_info.script.name} v${GM_info.script.version} by Felix is running!`)

  // configuration
  GM_config.init({
    id: 'trakt-config',
    title: `${GM_info.script.name} Settings`,
    fields: {
      apikey: {
        label: 'TMDb API Key',
        section: ['Enter your TMDb API Key', 'Get one at: https://developers.themoviedb.org/3/'],
        type: 'text',
        default: ''
      },
      language: {
        label: 'Language',
        section: ['Enter the code of your language, for example: en-US, it-IT, fr-FR.', 'More info at: https://developers.themoviedb.org/3/getting-started/languages'],
        type: 'text',
        default: 'en-US'
      },
      logging: {
        label: 'Logging',
        labelPos: 'above',
        type: 'checkbox',
        default: false
      }
    },
    css: '#trakt-config {background-color: #343434; color: #fff;} #trakt-config * {font-family: varela round,helvetica neue,Helvetica,Arial,sans-serif;} #trakt-config .section_header {background-color: #282828; border: 1px solid #282828; border-bottom: none; color: #fff; font-size: 10pt;} #trakt-config .section_desc {background-color: #282828; border: 1px solid #282828; border-top: none; color: #fff; font-size: 10pt;} #trakt-config .reset {color: #fff;}',
    events: {
      save: () => {
        alert(`${GM_info.script.name} : Settings saved`)
        location.reload()
      }
    }
  })

  // menu command to open configuration
  GM_registerMenuCommand(`${GM_info.script.name} - Configure`, () => {
    GM_config.open()
  })

  // logs
  const log = message => {
    if (GM_config.get('logging') === true) {
      console.log(`${GM_info.script.name}: ${message}`)
    }
  }

  // NodeCreationObserver
  NodeCreationObserver.init('observed-translate')
  NodeCreationObserver.onCreation('.movies .external a[href*="themoviedb"]', function () {
    GM_xmlhttpRequest({
      method: 'GET',
      url: `https://api.themoviedb.org/3/movie/${TMDbID()}?api_key=${apikey()}&language=${language()}`,
      onload: function (response) {
        const data = JSON.parse(response.responseText)
        if (data && data.status_message) {
          error(data.status_message)
        } else {
          if (data && data.poster_path && data.poster_path !== null) {
            translatePoster(`https://image.tmdb.org/t/p/w185${data.poster_path}`)
          }
          if (data && data.title) {
            translateTitle(data.title)
          }
          if (data && data.tagline && data.tagline !== '') {
            translateTagline(data.tagline)
          }
          if (data && data.overview && data.overview !== '') {
            translateOverview(data.overview)
          }
        }
      }
    })
  })
  NodeCreationObserver.onCreation('.shows:not(.season):not(.episode) .external a[href*="themoviedb"]', function () {
    GM_xmlhttpRequest({
      method: 'GET',
      url: `https://api.themoviedb.org/3/tv/${TMDbID()}?api_key=${apikey()}&language=${language()}`,
      onload: function (response) {
        const data = JSON.parse(response.responseText)
        if (data && data.status_message) {
          error(data.status_message)
        } else {
          if (data && data.poster_path && data.poster_path !== null) {
            translatePoster(`https://image.tmdb.org/t/p/w185${data.poster_path}`)
          }
          if (data && data.name) {
            translateTitle(data.name)
          }
          if (data && data.overview && data.overview !== '') {
            translateOverview(data.overview)
          }
        }
      }
    })
  })
  NodeCreationObserver.onCreation('.season .external a[href*="themoviedb"]', function () {
    GM_xmlhttpRequest({
      method: 'GET',
      url: `https://api.themoviedb.org/3/tv/${TMDbID()}?api_key=${apikey()}&language=${language()}`,
      onload: function (response) {
        const data = JSON.parse(response.responseText)
        if (data && data.status_message) {
          error(data.status_message)
        } else {
          const sn = season()
          if (data && data.seasons[sn].poster_path && data.seasons[sn].poster_path !== null) {
            translatePoster(`https://image.tmdb.org/t/p/w185${data.seasons[sn].poster_path}`)
          }
          if (data && data.name) {
            translateSeriesTitle(data.name)
          }
          if (data && data.seasons[sn].name) {
            translateTitle(data.seasons[sn].name)
          }
          if (data && data.seasons[sn].overview && data.seasons[sn].overview !== '') {
            translateOverview(data.seasons[sn].overview)
          }
        }
      }
    })
  })
  NodeCreationObserver.onCreation('.episode .external a[href*="themoviedb"]', function () {
    const rq = new RequestQueue(1)
    const id = TMDbID()
    const ak = apikey()
    const ln = language()
    const sn = season()
    const en = episode()
    rq.add({
      method: 'GET',
      url: `https://api.themoviedb.org/3/tv/${id}?api_key=${ak}&language=${ln}`,
      onload: function (response) {
        const data = JSON.parse(response.responseText)
        if (data && data.status_message) {
          log(`error is "${data.status_message}"`)
        } else {
          if (data && data.seasons[sn].poster_path && data.seasons[sn].poster_path !== null) {
            translatePoster(`https://image.tmdb.org/t/p/w185${data.seasons[sn].poster_path}`)
          }
          if (data && data.name && data.seasons[sn].name) {
            translateSeasonTitle(data.name, data.seasons[sn].name)
          }
        }
      }
    })
    rq.add({
      method: 'GET',
      url: `https://api.themoviedb.org/3/tv/${id}/season/${sn}/episode/${en}?api_key=${ak}&language=${ln}`,
      onload: function (response) {
        const data = JSON.parse(response.responseText)
        if (data && data.status_message) {
          error(data.status_message)
        } else {
          if (data && data.name) {
            translateEpisodeTitle(data.name)
          }
          if (data && data.overview && data.overview !== '') {
            translateOverview(data.overview)
          }
        }
      }
    })
  })

  // translate overview
  function translateOverview (overview) {
    log(`overview is "${short(overview)}"`)
    $('#info-wrapper .info #overview p').text(overview)
    log('overview is translated')
  }

  // translate tagline
  function translateTagline (tagline) {
    log(`tagline is "${short(tagline)}"`)
    $('#info-wrapper .info #tagline').text(tagline)
    log('tagline is translated')
  }

  // translate title
  function translateTitle (title) {
    log(`title is "${title}"`)
    const container = $('#summary-wrapper .summary .container h1')
    const year = container.find('.year')
    const certification = container.find('.certification')
    container.text(title).append(' ').append(year).append(certification)
    log('title is translated')
  }
  function translateSeriesTitle (seriesTitle) {
    log(`series title is "${seriesTitle}"`)
    $('#summary-wrapper .summary .container h2 a').text(seriesTitle)
    log('series title is translated')
  }
  function translateSeasonTitle (title, seasonTitle) {
    log(`season title is "${title}: ${seasonTitle}"`)
    $('#summary-wrapper .summary .container h2 a:first-child').text(title).append(': ')
    $('#summary-wrapper .summary .container h2 a:last-child').text(seasonTitle)
    log('season title is translated')
  }
  function translateEpisodeTitle (episodeTitle) {
    log(`episode title is "${episodeTitle}"`)
    $('#summary-wrapper .summary .container h1 .main-title').text(episodeTitle)
    log('episode title is translated')
  }

  // translate poster
  function translatePoster (poster) {
    log(`poster url is "${poster}"`)
    $('#info-wrapper .sidebar .poster .real').removeAttr('data-original').removeAttr('src').attr('src', poster)
    $('#summary-wrapper .mobile-poster .poster .real').removeAttr('data-original').removeAttr('src').attr('src', poster)
    log('poster is translated')
  }

  // error
  function error (error) {
    const log = `error is "${error}"`
    if (error === 'Invalid API key: You must be granted a valid key.') {
      alert(`${GM_info.script.name}: ${log}`)
      GM_config.open()
    } else {
      log(log)
    }
  }

  // shorten logs
  function short (log) {
    return log.split(/\s+/).slice(0, 6).join(' ').concat(' [...]')
  }

  // get language
  function language () {
    const language = GM_config.get('language')
    if (language === '') {
      alert(`${GM_info.script.name}: error "Language not set"`)
      GM_config.open()
    } else {
      log(`language is "${language}"`)
      return language
    }
  }

  // get API Key
  function apikey () {
    const apikey = GM_config.get('apikey')
    if (apikey === '') {
      GM_config.open()
    } else {
      log(`TMDb API Key is "${apikey}"`)
      return apikey
    }
  }

  // get episode
  function episode () {
    const link = $('.external a[href*="themoviedb"]')
    if (link.length) {
      const episode = link.attr('href').match(/(episode)\/(\d+)/)[2]
      log(`episode is "${episode}"`)
      return episode
    }
  }

  // get season
  function season () {
    const link = $('.external a[href*="themoviedb"]')
    if (link.length) {
      const season = link.attr('href').match(/(season)\/(\d+)/)[2]
      log(`season is "${season}"`)
      return season
    }
  }

  // get TMDb ID
  function TMDbID () {
    const link = $('.external a[href*="themoviedb"]')
    if (link.length) {
      const TMDbID = link.attr('href').match(/(movie|tv)\/(\d+)/)[2]
      log(`TMDb ID is "${TMDbID}"`)
      return TMDbID
    }
  }
})()
