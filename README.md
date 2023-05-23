# loops

[![Github Actions Status](https://github.com/jku-vds-lab/loops/workflows/Build/badge.svg)](https://github.com/jku-vds-lab/loops/actions/workflows/build.yml)[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/jku-vds-lab/loops/main?urlpath=lab)

A JupyterLab extension to support iterative data analysis.

## Requirements

- JupyterLab >= 3.1

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

### Development inside Container

A [devcontainer.json file](https://code.visualstudio.com/docs/devcontainers/containers) is provided that uses the official [scipy-notebook container](https://jupyter-docker-stacks.readthedocs.io/en/latest/using/selecting.html#jupyter-scipy-notebook) for development.

When opening this project in VS Code, you will see the following prompt:
![image](https://user-images.githubusercontent.com/10337788/207567396-660f5e3e-3e0c-4cd6-8fcb-e4cf679860cc.png)

By reopinening in the container, you will have a python environment with Jupyter Lab and the packages from the docker image and it will also install all dependencies of the extension and install it.
All you need to do, is running the `jlpm watch` task afterwards.

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the loops directory
# Install package in development mode
# This installs all node dependencies in package.json as well
pip install -e .
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Rebuild extension Typescript source after making changes
jlpm build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
pip uninstall loops
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

