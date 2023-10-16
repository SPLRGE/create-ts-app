import fs from 'node:fs'
import shell from 'shelljs'
import { consola } from 'consola'
import { installDependencies, addDependency } from 'nypm'
import { relative } from 'pathe'
import { downloadTemplate } from 'giget'

const templateUrl = 'github:dev-cetus/typescript-nodejs-template#master'

async function main() {
    consola.info('Welcome to the TypeScript-Node.js project creation assistant!')

    const args = process.argv.slice(2)
    let name = args[0]

    if (!name) {
        name = await consola.prompt('Enter project name: ', { placeholder: 'myapp' })
        if (!name) {
            consola.error('Project name is required. Please try again.')
            return
        }
    }

    const packageManager = await consola.prompt('Choose a package manager: ', { type: 'select', options: ['npm', 'yarn', 'pnpm'] })

    consola.start('Creating your app...')

    /*
    const downloadCommand = shell.which('wget') ? `wget -qO- ${templateUrl} > ${name}.tar.gz` : shell.which('curl') ? `curl -s -L ${templateUrl} > ${name}.tar.gz` : null
    if (!downloadCommand) {
      consola.error('Please install wget or curl')
      return
    }
    shell.exec(downloadCommand, { silent: true })
  
    shell.exec(`tar -xzf ${name}.tar.gz`, { silent: true })
    shell.mv('typescript-nodejs-template-master', `${name}`)
    shell.rm(`${name}.tar.gz`)
  */
    let template

    try {
        template = await downloadTemplate(templateUrl, {
            dir: name
        })
    } catch (error) {
        consola.error(error)
        process.exit(1)
    }

    // Get relative path
    const relativePath = relative(process.cwd(), template.dir)

    const createdPackage = JSON.parse(fs.readFileSync(`${name}/package.json`, 'utf8'))
    createdPackage.name = name
    fs.writeFileSync(`${name}/package.json`, JSON.stringify(createdPackage, null, 2))

    consola.info('Installing dependencies...')

    try {
        await installDependencies({
            cwd: relativePath,
            packageManager: {
                name: packageManager,
                command: packageManager
            }
        })
    } catch (error) {
        consola.error(error)
        process.exit(1)
    }

    if (await consola.prompt('Do you want to use a test framework?', { type: 'confirm' })) {
        const choosedTestFramework = await consola.prompt('Choose a test framework: ', { type: 'select', options: ['jest', 'mocha', 'ava', 'jasmine'] })

        await addDependency(choosedTestFramework, {
            cwd: relativePath,
            packageManager: {
                name: packageManager,
                command: packageManager
            }
        })

        if (['mocha', 'jasmine'].includes(choosedTestFramework)) {
            await addDependency(`@types/${choosedTestFramework}`, {
                cwd: relativePath,
                packageManager: {
                    name: packageManager,
                    command: packageManager
                }
            })
        }
    }

    shell.cd(name)

    if (await consola.prompt('Do you want to initialize a git repository?', { type: 'confirm' })) {
        shell.exec('git init', { silent: true })
        consola.info('Git repository initialized successfully!')
    }

    consola.box(`Your app \`${name}\` has been created successfully!`)
}
main()
