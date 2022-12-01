FROM jupyter/scipy-notebook:latest

# fix run-p: not found error when runing jlpm watch
# RUN jlpm global add npm-run-all

WORKDIR /loops
COPY --chown=jovyan . .

# install the extension with dependencies
RUN pip install -e .
RUN jupyter labextension develop . --overwrite

# build the extension
# RUN jlpm build

CMD ["jupyter", "lab"]