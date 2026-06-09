import babelGenerator from '@babel/generator'
import parser from '@babel/parser'
import globalVue from '@anlacquoc/vite-plugin-global-vue'
import path from 'path'

import autoImportI18n from './replacers/autoImportI18n.js'
import coreImports from './replacers/core.js'
import requireConfirmation from './replacers/requireConfirmation.js'
import showAlert from './replacers/showAlert.js'
import useFetch from './replacers/useFetch.js'

const generate = babelGenerator.default

const moduleAliasRegex = /@\/([a-zA-Z]+)\/(.*)/

const replacers = [
  autoImportI18n,
  coreImports,
  requireConfirmation,
  showAlert,
  useFetch,
]

export default function AppPlugin(moduleName, moduleDir) {
  const rootPath = path.resolve(moduleDir, '../../')

  return [
    globalVue({ rootPath }),
    {
      name: 'vite-plugin-module',
      config: () => ({
        resolve: {
          alias: [
            {
              find: moduleAliasRegex,
              replacement: rootPath + '/modules/$1/resources/js/$2',
            },
          ],
        },
        build: {
          rollupOptions: {
            external: [
              'vuex',
              'vue-i18n',
              'vue-router',
              'core/i18n',
              'core/store',
              'core/route',
              'core/router',
            ],
          },
        },
      }),

      transform(code, id) {
        // Check if the file is a JavaScript or Vue file
        if (!/\.(js|jsx|ts|tsx|vue)$/.test(id)) {
          return
        }

        if (id.includes('node_modules')) {
          return
        }

        const ast = parser.parse(code, {
          sourceType: 'module',
          plugins: ['jsx'],
        })

        let hasChanges = false

        replacers.forEach(replacer => {
          if (replacer(ast)) {
            hasChanges = true
          }
        })

        if (hasChanges) {
          const output = generate(ast, {})

          return output.code
        }
      },
    },
  ]
}
