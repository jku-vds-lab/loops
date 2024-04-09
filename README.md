# loops

[![Github Actions Status](https://github.com/jku-vds-lab/loops/workflows/Build/badge.svg)](https://github.com/jku-vds-lab/loops/actions/workflows/build.yml)[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/jku-vds-lab/loops/main?urlpath=lab)

Loops is a JupyterLab extension to support iterative and exploratory data analysis in computational notebooks.

It automatically tracks the notebook's history and visualizes it next to the notebook.
Loops shows the evolution of the notebook over time and highlights differences between versions to reveal the impact of changes made within a notebook.
Loops visualizes differences in code, markdown, tables, visualizations, and images.
For a quick overview of loops, see our preview video on YouTube:

[<img src="https://img.youtube.com/vi/jCUwLm5wfNo/maxresdefault.jpg" width=50% height=50%>](https://www.youtube.com/watch?v=jCUwLm5wfNo)

Learn more about loops by reading the [paper](https://jku-vds-lab.at/publications/2024_loops/).

## Feedback

Your comments and feedback are welcome. Write an email to klaus.eckelt@jku.at and let us know what you think!  
If you have discovered an issue or have a feature suggestion, feel free to [create an issue on GitHub](https://github.com/jku-vds-lab/loops/issues).

## Citing Loops

Klaus Eckelt, Kiran Gadhave, Alexander Lex, Marc Streit
**Loops: Leveraging Provenance and Visualization to Support Exploratory Data Analysis in Notebooks**
OSF Preprint, doi:10.31219/osf.io/79eyn, 2024.

```
@article{2024_loops,
    title = {Loops: Leveraging Provenance and Visualization to Support Exploratory Data Analysis in Notebooks},
    author = {Klaus Eckelt and Kiran Gadhave and Alexander Lex and Marc Streit},
    journal = {OSF Preprint},
    doi = {10.31219/osf.io/79eyn},
    url = {https://doi.org/10.31219/osf.io/79eyn},
    year = {2024}
}
```

---

# Setup Instructions

## Requirements

- JupyterLab >= 4.0.0

## Contributing

There are two ways to set up _loops_ for development:

- with [VS Code devContainers](https://code.visualstudio.com/docs/devcontainers/containers) (recommended), which sets up Jupyter and the dependencies in a container.
- with a local setup, the default way for JupyterLab extension. Works with every code editor.

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
![VS Code command prmpt](https://github.com/jku-vds-lab/loops/assets/10337788/e2f624a0-9238-4d32-856b-7e47c937a496)

By reopening in the container, you will get an environment with Jupyter Lab and the packages from the docker image and it will also install all dependencies of the extension as well as the extension itself. Therefore, this process will take a while when doing it for the first time. You can watch the set up process by opening the log in the terminal. When the extension is installed, the terminal should look similar to this:

![image](https://github.com/jku-vds-lab/loops/assets/10337788/16f8eb34-6f0d-45d1-aa5b-17772feab31a)

All you need to do, is running `jlpm watch` in the VS Code terminal afterwards so that the extension gets updated when you make code changes.  
The terminal can also be used to add further python packages.

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
