// ==UserScript==
// @name            Stats for Trakt
// @name:it         Statistiche per Trakt
// @author          Davide <iFelix18@protonmail.com>
// @namespace       https://github.com/iFelix18
// @icon            https://avatars.githubusercontent.com/u/19800006?v=4&s=64
// @description     Adds stats on Trakt
// @description:it  Aggiunge statistiche a Trakt
// @copyright       2019, Davide (https://github.com/iFelix18)
// @license         MIT
// @version         3.0.2
//
// @homepageURL     https://github.com/iFelix18/Trakt-Userscripts#readme
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/stats-for-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/stats-for-trakt.user.js
//
// @require         https://cdn.jsdelivr.net/gh/greasemonkey/gm4-polyfill@a834d46afcc7d6f6297829876423f58bb14a0d97/gm4-polyfill.min.js
// @require         https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@43fd0fe4de1166f343883511e53546e87840aeaf/gm_config.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@73a5f7bffb3009c77beee5ef541d3a12928b4531/lib/utils/utils.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@73a5f7bffb3009c77beee5ef541d3a12928b4531/lib/api/trakt.min.js
// @require         https://cdn.jsdelivr.net/gh/soufianesakhi/node-creation-observer-js@edabdee1caaee6af701333a527a0afd95240aa3b/release/node-creation-observer-latest.min.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js#sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=
// @require         https://cdn.jsdelivr.net/npm/jquery.scrollto@2.1.3/jquery.scrollTo.min.js#sha256-HGSZhocOCEHviq7s3a917LyjMaqXB75C7kLVDqlMfdc=
// @require         https://cdn.jsdelivr.net/npm/gasparesganga-jquery-loading-overlay@2.1.7/dist/loadingoverlay.min.js#sha256-jLFv9iIrIbqKULHpqp/jmePDqi989pKXOcOht3zgRcw=
// @require         https://cdn.jsdelivr.net/npm/chart.js@3.4.1/dist/chart.min.js#sha256-GMN9UIJeUeOsn/Uq4xDheGItEeSpI5Hcfp/63GclDZk=
// @require         https://cdn.jsdelivr.net/npm/progressbar.js@1.1.0/dist/progressbar.min.js#sha256-c83qPqBpH5rEFQvgyTfcLufqoQIFFoqE5B71yeBXhLc=
//
// @match           *://trakt.tv/*
// @connect         api.trakt.tv
//
// @grant           GM.info
// @grant           GM_info
// @grant           GM.getValue
// @grant           GM_getValue
// @grant           GM.setValue
// @grant           GM_setValue
// @grant           GM.registerMenuCommand
// @grant           GM_registerMenuCommand
// @grant           GM.xmlHttpRequest
// @grant           GM_xmlhttpRequest
//
// @run-at          document-idle
// @inject-into     page
// ==/UserScript==

/* global $, GM_config, MonkeyUtils, NodeCreationObserver, ProgressBar, Trakt */

