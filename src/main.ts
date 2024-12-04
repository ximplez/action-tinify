import {
  debug,
  endGroup,
  error,
  getInput,
  setFailed,
  startGroup
} from '@actions/core'
import {context} from '@actions/github'
import tinify from 'tinify'
import Git from './git'
import Images from './images'
import {validateKey} from './validate'

async function run(): Promise<void> {
  try {
    startGroup('Validate Keys')
    const keys = JSON.parse(getInput('api_key', {required: true}))
    let v = false
    for (const key of keys) {
      if (validateKey(key)) {
        v = true
        break
      }
    }
    if (!v) {
      throw error('no valid tiny key')
    }
    endGroup()

    const git = new Git({
      token: getInput('github_token', {required: true}),
      context
    })

    startGroup('Collecting affected images')
    const files = await git.getFiles()
    const images = new Images()

    for (const file of files) {
      images.addFile(file.filename)
    }
    endGroup()

    startGroup('Compressing images')
    const compressedImages = []
    const resizeWidth = Number(getInput('resize_width')) || undefined
    const resizeHeight = Number(getInput('resize_height')) || undefined

    for (const image of images) {
      const compressed = await image.compress({
        resizeWidth,
        resizeHeight
      })

      if (compressed) {
        compressedImages.push(image)
      }
    }
    endGroup()

    if (compressedImages.length) {
      startGroup('Committing changes')
      await git.commit({
        files: compressedImages,
        userName: getInput('commit_user_name'),
        userEmail: getInput('commit_user_email'),
        message: getInput('commit_message')
      })
      endGroup()
    }
  } catch (error) {
    setFailed(error instanceof Error ? error.message : String(error))

    if (error instanceof Error && error.stack) {
      debug(error.stack)
    }
  }
}

run()
