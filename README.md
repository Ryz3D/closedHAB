# closedHAB

[![Docker Image CI](https://github.com/Ryz3D/closedhab/actions/workflows/docker-nightly.yml/badge.svg)](https://github.com/Ryz3D/closedhab/actions/workflows/docker-nightly.yml)

### The official competitor for [openHAB](https://github.com/openhab/openhab-distro)

A simple JavaScript service for connecting any Smart Home device. Easily extendable by addons, which may connect a new device or provide a [user interface](https://github.com/Ryz3D/close-frontend).

## Installation

You can run closedHAB easily on Docker by using [the Docker Image](https://hub.docker.com/repository/docker/mircoheitmann/closedhab).
The file structure should look like this by default:
- docker-compose.yml
- setup
  - addon_setup
    - setup*.yml
  - addons
    - *.js

Click on any of the above to find out how to use the files in order to set up and extend closedHAB.
