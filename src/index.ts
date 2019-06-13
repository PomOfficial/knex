/**
 * @file index
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project knex-core
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */


import {CreatePlugin} from "@pomegranate/plugin-tools";
import {KnexClient} from "./Plugins/KnexClient";
import {KnexDAO} from "./Plugins/KnexDAO";

export const Plugin = CreatePlugin('application')
  .configuration({
    name: 'Knex'
  })
  .applicationPlugins([
    KnexClient,
    KnexDAO
  ])