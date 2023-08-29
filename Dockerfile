FROM jupyter/base-notebook:lab-4.0.2
# See https://jupyter-docker-stacks.readthedocs.io/en/latest/using/selecting.html#jupyter-scipy-notebook
# and https://hub.docker.com/r/jupyter/scipy-notebook/

LABEL maintainer="klaus.eckelt@jku.at"

# Setup as root
USER root
WORKDIR /loops

## Extension Setup
# Copy files
COPY --chown=${NB_UID}:${NB_UID} ./ ./
COPY --chown=${NB_UID}:${NB_UID} ./notebooks /workspaces/loops/notebooks
COPY --chown=${NB_UID}:${NB_UID} ./deploy /home/jovyan/.jupyter/

# Install dependencies
RUN pip install -e .

# Link extension 
RUN jupyter labextension develop . --overwrite

# Add packages
RUN pip install pandas seaborn

# Run as user
USER ${NB_UID}

# Start JupyterLab
CMD ["jupyter", "lab", "/workspaces/loops/notebooks/"]