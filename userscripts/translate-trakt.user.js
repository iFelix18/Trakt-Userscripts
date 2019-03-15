// ==UserScript==
// @name            Translate Trakt
// @name:it         Traduci Trakt
// @author          Felix
// @namespace       https://github.com/iFelix18
// @description     Translates titles, plots, taglines and posters of movies, TV series and episodes in the choice language
// @description:it  Traduce titoli, trame, tagline e poster di film, serie TV ed episodi nella lingua scelta
// @copyright       2019, Felix (https://github.com/iFelix18)
// @license         MIT
// @version         2.0.1
// @homepageURL     https://git.io/Trakt-Userscripts
// @homepageURL     https://greasyfork.org/scripts/377969-translate-trakt
// @homepageURL     https://openuserjs.org/scripts/iFelix18/Translate_Trakt
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/translate-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/translate-trakt.user.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.3.1/dist/jquery.min.js#sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=
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
// @inject-into     content
// ==/UserScript==
//
// Recommended in combination with Darkt, my darker theme for Trakt.
// More info on: https://git.io/Darkt

(function () {
  'use strict'

  /* global $, NodeCreationObserver, GM_config, RequestQueue */

  // settings
  GM_registerMenuCommand(`${GM_info.script.name} - Configure`, function () {
    GM_config.open()
  })
  GM_config.init({
    'id': 'MyConfigs',
    'title': GM_info.script.name,
    'fields': {
      'apikey': {
        'label': 'TMDb API Key',
        'section': ['Enter your TMDb API Key', 'Get one at: https://developers.themoviedb.org/3/'],
        'type': 'text',
        'default': ''
      },
      'language': {
        'label': 'Language',
        'section': ['Enter the code of your language, for example: en-US, it-IT, fr-FR.', 'More info at: https://developers.themoviedb.org/3/getting-started/languages'],
        'type': 'text',
        'default': 'en-US'
      }
    },
    'events': {
      'save': function () {
        location.reload()
      }
    }
  })

  // NodeCreationObserver
  NodeCreationObserver.init('observed-translate')
  NodeCreationObserver.onCreation('.movies .external a[href*="themoviedb"]', function () {
    GM_xmlhttpRequest({
      method: 'GET',
      url: `https://api.themoviedb.org/3/movie/${TMDbID()}?api_key=${apikey()}&language=${language()}`,
      onload: function (response) {
        let data = JSON.parse(response.responseText)
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
        let data = JSON.parse(response.responseText)
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
        let data = JSON.parse(response.responseText)
        if (data && data.status_message) {
          error(data.status_message)
        } else {
          let sn = season()
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
    let rq = new RequestQueue(1)
    let id = TMDbID()
    let ak = apikey()
    let ln = language()
    let sn = season()
    let en = episode()
    rq.add({
      method: 'GET',
      url: `https://api.themoviedb.org/3/tv/${id}?api_key=${ak}&language=${ln}`,
      onload: function (response) {
        let data = JSON.parse(response.responseText)
        if (data && data.status_message) {
          console.log(`Translate Trakt: error is "${data.status_message}"`)
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
        let data = JSON.parse(response.responseText)
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
    console.log(`Translate Trakt: overview is "${short(overview)}"`)
    $('#info-wrapper .info #overview p').text(overview)
    console.log('Translate Trakt: overview is translated')
  }

  // translate tagline
  function translateTagline (tagline) {
    console.log(`Translate Trakt: tagline is "${short(tagline)}"`)
    $('#info-wrapper .info #tagline').text(tagline)
    console.log('Translate Trakt: tagline is translated')
  }

  // translate title
  function translateTitle (title) {
    console.log(`Translate Trakt: title is "${title}"`)
    let container = $('#summary-wrapper .summary .container h1')
    let year = container.find('.year')
    let certification = container.find('.certification')
    container.text(title).append(' ').append(year).append(certification)
    console.log('Translate Trakt: title is translated')
  }
  function translateSeriesTitle (seriesTitle) {
    console.log(`Translate Trakt: series title is "${seriesTitle}"`)
    $('#summary-wrapper .summary .container h2 a').text(seriesTitle)
    console.log('Translate Trakt: series title is translated')
  }
  function translateSeasonTitle (title, seasonTitle) {
    console.log(`Translate Trakt: season title is "${title}: ${seasonTitle}"`)
    $('#summary-wrapper .summary .container h2 a:first-child').text(title).append(': ')
    $('#summary-wrapper .summary .container h2 a:last-child').text(seasonTitle)
    console.log('Translate Trakt: season title is translated')
  }
  function translateEpisodeTitle (episodeTitle) {
    console.log(`Translate Trakt: episode title is "${episodeTitle}"`)
    $('#summary-wrapper .summary .container h1 .main-title').text(episodeTitle)
    console.log('Translate Trakt: episode title is translated')
  }

  // translate poster
  function translatePoster (poster) {
    console.log(`Translate Trakt: poster url is "${poster}"`)
    $('#info-wrapper .sidebar .poster .real').removeAttr('data-original').removeAttr('src').attr('src', poster)
    $('#summary-wrapper .mobile-poster .poster .real').removeAttr('data-original').removeAttr('src').attr('src', poster)
    console.log('Translate Trakt: poster is translated')
  }

  // error
  function error (error) {
    let log = `Translate Trakt: error is "${error}"`
    if (error === 'Invalid API key: You must be granted a valid key.') {
      alert(log)
      GM_config.open()
    } else {
      console.log(log)
    }
  }

  // shorten logs
  function short (log) {
    return log.split(/\s+/).slice(0, 6).join(' ').concat(' [...]')
  }

  // get language
  function language () {
    let language = GM_config.get('language')
    if (language === '') {
      alert('Translate Trakt: error "Language not set"')
      GM_config.open()
    } else {
      console.log(`Translate Trakt: language is "${language}"`)
      return language
    }
  }

  // get API Key
  function apikey () {
    let apikey = GM_config.get('apikey')
    if (apikey === '') {
      GM_config.open()
    } else {
      console.log(`Translate Trakt: TMDb API Key is "${apikey}"`)
      return apikey
    }
  }

  // get episode
  function episode () {
    let link = $('.external a[href*="themoviedb"]')
    if (link.length) {
      let episode = link.attr('href').match(/(episode)\/(\d+)/)[2]
      console.log(`Translate Trakt: episode is "${episode}"`)
      return episode
    }
  }

  // get season
  function season () {
    let link = $('.external a[href*="themoviedb"]')
    if (link.length) {
      let season = link.attr('href').match(/(season)\/(\d+)/)[2]
      console.log(`Translate Trakt: season is "${season}"`)
      return season
    }
  }

  // get TMDb ID
  function TMDbID () {
    let link = $('.external a[href*="themoviedb"]')
    if (link.length) {
      let TMDbID = link.attr('href').match(/(movie|tv)\/(\d+)/)[2]
      console.log(`Translate Trakt: TMDb ID is "${TMDbID}"`)
      return TMDbID
    }
  }
})()
