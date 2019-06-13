/**
 * @file KnexClient
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project knex-core
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

import {CreatePlugin} from "@pomegranate/plugin-tools";
import {isFunction, get} from 'lodash/fp'
import Knex from 'knex'


export const KnexClient = CreatePlugin('anything')
  .directories(['migrations', 'helpers', 'config'])
  .configuration({
    name: 'KnexClient',
    injectableParam: 'Knex',
    depends: ['KnexConfig']
  })
  .hooks({
    load: (KnexConfig) => {
      let Client = Knex(KnexConfig)
      return Client
    },
    stop: (PluginLogger, Knex) => {
      return Knex.destroy()
        .then(() => {
          PluginLogger.log('PG Connection closed')
        })
    }
  })
  .commands(function (Injector, PomConfig, PluginFiles, Handlebars, PluginVariables) {
    function getConnectionConf(argv) {
      let confPath = PluginFiles('config').workingDirectory
      let confFile = require(confPath)
      if (!isFunction(confFile)) {
        throw new Error(`Configuration file ${confPath}/index.js did not export an injectable function.`)
      }
      let confObj = Injector.inject(confFile)
      let migrationConf = get(argv.environment, confObj)
      if (!migrationConf) {
        throw new Error(`No valid configuration found for env ${argv.environment}`)
      }
      return migrationConf
    }

    function getMigrationConf(src = 'workingDirectory'){
      return {
        directory: PluginFiles('migrations')[src]
      }
    }

    return (yargs) => {
      return yargs
        .usage('usage: $0')
        .command({
          command: 'migrate',
          aliases: 'm',
          describe: 'Knex Migrations',
          builder: (yargs) => {
            return yargs
              .option('environment', {
                alias: 'e',
                default: 'development',
                type: 'string'
              })
              .command({
                command: 'create <name>',
                aliases: 'c',
                describe: 'Creates a migration file <name>',
                builder: (yargs) => {
                  return yargs
                    .positional('name', {
                      describe: 'The migration to be created.',
                      type: 'string'
                    })
                },
                handler: (argv) => {
                  let connectionConf = getConnectionConf(argv)
                  let migrationConf = getMigrationConf('projectDirectory')
                  let Client = Knex(connectionConf)
                  Client.migrate.make(argv.name, migrationConf)
                    .then((results) => {
                      console.log(`Created migration file ${results}`)
                      console.log('Run pom a b -c to build the project')
                      console.log('Then run pom p @pomofficial/knexcore m l to apply the migration.')
                      return Client.destroy()
                    })
                }
              })
              .command({
                command: 'up',
                aliases: 'u',
                describe: 'Runs next migration',
                builder: (yargs) => {

                },
                handler: (argv) => {
                  console.log(argv)
                }
              })
              .command({
                command: 'rollback',
                aliases: 'r',
                describe: 'Rolls back migrations',
                builder: (yargs) => {
                  return yargs.option('all', {
                    alias: 'a',
                    default: false,
                    type: 'boolean'
                  })
                },
                handler: (argv) => {
                  let connectionConf = getConnectionConf(argv)
                  let migrationConf = getMigrationConf('workingDirectory')
                  let Client = Knex(connectionConf)
                  Client.migrate.rollback(migrationConf, argv.all)
                    .then((results) => {
                      console.log(results)
                      return Client.destroy()
                    })

                }
              })
              .command({
                command: 'latest',
                aliases: 'l',
                describe: 'Runs all migrations',
                builder: (yargs) => {

                },
                handler: (argv) => {
                  let connectionConf = getConnectionConf(argv)
                  let migrationConf = getMigrationConf('workingDirectory')
                  let Client = Knex(connectionConf)
                  Client.migrate.latest(migrationConf)
                    .then((results) => {
                      console.log(results)
                      return Client.destroy()
                    })

                }
              })
              .help()
          },
          handler: () => {
            yargs.showHelp()
          }
        })
        .help()
    }
  })