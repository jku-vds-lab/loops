FROM jupyter/scipy-notebook:lab-4.0.2
# See https://jupyter-docker-stacks.readthedocs.io/en/latest/using/selecting.html#jupyter-scipy-notebook
# and https://hub.docker.com/r/jupyter/scipy-notebook/

LABEL maintainer="klaus.eckelt@jku.at"

WORKDIR /loops
COPY ./ ./
COPY ./notebooks /workspaces/loops/notebooks

# Install dependencies
RUN pip install -e .

# Link extension 
RUN jupyter labextension develop . --overwrite

CMD ["jupyter", "lab", "--port=13013", "--no-browser", "--ServerApp.token=''", "--ServerApp.password='loops'", "/workspaces/loops/notebooks/"]