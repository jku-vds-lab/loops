FROM jupyter/scipy-notebook:lab-4.0.2
# See https://jupyter-docker-stacks.readthedocs.io/en/latest/using/selecting.html#jupyter-scipy-notebook
# and https://hub.docker.com/r/jupyter/scipy-notebook/

LABEL maintainer="klaus.eckelt@jku.at"


## Enviroment Setup
# Setup as root
USER root
WORKDIR /loops

RUN cat /etc/os-release
#RUN apt-get update --yes && \
#    apt-get install --yes --no-install-recommends nodejs && \
#    apt-get clean && \
#    rm -rf /var/lib/apt/lists/*
#
#RUN pip install --upgrade pip setuptools wheel
#RUN nodejs --version
#RUN npm install --global yarn
#RUN yarn --version


## Extension Setup
# Copy files
COPY --chown=${NB_UID}:${NB_UID} ./ ./
COPY --chown=${NB_UID}:${NB_UID} ./notebooks /workspaces/loops/notebooks
COPY --chown=${NB_UID}:${NB_UID} ./deploy /home/jovyan/.jupyter/

# Install dependencies
RUN pip install -e .

# Link extension 
RUN jupyter labextension develop . --overwrite

# Run as user
USER ${NB_UID}

## Prepare public JupyterLab server
# https://jupyter-server.readthedocs.io/en/latest/operators/public-server.html


CMD ["jupyter", "lab", "/workspaces/loops/notebooks/"]