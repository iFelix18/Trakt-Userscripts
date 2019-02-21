// ==UserScript==
// @name            Translate Trakt
// @name:it         Traduci Trakt
// @author          Felix
// @namespace       https://github.com/iFelix18
// @description     Translates titles, plots, taglines and posters of movies, TV series and episodes in the choice language
// @description:it  Traduce titoli, trame, tagline e poster di film, serie TV ed episodi nella lingua scelta
// @copyright       2019, Felix (https://github.com/iFelix18)
// @license         MIT
// @version         1.0.1
// @homepageURL     https://git.io/Trakt-Userscripts
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/translate-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/translate-trakt.user.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.3.1/dist/jquery.min.js#sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=
// @require         https://cdn.jsdelivr.net/gh/soufianesakhi/node-creation-observer-js@edabdee1caaee6af701333a527a0afd95240aa3b/release/node-creation-observer-latest.min.js
// @require         https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@a4a49b47ecfb1d8fcd27049cc0e8114d05522a0f/gm_config.min.js
// @require         https://cdn.jsdelivr.net/gh/cvzi/RequestQueue@e4297b3c2e11761d69858bad4746832ea412b571/RequestQueue.min.js
// @include         https://trakt.tv/*
// @connect         api.themoviedb.org
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_registerMenuCommand
// @grant           GM_xmlhttpRequest
// @run-at          document-start
// ==/UserScript==
//
// Recommended in combination with Darkt, my darker theme for Trakt.
// More info on: https://git.io/Darkt

