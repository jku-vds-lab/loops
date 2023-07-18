# loops

[![Github Actions Status](https://github.com/jku-vds-lab/loops/workflows/Build/badge.svg)](https://github.com/jku-vds-lab/loops/actions/workflows/build.yml)[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/jku-vds-lab/loops/main?urlpath=lab)
A JupyterLab extension to support iterative data analysis.

## Requirements

- JupyterLab >= 4.0.0

## Install

To install the extension, execute:

```bash
pip install loops
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall loops
```

## Contributing

There are two ways to set up _loops_ for development:

- with [VS Code devContainers](https://code.visualstudio.com/docs/devcontainers/containers) (recommended), which sets up Jupyter and the dependencies in a container
- with a local setup, the default way for JupyterLab extension. Works with every Code Editor

### Development in DevContainer

#### Requirements

- [VS Code](https://code.visualstudio.com/)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) for VS Code
- [Docker](https://www.docker.com/products/docker-desktop/)

See the [official Dev Containers Tutorial](https://code.visualstudio.com/docs/devcontainers/tutorial) for more detailed instructions and alternatives.

A [devcontainer.json file](https://code.visualstudio.com/docs/devcontainers/containers) is provided that uses the official [scipy-notebook container](https://jupyter-docker-stacks.readthedocs.io/en/latest/using/selecting.html#jupyter-scipy-notebook) for development (includes JupyterLab, numpy, pandas, matplotlib, seaborn, altair, scikit-learn, and more).

#### Setup

With the above requirements fullfilled, you will see the following popup when opening this project in VS Code:
![VS Code popup](https://user-images.githubusercontent.com/10337788/207567396-660f5e3e-3e0c-4cd6-8fcb-e4cf679860cc.png)

Alternatively, you can also reopen the project in a devcontainer via the command prompt:
![VS Code command prompt](image.png)
By reopening in the container, you will get an environment with Jupyter Lab and the packages from the docker image and it will also install all dependencies of the extension and the extension itself.

All you need to do, is running `jlpm watch` in the VS Code terminal afterwards. The terminal can also be used to add further python packages.

### Local Development

Note: You will need NodeJS to build the extension package.

> Tested with Node 18 and Python 3.9

You also may want to create a virtual environment, i.e.

```bash
python -m venv env
source env/bin/activate

# Install Jupyterlab and any other python packages you want to use
python -m pip install "jupyterlab>=4.0.0"
```

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the loops directory
# Install package in development mode
python -m pip install -e "."
# Link your development version of the extension with JupyterLab
python -m jupyter labextension develop . --overwrite
# Rebuild extension Typescript source after making changes
jlpm build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch
# Run JupyterLab in another terminal
python -m jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
python -m jupyter lab build --minimize=False
```

### Development uninstall

```bash
python -m pip uninstall loops
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `loops` within that folder.

### Testing the extension

#### Frontend tests

This extension is using [Jest](https://jestjs.io/) for JavaScript code testing.

To execute them, execute:

```sh
jlpm
jlpm test
```

#### Integration tests

This extension uses [Playwright](https://playwright.dev/) for the integration tests (aka user level tests).
More precisely, the JupyterLab helper [Galata](https://github.com/jupyterlab/jupyterlab/tree/master/galata) is used to handle testing the extension in JupyterLab.

More information are provided within the [ui-tests](./ui-tests/README.md) README.

### Packaging the extension

See [RELEASE](RELEASE.md)

## Setup

Using template version 4.0.5:

```bash
🎤 What is your extension kind?
   frontend
🎤 Extension author name
   Klaus Eckelt
🎤 Extension author email
   klaus.eckelt@jku.at
🎤 JavaScript package name
   loops
🎤 Python package name
   loops
🎤 Extension short description
   A JupyterLab extension to support iterative data analysis.
🎤 Does the extension have user settings?
   Yes
🎤 Do you want to set up Binder example?
   Yes
🎤 Do you want to set up tests for the extension?
   Yes
🎤 Git remote repository URL
   https://github.com/jku-vds-lab/loops

```
