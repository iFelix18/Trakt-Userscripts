// ==UserScript==
// @name            Stats for Trakt
// @name:it         Statistiche per Trakt
// @author          Davide <iFelix18@protonmail.com>
// @namespace       https://github.com/iFelix18
// @icon            https://www.google.com/s2/favicons?sz=64&domain=https://trakt.tv
// @description     Adds stats on Trakt
// @description:it  Aggiunge statistiche a Trakt
// @copyright       2019, Davide (https://github.com/iFelix18)
// @license         MIT
// @version         3.3.0
// @homepage        https://github.com/iFelix18/Trakt-Userscripts#readme
// @homepageURL     https://github.com/iFelix18/Trakt-Userscripts#readme
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/stats-for-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/stats-for-trakt.user.js
// @require         https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@43fd0fe4de1166f343883511e53546e87840aeaf/gm_config.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@utils-3.0.1/lib/utils/utils.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@trakt-1.5.4/lib/api/trakt.min.js
// @require         https://cdn.jsdelivr.net/npm/node-creation-observer@1.2.0/release/node-creation-observer-latest.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js
// @require         https://cdn.jsdelivr.net/npm/jquery.scrollto@2.1.3/jquery.scrollTo.min.js
// @require         https://cdn.jsdelivr.net/npm/gasparesganga-jquery-loading-overlay@2.1.7/dist/loadingoverlay.min.js
// @require         https://cdn.jsdelivr.net/npm/chart.js@3.7.0/dist/chart.min.js
// @require         https://cdn.jsdelivr.net/npm/chartjs-plugin-trendline@1.0.0/dist/chartjs-plugin-trendline.min.js
// @require         https://cdn.jsdelivr.net/npm/progressbar.js@1.1.0/dist/progressbar.min.js
// @match           *://trakt.tv/*
// @connect         api.trakt.tv
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM.deleteValue
// @grant           GM.getValue
// @grant           GM.listValues
// @grant           GM.registerMenuCommand
// @grant           GM.setValue
// @grant           GM.xmlHttpRequest
// @run-at          document-start
// @inject-into     content
// ==/UserScript==

/* global migrateConfig $, GM_config, MyUtils, NodeCreationObserver, ProgressBar, Trakt */

