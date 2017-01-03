#! /usr/bin/env node

var path = require('path')
var fs = require('fs')
var Blessed = require('blessed')
var contrib = require('blessed-contrib')
var sexagesimal = require('sexagesimal')
var chalk = require('chalk')
var countryFilepaths = []

function formatCoordinates (coordinates) {
  var formattedCoordinates = []
  coordinates.forEach(coordinate => {
    var splitted = coordinate.match(/\S+/g)
    splitted[0] += '°'
    splitted[1] += '′'
    splitted.splice(2, 0, '00″')
    formattedCoordinates.push(splitted.join(' '))
  })
  return formattedCoordinates
}

function displayCountry (data) {
  var coordinates = data.coordinates
  var name = data.name
  var intro = data.intro
  map.clearMarkers()
  map.addMarker({ 'lat': coordinates[0], 'lon': coordinates[1], color: 'red', char: 'x' })
  info.setContent(chalk.green(name) + '\n\n' + intro)
  screen.render()
}

function getCountryData (country) {
  try {
    var coordinates = country['Geography']['Geographic coordinates']['text'].split(',')
    var sexagesimalCoordinates = formatCoordinates(coordinates)
    var decimalCoordinates = sexagesimal.pair(sexagesimalCoordinates.join(' '))
    var name = country['Government']['Country name']['conventional short form']['text']
    var intro = country['Introduction']['Background']['text']

    if (!decimalCoordinates || decimalCoordinates.length < 2 || !name || !intro) {
      return null
    }

    return {
      coordinates: decimalCoordinates,
      name: name,
      intro: intro
    }
  } catch (e) {
    return null
  }
}

function displayRandomCountry () {
  do {
    var randomFilepath = countryFilepaths[Math.floor(Math.random() * countryFilepaths.length)]
    var country = require(randomFilepath)
    var data = getCountryData(country)
  } while (!data)
  displayCountry(data)
}

var screen = Blessed.screen({
  smartCSR: true,
  dockBorders: true
})

screen.title = 'Travel Spin'

var grid = new contrib.grid({ rows: 1, cols: 3, screen: screen })
var map = grid.set(0, 0, 1, 2, contrib.map, { label: ' Press [space] for a new destination ' })
var info = grid.set(0, 2, 1, 1, Blessed.text,
  { tags: true, scrollable: true, padding: { top: 0, right: 1, bottom: 0, left: 1 } })

screen.key(['escape', 'q', 'C-c', 'C-d'], function () {
  return process.exit(0)
})

screen.key(['space'], function () {
  displayRandomCountry()
})

fs.readdir(path.join(__dirname, 'factbook'), (err, filepaths) => {
  if (err) {
    throw err
  }

  countryFilepaths = filepaths
    .filter(p => p.endsWith('.json'))
    .map(p => path.join(__dirname, 'factbook', p))

  displayRandomCountry()
})
