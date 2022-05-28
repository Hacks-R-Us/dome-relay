# Dome Relay

Relays packets containing a full "segment" of data to the right LED control boards.

One dome = 5 segments.

## Requirements

- Node 16.14 or greater ([nvm](https://github.com/nvm-sh/nvm) is your friend!)
- - After installing, run `corepack enable` to enable yarn

## Setup

- Install required stuff
- Run `yarn`

## Running

- Run `yarn start`

## Configuring

- `dome.json` should be updated when the Dome model is changed.
- `mappings.json` should contain an entry for each control board (this is preconfigured with the right number of boards as of 2022-05-28)