(function () {
  'use strict'

  /* global RequestQueue */

  function translateTrakt (type) {
    console.log(`Translate Trakt: is a ${type}`)
    request(type)
  }

  // NodeCreationObserver
  NodeCreationObserver.onCreation('.movies #summary-wrapper .summary .container h1', function () {
    addSettings()
    translateTrakt('movie')
  })
  NodeCreationObserver.onCreation('.show:not(.movies) #summary-wrapper .summary .container h1', function () {
    addSettings()
    translateTrakt('show')
  })
  NodeCreationObserver.onCreation('.season #summary-wrapper .summary .container h1', function () {
    addSettings()
    translateTrakt('season')
  })
  NodeCreationObserver.onCreation('.episode #summary-wrapper .summary .container h1', function () {
    addSettings()
    translateTrakt('episode')
  })

  // translate episode name
  function translateEpisodeName (data) {
    let h1 = $('#summary-wrapper .summary .container h1 .main-title')
    h1.text(data)
    console.log('Translate Trakt: episode name is translated')
  }

  // translate overview
  function translateOverview (data) {
    let div = $('#info-wrapper .info #overview p')
    div.text(data)
    console.log('Translate Trakt: overview is translated')
  }

  // translate season title
  function translateSeasonTitle (data, type) {
    if (type !== 'episode') {
      let h1 = $('#summary-wrapper .summary .container h1')
      let year = h1.find('.year')
      let certification = h1.find('.certification')
      h1.text(data).append(' ')
      h1.append(year).append(certification)
    } else {
      let h2 = $('#summary-wrapper .summary .container h2 a:last-child')
      h2.text(data)
    }
    console.log('Translate Trakt: title is translated')
  }

  // translate tagline
  function translateTagline (data) {
    var div = $('#info-wrapper .info #tagline')
    div.text(data)
    console.log('Translate Trakt: tagline is translated')
  }

  // translate title
  function translateTitle (data, type) {
    if (type !== 'season' && type !== 'episode') {
      let h1 = $('#summary-wrapper .summary .container h1')
      let year = h1.find('.year')
      let certification = h1.find('.certification')
      h1.text(data).append(' ')
      h1.append(year).append(certification)
    } else {
      let h2 = $('#summary-wrapper .summary .container h2 a:first-child')
      let seasonChild = $('#summary-wrapper .summary .container h2 a:nth-child(2)')
      h2.text(data)
      if (seasonChild.length) {
        h2.append(': ')
      }
    }
    console.log('Translate Trakt: title is translated')
  }

  // translate poster
  function translatePoster (data) {
    let poster = $(`#info-wrapper .sidebar .poster .real`)
    let mobilePoster = $(`#summary-wrapper .mobile-poster .poster .real`)
    if (poster.length) {
      poster.removeAttr('data-original').removeAttr('src').attr('src', data)
      console.log('Translate Trakt: poster is translated')
    } else if (mobilePoster.length) {
      mobilePoster.removeAttr('data-original').removeAttr('src').attr('src', data)
      console.log('Translate Trakt: mobile poster is translated')
    }
  }

  // get episode overview
  function getEpisodeOverview (json) {
    if (json && json.tv_episode_results[0] && json.tv_episode_results[0].overview) {
      let overview = json.tv_episode_results[0].overview
      return overview
    } else {
      console.log('Translate Trakt: overview not available')
    }
  }

  // get episode name
  function getEpisodeName (json) {
    if (json && json.tv_episode_results[0] && json.tv_episode_results[0].name) {
      let name = json.tv_episode_results[0].name
      return name
    } else {
      console.log('Translate Trakt: episode name not available')
    }
  }

  // get overview
  function getOverview (json) {
    let season = seasonNumber()
    if (json && json.overview && season === undefined) {
      let overview = json.overview
      return overview
    } else if (json && json.seasons[season].overview && season !== undefined) {
      let overview = json.seasons[season].overview
      return overview
    } else {
      console.log('Translate Trakt: overview not available')
    }
  }

  // get season title
  function getSeasonTitle (json) {
    let season = seasonNumber()
    if (json && json.seasons[season].name && season !== undefined) {
      let name = json.seasons[season].name
      return name
    } else {
      console.log('Translate Trakt: season not available')
    }
  }

  // get tagline
  function getTagline (json) {
    if (json && json.tagline) {
      let tagline = json.tagline
      return tagline
    } else {
      console.log('Translate Trakt: tagline not available')
    }
  }

  // get title
  function getTitle (json) {
    let season = seasonNumber()
    if (json && json.title && season === undefined) {
      let title = json.title
      return title
    } else if (json && json.name && season === undefined) {
      let title = json.name
      return title
    } else if (json && json.name && season !== undefined) {
      let title = json.name
      return title
    } else {
      console.log('Translate Trakt: title not available')
    }
  }

  // get poster
  function getPoster (json) {
    let season = seasonNumber()
    if (json && json.poster_path && season === undefined) {
      let poster = `https://image.tmdb.org/t/p/w185${json.poster_path}`
      return poster
    } else if (json && json.seasons[season].poster_path && season !== undefined) {
      let poster = `https://image.tmdb.org/t/p/w185${json.seasons[season].poster_path}`
      return poster
    } else {
      console.log('Translate Trakt: poster not available')
    }
  }

  // get data
  function getData (json, type) {
    let poster = getPoster(json)
    console.log(`Translate Trakt: poster url is "${poster}"`)
    translatePoster(poster)
    let title = getTitle(json)
    console.log(`Translate Trakt: title is "${title}"`)
    translateTitle(title, type)
    if (type === 'movie') {
      let tagline = getTagline(json)
      console.log(`Translate Trakt: tagline is "${shortenLog(tagline)}..."`)
      translateTagline(tagline)
    }
    if (type !== 'movie' && type !== 'show') {
      let season = getSeasonTitle(json)
      console.log(`Translate Trakt: season title is "${season}"`)
      translateSeasonTitle(season, type)
    }
    if (type !== 'episode') {
      let overview = getOverview(json)
      console.log(`Translate Trakt: overview is "${shortenLog(overview)}..."`)
      translateOverview(overview)
    }
  }

  function getEpisodeData (json) {
    let episode = getEpisodeName(json)
    console.log(`Translate Trakt: episode name is "${episode}"`)
    translateEpisodeName(episode)
    let overview = getEpisodeOverview(json)
    console.log(`Translate Trakt: overview is "${shortenLog(overview)}..."`)
    translateOverview(overview)
  }

  // request
  function request (type) {
    let rq = new RequestQueue(1)
    let apikey = GM_config.get('apikey')
    let language = GM_config.get('language')
    let TMDB = TMDbID()
    console.log(`Translate Trakt: TMDb ID is ${TMDB}`)
    let IMDB = IMDbID()
    console.log(`Translate Trakt: IMDb ID is ${IMDB}`)
    rq.add({
      method: 'GET',
      url: `https://api.themoviedb.org/3/${TMDB}?api_key=${apikey}&language=${language}`,
      onload: function (response) {
        let json = JSON.parse(response.responseText)
        getData(json, type)
      }
    })
    if (type === 'episode') {
      rq.add({
        method: 'GET',
        url: `https://api.themoviedb.org/3/find/${IMDB}?api_key=${apikey}&language=${language}&external_source=imdb_id`,
        onload: function (response) {
          let json = JSON.parse(response.responseText)
          getEpisodeData(json)
        }
      })
    }
  }

  // get IDs
  function TMDbID () {
    let link = $('.external a[href*="themoviedb"]')
    if (link.length) {
      return link.attr('href').match(/((movie|tv)\/\d+)/)[1]
    }
  }

  function IMDbID () {
    let link = $("a[href*='imdb']")
    if (link.length) {
      return link.attr('href').match(/tt\d+/)[0]
    }
  }

  // get season number
  function seasonNumber () {
    let season = $('.season #info-wrapper .season-links .links ul li a.selected').attr('href')
    let seasonEpisode = $('.episode #summary-wrapper .summary .container h2 a:last-child').attr('href')
    if (season !== undefined && seasonEpisode === undefined) {
      return season.match(/seasons\/([0-9]+)/)[1]
    } else if (season === undefined && seasonEpisode !== undefined) {
      return seasonEpisode.match(/seasons\/([0-9]+)/)[1]
    }
  }

  // shorten logs
  function shortenLog (log) {
    return log.split(/\s+/).slice(0, 6).join(' ')
  }

  // settings
  function addSettings () {
    // settings configuration
    GM_config.init({
      'id': 'MyConfigs',
      'title': 'Translate Trakt - Settings',
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
          alert('Settings saved')
          location.reload()
        }
      }
    })

    // add settings on add-on menu
    GM_registerMenuCommand('Translate Trakt - Configure', function () {
      GM_config.open()
    })

    // controll apikey
    let apikey = GM_config.get('apikey')
    if (apikey === '') {
      GM_config.open()
    } else {
      console.log(`Translate Trakt: TMDb API Key is ${apikey}`)
    }

    // controll language
    let language = GM_config.get('language')
    if (language === '') {
      GM_config.open()
    } else {
      console.log(`Translate Trakt: language is ${language}`)
    }
  }
})()
