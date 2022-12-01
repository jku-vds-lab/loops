FROM jupyter/scipy-notebook:latest

WORKDIR /loops
COPY . .

# install the extension with dependencies
RUN pip install -e .
RUN jupyter labextension develop . --overwrite

# build the extension
# RUN jlpm build

CMD ["jupyter", "lab"]