(() => {
  migrateConfig('trakt-config', 'stats-for-trakt') // migrate to the new config ID

  //* GM_config
  GM_config.init({
    id: 'stats-for-trakt',
    title: `Stats for Trakt v${GM.info.script.version} Settings`,
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
      clearCache: {
        label: 'Clear the cache',
        type: 'button',
        click: async () => {
          const values = await GM.listValues()

          for (const value of values) {
            const cache = await GM.getValue(value) // get cache
            if (cache.time) { GM.deleteValue(value) } // delete cache
          }

          MU.log('cache cleared')
          GM_config.close()
        }
      }
    },
    css: ':root{--mainBackground:#343433;--background:#282828;--text:#fff}body{background-color:var(--mainBackground)!important;color:var(--text)!important}body .section_header{background-color:var(--background)!important;border-bottom:none!important;border:1px solid var(--background)!important;color:var(--text)!important}body .section_desc{background-color:var(--background)!important;border-top:none!important;border:1px solid var(--background)!important;color:var(--text)!important}body .reset{color:var(--text)!important}',
    events: {
      init: () => {
        if (!GM_config.isOpen && GM_config.get('TraktClientID') === '') {
          window.addEventListener('load', () => GM_config.open())
        }
      },
      save: () => {
        if (GM_config.isOpen && GM_config.get('TraktClientID') === '') {
          window.alert('Stats for Trakt: check your settings and save')
        } else {
          window.alert('Stats for Trakt: settings saved')
          GM_config.close()
          window.location.reload(false)
        }
      }
    }
  })
  if (GM.info.scriptHandler !== 'Userscripts') GM.registerMenuCommand('Configure', () => GM_config.open()) //! Userscripts Safari: GM.registerMenuCommand is missing

  //* MyUtils
  const MU = new MyUtils({
    name: 'Stats for Trakt',
    version: GM.info.script.version,
    author: 'Davide',
    color: '#ed1c24',
    logging: GM_config.get('logging')
  })
  MU.init('stats-for-trakt')

  //* Trakt API
  const trakt = new Trakt({
    clientID: GM_config.get('TraktClientID'),
    debug: GM_config.get('debugging')
  })

  //* Constants
  const cachePeriod = 3_600_000 // 1 hours
  const loading = $('<div>', {
    css: { /* cSpell: disable-next-line */
      'font-family': 'varela round,helvetica neue,Helvetica,Arial,sans-serif',
      'font-size': '14px',
      'text-align': 'center',
      'white-space': 'nowrap'
    },
    class: 'statsLoading',
    text: 'Loading stats...'
  })

  //* Functions
  /**
   * Returns a normalized episodes and season numbers by adding a zero to individual numbers: 1 => 01
   *
   * @param {number} number Episode or season number
   * @returns {number} Normalized episodes or season numbers
   */
  const normalize = (number) => {
    return (number < 10 ? '0' : '') + number
  }

  /**
   * Capitalize first letter
   *
   * @param {string} string String
   * @returns {string} Capitalized string
   */
  const capitalizeFirstLetter = (string) => {
    return (string.charAt(0).toUpperCase() + string.slice(1)).trim()
  }

  /**
   * Returns a color
   *
   * @param {number} index Datasets length
   * @returns {string} Color
   */
  const color = (index) => {
    const colors = [
      'rgb(204, 51, 63)',
      'rgb(0, 160, 176)',
      'rgb(235, 104, 65)',
      'rgb(106, 74, 60)',
      'rgb(237, 201, 81)',
      'rgb(171, 62, 91)',
      'rgb(179, 204, 87)',
      'rgb(239, 116, 111)',
      'rgb(62, 65, 71)',
      'rgb(255, 190, 64)',
      'rgb(123, 59, 59)'
    ]
    return colors[index % colors.length]
  }

  /**
   * Returns Trakt ID
   *
   * @returns {number} Trakt ID
   */
  const getID = () => {
    const type = $('.btn-list[data-type]').data('type')
    const id = $(`.btn-list[data-${type}-id]`).data(`${type}-id`)
    return id
  }

  /**
   * Returns all episodes ratings in a show
   *
   * @param {number} id Trakt ID
   * @returns {Promise} Episodes ratings
   */
  const getEpisodesRatings = async (id) => {
    const cache = await GM.getValue(id) // get cache
    let data = []
    let episodesProcessed = 0
    return new Promise((resolve, reject) => {
      if (cache !== undefined && ((Date.now() - cache.time) < cachePeriod)) { // cache valid
        resolve((cache.data))
        MU.log('data from cache')
      } else { // cache not valid
        trakt.showSummary(id).then((response) => { // gets details for a show from Trakt
          const episodesAired = response.aired_episodes
          trakt.seasonSummary(id).then((response) => { // gets all seasons for a show from Trakt
            for (const season of response.map((season) => season).filter((season) => season.number !== 0)) { // for each season
              trakt.seasonsSeason(id, season.number).then((response) => { // gets all episodes for a specific season of a show from Trakt
                for (const episode of response.map((episode) => episode)) { // for each episode
                  trakt.episodeSummary(id, episode.season, episode.number).then((response) => { // gets rating for an episode from Trakt
                    data.push({
                      season: response.season,
                      episode: response.number,
                      first_aired: response.first_aired,
                      title: response.title,
                      rating: response.rating,
                      votes: response.votes
                    })
                    episodesProcessed++
                    if (episodesProcessed === episodesAired) { // got all ratings for all aired episodes
                      data = data.sort((a, b) => new Date(a.first_aired) - new Date(b.first_aired))
                      GM.setValue(id, { data, time: Date.now() }) // set cache
                      resolve(data)
                      MU.log('data from Trakt')
                    }
                  }).catch((error) => MU.error(error))
                }
              }).catch((error) => MU.error(error))
            }
          }).catch((error) => MU.error(error))
        }).catch((error) => MU.error(error))
      }
    })
  }

  /**
   * Returns your people progress
   *
   * @returns {Promise} People progress
   */
  const getPeopleProgress = () => {
    const data = []
    return new Promise((resolve, reject) => {
      $('.tab-links a').each((index, element) => {
        let role = $(element).data('role')
        const items = $(`.posters[data-role="${role}"] .grid-item[data-released!="0"]`).length
        const watched = $(`.posters[data-role="${role}"] .grid-item[data-released!="0"] .watch.selected`).length
        const progress = Math.round(((watched / items) ? (watched / items) : 0) * 100)
        role = capitalizeFirstLetter($(`.tab-links a[data-role="${role}"] h3`).clone().children().remove().end().text())
        data.push({
          role: role,
          items: items,
          watched: watched,
          progress: progress
        })
      })
      resolve(data)
    })
  }

  /**
   * Returns a datasets
   *
   * @param {object} data Episodes ratings
   * @returns {Array} Datasets
   */
  const scatterDatasets = (data) => {
    let datasets = []

    // eslint-disable-next-line unicorn/no-array-reduce, unicorn/prefer-object-from-entries
    data = data.reduce((data, { season, episode, title, rating, votes }, key) => {
      (data[season - 1] = data[season - 1] || []).push({
        x: key,
        y: rating
      })
      return data
    }, {})

    for (const key of Object.keys(data).map((season) => season)) {
      (datasets = datasets || []).push({
        label: `Season ${Number.parseFloat(key) + 1}`,
        data: data[key],
        backgroundColor: color(datasets.length),
        trendlineLinear: {
          style: color(datasets.length),
          lineStyle: 'solid',
          width: 2
        }
      })
    }

    return datasets
  }

  /**
   * Add scatter chart html structure to the page
   */
  const addChartStructure = () => {
    const html = '<div id=stats><div class=row><div class=col-md-12><h2><span><strong>Stats</strong></span></h2><div style=clear:both></div><div class="col-md-12 statsContainer"><canvas id=episodesRatingsChart></canvas></div><div style=clear:both></div></div></div></div>'
    $(html).insertBefore($('#recent-episodes'))
  }

  /**
   * Add progress bar html structure to the page
   */
  const addProgressBarStructure = () => {
    const html = '<div id=stats><div class=row><div><h2><span><strong>Stats</strong></span></h2><div style=clear:both></div><div class="col-lg-8 col-md-7 statsContainer"><div id=peopleProgressBar></div></div><div style=clear:both></div></div></div></div>'
    $(html).insertBefore($('#credits'))
  }

  /**
   * Add stats to sidebar menu
   *
   * @param {number} child Child
   */
  const addToMenu = (child) => {
    $(`#info-wrapper .sidebar .sections li:nth-child(${child}) a`).parent().after('<li><a href="#stats">Stats</a></li>')
    $('#info-wrapper .sidebar .sections li a[href="#stats"]').click((event) => {
      event.preventDefault()
      $.scrollTo('#stats', 500, {
        offset: -70
      })
    })
  }

  /**
   * Add chart to the page
   *
   * @param {object} data Episodes ratings
   */
  const addScatterChart = (data) => {
    // eslint-disable-next-line no-unused-vars, no-undef
    const myChart = new Chart($('#episodesRatingsChart'), {
      type: 'scatter',
      data: {
        datasets: scatterDatasets(data)
      },
      options: {
        scales: {
          x: {
            display: true,
            ticks: {
              display: false
            },
            title: {
              display: true,
              text: 'Episode',
              font: { /* cSpell: disable-next-line */
                family: 'varela round, helvetica neue, Helvetica, Arial, sans-serif',
                size: 14,
                weight: 'normal',
                lineHeight: 'normal'
              }
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Rating',
              font: { /* cSpell: disable-next-line */
                family: 'varela round, helvetica neue, Helvetica, Arial, sans-serif',
                size: 14,
                weight: 'normal',
                lineHeight: 'normal'
              }
            }
          }
        },
        plugins: {
          title: {
            display: false,
            position: 'top',
            fontSize: 14, /* cSpell: disable-next-line */
            fontFamily: 'varela round, helvetica neue, Helvetica, Arial, sans-serif',
            fontStyle: 'normal',
            padding: 5,
            lineHeight: 'normal',
            text: 'Episodes ratings'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const episode = data[context.parsed.x]
                return [`s${normalize(episode.season)}e${normalize(episode.episode)} - ${episode.title}`, '', `Rating: ${episode.rating}`, `Votes:  ${episode.votes}`]
              }
            }
          }
        }
      }
    })
  }

  /**
   * Add progress bar to the page
   *
   * @param {object} data People progress
   */
  const addProgressBar = (data) => {
    for (const role of data) {
      const progressbar = new ProgressBar.Line('#peopleProgressBar', {
        color: '#ed1c24',
        strokeWidth: 2,
        trailColor: '#530d0d',
        text: {
          style: {
            color: 'inherit',
            margin: '1px 0 5px', /* cSpell: disable-next-line */
            font: '14px varela round, helvetica neue, Helvetica, Arial, sans-serif'
          }
        }
      })
      progressbar.set(role.progress / 100)
      progressbar.setText(`${role.role}: watched ${role.watched} (${role.progress}%) out of a total of ${role.items} released items.`)
    }
  }

  /**
   * Remove progress bar
   */
  const removeProgressBar = () => {
    $('#peopleProgressBar').children().remove()
  }

  //* NodeCreationObserver
  NodeCreationObserver.init('observed-stats')
  NodeCreationObserver.onCreation('.shows.show', () => { // show page
    $(document).ready(() => {
      const id = getID() // Trakt ID
      if (!id) return
      addChartStructure() // add chart structure
      addToMenu(2) // add stats to the menu
      $('.statsContainer').LoadingOverlay('show', { // show loading
        image: '',
        custom: loading
      })
      getEpisodesRatings(id).then((response) => { // get episodes ratings
        $('.statsContainer').LoadingOverlay('hide', true) // hide loading
        addScatterChart(response) // add chart
      }).catch((error) => MU.error(error))
    })
  })
  NodeCreationObserver.onCreation('.people.show', () => { // people page
    $(document).ready(() => {
      addProgressBarStructure() // add progress bar structure
      addToMenu(1) // add stats to the menu
      $('.statsContainer').LoadingOverlay('show', { // show loading
        image: '',
        custom: loading
      })
      getPeopleProgress().then((response) => { // get people progress
        $('.statsContainer').LoadingOverlay('hide', true) // hide loading
        addProgressBar(response) // add progress bar
      }).catch((error) => MU.error(error))
    })
  })
  NodeCreationObserver.onCreation('.people.show #toast-container .toast.toast-success', () => { // people page
    $(document).ready(() => {
      $('.statsContainer').LoadingOverlay('show', { // show loading
        image: '',
        custom: loading
      })
      removeProgressBar()
      getPeopleProgress().then((response) => { // get people progress
        $('.statsContainer').LoadingOverlay('hide', true) // hide loading
        addProgressBar(response) // add progress bar
      }).catch((error) => MU.error(error))
    })
  })
})()