(() => {
  'use strict'

  //* GM_config
  GM_config.init({
    id: 'trakt-config',
    title: `${GM.info.script.name} v${GM.info.script.version} Settings`,
    fields: {
      traktClientID: {
        label: 'Trakt Client ID',
        section: ['Enter your Trakt Client ID', 'Get one at: https://trakt.tv/oauth/applications/new'],
        type: 'text',
        title: 'Your Trakt Client ID',
        size: 70,
        default: ''
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
        if (!GM_config.isOpen && GM_config.get('traktClientID') === '') {
          window.onload = () => GM_config.open()
        }
      },
      save: () => {
        if (GM_config.isOpen && GM_config.get('traktClientID') === '') {
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
    clientID: GM_config.get('traktClientID'),
    debug: GM_config.get('debugging')
  })

  //* Constants
  const loading = $('<div>', {
    css: {
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
   * @param {number} number Episode o season number
   * @returns {number}
   */
  const normalize = (number) => {
    return (number < 10 ? '0' : '') + number
  }

  /**
   * Capitalize first letter
   * @param {string} string
   * @returns {string}
   */
  const capitalizeFirstLetter = (string) => {
    return (string.charAt(0).toUpperCase() + string.slice(1)).trim()
  }

  /**
   * Returns a color
   * @param {number} index Datasets length
   * @returns {string}
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
   * @returns {number}
   */
  const id = () => {
    const type = $('.btn-list[data-type]').data('type')
    const id = $(`.btn-list[data-${type}-id]`).data(`${type}-id`)
    return id
  }

  /**
   * Returns all episodes ratings in a show
   * @param {number} id Trakt ID
   * @returns {Promise}
   */
  const episodesRatings = (id) => {
    let data = []
    let episodesProcessed = 0
    return new Promise((resolve, reject) => {
      trakt.showSummary(id).then((response) => { // gets details for a show from Trakt
        const episodesAired = response.aired_episodes
        trakt.seasonSummary(id).then((response) => { // gets all seasons for a show from Trakt
          response.map((season) => season).filter((season) => season.number !== 0).forEach((season) => { // for each season
            trakt.seasonsSeason(id, season.number).then((response) => { // gets all episodes for a specific season of a show from Trakt
              response.map((episode) => episode).forEach((episode) => { // for each episode
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
                    resolve(data)
                  }
                }).catch((error) => MU.error(error))
              })
            }).catch((error) => MU.error(error))
          })
        }).catch((error) => MU.error(error))
      }).catch((error) => MU.error(error))
    })
  }

  /**
   * Returns your people progress
   * @returns {Promise}
   */
  const peopleProgress = () => {
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
   * @param {Object} data Episodes ratings
   * @returns {Array}
   */
  const scatterDatasets = (data) => {
    let datasets = []
    data = data.reduce((data, { season, episode, title, rating, votes }, key) => {
      (data[season - 1] = data[season - 1] || []).push({
        x: key,
        y: rating
      })
      return data
    }, {})
    Object.keys(data).map((season) => season).forEach((key) => {
      (datasets = datasets || []).push({
        label: `Season ${parseFloat(key) + 1}`,
        data: data[key],
        backgroundColor: color(datasets.length)
      })
    })
    return datasets
  }

  /**
   * Add scatter chart html structure to the page
   */
  const addChartStructure = () => {
    const html = `
      <div id="stats">
        <div class="row">
          <div class="col-md-12">
            <h2>
              <span><strong>Stats</strong></span>
            </h2>
            <div style="clear:both;"></div>
            <div class="statsContainer col-md-12">
              <canvas id="episodesRatingsChart"></canvas>
            </div>
            <div style="clear:both;"></div>
          </div>
        </div>
      </div>
    `
    $(html).insertBefore($('#recent-episodes'))
  }

  /**
   * Add progress bar html structure to the page
   */
  const addProgressBarStructure = () => {
    const html = `
      <div id="stats">
        <div class="row">
          <div>
            <h2>
              <span><strong>Stats</strong></span>
            </h2>
            <div style="clear:both;"></div>
            <div class="statsContainer col-lg-8 col-md-7">
              <div id="peopleProgressBar"></div>
            </div>
            <div style="clear:both;"></div>
          </div>
        </div>
      </div>
    `
    $(html).insertBefore($('#credits'))
  }

  /**
   * Add stats to sidebar menu
   * @param {number} child
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
   * @param {Object} data Episodes ratings
   */
  const addScatterChart = (data) => {
    const myChart = new Chart($('#episodesRatingsChart'), { // eslint-disable-line
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
              font: {
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
              font: {
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
            fontSize: 14,
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
   * @param {Object} data People progress
   */
  const addProgressBar = (data) => {
    data.forEach((role) => {
      const progressbar = new ProgressBar.Line('#peopleProgressBar', {
        color: '#ed1c24',
        strokeWidth: 2,
        trailColor: '#530d0d',
        text: {
          style: {
            color: 'inherit',
            margin: '1px 0 5px',
            font: '14px varela round, helvetica neue, Helvetica, Arial, sans-serif'
          }
        }
      })
      progressbar.set(role.progress / 100)
      progressbar.setText(`${role.role}: watched ${role.watched} (${role.progress}%) out of a total of ${role.items} released items.`)
    })
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
    const traktID = id() // Trakt ID
    addChartStructure() // add chart structure
    addToMenu(2) // add stats to the menu
    $('.statsContainer').LoadingOverlay('show', { // show loading
      image: '',
      custom: loading
    })
    episodesRatings(traktID).then((response) => { // get episodes ratings
      $('.statsContainer').LoadingOverlay('hide', true) // hide loading
      addScatterChart(response) // add chart
    }).catch((error) => MU.error(error))
  })
  NodeCreationObserver.onCreation('.people.show', () => { // people page
    addProgressBarStructure() // add progress bar structure
    addToMenu(1) // add stats to the menu
    $('.statsContainer').LoadingOverlay('show', { // show loading
      image: '',
      custom: loading
    })
    peopleProgress().then((response) => { // get people progress
      $('.statsContainer').LoadingOverlay('hide', true) // hide loading
      addProgressBar(response) // add progress bar
    }).catch((error) => MU.error(error))
  })
  NodeCreationObserver.onCreation('.people.show #toast-container .toast.toast-success', () => { // people page
    $('.statsContainer').LoadingOverlay('show', { // show loading
      image: '',
      custom: loading
    })
    removeProgressBar()
    peopleProgress().then((response) => { // get people progress
      $('.statsContainer').LoadingOverlay('hide', true) // hide loading
      addProgressBar(response) // add progress bar
    }).catch((error) => MU.error(error))
  })
})()
