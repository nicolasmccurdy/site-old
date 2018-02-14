const crypto = require('crypto')
const dotenv = require('dotenv')
const fs = require('fs')
const { flatMap } = require('lodash')
const rest = require('@octokit/rest')
const { promisify } = require('util')
const { safeLoad } = require('js-yaml')

const octokit = rest()
const readFile = promisify(fs.readFile)

dotenv.config()

exports.sourceNodes = async ({ boundActionCreators: { createNode } }) => {
  const projects = await readFile('_data/projects.yml', 'utf8')

  const repos = flatMap(safeLoad(projects), category =>
    category.filter(project => project.github).map(project => project.github)
  )

  octokit.authenticate({
    type: 'token',
    token: process.env.OCTOKIT_ACCESS_TOKEN
  })

  return Promise.all(
    repos.map(async repo => {
      const { data } = await octokit.repos.get({ owner: 'nickmccurdy', repo })

      createNode({
        ...data,
        id: data.id.toString(),
        parent: null,
        children: [],
        internal: {
          type: 'Repository',
          contentDigest: crypto
            .createHash('md5')
            .update(data.toString())
            .digest('hex')
        }
      })
    })
  )
}
