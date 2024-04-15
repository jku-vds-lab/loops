## Setup

Template Version: [b2e180bf60a786990792401ccc5b0350d140e24f](https://github.com/jupyterlab/extension-template/tree/b2e180bf60a786990792401ccc5b0350d140e24f)

```
conda create --name jupyterlab-ext-cookiecutter python=3.9
conda install -c conda-forge "copier>=7,<8" jinja2-time "pyyaml-include<2.0"
mkdir loops-diff
cd loops-diff
copier copy https://github.com/jupyterlab/extension-template .
    🎤 What is your extension kind?
    frontend
    🎤 Extension author name
    Klaus Eckelt
    🎤 Extension author email
    klaus@eckelt.info
    🎤 JavaScript package name
    loops-diff
    🎤 Python package name
    loops-diff
    🎤 Extension short description
    A JupyterLab extension to support iterative and exploratory data analysis in computational notebooks.
    🎤 Does the extension have user settings?
    Yes
    🎤 Do you want to set up Binder example?
    Yes
    🎤 Do you want to set up tests for the extension?
    Yes
    🎤 Git remote repository URL
    https://github.com/jku-vds-lab/loops/
```
